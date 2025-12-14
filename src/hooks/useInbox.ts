/**
 * Hook for managing inbox items (unprocessed/failed thoughts)
 * Provides reactive query for thoughts that need user attention
 */

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/dexie-database'
import type { Thought } from '@/types/thought'

interface UseInboxReturn {
  items: Thought[]
  count: number
  isLoading: boolean
}

export function useInbox(): UseInboxReturn {
  // Reactive query for thoughts with processingStatus 'unprocessed' or 'failed'
  const items = useLiveQuery(
    () =>
      db.thoughts
        .where('processingStatus')
        .anyOf(['unprocessed', 'failed'])
        .reverse()
        .sortBy('createdAt'),
    []
  )

  const isLoading = items === undefined

  return {
    items: items ?? [],
    count: items?.length ?? 0,
    isLoading,
  }
}
