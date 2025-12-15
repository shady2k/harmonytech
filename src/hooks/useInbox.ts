/**
 * Hook for managing inbox items (unprocessed/failed thoughts AND pending/failed voice recordings)
 * Provides reactive query for items that need user attention
 */

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/dexie-database'
import type { Thought } from '@/types/thought'
import type { VoiceRecording } from '@/types/voice-recording'

// Unified inbox item type
export type InboxItem =
  | { type: 'thought'; data: Thought }
  | { type: 'voice-recording'; data: VoiceRecording }

interface UseInboxReturn {
  items: InboxItem[]
  count: number
  isLoading: boolean
}

export function useInbox(): UseInboxReturn {
  // Reactive query for thoughts not yet fully processed
  // Show everything except 'processed' status
  const thoughts = useLiveQuery(
    () => db.thoughts.where('processingStatus').notEqual('processed').toArray(),
    []
  )

  // Reactive query for voice recordings that are pending or failed (need attention)
  const voiceRecordings = useLiveQuery(
    () => db.voiceRecordings.where('status').anyOf(['pending', 'transcribing', 'failed']).toArray(),
    []
  )

  const isLoading = thoughts === undefined || voiceRecordings === undefined

  // Merge and sort by createdAt (newest first)
  const items: InboxItem[] = []

  if (thoughts) {
    for (const thought of thoughts) {
      items.push({ type: 'thought', data: thought })
    }
  }

  if (voiceRecordings) {
    for (const recording of voiceRecordings) {
      items.push({ type: 'voice-recording', data: recording })
    }
  }

  // Sort by createdAt (newest first)
  items.sort((a, b) => {
    const aDate = new Date(a.data.createdAt).getTime()
    const bDate = new Date(b.data.createdAt).getTime()
    return bDate - aDate
  })

  return {
    items,
    count: items.length,
    isLoading,
  }
}
