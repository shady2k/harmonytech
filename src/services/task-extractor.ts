/**
 * Task Extractor Service
 *
 * Extracts tasks and thoughts from user input using AI.
 * Uses Zod schemas from task.schema.ts for type-safe parsing.
 *
 * IMPORTANT: AI extracts SEMANTIC date anchors, not calculated dates.
 * The date-resolver service calculates actual dates from anchors.
 */
import { z } from 'zod'
import { aiService } from './ai'
import { TASK_EXTRACTION_PROMPT } from '@/lib/ai-prompts'
import {
  extractedTaskSchema,
  extractedThoughtSchema,
  dateAnchorSchema,
  type ExtractedTask,
  type ExtractedThought,
  type DateAnchor,
} from '@/types/schemas/task.schema'

export interface ExtractionResult {
  tasks: ExtractedTask[]
  thoughts: ExtractedThought[]
  isActionable: boolean
}

const JSON_REGEX = /\{[\s\S]*\}/

/**
 * Schema for the full AI response
 */
const aiResponseSchema = z.object({
  tasks: z.array(extractedTaskSchema),
  thoughts: z.array(extractedThoughtSchema),
})

/**
 * Parse and validate AI response using Zod
 * Falls back to lenient parsing if strict parsing fails
 */
function parseAIResponse(content: string): {
  tasks: ExtractedTask[]
  thoughts: ExtractedThought[]
} {
  const jsonMatch = JSON_REGEX.exec(content)
  if (jsonMatch === null) {
    throw new Error('No valid JSON found in response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error('Invalid JSON in response')
  }

  // Try strict Zod parsing first
  const result = aiResponseSchema.safeParse(parsed)
  if (result.success) {
    return {
      tasks: result.data.tasks,
      thoughts: result.data.thoughts,
    }
  }

  // Fall back to lenient parsing for malformed responses
  return parseLenient(parsed)
}

/**
 * Lenient parsing for when AI response doesn't exactly match schema
 * This handles edge cases like missing fields or wrong types
 */
function parseLenient(data: unknown): { tasks: ExtractedTask[]; thoughts: ExtractedThought[] } {
  if (typeof data !== 'object' || data === null) {
    return { tasks: [], thoughts: [] }
  }

  const obj = data as Record<string, unknown>
  const rawTasks = Array.isArray(obj['tasks']) ? obj['tasks'] : []
  const rawThoughts = Array.isArray(obj['thoughts']) ? obj['thoughts'] : []

  const tasks: ExtractedTask[] = []
  for (const t of rawTasks) {
    if (typeof t !== 'object' || t === null) continue
    const task = t as Record<string, unknown>

    const rawInput = task['rawInput']
    const nextAction = task['nextAction']

    const extracted: ExtractedTask = {
      rawInput: typeof rawInput === 'string' ? rawInput : '',
      nextAction: typeof nextAction === 'string' ? nextAction : '',
      isActionable: task['isActionable'] !== false,
    }

    // Parse semantic date anchors
    const dateAnchor = normalizeDateAnchor(task['dateAnchor'])
    if (dateAnchor !== undefined) extracted.dateAnchor = dateAnchor

    const dateAnchorEnd = normalizeDateAnchor(task['dateAnchorEnd'])
    if (dateAnchorEnd !== undefined) extracted.dateAnchorEnd = dateAnchorEnd

    const recurrence = normalizeRecurrence(task['recurrence'])
    if (recurrence !== undefined) extracted.recurrence = recurrence

    tasks.push(extracted)
  }

  const thoughts: ExtractedThought[] = []
  for (const th of rawThoughts) {
    if (typeof th !== 'object' || th === null) continue
    const thought = th as Record<string, unknown>

    const content = thought['content']

    thoughts.push({
      content: typeof content === 'string' ? content : '',
      suggestedTags: normalizeStringArray(thought['suggestedTags']),
    })
  }

  return { tasks, thoughts }
}

/**
 * Normalize string array
 */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

const VALID_CONSTRAINTS = ['next-weekend', 'next-weekday', 'next-saturday', 'next-sunday'] as const
type RecurrenceConstraint = (typeof VALID_CONSTRAINTS)[number]

/**
 * Normalize recurrence object
 * Converts null to undefined for Task compatibility
 */
function normalizeRecurrence(value: unknown):
  | {
      pattern: 'daily' | 'weekly' | 'monthly' | 'custom'
      interval: number
      daysOfWeek?: number[]
      dayOfMonth?: number
      endDate?: string
      anchorDay?: number
      constraint?: RecurrenceConstraint
    }
  | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value !== 'object') return undefined

  const rec = value as Record<string, unknown>
  const pattern = rec['pattern']

  if (!['daily', 'weekly', 'monthly', 'custom'].includes(String(pattern))) {
    return undefined
  }

  const constraint = rec['constraint']
  const isValidConstraint = (v: unknown): v is RecurrenceConstraint =>
    typeof v === 'string' && VALID_CONSTRAINTS.includes(v as RecurrenceConstraint)

  return {
    pattern: pattern as 'daily' | 'weekly' | 'monthly' | 'custom',
    interval: typeof rec['interval'] === 'number' ? rec['interval'] : 1,
    ...(Array.isArray(rec['daysOfWeek']) && { daysOfWeek: rec['daysOfWeek'] as number[] }),
    ...(typeof rec['dayOfMonth'] === 'number' && { dayOfMonth: rec['dayOfMonth'] }),
    ...(typeof rec['endDate'] === 'string' && { endDate: rec['endDate'] }),
    ...(typeof rec['anchorDay'] === 'number' && { anchorDay: rec['anchorDay'] }),
    ...(isValidConstraint(constraint) && { constraint }),
  }
}

