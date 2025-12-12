import { getOpenRouterClient } from './openrouter'
import { TASK_EXTRACTION_PROMPT } from '@/lib/ai-prompts'

export interface ExtractedTaskItem {
  rawInput: string
  nextAction: string
  isActionable: boolean
}

export interface ExtractedThoughtItem {
  content: string
  suggestedTags: string[]
}

export interface ExtractionResult {
  tasks: ExtractedTaskItem[]
  thoughts: ExtractedThoughtItem[]
  isActionable: boolean
}

interface AITaskItem {
  rawInput?: unknown
  nextAction?: unknown
  isActionable?: unknown
}

interface AIThoughtItem {
  content?: unknown
  suggestedTags?: unknown
}

interface AIExtractionResponse {
  tasks: AITaskItem[]
  thoughts: AIThoughtItem[]
}

const JSON_REGEX = /\{[\s\S]*\}/

function parseExtractionResponse(content: string): AIExtractionResponse {
  const jsonMatch = JSON_REGEX.exec(content)
  if (jsonMatch === null) {
    throw new Error('No valid JSON found in response')
  }

  const parsed = JSON.parse(jsonMatch[0]) as unknown

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid response structure')
  }

  const response = parsed as Record<string, unknown>

  const tasksRaw = response['tasks']
  const thoughtsRaw = response['thoughts']
  const tasks = Array.isArray(tasksRaw) ? tasksRaw : []
  const thoughts = Array.isArray(thoughtsRaw) ? thoughtsRaw : []

  return {
    tasks: tasks.map((t: unknown): AITaskItem => {
      const task = t as Record<string, unknown>
      return {
        rawInput: task['rawInput'],
        nextAction: task['nextAction'],
        isActionable: task['isActionable'],
      }
    }),
    thoughts: thoughts.map((th: unknown): AIThoughtItem => {
      const thought = th as Record<string, unknown>
      return {
        content: thought['content'],
        suggestedTags: thought['suggestedTags'],
      }
    }),
  }
}

function toString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value.toString()
  return fallback
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => toString(item))
}

export async function extractFromText(
  text: string,
  apiKey: string,
  model: string
): Promise<ExtractionResult> {
  if (text.trim() === '') {
    return {
      tasks: [],
      thoughts: [],
      isActionable: false,
    }
  }

  const client = getOpenRouterClient(apiKey)

  const response = await client.chat(
    [
      {
        role: 'system',
        content: TASK_EXTRACTION_PROMPT,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    model
  )

  const content = response.choices[0]?.message.content
  if (!content) {
    throw new Error('Empty response from AI')
  }

  const parsed = parseExtractionResponse(content)

  const tasks: ExtractedTaskItem[] = parsed.tasks.map((t) => ({
    rawInput: toString(t.rawInput),
    nextAction: toString(t.nextAction),
    isActionable: t.isActionable !== false,
  }))

  const thoughts: ExtractedThoughtItem[] = parsed.thoughts.map((th) => ({
    content: toString(th.content),
    suggestedTags: toStringArray(th.suggestedTags),
  }))

  return {
    tasks,
    thoughts,
    isActionable: tasks.length > 0,
  }
}
