import { useState, useCallback, useEffect, type ReactElement, type ChangeEvent } from 'react'
import { useSettingsStore } from '@/stores'
import { useDatabase } from '@/hooks'
import { Button, Input } from '@/components/ui'
import { NavIcon } from '@/components/layout/NavIcon'

interface OpenRouterModel {
  id: string
  name: string
  context_length: number
  pricing: { prompt: string; completion: string }
  architecture?: {
    modality?: string
    input_modalities?: string[]
  }
}

export function ApiKeySetup(): ReactElement {
  const { db } = useDatabase()
  const {
    apiKey,
    textModel,
    voiceModel,
    isApiKeyValid,
    isValidating,
    setApiKey,
    setTextModel,
    setVoiceModel,
    validateApiKey,
    syncToDatabase,
  } = useSettingsStore()

  const [inputValue, setInputValue] = useState(apiKey ?? '')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [models, setModels] = useState<OpenRouterModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Sync input value and validate when apiKey loads from database
  useEffect(() => {
    if (apiKey !== null && apiKey !== '') {
      if (inputValue === '') {
        setInputValue(apiKey)
      }
      // Validate the loaded API key if not already validated
      if (isApiKeyValid === null && !isValidating) {
        void validateApiKey()
      }
    }
  }, [apiKey, inputValue, isApiKeyValid, isValidating, validateApiKey])

  // Fetch models when API key is valid
  useEffect(() => {
    if (isApiKeyValid !== true || apiKey === null || apiKey === '') {
      setModels([])
      return
    }

    const fetchModels = async (): Promise<void> => {
      setIsLoadingModels(true)
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (response.ok) {
          const data = (await response.json()) as { data: OpenRouterModel[] }
          setModels(data.data)
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoadingModels(false)
      }
    }

    void fetchModels()
  }, [apiKey, isApiKeyValid])

  // Filter models for text and voice (multimodal with audio support)
  const textModels = models.filter((m) => !m.id.includes('whisper') && !m.id.includes('tts'))

  // Voice models are multimodal models that support audio input
  const voiceModels = models.filter((m) => {
    const modalities = m.architecture?.input_modalities ?? []
    const modality = m.architecture?.modality ?? ''
    return modalities.includes('audio') || modality.includes('audio')
  })

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

      {/* Model Selection */}
      {isApiKeyValid === true && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="text-model-select"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Text Model
            </label>
            <select
              id="text-model-select"
              value={textModel ?? ''}
              onChange={(e): void => {
                setTextModel(e.target.value || null)
              }}
              disabled={isLoadingModels}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">{isLoadingModels ? 'Loading...' : 'Select a model'}</option>
              {textModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="voice-model-select"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Voice Model (Audio Processing)
            </label>
            <select
              id="voice-model-select"
              value={voiceModel ?? ''}
              onChange={(e): void => {
                setVoiceModel(e.target.value || null)
              }}
              disabled={isLoadingModels}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">{isLoadingModels ? 'Loading...' : 'Select a model'}</option>
              {voiceModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            {voiceModels.length === 0 && !isLoadingModels && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                No speech-to-text models available
              </p>
            )}
          </div>
        </div>
      )}

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
