import type { ReactElement } from 'react'
import { useAIStatus } from '@/contexts/AIStatusContext'
import { useSettingsStore } from '@/stores'
import { NavIcon } from './NavIcon'

type AIStatus = 'connected' | 'disconnected' | 'not-configured'

export function AIStatusIndicator(): ReactElement {
  const { isAIAvailable, aiProvider } = useAIStatus()
  const { apiKey, yandexApiKey, yandexFolderId } = useSettingsStore()

  const getStatus = (): AIStatus => {
    if (aiProvider === 'openrouter') {
      if (apiKey === null || apiKey === '') return 'not-configured'
      return isAIAvailable ? 'connected' : 'disconnected'
    } else {
      if (
        yandexApiKey === null ||
        yandexApiKey === '' ||
        yandexFolderId === null ||
        yandexFolderId === ''
      )
        return 'not-configured'
      return isAIAvailable ? 'connected' : 'disconnected'
    }
  }

  const status = getStatus()

  const getProviderLabel = (): string => {
    return aiProvider === 'openrouter' ? 'OpenRouter' : 'Yandex'
  }

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      label: 'Connected',
      icon: 'check' as const,
    },
    disconnected: {
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      label: 'Disconnected',
      icon: 'close' as const,
    },
    'not-configured': {
      color: 'bg-gray-400',
      textColor: 'text-gray-500 dark:text-gray-400',
      label: 'Not configured',
      icon: 'settings' as const,
    },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <NavIcon name="sparkles" className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        <span
          className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${config.color}`}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
          {getProviderLabel()}
        </p>
        <p className={`text-xs ${config.textColor} truncate`}>{config.label}</p>
      </div>
    </div>
  )
}
