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
  'end-of-month', // From anchorDay until end of month
])
export type RecurrenceConstraint = z.infer<typeof recurrenceConstraintSchema>

// ============================================================
// Date Anchor Schema (Semantic Date References)
// ============================================================

/**
 * DateAnchor captures the SEMANTIC MEANING of a date reference.
 * AI extracts semantic anchors, app calculates actual dates.
 * This ensures reliable date calculations since AI doesn't have a calendar.
 */

/** Relative date keywords that can be directly resolved */
export const relativeDateValueSchema = z.enum([
  'today',
  'tomorrow',
  'day-after-tomorrow',
  'this-weekend', // This Saturday-Sunday
  'next-weekend', // Next Saturday-Sunday
  'this-week', // Current week
  'next-week', // Next week
])
export type RelativeDateValue = z.infer<typeof relativeDateValueSchema>

/** ISO weekday: 1=Monday, 7=Sunday */
export const isoWeekdaySchema = z.number().min(1).max(7)
export type ISOWeekday = z.infer<typeof isoWeekdaySchema>

/** Time in HH:mm format */
export const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)

/** Relative date anchor - "tomorrow", "this weekend" */
export const relativeDateAnchorSchema = z.object({
  type: z.literal('relative'),
  value: relativeDateValueSchema,
  time: timeStringSchema.optional(),
})
export type RelativeDateAnchor = z.infer<typeof relativeDateAnchorSchema>

/** Offset date anchor - "in 3 days", "through 2 weeks" */
export const offsetDateAnchorSchema = z.object({
  type: z.literal('offset'),
  unit: z.enum(['days', 'weeks', 'months']),
  amount: z.number().min(1),
  time: timeStringSchema.optional(),
})
export type OffsetDateAnchor = z.infer<typeof offsetDateAnchorSchema>

/** Weekday anchor - "on Monday", "next Friday" */
export const weekdayDateAnchorSchema = z.object({
  type: z.literal('weekday'),
  weekday: isoWeekdaySchema,
  modifier: z.enum(['this', 'next']).optional(), // "this Monday" vs "next Monday"
  time: timeStringSchema.optional(),
})
export type WeekdayDateAnchor = z.infer<typeof weekdayDateAnchorSchema>

/** Absolute date anchor - "January 15", "15.01.2025" */
export const absoluteDateAnchorSchema = z.object({
  type: z.literal('absolute'),
  year: z.number().optional(), // If omitted, infer current/next year
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
  time: timeStringSchema.optional(),
})
export type AbsoluteDateAnchor = z.infer<typeof absoluteDateAnchorSchema>

/** No date specified */
export const noneDateAnchorSchema = z.object({
  type: z.literal('none'),
})
export type NoneDateAnchor = z.infer<typeof noneDateAnchorSchema>

/** Union of all date anchor types */
export const dateAnchorSchema = z.discriminatedUnion('type', [
  relativeDateAnchorSchema,
  offsetDateAnchorSchema,
  weekdayDateAnchorSchema,
  absoluteDateAnchorSchema,
  noneDateAnchorSchema,
])
export type DateAnchor = z.infer<typeof dateAnchorSchema>

// Register AI metadata for dateAnchor
registerAIMeta('dateAnchor', {
  hint: 'Semantic date reference. AI extracts the MEANING, app calculates actual dates. Use type="none" if no date mentioned.',
  examples: [
    '"завтра" / "tomorrow" → {type: "relative", value: "tomorrow"}',
    '"послезавтра" → {type: "relative", value: "day-after-tomorrow"}',
    '"в эти выходные" / "this weekend" → {type: "relative", value: "this-weekend"}',
    '"в следующие выходные" / "next weekend" → {type: "relative", value: "next-weekend"}',
    '"через 3 дня" / "in 3 days" → {type: "offset", unit: "days", amount: 3}',
    '"через неделю" / "in a week" → {type: "offset", unit: "weeks", amount: 1}',
    '"в понедельник" / "on Monday" → {type: "weekday", weekday: 1}',
    '"в следующую пятницу" / "next Friday" → {type: "weekday", weekday: 5, modifier: "next"}',
    '"15 января" / "January 15" → {type: "absolute", month: 1, day: 15}',
    '"в 9 утра завтра" → {type: "relative", value: "tomorrow", time: "09:00"}',
    'no date mentioned → {type: "none"}',
  ],
  forExtraction: true,
})

// Register AI metadata for dateAnchorEnd
registerAIMeta('dateAnchorEnd', {
  hint: 'End date for date ranges. Only set for ranges like "from 10th to 15th", otherwise null.',
  examples: [
    '"с 10 по 15 января" → dateAnchor: {type: "absolute", month: 1, day: 10}, dateAnchorEnd: {type: "absolute", month: 1, day: 15}',
    '"на эти выходные" → dateAnchor: {type: "relative", value: "this-weekend"}, dateAnchorEnd: null (weekend already implies Sat-Sun range)',
  ],
  forExtraction: true,
})

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

// NOTE: scheduledStart and scheduledEnd are CALCULATED by the app from dateAnchor/dateAnchorEnd.
// AI should NOT return ISO dates directly - it extracts semantic anchors instead.

// ============================================================
// Extraction Schema (subset for AI extraction)
// ============================================================

/**
 * Schema for property suggestions returned by AI during extraction
 */
export const extractedPropertiesSchema = z.object({
  context: taskContextSchema,
  energy: taskEnergySchema,
  timeEstimate: z.number().min(5).max(480), // 5 min to 8 hours
})
export type ExtractedProperties = z.infer<typeof extractedPropertiesSchema>

/**
 * Schema for what AI should extract from text.
 * This is a subset of Task - only fields that can be extracted.
 *
 * AI extracts SEMANTIC date anchors, not calculated ISO dates.
 * The app calculates actual scheduledStart/scheduledEnd from anchors.
 */
export const extractedTaskSchema = z.object({
  rawInput: z.string(),
  nextAction: z.string(),
  isActionable: z.boolean(),
  dateAnchor: dateAnchorSchema.optional(), // Semantic start date reference
  dateAnchorEnd: dateAnchorSchema.optional(), // Semantic end date for ranges
  recurrence: recurrenceSchema.optional(),
  properties: extractedPropertiesSchema.optional(), // GTD properties suggested by AI
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
