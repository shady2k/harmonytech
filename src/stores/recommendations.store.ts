import { create } from 'zustand'
import type { Task, TaskContext, TaskEnergy } from '@/types/task'

export interface Recommendation {
  taskId: string
  task: Task | null
  reasoning: string
  matchScore: number
}

interface RecommendationsContext {
  energy: TaskEnergy
  timeAvailable: number
  location: TaskContext
}

interface RecommendationsState {
  recommendations: Recommendation[]
  alternativeActions: string[]
  isLoading: boolean
  error: string | null
  lastFetchedAt: number | null
  lastContext: RecommendationsContext | null
  isStale: boolean
}

interface RecommendationsActions {
  setRecommendations: (
    recommendations: Recommendation[],
    alternativeActions: string[],
    context: RecommendationsContext
  ) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  markStale: () => void
  clear: () => void
}

const INITIAL_STATE: RecommendationsState = {
  recommendations: [],
  alternativeActions: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  lastContext: null,
  isStale: false,
}

export const useRecommendationsStore = create<RecommendationsState & RecommendationsActions>(
  (set) => ({
    ...INITIAL_STATE,

    setRecommendations: (
      recommendations: Recommendation[],
      alternativeActions: string[],
      context: RecommendationsContext
    ): void => {
      set({
        recommendations,
        alternativeActions,
        lastFetchedAt: Date.now(),
        lastContext: context,
        isStale: false,
        isLoading: false,
        error: null,
      })
    },

    setLoading: (isLoading: boolean): void => {
      set({ isLoading })
    },

    setError: (error: string | null): void => {
      set({ error, isLoading: false })
    },

    markStale: (): void => {
      set({ isStale: true })
    },

    clear: (): void => {
      set(INITIAL_STATE)
    },
  })
)
