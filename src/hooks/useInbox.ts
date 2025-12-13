/**
 * Hook for managing inbox items (unprocessed/failed thoughts)
 * Provides reactive query for thoughts that need user attention
 */

import { useEffect, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import type { Thought } from '@/types/thought'
import type { RxDocument } from 'rxdb'

interface UseInboxReturn {
  items: Thought[]
  count: number
  isLoading: boolean
}

function documentToThought(doc: RxDocument<Thought>): Thought {
  const data = doc.toJSON()

  const tags: string[] = Array.isArray(data.tags)
    ? data.tags.filter((tag): tag is string => typeof tag === 'string')
    : []

  const linkedTaskIds: string[] = Array.isArray(data.linkedTaskIds)
    ? data.linkedTaskIds.filter((id): id is string => typeof id === 'string')
    : []

  return {
    id: data.id,
    content: data.content,
    tags,
    linkedProject: data.linkedProject,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    sourceRecordingId: data.sourceRecordingId,
    linkedTaskIds,
    aiProcessed: data.aiProcessed,
    processingStatus: data.processingStatus,
  }
}

export function useInbox(): UseInboxReturn {
  const { db, isLoading: isDbLoading } = useDatabaseContext()
  const [items, setItems] = useState<Thought[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (db === null || isDbLoading) {
      return
    }

    // Subscribe to thoughts with processingStatus 'unprocessed' or 'failed'
    const subscription = db.thoughts
      .find({
        selector: {
          processingStatus: { $in: ['unprocessed', 'failed'] },
        },
      })
      .sort({ createdAt: 'desc' })
      .$.subscribe({
        next: (docs) => {
          const inboxItems = docs.map((doc) => documentToThought(doc))
          setItems(inboxItems)
          setIsLoading(false)
        },
        error: () => {
          setIsLoading(false)
        },
      })

    return (): void => {
      subscription.unsubscribe()
    }
  }, [db, isDbLoading])

  return {
    items,
    count: items.length,
    isLoading: isLoading || isDbLoading,
  }
}
