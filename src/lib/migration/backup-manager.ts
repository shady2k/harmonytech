import Dexie, { type Table } from 'dexie'
import type { RxCollection } from 'rxdb'
import { type BackupRecord, BACKUP_DB_NAME } from './types'
import type { HarmonyTechDatabase } from '@/lib/database'

// ============================================================================
// Backup Database (Dexie - separate from RxDB)
// ============================================================================

class BackupDatabase extends Dexie {
  backups!: Table<BackupRecord, string>

  constructor() {
    super(BACKUP_DB_NAME)
    this.version(1).stores({
      backups: 'id, version, createdAt',
    })
  }
}

let backupDb: BackupDatabase | null = null

function getBackupDb(): BackupDatabase {
  backupDb ??= new BackupDatabase()
  return backupDb
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

  await getBackupDb().backups.add(backup)
  return backup.id
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
  const backup = await getBackupDb().backups.get(id)
  return backup ?? null
}

export async function getLatestBackup(): Promise<BackupRecord | null> {
  const backups = await getBackupDb().backups.orderBy('createdAt').reverse().first()
  return backups ?? null
}

export async function listBackups(): Promise<BackupRecord[]> {
  return getBackupDb().backups.orderBy('createdAt').reverse().toArray()
}

// ============================================================================
// Backup Deletion
// ============================================================================

export async function deleteBackup(id: string): Promise<void> {
  await getBackupDb().backups.delete(id)
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
