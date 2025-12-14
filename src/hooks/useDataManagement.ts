import { useState, useCallback } from 'react'
import { useDatabase } from './useDatabase'
import { exportData, downloadExportFile } from '@/lib/data-export'
import {
  parseImportFile,
  importData,
  type ImportResult,
  type ImportProgress,
} from '@/lib/data-import'
import { clearUserData, clearAllData, type ClearProgress } from '@/lib/data-clear'
import type { ProgressState } from '@/components/ui/ProgressOverlay'

export interface UseDataManagementResult {
  // Export
  isExporting: boolean
  exportError: string | null
  handleExport: () => Promise<void>

  // Import
  isImporting: boolean
  importResult: ImportResult | null
  importError: string | null
  handleImport: (file: File) => Promise<void>
  clearImportResult: () => void

  // Clear
  isClearing: boolean
  clearError: string | null
  handleClearUserData: () => Promise<void>
  handleClearAllData: () => Promise<void>

  // Progress overlay
  progress: ProgressState | null
  isOperationInProgress: boolean
}

export function useDataManagement(): UseDataManagementResult {
  const { db } = useDatabase()

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const [isClearing, setIsClearing] = useState(false)
  const [clearError, setClearError] = useState<string | null>(null)

  const [progress, setProgress] = useState<ProgressState | null>(null)

  const handleExport = useCallback(async () => {
    if (!db) {
      setExportError('Database not ready')
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      const data = await exportData(db)
      downloadExportFile(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed'
      setExportError(message)
    } finally {
      setIsExporting(false)
    }
  }, [db])

  const handleImport = useCallback(
    async (file: File) => {
      if (!db) {
        setImportError('Database not ready')
        return
      }

      setIsImporting(true)
      setImportError(null)
      setImportResult(null)
      setProgress({ step: 'Validating file...' })

      try {
        const text = await file.text()
        const { data, errors } = parseImportFile(text)

        if (!data) {
          setImportResult({ success: false, errors })
          setProgress(null)
          return
        }

        const onProgress = (p: ImportProgress): void => {
          setProgress(p)
        }

        const result = await importData(db, data, onProgress)
        setImportResult(result)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Import failed'
        setImportError(message)
      } finally {
        setIsImporting(false)
        setProgress(null)
      }
    },
    [db]
  )

  const clearImportResult = useCallback(() => {
    setImportResult(null)
    setImportError(null)
  }, [])

  const handleClearUserData = useCallback(async () => {
    if (!db) {
      setClearError('Database not ready')
      return
    }

    setIsClearing(true)
    setClearError(null)

    try {
      const onProgress = (p: ClearProgress): void => {
        setProgress(p)
      }

      await clearUserData(db, onProgress)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Clear failed'
      setClearError(message)
    } finally {
      setIsClearing(false)
      setProgress(null)
    }
  }, [db])

  const handleClearAllData = useCallback(async () => {
    if (!db) {
      setClearError('Database not ready')
      return
    }

    setIsClearing(true)
    setClearError(null)

    try {
      const onProgress = (p: ClearProgress): void => {
        setProgress(p)
      }

      await clearAllData(db, onProgress)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Clear failed'
      setClearError(message)
    } finally {
      setIsClearing(false)
      setProgress(null)
    }
  }, [db])

  const isOperationInProgress = isExporting || isImporting || isClearing

  return {
    isExporting,
    exportError,
    handleExport,
    isImporting,
    importResult,
    importError,
    handleImport,
    clearImportResult,
    isClearing,
    clearError,
    handleClearUserData,
    handleClearAllData,
    progress,
    isOperationInProgress,
  }
}
