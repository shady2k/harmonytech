import { useState, type ReactElement } from 'react'
import { db } from '@/lib/dexie-database'
import type { VoiceRecording } from '@/types/voice-recording'
import { formatTimeAgo } from '@/lib/date-utils'

interface VoiceRecordingCardProps {
  recording: VoiceRecording
}

export function VoiceRecordingCard({ recording }: VoiceRecordingCardProps): ReactElement {
  const [isProcessing, setIsProcessing] = useState(false)

  const isTranscribing = recording.status === 'transcribing' || recording.status === 'pending'
  const isFailed = recording.status === 'failed'

  const handleRetry = async (): Promise<void> => {
    setIsProcessing(true)

    try {
      await db.voiceRecordings.update(recording.id, {
        status: 'pending',
        errorMessage: undefined,
        retryCount: 0,
      })
    } catch {
      // Handle error silently
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDismiss = async (): Promise<void> => {
    setIsProcessing(true)

    try {
      // Delete the voice recording entirely
      await db.voiceRecordings.delete(recording.id)
    } catch {
      // Handle error silently
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusText = (): string => {
    if (recording.status === 'pending') return 'Waiting to transcribe...'
    if (recording.status === 'transcribing') return 'Transcribing...'
    if (recording.status === 'failed') return 'Transcription failed'
    return ''
  }

  return (
    <div
      className={`rounded-lg border bg-white p-4 transition-all dark:bg-gray-800 ${
        isTranscribing
          ? 'animate-pulse border-indigo-300 dark:border-indigo-700'
          : isFailed
            ? 'border-red-300 dark:border-red-700'
            : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Voice indicator and content */}
          <div className="flex items-center gap-2">
            <span className="flex-shrink-0 text-lg" title="Voice recording">
              &#127908;
            </span>
            <p className="text-gray-900 dark:text-gray-100">Voice recording</p>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatTimeAgo(recording.createdAt)}</span>
            <span>&#183;</span>
            {isTranscribing ? (
              <span className="text-indigo-600 dark:text-indigo-400">{getStatusText()}</span>
            ) : isFailed ? (
              <span className="text-red-600 dark:text-red-400">{getStatusText()}</span>
            ) : null}
            {recording.retryCount !== undefined && recording.retryCount > 0 && (
              <>
                <span>&#183;</span>
                <span>Retry #{String(recording.retryCount)}</span>
              </>
            )}
          </div>

          {/* Show error message if failed */}
          {isFailed && recording.errorMessage !== undefined && recording.errorMessage !== '' && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{recording.errorMessage}</p>
          )}
        </div>

        {/* Status indicator */}
        {isTranscribing && (
          <div className="flex-shrink-0">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Action buttons - only show for failed state */}
      {isFailed && (
        <div className="mt-4 flex flex-wrap gap-2">
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
        </div>
      )}
    </div>
  )
}
