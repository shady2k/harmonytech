import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getDatabase,
  initializeSettings,
  resetDatabaseCache,
  type HarmonyTechDatabase,
} from '@/lib/database'
import { MigrationProvider } from '@/contexts/MigrationContext'
import { getMigrationOrchestrator } from '@/lib/migration'
import { isDowngrade } from '@/lib/migration/version-manager'
import { logger } from '@/lib/logger'

// ============================================================================
// Context Types
// ============================================================================

interface DatabaseContextValue {
  db: HarmonyTechDatabase | null
  isLoading: boolean
  error: Error | null
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null)

interface DatabaseProviderProps {
  children: ReactNode
}

// ============================================================================
// Database Provider
// ============================================================================

export function DatabaseProvider({ children }: DatabaseProviderProps): React.JSX.Element {
  const [db, setDb] = useState<HarmonyTechDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [needsMigration, setNeedsMigration] = useState<boolean | null>(null)
  const [migrationComplete, setMigrationComplete] = useState(false)

  // Step 1: Check if migration is needed BEFORE any database access
  useEffect(() => {
    const checkMigration = async (): Promise<void> => {
      logger.db.info('=== DatabaseContext: Starting migration check ===')
      try {
        // MANDATORY: Check for downgrade FIRST
        if (isDowngrade()) {
          throw new Error(
            'Database was created with a newer app version. Please update the app or clear browser data to continue.'
          )
        }
        const orchestrator = getMigrationOrchestrator()
        logger.db.info('DatabaseContext: Calling checkMigrationNeeded()')
        const needed = await orchestrator.checkMigrationNeeded()
        logger.db.info('DatabaseContext: Migration needed =', needed)
        setNeedsMigration(needed)
      } catch (err) {
        logger.db.error('DatabaseContext: Migration check error:', err)
        setError(err instanceof Error ? err : new Error('Migration check failed'))
        setNeedsMigration(false)
      }
    }
    void checkMigration()
  }, [])

  // Step 2: Initialize database only after migration check/completion
  useEffect(() => {
    // Wait for migration check
    if (needsMigration === null) return

    // If migration is needed and not complete, don't init yet
    if (needsMigration && !migrationComplete) return

    const initDb = async (): Promise<void> => {
      try {
        setIsLoading(true)
        setError(null)

        // Reset cache in case migration changed the DB name
        if (migrationComplete) {
          resetDatabaseCache()
        }

        const database = await getDatabase()
        await initializeSettings(database)
        setDb(database)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)

        // Safety net: catch DB6/DM4/schema mismatch errors and trigger orchestrator
        // This handles cases where localStorage version is stale but actual DB needs migration
        const isSchemaError =
          errorMessage.includes('DB6') ||
          errorMessage.includes('DM4') ||
          errorMessage.includes('schema') ||
          errorMessage.includes('closed harmonytech')

        if (isSchemaError) {
          // Schema error detected - force orchestrator to run migration
          resetDatabaseCache()
          const orchestrator = getMigrationOrchestrator()
          orchestrator.setForceMigration(true)
          setNeedsMigration(true)
          setMigrationComplete(false)
          return
        }

        // Note: We do NOT clear databases on errors - data integrity is paramount
        // Schema mismatches should be handled by proper migrations, not data deletion
        setError(err instanceof Error ? err : new Error('Failed to initialize database'))
      } finally {
        setIsLoading(false)
      }
    }

    void initDb()
  }, [needsMigration, migrationComplete])

  // Handle migration completion
  const handleMigrationComplete = (): void => {
    setMigrationComplete(true)
  }

  // Still checking migration status
  if (needsMigration === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="flex items-center gap-2 text-stone-500">
          <LoadingSpinner />
          <span>Checking database...</span>
        </div>
      </div>
    )
  }

  // Migration needed - show migration UI
  if (needsMigration && !migrationComplete) {
    return (
      <MigrationProvider onMigrationComplete={handleMigrationComplete}>
        {/* Migration UI is handled inside MigrationProvider */}
        <div />
      </MigrationProvider>
    )
  }

  // Database error
  if (error !== null) {
    return <DatabaseErrorUI error={error} />
  }

  // Loading database
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="flex items-center gap-2 text-stone-500">
          <LoadingSpinner />
          <span>Loading database...</span>
        </div>
      </div>
    )
  }

  // Ready
  return (
    <DatabaseContext.Provider value={{ db, isLoading, error }}>{children}</DatabaseContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useDatabaseContext(): DatabaseContextValue {
  const context = useContext(DatabaseContext)
  if (context === null) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider')
  }
  return context
}

// ============================================================================
// Components
// ============================================================================

function LoadingSpinner(): React.JSX.Element {
  return (
    <svg
      className="h-5 w-5 animate-spin text-indigo-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function DatabaseErrorUI({ error }: { error: Error }): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4 dark:bg-stone-900">
      <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-lg dark:border-red-800 dark:bg-stone-800">
        <h2 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
          Database Error
        </h2>
        <p className="mb-4 text-sm text-stone-600 dark:text-stone-300">{error.message}</p>
        <button
          onClick={() => {
            window.location.reload()
          }}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Reload App
        </button>
      </div>
    </div>
  )
}
