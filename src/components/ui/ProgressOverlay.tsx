import type { ReactElement } from 'react'

export interface ProgressState {
  step: string
  current?: number
  total?: number
}

interface ProgressOverlayProps {
  isVisible: boolean
  progress: ProgressState | null
}

export function ProgressOverlay({
  isVisible,
  progress,
}: ProgressOverlayProps): ReactElement | null {
  if (!isVisible || !progress) {
    return null
  }

  const hasProgress = progress.current !== undefined && progress.total !== undefined
  const current = progress.current ?? 0
  const total = progress.total ?? 1
  const percentage = hasProgress ? Math.round((current / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400" />

          {/* Step text */}
          <p className="text-center text-sm font-medium text-gray-900 dark:text-white">
            {progress.step}
          </p>

          {/* Progress bar (if has counts) */}
          {hasProgress && (
            <div className="w-full space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-400"
                  style={{ width: `${String(percentage)}%` }}
                />
              </div>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                {current} / {total}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
