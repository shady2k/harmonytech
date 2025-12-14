import { useState, useMemo, useRef, useCallback, type ReactElement } from 'react'
import { db } from '@/lib/dexie-database'
import { useAIStatus } from '@/hooks/useAIStatus'
import { getDeviceId } from '@/lib/sync'
import type { VoiceRecording } from '@/types/voice-recording'
import { formatTimeAgo } from '@/lib/date-utils'

interface VoiceRecordingCardProps {
  recording: VoiceRecording
}

export function VoiceRecordingCard({ recording }: VoiceRecordingCardProps): ReactElement {
  const { isAIAvailable } = useAIStatus()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualText, setManualText] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isTranscribing = recording.status === 'transcribing' || recording.status === 'pending'
  const isFailed = recording.status === 'failed'
  const isStuck = isTranscribing && !isAIAvailable

  // Create audio URL from base64 data (only if mimeType is available)
  const audioUrl = useMemo(() => {
    if (!recording.mimeType) return null
    try {
      const binaryString = atob(recording.audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: recording.mimeType })
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }, [recording.audioData, recording.mimeType])

  const handlePlayPause = useCallback((): void => {
    if (audioRef.current === null) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      void audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleAudioEnded = useCallback((): void => {
    setIsPlaying(false)
  }, [])

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

  const handleSaveManual = async (): Promise<void> => {
    if (manualText.trim() === '') return

    setIsProcessing(true)

    try {
      const now = new Date().toISOString()
      const thoughtId = `thought-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`

      // Create thought from manual transcription
      await db.thoughts.add({
        id: thoughtId,
        content: manualText.trim(),
        tags: [],
        linkedTaskIds: [],
        aiProcessed: false,
        processingStatus: 'unprocessed',
        sourceRecordingId: recording.id,
        createdAt: now,
        updatedAt: now,
        createdByDeviceId: getDeviceId(),
      })

      // Mark recording as completed
      await db.voiceRecordings.update(recording.id, {
        status: 'completed',
        transcript: manualText.trim(),
        linkedThoughtId: thoughtId,
        processedAt: now,
      })

      setManualText('')
      setShowManualInput(false)
    } catch {
      // Handle error silently
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusText = (): string => {
    if (isStuck) return 'AI not configured'
    if (recording.status === 'pending') return 'Waiting to transcribe...'
    if (recording.status === 'transcribing') return 'Transcribing...'
    if (recording.status === 'failed') return 'Transcription failed'
    return ''
  }

  return (
    <div
      className={`rounded-lg border bg-white p-4 transition-all dark:bg-gray-800 ${
        isStuck
          ? 'border-amber-300 dark:border-amber-700'
          : isTranscribing
            ? 'animate-pulse border-indigo-300 dark:border-indigo-700'
            : isFailed
              ? 'border-red-300 dark:border-red-700'
              : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Hidden audio element */}
      {audioUrl !== null && (
        <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} preload="metadata" />
      )}

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
            {isStuck ? (
              <span className="text-amber-600 dark:text-amber-400">{getStatusText()}</span>
            ) : isTranscribing ? (
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
        {isTranscribing && !isStuck && (
          <div className="flex-shrink-0">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Audio player and manual input for stuck or failed state */}
      {(isFailed || isStuck) && (
        <>
          {/* Audio playback controls */}
          {audioUrl !== null && (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayPause}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-colors hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-800"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isPlaying ? 'Playing...' : 'Tap to listen'}
              </span>
            </div>
          )}

          {/* Manual transcription input */}
          {showManualInput ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={manualText}
                onChange={(e): void => {
                  setManualText(e.target.value)
                }}
                placeholder="Type what you hear..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                rows={3}
                disabled={isProcessing}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveManual()}
                  disabled={isProcessing || manualText.trim() === ''}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualInput(false)
                    setManualText('')
                  }}
                  disabled={isProcessing}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={(): void => {
                  setShowManualInput(true)
                }}
                disabled={isProcessing}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                Transcribe manually
              </button>
              {isFailed && (
                <button
                  type="button"
                  onClick={() => void handleRetry()}
                  disabled={isProcessing}
                  className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                >
                  Retry AI
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleDismiss()}
                disabled={isProcessing}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
