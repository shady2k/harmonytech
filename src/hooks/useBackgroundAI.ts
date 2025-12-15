/**
 * Background AI processor hook
 * Watches for unprocessed thoughts and extracts tasks automatically
 * Handles graceful degradation when AI is unavailable
 * Supports confidence thresholds, retry logic, and offline detection
 * Uses the global AI queue to ensure only one AI request runs at a time
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { db } from '@/lib/dexie-database'
import { getDeviceId } from '@/lib/sync'
import { useSettingsStore } from '@/stores/settings.store'
import { useAI } from './useAI'
import { logger } from '@/lib/logger'
import { aiQueue } from '@/lib/ai-queue'
import { RETRY_DELAYS, MAX_RETRIES } from '@/lib/constants/ai'
import { resolveExtractedTaskDates } from '@/lib/date-resolver'
import type { Thought, ProcessingStatus } from '@/types/thought'
import type { VoiceRecording } from '@/types/voice-recording'

const log = logger.backgroundAI

const PROCESS_INTERVAL_MS = 5000 // Check every 5 seconds

interface BackgroundAIState {
  pendingCount: number
  isProcessing: boolean
  lastProcessedAt: Date | null
  isOnline: boolean
}

// Track retry counts per thought (persists across renders)
const retryCountMap = new Map<string, number>()

// Track last config error time to avoid spamming on config issues
let lastConfigErrorTime = 0
const CONFIG_ERROR_COOLDOWN_MS = 30000 // Wait 30s before retrying after config error

export function useBackgroundAI(): BackgroundAIState {
  const { aiEnabled, aiConfidenceThreshold } = useSettingsStore()
  const { extractTasks, processVoice, isAIAvailable } = useAI()
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

  // Helper to update thought processingStatus
  const updateProcessingStatus = useCallback(
    async (thoughtId: string, status: ProcessingStatus): Promise<void> => {
      await db.thoughts.update(thoughtId, {
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

  // Classify STT errors as temporary (retry) or permanent (no retry)
  const isTemporaryError = useCallback((errorMessage: string): boolean => {
    const temporaryPatterns = [
      'timeout',
      'network',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'fetch failed',
      'rate limit',
      '429',
      '503',
      '502',
      '504',
    ]
    const lowerMessage = errorMessage.toLowerCase()
    return temporaryPatterns.some((pattern) => lowerMessage.includes(pattern.toLowerCase()))
  }, [])

  // Process pending voice recordings
  const processVoiceRecording = useCallback(
    async (recording: VoiceRecording): Promise<void> => {
      const now = new Date().toISOString()
      const currentRetryCount = recording.retryCount ?? 0

      // Update recording status to transcribing
      await db.voiceRecordings.update(recording.id, {
        status: 'transcribing',
      })

      try {
        // Convert base64 back to blob for processing
        const binaryString = atob(recording.audioData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const audioBlob = new Blob([bytes], { type: recording.mimeType })

        // Transcribe via AI queue
        log.debug('Transcribing voice recording:', recording.id)
        const result = await aiQueue.enqueue(() => processVoice(audioBlob), 0) // High priority

        log.debug('Transcription result:', result.transcript.substring(0, 100))

        // Create a new thought from the transcript
        const thoughtId = `thought-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`
        await db.thoughts.add({
          id: thoughtId,
          content: result.transcript,
          tags: [],
          linkedTaskIds: [],
          aiProcessed: false,
          processingStatus: 'unprocessed', // Will be processed for task extraction
          sourceRecordingId: recording.id,
          createdAt: now,
          updatedAt: now,
          createdByDeviceId: recording.createdByDeviceId,
        })

        // Mark recording as completed with link to created thought
        await db.voiceRecordings.update(recording.id, {
          status: 'completed',
          transcript: result.transcript,
          linkedThoughtId: thoughtId,
          processedAt: now,
          retryCount: 0, // Reset retry count on success
        })

        log.debug('Voice recording processed successfully:', recording.id, '-> thought:', thoughtId)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Transcription failed'
        log.error('Voice transcription error:', errorMessage)

        // Check if this is a temporary error that should be retried
        if (isTemporaryError(errorMessage) && currentRetryCount < MAX_RETRIES) {
          // Schedule retry by keeping status as pending with incremented retry count
          const retryDelay = RETRY_DELAYS[Math.min(currentRetryCount, RETRY_DELAYS.length - 1)]
          log.info(
            `Temporary STT error, retry ${String(currentRetryCount + 1)}/${String(MAX_RETRIES)} in ${String(retryDelay)}ms`
          )

          await db.voiceRecordings.update(recording.id, {
            status: 'pending', // Back to pending for retry
            retryCount: currentRetryCount + 1,
            errorMessage,
          })
        } else {
          // Permanent failure - mark as failed, user can retry via inbox
          await db.voiceRecordings.update(recording.id, {
            status: 'failed',
            errorMessage,
            retryCount: currentRetryCount,
          })
        }
      }
    },
    [processVoice, isTemporaryError]
  )

  useEffect(() => {
    const processUnprocessedThoughts = async (): Promise<void> => {
      // Prevent concurrent processing runs
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
        // Get current device ID - only process thoughts created by THIS device
        const currentDeviceId = getDeviceId()

        // Find ONE thought that needs processing (queue handles serialization)
        // Only process thoughts created by this device to prevent duplicate processing across synced devices
        const unprocessedThoughts = await db.thoughts
          .where('processingStatus')
          .anyOf(['unprocessed', 'failed'])
          .filter((thought) => thought.createdByDeviceId === currentDeviceId)
          .limit(1)
          .toArray()

        // Filter out failed thoughts that have exceeded max retries
        const thoughtsToProcess = unprocessedThoughts.filter((thought) => {
          if (thought.processingStatus === 'failed') {
            const retryCount = retryCountMap.get(thought.id) ?? 0
            return retryCount < MAX_RETRIES
          }
          return true
        })

        // Count total pending for UI (only this device's thoughts)
        const totalPending = await db.thoughts
          .where('processingStatus')
          .anyOf(['unprocessed', 'failed'])
          .filter((thought) => thought.createdByDeviceId === currentDeviceId)
          .count()

        setState((prev) => ({ ...prev, pendingCount: totalPending }))

        // Check for pending voice recordings first (only on this device)
        const pendingRecordings = await db.voiceRecordings
          .where('status')
          .equals('pending')
          .filter((recording) => recording.createdByDeviceId === currentDeviceId)
          .limit(1)
          .toArray()

        const hasWork = thoughtsToProcess.length > 0 || pendingRecordings.length > 0

        // No work to do
        if (!hasWork) {
          return
        }

        // Only check AI availability when there's work to do
        if (!isAIAvailable) {
          log.debug('AI not available, skipping processing')
          return
        }

        // Check config error cooldown
        if (Date.now() - lastConfigErrorTime < CONFIG_ERROR_COOLDOWN_MS) {
          log.debug('Config error cooldown active, skipping processing')
          return
        }

        // Process voice recordings first (higher priority)
        if (pendingRecordings.length > 0) {
          await processVoiceRecording(pendingRecordings[0])
          return // Process one item at a time
        }

        // Process the thought (one at a time)
        const thought = thoughtsToProcess[0]
        await processThought(thought)
        setState((prev) => ({
          ...prev,
          pendingCount: Math.max(0, totalPending - 1),
          lastProcessedAt: new Date(),
        }))
      } catch {
        // Silently handle background processing errors
      } finally {
        isProcessingRef.current = false
        setState((prev) => ({ ...prev, isProcessing: false }))
      }
    }

    const processThought = async (thought: Thought): Promise<void> => {
      const now = new Date().toISOString()

      // Set status to processing
      await updateProcessingStatus(thought.id, 'processing')

      try {
        // Extract tasks via the global AI queue (ensures one request at a time)
        log.debug('Processing thought:', thought.content)
        const result = await aiQueue.enqueue(
          () => extractTasks(thought.content),
          1 // Normal priority for background tasks
        )
        log.debug('Extraction result:', result)

        // Filter to only actionable tasks with a valid nextAction
        const actionableTasks = result.tasks.filter(
          (task) => task.isActionable && task.nextAction.trim() !== ''
        )

        if (actionableTasks.length === 0) {
          // No actionable tasks found, mark as processed
          await db.thoughts.update(thought.id, {
            aiProcessed: true,
            processingStatus: 'processed',
            updatedAt: now,
          })
          // Clear retry count on success
          retryCountMap.delete(thought.id)
          return
        }

        // Create tasks with property suggestions (now extracted in single AI call)
        const taskIds: string[] = []
        let overallConfidence = 1.0

        for (const extractedTask of actionableTasks) {
          const taskId = `task-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`
          taskIds.push(taskId)

          // Use properties from extraction (single AI call)
          const props = extractedTask.properties
          const context = props?.context ?? 'anywhere'
          const energy = props?.energy ?? 'medium'
          const timeEstimate = props?.timeEstimate ?? 15
          const project: string | undefined = undefined // Project suggestion removed from single call
          // Properties are extracted in the same call, so confidence is high if present
          const taskConfidence = props !== undefined ? 0.8 : 0.5

          log.debug('Extracted properties:', { context, energy, timeEstimate })

          // Track minimum confidence across all tasks
          overallConfidence = Math.min(overallConfidence, taskConfidence)

          // Calculate actual dates from semantic anchors
          // AI extracts meaning, we calculate dates (AI doesn't have a calendar)
          const resolvedDates = resolveExtractedTaskDates(
            extractedTask.dateAnchor,
            extractedTask.dateAnchorEnd,
            extractedTask.recurrence
          )

          // Create the task with classification status based on confidence
          log.debug('Creating task:', {
            taskId,
            nextAction: extractedTask.nextAction,
            context,
            energy,
            timeEstimate,
            confidence: taskConfidence,
            resolvedDates,
          })

          try {
            await db.tasks.add({
              id: taskId,
              rawInput: extractedTask.rawInput,
              nextAction: extractedTask.nextAction,
              context,
              energy,
              timeEstimate,
              project,
              scheduledStart: resolvedDates?.scheduledStart,
              scheduledEnd: resolvedDates?.scheduledEnd ?? undefined,
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

        // Always mark as processed if tasks were created
        // The confidence threshold only affects classificationStatus on tasks (for user review)
        // We should NOT retry processing - that would create duplicate tasks
        const finalStatus: ProcessingStatus = 'processed'

        log.debug(
          'Overall confidence:',
          overallConfidence,
          'threshold:',
          aiConfidenceThreshold,
          'status:',
          finalStatus,
          'tasks created:',
          taskIds.length
        )

        // Update thought with linked tasks
        const freshThought = await db.thoughts.get(thought.id)
        if (freshThought) {
          await db.thoughts.update(thought.id, {
            linkedTaskIds: [...freshThought.linkedTaskIds, ...taskIds],
            aiProcessed: true,
            processingStatus: finalStatus,
            updatedAt: now,
          })
        }

        // Clear retry count on success
        retryCountMap.delete(thought.id)
      } catch (err) {
        // Handle error with appropriate strategy
        const errorMessage = err instanceof Error ? err.message : String(err)
        log.error('Error processing thought:', errorMessage)

        // Configuration errors should not retry - they won't fix themselves
        const isConfigError =
          errorMessage.includes('not configured') ||
          errorMessage.includes('API key') ||
          errorMessage.includes('not available')

        if (isConfigError) {
          // Mark as unprocessed so it can be retried when config is fixed
          // Set cooldown to avoid spamming
          lastConfigErrorTime = Date.now()
          log.warn('Config error, will retry in 30s when AI is properly configured')
          await updateProcessingStatus(thought.id, 'unprocessed')
          return
        }

        // For transient errors (network, API rate limits, etc.), use retry logic
        const currentRetryCount = retryCountMap.get(thought.id) ?? 0
        const newRetryCount = currentRetryCount + 1

        if (newRetryCount >= MAX_RETRIES) {
          // Max retries reached, mark as failed permanently
          // Keep the retry count so this thought is filtered out on future queries
          log.warn('Max retries reached for thought:', thought.id)
          retryCountMap.set(thought.id, newRetryCount)
          await updateProcessingStatus(thought.id, 'failed')
        } else {
          // Schedule retry - just mark as failed, next interval will pick it up
          retryCountMap.set(thought.id, newRetryCount)
          const retryDelay = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)]
          log.info(
            `Retry ${String(newRetryCount)}/${String(MAX_RETRIES)} for thought ${thought.id} in ${String(retryDelay)}ms`
          )

          // Mark as failed temporarily, will be picked up on next interval
          await updateProcessingStatus(thought.id, 'failed')
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
    aiEnabled,
    aiConfidenceThreshold,
    isAIAvailable,
    extractTasks,
    processVoiceRecording,
    updateProcessingStatus,
    calculateOverallConfidence,
  ])

  return state
}
