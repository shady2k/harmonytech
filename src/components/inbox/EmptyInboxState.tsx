import type { ReactElement } from 'react'

export function EmptyInboxState(): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
      <div className="text-5xl">&#10004;&#65039;</div>
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">All caught up!</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        No items need processing. Your thoughts are being automatically analyzed and converted to
        tasks.
      </p>
    </div>
  )
}
