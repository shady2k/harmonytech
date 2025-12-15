/**
 * Idle detection hook
 * Tracks user activity and page visibility to determine idle state
 * Used to pause expensive operations (AI recommendations) when user is inactive
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { IDLE_TIMEOUT_MS, ACTIVITY_THROTTLE_MS } from '@/lib/constants/ai'

interface IdleState {
  isIdle: boolean
  isTabHidden: boolean
}

interface UseIdleDetectionOptions {
  enabled?: boolean
  onIdleChange?: (isIdle: boolean) => void
}

interface UseIdleDetectionReturn extends IdleState {
  resetActivity: () => void
}

export function useIdleDetection(options: UseIdleDetectionOptions = {}): UseIdleDetectionReturn {
  const { enabled = true, onIdleChange } = options

  const [state, setState] = useState<IdleState>({
    isIdle: false,
    isTabHidden: typeof document !== 'undefined' ? document.hidden : false,
  })

  const throttleRef = useRef<number>(0)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onIdleChangeRef = useRef(onIdleChange)

  // Keep callback ref in sync
  useEffect(() => {
    onIdleChangeRef.current = onIdleChange
  }, [onIdleChange])

  // Start or reset idle timer
  const startIdleTimer = useCallback((): void => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current)
    }

    idleTimerRef.current = setTimeout(() => {
      setState((prev) => {
        if (!prev.isIdle) {
          onIdleChangeRef.current?.(true)
        }
        return { ...prev, isIdle: true }
      })
    }, IDLE_TIMEOUT_MS)
  }, [])

  // Reset activity timestamp and clear idle state
  const resetActivity = useCallback((): void => {
    setState((prev) => {
      if (prev.isIdle) {
        onIdleChangeRef.current?.(false)
      }
      return { ...prev, isIdle: false }
    })

    startIdleTimer()
  }, [startIdleTimer])

  // Throttled activity handler
  const handleActivity = useCallback((): void => {
    if (!enabled) return

    const now = Date.now()

    // Throttle: only process if enough time has passed
    if (now - throttleRef.current < ACTIVITY_THROTTLE_MS) {
      return
    }

    throttleRef.current = now
    resetActivity()
  }, [enabled, resetActivity])

  // Handle visibility change
  const handleVisibilityChange = useCallback((): void => {
    const isHidden = document.hidden

    setState((prev) => {
      // Determine new combined idle state
      const wasEffectivelyIdle = prev.isTabHidden || prev.isIdle
      const isEffectivelyIdle = isHidden || prev.isIdle

      // If tab becomes visible and we were idle due to hidden tab, reset activity
      if (!isHidden && prev.isTabHidden) {
        startIdleTimer()
      }

      // Notify if effective idle state changed
      if (wasEffectivelyIdle !== isEffectivelyIdle) {
        onIdleChangeRef.current?.(isEffectivelyIdle)
      }

      return { ...prev, isTabHidden: isHidden }
    })
  }, [startIdleTimer])

  useEffect(() => {
    if (!enabled) return

    // Activity events to track
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click']

    // Add event listeners with passive option for performance
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true, capture: true })
    })

    // Visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start initial idle timer
    startIdleTimer()

    return (): void => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, { capture: true })
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [enabled, handleActivity, handleVisibilityChange, startIdleTimer])

  return {
    ...state,
    resetActivity,
  }
}
