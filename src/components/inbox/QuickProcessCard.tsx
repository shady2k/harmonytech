import { useState, type ReactElement } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'
import type { Thought } from '@/types/thought'

interface QuickProcessCardProps {
  thought: Thought
}

export function QuickProcessCard({ thought }: QuickProcessCardProps): ReactElement {
  const { db } = useDatabaseContext()
  const [isProcessing, setIsProcessing] = useState(false)

  const isFailedState = thought.processingStatus === 'failed'
  const isProcessingState = thought.processingStatus === 'processing'

  const handleApprove = async (): Promise<void> => {
    if (db === null) return
    setIsProcessing(true)

    try {
      const doc = await db.thoughts.findOne(thought.id).exec()
      if (doc) {
        await doc.patch({
          processingStatus: 'processed',
          updatedAt: new Date().toISOString(),
        })

        // Also update any linked tasks to 'classified'
        for (const taskId of thought.linkedTaskIds) {
          const taskDoc = await db.tasks.findOne(taskId).exec()
          if (taskDoc) {
            await taskDoc.patch({
              classificationStatus: 'classified',
              updatedAt: new Date().toISOString(),
            })
          }
        }

        trackEvent(AnalyticsEvents.AI_EXTRACTION_APPROVED, {
          thoughtId: thought.id,
          linkedTaskCount: thought.linkedTaskIds.length,
          modified: false,
        })
      }
    } catch {
      // Handle error silently
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismiss = async (): Promise<void> => {
    if (db === null) return
    setIsProcessing(true)

    try {
      const doc = await db.thoughts.findOne(thought.id).exec()
      if (doc) {
        await doc.patch({
          processingStatus: 'processed',
          updatedAt: new Date().toISOString(),
        })

        trackEvent(AnalyticsEvents.AI_EXTRACTION_REJECTED, {
          thoughtId: thought.id,
          linkedTaskCount: thought.linkedTaskIds.length,
        })
      }
    } catch {
      // Handle error silently
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = async (): Promise<void> => {
    if (db === null) return
    setIsProcessing(true)

    try {
      const doc = await db.thoughts.findOne(thought.id).exec()
      if (doc) {
        await doc.patch({
          processingStatus: 'unprocessed',
          updatedAt: new Date().toISOString(),
        })
      }
    } catch {
      // Handle error silently
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${String(minutes)}m ago`
    if (hours < 24) return `${String(hours)}h ago`
    return `${String(days)}d ago`
  }

  return (
    <div
      className={`rounded-lg border bg-white p-4 transition-all dark:bg-gray-800 ${
        isProcessingState
          ? 'animate-pulse border-indigo-300 dark:border-indigo-700'
          : isFailedState
            ? 'border-red-300 dark:border-red-700'
            : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-gray-900 dark:text-gray-100">{thought.content}</p>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatDate(thought.createdAt)}</span>
            {thought.linkedTaskIds.length > 0 && (
              <>
                <span>&#183;</span>
                <span>
                  {thought.linkedTaskIds.length}{' '}
                  {thought.linkedTaskIds.length === 1 ? 'task' : 'tasks'} extracted
                </span>
              </>
            )}
            {isProcessingState && (
              <>
                <span>&#183;</span>
                <span className="text-indigo-600 dark:text-indigo-400">Processing...</span>
              </>
            )}
            {isFailedState && (
              <>
                <span>&#183;</span>
                <span className="text-red-600 dark:text-red-400">Processing failed</span>
              </>
            )}
          </div>
        </div>

        {/* Status indicator */}
        {isProcessingState && (
          <div className="flex-shrink-0">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        {isFailedState ? (
          <>
            <button
              type="button"
              onClick={() => void handleRetry()}
              disabled={isProcessing}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => void handleDismiss()}
              disabled={isProcessing}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Dismiss
            </button>
          </>
        ) : !isProcessingState ? (
          <>
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={isProcessing}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => void handleDismiss()}
              disabled={isProcessing}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Dismiss
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
