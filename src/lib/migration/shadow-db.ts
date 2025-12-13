import type { RxDatabase, RxStorage } from 'rxdb'
import { createRxDatabase } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'

import { logger } from '@/lib/logger'
import { taskSchemaRxDB, type TaskCollection } from '@/lib/schemas/task.schema'
import { thoughtSchema, type ThoughtCollection } from '@/lib/schemas/thought.schema'
import {
  voiceRecordingSchema,
  type VoiceRecordingCollection,
} from '@/lib/schemas/voice-recording.schema'
import { projectSchema, type ProjectCollection } from '@/lib/schemas/project.schema'
import { settingsSchema, type SettingsCollection } from '@/lib/schemas/settings.schema'
import {
  thoughtMigrationStrategies,
  taskMigrationStrategies,
  settingsMigrationStrategies,
} from '@/lib/migration/schema-migrations'

// ============================================================================
// Shadow Database Types
// ============================================================================

export interface ShadowDatabaseCollections {
  tasks: TaskCollection
  thoughts: ThoughtCollection
  voice_recordings: VoiceRecordingCollection
  projects: ProjectCollection
  settings: SettingsCollection
}

export type ShadowDatabase = RxDatabase<ShadowDatabaseCollections>

// ============================================================================
// Storage Helper
// ============================================================================

function getStorage(): RxStorage<unknown, unknown> {
  const dexieStorage = getRxStorageDexie()
  if (import.meta.env.DEV) {
    return wrappedValidateAjvStorage({ storage: dexieStorage })
  }
  return dexieStorage
}

// ============================================================================
// Shadow Database Creation
// ============================================================================

/**
 * Creates a shadow database with the latest schemas.
 * Includes migration strategies in case the DB already exists from a previous failed attempt.
 * Data will be copied from the legacy database via transformers.
 */
export async function createShadowDatabase(dbName: string): Promise<ShadowDatabase> {
  const db = await createRxDatabase<ShadowDatabaseCollections>({
    name: dbName,
    storage: getStorage(),
    ignoreDuplicate: true,
  })

  // Add collections with LATEST schemas and migration strategies
  // Migration strategies are needed in case DB already exists from failed attempt
  await db.addCollections({
    tasks: {
      schema: taskSchemaRxDB,
      migrationStrategies: taskMigrationStrategies,
    },
    thoughts: {
      schema: thoughtSchema,
      migrationStrategies: thoughtMigrationStrategies,
    },
    voice_recordings: {
      schema: voiceRecordingSchema,
    },
    projects: {
      schema: projectSchema,
    },
    settings: {
      schema: settingsSchema,
      migrationStrategies: settingsMigrationStrategies,
    },
  })

  return db
}

// ============================================================================
// Legacy Database Access (Read-Only for Migration)
// ============================================================================

/**
 * Opens the legacy database in a way that bypasses RxDB migrations.
 * Used to read data from the old corrupted database.
 *
 * Note: This uses raw IndexedDB access to avoid triggering RxDB's
 * migration system which is what's corrupted.
 *
 * For RxDB Dexie storage, this returns a "pseudo" database object
 * that holds the dbName for use by getCollectionDocsRaw.
 */
export function openLegacyDatabaseRaw(dbName: string): IDBDatabase {
  // For Dexie storage, we don't actually open a single database here.
  // Instead, we return a minimal object that getCollectionDocsRaw can use.
  // The actual databases are separate per collection: rxdb-dexie-{dbName}--{version}--{collection}
  return { name: dbName } as unknown as IDBDatabase
}

/**
 * Gets all documents from a collection using raw IndexedDB.
 * This is used when RxDB's migration system is corrupted.
 *
 * RxDB Dexie storage creates separate IndexedDB databases for each collection:
 * - Database name pattern: rxdb-dexie-{dbName}--{schemaVersion}--{collectionName}
 * - Object store name: docs
 *
 * This function scans ALL harmonytech Dexie databases (not just the specified one)
 * to ensure we capture data from any failed migrations.
 */
