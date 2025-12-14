import type * as Y from 'yjs'
import { db, type HarmonyDatabase, type Task, type Thought, type Project } from '../dexie-database'
import { getYDoc, getTasksMap, getThoughtsMap, getProjectsMap, initSyncProvider } from './core'

type SyncableDocument = Task | Thought | Project

interface SyncBridgeConfig {
  enabled: boolean
}

type CleanupFunction = () => void

let syncCleanupFunctions: CleanupFunction[] = []
let isSyncInitialized = false

/**
 * Setup two-way sync between a Dexie table and a Yjs Map
 */
function setupTableSync(
  tableName: 'tasks' | 'thoughts' | 'projects',
  yMap: Y.Map<unknown>
): CleanupFunction {
  const cleanupFunctions: CleanupFunction[] = []

  // Track if we're currently applying changes to prevent loops
  let isApplyingFromYjs = false
  let isApplyingFromDexie = false

  // 1. Sync existing Dexie data to Yjs on initialization
  const initSync = async (): Promise<void> => {
    const docs = await db[tableName].toArray()
    const yDoc = getYDoc()

    yDoc.transact(() => {
      for (const doc of docs) {
        const existing = yMap.get(doc.id) as SyncableDocument | undefined

        // Only update if Yjs doesn't have this doc or Dexie version is newer
        if (existing === undefined || existing.updatedAt < doc.updatedAt) {
          yMap.set(doc.id, doc)
        }
      }
    })
  }

  // 2. Listen to Dexie changes using hooks and sync to Yjs
  const createHook = (primKey: string, obj: SyncableDocument): void => {
    if (isApplyingFromYjs) return
    isApplyingFromDexie = true
    try {
      const existing = yMap.get(primKey) as SyncableDocument | undefined
      if (existing === undefined || existing.updatedAt <= obj.updatedAt) {
        yMap.set(primKey, obj)
      }
    } finally {
      isApplyingFromDexie = false
    }
  }

  const updateHook = (
    _modifications: Partial<SyncableDocument>,
    primKey: string,
    obj: SyncableDocument
  ): void => {
    if (isApplyingFromYjs) return
    isApplyingFromDexie = true
    try {
      const existing = yMap.get(primKey) as SyncableDocument | undefined
      if (existing === undefined || existing.updatedAt <= obj.updatedAt) {
        yMap.set(primKey, obj)
      }
    } finally {
      isApplyingFromDexie = false
    }
  }

  const deleteHook = (primKey: string): void => {
    if (isApplyingFromYjs) return
    isApplyingFromDexie = true
    try {
      yMap.delete(primKey)
    } finally {
      isApplyingFromDexie = false
    }
  }

  // Subscribe to Dexie hooks
  db[tableName].hook('creating', createHook as never)
  db[tableName].hook('updating', updateHook as never)
  db[tableName].hook('deleting', deleteHook as never)

  cleanupFunctions.push(() => {
    db[tableName].hook('creating').unsubscribe(createHook as never)
    db[tableName].hook('updating').unsubscribe(updateHook as never)
    db[tableName].hook('deleting').unsubscribe(deleteHook as never)
  })

  // 3. Listen to Yjs changes and sync to Dexie
  const yjsObserver = (event: Y.YMapEvent<unknown>): void => {
    if (isApplyingFromDexie) return

    isApplyingFromYjs = true

    const applyChanges = async (): Promise<void> => {
      try {
        for (const [key, change] of event.changes.keys) {
          if (change.action === 'delete') {
            // Document was deleted in Yjs
            const existing = await db[tableName].get(key)
            if (existing !== undefined) {
              await db[tableName].delete(key)
            }
          } else {
            // Document was added or updated in Yjs (action is 'add' or 'update')
            const yjsData = yMap.get(key) as SyncableDocument | undefined
            if (yjsData === undefined) continue

            const existing = await db[tableName].get(key)

            if (existing === undefined) {
              // Insert new document
              await db[tableName].add(yjsData as never)
            } else {
              // Update existing document if Yjs version is newer
              if (yjsData.updatedAt > existing.updatedAt) {
                await db[tableName].put(yjsData as never)
              }
            }
          }
        }
      } catch {
        // Sync errors are recoverable - just continue
      } finally {
        isApplyingFromYjs = false
      }
    }

    void applyChanges()
  }

  yMap.observe(yjsObserver)
  cleanupFunctions.push(() => {
    yMap.unobserve(yjsObserver)
  })

  // Run initial sync
  void initSync()

  // Return cleanup function
  return () => {
    for (const cleanup of cleanupFunctions) {
      cleanup()
    }
  }
}

/**
 * Initialize sync bridge between Dexie and Yjs
 */
export function initSyncBridge(_db: HarmonyDatabase, config: SyncBridgeConfig): void {
  if (!config.enabled) return
  if (isSyncInitialized) return

  // Initialize the WebRTC provider (reads space credentials from localStorage)
  initSyncProvider()

  // Setup sync for each table
  const tasksCleanup = setupTableSync('tasks', getTasksMap())
  syncCleanupFunctions.push(tasksCleanup)

  const thoughtsCleanup = setupTableSync('thoughts', getThoughtsMap())
  syncCleanupFunctions.push(thoughtsCleanup)

  const projectsCleanup = setupTableSync('projects', getProjectsMap())
  syncCleanupFunctions.push(projectsCleanup)

  isSyncInitialized = true
}

/**
 * Cleanup all sync subscriptions
 */
export function cleanupSyncBridge(): void {
  for (const cleanup of syncCleanupFunctions) {
    cleanup()
  }
  syncCleanupFunctions = []
  isSyncInitialized = false
}

/**
 * Check if sync bridge is initialized
 */
export function isSyncBridgeInitialized(): boolean {
  return isSyncInitialized
}
