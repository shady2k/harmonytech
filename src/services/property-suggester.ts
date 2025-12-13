import { aiService } from './ai'
import { PROPERTY_SUGGESTION_PROMPT } from '@/lib/ai-prompts'
import type { TaskContext, TaskEnergy } from '@/types/task'

export interface PropertySuggestion<T> {
  value: T
  confidence: number
  alternatives: T[]
  reasoning?: string
}

export interface PropertySuggestions {
  context: PropertySuggestion<TaskContext>
  energy: PropertySuggestion<TaskEnergy>
  timeEstimate: PropertySuggestion<number>
  project: PropertySuggestion<string | null>
}

interface AISuggestionItem {
  value?: unknown
  confidence?: unknown
  alternatives?: unknown
  reasoning?: unknown
}

interface AISuggestionResponse {
  context: AISuggestionItem
  energy: AISuggestionItem
  timeEstimate: AISuggestionItem
  project: AISuggestionItem
}

const VALID_CONTEXTS: TaskContext[] = ['computer', 'phone', 'errands', 'home', 'anywhere']
const VALID_ENERGY: TaskEnergy[] = ['high', 'medium', 'low']
const VALID_TIME_ESTIMATES = [5, 15, 30, 60, 120]

function isValidContext(value: string): value is TaskContext {
  return VALID_CONTEXTS.includes(value as TaskContext)
}

function isValidEnergy(value: string): value is TaskEnergy {
  return VALID_ENERGY.includes(value as TaskEnergy)
}

function normalizeTimeEstimate(value: number): number {
  return VALID_TIME_ESTIMATES.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  )
}

function toString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value.toString()
  return fallback
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => toString(item))
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => toNumber(item))
}

const JSON_REGEX = /\{[\s\S]*\}/

function extractItem(data: Record<string, unknown>): AISuggestionItem {
  return {
    value: data['value'],
    confidence: data['confidence'],
    alternatives: data['alternatives'],
    reasoning: data['reasoning'],
  }
}

function parseSuggestionResponse(content: string): AISuggestionResponse {
  const jsonMatch = JSON_REGEX.exec(content)
  if (jsonMatch === null) {
    throw new Error('No valid JSON found in response')
  }

  const parsed = JSON.parse(jsonMatch[0]) as unknown

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid response structure')
  }

  const response = parsed as Record<string, unknown>

  const contextRaw = response['context']
  const energyRaw = response['energy']
  const timeRaw = response['timeEstimate']
  const projectRaw = response['project']

  const contextData = (
    typeof contextRaw === 'object' && contextRaw !== null ? contextRaw : {}
  ) as Record<string, unknown>
  const energyData = (
    typeof energyRaw === 'object' && energyRaw !== null ? energyRaw : {}
  ) as Record<string, unknown>
  const timeData = (typeof timeRaw === 'object' && timeRaw !== null ? timeRaw : {}) as Record<
    string,
    unknown
  >
  const projectData = (
    typeof projectRaw === 'object' && projectRaw !== null ? projectRaw : {}
  ) as Record<string, unknown>

  return {
    context: extractItem(contextData),
    energy: extractItem(energyData),
    timeEstimate: extractItem(timeData),
    project: extractItem(projectData),
  }
}

export async function suggestProperties(
  taskText: string,
  existingProjects: string[],
  model: string
): Promise<PropertySuggestions> {
  const prompt = PROPERTY_SUGGESTION_PROMPT.replace('{taskText}', taskText).replace(
    '{projects}',
    existingProjects.length > 0 ? existingProjects.join(', ') : 'none'
  )

  if (!aiService.isAvailable()) {
    throw new Error('AI service is not available')
  }

  const response = await aiService.chat(
    [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model
  )

  if (response === null || response.content === '') {
    throw new Error('Empty response from AI')
  }

  const content = response.content

  const parsed = parseSuggestionResponse(content)

  // Validate and normalize context
  const contextValueStr = toString(parsed.context.value, 'anywhere')
  const contextValue = isValidContext(contextValueStr) ? contextValueStr : 'anywhere'
  const contextAlternatives = toStringArray(parsed.context.alternatives).filter(isValidContext)

  // Validate and normalize energy
  const energyValueStr = toString(parsed.energy.value, 'medium')
  const energyValue = isValidEnergy(energyValueStr) ? energyValueStr : 'medium'
  const energyAlternatives = toStringArray(parsed.energy.alternatives).filter(isValidEnergy)

  // Normalize time estimate
  const timeValue = normalizeTimeEstimate(toNumber(parsed.timeEstimate.value, 30))
  const timeAlternatives = toNumberArray(parsed.timeEstimate.alternatives)
    .map(normalizeTimeEstimate)
    .filter((t, i, arr) => arr.indexOf(t) === i && t !== timeValue)

  // Project value
  const projectValueRaw = parsed.project.value
  const projectValue =
    projectValueRaw !== null && projectValueRaw !== undefined && projectValueRaw !== ''
      ? toString(projectValueRaw)
      : null

  // Project alternatives - filter out nulls
  const projectAlternatives = toStringArray(parsed.project.alternatives).filter(
    (a): a is string => a !== '' && a !== projectValue
  )

  return {
    context: {
      value: contextValue,
      confidence: Math.max(0, Math.min(1, toNumber(parsed.context.confidence, 0.5))),
      alternatives: contextAlternatives.filter((a) => a !== contextValue),
      reasoning:
        typeof parsed.context.reasoning === 'string' ? parsed.context.reasoning : undefined,
    },
    energy: {
      value: energyValue,
      confidence: Math.max(0, Math.min(1, toNumber(parsed.energy.confidence, 0.5))),
      alternatives: energyAlternatives.filter((a) => a !== energyValue),
      reasoning: typeof parsed.energy.reasoning === 'string' ? parsed.energy.reasoning : undefined,
    },
    timeEstimate: {
      value: timeValue,
      confidence: Math.max(0, Math.min(1, toNumber(parsed.timeEstimate.confidence, 0.5))),
      alternatives: timeAlternatives,
      reasoning:
        typeof parsed.timeEstimate.reasoning === 'string'
          ? parsed.timeEstimate.reasoning
          : undefined,
    },
    project: {
      value: projectValue,
      confidence: Math.max(0, Math.min(1, toNumber(parsed.project.confidence, 0.5))),
      alternatives: projectAlternatives,
      reasoning:
        typeof parsed.project.reasoning === 'string' ? parsed.project.reasoning : undefined,
    },
  }
}
