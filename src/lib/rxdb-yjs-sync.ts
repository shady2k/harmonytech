import type { RxCollection, RxDocument } from 'rxdb'
import type * as Y from 'yjs'
import type { HarmonyTechDatabase } from './database'
import { getYDoc, getTasksMap, getThoughtsMap, getProjectsMap, initSyncProvider } from './sync'
import type { Task } from '@/types/task'
import type { Thought } from '@/types/thought'
import type { Project } from '@/types/project'

type SyncableDocument = Task | Thought | Project

interface SyncBridgeConfig {
  enabled: boolean
  roomName?: string
  password?: string
}

type CleanupFunction = () => void

let syncCleanupFunctions: CleanupFunction[] = []
let isSyncInitialized = false

/**
 * Convert RxDB document to plain object for Yjs
 */
function documentToPlainObject<T extends SyncableDocument>(doc: RxDocument<T>): T {
  const data = doc.toJSON() as T
  return data
}

/**
 * Setup two-way sync between an RxDB collection and a Yjs Map
 */
function setupCollectionSync<T extends SyncableDocument>(
  collection: RxCollection<T>,
  yMap: Y.Map<unknown>
): CleanupFunction {
  const subscriptions: CleanupFunction[] = []

  // Track if we're currently applying changes to prevent loops
  let isApplyingFromYjs = false
  let isApplyingFromRxDB = false

  // 1. Sync existing RxDB data to Yjs on initialization
  const initSync = async (): Promise<void> => {
    const docs = await collection.find().exec()
    const yDoc = getYDoc()

    yDoc.transact(() => {
      for (const doc of docs) {
        const data = documentToPlainObject(doc)
        const existing = yMap.get(data.id) as T | undefined

        // Only update if Yjs doesn't have this doc or RxDB version is newer
        if (existing === undefined || existing.updatedAt < data.updatedAt) {
          yMap.set(data.id, data)
        }
      }
    })
  }

  // 2. Listen to RxDB changes and sync to Yjs
  const rxdbSubscription = collection.$.subscribe((changeEvent) => {
    if (isApplyingFromYjs) return

    isApplyingFromRxDB = true

    try {
      const doc = changeEvent.documentData as T

      if (changeEvent.operation === 'DELETE') {
        yMap.delete(doc.id)
      } else {
        // INSERT or UPDATE
        const existing = yMap.get(doc.id) as T | undefined

        // Only update if our version is newer
        if (existing === undefined || existing.updatedAt <= doc.updatedAt) {
          yMap.set(doc.id, doc)
        }
      }
    } finally {
      isApplyingFromRxDB = false
    }
  })

  subscriptions.push(() => {
    rxdbSubscription.unsubscribe()
  })

  // 3. Listen to Yjs changes and sync to RxDB
  const yjsObserver = (event: Y.YMapEvent<unknown>): void => {
    if (isApplyingFromRxDB) return

    isApplyingFromYjs = true

    const applyChanges = async (): Promise<void> => {
      try {
        for (const [key, change] of event.changes.keys) {
          if (change.action === 'delete') {
            // Document was deleted in Yjs
            const existingDoc = await collection.findOne(key).exec()
            if (existingDoc !== null) {
              await existingDoc.remove()
            }
          } else {
            // Document was added or updated in Yjs (action is 'add' or 'update')
            const yjsData = yMap.get(key) as T | undefined
            if (yjsData === undefined) continue

            const existingDoc = await collection.findOne(key).exec()

            if (existingDoc === null) {
              // Insert new document
              await collection.insert(yjsData)
            } else {
              // Update existing document if Yjs version is newer
              const existingData = documentToPlainObject(existingDoc)
              if (yjsData.updatedAt > existingData.updatedAt) {
                await existingDoc.patch(yjsData)
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
  subscriptions.push(() => {
    yMap.unobserve(yjsObserver)
  })

  // Run initial sync
  void initSync()

  // Return cleanup function
  return () => {
    for (const cleanup of subscriptions) {
      cleanup()
    }
  }
}

/**
 * Initialize sync bridge between RxDB and Yjs
 */
export function initSyncBridge(db: HarmonyTechDatabase, config: SyncBridgeConfig): void {
  if (!config.enabled) return
  if (isSyncInitialized) return

  // Initialize the WebRTC provider
  initSyncProvider({
    roomName: config.roomName,
    password: config.password,
  })

  // Setup sync for each collection
  const tasksCleanup = setupCollectionSync<Task>(
    db.tasks as unknown as RxCollection<Task>,
    getTasksMap()
  )
  syncCleanupFunctions.push(tasksCleanup)

  const thoughtsCleanup = setupCollectionSync<Thought>(
    db.thoughts as unknown as RxCollection<Thought>,
    getThoughtsMap()
  )
  syncCleanupFunctions.push(thoughtsCleanup)

  const projectsCleanup = setupCollectionSync<Project>(
    db.projects as unknown as RxCollection<Project>,
    getProjectsMap()
  )
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
