import { useState, useCallback, type ReactElement, type ChangeEvent } from 'react'
import { useSettingsStore } from '@/stores'
import { useDatabase } from '@/hooks'
import { Button, Input } from '@/components/ui'
import { NavIcon } from '@/components/layout/NavIcon'

export function ApiKeySetup(): ReactElement {
  const { db } = useDatabase()
  const { apiKey, isApiKeyValid, isValidating, setApiKey, validateApiKey, syncToDatabase } =
    useSettingsStore()

  const [inputValue, setInputValue] = useState(apiKey ?? '')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value)
  }, [])

  const handleTest = useCallback(async (): Promise<void> => {
    setApiKey(inputValue)
    await validateApiKey()
  }, [inputValue, setApiKey, validateApiKey])

  const handleSave = useCallback(async (): Promise<void> => {
    if (db === null) return

    setIsSaving(true)
    try {
      setApiKey(inputValue)
      const isValid = await validateApiKey()
      if (isValid) {
        await syncToDatabase(db)
      }
    } finally {
      setIsSaving(false)
    }
  }, [inputValue, setApiKey, validateApiKey, syncToDatabase, db])

  const handleClear = useCallback((): void => {
    setInputValue('')
    setApiKey(null)
  }, [setApiKey])

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
    if (isApiKeyValid === true) return 'API key is valid'
    if (isApiKeyValid === false) return 'Invalid API key'
    return ''
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="api-key-input"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          OpenRouter API Key
        </label>
        <div className="relative">
          <Input
            id="api-key-input"
            type={showKey ? 'text' : 'password'}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="sk-or-v1-..."
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
        {isApiKeyValid !== null && (
          <p
            className={`mt-1 text-sm ${
              isApiKeyValid
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {getStatusMessage()}
          </p>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Get your API key from{' '}
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          OpenRouter
        </a>
        . Your key is stored locally and never sent to our servers.
      </p>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={(): void => {
            void handleTest()
          }}
          disabled={inputValue.trim() === '' || isValidating}
        >
          Test Connection
        </Button>
        <Button
          variant="primary"
          onClick={(): void => {
            void handleSave()
          }}
          disabled={inputValue.trim() === '' || isValidating || isSaving || db === null}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        {apiKey !== null && apiKey !== '' && (
          <Button variant="ghost" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
