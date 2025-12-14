import { type ReactElement, useState, useRef, type ChangeEvent } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressOverlay } from '@/components/ui/ProgressOverlay'
import { useDataManagement } from '@/hooks'

interface DataManagementProps {
  className?: string
}

type ConfirmAction = 'import' | 'clear-user' | 'clear-all' | null

export function DataManagement({ className = '' }: DataManagementProps): ReactElement {
  const {
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
  } = useDataManagement()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setConfirmAction('import')
      clearImportResult()
    }
  }

  const handleImportClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleConfirmImport = async (): Promise<void> => {
    if (selectedFile) {
      await handleImport(selectedFile)
      setSelectedFile(null)
      setConfirmAction(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownloadAndImport = async (): Promise<void> => {
    await handleExport()
    await handleConfirmImport()
  }

  const handleConfirmClearUser = async (): Promise<void> => {
    await handleClearUserData()
    setConfirmAction(null)
  }

  const handleConfirmClearAll = async (): Promise<void> => {
    await handleClearAllData()
    setConfirmAction(null)
  }

  const handleCancel = (): void => {
    setSelectedFile(null)
    setConfirmAction(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <ProgressOverlay isVisible={isImporting || isClearing} progress={progress} />
      <Card className={className}>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Export, import, or clear your data
            </p>
          </div>
        </div>

        {/* Export Section */}
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Export Data</h3>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Download all your data as a JSON file (tasks, thoughts, projects, settings)
            </p>
            <Button
              onClick={(): void => void handleExport()}
              isLoading={isExporting}
              disabled={isOperationInProgress}
            >
              Export to JSON
            </Button>
            {exportError !== null && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{exportError}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Import Data</h3>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Restore data from a previously exported JSON file. This will replace all existing
              data.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {confirmAction !== 'import' && !importResult && (
              <Button
                variant="secondary"
                onClick={handleImportClick}
                disabled={isOperationInProgress}
              >
                Import from JSON
              </Button>
            )}

            {/* Import Confirmation Dialog */}
            {confirmAction === 'import' && selectedFile && (
              <div className="space-y-4 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    This will replace all your data
                  </p>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    File: {selectedFile.name}
                  </p>
                  <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    Download a backup first?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={(): void => void handleDownloadAndImport()}
                    isLoading={isImporting}
                    disabled={isOperationInProgress}
                  >
                    Download Backup & Import
                  </Button>
                  <Button
                    variant="danger"
                    onClick={(): void => void handleConfirmImport()}
                    isLoading={isImporting}
                    disabled={isOperationInProgress}
                  >
                    Import Without Backup
                  </Button>
                  <Button variant="ghost" onClick={handleCancel} disabled={isOperationInProgress}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div
                className={`mt-4 rounded-lg p-4 ${
                  importResult.success
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                }`}
              >
                {importResult.success ? (
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Import successful!
                    </p>
                    <ul className="mt-2 text-sm text-green-700 dark:text-green-300">
                      <li>Tasks: {importResult.counts?.tasks ?? 0}</li>
                      <li>Thoughts: {importResult.counts?.thoughts ?? 0}</li>
                      <li>Projects: {importResult.counts?.projects ?? 0}</li>
                      {importResult.counts?.settingsImported === true && <li>Settings restored</li>}
                    </ul>
                    <Button variant="ghost" size="sm" onClick={clearImportResult} className="mt-3">
                      Dismiss
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Import failed</p>
                    <ul className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {importResult.errors?.map((err, i) => (
                        <li key={i}>
                          {err.path}: {err.message}
                        </li>
                      ))}
                    </ul>
                    <Button variant="ghost" size="sm" onClick={clearImportResult} className="mt-3">
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            )}

            {importError !== null && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{importError}</p>
            )}
          </div>

          {/* Clear Data Section */}
          <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
            <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Clear Data</h3>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Remove your data. This action cannot be undone.
            </p>

            {confirmAction !== 'clear-user' && confirmAction !== 'clear-all' && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="danger-outline"
                  onClick={(): void => {
                    setConfirmAction('clear-user')
                  }}
                  disabled={isOperationInProgress}
                >
                  Clear Tasks, Thoughts & Projects
                </Button>
                <Button
                  variant="danger-outline"
                  onClick={(): void => {
                    setConfirmAction('clear-all')
                  }}
                  disabled={isOperationInProgress}
                >
                  Clear All Data
                </Button>
              </div>
            )}

            {/* Clear User Data Confirmation */}
            {confirmAction === 'clear-user' && (
              <div className="space-y-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    Clear all tasks, thoughts, and projects?
                  </p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    Your settings will be preserved. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={(): void => void handleConfirmClearUser()}
                    isLoading={isClearing}
                    disabled={isOperationInProgress}
                  >
                    Clear Data
                  </Button>
                  <Button variant="ghost" onClick={handleCancel} disabled={isOperationInProgress}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Clear All Data Confirmation */}
            {confirmAction === 'clear-all' && (
              <div className="space-y-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">Factory reset?</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    This will remove ALL data including settings. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={(): void => void handleConfirmClearAll()}
                    isLoading={isClearing}
                    disabled={isOperationInProgress}
                  >
                    Reset Everything
                  </Button>
                  <Button variant="ghost" onClick={handleCancel} disabled={isOperationInProgress}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {clearError !== null && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{clearError}</p>
            )}
          </div>
        </div>
      </Card>
    </>
  )
}
