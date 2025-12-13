import type { TaskContext, TaskEnergy } from './task'

export type Theme = 'light' | 'dark' | 'system'

export type AIProviderType = 'openrouter' | 'yandex'

export interface Settings {
  id: string // Always "user-settings"
  aiProvider: AIProviderType
  openRouterApiKey?: string
  yandexApiKey?: string
  yandexFolderId?: string
  textModel?: string
  voiceModel?: string
  aiEnabled?: boolean
  aiConfidenceThreshold?: number
  theme: Theme
  defaultContext: TaskContext
  defaultEnergy: TaskEnergy
}
