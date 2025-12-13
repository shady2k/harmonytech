import { aiService } from './ai'
import { WHAT_TO_DO_NEXT_PROMPT } from '@/lib/ai-prompts'
import type { Task, TaskContext, TaskEnergy } from '@/types/task'

export interface RecommendationItem {
  taskId: string
  reasoning: string
  matchScore: number
}

export interface RecommendationsResult {
  recommendations: RecommendationItem[]
  alternativeActions: string[]
}

interface AIRecommendation {
  taskId?: unknown
  reasoning?: unknown
  matchScore?: unknown
}

interface AIRecommendationResponse {
  recommendations?: AIRecommendation[]
  alternativeActions?: unknown[]
}

const JSON_REGEX = /\{[\s\S]*\}/

function parseRecommendationResponse(content: string): AIRecommendationResponse {
  const jsonMatch = JSON_REGEX.exec(content)
  if (jsonMatch === null) {
    throw new Error('No valid JSON found in response')
  }

  const parsed = JSON.parse(jsonMatch[0]) as unknown

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid response structure')
  }

  return parsed as AIRecommendationResponse
}

function formatTasksForPrompt(tasks: Task[]): string {
  return tasks
    .map(
      (task) =>
        `- ID: ${task.id}
  Action: ${task.nextAction}
  Context: ${task.context}
  Energy: ${task.energy}
  Time: ${String(task.timeEstimate)} min
  Deadline: ${task.deadline ?? 'None'}
  Project: ${task.project ?? 'None'}`
    )
    .join('\n\n')
}

export interface RecommendationsContext {
  energy: TaskEnergy
  timeAvailable: number
  location: TaskContext
}

export async function getRecommendations(
  tasks: Task[],
  context: RecommendationsContext,
  model: string
): Promise<RecommendationsResult> {
  if (tasks.length === 0) {
    return {
      recommendations: [],
      alternativeActions: ['No tasks available. Add some tasks to get recommendations!'],
    }
  }

  if (!aiService.isAvailable()) {
    throw new Error('AI service is not available')
  }

  const prompt = WHAT_TO_DO_NEXT_PROMPT.replace('{timeAvailable}', String(context.timeAvailable))
    .replace('{energyLevel}', context.energy)
    .replace('{context}', context.location)
    .replace('{tasks}', formatTasksForPrompt(tasks))

  const response = await aiService.chat(
    [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model
  )

  if (response === null) {
    throw new Error('AI service not available')
  }

  if (response.content === '') {
    throw new Error('Empty response from AI')
  }

  const parsed = parseRecommendationResponse(response.content)

  const recommendations: RecommendationItem[] = (parsed.recommendations ?? [])
    .slice(0, 3)
    .map((rec) => ({
      taskId: typeof rec.taskId === 'string' ? rec.taskId : '',
      reasoning: typeof rec.reasoning === 'string' ? rec.reasoning : '',
      matchScore: typeof rec.matchScore === 'number' ? rec.matchScore : 0,
    }))
    .filter((rec) => rec.taskId !== '')

  const alternativeActions: string[] = Array.isArray(parsed.alternativeActions)
    ? parsed.alternativeActions.filter((a): a is string => typeof a === 'string').slice(0, 3)
    : []

  return {
    recommendations,
    alternativeActions,
  }
}
