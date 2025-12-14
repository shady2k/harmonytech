import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores'
import { useTasks } from './useTasks'
import { getOpenRouterClient } from '@/services/openrouter'
import { WHAT_TO_DO_NEXT_PROMPT } from '@/lib/ai-prompts'
import { isTaskScheduledNow } from '@/lib/recurrence-utils'
import type { Task, TaskContext, TaskEnergy } from '@/types/task'

export interface RecommendationContext {
  energy: TaskEnergy
  timeAvailable: number
  location: TaskContext
}

export interface Recommendation {
  taskId: string
  task: Task | null
  reasoning: string
  matchScore: number
}

export interface RecommendationResult {
  recommendations: Recommendation[]
  alternativeActions: string[]
}

interface UseRecommendationsReturn {
  recommendations: Recommendation[]
  alternativeActions: string[]
  isLoading: boolean
  error: string | null
  getRecommendations: (context: RecommendationContext) => Promise<RecommendationResult>
  clearError: () => void
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

export function useRecommendations(): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [alternativeActions, setAlternativeActions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { apiKey } = useSettingsStore()
  const { tasks } = useTasks()

  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  const getRecommendations = useCallback(
    async (context: RecommendationContext): Promise<RecommendationResult> => {
      if (apiKey === null || apiKey === '') {
        throw new Error('API key not configured')
      }

      // Filter to incomplete tasks that are currently actionable
      const incompleteTasks = tasks.filter(
        (task) =>
          !task.isCompleted &&
          !task.isSomedayMaybe &&
          isTaskScheduledNow(task.scheduledStart, task.scheduledEnd)
      )

      if (incompleteTasks.length === 0) {
        const result: RecommendationResult = {
          recommendations: [],
          alternativeActions: ['No tasks available. Add some tasks to get recommendations!'],
        }
        setRecommendations([])
        setAlternativeActions(result.alternativeActions)
        return result
      }

      setIsLoading(true)
      setError(null)

      try {
        const client = getOpenRouterClient(apiKey)

        // Build the prompt with context
        const prompt = WHAT_TO_DO_NEXT_PROMPT.replace(
          '{timeAvailable}',
          String(context.timeAvailable)
        )
          .replace('{energyLevel}', context.energy)
          .replace('{context}', context.location)
          .replace('{tasks}', formatTasksForPrompt(incompleteTasks))

        const response = await client.chat(
          [
            {
              role: 'user',
              content: prompt,
            },
          ],
          'anthropic/claude-3.5-sonnet'
        )

        if (response.choices.length === 0) {
          throw new Error('Empty response from AI')
        }
        const content = response.choices[0].message.content
        if (content === '') {
          throw new Error('Empty response from AI')
        }

        const parsed = parseRecommendationResponse(content)

        // Map recommendations to include full task objects
        const mappedRecommendations: Recommendation[] = (parsed.recommendations ?? [])
          .slice(0, 3)
          .map((rec) => {
            const taskId = typeof rec.taskId === 'string' ? rec.taskId : ''
            const task = incompleteTasks.find((t) => t.id === taskId) ?? null

            return {
              taskId,
              task,
              reasoning: typeof rec.reasoning === 'string' ? rec.reasoning : '',
              matchScore: typeof rec.matchScore === 'number' ? rec.matchScore : 0,
            }
          })
          .filter((rec) => rec.task !== null)

        const mappedAlternatives: string[] = Array.isArray(parsed.alternativeActions)
          ? parsed.alternativeActions.filter((a): a is string => typeof a === 'string').slice(0, 3)
          : []

        setRecommendations(mappedRecommendations)
        setAlternativeActions(mappedAlternatives)

        return {
          recommendations: mappedRecommendations,
          alternativeActions: mappedAlternatives,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get recommendations'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, tasks]
  )

  return {
    recommendations,
    alternativeActions,
    isLoading,
    error,
    getRecommendations,
    clearError,
  }
}
