import React, { useEffect, useState, useCallback, type ReactNode } from 'react'
import { getMigrationOrchestrator, type MigrationState } from '@/lib/migration'
import {
  INITIAL_MIGRATION_STATE,
  MIGRATION_CHANNEL_NAME,
  type MigrationMessage,
  type TabMigrationRole,
} from '@/lib/migration/types'
import { MigrationProgress, MigrationBanner } from '@/components/migration/MigrationProgress'
import { MigrationContext, type MigrationContextValue } from './migration.context'

// ============================================================================
// Provider Props
// ============================================================================

interface MigrationProviderProps {
  children: ReactNode
  onMigrationComplete?: () => void
}

// ============================================================================
// Migration Provider
// ============================================================================

export function MigrationProvider({
  children,
  onMigrationComplete,
}: MigrationProviderProps): React.JSX.Element {
  const [orchestrator] = useState(() => getMigrationOrchestrator())
  const [state, setState] = useState<MigrationState>(INITIAL_MIGRATION_STATE)
  const [needsMigration, setNeedsMigration] = useState<boolean | null>(null)
  const [role, setRole] = useState<TabMigrationRole>('normal')
  const [followerProgress, setFollowerProgress] = useState({ progress: 0, step: '' })

  // Subscribe to orchestrator state changes
  useEffect(() => {
    const unsubscribe = orchestrator.subscribe(setState)
    return (): void => {
      unsubscribe()
    }
  }, [orchestrator])

  // Check if migration is needed on mount
  useEffect(() => {
    const checkMigration = async (): Promise<void> => {
      const needed = await orchestrator.checkMigrationNeeded()
      setNeedsMigration(needed)
      if (needed) {
        setRole('leader')
      }
    }
    void checkMigration()
  }, [orchestrator])

  // Listen for multi-tab messages
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel(MIGRATION_CHANNEL_NAME)

    channel.onmessage = (event: MessageEvent<MigrationMessage>): void => {
      const message = event.data

      switch (message.type) {
        case 'MIGRATION_STARTED':
          // Another tab started migration - become follower
          if (role !== 'leader') {
            setRole('follower_waiting')
          }
          break

        case 'MIGRATION_PROGRESS':
          // Update follower progress display
          if (role === 'follower_waiting') {
            setFollowerProgress({
              progress: message.progress,
              step: message.step,
            })
          }
          break

        case 'MIGRATION_COMPLETE':
          // Migration done - reload to use new database
          if (role === 'follower_waiting') {
            setRole('follower_reload')
            window.location.reload()
          }
          break

        case 'MIGRATION_FAILED':
          // Migration failed - become normal again
          if (role === 'follower_waiting') {
            setRole('normal')
          }
          break
      }
    }

    return (): void => {
      channel.close()
    }
  }, [role])

  // Auto-start migration when needed
  useEffect(() => {
    if (needsMigration === true && role === 'leader' && state.status === 'idle') {
      void orchestrator.execute()
    }
  }, [needsMigration, role, state.status, orchestrator])

  // Handle migration complete
  useEffect(() => {
    if (state.status === 'done') {
      onMigrationComplete?.()
    }
  }, [state.status, onMigrationComplete])

  // Actions
  const startMigration = useCallback(async (): Promise<void> => {
    await orchestrator.execute()
  }, [orchestrator])

  const rollback = useCallback(async (): Promise<void> => {
    await orchestrator.rollback()
  }, [orchestrator])

  const downloadBackup = useCallback(async (): Promise<void> => {
    await orchestrator.downloadBackup()
  }, [orchestrator])

  const isComplete = state.status === 'done'

  // Context value
  const value: MigrationContextValue = {
    state,
    role,
    needsMigration: needsMigration ?? false,
    isComplete,
    startMigration,
    rollback,
    downloadBackup,
  }

  // Render loading while checking
  if (needsMigration === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-stone-500">Checking database...</div>
      </div>
    )
  }

  // Render migration UI if leader and migration is running
  if (needsMigration && role === 'leader' && state.status !== 'done') {
    return (
      <MigrationContext.Provider value={value}>
        <MigrationProgress
          state={state}
          onRollback={() => void rollback()}
          onDownloadBackup={() => void downloadBackup()}
        />
      </MigrationContext.Provider>
    )
  }

  // Render follower banner if another tab is migrating
  if (role === 'follower_waiting') {
    return (
      <MigrationContext.Provider value={value}>
        <MigrationBanner progress={followerProgress.progress} step={followerProgress.step} />
        <div className="pointer-events-none opacity-50 pt-20">{children}</div>
      </MigrationContext.Provider>
    )
  }

  // Normal render
  return <MigrationContext.Provider value={value}>{children}</MigrationContext.Provider>
}
