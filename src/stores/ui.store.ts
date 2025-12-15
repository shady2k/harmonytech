import { create } from 'zustand'
import type { TaskContext, TaskEnergy } from '@/types/task'

export type ActiveView = 'home' | 'inbox' | 'tasks' | 'timers' | 'thoughts' | 'settings'
export type CaptureAssistMode = 'ai' | 'manual'
export type CaptureItemType = 'task' | 'thought' | 'both'

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
  captureAssistMode: CaptureAssistMode
  captureItemType: CaptureItemType

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
  openCaptureForTask: () => void
  openCaptureForThought: () => void
  closeCapture: () => void
  toggleCapture: () => void
  setCaptureAssistMode: (mode: CaptureAssistMode) => void
  setCaptureItemType: (type: CaptureItemType) => void

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
  activeView: 'home',
  isCaptureOpen: false,
  captureAssistMode: 'ai',
  captureItemType: 'thought',
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
    set({ isCaptureOpen: true, captureAssistMode: 'ai', captureItemType: 'thought' })
  },
  openCaptureForTask: (): void => {
    set({ isCaptureOpen: true, captureAssistMode: 'manual', captureItemType: 'task' })
  },
  openCaptureForThought: (): void => {
    set({ isCaptureOpen: true, captureAssistMode: 'manual', captureItemType: 'thought' })
  },
  closeCapture: (): void => {
    set({ isCaptureOpen: false, captureAssistMode: 'ai', captureItemType: 'thought' })
  },
  toggleCapture: (): void => {
    set((state) => ({ isCaptureOpen: !state.isCaptureOpen }))
  },
  setCaptureAssistMode: (mode): void => {
    set({ captureAssistMode: mode })
  },
  setCaptureItemType: (type): void => {
    set({ captureItemType: type })
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
