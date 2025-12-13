import { useState, useCallback, useEffect, type ReactElement, type ChangeEvent } from 'react'
import { useSettingsStore } from '@/stores'
import { useDatabase } from '@/hooks'
import { Button, Input } from '@/components/ui'
import { NavIcon } from '@/components/layout/NavIcon'

// Available Yandex GPT models
const YANDEX_MODELS = [
  { id: 'yandexgpt-lite', name: 'YandexGPT Lite', description: 'Fast and cost-effective' },
  { id: 'yandexgpt', name: 'YandexGPT', description: 'Higher quality, more capable' },
]

export function YandexSettings(): ReactElement {
  const { db } = useDatabase()
  const {
    yandexApiKey,
    yandexFolderId,
    textModel,
    isApiKeyValid,
    isValidating,
    setYandexApiKey,
    setYandexFolderId,
    setTextModel,
    validateApiKey,
    syncToDatabase,
  } = useSettingsStore()

  const [apiKeyInput, setApiKeyInput] = useState(yandexApiKey ?? '')
  const [folderIdInput, setFolderIdInput] = useState(yandexFolderId ?? '')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Sync input values when loaded from database
  useEffect(() => {
    if (yandexApiKey !== null && yandexApiKey !== '' && apiKeyInput === '') {
      setApiKeyInput(yandexApiKey)
    }
    if (yandexFolderId !== null && yandexFolderId !== '' && folderIdInput === '') {
      setFolderIdInput(yandexFolderId)
    }
  }, [yandexApiKey, yandexFolderId, apiKeyInput, folderIdInput])

  // Validate when credentials load from database
  useEffect(() => {
    if (
      yandexApiKey !== null &&
      yandexApiKey !== '' &&
      yandexFolderId !== null &&
      yandexFolderId !== '' &&
      isApiKeyValid === null &&
      !isValidating
    ) {
      void validateApiKey()
    }
  }, [yandexApiKey, yandexFolderId, isApiKeyValid, isValidating, validateApiKey])

  const handleApiKeyChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setApiKeyInput(e.target.value)
  }, [])

  const handleFolderIdChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setFolderIdInput(e.target.value)
  }, [])

  const handleTest = useCallback(async (): Promise<void> => {
    setYandexApiKey(apiKeyInput)
    setYandexFolderId(folderIdInput)
    await validateApiKey()
  }, [apiKeyInput, folderIdInput, setYandexApiKey, setYandexFolderId, validateApiKey])

  const handleSave = useCallback(async (): Promise<void> => {
    if (db === null) return

    setIsSaving(true)
    try {
      setYandexApiKey(apiKeyInput)
      setYandexFolderId(folderIdInput)
      const isValid = await validateApiKey()
      if (isValid) {
        await syncToDatabase(db)
      }
    } finally {
      setIsSaving(false)
    }
  }, [
    apiKeyInput,
    folderIdInput,
    setYandexApiKey,
    setYandexFolderId,
    validateApiKey,
    syncToDatabase,
    db,
  ])

  const handleClear = useCallback((): void => {
    setApiKeyInput('')
    setFolderIdInput('')
    setYandexApiKey(null)
    setYandexFolderId(null)
  }, [setYandexApiKey, setYandexFolderId])

  const toggleShowKey = useCallback((): void => {
    setShowKey((prev) => !prev)
  }, [])

  const getStatusIcon = (): ReactElement | null => {
    if (isValidating) {
      return (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
      )
    }
    if (isApiKeyValid === true) {
      return <NavIcon name="check" className="h-4 w-4 text-green-500" />
    }
    if (isApiKeyValid === false) {
      return <NavIcon name="close" className="h-4 w-4 text-red-500" />
    }
    return null
  }

  const getStatusMessage = (): string => {
    if (isValidating) return 'Validating...'
    if (isApiKeyValid === true) return 'Credentials are valid'
    if (isApiKeyValid === false) return 'Invalid credentials'
    return ''
  }

  const isInputValid = apiKeyInput.trim() !== '' && folderIdInput.trim() !== ''

  return (
    <div className="space-y-4">
      {/* API Key Input */}
      <div>
        <label
          htmlFor="yandex-api-key-input"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Yandex Cloud API Key
        </label>
        <div className="relative">
          <Input
            id="yandex-api-key-input"
            type={showKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={handleApiKeyChange}
            placeholder="AQVN..."
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <button
              type="button"
              onClick={toggleShowKey}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              <NavIcon name={showKey ? 'eyeOff' : 'eye'} className="h-4 w-4" />
            </button>
            {getStatusIcon()}
          </div>
        </div>
      </div>

      {/* Folder ID Input */}
      <div>
        <label
          htmlFor="yandex-folder-id-input"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Folder ID
        </label>
        <Input
          id="yandex-folder-id-input"
          type="text"
          value={folderIdInput}
          onChange={handleFolderIdChange}
          placeholder="b1g..."
        />
      </div>

      {isApiKeyValid !== null && (
        <p
          className={`text-sm ${
            isApiKeyValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {getStatusMessage()}
        </p>
      )}

      {/* Model Selection - shown when credentials are valid */}
      {isApiKeyValid === true && (
        <div>
          <label
            htmlFor="yandex-model-select"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            YandexGPT Model
          </label>
          <select
            id="yandex-model-select"
            value={textModel ?? 'yandexgpt-lite'}
            onChange={(e): void => {
              setTextModel(e.target.value)
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {YANDEX_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.description}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Voice transcription uses Yandex SpeechKit (no model selection needed)
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Get your API key from{' '}
        <a
          href="https://console.cloud.yandex.com/folders"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Yandex Cloud Console
        </a>
        . You&apos;ll need an API key and the Folder ID where your resources are located. Your
        credentials are stored locally and never sent to our servers.
      </p>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={(): void => {
            void handleTest()
          }}
          disabled={!isInputValid || isValidating}
        >
          Test Connection
        </Button>
        <Button
          variant="primary"
          onClick={(): void => {
            void handleSave()
          }}
          disabled={!isInputValid || isValidating || isSaving || db === null}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        {yandexApiKey !== null && yandexApiKey !== '' && (
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {/* Note about Yandex features */}
      <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Note:</strong> Yandex Cloud integration supports YandexGPT for text processing and
          SpeechKit for voice transcription. Some features may have different capabilities compared
          to OpenRouter.
        </p>
      </div>
    </div>
  )
}
