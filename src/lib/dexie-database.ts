/**
 * Dexie Database - Single source of truth for IndexedDB
 *
 * Types are imported from Zod schemas in src/types/schemas/
 * Migrations are defined in src/lib/db-migrations.ts
 */
import Dexie, { type EntityTable } from 'dexie'
import type { Task } from '@/types/task'
import type { Thought } from '@/types/thought'
import type { Settings } from '@/types/settings'
import type { Project } from '@/types/project'
import type { VoiceRecording } from '@/types/voice-recording'
import { getDeviceId } from '@/lib/sync'
import { registerMigrations } from '@/lib/db-migrations'

// Default settings created once when database is first created
export const DEFAULT_SETTINGS: Settings = {
  id: 'user-settings',
  theme: 'system',
  defaultContext: 'computer',
  defaultEnergy: 'medium',
  updatedAt: new Date().toISOString(),
}

export class HarmonyDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  thoughts!: EntityTable<Thought, 'id'>
  settings!: EntityTable<Settings, 'id'>
  projects!: EntityTable<Project, 'id'>
  voiceRecordings!: EntityTable<VoiceRecording, 'id'>

  constructor() {
    super('harmonytech')

    // Register all migrations from dedicated file
    registerMigrations(this, { getDeviceId })

    // Seed default settings when database is first created (runs exactly once)
    this.on('populate', () => {
      void this.settings.add(DEFAULT_SETTINGS)
    })
  }
}

// Singleton database instance
export const db = new HarmonyDatabase()

// Re-export types for convenience
export type { Task, Thought, Settings, Project, VoiceRecording }
