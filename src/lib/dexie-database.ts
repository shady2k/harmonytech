/**
 * Dexie Database - Single source of truth for IndexedDB
 *
 * Types are imported from Zod schemas in src/types/schemas/
 */
import Dexie, { type EntityTable } from 'dexie'
import type { Task } from '@/types/task'
import type { Thought } from '@/types/thought'
import type { Settings } from '@/types/settings'
import type { Project } from '@/types/project'
import type { VoiceRecording } from '@/types/voice-recording'

// Default settings created once when database is first created
const DEFAULT_SETTINGS: Settings = {
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

    this.version(1).stores({
      // Primary key is 'id', indexes after comma
      tasks: 'id, createdAt, isCompleted, context, energy',
      thoughts: 'id, createdAt, aiProcessed, processingStatus',
      settings: 'id',
      projects: 'id, name, isActive, createdAt',
      voiceRecordings: 'id, createdAt',
    })

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
