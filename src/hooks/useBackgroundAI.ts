/**
 * Background AI processor hook
 * Watches for unprocessed thoughts and extracts tasks automatically
 * Handles graceful degradation when AI is unavailable
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import { useSettingsStore } from '@/stores/settings.store'
import { aiService } from '@/services/ai'
import { extractFromText } from '@/services/task-extractor'
import { suggestProperties } from '@/services/property-suggester'
import { logger } from '@/lib/logger'
import type { Thought } from '@/types/thought'
import type { ThoughtDocument } from '@/lib/database'

const log = logger.backgroundAI

const PROCESS_INTERVAL_MS = 5000 // Check every 5 seconds
const BATCH_SIZE = 3 // Process up to 3 thoughts at a time
const THROTTLE_DELAY_MS = 1000 // Delay between processing individual thoughts to avoid API spam

interface BackgroundAIState {
  pendingCount: number
  isProcessing: boolean
  lastProcessedAt: Date | null
}

export function useBackgroundAI(): BackgroundAIState {
  const { db } = useDatabaseContext()
  const { textModel } = useSettingsStore()
  const isProcessingRef = useRef(false)
  const [state, setState] = useState<BackgroundAIState>({
    pendingCount: 0,
    isProcessing: false,
    lastProcessedAt: null,
  })

  // Helper to add delay between API calls
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }, [])

  useEffect(() => {
    if (!db) return

    const processUnprocessedThoughts = async (): Promise<void> => {
      // Prevent concurrent processing
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      setState((prev) => ({ ...prev, isProcessing: true }))

      try {
        // First check if there are any unprocessed thoughts
        const unprocessedThoughts = await db.thoughts
          .find({
            selector: {
              aiProcessed: false,
            },
            limit: BATCH_SIZE,
          })
          .exec()

        setState((prev) => ({ ...prev, pendingCount: unprocessedThoughts.length }))

        // No work to do
        if (unprocessedThoughts.length === 0) {
          return
        }

        // Only check AI availability when there's work to do
        if (!aiService.isAvailable() || textModel === null || textModel === '') {
          log.debug('AI not available, skipping', unprocessedThoughts.length, 'thoughts')
          return
        }

        // Process each thought with throttling to avoid API spam
        for (let i = 0; i < unprocessedThoughts.length; i++) {
          const thoughtDoc = unprocessedThoughts[i]
          await processThought(thoughtDoc, textModel)
          setState((prev) => ({
            ...prev,
            pendingCount: Math.max(0, prev.pendingCount - 1),
            lastProcessedAt: new Date(),
          }))

          // Add delay between processing to avoid API rate limiting
          if (i < unprocessedThoughts.length - 1) {
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

    const processThought = async (thoughtDoc: ThoughtDocument, model: string): Promise<void> => {
      const thought = thoughtDoc.toJSON() as Thought
      const now = new Date().toISOString()

      try {
        // Extract tasks from thought content
        log.debug('Processing thought:', thought.content)
        const result = await extractFromText(thought.content, model)
        log.debug('Extraction result:', result)

        if (result.tasks.length === 0) {
          // No tasks found, just mark as processed
          await thoughtDoc.patch({
            aiProcessed: true,
            updatedAt: now,
          })
          return
        }

        // Create tasks with property suggestions
        const taskIds: string[] = []

        for (const extractedTask of result.tasks) {
          const taskId = `task-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`
          taskIds.push(taskId)

          // Get AI suggestions for task properties
          let context: 'computer' | 'phone' | 'errands' | 'home' | 'anywhere' = 'anywhere'
          let energy: 'high' | 'medium' | 'low' = 'medium'
          let timeEstimate = 15
          let project: string | undefined

          try {
            const suggestions = await suggestProperties(extractedTask.nextAction, [], model)
            log.debug('Property suggestions:', suggestions)
            context = suggestions.context.value
            energy = suggestions.energy.value
            timeEstimate = suggestions.timeEstimate.value
            project = suggestions.project.value ?? undefined
          } catch (err) {
            log.error('Failed to get property suggestions:', err)
            // Use defaults if suggestion fails
          }

          // Create the task
          log.debug('Creating task:', {
            taskId,
            nextAction: extractedTask.nextAction,
            context,
            energy,
            timeEstimate,
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
              isSomedayMaybe: false,
              isCompleted: false,
              createdAt: now,
              updatedAt: now,
              sourceThoughtId: thought.id,
            })
            log.debug('Task created successfully:', taskId)
          } catch (insertErr) {
            log.error('Failed to insert task:', insertErr)
            throw insertErr
          }
        }

        // Update thought with linked tasks and mark as processed
        await thoughtDoc.patch({
          linkedTaskIds: [...thought.linkedTaskIds, ...taskIds],
          aiProcessed: true,
          updatedAt: now,
        })
      } catch (err) {
        // Mark as processed to avoid infinite retry loop
        log.error('Error processing thought:', err)
        await thoughtDoc.patch({
          aiProcessed: true,
          updatedAt: now,
        })
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
  }, [db, textModel, delay])

  return state
}
