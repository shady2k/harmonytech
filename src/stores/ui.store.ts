import { create } from 'zustand'
import type { TaskContext, TaskEnergy } from '@/types/task'

export type ActiveView = 'inbox' | 'tasks' | 'thoughts' | 'settings'

export interface TaskFilters {
  context: TaskContext | null
  energy: TaskEnergy | null
  project: string | null
  showCompleted: boolean
}

interface UIState {
  // Navigation
  activeView: ActiveView

  // Capture modal
  isCaptureOpen: boolean

  // Processing state
  isProcessing: boolean

  // Task selection
  selectedTaskId: string | null

  // Task filters
  filters: TaskFilters
}

interface UIActions {
  // Navigation
  setActiveView: (view: ActiveView) => void

  // Capture modal
  openCapture: () => void
  closeCapture: () => void
  toggleCapture: () => void

  // Processing state
  setIsProcessing: (isProcessing: boolean) => void

  // Task selection
  selectTask: (taskId: string | null) => void
  clearSelection: () => void

  // Task filters
  setContextFilter: (context: TaskContext | null) => void
  setEnergyFilter: (energy: TaskEnergy | null) => void
  setProjectFilter: (project: string | null) => void
  setShowCompleted: (show: boolean) => void
  clearFilters: () => void

  // Reset
  reset: () => void
}

const initialState: UIState = {
  activeView: 'inbox',
  isCaptureOpen: false,
  isProcessing: false,
  selectedTaskId: null,
  filters: {
    context: null,
    energy: null,
    project: null,
    showCompleted: false,
  },
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialState,

  // Navigation
  setActiveView: (view): void => {
    set({ activeView: view })
  },

  // Capture modal
  openCapture: (): void => {
    set({ isCaptureOpen: true })
  },
  closeCapture: (): void => {
    set({ isCaptureOpen: false })
  },
  toggleCapture: (): void => {
    set((state) => ({ isCaptureOpen: !state.isCaptureOpen }))
  },

  // Processing state
  setIsProcessing: (isProcessing): void => {
    set({ isProcessing })
  },

  // Task selection
  selectTask: (taskId): void => {
    set({ selectedTaskId: taskId })
  },
  clearSelection: (): void => {
    set({ selectedTaskId: null })
  },

  // Task filters
  setContextFilter: (context): void => {
    set((state) => ({
      filters: { ...state.filters, context },
    }))
  },
  setEnergyFilter: (energy): void => {
    set((state) => ({
      filters: { ...state.filters, energy },
    }))
  },
  setProjectFilter: (project): void => {
    set((state) => ({
      filters: { ...state.filters, project },
    }))
  },
  setShowCompleted: (showCompleted): void => {
    set((state) => ({
      filters: { ...state.filters, showCompleted },
    }))
  },
  clearFilters: (): void => {
    set({
      filters: {
        context: null,
        energy: null,
        project: null,
        showCompleted: false,
      },
    })
  },

  // Reset
  reset: (): void => {
    set(initialState)
  },
}))
