import { useState, useRef, useCallback, useEffect } from 'react'

interface UseVoiceRecordingReturn {
  isRecording: boolean
  duration: number
  audioBlob: Blob | null
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetRecording: () => void
}

export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopMediaStream = useCallback((): void => {
    if (streamRef.current !== null) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }
  }, [])

  const startRecording = useCallback(async (): Promise<void> => {
    setError(null)
    setAudioBlob(null)
    chunksRef.current = []

    try {
      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('Voice recording is not supported in this browser')
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Determine supported MIME type
      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event): void => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = (): void => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        stopMediaStream()
      }

      mediaRecorder.onerror = (): void => {
        setError('Recording error occurred')
        setIsRecording(false)
        clearTimer()
        stopMediaStream()
      }

      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setDuration(0)

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied')
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to start recording')
      }
    }
  }, [clearTimer, stopMediaStream])

  const stopRecording = useCallback((): void => {
    clearTimer()

    if (mediaRecorderRef.current !== null && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    setIsRecording(false)
  }, [clearTimer])

  const resetRecording = useCallback((): void => {
    stopRecording()
    setDuration(0)
    setAudioBlob(null)
    setError(null)
    chunksRef.current = []
  }, [stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      clearTimer()
      stopMediaStream()
      if (mediaRecorderRef.current !== null && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [clearTimer, stopMediaStream])

  return {
    isRecording,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  }
}

function getSupportedMimeType(): string {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType
    }
  }

  return 'audio/webm' // Default fallback
}
