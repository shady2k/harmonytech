/**
 * Task Types
 *
 * All task-related types are derived from the master Zod schema.
 *
 * To add a new field to Task:
 * 1. Add it to src/lib/schemas/task.master.ts
 * 2. TypeScript types update automatically via z.infer
 * 3. RxDB schema updates automatically via zodToRxDBSchema
 * 4. AI prompt updates automatically if field has forExtraction: true
 */
export type {
  Task,
  TaskContext,
  TaskEnergy,
  RecurrencePattern,
  ClassificationStatus,
  Recurrence,
  AISuggestions,
} from '@/lib/schemas/task.master'

export {
  taskSchema,
  taskContextSchema,
  taskEnergySchema,
  recurrencePatternSchema,
  classificationStatusSchema,
  recurrenceSchema,
  aiSuggestionsSchema,
} from '@/lib/schemas/task.master'
