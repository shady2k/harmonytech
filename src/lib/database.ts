import type { RxDatabase, RxStorage } from 'rxdb'
import { createRxDatabase, addRxPlugin } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema'
import { RxDBUpdatePlugin } from 'rxdb/plugins/update'
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'

import { taskSchema, type TaskCollection, type TaskDocument } from '@/lib/schemas/task.schema'
import {
  thoughtSchema,
  type ThoughtCollection,
  type ThoughtDocument,
} from '@/lib/schemas/thought.schema'
import {
  voiceRecordingSchema,
  type VoiceRecordingCollection,
  type VoiceRecordingDocument,
} from '@/lib/schemas/voice-recording.schema'
import {
  projectSchema,
  type ProjectCollection,
  type ProjectDocument,
} from '@/lib/schemas/project.schema'
import {
  settingsSchema,
  type SettingsCollection,
  type SettingsDocument,
} from '@/lib/schemas/settings.schema'

// Add plugins
if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin)
}
addRxPlugin(RxDBQueryBuilderPlugin)
addRxPlugin(RxDBMigrationSchemaPlugin)
addRxPlugin(RxDBUpdatePlugin)
addRxPlugin(RxDBLeaderElectionPlugin)

// Get storage with validation in dev mode
function getStorage(): RxStorage<unknown, unknown> {
  const dexieStorage = getRxStorageDexie()
  if (import.meta.env.DEV) {
    return wrappedValidateAjvStorage({ storage: dexieStorage })
  }
  return dexieStorage
}

export interface DatabaseCollections {
  tasks: TaskCollection
  thoughts: ThoughtCollection
  voice_recordings: VoiceRecordingCollection
  projects: ProjectCollection
  settings: SettingsCollection
}

export type HarmonyTechDatabase = RxDatabase<DatabaseCollections>

let dbPromise: Promise<HarmonyTechDatabase> | null = null

export async function getDatabase(): Promise<HarmonyTechDatabase> {
  dbPromise ??= createDatabase()
  return dbPromise
}

async function createDatabase(): Promise<HarmonyTechDatabase> {
  const db = await createRxDatabase<DatabaseCollections>({
    name: 'harmonytech',
    storage: getStorage(),
    ignoreDuplicate: true,
  })

  // Add collections with schemas
  await db.addCollections({
    tasks: {
      schema: taskSchema,
    },
    thoughts: {
      schema: thoughtSchema,
    },
    voice_recordings: {
      schema: voiceRecordingSchema,
    },
    projects: {
      schema: projectSchema,
    },
    settings: {
      schema: settingsSchema,
    },
  })

  return db
}

// Helper functions for common database operations
export async function initializeSettings(db: HarmonyTechDatabase): Promise<void> {
  try {
    const existingSettings = await db.settings.findOne('user-settings').exec()
    if (!existingSettings) {
      await db.settings.insert({
        id: 'user-settings',
        theme: 'system',
        defaultContext: 'anywhere',
        defaultEnergy: 'medium',
      })
    }
  } catch {
    throw new Error('Settings initialization failed')
  }
}

// Export types for use elsewhere
export type {
  TaskDocument,
  TaskCollection,
  ThoughtDocument,
  ThoughtCollection,
  VoiceRecordingDocument,
  VoiceRecordingCollection,
  ProjectDocument,
  ProjectCollection,
  SettingsDocument,
  SettingsCollection,
}
