import { useDatabaseContext } from '@/contexts/DatabaseContext'
import type { HarmonyDatabase } from '@/lib/dexie-database'

interface UseDatabaseLoadingResult {
  db: null
  isLoading: true
  error: null
}

interface UseDatabaseErrorResult {
  db: null
  isLoading: false
  error: Error
}

interface UseDatabaseReadyResult {
  db: HarmonyDatabase
  isLoading: false
  error: null
}

type UseDatabaseResult = UseDatabaseLoadingResult | UseDatabaseErrorResult | UseDatabaseReadyResult

export function useDatabase(): UseDatabaseResult {
  const { db, isLoading, error } = useDatabaseContext()

  if (isLoading) {
    return { db: null, isLoading: true, error: null }
  }

  if (error) {
    return { db: null, isLoading: false, error }
  }

  return { db, isLoading: false, error: null }
}
