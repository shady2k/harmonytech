import { type ReactElement } from 'react'
import { Button } from '@/components/ui/Button'
import type { VersionMismatch } from '@/types/sync'

interface VersionMismatchAlertProps {
  mismatch: VersionMismatch
  onDismiss: () => void
  className?: string
}

/**
 * Alert shown when sync is disabled due to version mismatch
 */
export function VersionMismatchAlert({
  mismatch,
  onDismiss,
  className = '',
}: VersionMismatchAlertProps): ReactElement {
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Warning icon */}
        <svg
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Update Required
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            A device in your sync space is running a newer version of the app. Please update to
            continue syncing.
          </p>

          <div className="mt-3 rounded bg-amber-100 px-3 py-2 dark:bg-amber-900/30">
            <div className="flex justify-between text-xs">
              <span className="text-amber-600 dark:text-amber-400">Your version:</span>
              <span className="font-mono text-amber-800 dark:text-amber-200">
                {mismatch.localVersion}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-600 dark:text-amber-400">Required version:</span>
              <span className="font-mono text-amber-800 dark:text-amber-200">
                {mismatch.peerVersion}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-amber-600 dark:text-amber-400">Newer device:</span>
              <span className="text-amber-800 dark:text-amber-200">{mismatch.peerDeviceName}</span>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
            >
              Continue Offline
            </Button>
          </div>

          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            You can still use the app offline. Your data will sync when you update.
          </p>
        </div>
      </div>
    </div>
  )
}
