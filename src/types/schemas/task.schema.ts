/**
 * Task Schema - Single Source of Truth
 *
 * This Zod schema defines the Task structure with embedded AI hints.
 * From this schema we derive:
 * 1. TypeScript types (via z.infer)
 * 2. Dexie database types
 * 3. AI extraction prompt (via generate-prompt.ts)
 * 4. Response parser (via Zod's parse/safeParse)
 */
import { z } from 'zod'
import { taskContextSchema, taskEnergySchema } from './common.schema'

// Re-export from common
export { taskContextSchema, taskEnergySchema }
export type { TaskContext, TaskEnergy } from './common.schema'

// ============================================================
// AI Hint Metadata Types
// ============================================================

export interface AIFieldMeta {
  hint: string
  examples?: string[]
  forExtraction?: boolean // Whether this field should be extracted by AI
}

// Store AI metadata separately since Zod descriptions are just strings
const aiFieldMeta = new Map<string, AIFieldMeta>()

/**
 * Register AI metadata for a field path
 */
function registerAIMeta(path: string, meta: AIFieldMeta): void {
  aiFieldMeta.set(path, meta)
}

/**
 * Get AI metadata for a field path
 */
export function getAIMeta(path: string): AIFieldMeta | undefined {
  return aiFieldMeta.get(path)
}

/**
 * Get all AI metadata
 */
export function getAllAIMeta(): Map<string, AIFieldMeta> {
  return aiFieldMeta
}

export const recurrencePatternSchema = z.enum(['daily', 'weekly', 'monthly', 'custom'])
export type RecurrencePattern = z.infer<typeof recurrencePatternSchema>

/**
 * Constraint for relative scheduling within a recurrence pattern
 * Used to express rules like "the weekend after the 10th"
 */
export const recurrenceConstraintSchema = z.enum([
  'next-weekend', // First Sat-Sun on or after anchorDay
  'next-weekday', // First Mon-Fri on or after anchorDay
  'next-saturday', // First Saturday on or after anchorDay
  'next-sunday', // First Sunday on or after anchorDay
])
export type RecurrenceConstraint = z.infer<typeof recurrenceConstraintSchema>

export const classificationStatusSchema = z.enum(['pending', 'classified', 'user_override'])
export type ClassificationStatus = z.infer<typeof classificationStatusSchema>

// ============================================================
// Nested Object Schemas
// ============================================================

export const recurrenceSchema = z.object({
  pattern: recurrencePatternSchema,
  interval: z.number().default(1),
  daysOfWeek: z.array(z.number().min(1).max(7)).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  endDate: z.string().optional(),
  // Extended fields for complex scheduling
  anchorDay: z.number().min(1).max(31).optional(), // Reference day for constraint calculation
  constraint: recurrenceConstraintSchema.optional(), // Relative constraint (e.g., "next weekend after anchorDay")
})
export type Recurrence = z.infer<typeof recurrenceSchema>

// Register AI metadata for recurrence
registerAIMeta('recurrence', {
  hint: 'Recurrence pattern extracted from text. Set to null if not recurring.',
  examples: [
    '"ежедневно/каждый день/daily" → {pattern: "daily", interval: 1}',
    '"еженедельно/каждую неделю/weekly" → {pattern: "weekly", interval: 1}',
    '"ежемесячно/каждый месяц/monthly" → {pattern: "monthly", interval: 1}',
    '"каждые 2 недели" → {pattern: "weekly", interval: 2}',
    '"по понедельникам и средам" → {pattern: "weekly", daysOfWeek: [1, 3]}',
    '"каждое 20 число" → {pattern: "monthly", dayOfMonth: 20}',
    '"в выходные после 10 числа каждого месяца" → {pattern: "monthly", anchorDay: 10, constraint: "next-weekend"}',
    '"каждый месяц в первые рабочие дни после 15" → {pattern: "monthly", anchorDay: 15, constraint: "next-weekday"}',
  ],
  forExtraction: true,
})

