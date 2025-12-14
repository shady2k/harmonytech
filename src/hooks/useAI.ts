import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores'
import { useAICacheStore } from '@/stores/ai-cache.store'
import { extractFromText, type ExtractionResult } from '@/services/task-extractor'
import { processVoiceRecording, type VoiceProcessingResult } from '@/services/voice-processor'
import { suggestProperties, type PropertySuggestions } from '@/services/property-suggester'
import {
  getRecommendations as getRecommendationsService,
  type RecommendationsResult,
  type RecommendationsContext,
} from '@/services/recommendations'
import { useAIStatus } from '@/hooks/useAIStatus'
import { extractionCacheKey, propertiesCacheKey, recommendationsCacheKey } from '@/lib/cache-utils'
import {
  CACHE_TTL_EXTRACTION,
  CACHE_TTL_PROPERTIES,
  CACHE_TTL_RECOMMENDATIONS,
} from '@/lib/constants/ai'
import type { CurrentSuggestions } from '@/stores/capture.store'
import type { Task } from '@/types/task'

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

  // Recommendations
  getRecommendations: (
    tasks: Task[],
    context: RecommendationsContext
  ) => Promise<RecommendationsResult>

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
    textModel,
    voiceModel,
    isApiKeyValid,
    validateApiKey: storeValidateApiKey,
  } = useSettingsStore()

  const cacheGet = useAICacheStore((state) => state.get)
  const cacheSet = useAICacheStore((state) => state.set)

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
      if (!isAIAvailable) {
        throw new Error('AI service not configured')
      }

      if (textModel === null || textModel === '') {
        throw new Error('Text model not configured. Please select a text model in Settings.')
      }

      // Check cache first
      const cacheKey = extractionCacheKey(text)
      const cached = cacheGet(cacheKey) as ExtractionResult | null
      if (cached !== null) {
        return cached
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await extractFromText(text, textModel)
        // Store in cache
        cacheSet(cacheKey, result, CACHE_TTL_EXTRACTION)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to extract tasks'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [textModel, cacheGet, cacheSet, isAIAvailable]
  )

  const processVoice = useCallback(
    async (audioBlob: Blob): Promise<VoiceProcessingResult> => {
      if (!isAIAvailable) {
        throw new Error('AI service not configured')
      }

      if (voiceModel === null || voiceModel === '') {
        throw new Error('Voice model not configured. Please select a voice model in Settings.')
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await processVoiceRecording(audioBlob, voiceModel)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to process voice'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [isAIAvailable, voiceModel]
  )

  const suggestTaskProperties = useCallback(
    async (taskText: string, existingProjects: string[] = []): Promise<PropertySuggestions> => {
      if (!isAIAvailable || textModel === null || textModel === '') {
        throw new Error('AI service not configured')
      }

      // Check cache first
      const cacheKey = propertiesCacheKey(taskText, existingProjects)
      const cached = cacheGet(cacheKey) as PropertySuggestions | null
      if (cached !== null) {
        return cached
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await suggestProperties(taskText, existingProjects, textModel)
        // Store in cache
        cacheSet(cacheKey, result, CACHE_TTL_PROPERTIES)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to suggest properties'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [textModel, cacheGet, cacheSet, isAIAvailable]
  )

  const getRecommendations = useCallback(
    async (tasks: Task[], context: RecommendationsContext): Promise<RecommendationsResult> => {
      if (!isAIAvailable || textModel === null || textModel === '') {
        throw new Error('AI service not configured')
      }

      // Check cache first
      const taskIds = tasks.map((t) => t.id)
      const cacheKey = recommendationsCacheKey(
        context.timeAvailable,
        context.energy,
        context.location,
        taskIds
      )
      const cached = cacheGet(cacheKey) as RecommendationsResult | null
      if (cached !== null) {
        return cached
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await getRecommendationsService(tasks, context, textModel)
        // Store in cache
        cacheSet(cacheKey, result, CACHE_TTL_RECOMMENDATIONS)
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get recommendations'
        setError(message)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    [textModel, cacheGet, cacheSet, isAIAvailable]
  )

  return {
    extractTasks,
    processVoice,
    suggestTaskProperties,
    getRecommendations,
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
