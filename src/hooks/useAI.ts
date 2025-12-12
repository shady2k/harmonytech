import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores'
import { extractFromText, type ExtractionResult } from '@/services/task-extractor'
import { processVoiceRecording, type VoiceProcessingResult } from '@/services/voice-processor'
import { suggestProperties, type PropertySuggestions } from '@/services/property-suggester'
import type { ExtractedTask, ExtractedThought, CurrentSuggestions } from '@/stores/capture.store'

interface UseAIReturn {
  // Task extraction
  extractTasks: (text: string) => Promise<ExtractionResult>

  // Voice processing
  processVoice: (audioBlob: Blob) => Promise<VoiceProcessingResult>

  // Property suggestions
  suggestTaskProperties: (
    taskText: string,
    existingProjects?: string[]
  ) => Promise<PropertySuggestions>

  // Convert extraction result to store format
  toExtractedItems: (result: ExtractionResult | VoiceProcessingResult) => Promise<{
    tasks: ExtractedTask[]
    thoughts: ExtractedThought[]
  }>

  // State
  isProcessing: boolean
  error: string | null
  clearError: () => void

  // API key status
  isApiKeyValid: boolean | null
  validateApiKey: () => Promise<boolean>
}

export function useAI(): UseAIReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { apiKey, textModel, voiceModel, isApiKeyValid, validateApiKey: storeValidateApiKey } = useSettingsStore()

  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    return storeValidateApiKey()
  }, [storeValidateApiKey])

  const extractTasks = useCallback(
    async (text: string): Promise<ExtractionResult> => {
      if (apiKey === null || apiKey === '') {
        throw new Error('API key not configured')
      }

      if (textModel === null || textModel === '') {
        throw new Error('Text model not configured. Please select a text model in Settings.')
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await extractFromText(text, apiKey, textModel)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to extract tasks'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [apiKey, textModel]
  )

  const processVoice = useCallback(
    async (audioBlob: Blob): Promise<VoiceProcessingResult> => {
      if (apiKey === null || apiKey === '') {
        throw new Error('API key not configured')
      }

      if (voiceModel === null || voiceModel === '') {
        throw new Error('Voice model not configured. Please select a voice model in Settings.')
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await processVoiceRecording(audioBlob, apiKey, voiceModel)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process voice'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [apiKey, voiceModel]
  )

  const suggestTaskProperties = useCallback(
    async (taskText: string, existingProjects: string[] = []): Promise<PropertySuggestions> => {
      if (apiKey === null || apiKey === '') {
        throw new Error('API key not configured')
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await suggestProperties(taskText, existingProjects, apiKey)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to suggest properties'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [apiKey]
  )

  const toExtractedItems = useCallback(
    async (
      result: ExtractionResult | VoiceProcessingResult
    ): Promise<{
      tasks: ExtractedTask[]
      thoughts: ExtractedThought[]
    }> => {
      if (apiKey === null || apiKey === '') {
        throw new Error('API key not configured')
      }

      setIsProcessing(true)
      setError(null)

      try {
        // Convert tasks with property suggestions
        const tasksWithSuggestions: ExtractedTask[] = await Promise.all(
          result.tasks.map(async (task) => {
            try {
              const suggestions = await suggestProperties(task.nextAction, [], apiKey)

              return {
                rawInput: task.rawInput,
                nextAction: task.nextAction,
                suggestions: {
                  suggestedContext: suggestions.context.value,
                  suggestedEnergy: suggestions.energy.value,
                  suggestedTimeEstimate: suggestions.timeEstimate.value,
                  suggestedProject: suggestions.project.value ?? undefined,
                  confidence: Math.min(
                    suggestions.context.confidence,
                    suggestions.energy.confidence,
                    suggestions.timeEstimate.confidence
                  ),
                  alternatives: {
                    context: suggestions.context.alternatives,
                    energy: suggestions.energy.alternatives,
                    timeEstimate: suggestions.timeEstimate.alternatives,
                  },
                },
              }
            } catch {
              // If suggestion fails, return task without suggestions
              return {
                rawInput: task.rawInput,
                nextAction: task.nextAction,
                suggestions: {},
              }
            }
          })
        )

        // Convert thoughts
        const thoughts: ExtractedThought[] = result.thoughts.map((thought) => ({
          content: thought.content,
          tags: 'suggestedTags' in thought ? thought.suggestedTags : [],
        }))

        return {
          tasks: tasksWithSuggestions,
          thoughts,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process items'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [apiKey]
  )

  return {
    extractTasks,
    processVoice,
    suggestTaskProperties,
    toExtractedItems,
    isProcessing,
    error,
    clearError,
    isApiKeyValid,
    validateApiKey,
  }
}

// Helper to convert PropertySuggestions to CurrentSuggestions format
export function toCurrentSuggestions(suggestions: PropertySuggestions): CurrentSuggestions {
  return {
    context: {
      value: suggestions.context.value,
      confidence: suggestions.context.confidence,
      alternatives: suggestions.context.alternatives,
    },
    energy: {
      value: suggestions.energy.value,
      confidence: suggestions.energy.confidence,
      alternatives: suggestions.energy.alternatives,
    },
    timeEstimate: {
      value: suggestions.timeEstimate.value,
      confidence: suggestions.timeEstimate.confidence,
      alternatives: suggestions.timeEstimate.alternatives,
    },
    project:
      suggestions.project.value !== null
        ? {
            value: suggestions.project.value,
            confidence: suggestions.project.confidence,
            alternatives: suggestions.project.alternatives.filter((a): a is string => a !== null),
          }
        : undefined,
  }
}
