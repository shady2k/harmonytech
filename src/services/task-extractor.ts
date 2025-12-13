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
} from '@/lib/schemas/task.master'

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

    const scheduledStart = normalizeOptionalString(task['scheduledStart'])
    if (scheduledStart !== undefined) extracted.scheduledStart = scheduledStart

    const scheduledEnd = normalizeOptionalString(task['scheduledEnd'])
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
 * Normalize string array
 */
function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

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
    }
  | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value !== 'object') return undefined

  const rec = value as Record<string, unknown>
  const pattern = rec['pattern']

  if (!['daily', 'weekly', 'monthly', 'custom'].includes(String(pattern))) {
    return undefined
  }

  return {
    pattern: pattern as 'daily' | 'weekly' | 'monthly' | 'custom',
    interval: typeof rec['interval'] === 'number' ? rec['interval'] : 1,
    ...(Array.isArray(rec['daysOfWeek']) && { daysOfWeek: rec['daysOfWeek'] as number[] }),
    ...(typeof rec['dayOfMonth'] === 'number' && { dayOfMonth: rec['dayOfMonth'] }),
    ...(typeof rec['endDate'] === 'string' && { endDate: rec['endDate'] }),
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