/**
 * Valid relative date values
 */
const VALID_RELATIVE_VALUES = [
  'today',
  'tomorrow',
  'day-after-tomorrow',
  'this-weekend',
  'next-weekend',
  'this-week',
  'next-week',
] as const
type RelativeDateValue = (typeof VALID_RELATIVE_VALUES)[number]

/**
 * Valid offset units
 */
const VALID_OFFSET_UNITS = ['days', 'weeks', 'months'] as const
type OffsetUnit = (typeof VALID_OFFSET_UNITS)[number]

/**
 * Valid weekday modifiers
 */
const VALID_WEEKDAY_MODIFIERS = ['this', 'next'] as const
type WeekdayModifier = (typeof VALID_WEEKDAY_MODIFIERS)[number]

/**
 * Normalize and validate date anchor from AI response
 * Returns undefined if the value is invalid or null
 */
function normalizeDateAnchor(value: unknown): DateAnchor | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value !== 'object') return undefined

  const anchor = value as Record<string, unknown>
  const type = anchor['type']

  // Try Zod validation first
  const zodResult = dateAnchorSchema.safeParse(value)
  if (zodResult.success) {
    return zodResult.data
  }

  // Fall back to manual normalization for partial matches
  if (type === 'none') {
    return { type: 'none' }
  }

  if (type === 'relative') {
    const rawValue = anchor['value']
    if (typeof rawValue === 'string' && isValidRelativeValue(rawValue)) {
      const result: DateAnchor = { type: 'relative', value: rawValue }
      const time = normalizeTimeString(anchor['time'])
      if (time !== undefined) {
        return { ...result, time }
      }
      return result
    }
    return undefined
  }

  if (type === 'offset') {
    const unit = anchor['unit']
    const amount = anchor['amount']
    if (
      typeof unit === 'string' &&
      isValidOffsetUnit(unit) &&
      typeof amount === 'number' &&
      amount >= 1
    ) {
      const result: DateAnchor = { type: 'offset', unit, amount }
      const time = normalizeTimeString(anchor['time'])
      if (time !== undefined) {
        return { ...result, time }
      }
      return result
    }
    return undefined
  }

  if (type === 'weekday') {
    const weekday = anchor['weekday']
    if (typeof weekday === 'number' && weekday >= 1 && weekday <= 7) {
      const result: DateAnchor = { type: 'weekday', weekday }
      const modifier = anchor['modifier']
      if (typeof modifier === 'string' && isValidWeekdayModifier(modifier)) {
        ;(result as { modifier?: WeekdayModifier }).modifier = modifier
      }
      const time = normalizeTimeString(anchor['time'])
      if (time !== undefined) {
        return { ...result, time }
      }
      return result
    }
    return undefined
  }

  if (type === 'absolute') {
    const month = anchor['month']
    const day = anchor['day']
    if (
      typeof month === 'number' &&
      month >= 1 &&
      month <= 12 &&
      typeof day === 'number' &&
      day >= 1 &&
      day <= 31
    ) {
      const result: DateAnchor = { type: 'absolute', month, day }
      const year = anchor['year']
      if (typeof year === 'number') {
        ;(result as { year?: number }).year = year
      }
      const time = normalizeTimeString(anchor['time'])
      if (time !== undefined) {
        return { ...result, time }
      }
      return result
    }
    return undefined
  }

  return undefined
}

/**
 * Type guard for valid relative date values
 */
function isValidRelativeValue(value: string): value is RelativeDateValue {
  return VALID_RELATIVE_VALUES.includes(value as RelativeDateValue)
}

/**
 * Type guard for valid offset units
 */
function isValidOffsetUnit(value: string): value is OffsetUnit {
  return VALID_OFFSET_UNITS.includes(value as OffsetUnit)
}

/**
 * Type guard for valid weekday modifiers
 */
function isValidWeekdayModifier(value: string): value is WeekdayModifier {
  return VALID_WEEKDAY_MODIFIERS.includes(value as WeekdayModifier)
}

/**
 * Normalize time string to HH:mm format
 */
function normalizeTimeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  // Check if it matches HH:mm format
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (match !== null) {
    return value
  }

  // Try to parse common formats
  const hourMinMatch = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (hourMinMatch !== null) {
    const hours = parseInt(hourMinMatch[1], 10)
    const minutes = parseInt(hourMinMatch[2], 10)
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
  }

  return undefined
}

/**
 * Extract tasks and thoughts from user text input
 */
export async function extractFromText(text: string, model: string): Promise<ExtractionResult> {
  if (text.trim() === '') {
    return { tasks: [], thoughts: [], isActionable: false }
  }

  if (!aiService.isAvailable()) {
    throw new Error('AI service is not available')
  }

  // Note: We no longer need to pass currentDateTime since AI extracts
  // semantic anchors, not calculated dates. The app calculates dates.
  const response = await aiService.chat(
    [
      { role: 'system', content: TASK_EXTRACTION_PROMPT },
      { role: 'user', content: text },
    ],
    model
  )

  if (response === null || response.content === '') {
    throw new Error('Empty response from AI')
  }

  const { tasks, thoughts } = parseAIResponse(response.content)

  return {
    tasks,
    thoughts,
    isActionable: tasks.length > 0,
  }
}
