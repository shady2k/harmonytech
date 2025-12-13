import { useContext } from 'react'
import { MigrationContext, type MigrationContextValue } from '@/contexts/migration.context'

export function useMigrationContext(): MigrationContextValue {
  const context = useContext(MigrationContext)
  if (context === null) {
    throw new Error('useMigrationContext must be used within a MigrationProvider')
  }
  return context
}
