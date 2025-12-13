import type { ReactElement } from 'react'

interface InboxAlertBannerProps {
  count: number
  onReview: () => void
}

export function InboxAlertBanner({ count, onReview }: InboxAlertBannerProps): ReactElement | null {
  if (count === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 text-xl">&#128229;</div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {count} {count === 1 ? 'item' : 'items'} need{count === 1 ? 's' : ''} processing
          </p>
        </div>
        <button
          type="button"
          onClick={onReview}
          className="flex-shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Review
        </button>
      </div>
    </div>
  )
}
