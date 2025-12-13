/**
 * Background AI processor hook
 * Watches for unprocessed thoughts and extracts tasks automatically
 * Handles graceful degradation when AI is unavailable
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import { useSettingsStore } from '@/stores/settings.store'
import { extractFromText } from '@/services/task-extractor'
import { suggestProperties } from '@/services/property-suggester'
import type { Thought } from '@/types/thought'
import type { ThoughtDocument } from '@/lib/database'

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
  const { apiKey, textModel, aiProvider, getActiveApiKey, isApiKeyValid } = useSettingsStore()
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
        const activeKey = getActiveApiKey()
        // Skip if AI is not available
        if (
          activeKey === null ||
          activeKey === '' ||
          textModel === null ||
          textModel === '' ||
          isApiKeyValid !== true
        ) {
          // Count pending thoughts even when AI is unavailable
          const pendingThoughts = await db.thoughts
            .find({
              selector: { aiProcessed: false },
            })
            .exec()
          setState((prev) => ({
            ...prev,
            pendingCount: pendingThoughts.length,
            isProcessing: false,
          }))
          return
        }

        // Only process with OpenRouter for now (Yandex not implemented)
        if (aiProvider !== 'openrouter') {
          return
        }

        // Find unprocessed thoughts
        const unprocessedThoughts = await db.thoughts
          .find({
            selector: {
              aiProcessed: false,
            },
            limit: BATCH_SIZE,
          })
          .exec()

        setState((prev) => ({ ...prev, pendingCount: unprocessedThoughts.length }))

        if (unprocessedThoughts.length === 0) {
          return
        }

        // Process each thought with throttling to avoid API spam
        for (let i = 0; i < unprocessedThoughts.length; i++) {
          const thoughtDoc = unprocessedThoughts[i]
          await processThought(thoughtDoc, activeKey, textModel)
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

    const processThought = async (
      thoughtDoc: ThoughtDocument,
      apiKey: string,
      model: string
    ): Promise<void> => {
      const thought = thoughtDoc.toJSON() as Thought
      const now = new Date().toISOString()

      try {
        // Extract tasks from thought content
        const result = await extractFromText(thought.content, apiKey, model)

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
            const suggestions = await suggestProperties(extractedTask.nextAction, [], apiKey)
            context = suggestions.context.value
            energy = suggestions.energy.value
            timeEstimate = suggestions.timeEstimate.value
            project = suggestions.project.value ?? undefined
          } catch {
            // Use defaults if suggestion fails
          }

          // Create the task
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
        }

        // Update thought with linked tasks and mark as processed
        await thoughtDoc.patch({
          linkedTaskIds: [...thought.linkedTaskIds, ...taskIds],
          aiProcessed: true,
          updatedAt: now,
        })
      } catch {
        // Mark as processed to avoid infinite retry loop
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
  }, [db, apiKey, textModel, aiProvider, getActiveApiKey, isApiKeyValid, delay])

  return state
}
