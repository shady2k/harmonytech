import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getDatabase, initializeSettings, type HarmonyTechDatabase } from '@/lib/database'

interface DatabaseContextValue {
  db: HarmonyTechDatabase | null
  isLoading: boolean
  error: Error | null
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null)

interface DatabaseProviderProps {
  children: ReactNode
}

export function DatabaseProvider({ children }: DatabaseProviderProps): React.JSX.Element {
  const [db, setDb] = useState<HarmonyTechDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const initDb = async (): Promise<void> => {
      try {
        const database = await getDatabase()
        if (mounted) {
          await initializeSettings(database)
          setDb(database)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize database'))
          setIsLoading(false)
        }
      }
    }

    void initDb()

    return (): void => {
      mounted = false
    }
  }, [])

  return (
    <DatabaseContext.Provider value={{ db, isLoading, error }}>{children}</DatabaseContext.Provider>
  )
}

export function useDatabaseContext(): DatabaseContextValue {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider')
  }
  return context
}
