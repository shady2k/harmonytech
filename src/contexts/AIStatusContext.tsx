import React, { useEffect, useMemo, type ReactNode } from 'react'
import { useSettingsStore } from '@/stores'
import { aiService, createProvider } from '@/services/ai'
import { AIStatusContext } from './ai-status.context'

interface AIStatusProviderProps {
  children: ReactNode
}

export function AIStatusProvider({ children }: AIStatusProviderProps): React.JSX.Element {
  const { aiProvider, apiKey, yandexApiKey, yandexFolderId, isApiKeyValid, isLoaded } =
    useSettingsStore()

  // Derive availability directly from settings - no state needed
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

  // Initialize AI provider when settings change (side effect for external system)
  useEffect(() => {
    if (!isLoaded) return

    if (aiProvider === 'openrouter' && apiKey !== null && apiKey !== '') {
      const provider = createProvider('openrouter', { apiKey })
      aiService.setProvider(provider)
      // Validate in background to set availability
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
      // Validate in background to set availability
      void provider.validateKey()
    } else {
      aiService.setProvider(null)
    }
  }, [aiProvider, apiKey, yandexApiKey, yandexFolderId, isLoaded])

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
