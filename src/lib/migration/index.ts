import type { RxCollection } from 'rxdb'
import {
  type MigrationState,
  type MigrationStats,
  type ValidationResult,
  type CollectionValidation,
  type MigrationMessage,
  INITIAL_MIGRATION_STATE,
  CURRENT_SCHEMA_VERSION,
  BATCH_SIZE,
  COLLECTION_NAMES,
  MIGRATION_CHANNEL_NAME,
  getTargetDbName,
} from './types'
import {
  isMigrationNeeded,
  isFreshInstall,
  hasLegacyDatabase,
  createMigrationLock,
  markMigrationComplete,
  clearMigrationLock,
  getCurrentDbName,
  getCurrentVersion,
} from './version-manager'
import { downloadBackupAsFile, getLatestBackup } from './backup-manager'
import {
  createShadowDatabase,
  openLegacyDatabaseRaw,
  getCollectionDocsRaw,
  destroyShadowDatabase,
  deleteDatabase,
  type ShadowDatabase,
} from './shadow-db'
import { createTransformers } from './data-transformer'
import { cleanupOrphanedDatabases, detectOrphanedDatabases, cleanupOldDatabase } from './cleanup'
import { logger } from '@/lib/logger'

// ============================================================================
// Global migration lock (survives HMR and StrictMode)
// ============================================================================

declare global {
  interface Window {
    __harmonytech_migration_promise?: Promise<boolean>
    __harmonytech_migration_check_result?: boolean | Promise<boolean>
  }
}

// ============================================================================
// Migration Orchestrator
// ============================================================================

export class MigrationOrchestrator {
  private state: MigrationState = { ...INITIAL_MIGRATION_STATE }
  private listeners = new Set<(state: MigrationState) => void>()
  private shadowDb: ShadowDatabase | null = null
  private migrationStats = new Map<string, MigrationStats>()
  private channel: BroadcastChannel | null = null
  private forceMigration = false