export const aiSuggestionsSchema = z.object({
  suggestedContext: taskContextSchema.optional(),
  suggestedEnergy: taskEnergySchema.optional(),
  suggestedTimeEstimate: z.number().optional(),
  suggestedProject: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  alternatives: z
    .object({
      context: z.array(taskContextSchema).optional(),
      energy: z.array(taskEnergySchema).optional(),
      timeEstimate: z.array(z.number()).optional(),
    })
    .optional(),
})
export type AISuggestions = z.infer<typeof aiSuggestionsSchema>

// ============================================================
// Main Task Schema
// ============================================================

export const taskSchema = z.object({
  // Identity
  id: z.string(),

  // Core content
  rawInput: z.string(),
  nextAction: z.string(),

  // GTD properties (set by classification, not extraction)
  context: taskContextSchema,
  energy: taskEnergySchema,
  timeEstimate: z.number(),
  project: z.string().optional(),
  isSomedayMaybe: z.boolean(),
  isCompleted: z.boolean(),
  completedAt: z.string().optional(),

  // Scheduling - EXTRACTED BY AI
  deadline: z.string().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  recurrence: recurrenceSchema.optional(),

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  aiSuggestions: aiSuggestionsSchema.optional(),
  sourceThoughtId: z.string().optional(),
  classificationStatus: classificationStatusSchema.optional(),
})

export type Task = z.infer<typeof taskSchema>

// Register AI metadata for extraction fields
registerAIMeta('rawInput', {
  hint: 'The original text segment that led to this task',
  forExtraction: true,
})

registerAIMeta('nextAction', {
  hint: 'Clear action starting with a verb, WITHOUT the date/time/recurrence part',
  examples: [
    '"завтра позвонить маме" → "Позвонить маме"',
    '"buy groceries on monday" → "Buy groceries"',
    '"отправить отчет ежемесячно" → "Отправить отчет"',
  ],
  forExtraction: true,
})

registerAIMeta('scheduledStart', {
  hint: 'ISO 8601 datetime when task should start. Set to null if no date/time mentioned. For one-time relative dates, calculate the actual date.',
  examples: [
    '"завтра в 9 утра" → calculate next day at 09:00:00',
    '"в понедельник" → calculate next Monday at 00:00:00',
    '"с 10 января" → "2025-01-10T00:00:00"',
    '"в эти выходные" → calculate this Saturday at 00:00:00 (one-time, no recurrence)',
    '"на следующих выходных" → calculate next Saturday at 00:00:00 (one-time, no recurrence)',
  ],
  forExtraction: true,
})

registerAIMeta('scheduledEnd', {
  hint: 'ISO 8601 datetime for end of date range. Only set for date ranges, otherwise null.',
  examples: [
    '"с 10 по 15 января" → scheduledEnd: "2025-01-15T23:59:59"',
    '"в эти выходные" → scheduledEnd: calculate this Sunday at 23:59:59',
  ],
  forExtraction: true,
})

// ============================================================
// Extraction Schema (subset for AI extraction)
// ============================================================

/**
 * Schema for what AI should extract from text.
 * This is a subset of Task - only fields that can be extracted.
 */
export const extractedTaskSchema = z.object({
  rawInput: z.string(),
  nextAction: z.string(),
  isActionable: z.boolean(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  recurrence: recurrenceSchema.optional(),
})

export type ExtractedTask = z.infer<typeof extractedTaskSchema>

export const extractedThoughtSchema = z.object({
  content: z.string(),
  suggestedTags: z.array(z.string()),
})

export type ExtractedThought = z.infer<typeof extractedThoughtSchema>

export const extractionResultSchema = z.object({
  tasks: z.array(extractedTaskSchema),
  thoughts: z.array(extractedThoughtSchema),
})

export type ExtractionResult = z.infer<typeof extractionResultSchema>

// ============================================================
// Field Lists for Prompt Generation
// ============================================================

/**
 * Get all fields that should be extracted by AI
 */
export function getExtractionFields(): { name: string; meta: AIFieldMeta }[] {
  const fields: { name: string; meta: AIFieldMeta }[] = []
  for (const [name, meta] of aiFieldMeta) {
    if (meta.forExtraction === true) {
      fields.push({ name, meta })
    }
  }
  return fields
}
