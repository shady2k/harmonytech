/**
 * Settings Types - Re-exports from Zod schema (single source of truth)
 */
export type { Settings, Theme, AIProviderType } from './schemas'
export { settingsSchema, themeSchema, aiProviderSchema } from './schemas'

// Re-export task enums for backward compatibility
export type { TaskContext, TaskEnergy } from './schemas'
