import { useRef, useState, useCallback, useEffect, type ReactElement } from 'react'
import { NavIcon } from '@/components/layout/NavIcon'

interface CaptureButtonProps {
  onClick: () => void
  onLongPress?: () => void
  isRecording?: boolean
  className?: string
}

const LONG_PRESS_DELAY = 500

export function CaptureButton({
  onClick,
  onLongPress,
  isRecording = false,
  className = '',
}: CaptureButtonProps): ReactElement {
  const [isPressed, setIsPressed] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)

  const clearLongPressTimer = useCallback((): void => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return (): void => {
      clearLongPressTimer()
    }
  }, [clearLongPressTimer])

  const handlePressStart = useCallback((): void => {
    setIsPressed(true)
    isLongPressRef.current = false

    if (onLongPress !== undefined) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        onLongPress()
      }, LONG_PRESS_DELAY)
    }
  }, [onLongPress])

  const handlePressEnd = useCallback((): void => {
    setIsPressed(false)
    clearLongPressTimer()

    if (!isLongPressRef.current) {
      onClick()
    }
  }, [onClick, clearLongPressTimer])

  const handlePressCancel = useCallback((): void => {
    setIsPressed(false)
    clearLongPressTimer()
  }, [clearLongPressTimer])

  return (
    <button
      type="button"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressCancel}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressCancel}
      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all ${
        isRecording
          ? 'animate-pulse bg-red-500 text-white'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      } ${isPressed ? 'scale-95' : 'hover:scale-105'} ${className}`}
      aria-label={isRecording ? 'Stop recording' : 'Capture'}
    >
      <NavIcon name={isRecording ? 'mic' : 'plus'} className="h-6 w-6" />
    </button>
  )
}
