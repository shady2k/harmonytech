import type { ReactElement } from 'react'
import { useInbox } from '@/hooks/useInbox'
import { useSettingsStore } from '@/stores/settings.store'
import { QuickProcessCard } from './QuickProcessCard'
import { VoiceRecordingCard } from './VoiceRecordingCard'
import { EmptyInboxState } from './EmptyInboxState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function InboxView(): ReactElement {
  const { items, count, isLoading } = useInbox()
  const { aiEnabled } = useSettingsStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" label="Loading inbox..." />
      </div>
    )
  }

  // Show AI disabled state if AI is not enabled
  if (!aiEnabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-2xl">&#128161;</div>
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-100">
              AI processing is disabled
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Enable AI in Settings to automatically process your thoughts and extract tasks. You
              can still manually convert thoughts to tasks from the Thoughts view.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state when no items need processing
  if (count === 0) {
    return <EmptyInboxState />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {count} {count === 1 ? 'item' : 'items'} need{count === 1 ? 's' : ''} processing
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) =>
          item.type === 'thought' ? (
            <QuickProcessCard key={item.data.id} thought={item.data} />
          ) : (
            <VoiceRecordingCard key={item.data.id} recording={item.data} />
          )
        )}
      </div>
    </div>
  )
}
