import type { RxDatabase, RxStorage } from 'rxdb'
import { createRxDatabase } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'

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
 */
export async function openLegacyDatabaseRaw(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName)
    request.onerror = (): void => {
      reject(new Error(`Failed to open database: ${dbName}`))
    }
    request.onsuccess = (): void => {
      resolve(request.result)
    }
  })
}

/**
 * Gets all documents from a collection using raw IndexedDB.
 * This is used when RxDB's migration system is corrupted.
 */
export async function getCollectionDocsRaw(
  db: IDBDatabase,
  collectionName: string
): Promise<Record<string, unknown>[]> {
  // RxDB stores documents in object stores named like: {collectionName}-{schemaVersion}-documents
  // We need to find the correct object store
  const storeNames = Array.from(db.objectStoreNames)
  const docStore = storeNames.find(
    (name) => name.startsWith(`${collectionName}-`) && name.endsWith('-documents')
  )

  if (docStore === undefined) {
    // Collection doesn't exist or has no documents
    return []
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(docStore, 'readonly')
    const store = transaction.objectStore(docStore)
    const request = store.getAll()

    request.onerror = (): void => {
      reject(new Error(`Failed to read ${collectionName}`))
    }
    request.onsuccess = (): void => {
      const docs = request.result as Record<string, unknown>[]
      // Filter out deleted documents
      const activeDocs = docs.filter((doc) => doc['_deleted'] !== true)
      resolve(activeDocs)
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
