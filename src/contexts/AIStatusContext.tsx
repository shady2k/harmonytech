import React, { useLayoutEffect, useMemo, type ReactNode } from 'react'
import { useSettingsStore } from '@/stores'
import { aiService, createProvider } from '@/services/ai'
import { AIStatusContext } from './ai-status.context'

interface AIStatusProviderProps {
  children: ReactNode
}

// Module-level tracking for synchronous provider initialization
let lastInitializedConfig: string | null = null

function initializeProvider(
  aiProvider: string | undefined,
  apiKey: string | null,
  yandexApiKey: string | null,
  yandexFolderId: string | null
): void {
  const configKey = `${aiProvider ?? ''}-${apiKey ?? ''}-${yandexApiKey ?? ''}-${yandexFolderId ?? ''}`

  if (lastInitializedConfig === configKey) {
    return // Already initialized with this config
  }
  lastInitializedConfig = configKey

  if (aiProvider === 'openrouter' && apiKey !== null && apiKey !== '') {
    const provider = createProvider('openrouter', { apiKey })
    aiService.setProvider(provider)
    void provider.validateKey()
  } else if (
    aiProvider === 'yandex' &&
    yandexApiKey !== null &&
    yandexApiKey !== '' &&
    yandexFolderId !== null &&
    yandexFolderId !== ''
  ) {
    const provider = createProvider('yandex', {
      apiKey: yandexApiKey,
      folderId: yandexFolderId,
    })
    aiService.setProvider(provider)
    void provider.validateKey()
  } else {
    aiService.setProvider(null)
  }
}

export function AIStatusProvider({ children }: AIStatusProviderProps): React.JSX.Element {
  const { aiProvider, apiKey, yandexApiKey, yandexFolderId, isApiKeyValid, isLoaded } =
    useSettingsStore()

  // Initialize provider synchronously using useLayoutEffect (runs before paint)
  // This ensures provider is ready before child effects run
  useLayoutEffect(() => {
    if (isLoaded) {
      initializeProvider(aiProvider, apiKey, yandexApiKey, yandexFolderId)
    }
  }, [isLoaded, aiProvider, apiKey, yandexApiKey, yandexFolderId])

  // Also initialize on first render if settings already loaded
  // This handles the case where settings were loaded before this component mounted
  if (isLoaded) {
    initializeProvider(aiProvider, apiKey, yandexApiKey, yandexFolderId)
  }

  // Derive availability from settings
  const { isAIAvailable, aiError } = useMemo(() => {
    if (!isLoaded) return { isAIAvailable: false, aiError: null }

    if (isApiKeyValid !== null) {
      return {
        isAIAvailable: isApiKeyValid,
        aiError: isApiKeyValid ? null : 'Invalid API credentials',
      }
    }

    if (aiProvider === 'openrouter' && apiKey !== null && apiKey !== '') {
      return { isAIAvailable: true, aiError: null }
    } else if (
      aiProvider === 'yandex' &&
      yandexApiKey !== null &&
      yandexApiKey !== '' &&
      yandexFolderId !== null &&
      yandexFolderId !== ''
    ) {
      return { isAIAvailable: true, aiError: null }
    }

    return { isAIAvailable: false, aiError: 'AI provider not configured' }
  }, [isLoaded, aiProvider, apiKey, yandexApiKey, yandexFolderId, isApiKeyValid])

  return (
    <AIStatusContext.Provider
      value={{
        isAIAvailable,
        aiProvider,
        aiError,
      }}
    >
      {children}
    </AIStatusContext.Provider>
  )
}
