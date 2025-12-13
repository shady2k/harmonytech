import { DB_NAME_PREFIX, BACKUP_DB_NAME } from './types'
import {
  getMigrationLock,
  clearMigrationLock,
  getDbVersionInfo,
  getPreviousDbName,
} from './version-manager'
import { deleteDatabase } from './shadow-db'
import { logger } from '@/lib/logger'

// ============================================================================
// Orphan Detection
// ============================================================================

export interface OrphanDetectionResult {
  hasOrphans: boolean
  orphanedDatabases: string[]
  staleLock: boolean
}

/**
 * Detects orphaned shadow databases from interrupted migrations.
 * Should be called on app startup BEFORE any RxDB initialization.
 */
export async function detectOrphanedDatabases(): Promise<OrphanDetectionResult> {
  const result: OrphanDetectionResult = {
    hasOrphans: false,
    orphanedDatabases: [],
    staleLock: false,
  }

  // Check for stale migration lock
  const lock = getMigrationLock()
  if (lock !== null && lock.status === 'in_progress') {
    result.staleLock = true
  }

  // Get all IndexedDB databases
  if (typeof indexedDB.databases !== 'function') {
    return result // Can't detect without this API
  }

  const databases = await indexedDB.databases()
  const currentDbName = getDbVersionInfo()?.dbName

  // Find orphaned shadow databases
  // Pattern: harmonytech_v{N} that aren't the current active DB
  for (const db of databases) {
    if (db.name === undefined) continue

    const isHarmonyDb = db.name.startsWith(DB_NAME_PREFIX)
    const isBackupDb = db.name === BACKUP_DB_NAME
    const isCurrentDb = db.name === currentDbName
    const isLegacyDb = db.name === DB_NAME_PREFIX

    if (isHarmonyDb && !isBackupDb && !isCurrentDb && !isLegacyDb) {
      // This is a shadow database that's not the current one
      // It's likely an orphan from a failed migration
      result.orphanedDatabases.push(db.name)
      result.hasOrphans = true
    }
  }

  return result
}

// ============================================================================
// Orphan Cleanup
// ============================================================================

/**
 * Cleans up orphaned shadow databases.
 * Should be called after detectOrphanedDatabases() if orphans are found.
 */
export async function cleanupOrphanedDatabases(orphans: string[]): Promise<void> {
  logger.db.info('[Cleanup] cleanupOrphanedDatabases called with:', orphans)
  for (const dbName of orphans) {
    logger.db.info('[Cleanup] Deleting orphan database:', dbName)
    await deleteDatabase(dbName)
  }

  // Also clear stale migration lock if present
  const lock = getMigrationLock()
  if (lock !== null && lock.status === 'in_progress') {
    logger.db.info('[Cleanup] Clearing stale migration lock')
    clearMigrationLock()
  }
}

// ============================================================================
// Post-Migration Cleanup
// ============================================================================

/**
 * Cleans up the old database after successful migration.
 * Called after validation passes and the app is using the new DB.
 */
export async function cleanupOldDatabase(): Promise<void> {
  const previousDbName = getPreviousDbName()
  logger.db.info('[Cleanup] cleanupOldDatabase called, previousDbName:', previousDbName)

  if (previousDbName === undefined) {
    logger.db.info('[Cleanup] No previous DB name, nothing to clean up')
    return // Nothing to clean up
  }

  // Delete the old database
  logger.db.info('[Cleanup] Deleting old database:', previousDbName)
  await deleteDatabase(previousDbName)

  // Also clean up any RxDB internal databases for the old name
  // Patterns to match:
  // - Legacy: {previousDbName}-{version}-{collection}
  // - Dexie: rxdb-dexie-{previousDbName}--{version}--{collection}
  if (typeof indexedDB.databases === 'function') {
    const databases = await indexedDB.databases()
    logger.db.info('[Cleanup] Scanning for internal DBs to clean, pattern:', previousDbName)
    for (const db of databases) {
      if (db.name === undefined) continue

      const isLegacyInternal = db.name.startsWith(`${previousDbName}-`)
      const isDexieInternal = db.name.startsWith(`rxdb-dexie-${previousDbName}--`)

      if (isLegacyInternal || isDexieInternal) {
        logger.db.info('[Cleanup] Deleting internal DB:', db.name)
        await deleteDatabase(db.name)
      }
    }
  }
  logger.db.info('[Cleanup] cleanupOldDatabase complete')
}

// ============================================================================
// Full Cleanup (Development/Testing)
// ============================================================================

/**
 * Cleans up ALL HarmonyTech databases including backups.
 * Only use for development or when user explicitly requests full reset.
 */
export async function cleanupAllDatabases(): Promise<void> {
  if (typeof indexedDB.databases !== 'function') {
    // Fallback: try to delete known database names
    await deleteDatabase(DB_NAME_PREFIX)
    await deleteDatabase(BACKUP_DB_NAME)
    return
  }

  const databases = await indexedDB.databases()
  for (const db of databases) {
    if (db.name === undefined) continue

    const isHarmonyDb =
      db.name.startsWith(DB_NAME_PREFIX) || db.name === BACKUP_DB_NAME || db.name.includes('rxdb')

    if (isHarmonyDb) {
      await deleteDatabase(db.name)
    }
  }

  // Clear all migration-related localStorage
  clearMigrationLock()
  localStorage.removeItem('harmonytech_db_version')
}

// ============================================================================
// Database Listing (Debugging)
// ============================================================================

export interface DatabaseInfo {
  name: string
  isActive: boolean
  isBackup: boolean
  isLegacy: boolean
  isOrphan: boolean
}

/**
 * Lists all HarmonyTech-related databases with their status.
 * Useful for debugging.
 */
export async function listAllDatabases(): Promise<DatabaseInfo[]> {
  if (typeof indexedDB.databases !== 'function') {
    return []
  }

  const databases = await indexedDB.databases()
  const currentDbName = getDbVersionInfo()?.dbName
  const result: DatabaseInfo[] = []

  for (const db of databases) {
    if (db.name === undefined) continue

    const isHarmonyDb = db.name.startsWith(DB_NAME_PREFIX) || db.name === BACKUP_DB_NAME

    if (isHarmonyDb) {
      result.push({
        name: db.name,
        isActive: db.name === currentDbName,
        isBackup: db.name === BACKUP_DB_NAME,
        isLegacy: db.name === DB_NAME_PREFIX,
        isOrphan:
          db.name !== currentDbName &&
          db.name !== BACKUP_DB_NAME &&
          db.name !== DB_NAME_PREFIX &&
          db.name.startsWith(DB_NAME_PREFIX),
      })
    }
  }

  return result
}
