/**
 * Auto-recommendations hook
 * Automatically fetches recommendations on mount with sensible defaults
 * Uses Zustand store to persist recommendations across view changes
 */

import { useCallback, useEffect, useRef, useMemo } from 'react'
import { useTasks } from './useTasks'
import { useThoughts } from './useThoughts'
import { useAI } from './useAI'
import { useIdleDetection } from './useIdleDetection'
import { useRecommendationsStore, type Recommendation } from '@/stores/recommendations.store'
import { aiService } from '@/services/ai'
import { isTaskScheduledNow } from '@/lib/recurrence-utils'
import type { TaskContext, TaskEnergy } from '@/types/task'
import type { Thought } from '@/types/thought'

export type { Recommendation } from '@/stores/recommendations.store'

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
  isPaused: boolean
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

// How long before we consider cached recommendations stale (30 seconds)
const FRESHNESS_THRESHOLD_MS = 30 * 1000

export function useAutoRecommendations(): UseAutoRecommendationsReturn {
  const { tasks } = useTasks()
  const { thoughts } = useThoughts()
  const { getRecommendations, isAIAvailable } = useAI()

  // Use store for persistent state
  const recommendations = useRecommendationsStore((state) => state.recommendations)
  const alternativeActions = useRecommendationsStore((state) => state.alternativeActions)
  const isLoading = useRecommendationsStore((state) => state.isLoading)
  const error = useRecommendationsStore((state) => state.error)
  const lastFetchedAt = useRecommendationsStore((state) => state.lastFetchedAt)
  const isStale = useRecommendationsStore((state) => state.isStale)
  const setRecommendations = useRecommendationsStore((state) => state.setRecommendations)
  const setLoading = useRecommendationsStore((state) => state.setLoading)
  const setError = useRecommendationsStore((state) => state.setError)
  const markStale = useRecommendationsStore((state) => state.markStale)

  // Track idle state to pause auto-refresh
  const { isIdle, isTabHidden } = useIdleDetection({
    onIdleChange: (idle): void => {
      // When returning from idle, mark stale to trigger fresh fetch
      if (!idle && lastFetchedAt !== null) {
        markStale()
      }
    },
  })

  const isPaused = isIdle || isTabHidden

  // Track previous task count to detect changes
  const prevTaskCountRef = useRef<number>(tasks.length)

  // Get unprocessed and recent thoughts for fallback UI
  const unprocessedThoughts = useMemo(
    () => thoughts.filter((t) => !t.aiProcessed).slice(0, 5),
    [thoughts]
  )
  const recentThoughts = useMemo(
    () =>
      [...thoughts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [thoughts]
  )

  // Filter to incomplete tasks that are currently actionable
  const incompleteTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !task.isCompleted &&
          !task.isSomedayMaybe &&
          isTaskScheduledNow(task.scheduledStart, task.scheduledEnd)
      ),
    [tasks]
  )

  const refresh = useCallback(
    async (
      context?: {
        energy?: TaskEnergy
        timeAvailable?: number
        location?: TaskContext
      },
      isBackgroundRefresh = false
    ): Promise<void> => {
      // Use smart defaults if no context provided
      const energy = context?.energy ?? getDefaultEnergy()
      const timeAvailable = context?.timeAvailable ?? 30 // Default 30 minutes
      const location = context?.location ?? 'anywhere' // Default anywhere

      // Check both context availability AND that provider is actually initialized
      if (!isAIAvailable || !aiService.isAvailable()) {
        setError(null) // Not an error, just not available yet
        return
      }

      if (incompleteTasks.length === 0) {
        setRecommendations([], ['No tasks available. Add some tasks to get recommendations!'], {
          energy,
          timeAvailable,
          location,
        })
        return
      }

      // Only show loading indicator for non-background refreshes
      if (!isBackgroundRefresh) {
        setLoading(true)
      }

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

        setRecommendations(mappedRecommendations, result.alternativeActions, {
          energy,
          timeAvailable,
          location,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get recommendations'
        setError(message)
      }
    },
    [isAIAvailable, incompleteTasks, getRecommendations, setRecommendations, setLoading, setError]
  )

  // Public refresh function (always shows loading)
  const publicRefresh = useCallback(
    async (context?: {
      energy?: TaskEnergy
      timeAvailable?: number
      location?: TaskContext
    }): Promise<void> => {
      await refresh(context, false)
    },
    [refresh]
  )

  // Mark as stale when task count changes
  useEffect(() => {
    if (prevTaskCountRef.current !== tasks.length && lastFetchedAt !== null) {
      markStale()
    }
    prevTaskCountRef.current = tasks.length
  }, [tasks.length, lastFetchedAt, markStale])

  // Auto-fetch on mount or when stale (skip if paused)
  useEffect(() => {
    // Skip auto-fetch when user is idle or tab is hidden
    if (isPaused) {
      return
    }

    if (!isAIAvailable || incompleteTasks.length === 0) {
      return
    }

    const hasCachedData = lastFetchedAt !== null && recommendations.length > 0
    const isFresh = lastFetchedAt !== null && Date.now() - lastFetchedAt < FRESHNESS_THRESHOLD_MS

    // If we have fresh data and it's not stale, skip fetch
    if (hasCachedData && isFresh && !isStale) {
      return
    }

    // Determine if this is a background refresh (we have cached data to show)
    const isBackgroundRefresh = hasCachedData

    // Defer to next tick to ensure AI provider is initialized
    const timer = setTimeout(() => {
      void refresh(undefined, isBackgroundRefresh)
    }, 50)

    return (): void => {
      clearTimeout(timer)
    }
  }, [
    isPaused,
    isAIAvailable,
    incompleteTasks.length,
    lastFetchedAt,
    isStale,
    recommendations.length,
    refresh,
  ])

  return {
    recommendations,
    alternativeActions,
    unprocessedThoughts,
    recentThoughts,
    isLoading,
    error,
    isAIAvailable,
    isPaused,
    refresh: publicRefresh,
  }
}