  constructor() {
    // Set up BroadcastChannel for multi-tab coordination
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(MIGRATION_CHANNEL_NAME)
    }
  }

  // ============================================================================
  // State Management
  // ============================================================================

  getState(): MigrationState {
    return { ...this.state }
  }

  subscribe(listener: (state: MigrationState) => void): () => void {
    this.listeners.add(listener)
    listener(this.state) // Immediately notify with current state
    return () => {
      this.listeners.delete(listener)
    }
  }

  private updateState(partial: Partial<MigrationState>): void {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((l) => {
      l(this.state)
    })

    // Broadcast progress to other tabs
    if (this.channel !== null && partial.progress !== undefined) {
      const message: MigrationMessage = {
        type: 'MIGRATION_PROGRESS',
        progress: this.state.progress,
        step: this.state.currentStep,
      }
      this.channel.postMessage(message)
    }
  }

  // ============================================================================
  // Pre-Migration Checks
  // ============================================================================

  /**
   * Force the next migration check to return true.
   * Used when DB errors indicate stale version metadata.
   */
  setForceMigration(force: boolean): void {
    this.forceMigration = force
  }

  async checkMigrationNeeded(): Promise<boolean> {
    // Return cached result if available (survives HMR and StrictMode)
    const cached = window.__harmonytech_migration_check_result
    if (cached !== undefined) {
      // If it's a boolean, return it directly
      if (typeof cached === 'boolean') {
        logger.db.info('Returning cached migration check result:', cached)
        return cached
      }
      // It's a promise - await it
      logger.db.info('Awaiting in-progress migration check')
      return await cached
    }

    // Set a promise immediately so concurrent callers await the same result
    const promise = this.checkMigrationNeededInternal()
    window.__harmonytech_migration_check_result = promise

    try {
      const result = await promise
      // Replace promise with actual result
      window.__harmonytech_migration_check_result = result
      return result
    } catch (error) {
      // Clear cache on error so it can be retried
      window.__harmonytech_migration_check_result = undefined
      throw error
    }
  }

  private async checkMigrationNeededInternal(): Promise<boolean> {
    logger.db.info('=== checkMigrationNeeded START ===')

    // If force flag is set (e.g., from DB6/DM4 error recovery), always migrate
    if (this.forceMigration) {
      logger.db.info('Force migration flag set, proceeding with migration')
      return true
    }

    // First, check for orphaned databases from interrupted migrations
    const orphanResult = await detectOrphanedDatabases()
    if (orphanResult.hasOrphans || orphanResult.staleLock) {
      await cleanupOrphanedDatabases(orphanResult.orphanedDatabases)
    }

    // Check if this is a fresh install
    if (isFreshInstall()) {
      const hasLegacy = await hasLegacyDatabase()
      if (!hasLegacy) {
        return false // Fresh install, no migration needed
      }
    }

    // Check for failed migration: old Dexie databases have data that needs to be merged
    const hasOldData = await this.checkOldDatabasesHaveData()
    if (hasOldData) {
      logger.db.info('Old databases have data, migration needed to merge')
      return true
    }

    return isMigrationNeeded()
  }

  /**
   * Checks if any old Dexie databases have data that should be migrated.
   * This detects failed migrations where data wasn't copied.
   */
  private async checkOldDatabasesHaveData(): Promise<boolean> {
    if (typeof indexedDB.databases !== 'function') {
      logger.db.info('indexedDB.databases not available')
      return false
    }

    const currentDbName = getCurrentDbName()
    const allDatabases = await indexedDB.databases()
    logger.db.info('Checking for old data, currentDbName:', currentDbName)
    logger.db.info(
      'All databases:',
      allDatabases.map((d) => d.name)
    )

    // Look for Dexie databases that are NOT for the current DB
    // Pattern: rxdb-dexie-{dbName}--{version}--{collection}
    for (const db of allDatabases) {
      if (db.name === undefined) continue

      // Check if this is a Dexie DB for a different (older) database
      const isDexieDb = db.name.startsWith('rxdb-dexie-')
      const isCurrentDb = db.name.includes(`rxdb-dexie-${currentDbName}--`)

      if (isDexieDb && !isCurrentDb) {
        // Found an old Dexie database - check if it has data
        logger.db.info('Checking old DB for data:', db.name)
        const hasData = await this.checkDexieDbHasData(db.name)
        logger.db.info('Has data:', hasData)
        if (hasData) {
          return true
        }
      }
    }

    logger.db.info('No old data found')
    return false
  }

  /**
   * Checks if a specific Dexie database has any documents.
   */
  private async checkDexieDbHasData(dbName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const request = indexedDB.open(dbName)
      request.onerror = (): void => {
        resolve(false)
      }
      request.onsuccess = (): void => {
        const db = request.result
        const storeNames = Array.from(db.objectStoreNames)

        if (!storeNames.includes('docs')) {
          db.close()
          resolve(false)
          return
        }

        const transaction = db.transaction('docs', 'readonly')
        const store = transaction.objectStore('docs')
        const countRequest = store.count()

        countRequest.onerror = (): void => {
          db.close()
          resolve(false)
        }
        countRequest.onsuccess = (): void => {
          db.close()
          resolve(countRequest.result > 0)
        }
      }
    })
  }

  // ============================================================================
  // Main Migration Execution
  // ============================================================================

  async execute(): Promise<boolean> {
    // Prevent concurrent execution (survives HMR and StrictMode via window global)
    const existingPromise = window.__harmonytech_migration_promise
    if (existingPromise !== undefined) {
      logger.db.info('=== execute(): Migration already in progress, returning existing promise ===')
      return existingPromise
    }

    logger.db.info('=== execute(): Starting NEW migration execution ===')
    const promise = this.executeInternal()
    window.__harmonytech_migration_promise = promise

    try {
      const result = await promise
      logger.db.info('=== execute(): Migration completed with result:', result, '===')
      return result
    } catch (error) {
      logger.db.error('=== execute(): Migration FAILED ===', error)
      throw error
    }
  }

  private async executeInternal(): Promise<boolean> {
    try {
      logger.db.info('>>> executeInternal: Step 1 - Initial checks')
      // Step 1: Initial checks
      this.updateState({
        status: 'checking',
        progress: 5,
        currentStep: 'Checking database version...',
      })

      const needsMigration = await this.checkMigrationNeeded()
      if (!needsMigration) {
        logger.db.info('>>> executeInternal: No migration needed, returning early')
        this.updateState({
          status: 'done',
          progress: 100,
          currentStep: 'No migration needed',
        })
        return true
      }

      // Notify other tabs that migration is starting
      this.broadcastMessage({ type: 'MIGRATION_STARTED' })

      const sourceDbName = getCurrentDbName()
      const targetVersion = CURRENT_SCHEMA_VERSION
      const targetDbName = getTargetDbName(targetVersion)
      logger.db.info('>>> executeInternal: source=', sourceDbName, 'target=', targetDbName)

      // Step 2: Create migration lock
      logger.db.info('>>> executeInternal: Step 2 - Create migration lock')
      createMigrationLock(targetVersion)

      // Step 3: Create backup
      logger.db.info('>>> executeInternal: Step 3 - Create backup')
      this.updateState({
        status: 'backing-up',
        progress: 10,
        currentStep: 'Creating backup...',
        canRollback: false,
      })

      // We need to read data using raw IndexedDB to bypass corrupted RxDB
      // Pass targetDbName so getCollectionDocsRaw knows what to EXCLUDE (reads from all OTHERS)
      const legacyDb = openLegacyDatabaseRaw(targetDbName)
      const backupResult = await this.createBackupFromRaw(legacyDb, sourceDbName)

      if (backupResult.error !== undefined) {
        throw new Error(backupResult.error)
      }
      logger.db.info('>>> executeInternal: Backup complete')

      this.updateState({
        progress: 25,
        canRollback: true,
        backupDownloaded: backupResult.fallbackFile,
      })

      // Step 4: Create shadow database
      logger.db.info('>>> executeInternal: Step 4 - Create shadow database')
      this.updateState({
        status: 'creating-shadow',
        progress: 30,
        currentStep: 'Creating new database...',
      })

      this.shadowDb = await createShadowDatabase(targetDbName)
      logger.db.info('>>> executeInternal: Shadow DB created')

      // Step 5: Migrate collections
      logger.db.info('>>> executeInternal: Step 5 - Migrate collections')
      this.updateState({
        status: 'migrating',
        progress: 35,
        currentStep: 'Migrating data...',
      })

      await this.migrateAllCollections(legacyDb)
      logger.db.info('>>> executeInternal: Migration complete')

      // Close legacy database (may be pseudo-db for Dexie, so handle gracefully)
      if (typeof legacyDb.close === 'function') {
        legacyDb.close()
      }

      // Step 6: Validate
      logger.db.info('>>> executeInternal: Step 6 - Validate')
      this.updateState({
        status: 'validating',
        progress: 90,
        currentStep: 'Validating migration...',
      })

      const validation = await this.validateMigration()
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }
      logger.db.info('>>> executeInternal: Validation passed')

      // Step 7: Swap - update version info
      logger.db.info('>>> executeInternal: Step 7 - Swap')
      this.updateState({
        status: 'swapping',
        progress: 95,
        currentStep: 'Activating new database...',
      })

      markMigrationComplete(targetVersion, targetDbName)
      logger.db.info('>>> executeInternal: Version info updated')

      // Step 8: Cleanup old database
      logger.db.info('>>> executeInternal: Step 8 - Cleanup old database')
      this.updateState({
        status: 'cleaning',
        progress: 98,
        currentStep: 'Cleaning up...',
      })

      await cleanupOldDatabase()
      logger.db.info('>>> executeInternal: Cleanup complete')

      // Step 9: Done
      logger.db.info('>>> executeInternal: Step 9 - DONE')
      this.updateState({
        status: 'done',
        progress: 100,
        currentStep: 'Migration complete!',
        canRollback: false,
      })

      // Notify other tabs to reload
      this.broadcastMessage({ type: 'MIGRATION_COMPLETE' })

      logger.db.info('>>> executeInternal: Migration SUCCESS, returning true')
      return true
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      logger.db.error('>>> executeInternal: CAUGHT ERROR:', errorObj.message)

      this.updateState({
        status: 'error',
        error: errorObj,
        currentStep: 'Migration failed',
      })

      // Notify other tabs of failure
      this.broadcastMessage({
        type: 'MIGRATION_FAILED',
        error: errorObj.message,
      })

      return false
    }
  }

  // ============================================================================
  // Backup Creation from Raw IndexedDB
  // ============================================================================

  private async createBackupFromRaw(
    legacyDb: IDBDatabase,
    dbName: string
  ): Promise<{ backupId: string | null; fallbackFile: boolean; error?: string }> {
    try {
      // Read all collections using raw IndexedDB
      const collections = {
        tasks: await getCollectionDocsRaw(legacyDb, 'tasks'),
        thoughts: await getCollectionDocsRaw(legacyDb, 'thoughts'),
        voice_recordings: await getCollectionDocsRaw(legacyDb, 'voice_recordings'),
        projects: await getCollectionDocsRaw(legacyDb, 'projects'),
        settings: await getCollectionDocsRaw(legacyDb, 'settings'),
      }

      // Create backup record
      const backup = {
        id: `backup-${String(Date.now())}`,
        version: getCurrentVersion(),
        dbName,
        createdAt: new Date().toISOString(),
        collections,
      }

      // Always download backup as file for safety
      downloadBackupAsFile(backup as never)
      return { backupId: backup.id, fallbackFile: true }
    } catch (error) {
      return {
        backupId: null,
        fallbackFile: false,
        error: `Backup failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  // ============================================================================
  // Collection Migration
  // ============================================================================

  private async migrateAllCollections(legacyDb: IDBDatabase): Promise<void> {
    if (this.shadowDb === null) {
      throw new Error('Shadow database not initialized')
    }

    const transformers = createTransformers()
    const progressPerCollection = 55 / COLLECTION_NAMES.length // 35% to 90%

    for (let i = 0; i < COLLECTION_NAMES.length; i++) {
      const name = COLLECTION_NAMES[i]
      const baseProgress = 35 + i * progressPerCollection

      this.updateState({
        currentStep: `Migrating ${name}...`,
        currentCollection: name,
        progress: Math.round(baseProgress),
      })

      // Get target collection - use type assertion since we know the names match

      const targetCollection = this.shadowDb[name] as RxCollection

      const stats = await this.migrateCollection(
        legacyDb,
        name,
        targetCollection,
        transformers[name],
        (copied, total, skipped) => {
          const collectionProgress = total > 0 ? copied / total : 1
          this.updateState({
            itemsCopied: copied,
            itemsTotal: total,
            itemsSkipped: skipped,
            progress: Math.round(baseProgress + collectionProgress * progressPerCollection),
          })
        }
      )

      this.migrationStats.set(name, stats)
    }
  }

  private async migrateCollection(
    legacyDb: IDBDatabase,
    collectionName: string,

    targetCollection: RxCollection,
    transformer: (doc: Record<string, unknown>) => Record<string, unknown> | null,
    onProgress: (copied: number, total: number, skipped: number) => void
  ): Promise<MigrationStats> {
    // Read all docs from legacy database using raw IndexedDB
    const sourceDocs = await getCollectionDocsRaw(legacyDb, collectionName)
    const total = sourceDocs.length
    let copied = 0
    let skipped = 0

    // Process in batches
    for (let i = 0; i < sourceDocs.length; i += BATCH_SIZE) {
      const batch = sourceDocs.slice(i, i + BATCH_SIZE)

      const transformed: Record<string, unknown>[] = batch
        .map((doc) => transformer(doc))
        .filter((doc): doc is Record<string, unknown> => doc !== null)

      // Idempotent insert - skip records that already exist
      for (const doc of transformed) {
        const id = doc['id'] as string
        const exists = (await targetCollection.findOne(id).exec()) !== null
        if (!exists) {
          await targetCollection.insert(doc)
          copied++
        } else {
          skipped++
        }
      }

      // Also count docs that failed transformation
      skipped += batch.length - transformed.length

      onProgress(copied, total, skipped)

      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    return { copied, skipped, total }
  }

  // ============================================================================
  // Validation
  // ============================================================================

  private async validateMigration(): Promise<ValidationResult> {
    if (this.shadowDb === null) {
      return { isValid: false, collections: [], errors: ['Shadow database not initialized'] }
    }

    const result: ValidationResult = {
      isValid: true,
      collections: [],
      errors: [],
    }

    for (const name of COLLECTION_NAMES) {
      const stats = this.migrationStats.get(name) ?? { copied: 0, skipped: 0, total: 0 }
      const targetCount = await this.shadowDb[name].count().exec()

      const validation: CollectionValidation = {
        name,
        sourceCount: stats.total,
        targetCount,
        skipped: stats.skipped,
        sampleVerified: true,
      }

      // Idempotent validation: target should have at least the docs we copied this run
      if (targetCount < stats.copied) {
        result.isValid = false
        result.errors.push(
          `${name}: copied ${String(stats.copied)} but target only has ${String(targetCount)}`
        )
        validation.sampleVerified = false
      }

      // If source had data but we copied nothing AND target is empty, something went wrong
      // (stats.skipped includes "already exists" which is fine, but if target is empty that's bad)
      if (stats.total > 0 && stats.copied === 0 && targetCount === 0) {
        result.isValid = false
        result.errors.push(
          `${name}: source had ${String(stats.total)} docs but nothing was copied and target is empty`
        )
        validation.sampleVerified = false
      }

      result.collections.push(validation)
    }

    return result
  }

  // ============================================================================
  // Rollback
  // ============================================================================

  async rollback(): Promise<void> {
    if (!this.state.canRollback) {
      throw new Error('Rollback not available')
    }

    // Destroy shadow database if created
    if (this.shadowDb !== null) {
      const dbName = this.shadowDb.name
      await destroyShadowDatabase(this.shadowDb)
      await deleteDatabase(dbName)
      this.shadowDb = null
    }

    // Clear migration lock
    clearMigrationLock()

    this.updateState({
      ...INITIAL_MIGRATION_STATE,
      currentStep: 'Rolled back to previous state',
    })
  }

  // ============================================================================
  // Backup Download
  // ============================================================================

  async downloadBackup(): Promise<void> {
    const backup = await getLatestBackup()
    if (backup !== null) {
      downloadBackupAsFile(backup)
      this.updateState({ backupDownloaded: true })
    }
  }

  // ============================================================================
  // Multi-Tab Messaging
  // ============================================================================

  private broadcastMessage(message: MigrationMessage): void {
    if (this.channel !== null) {
      this.channel.postMessage(message)
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    this.listeners.clear()
    if (this.channel !== null) {
      this.channel.close()
      this.channel = null
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let orchestratorInstance: MigrationOrchestrator | null = null

export function getMigrationOrchestrator(): MigrationOrchestrator {
  orchestratorInstance ??= new MigrationOrchestrator()
  return orchestratorInstance
}

// ============================================================================
// Re-exports
// ============================================================================

export {
  isMigrationNeeded,
  isFreshInstall,
  hasLegacyDatabase,
  getCurrentDbName,
  detectInterruptedMigration,
} from './version-manager'

export { detectOrphanedDatabases, cleanupOrphanedDatabases, cleanupAllDatabases } from './cleanup'

export type { MigrationState, ValidationResult } from './types'
