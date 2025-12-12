import { type ReactElement, useState, useEffect } from 'react'

interface OfflineIndicatorProps {
  className?: string
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps): ReactElement | null {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  // Initialize showBanner based on initial online status
  const [showBanner, setShowBanner] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOffline(false)
      // Show "back online" briefly then hide
      setShowBanner(true)
      setTimeout(() => {
        setShowBanner(false)
      }, 3000)
    }

    const handleOffline = (): void => {
      setIsOffline(true)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return (): void => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner) {
    return null
  }

  return (
    <div className={`fixed left-0 right-0 top-0 z-50 ${className}`} role="alert" aria-live="polite">
      <div
        className={`px-4 py-2 text-center text-sm font-medium ${
          isOffline ? 'bg-yellow-500 text-yellow-900' : 'bg-green-500 text-white'
        }`}
      >
        {isOffline ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <span>You&apos;re offline. Changes will sync when connected.</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
            <span>Back online!</span>
          </div>
        )}
      </div>
    </div>
  )
}
