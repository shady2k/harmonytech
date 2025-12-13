import React from 'react'
import type { MigrationState } from '@/lib/migration/types'

interface MigrationProgressProps {
  state: MigrationState
  onRollback: () => void
  onDownloadBackup: () => void
}

export function MigrationProgress({
  state,
  onRollback,
  onDownloadBackup,
}: MigrationProgressProps): React.JSX.Element {
  const isError = state.status === 'error'
  const isDone = state.status === 'done'
  const canRollback = state.canRollback && !isDone

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-700 dark:bg-stone-800">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
            {isError ? <ErrorIcon /> : isDone ? <CheckIcon /> : <SpinnerIcon />}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              {isError ? 'Migration Failed' : isDone ? 'Migration Complete' : 'Database Migration'}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {isError
                ? 'An error occurred during migration'
                : isDone
                  ? 'Your data has been migrated successfully'
                  : 'Please wait while we update your database'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {!isError && (
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-stone-600 dark:text-stone-400">{state.currentStep}</span>
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {state.progress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${String(state.progress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        {state.status === 'migrating' && state.itemsTotal > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded bg-stone-100 p-2 dark:bg-stone-700">
              <div className="font-semibold text-stone-900 dark:text-stone-100">
                {state.itemsCopied}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">Copied</div>
            </div>
            <div className="rounded bg-stone-100 p-2 dark:bg-stone-700">
              <div className="font-semibold text-stone-900 dark:text-stone-100">
                {state.itemsTotal}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">Total</div>
            </div>
            <div className="rounded bg-stone-100 p-2 dark:bg-stone-700">
              <div className="font-semibold text-stone-900 dark:text-stone-100">
                {state.itemsSkipped}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">Skipped</div>
            </div>
          </div>
        )}

        {/* Error message */}
        {isError && state.error !== undefined && (
          <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="break-words text-sm text-red-700 dark:text-red-300">
              {state.error.message}
            </p>
          </div>
        )}

        {/* Backup downloaded notice */}
        {state.backupDownloaded && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-sm text-green-700 dark:text-green-300">
              Backup saved to Downloads. Keep this file safe.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {canRollback && (
            <button
              onClick={onRollback}
              className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
            >
              Rollback
            </button>
          )}
          <button
            onClick={onDownloadBackup}
            disabled={state.status === 'checking' || state.status === 'backing-up'}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.backupDownloaded ? 'Download Again' : 'Download Backup'}
          </button>
        </div>

        {/* Done action */}
        {isDone && (
          <button
            onClick={() => {
              window.location.reload()
            }}
            className="mt-3 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Reload App
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Icons
// ============================================================================

function SpinnerIcon(): React.JSX.Element {
  return (
    <svg
      className="h-5 w-5 animate-spin text-indigo-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function CheckIcon(): React.JSX.Element {
  return (
    <svg
      className="h-5 w-5 text-green-600"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ErrorIcon(): React.JSX.Element {
  return (
    <svg
      className="h-5 w-5 text-red-600"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ============================================================================
// Follower Tab Banner (for multi-tab)
// ============================================================================

interface MigrationBannerProps {
  progress: number
  step: string
}

export function MigrationBanner({ progress, step }: MigrationBannerProps): React.JSX.Element {
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-amber-500 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <SpinnerIcon />
        <span>
          Migration in progress in another tab ({progress}%) - {step}
        </span>
      </div>
      <p className="mt-1 text-xs opacity-80">This tab is read-only until migration completes</p>
    </div>
  )
}
