import { createContext } from 'react'
import type { MigrationState } from '@/lib/migration'
import type { TabMigrationRole } from '@/lib/migration/types'

export interface MigrationContextValue {
  state: MigrationState
  role: TabMigrationRole
  needsMigration: boolean
  isComplete: boolean
  startMigration: () => Promise<void>
  rollback: () => Promise<void>
  downloadBackup: () => Promise<void>
}

export const MigrationContext = createContext<MigrationContextValue | null>(null)
