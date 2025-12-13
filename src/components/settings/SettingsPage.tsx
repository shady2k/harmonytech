import type { ReactElement } from 'react'
import { Card } from '@/components/ui/Card'
import { ApiKeySetup } from './ApiKeySetup'
import { YandexSettings } from './YandexSettings'
import { SyncSettings } from './SyncSettings'
import { ThemeToggle } from './ThemeToggle'
import { useSettingsStore } from '@/stores'
import { useDatabase } from '@/hooks'
import type { AIProviderType } from '@/types/settings'

interface SettingsPageProps {
  className?: string
}

export function SettingsPage({ className = '' }: SettingsPageProps): ReactElement {
  const { db } = useDatabase()
  const { aiProvider, setAIProvider, syncToDatabase } = useSettingsStore()

  const handleProviderChange = async (provider: AIProviderType): Promise<void> => {
    setAIProvider(provider)
    if (db) {
      await syncToDatabase(db)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your preferences and configuration
        </p>
      </div>

      {/* AI Settings */}
      <section>
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <svg
                className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure your AI provider for intelligent features
              </p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              AI Provider
            </label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="ai-provider"
                  value="openrouter"
                  checked={aiProvider === 'openrouter'}
                  onChange={(): void => {
                    void handleProviderChange('openrouter')
                  }}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">OpenRouter</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="ai-provider"
                  value="yandex"
                  checked={aiProvider === 'yandex'}
                  onChange={(): void => {
                    void handleProviderChange('yandex')
                  }}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Yandex Cloud</span>
              </label>
            </div>
          </div>

          {/* Provider-specific settings */}
          {aiProvider === 'openrouter' ? <ApiKeySetup /> : <YandexSettings />}
        </Card>
      </section>

      {/* Sync Settings */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sync</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sync your data across devices
            </p>
          </div>
        </div>
        <SyncSettings />
      </section>

      {/* Display Settings */}
      <section>
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
              <svg
                className="h-5 w-5 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Display</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize the app appearance
              </p>
            </div>
          </div>
          <ThemeToggle />
        </Card>
      </section>

      {/* About */}
      <section>
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
              <svg
                className="h-5 w-5 text-gray-600 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Information about HarmonyTech
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Version</span>
              <span className="font-medium text-gray-900 dark:text-white">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Built with</span>
              <span className="font-medium text-gray-900 dark:text-white">React, RxDB, Yjs</span>
            </div>
            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">
                HarmonyTech is a GTD-inspired task manager with AI assistance and P2P sync. Your
                data stays local and syncs directly between your devices.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