export async function getCollectionDocsRaw(
  db: IDBDatabase,
  collectionName: string
): Promise<Record<string, unknown>[]> {
  const targetDbName = db.name // This is the TARGET db, we want to read from ALL others

  // Find all Dexie databases for this collection across ALL harmonytech databases
  if (typeof indexedDB.databases !== 'function') {
    logger.db.info('[Migration] indexedDB.databases not available')
    return []
  }

  const allDatabases = await indexedDB.databases()
  // Match pattern: rxdb-dexie-harmonytech*--{version}--{collectionName}
  // But exclude the target database we're migrating TO
  const collectionDbPattern = new RegExp(`^rxdb-dexie-harmonytech[^-]*--\\d+--${collectionName}$`)

  logger.db.info(`[Migration] Looking for ${collectionName}, target=${targetDbName}`)
  logger.db.info(
    '[Migration] All DBs:',
    allDatabases.map((d) => d.name)
  )

  const matchingDbs: string[] = []
  for (const d of allDatabases) {
    if (d.name === undefined) continue
    // Match harmonytech Dexie DBs for this collection
    const matches = collectionDbPattern.test(d.name)
    // Exclude target database (don't read from what we're writing to)
    const isTarget = d.name.includes(`rxdb-dexie-${targetDbName}--`)
    logger.db.info(
      `[Migration] ${d.name}: matches=${String(matches)}, isTarget=${String(isTarget)}`
    )
    if (!matches) continue
    if (isTarget) continue

    matchingDbs.push(d.name)
  }

  logger.db.info('[Migration] Matching DBs to read:', matchingDbs)

  if (matchingDbs.length === 0) {
    return []
  }

  // Read from all matching databases and merge (dedupe by id)
  const allDocs = new Map<string, Record<string, unknown>>()

  for (const dexieDbName of matchingDbs) {
    const docs = await readDocsFromDexieDb(dexieDbName)
    logger.db.info(`[Migration] Read ${String(docs.length)} docs from ${dexieDbName}`)
    for (const doc of docs) {
      const id = doc['id'] as string | undefined
      if (id !== undefined) {
        // Later versions override earlier ones
        allDocs.set(id, doc)
      }
    }
  }

  // Filter out deleted documents
  const activeDocs = Array.from(allDocs.values()).filter((doc) => doc['_deleted'] !== true)
  logger.db.info(
    `[Migration] Total active docs for ${collectionName}: ${String(activeDocs.length)}`
  )
  return activeDocs
}

/**
 * Reads all documents from a single RxDB Dexie database.
 */
async function readDocsFromDexieDb(dexieDbName: string): Promise<Record<string, unknown>[]> {
  return new Promise((resolve) => {
    const request = indexedDB.open(dexieDbName)

    request.onerror = (): void => {
      resolve([]) // Continue on error
    }

    request.onsuccess = (): void => {
      const db = request.result
      const storeNames = Array.from(db.objectStoreNames)

      // Dexie stores docs in 'docs' object store
      if (!storeNames.includes('docs')) {
        db.close()
        resolve([])
        return
      }

      const transaction = db.transaction('docs', 'readonly')
      const store = transaction.objectStore('docs')
      const getAllRequest = store.getAll()

      getAllRequest.onerror = (): void => {
        db.close()
        resolve([])
      }

      getAllRequest.onsuccess = (): void => {
        db.close()
        resolve(getAllRequest.result as Record<string, unknown>[])
      }
    }
  })
}

// ============================================================================
// Database Cleanup
// ============================================================================

/**
 * Destroys a shadow database and removes it from IndexedDB.
 */
export async function destroyShadowDatabase(db: ShadowDatabase): Promise<void> {
  await db.remove()
}

/**
 * Deletes a database by name from IndexedDB.
 */
export async function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(dbName)
    request.onsuccess = (): void => {
      resolve()
    }
    request.onerror = (): void => {
      resolve()
    } // Continue even on error
    request.onblocked = (): void => {
      resolve()
    }
  })
}
