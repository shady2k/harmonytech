import type { RxCollection } from 'rxdb'
import { type BackupRecord, BACKUP_DB_NAME } from './types'
import type { HarmonyTechDatabase } from '@/lib/database'

// ============================================================================
// Backup Database (Raw IndexedDB - avoids Dexie version conflicts)
// ============================================================================

const BACKUP_STORE_NAME = 'backups'
const BACKUP_DB_VERSION = 1

function openBackupDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKUP_DB_NAME, BACKUP_DB_VERSION)

    request.onerror = (): void => {
      reject(new Error('Failed to open backup database'))
    }

    request.onsuccess = (): void => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event): void => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        const store = db.createObjectStore(BACKUP_STORE_NAME, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
}

// ============================================================================
// Export Collection Helper
// ============================================================================

async function exportCollection<T>(collection: RxCollection<T>): Promise<T[]> {
  const docs = await collection.find().exec()
  return docs.map((doc) => {
    const json = doc.toJSON() as Record<string, unknown>
    // Strip RxDB internal fields for backup
    delete json['_rev']
    delete json['_attachments']
    delete json['_deleted']
    delete json['_meta']
    return json as T
  })
}

// ============================================================================
// Backup Creation
// ============================================================================

export async function createBackup(
  db: HarmonyTechDatabase,
  version: number,
  dbName: string
): Promise<string> {
  const backup: BackupRecord = {
    id: `backup-${String(Date.now())}`,
    version,
    dbName,
    createdAt: new Date().toISOString(),
    collections: {
      tasks: await exportCollection(db.tasks),
      thoughts: await exportCollection(db.thoughts),
      voice_recordings: await exportCollection(db.voice_recordings),
      projects: await exportCollection(db.projects),
      settings: await exportCollection(db.settings),
    },
  }

  const backupDb = await openBackupDb()
  return new Promise((resolve, reject) => {
    const transaction = backupDb.transaction(BACKUP_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(BACKUP_STORE_NAME)
    const request = store.add(backup)

    request.onsuccess = (): void => {
      backupDb.close()
      resolve(backup.id)
    }

    request.onerror = (): void => {
      backupDb.close()
      reject(new Error('Failed to save backup'))
    }
  })
}

// ============================================================================
// Quota Check and Backup with Fallback
// ============================================================================

export interface BackupResult {
  backupId: string | null
  fallbackFile: boolean
  error?: string
}

export async function createBackupWithFallback(
  db: HarmonyTechDatabase,
  version: number,
  dbName: string
): Promise<BackupResult> {
  try {
    // Check available storage quota
    const estimate = await navigator.storage.estimate()
    const available = estimate.quota !== undefined ? estimate.quota - (estimate.usage ?? 0) : 0
    const currentUsage = estimate.usage ?? 0

    // If less than 2x current usage available, might run out of space
    if (currentUsage * 2 > available && available < 50 * 1024 * 1024) {
      // Less than 50MB available and tight on space
      throw new Error('QUOTA_LIKELY_EXCEEDED')
    }

    const backupId = await createBackup(db, version, dbName)
    return { backupId, fallbackFile: false }
  } catch (error) {
    // Quota exceeded or other error - fall back to file download
    const errorMessage = error instanceof Error ? error.message : String(error)

    try {
      const backupData = await exportToJson(db, version, dbName)
      downloadBackupAsFile(backupData)
      return { backupId: null, fallbackFile: true }
    } catch {
      return {
        backupId: null,
        fallbackFile: false,
        error: `Backup failed: ${errorMessage}`,
      }
    }
  }
}

// ============================================================================
// Export to JSON (for file download)
// ============================================================================

export async function exportToJson(
  db: HarmonyTechDatabase,
  version: number,
  dbName: string
): Promise<BackupRecord> {
  return {
    id: `backup-${String(Date.now())}`,
    version,
    dbName,
    createdAt: new Date().toISOString(),
    collections: {
      tasks: await exportCollection(db.tasks),
      thoughts: await exportCollection(db.thoughts),
      voice_recordings: await exportCollection(db.voice_recordings),
      projects: await exportCollection(db.projects),
      settings: await exportCollection(db.settings),
    },
  }
}

// ============================================================================
// File Download
// ============================================================================

export function downloadBackupAsFile(backup: BackupRecord): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `harmonytech-backup-${backup.createdAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}

// ============================================================================
// Backup Retrieval
// ============================================================================

export async function getBackup(id: string): Promise<BackupRecord | null> {
  const backupDb = await openBackupDb()
  return new Promise((resolve) => {
    const transaction = backupDb.transaction(BACKUP_STORE_NAME, 'readonly')
    const store = transaction.objectStore(BACKUP_STORE_NAME)
    const request = store.get(id)

    request.onsuccess = (): void => {
      backupDb.close()
      const result = request.result as BackupRecord | undefined
      resolve(result ?? null)
    }

    request.onerror = (): void => {
      backupDb.close()
      resolve(null)
    }
  })
}

export async function getLatestBackup(): Promise<BackupRecord | null> {
  const backupDb = await openBackupDb()
  return new Promise((resolve) => {
    const transaction = backupDb.transaction(BACKUP_STORE_NAME, 'readonly')
    const store = transaction.objectStore(BACKUP_STORE_NAME)
    const index = store.index('createdAt')
    const request = index.openCursor(null, 'prev')

    request.onsuccess = (): void => {
      const cursor = request.result
      backupDb.close()
      resolve(cursor !== null ? (cursor.value as BackupRecord) : null)
    }

    request.onerror = (): void => {
      backupDb.close()
      resolve(null)
    }
  })
}

export async function listBackups(): Promise<BackupRecord[]> {
  const backupDb = await openBackupDb()
  return new Promise((resolve) => {
    const transaction = backupDb.transaction(BACKUP_STORE_NAME, 'readonly')
    const store = transaction.objectStore(BACKUP_STORE_NAME)
    const index = store.index('createdAt')
    const request = index.openCursor(null, 'prev')
    const backups: BackupRecord[] = []

    request.onsuccess = (): void => {
      const cursor = request.result
      if (cursor !== null) {
        backups.push(cursor.value as BackupRecord)
        cursor.continue()
      } else {
        backupDb.close()
        resolve(backups)
      }
    }

    request.onerror = (): void => {
      backupDb.close()
      resolve([])
    }
  })
}

// ============================================================================
// Backup Deletion
// ============================================================================

export async function deleteBackup(id: string): Promise<void> {
  const backupDb = await openBackupDb()
  return new Promise((resolve) => {
    const transaction = backupDb.transaction(BACKUP_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(BACKUP_STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = (): void => {
      backupDb.close()
      resolve()
    }

    request.onerror = (): void => {
      backupDb.close()
      resolve()
    }
  })
}

export async function deleteOldBackups(keepCount = 3): Promise<void> {
  const backups = await listBackups()
  if (backups.length <= keepCount) return

  const toDelete = backups.slice(keepCount)
  await Promise.all(toDelete.map((b) => deleteBackup(b.id)))
}

// ============================================================================
// Restore from Backup (for future use)
// ============================================================================

export async function restoreFromBackup(
  targetDb: HarmonyTechDatabase,
  backup: BackupRecord
): Promise<void> {
  // Clear existing data
  const collections = ['tasks', 'thoughts', 'voice_recordings', 'projects', 'settings'] as const

  for (const name of collections) {
    const existingDocs = await targetDb[name].find().exec()
    const ids = existingDocs.map((d) => d.id)
    if (ids.length > 0) {
      await targetDb[name].bulkRemove(ids)
    }
  }

  // Restore from backup
  const backupCollections = backup.collections

  if (backupCollections.tasks.length > 0) {
    await targetDb.tasks.bulkInsert(backupCollections.tasks)
  }
  if (backupCollections.thoughts.length > 0) {
    await targetDb.thoughts.bulkInsert(backupCollections.thoughts)
  }
  if (backupCollections.voice_recordings.length > 0) {
    await targetDb.voice_recordings.bulkInsert(backupCollections.voice_recordings)
  }
  if (backupCollections.projects.length > 0) {
    await targetDb.projects.bulkInsert(backupCollections.projects)
  }
  if (backupCollections.settings.length > 0) {
    await targetDb.settings.bulkInsert(backupCollections.settings)
  }
}
