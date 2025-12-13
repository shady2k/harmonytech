import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores'
import { extractFromText, type ExtractionResult } from '@/services/task-extractor'
import { processVoiceRecording, type VoiceProcessingResult } from '@/services/voice-processor'
import { suggestProperties, type PropertySuggestions } from '@/services/property-suggester'
import { aiService } from '@/services/ai'
import { useAIStatus } from '@/hooks/useAIStatus'
import type { CurrentSuggestions } from '@/stores/capture.store'

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

  // State
  isProcessing: boolean
  error: string | null
  clearError: () => void

  // API key status
  isApiKeyValid: boolean | null
  validateApiKey: () => Promise<boolean>

  // AI availability
  isAIAvailable: boolean
}

export function useAI(): UseAIReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    apiKey,
    textModel,
    voiceModel,
    isApiKeyValid,
    validateApiKey: storeValidateApiKey,
  } = useSettingsStore()

  // Get AI availability from context (provider is set there)
  const { isAIAvailable } = useAIStatus()

  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    return storeValidateApiKey()
  }, [storeValidateApiKey])

  const extractTasks = useCallback(
    async (text: string): Promise<ExtractionResult> => {
      if (!aiService.isAvailable()) {
        throw new Error('AI service not configured')
      }

      if (textModel === null || textModel === '') {
        throw new Error('Text model not configured. Please select a text model in Settings.')
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await extractFromText(text, textModel)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to extract tasks'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [textModel]
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
      if (!aiService.isAvailable() || textModel === null || textModel === '') {
        throw new Error('AI service not configured')
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await suggestProperties(taskText, existingProjects, textModel)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to suggest properties'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [textModel]
  )

  return {
    extractTasks,
    processVoice,
    suggestTaskProperties,
    isProcessing,
    error,
    clearError,
    isApiKeyValid,
    validateApiKey,
    isAIAvailable,
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
