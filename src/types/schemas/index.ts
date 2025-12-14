/**
 * Schema Index - Re-exports all Zod schemas and types
 */

// Common (shared enums)
export { taskContextSchema, taskEnergySchema } from './common.schema'
export type { TaskContext, TaskEnergy } from './common.schema'

// Task
export {
  taskSchema,
  recurrencePatternSchema,
  classificationStatusSchema,
  recurrenceSchema,
  aiSuggestionsSchema,
  extractedTaskSchema,
  extractedThoughtSchema,
  extractionResultSchema,
  getAIMeta,
  getAllAIMeta,
  getExtractionFields,
} from './task.schema'

export type {
  Task,
  RecurrencePattern,
  ClassificationStatus,
  Recurrence,
  AISuggestions,
  ExtractedTask,
  ExtractedThought,
  ExtractionResult,
  AIFieldMeta,
} from './task.schema'

// Thought
export { thoughtSchema, processingStatusSchema } from './thought.schema'
export type { Thought, ProcessingStatus } from './thought.schema'

// Settings
export { settingsSchema, themeSchema, aiProviderSchema } from './settings.schema'
export type { Settings, Theme, AIProviderType } from './settings.schema'

// Project
export { projectSchema } from './project.schema'
export type { Project } from './project.schema'

// Voice Recording
export { voiceRecordingSchema } from './voice-recording.schema'
export type { VoiceRecording } from './voice-recording.schema'
