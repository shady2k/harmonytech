/**
 * Auto-recommendations hook
 * Automatically fetches recommendations on mount with sensible defaults
 * Uses the unified useAI hook for caching
 */

import { useState, useCallback, useEffect } from 'react'
import { useTasks } from './useTasks'
import { useThoughts } from './useThoughts'
import { useAI } from './useAI'
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

  const { tasks } = useTasks()
  const { thoughts } = useThoughts()
  const { getRecommendations, isAIAvailable } = useAI()

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

      if (!isAIAvailable) {
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
        const result = await getRecommendations(incompleteTasks, {
          energy,
          timeAvailable,
          location,
        })

        // Map recommendations to include full task objects
        const mappedRecommendations: Recommendation[] = result.recommendations
          .map((rec) => {
            const task = incompleteTasks.find((t) => t.id === rec.taskId) ?? null
            return {
              taskId: rec.taskId,
              task,
              reasoning: rec.reasoning,
              matchScore: rec.matchScore,
            }
          })
          .filter((rec) => rec.task !== null)

        setRecommendations(mappedRecommendations)
        setAlternativeActions(result.alternativeActions)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get recommendations'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [isAIAvailable, tasks, getRecommendations]
  )

  // Auto-fetch on mount if AI is available
  useEffect(() => {
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
