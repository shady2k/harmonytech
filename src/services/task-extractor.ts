/**
 * Task Extractor Service
 *
 * Extracts tasks and thoughts from user input using AI.
 * Uses Zod schemas from task.master.ts for type-safe parsing.
 *
 * The extraction prompt is generated from schema metadata,
 * ensuring the prompt always matches the expected response format.
 */
import { z } from 'zod'
import { aiService } from './ai'
import { TASK_EXTRACTION_PROMPT } from '@/lib/ai-prompts'
import {
  extractedTaskSchema,
  extractedThoughtSchema,
  type ExtractedTask,
  type ExtractedThought,
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

    const scheduledStart = normalizeDateString(task['scheduledStart'])
    if (scheduledStart !== undefined) extracted.scheduledStart = scheduledStart

    const scheduledEnd = normalizeDateString(task['scheduledEnd'])
    if (scheduledEnd !== undefined) extracted.scheduledEnd = scheduledEnd

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
 * Normalize optional string field (handle null, undefined, empty)
 * Converts null to undefined for Task compatibility
 */
function normalizeOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string' && value.trim() !== '') return value
  return undefined
}

/**
 * Normalize and validate ISO date string
 * Returns undefined if the string is not a valid parseable date
 * Handles AI responses that may contain placeholders like "XX" for unknown values
 */
function normalizeDateString(value: unknown): string | undefined {
  const str = normalizeOptionalString(value)
  if (str === undefined) return undefined

  // Check for placeholder patterns that AI might use (e.g., "2025-XX-20")
  if (/[^0-9T:\-.Z+]/.test(str.replace(/\d{4}-\d{2}-\d{2}/, ''))) {
    // Contains non-date characters, likely a placeholder
    return undefined
  }

  // Try to parse the date
  const date = new Date(str)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return str
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
 * Extract tasks and thoughts from user text input
 */
export async function extractFromText(text: string, model: string): Promise<ExtractionResult> {
  if (text.trim() === '') {
    return { tasks: [], thoughts: [], isActionable: false }
  }

  if (!aiService.isAvailable()) {
    throw new Error('AI service is not available')
  }

  const promptWithDateTime = TASK_EXTRACTION_PROMPT.replace(
    '{currentDateTime}',
    new Date().toISOString()
  )

  const response = await aiService.chat(
    [
      { role: 'system', content: promptWithDateTime },
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
