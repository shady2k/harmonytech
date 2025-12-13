import type { Task } from '@/types/task'
import type { Thought } from '@/types/thought'
import type { VoiceRecording } from '@/types/voice-recording'
import type { Project } from '@/types/project'
import type { Settings } from '@/types/settings'

// Version configuration - single source of truth
export const CURRENT_SCHEMA_VERSION = 1
export const DB_NAME_PREFIX = 'harmonytech'
export const DB_VERSION_KEY = 'harmonytech_db_version'
export const MIGRATION_LOCK_KEY = 'harmonytech_migration_lock'
export const BACKUP_DB_NAME = 'harmonytech_backups'

export function getTargetDbName(version: number): string {
  return version === 0 ? DB_NAME_PREFIX : `${DB_NAME_PREFIX}_v${String(version)}`
}

export function getLegacyDbName(): string {
  return DB_NAME_PREFIX
}

// Version tracking stored in localStorage
export interface DbVersionInfo {
  version: number // Schema generation: 1, 2, 3...
  dbName: string // Active DB: "harmonytech_v1"
  migratedAt: string // ISO timestamp
  previousDbName?: string // For cleanup: "harmonytech"
}

// Migration lock to detect interrupted migrations
export interface MigrationLock {
  startedAt: string // ISO timestamp
  targetVersion: number
  targetDbName: string
  status: 'in_progress' | 'completed'
}

// Migration state for UI updates
export interface MigrationState {
  status:
    | 'idle'
    | 'checking'
    | 'backing-up'
    | 'creating-shadow'
    | 'migrating'
    | 'validating'
    | 'swapping'
    | 'cleaning'
    | 'done'
    | 'error'
  progress: number // 0-100
  currentStep: string // Human-readable step description
  currentCollection?: string // Currently migrating collection
  itemsCopied: number
  itemsTotal: number
  itemsSkipped: number
  error?: Error
  canRollback: boolean
  backupDownloaded: boolean
}

export const INITIAL_MIGRATION_STATE: MigrationState = {
  status: 'idle',
  progress: 0,
  currentStep: '',
  itemsCopied: 0,
  itemsTotal: 0,
  itemsSkipped: 0,
  canRollback: false,
  backupDownloaded: false,
}

// Backup record stored in separate IndexedDB
export interface BackupRecord {
  id: string // "backup-{timestamp}"
  version: number // Schema version being backed up
  dbName: string // Source database name
  createdAt: string // ISO timestamp
  collections: BackupCollections
}

export interface BackupCollections {
  tasks: Task[]
  thoughts: Thought[]
  voice_recordings: VoiceRecording[]
  projects: Project[]
  settings: Settings[]
}

// Validation result after migration
export interface ValidationResult {
  isValid: boolean
  collections: CollectionValidation[]
  errors: string[]
}

export interface CollectionValidation {
  name: string
  sourceCount: number
  targetCount: number
  skipped: number
  sampleVerified: boolean // Spot-check passed
}

// Migration statistics per collection
export interface MigrationStats {
  copied: number
  skipped: number
  total: number
}

// Document transformer function type
export type DocumentTransformer = (doc: Record<string, unknown>) => Record<string, unknown> | null

// Collection transformers map
export interface CollectionTransformers {
  tasks: DocumentTransformer
  thoughts: DocumentTransformer
  voice_recordings: DocumentTransformer
  projects: DocumentTransformer
  settings: DocumentTransformer
}

// Tab coordination for multi-tab handling
export type TabMigrationRole =
  | 'leader' // Running migration
  | 'follower_waiting' // Showing read-only banner, waiting for completion
  | 'follower_reload' // Migration done, needs reload
  | 'normal' // No migration in progress

// BroadcastChannel message types
export type MigrationMessage =
  | { type: 'MIGRATION_STARTED' }
  | { type: 'MIGRATION_PROGRESS'; progress: number; step: string }
  | { type: 'MIGRATION_COMPLETE' }
  | { type: 'MIGRATION_FAILED'; error: string }

export const MIGRATION_CHANNEL_NAME = 'harmonytech-migration'

// Batch size for streaming migration
export const BATCH_SIZE = 100

// Collection names for iteration
export const COLLECTION_NAMES = [
  'tasks',
  'thoughts',
  'voice_recordings',
  'projects',
  'settings',
] as const

export type CollectionName = (typeof COLLECTION_NAMES)[number]
