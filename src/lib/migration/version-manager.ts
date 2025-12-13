import {
  type DbVersionInfo,
  type MigrationLock,
  DB_VERSION_KEY,
  MIGRATION_LOCK_KEY,
  CURRENT_SCHEMA_VERSION,
  getLegacyDbName,
  getTargetDbName,
} from './types'

// ============================================================================
// Version Info Management (localStorage)
// ============================================================================

export function getDbVersionInfo(): DbVersionInfo | null {
  try {
    const stored = localStorage.getItem(DB_VERSION_KEY)
    if (stored === null) return null
    return JSON.parse(stored) as DbVersionInfo
  } catch {
    return null
  }
}

export function setDbVersionInfo(info: DbVersionInfo): void {
  localStorage.setItem(DB_VERSION_KEY, JSON.stringify(info))
}

export function clearDbVersionInfo(): void {
  localStorage.removeItem(DB_VERSION_KEY)
}

export function getCurrentDbName(): string {
  const info = getDbVersionInfo()
  if (info === null) {
    // No version info - use current version directly for fresh installs
    // This prevents creating legacy database unnecessarily
    return getTargetDbName(CURRENT_SCHEMA_VERSION)
  }
  return info.dbName
}

export function getCurrentVersion(): number {
  const info = getDbVersionInfo()
  if (info === null) {
    return 0 // Legacy unversioned database
  }
  return info.version
}

// ============================================================================
// Migration Lock Management (localStorage)
// ============================================================================

export function getMigrationLock(): MigrationLock | null {
  try {
    const stored = localStorage.getItem(MIGRATION_LOCK_KEY)
    if (stored === null) return null
    return JSON.parse(stored) as MigrationLock
  } catch {
    return null
  }
}

export function setMigrationLock(lock: MigrationLock): void {
  localStorage.setItem(MIGRATION_LOCK_KEY, JSON.stringify(lock))
}

export function clearMigrationLock(): void {
  localStorage.removeItem(MIGRATION_LOCK_KEY)
}

export function createMigrationLock(targetVersion: number): MigrationLock {
  const lock: MigrationLock = {
    startedAt: new Date().toISOString(),
    targetVersion,
    targetDbName: getTargetDbName(targetVersion),
    status: 'in_progress',
  }
  setMigrationLock(lock)
  return lock
}

export function completeMigrationLock(): void {
  const lock = getMigrationLock()
  if (lock !== null) {
    lock.status = 'completed'
    setMigrationLock(lock)
  }
}

// ============================================================================
// Migration Detection
// ============================================================================

export function isMigrationNeeded(): boolean {
  const info = getDbVersionInfo()
  if (info === null) {
    // No version info - check if legacy database exists
    // This will be determined by trying to access it
    return true // Assume migration needed, will be verified later
  }
  return info.version < CURRENT_SCHEMA_VERSION
}

export function isFreshInstall(): boolean {
  const info = getDbVersionInfo()
  return info === null
}

export function isDowngrade(): boolean {
  const info = getDbVersionInfo()
  if (info === null) return false
  return info.version > CURRENT_SCHEMA_VERSION
}

export async function hasLegacyDatabase(): Promise<boolean> {
  if (typeof indexedDB.databases !== 'function') {
    // Fallback for browsers without databases() method
    return true // Assume it might exist
  }
  const databases = await indexedDB.databases()
  return databases.some((db) => db.name === getLegacyDbName())
}

export async function hasShadowDatabase(dbName: string): Promise<boolean> {
  if (typeof indexedDB.databases !== 'function') {
    return false
  }
  const databases = await indexedDB.databases()
  return databases.some((db) => db.name === dbName)
}

// ============================================================================
// Interrupted Migration Detection
// ============================================================================

export type InterruptedMigrationResult = 'clean' | 'orphan_found' | 'lock_stale'

export async function detectInterruptedMigration(): Promise<InterruptedMigrationResult> {
  const lock = getMigrationLock()

  if (lock === null || lock.status === 'completed') {
    return 'clean'
  }

  // Migration was in progress - check if shadow DB exists
  const shadowExists = await hasShadowDatabase(lock.targetDbName)

  if (shadowExists) {
    // Shadow DB exists but migration didn't complete
    // We'll need to clean it up
    return 'orphan_found'
  }

  // Lock exists but no shadow DB - crash before shadow creation
  // Just clear the stale lock
  return 'lock_stale'
}

// ============================================================================
// Post-Migration Helpers
// ============================================================================

export function markMigrationComplete(targetVersion: number, targetDbName: string): void {
  // Update version info
  setDbVersionInfo({
    version: targetVersion,
    dbName: targetDbName,
    migratedAt: new Date().toISOString(),
    previousDbName: getCurrentDbName(),
  })

  // Mark lock as completed
  completeMigrationLock()
}

export function getPreviousDbName(): string | undefined {
  const info = getDbVersionInfo()
  return info?.previousDbName
}
