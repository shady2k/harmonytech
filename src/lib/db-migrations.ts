/**
 * Dexie Database Migrations
 *
 * Each migration defines:
 * - version: The Dexie version number (must be strictly increasing)
 * - stores: Schema changes for this version (merged with previous)
 * - upgrade: Optional data migration function
 *
 * Rules:
 * - Never edit shipped migrations, always add a new version
 * - Use tx.table() in upgrades, not db.table()
 * - Keep schema changes and data backfills together
 */

import type Dexie from 'dexie'
import type { Transaction } from 'dexie'
import type { VoiceRecording } from '@/types/voice-recording'

type StoresSchema = Record<string, string>

interface Migration {
  version: number
  stores: StoresSchema
  upgrade?: (tx: Transaction, ctx: MigrationContext) => Promise<void>
}

interface MigrationContext {
  getDeviceId: () => string
}

/**
 * Version 1: Initial schema
 */
const v1Initial: Migration = {
  version: 1,
  stores: {
    tasks: 'id, createdAt, isCompleted, context, energy',
    thoughts: 'id, createdAt, aiProcessed, processingStatus',
    settings: 'id',
    projects: 'id, name, isActive, createdAt',
    voiceRecordings: 'id, createdAt',
  },
}

/**
 * Version 2: Add voice recording status and device tracking
 *
 * - Added status index for background processing queue
 * - Added createdByDeviceId to track which device created the recording
 * - Backfill existing recordings with current device ID
 */
const v2VoiceRecordingIndexes: Migration = {
  version: 2,
  stores: {
    voiceRecordings: 'id, status, createdByDeviceId, createdAt',
  },
  upgrade: async (tx, ctx) => {
    const deviceId = ctx.getDeviceId()
    await tx
      .table<VoiceRecording>('voiceRecordings')
      .toCollection()
      .modify((recording: Partial<VoiceRecording> & { createdByDeviceId?: string }) => {
        if (recording.createdByDeviceId === undefined || recording.createdByDeviceId === '') {
          recording.createdByDeviceId = deviceId
        }
      })
  },
}

/**
 * All migrations in order
 */
export const migrations: readonly Migration[] = [v1Initial, v2VoiceRecordingIndexes]

/**
 * Register all migrations with a Dexie database instance
 */
export function registerMigrations(db: Dexie, ctx: MigrationContext): void {
  // Validate migrations are in order
  for (let i = 1; i < migrations.length; i++) {
    if (migrations[i].version <= migrations[i - 1].version) {
      throw new Error('Migrations must have strictly increasing version numbers')
    }
  }

  // Build cumulative schema and register each version
  let cumulativeSchema: StoresSchema = {}

  for (const migration of migrations) {
    // Merge this migration's stores into cumulative schema
    cumulativeSchema = { ...cumulativeSchema, ...migration.stores }

    // Register version with merged schema
    const version = db.version(migration.version).stores(cumulativeSchema)

    // Add upgrade function if present
    const { upgrade } = migration
    if (upgrade !== undefined) {
      version.upgrade((tx) => upgrade(tx, ctx))
    }
  }
}
