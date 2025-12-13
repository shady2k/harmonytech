/**
 * Background AI processor hook
 * Watches for unprocessed thoughts and extracts tasks automatically
 * Handles graceful degradation when AI is unavailable
 * Supports confidence thresholds, retry logic, and offline detection
 * Uses the unified useAI hook for all AI operations
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import { useSettingsStore } from '@/stores/settings.store'
import { useAI } from './useAI'
import { logger } from '@/lib/logger'
import { RETRY_DELAYS, MAX_RETRIES } from '@/lib/constants/ai'
import type { Thought, ProcessingStatus } from '@/types/thought'
import type { ThoughtDocument } from '@/lib/database'

const log = logger.backgroundAI

const PROCESS_INTERVAL_MS = 5000 // Check every 5 seconds
const BATCH_SIZE = 3 // Process up to 3 thoughts at a time
const THROTTLE_DELAY_MS = 1000 // Delay between processing individual thoughts to avoid API spam

interface BackgroundAIState {
  pendingCount: number
  isProcessing: boolean
  lastProcessedAt: Date | null
  isOnline: boolean
}

// Track retry counts per thought (persists across renders)
const retryCountMap = new Map<string, number>()

export function useBackgroundAI(): BackgroundAIState {
  const { db } = useDatabaseContext()
  const { aiEnabled, aiConfidenceThreshold } = useSettingsStore()
  const { extractTasks, suggestTaskProperties, isAIAvailable } = useAI()
  const isProcessingRef = useRef(false)
  const [state, setState] = useState<BackgroundAIState>({
    pendingCount: 0,
    isProcessing: false,
    lastProcessedAt: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  })

  // Track online status
  useEffect(() => {
    const handleOnline = (): void => {
      log.info('Back online, will resume processing')
      setState((prev) => ({ ...prev, isOnline: true }))
    }
    const handleOffline = (): void => {
      log.info('Went offline, pausing processing')
      setState((prev) => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return (): void => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Helper to add delay between API calls
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }, [])

  // Helper to update thought processingStatus
  const updateProcessingStatus = useCallback(
    async (thoughtDoc: ThoughtDocument, status: ProcessingStatus): Promise<void> => {
      await thoughtDoc.patch({
        processingStatus: status,
        updatedAt: new Date().toISOString(),
      })
    },
    []
  )

  // Calculate overall confidence from property suggestions
  const calculateOverallConfidence = useCallback(
    (suggestions: {
      context: { confidence: number }
      energy: { confidence: number }
      timeEstimate: { confidence: number }
    }): number => {
      return (
        (suggestions.context.confidence +
          suggestions.energy.confidence +
          suggestions.timeEstimate.confidence) /
        3
      )
    },
    []
  )

  useEffect(() => {
    if (!db) return

    const processUnprocessedThoughts = async (): Promise<void> => {
      // Prevent concurrent processing
      if (isProcessingRef.current) return

      // Check if AI is enabled
      if (!aiEnabled) {
        log.debug('AI disabled, skipping background processing')
        return
      }

      // Check if online
      if (!navigator.onLine) {
        log.debug('Offline, skipping background processing')
        return
      }

      isProcessingRef.current = true
      setState((prev) => ({ ...prev, isProcessing: true }))

      try {
        // Find thoughts that need processing (unprocessed or failed with retries left)
        const unprocessedThoughts = await db.thoughts
          .find({
            selector: {
              processingStatus: { $in: ['unprocessed', 'failed'] },
            },
            limit: BATCH_SIZE,
          })
          .exec()

        // Filter out failed thoughts that have exceeded max retries
        const thoughtsToProcess = unprocessedThoughts.filter((doc) => {
          const thought = doc.toJSON() as Thought
          if (thought.processingStatus === 'failed') {
            const retryCount = retryCountMap.get(thought.id) ?? 0
            return retryCount < MAX_RETRIES
          }
          return true
        })

        setState((prev) => ({ ...prev, pendingCount: thoughtsToProcess.length }))

        // No work to do
        if (thoughtsToProcess.length === 0) {
          return
        }

        // Only check AI availability when there's work to do
        if (!isAIAvailable) {
          log.debug('AI not available, skipping', thoughtsToProcess.length, 'thoughts')
          return
        }

        // Process each thought with throttling to avoid API spam
        for (let i = 0; i < thoughtsToProcess.length; i++) {
          const thoughtDoc = thoughtsToProcess[i]
          await processThought(thoughtDoc)
          setState((prev) => ({
            ...prev,
            pendingCount: Math.max(0, prev.pendingCount - 1),
            lastProcessedAt: new Date(),
          }))

          // Add delay between processing to avoid API rate limiting
          if (i < thoughtsToProcess.length - 1) {
            await delay(THROTTLE_DELAY_MS)
          }
        }
      } catch {
        // Silently handle background processing errors
      } finally {
        isProcessingRef.current = false
        setState((prev) => ({ ...prev, isProcessing: false }))
      }
    }

    const processThought = async (thoughtDoc: ThoughtDocument): Promise<void> => {
      const thought = thoughtDoc.toJSON() as Thought
      const now = new Date().toISOString()

      // Set status to processing
      await updateProcessingStatus(thoughtDoc, 'processing')

      try {
        // Extract tasks from thought content using unified AI layer
        log.debug('Processing thought:', thought.content)
        const result = await extractTasks(thought.content)
        log.debug('Extraction result:', result)

        if (result.tasks.length === 0) {
          // No tasks found, mark as processed
          await thoughtDoc.patch({
            aiProcessed: true,
            processingStatus: 'processed',
            updatedAt: now,
          })
          // Clear retry count on success
          retryCountMap.delete(thought.id)
          return
        }

        // Create tasks with property suggestions
        const taskIds: string[] = []
        let overallConfidence = 1.0

        for (const extractedTask of result.tasks) {
          const taskId = `task-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`
          taskIds.push(taskId)

          // Get AI suggestions for task properties
          let context: 'computer' | 'phone' | 'errands' | 'home' | 'anywhere' = 'anywhere'
          let energy: 'high' | 'medium' | 'low' = 'medium'
          let timeEstimate = 15
          let project: string | undefined
          let taskConfidence = 1.0

          try {
            // Get AI suggestions using unified AI layer
            const suggestions = await suggestTaskProperties(extractedTask.nextAction, [])
            log.debug('Property suggestions:', suggestions)
            context = suggestions.context.value
            energy = suggestions.energy.value
            timeEstimate = suggestions.timeEstimate.value
            project = suggestions.project.value ?? undefined

            // Calculate confidence for this task
            taskConfidence = calculateOverallConfidence(suggestions)
            log.debug('Task confidence:', taskConfidence)
          } catch (err) {
            log.error('Failed to get property suggestions:', err)
            // Use defaults if suggestion fails, low confidence
            taskConfidence = 0.5
          }

          // Track minimum confidence across all tasks
          overallConfidence = Math.min(overallConfidence, taskConfidence)

          // Create the task with classification status based on confidence
          log.debug('Creating task:', {
            taskId,
            nextAction: extractedTask.nextAction,
            context,
            energy,
            timeEstimate,
            confidence: taskConfidence,
          })

          try {
            await db.tasks.insert({
              id: taskId,
              rawInput: extractedTask.rawInput,
              nextAction: extractedTask.nextAction,
              context,
              energy,
              timeEstimate,
              project,
              scheduledStart: extractedTask.scheduledStart,
              scheduledEnd: extractedTask.scheduledEnd,
              recurrence: extractedTask.recurrence,
              isSomedayMaybe: false,
              isCompleted: false,
              createdAt: now,
              updatedAt: now,
              sourceThoughtId: thought.id,
              classificationStatus:
                taskConfidence >= aiConfidenceThreshold ? 'classified' : 'pending',
              aiSuggestions: {
                suggestedContext: context,
                suggestedEnergy: energy,
                suggestedTimeEstimate: timeEstimate,
                suggestedProject: project,
                confidence: taskConfidence,
              },
            })
            log.debug('Task created successfully:', taskId)
          } catch (insertErr) {
            log.error('Failed to insert task:', insertErr)
            throw insertErr
          }
        }

        // Determine final processing status based on overall confidence
        const finalStatus: ProcessingStatus =
          overallConfidence >= aiConfidenceThreshold ? 'processed' : 'unprocessed'

        log.debug(
          'Overall confidence:',
          overallConfidence,
          'threshold:',
          aiConfidenceThreshold,
          'status:',
          finalStatus
        )

        // Update thought with linked tasks - get fresh doc to avoid revision conflict
        const freshThoughtDoc = await db.thoughts.findOne(thought.id).exec()
        if (freshThoughtDoc) {
          await freshThoughtDoc.patch({
            linkedTaskIds: [...freshThoughtDoc.linkedTaskIds, ...taskIds],
            aiProcessed: true,
            processingStatus: finalStatus,
            updatedAt: now,
          })
        }

        // Clear retry count on success
        retryCountMap.delete(thought.id)
      } catch (err) {
        // Handle error with retry logic
        log.error('Error processing thought:', err)

        const currentRetryCount = retryCountMap.get(thought.id) ?? 0
        const newRetryCount = currentRetryCount + 1

        if (newRetryCount >= MAX_RETRIES) {
          // Max retries reached, mark as failed permanently
          log.warn('Max retries reached for thought:', thought.id)
          await updateProcessingStatus(thoughtDoc, 'failed')
          retryCountMap.delete(thought.id)
        } else {
          // Schedule retry with exponential backoff
          retryCountMap.set(thought.id, newRetryCount)
          const retryDelay = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)]
          log.info(
            `Retry ${String(newRetryCount)}/${String(MAX_RETRIES)} for thought ${thought.id} in ${String(retryDelay)}ms`
          )

          // Mark as failed temporarily, will be picked up on next interval
          await updateProcessingStatus(thoughtDoc, 'failed')

          // Wait before allowing next retry
          await delay(retryDelay)
        }
      }
    }

    // Run immediately on mount
    void processUnprocessedThoughts()

    // Set up interval for periodic processing
    const intervalId = setInterval(() => {
      void processUnprocessedThoughts()
    }, PROCESS_INTERVAL_MS)

    return (): void => {
      clearInterval(intervalId)
    }
  }, [
    db,
    aiEnabled,
    aiConfidenceThreshold,
    isAIAvailable,
    extractTasks,
    suggestTaskProperties,
    delay,
    updateProcessingStatus,
    calculateOverallConfidence,
  ])

  return state
}
