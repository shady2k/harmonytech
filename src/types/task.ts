/**
 * Task Types - Re-exports from Zod schema (single source of truth)
 */
export type {
  Task,
  TaskContext,
  TaskEnergy,
  RecurrencePattern,
  ClassificationStatus,
  Recurrence,
  AISuggestions,
  ExtractedTask,
  ExtractedThought,
  ExtractionResult,
  AIFieldMeta,
} from './schemas'

export {
  taskSchema,
  taskContextSchema,
  taskEnergySchema,
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
} from './schemas'
