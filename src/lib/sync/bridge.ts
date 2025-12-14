import type * as Y from 'yjs'
import { createLogger } from '@/lib/logger'
import {
  db,
  type HarmonyDatabase,
  type Task,
  type Thought,
  type Project,
  type Settings,
} from '../dexie-database'
import {
  getYDoc,
  getTasksMap,
  getThoughtsMap,
  getProjectsMap,
  getSettingsMap,
  initSyncProvider,
} from './core'

const log = createLogger('SyncBridge')

type SyncableDocument = Task | Thought | Project | Settings

interface SyncBridgeConfig {
  enabled: boolean
}

type CleanupFunction = () => void

let syncCleanupFunctions: CleanupFunction[] = []
let isSyncInitialized = false

/**
 * Get updatedAt as comparable string from document, defaulting to empty string
 */
function getUpdatedAt(doc: SyncableDocument | undefined): string {
  if (doc === undefined) return ''
  return doc.updatedAt ?? ''
}

/**
 * Setup two-way sync between a Dexie table and a Yjs Map
 */

function setupTableSync(
  tableName: 'tasks' | 'thoughts' | 'projects' | 'settings',
  yMap: Y.Map<unknown>
): CleanupFunction {
  log.info(`[${tableName}] Setting up sync`)

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
        const existingTime = getUpdatedAt(existing)
        const localTime = getUpdatedAt(doc)

        // Only update if Yjs doesn't have this doc or Dexie version is newer
        if (existing === undefined || existingTime < localTime) {
          log.debug(`[${tableName}] initSync: pushing local to Yjs`, {
            id: doc.id,
            existingTime,
            localTime,
          })
          yMap.set(doc.id, doc)
        } else {
          log.debug(`[${tableName}] initSync: keeping Yjs version`, {
            id: doc.id,
            existingTime,
            localTime,
          })
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
      const existingTime = getUpdatedAt(existing)
      const localTime = getUpdatedAt(obj)

      log.debug(`[${tableName}] createHook: syncing to Yjs`, {
        id: primKey,
        existingTime,
        localTime,
      })

      if (existing === undefined || existingTime <= localTime) {
        yMap.set(primKey, obj)
      }
    } finally {
      isApplyingFromDexie = false
    }
  }

  const updateHook = (
    modifications: Partial<SyncableDocument>,
    primKey: string,
    obj: SyncableDocument
  ): void => {
    if (isApplyingFromYjs) return
    isApplyingFromDexie = true
    try {
      // Merge modifications with original object to get the updated version
      const updatedObj = { ...obj, ...modifications } as SyncableDocument
      const existing = yMap.get(primKey) as SyncableDocument | undefined
      const existingTime = getUpdatedAt(existing)
      const updatedTime = getUpdatedAt(updatedObj)

      log.debug(`[${tableName}] updateHook: syncing to Yjs`, {
        id: primKey,
        existingTime,
        updatedTime,
      })

      if (existing === undefined || existingTime <= updatedTime) {
        yMap.set(primKey, updatedObj)
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
  log.debug(`[${tableName}] Registering Dexie hooks`)
  db[tableName].hook('creating', createHook as never)
  db[tableName].hook('updating', updateHook as never)
  db[tableName].hook('deleting', deleteHook as never)
  log.debug(`[${tableName}] Dexie hooks registered`)

  cleanupFunctions.push(() => {
    db[tableName].hook('creating').unsubscribe(createHook as never)
    db[tableName].hook('updating').unsubscribe(updateHook as never)
    db[tableName].hook('deleting').unsubscribe(deleteHook as never)
  })

  // 3. Listen to Yjs changes and sync to Dexie
  const yjsObserver = (event: Y.YMapEvent<unknown>): void => {
    if (isApplyingFromDexie) {
      log.debug(`[${tableName}] yjsObserver: skipping (applying from Dexie)`)
      return
    }

    isApplyingFromYjs = true

    const applyChanges = async (): Promise<void> => {
      try {
        for (const [key, change] of event.changes.keys) {
          if (change.action === 'delete') {
            // Document was deleted in Yjs
            const existing = await db[tableName].get(key)
            if (existing !== undefined) {
              log.debug(`[${tableName}] yjsObserver: deleting`, { id: key })
              await db[tableName].delete(key)
            }
          } else {
            // Document was added or updated in Yjs (action is 'add' or 'update')
            const yjsData = yMap.get(key) as SyncableDocument | undefined
            if (yjsData === undefined) continue

            const existing = await db[tableName].get(key)
            const yjsTime = getUpdatedAt(yjsData)
            const localTime = getUpdatedAt(existing)

            if (existing === undefined) {
              // Insert new document
              log.debug(`[${tableName}] yjsObserver: inserting new`, { id: key, yjsTime })
              await db[tableName].add(yjsData as never)
            } else {
              // Update existing document if Yjs version is newer
              if (yjsTime > localTime) {
                log.debug(`[${tableName}] yjsObserver: updating (Yjs newer)`, {
                  id: key,
                  yjsTime,
                  localTime,
                })
                await db[tableName].put(yjsData as never)
              } else {
                log.debug(`[${tableName}] yjsObserver: keeping local (local newer or equal)`, {
                  id: key,
                  yjsTime,
                  localTime,
                })
              }
            }
          }
        }
      } catch (err) {
        log.error(`[${tableName}] yjsObserver error:`, err)
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
  log.info('initSyncBridge called', {
    enabled: config.enabled,
    alreadyInitialized: isSyncInitialized,
  })

  if (!config.enabled) return
  if (isSyncInitialized) return

  // Initialize the WebRTC provider (reads space credentials from localStorage)
  initSyncProvider()

  // Setup sync for each table
  log.info('Setting up table sync for all tables')

  const tasksCleanup = setupTableSync('tasks', getTasksMap())
  syncCleanupFunctions.push(tasksCleanup)

  const thoughtsCleanup = setupTableSync('thoughts', getThoughtsMap())
  syncCleanupFunctions.push(thoughtsCleanup)

  const projectsCleanup = setupTableSync('projects', getProjectsMap())
  syncCleanupFunctions.push(projectsCleanup)

  const settingsCleanup = setupTableSync('settings', getSettingsMap())
  syncCleanupFunctions.push(settingsCleanup)

  isSyncInitialized = true
  log.info('Sync bridge initialized successfully')
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
