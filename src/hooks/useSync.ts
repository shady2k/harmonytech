/**
 * Sync hooks - public API for consuming sync state
 *
 * These hooks have NO side effects - they only read from SyncContext.
 * All sync lifecycle is managed by SyncProvider.
 */

import { useContext } from 'react'
import { SyncContext } from '@/contexts/SyncContext'
import type { SyncContextValue, SyncState, SyncActions } from '@/types/sync'

/**
 * useSync - public hook for consuming sync state and actions
 *
 * This hook has NO side effects - it only reads from context.
 * All sync lifecycle is managed by SyncProvider.
 */
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext)

  if (context === null) {
    throw new Error('useSync must be used within a SyncProvider')
  }

  return context
}

/**
 * useSyncState - convenience hook for just the state
 */
export function useSyncState(): SyncState {
  return useSync().state
}

/**
 * useSyncActions - convenience hook for just the actions
 */
export function useSyncActions(): SyncActions {
  return useSync().actions
}
