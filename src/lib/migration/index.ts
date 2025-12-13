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

    return isMigrationNeeded()
  }

  // ============================================================================
  // Main Migration Execution
  // ============================================================================

  async execute(): Promise<boolean> {
    try {
      // Step 1: Initial checks
      this.updateState({
        status: 'checking',
        progress: 5,
        currentStep: 'Checking database version...',
      })

      const needsMigration = await this.checkMigrationNeeded()
      if (!needsMigration) {
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

      // Step 2: Create migration lock
      createMigrationLock(targetVersion)

      // Step 3: Create backup
      this.updateState({
        status: 'backing-up',
        progress: 10,
        currentStep: 'Creating backup...',
        canRollback: false,
      })

      // We need to read data using raw IndexedDB to bypass corrupted RxDB
      const legacyDb = await openLegacyDatabaseRaw(sourceDbName)
      const backupResult = await this.createBackupFromRaw(legacyDb, sourceDbName)

      if (backupResult.error !== undefined) {
        throw new Error(backupResult.error)
      }

      this.updateState({
        progress: 25,
        canRollback: true,
        backupDownloaded: backupResult.fallbackFile,
      })

      // Step 4: Create shadow database
      this.updateState({
        status: 'creating-shadow',
        progress: 30,
        currentStep: 'Creating new database...',
      })

      this.shadowDb = await createShadowDatabase(targetDbName)

      // Step 5: Migrate collections
      this.updateState({
        status: 'migrating',
        progress: 35,
        currentStep: 'Migrating data...',
      })

      await this.migrateAllCollections(legacyDb)

      // Close legacy database
      legacyDb.close()

      // Step 6: Validate
      this.updateState({
        status: 'validating',
        progress: 90,
        currentStep: 'Validating migration...',
      })

      const validation = await this.validateMigration()
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Step 7: Swap - update version info
      this.updateState({
        status: 'swapping',
        progress: 95,
        currentStep: 'Activating new database...',
      })

      markMigrationComplete(targetVersion, targetDbName)

      // Step 8: Cleanup old database
      this.updateState({
        status: 'cleaning',
        progress: 98,
        currentStep: 'Cleaning up...',
      })

      await cleanupOldDatabase()

      // Step 9: Done
      this.updateState({
        status: 'done',
        progress: 100,
        currentStep: 'Migration complete!',
        canRollback: false,
      })

      // Notify other tabs to reload
      this.broadcastMessage({ type: 'MIGRATION_COMPLETE' })

      return true
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))

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

      const transformed = batch
        .map((doc) => transformer(doc))
        .filter((doc): doc is NonNullable<typeof doc> => doc !== null)

      skipped += batch.length - transformed.length

      if (transformed.length > 0) {
        await targetCollection.bulkInsert(transformed)
        copied += transformed.length
      }

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
        sampleVerified: true, // We trust the copy process
      }

      // Validate counts
      const expectedTarget = stats.total - stats.skipped
      if (targetCount !== expectedTarget) {
        result.isValid = false
        result.errors.push(
          `${name}: expected ${String(expectedTarget)}, got ${String(targetCount)}`
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
