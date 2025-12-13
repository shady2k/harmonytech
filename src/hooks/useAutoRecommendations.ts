/**
 * Auto-recommendations hook
 * Automatically fetches recommendations on mount with sensible defaults
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores'
import { useTasks } from './useTasks'
import { useThoughts } from './useThoughts'
import { getOpenRouterClient } from '@/services/openrouter'
import { WHAT_TO_DO_NEXT_PROMPT } from '@/lib/ai-prompts'
import type { Task, TaskContext, TaskEnergy } from '@/types/task'
import type { Thought } from '@/types/thought'

export interface Recommendation {
  taskId: string
  task: Task | null
  reasoning: string
  matchScore: number
}

export interface AutoRecommendationsResult {
  recommendations: Recommendation[]
  alternativeActions: string[]
}

interface UseAutoRecommendationsReturn {
  recommendations: Recommendation[]
  alternativeActions: string[]
  unprocessedThoughts: Thought[]
  recentThoughts: Thought[]
  isLoading: boolean
  error: string | null
  isAIAvailable: boolean
  refresh: (context?: {
    energy?: TaskEnergy
    timeAvailable?: number
    location?: TaskContext
  }) => Promise<void>
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
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

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

// Get current time of day to suggest appropriate energy level
function getDefaultEnergy(): TaskEnergy {
  const hour = new Date().getHours()
  if (hour >= 9 && hour < 12) return 'high' // Morning
  if (hour >= 12 && hour < 14) return 'medium' // After lunch
  if (hour >= 14 && hour < 17) return 'medium' // Afternoon
  return 'low' // Evening/night
}

export function useAutoRecommendations(): UseAutoRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [alternativeActions, setAlternativeActions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { apiKey, textModel, aiProvider } = useSettingsStore()
  const { tasks } = useTasks()
  const { thoughts } = useThoughts()

  const cacheRef = useRef<{
    timestamp: number
    recommendations: Recommendation[]
    alternativeActions: string[]
  } | null>(null)

  const isAIAvailable =
    apiKey !== null &&
    apiKey !== '' &&
    textModel !== null &&
    textModel !== '' &&
    aiProvider === 'openrouter'

  // Get unprocessed and recent thoughts for fallback UI
  const unprocessedThoughts = thoughts.filter((t) => !t.aiProcessed).slice(0, 5)
  const recentThoughts = thoughts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const refresh = useCallback(
    async (context?: {
      energy?: TaskEnergy
      timeAvailable?: number
      location?: TaskContext
    }): Promise<void> => {
      // Use smart defaults if no context provided
      const energy = context?.energy ?? getDefaultEnergy()
      const timeAvailable = context?.timeAvailable ?? 30 // Default 30 minutes
      const location = context?.location ?? 'anywhere' // Default anywhere

      if (apiKey === null || apiKey === '' || textModel === null || textModel === '') {
        setError(null) // Not an error, just not available
        return
      }

      // Filter to incomplete tasks only
      const incompleteTasks = tasks.filter((task) => !task.isCompleted && !task.isSomedayMaybe)

      if (incompleteTasks.length === 0) {
        setRecommendations([])
        setAlternativeActions(['No tasks available. Add some tasks to get recommendations!'])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const client = getOpenRouterClient(apiKey)

        // Build the prompt with context
        const prompt = WHAT_TO_DO_NEXT_PROMPT.replace('{timeAvailable}', String(timeAvailable))
          .replace('{energyLevel}', energy)
          .replace('{context}', location)
          .replace('{tasks}', formatTasksForPrompt(incompleteTasks))

        const response = await client.chat(
          [
            {
              role: 'user',
              content: prompt,
            },
          ],
          textModel
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

        // Cache the results
        cacheRef.current = {
          timestamp: Date.now(),
          recommendations: mappedRecommendations,
          alternativeActions: mappedAlternatives,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get recommendations'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, textModel, tasks]
  )

  // Auto-fetch on mount if AI is available
  useEffect(() => {
    // Check cache first
    if (cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_DURATION_MS) {
      setRecommendations(cacheRef.current.recommendations)
      setAlternativeActions(cacheRef.current.alternativeActions)
      return
    }

    if (isAIAvailable && tasks.length > 0) {
      void refresh()
    }
  }, [isAIAvailable, tasks.length, refresh])

  return {
    recommendations,
    alternativeActions,
    unprocessedThoughts,
    recentThoughts,
    isLoading,
    error,
    isAIAvailable,
    refresh,
  }
}
