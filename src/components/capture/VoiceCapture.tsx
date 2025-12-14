import { useEffect, useCallback, useRef, type ReactElement } from 'react'
import { useCaptureStore } from '@/stores'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { NavIcon } from '@/components/layout/NavIcon'
import { Button } from '@/components/ui'
import { CAPTURE_SHORTCUTS } from '@/config/shortcuts'

interface VoiceCaptureProps {
  onRecordingComplete?: (blob: Blob) => void
  autoStart?: boolean
}

export function VoiceCapture({ onRecordingComplete, autoStart }: VoiceCaptureProps): ReactElement {
  const {
    isRecording: storeIsRecording,
    startRecording: storeStartRecording,
    stopRecording: storeStopRecording,
    setRecordingDuration,
    setAudioBlob,
    setProcessingState,
    setError,
  } = useCaptureStore()

  const { isRecording, duration, audioBlob, error, startRecording, stopRecording, resetRecording } =
    useVoiceRecording()

  // Sync recording state with store
  useEffect(() => {
    if (isRecording) {
      storeStartRecording()
    } else {
      storeStopRecording()
    }
  }, [isRecording, storeStartRecording, storeStopRecording])

  // Sync duration with store
  useEffect(() => {
    setRecordingDuration(duration)
  }, [duration, setRecordingDuration])

  // Handle recording complete
  useEffect(() => {
    if (audioBlob !== null && !isRecording) {
      setAudioBlob(audioBlob)
      setProcessingState('transcribing')
      onRecordingComplete?.(audioBlob)
    }
  }, [audioBlob, isRecording, setAudioBlob, setProcessingState, onRecordingComplete])

  // Handle errors
  useEffect(() => {
    if (error !== null) {
      setError(error)
    }
  }, [error, setError])

  // Auto-start recording when triggered by keyboard shortcut
  const hasAutoStarted = useRef(false)
  useEffect(() => {
    if (autoStart === true && !isRecording && !hasAutoStarted.current) {
      hasAutoStarted.current = true
      void startRecording()
    }
  }, [autoStart, isRecording, startRecording])

  const handleToggleRecording = useCallback((): void => {
    if (isRecording) {
      stopRecording()
    } else {
      void startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const handleCancel = useCallback((): void => {
    resetRecording()
    setProcessingState('idle')
  }, [resetRecording, setProcessingState])

  // Keyboard shortcuts for voice recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Stop recording with Escape, Enter, or Space
      if (isRecording && (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault()
        stopRecording()
        return
      }

      // Start recording with Control + M
      if (!e.ctrlKey) return
      if (e.metaKey || e.altKey || e.shiftKey) return

      if (e.code === CAPTURE_SHORTCUTS.voiceRecord.key) {
        e.preventDefault()
        handleToggleRecording()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleToggleRecording, isRecording, stopRecording])

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Recording indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggleRecording}
          className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
            isRecording
              ? 'animate-pulse bg-red-500 text-white shadow-lg shadow-red-500/30'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <NavIcon name={isRecording ? 'stop' : 'mic'} className="h-8 w-8" />
        </button>
      </div>

      {/* Duration display */}
      {(isRecording || storeIsRecording) && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="font-mono text-lg text-gray-900 dark:text-white">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Instructions with shortcut hint */}
      {!isRecording && !storeIsRecording && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Tap or press{' '}
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium dark:bg-gray-700">
            {CAPTURE_SHORTCUTS.voiceRecord.label}
          </kbd>{' '}
          to record
        </p>
      )}

      {/* Recording hint */}
      {isRecording && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Press{' '}
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium dark:bg-gray-700">
            {CAPTURE_SHORTCUTS.voiceRecord.label}
          </kbd>{' '}
          to stop
        </p>
      )}

      {/* Recording controls */}
      {isRecording && (
        <Button variant="ghost" onClick={handleCancel} size="sm">
          Cancel
        </Button>
      )}

      {/* Error display */}
      {error !== null && <p className="text-center text-sm text-red-500">{error}</p>}
    </div>
  )
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
