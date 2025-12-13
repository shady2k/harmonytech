import type { MigrationStrategies } from 'rxdb'
import type { Thought } from '@/types/thought'
import type { Task } from '@/types/task'
import type { Settings } from '@/types/settings'
import { logger } from '@/lib/logger'

/**
 * Migration strategies for Thought collection.
 * Version 0 -> 1: Add processingStatus field based on aiProcessed value.
 * Version 1 -> 2: Schema constraint fix (added maxLength to processingStatus for index).
 */
export const thoughtMigrationStrategies: MigrationStrategies = {
  1: function (oldDoc: Thought & { aiProcessed: boolean }): Thought {
    logger.db.info('Migrating thought to v1:', oldDoc.id)
    return {
      ...oldDoc,
      processingStatus: oldDoc.aiProcessed ? 'processed' : 'unprocessed',
    }
  },
  2: function (oldDoc: Thought): Thought {
    // No-op migration - schema constraint change only, data unchanged
    return oldDoc
  },
}

/**
 * Migration strategies for Task collection.
 * Version 0 -> 1: Add classificationStatus field, default to 'classified' for existing tasks.
 * Version 1 -> 2: Schema structure fix (indexes, required fields) - no data changes needed.
 */
export const taskMigrationStrategies: MigrationStrategies = {
  1: function (oldDoc: Task): Task {
    logger.db.info('Migrating task to v1:', oldDoc.id)
    return {
      ...oldDoc,
      classificationStatus: 'classified',
    }
  },
  2: function (oldDoc: Task): Task {
    // Schema structure changed (indexes, required fields) but data format is compatible
    logger.db.info('Migrating task to v2:', oldDoc.id)
    return oldDoc
  },
}

/**
 * Old settings document type (v0) - may have RxDB internal fields
 */
type SettingsV0WithInternal = Settings & {
  _deleted?: boolean
  _rev?: string
  _meta?: { lwt: number }
  _attachments?: Record<string, unknown>
}

/**
 * Migration strategies for Settings collection.
 * Version 0 -> 1: Add aiEnabled and aiConfidenceThreshold fields.
 * - aiEnabled: derived from whether API keys are configured
 * - aiConfidenceThreshold: sensible default
 */
export const settingsMigrationStrategies: MigrationStrategies = {
  1: function (oldDoc: SettingsV0WithInternal): Settings {
    logger.db.info('Migrating settings to v1:', oldDoc.id)

    // Derive aiEnabled from existing configuration
    // If user had API keys set, they were using AI
    const hasApiKey = Boolean(oldDoc.openRouterApiKey) || Boolean(oldDoc.yandexApiKey)

    // RxDB migrations must preserve internal fields and add new fields
    // Old docs may be missing _deleted field - ensure it exists
    return {
      ...oldDoc,
      // Ensure _deleted exists (required by RxDB internal schema)
      _deleted: oldDoc._deleted ?? false,
      // New fields with derived/default values
      aiEnabled: oldDoc.aiEnabled ?? hasApiKey,
      aiConfidenceThreshold: oldDoc.aiConfidenceThreshold ?? 0.7,
    } as Settings
  },
}
