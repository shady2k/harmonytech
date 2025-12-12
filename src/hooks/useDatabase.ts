import { useDatabaseContext } from '@/contexts/DatabaseContext'
import type { HarmonyTechDatabase } from '@/lib/database'

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
  db: HarmonyTechDatabase
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

  if (!db) {
    throw new Error('Database not initialized')
  }

  return { db, isLoading: false, error: null }
}
