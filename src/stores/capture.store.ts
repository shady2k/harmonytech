import { create } from 'zustand'
import type { Task, AISuggestions } from '@/types/task'

export type ProcessingState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'extracting'
  | 'suggesting'
  | 'done'

export interface ExtractedTask {
  rawInput: string
  nextAction: string
  suggestions: AISuggestions
}

export interface ExtractedThought {
  content: string
  tags: string[]
}

export interface ExtractedItems {
  tasks: ExtractedTask[]
  thoughts: ExtractedThought[]
}

export interface PropertySuggestion<T> {
  value: T
  confidence: number
  alternatives: T[]
}

export interface CurrentSuggestions {
  context?: PropertySuggestion<Task['context']>
  energy?: PropertySuggestion<Task['energy']>
  timeEstimate?: PropertySuggestion<number>
  project?: PropertySuggestion<string>
  deadline?: PropertySuggestion<string>
}

interface CaptureState {
  // Text input
  inputText: string

  // Voice recording
  isRecording: boolean
  recordingDuration: number
  audioBlob: Blob | null

  // Processing state
  processingState: ProcessingState

  // Extracted items
  extractedItems: ExtractedItems | null

  // Current suggestions for review
  currentSuggestions: CurrentSuggestions | null

  // Current item index being reviewed
  currentItemIndex: number

  // Error state
  error: string | null
}

interface CaptureActions {
  // Text input
  setInputText: (text: string) => void
  clearInput: () => void

  // Voice recording
  startRecording: () => void
  stopRecording: () => void
  setRecordingDuration: (duration: number) => void
  setAudioBlob: (blob: Blob | null) => void

  // Processing state
  setProcessingState: (state: ProcessingState) => void

  // Extracted items
  setExtractedItems: (items: ExtractedItems | null) => void
  addExtractedTask: (task: ExtractedTask) => void
  addExtractedThought: (thought: ExtractedThought) => void
  removeExtractedTask: (index: number) => void
  removeExtractedThought: (index: number) => void
  updateExtractedTask: (index: number, updates: Partial<ExtractedTask>) => void

  // Suggestions
  setCurrentSuggestions: (suggestions: CurrentSuggestions | null) => void
  acceptSuggestion: (property: keyof CurrentSuggestions, value: string | number) => void

  // Navigation
  setCurrentItemIndex: (index: number) => void
  nextItem: () => void
  previousItem: () => void

  // Error
  setError: (error: string | null) => void

  // Reset
  reset: () => void
  resetCapture: () => void
}

const initialState: CaptureState = {
  inputText: '',
  isRecording: false,
  recordingDuration: 0,
  audioBlob: null,
  processingState: 'idle',
  extractedItems: null,
  currentSuggestions: null,
  currentItemIndex: 0,
  error: null,
}

export const useCaptureStore = create<CaptureState & CaptureActions>((set, get) => ({
  ...initialState,

  // Text input
  setInputText: (inputText): void => {
    set({ inputText })
  },
  clearInput: (): void => {
    set({ inputText: '' })
  },

  // Voice recording
  startRecording: (): void => {
    set({ isRecording: true, recordingDuration: 0, audioBlob: null })
  },
  stopRecording: (): void => {
    set({ isRecording: false })
  },
  setRecordingDuration: (recordingDuration): void => {
    set({ recordingDuration })
  },
  setAudioBlob: (audioBlob): void => {
    set({ audioBlob })
  },

  // Processing state
  setProcessingState: (processingState): void => {
    set({ processingState })
  },

  // Extracted items
  setExtractedItems: (extractedItems): void => {
    set({ extractedItems })
  },
  addExtractedTask: (task): void => {
    set((state) => ({
      extractedItems: {
        tasks: [...(state.extractedItems?.tasks ?? []), task],
        thoughts: state.extractedItems?.thoughts ?? [],
      },
    }))
  },
  addExtractedThought: (thought): void => {
    set((state) => ({
      extractedItems: {
        tasks: state.extractedItems?.tasks ?? [],
        thoughts: [...(state.extractedItems?.thoughts ?? []), thought],
      },
    }))
  },
  removeExtractedTask: (index): void => {
    set((state) => {
      if (!state.extractedItems || index < 0 || index >= state.extractedItems.tasks.length) {
        return state
      }
      const newTasks = state.extractedItems.tasks.filter((_, i) => i !== index)
      const totalItems = newTasks.length + state.extractedItems.thoughts.length
      const newCurrentIndex = Math.min(state.currentItemIndex, Math.max(0, totalItems - 1))
      return {
        extractedItems: {
          tasks: newTasks,
          thoughts: state.extractedItems.thoughts,
        },
        currentItemIndex: totalItems === 0 ? 0 : newCurrentIndex,
      }
    })
  },
  removeExtractedThought: (index): void => {
    set((state) => {
      if (!state.extractedItems || index < 0 || index >= state.extractedItems.thoughts.length) {
        return state
      }
      const newThoughts = state.extractedItems.thoughts.filter((_, i) => i !== index)
      const totalItems = state.extractedItems.tasks.length + newThoughts.length
      const newCurrentIndex = Math.min(state.currentItemIndex, Math.max(0, totalItems - 1))
      return {
        extractedItems: {
          tasks: state.extractedItems.tasks,
          thoughts: newThoughts,
        },
        currentItemIndex: totalItems === 0 ? 0 : newCurrentIndex,
      }
    })
  },
  updateExtractedTask: (index, updates): void => {
    set((state) => ({
      extractedItems: state.extractedItems
        ? {
            tasks: state.extractedItems.tasks.map((task, i) =>
              i === index ? { ...task, ...updates } : task
            ),
            thoughts: state.extractedItems.thoughts,
          }
        : null,
    }))
  },

  // Suggestions
  setCurrentSuggestions: (currentSuggestions): void => {
    set({ currentSuggestions })
  },
  acceptSuggestion: (property, value): void => {
    set((state) => {
      if (!state.currentSuggestions) return state

      const currentSuggestion = state.currentSuggestions[property]
      if (!currentSuggestion) return state

      return {
        currentSuggestions: {
          ...state.currentSuggestions,
          [property]: {
            ...currentSuggestion,
            value,
            confidence: 1, // User accepted, so confidence is 100%
          },
        },
      }
    })
  },

  // Navigation
  setCurrentItemIndex: (currentItemIndex): void => {
    set({ currentItemIndex })
  },
  nextItem: (): void => {
    const { currentItemIndex, extractedItems } = get()
    if (!extractedItems) return
    const totalItems = extractedItems.tasks.length + extractedItems.thoughts.length
    if (totalItems === 0) return
    const nextIndex = Math.min(currentItemIndex + 1, totalItems - 1)
    if (nextIndex !== currentItemIndex) {
      set({ currentItemIndex: nextIndex })
    }
  },
  previousItem: (): void => {
    const { currentItemIndex } = get()
    const prevIndex = Math.max(currentItemIndex - 1, 0)
    if (prevIndex !== currentItemIndex) {
      set({ currentItemIndex: prevIndex })
    }
  },

  // Error
  setError: (error): void => {
    set({ error })
  },

  // Reset
  reset: (): void => {
    set(initialState)
  },
  resetCapture: (): void => {
    set({
      inputText: '',
      isRecording: false,
      recordingDuration: 0,
      audioBlob: null,
      processingState: 'idle',
      error: null,
    })
  },
}))
