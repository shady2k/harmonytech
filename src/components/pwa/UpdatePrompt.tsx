import { type ReactElement, useCallback } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface UpdatePromptProps {
  className?: string
}

export function UpdatePrompt({ className = '' }: UpdatePromptProps): ReactElement | null {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const handleUpdate = useCallback((): void => {
    void updateServiceWorker(true)
  }, [updateServiceWorker])

  const handleDismiss = useCallback((): void => {
    setNeedRefresh(false)
  }, [setNeedRefresh])

  if (!needRefresh) {
    return null
  }

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-40 md:bottom-4 md:left-auto md:right-4 md:w-80 ${className}`}
    >
      <Card className="shadow-lg">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
            <svg
              className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">Update Available</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              A new version is ready. Reload to update.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="flex-1">
            Later
          </Button>
          <Button size="sm" onClick={handleUpdate} className="flex-1">
            Reload
          </Button>
        </div>
      </Card>
    </div>
  )
}
