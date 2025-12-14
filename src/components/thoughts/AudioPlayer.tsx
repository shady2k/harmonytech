import { type ReactElement, useState, useEffect, useRef, useCallback } from 'react'
import { db } from '@/lib/dexie-database'

interface AudioPlayerProps {
  recordingId: string
  className?: string
}

type PlayerState = 'loading' | 'ready' | 'playing' | 'error'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins)}:${String(secs).padStart(2, '0')}`
}

export function AudioPlayer({
  recordingId,
  className = '',
}: AudioPlayerProps): ReactElement | null {
  const [state, setState] = useState<PlayerState>('loading')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Load audio from IndexedDB
  useEffect(() => {
    let isMounted = true

    const loadAudio = async (): Promise<void> => {
      try {
        const recording = await db.voiceRecordings.get(recordingId)

        if (!isMounted) return

        if (recording === undefined) {
          setState('error')
          return
        }

        // Convert Base64 to Blob
        const binaryString = atob(recording.audioData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const audioBlob = new Blob([bytes], { type: 'audio/wav' })

        // Create Object URL
        const url = URL.createObjectURL(audioBlob)
        objectUrlRef.current = url

        // Create audio element
        const audio = new Audio(url)
        audioRef.current = audio

        audio.addEventListener('loadedmetadata', () => {
          if (isMounted) {
            setDuration(audio.duration)
            setState('ready')
          }
        })

        audio.addEventListener('timeupdate', () => {
          if (isMounted) {
            setCurrentTime(audio.currentTime)
          }
        })

        audio.addEventListener('ended', () => {
          if (isMounted) {
            setState('ready')
            setCurrentTime(0)
          }
        })

        audio.addEventListener('error', () => {
          if (isMounted) {
            setState('error')
          }
        })
      } catch {
        if (isMounted) {
          setState('error')
        }
      }
    }

    void loadAudio()

    return (): void => {
      isMounted = false
      // Clean up
      if (audioRef.current !== null) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (objectUrlRef.current !== null) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [recordingId])

  const handlePlayPause = useCallback((): void => {
    if (audioRef.current === null) return

    if (state === 'playing') {
      audioRef.current.pause()
      setState('ready')
    } else {
      void audioRef.current.play()
      setState('playing')
    }
  }, [state])

  // Loading state
  if (state === 'loading') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    )
  }

  // Error state - hide player if recording not found or error
  if (state === 'error') {
    return null
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Play/Pause button */}
      <button
        type="button"
        onClick={handlePlayPause}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900/70"
        aria-label={state === 'playing' ? 'Pause' : 'Play'}
      >
        {state === 'playing' ? (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Progress bar */}
      <div className="relative h-1.5 w-48 rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
          style={{ width: `${String(progress)}%` }}
        />
      </div>

      {/* Time */}
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {formatTime(currentTime)}/{formatTime(duration)}
      </span>
    </div>
  )
}
