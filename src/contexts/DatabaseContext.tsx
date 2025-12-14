import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { db, type HarmonyDatabase } from '@/lib/dexie-database'
import { logger } from '@/lib/logger'

const log = logger.db

// ============================================================================
// Context Types
// ============================================================================

interface DatabaseContextValue {
  db: HarmonyDatabase
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)

  // Initialize database on startup
  useEffect(() => {
    isMountedRef.current = true

    const initDatabase = async (): Promise<void> => {
      try {
        // Open database (triggers populate hook on first creation)
        await db.open()

        // Clean up stuck 'processing' thoughts from previous session
        // These can happen if the app crashed or was closed mid-processing
        const stuckThoughts = await db.thoughts
          .where('processingStatus')
          .equals('processing')
          .toArray()

        if (stuckThoughts.length > 0) {
          log.info(`Resetting ${String(stuckThoughts.length)} stuck 'processing' thoughts`)
          await db.thoughts
            .where('processingStatus')
            .equals('processing')
            .modify({ processingStatus: 'unprocessed', updatedAt: new Date().toISOString() })
        }

        // Only update state if still mounted (prevents StrictMode warnings)
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize database')
        log.error('Database initialization failed', { error: error.message })

        if (isMountedRef.current) {
          setError(error)
          setIsLoading(false)
        }
      }
    }

    void initDatabase()

    return (): void => {
      isMountedRef.current = false
    }
  }, [])

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
