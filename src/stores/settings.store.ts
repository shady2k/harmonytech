import { create } from 'zustand'
import { liveQuery } from 'dexie'
import type { TaskContext, TaskEnergy } from '@/types/task'
import type { AIProviderType, Settings, Theme } from '@/types/settings'
import type { HarmonyDatabase } from '@/lib/dexie-database'
import { AI_CONFIDENCE_THRESHOLD } from '@/lib/constants/ai'
import { createLogger } from '@/lib/logger'

const log = createLogger('SettingsStore')

// Always use proxy to avoid CORS issues
const YANDEX_TOKENIZE_URL = '/api/yandex-llm/foundationModels/v1/tokenize'

interface SettingsState {
  // AI Provider settings
  aiProvider: AIProviderType | undefined // User must explicitly choose
  apiKey: string | null // OpenRouter API key
  yandexApiKey: string | null
  yandexFolderId: string | null
  textModel: string | null
  voiceModel: string | null

  // AI behavior settings
  aiEnabled: boolean
  aiConfidenceThreshold: number

  // Other settings
  theme: Theme
  defaultContext: TaskContext
  defaultEnergy: TaskEnergy

  // Validation state
  isApiKeyValid: boolean | null
  isValidating: boolean

  // Sync state
  isLoaded: boolean
  isSyncing: boolean
}

interface SettingsActions {
  // AI Provider
  setAIProvider: (provider: AIProviderType) => void
  setApiKey: (apiKey: string | null) => void
  setYandexApiKey: (apiKey: string | null) => void
  setYandexFolderId: (folderId: string | null) => void
  validateApiKey: () => Promise<boolean>
  getActiveApiKey: () => string | null

  // AI behavior
  setAIEnabled: (enabled: boolean) => void
  setAIConfidenceThreshold: (threshold: number) => void

  // Settings updates
  setTextModel: (model: string | null) => void
  setVoiceModel: (model: string | null) => void
  setTheme: (theme: Theme) => void
  setDefaultContext: (context: TaskContext) => void
  setDefaultEnergy: (energy: TaskEnergy) => void

  // Database sync
  loadFromDatabase: (db: HarmonyDatabase) => Promise<void>
  syncToDatabase: (db: HarmonyDatabase) => Promise<void>
  subscribeToDatabase: (db: HarmonyDatabase) => () => void

  // Reset
  reset: () => void
}

const initialState: SettingsState = {
  aiProvider: undefined,
  apiKey: null,
  yandexApiKey: null,
  yandexFolderId: null,
  textModel: null,
  voiceModel: null,
  aiEnabled: true,
  aiConfidenceThreshold: AI_CONFIDENCE_THRESHOLD,
  theme: 'system',
  defaultContext: 'anywhere',
  defaultEnergy: 'medium',
  isApiKeyValid: null,
  isValidating: false,
  isLoaded: false,
  isSyncing: false,
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => ({
  ...initialState,

  // AI Provider
  setAIProvider: (aiProvider): void => {
    set({ aiProvider, isApiKeyValid: null })
  },

  setApiKey: (apiKey): void => {
    set({ apiKey, isApiKeyValid: null })
  },

  setYandexApiKey: (yandexApiKey): void => {
    set({ yandexApiKey, isApiKeyValid: null })
  },

  setYandexFolderId: (yandexFolderId): void => {
    set({ yandexFolderId })
  },

  setAIEnabled: (aiEnabled): void => {
    set({ aiEnabled })
  },

  setAIConfidenceThreshold: (aiConfidenceThreshold): void => {
    set({ aiConfidenceThreshold })
  },

  getActiveApiKey: (): string | null => {
    const { aiProvider, apiKey, yandexApiKey } = get()
    if (aiProvider === undefined) return null
    return aiProvider === 'openrouter' ? apiKey : yandexApiKey
  },

  validateApiKey: async (): Promise<boolean> => {
    const { aiProvider, apiKey, yandexApiKey, yandexFolderId } = get()

    if (aiProvider === undefined) {
      set({ isApiKeyValid: false })
      return false
    }

    const activeKey = aiProvider === 'openrouter' ? apiKey : yandexApiKey
    if (activeKey === null || activeKey === '') {
      set({ isApiKeyValid: false })
      return false
    }

    set({ isValidating: true })

    try {
      if (aiProvider === 'openrouter') {
        // Test OpenRouter API key
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 10000)

        const response = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            Authorization: `Bearer ${activeKey}`,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const isValid = response.ok
        set({ isApiKeyValid: isValid, isValidating: false })
        return isValid
      } else {
        // Yandex validation - test the API with tokenize endpoint
        if (
          yandexApiKey === null ||
          yandexApiKey === '' ||
          yandexFolderId === null ||
          yandexFolderId === ''
        ) {
          set({ isApiKeyValid: false, isValidating: false })
          return false
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 10000)

        const response = await fetch(YANDEX_TOKENIZE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Api-Key ${yandexApiKey}`,
            'x-folder-id': yandexFolderId,
          },
          body: JSON.stringify({
            modelUri: `gpt://${yandexFolderId}/yandexgpt-lite`,
            text: 'test',
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const isValid = response.ok
        set({ isApiKeyValid: isValid, isValidating: false })
        return isValid
      }
    } catch {
      set({ isApiKeyValid: false, isValidating: false })
      return false
    }
  },

  // Settings updates
  setTextModel: (textModel): void => {
    set({ textModel })
  },
  setVoiceModel: (voiceModel): void => {
    set({ voiceModel })
  },
  setTheme: (theme): void => {
    set({ theme })
  },
  setDefaultContext: (defaultContext): void => {
    set({ defaultContext })
  },
  setDefaultEnergy: (defaultEnergy): void => {
    set({ defaultEnergy })
  },

  // Database sync
  loadFromDatabase: async (db): Promise<void> => {
    try {
      const settingsDoc = await db.settings.get('user-settings')
      if (settingsDoc !== undefined) {
        set({
          aiProvider: settingsDoc.aiProvider,
          apiKey: settingsDoc.openRouterApiKey ?? null,
          yandexApiKey: settingsDoc.yandexApiKey ?? null,
          yandexFolderId: settingsDoc.yandexFolderId ?? null,
          textModel: settingsDoc.textModel ?? null,
          voiceModel: settingsDoc.voiceModel ?? null,
          aiEnabled: settingsDoc.aiEnabled ?? true,
          aiConfidenceThreshold: settingsDoc.aiConfidenceThreshold ?? AI_CONFIDENCE_THRESHOLD,
          theme: settingsDoc.theme,
          defaultContext: settingsDoc.defaultContext,
          defaultEnergy: settingsDoc.defaultEnergy,
          isLoaded: true,
        })
      }
    } catch {
      throw new Error('Failed to load settings from database')
    }
  },

  syncToDatabase: async (db): Promise<void> => {
    const {
      aiProvider,
      apiKey,
      yandexApiKey,
      yandexFolderId,
      textModel,
      voiceModel,
      aiEnabled,
      aiConfidenceThreshold,
      theme,
      defaultContext,
      defaultEnergy,
    } = get()

    set({ isSyncing: true })

    const updatedAt = new Date().toISOString()
    log.debug('syncToDatabase called', { aiProvider, updatedAt })

    try {
      // Use put for upsert - creates record if it doesn't exist
      await db.settings.put({
        id: 'user-settings',
        aiProvider,
        openRouterApiKey: apiKey ?? undefined,
        yandexApiKey: yandexApiKey ?? undefined,
        yandexFolderId: yandexFolderId ?? undefined,
        textModel: textModel ?? undefined,
        voiceModel: voiceModel ?? undefined,
        aiEnabled,
        aiConfidenceThreshold,
        theme,
        defaultContext,
        defaultEnergy,
        updatedAt,
      })
      log.debug('syncToDatabase completed', { updatedAt })
    } catch (err) {
      log.error('syncToDatabase failed', err)
      throw new Error('Failed to sync settings to database')
    } finally {
      set({ isSyncing: false })
    }
  },

  subscribeToDatabase: (db): (() => void) => {
    // Use Dexie's liveQuery for reactive updates
    const observable = liveQuery(() => db.settings.get('user-settings'))
    const subscription = observable.subscribe({
      next: (settingsDoc: Settings | undefined): void => {
        if (settingsDoc !== undefined) {
          set({
            aiProvider: settingsDoc.aiProvider,
            apiKey: settingsDoc.openRouterApiKey ?? null,
            yandexApiKey: settingsDoc.yandexApiKey ?? null,
            yandexFolderId: settingsDoc.yandexFolderId ?? null,
            textModel: settingsDoc.textModel ?? null,
            voiceModel: settingsDoc.voiceModel ?? null,
            aiEnabled: settingsDoc.aiEnabled ?? true,
            aiConfidenceThreshold: settingsDoc.aiConfidenceThreshold ?? AI_CONFIDENCE_THRESHOLD,
            theme: settingsDoc.theme,
            defaultContext: settingsDoc.defaultContext,
            defaultEnergy: settingsDoc.defaultEnergy,
            isLoaded: true,
          })
        } else {
          // Document was deleted or doesn't exist, reset to defaults
          set({ ...initialState, isLoaded: true })
        }
      },
      error: (): void => {
        // Handle subscription errors silently, keep current state
        set({ isLoaded: true })
      },
    })

    return (): void => {
      subscription.unsubscribe()
    }
  },

  // Reset
  reset: (): void => {
    set(initialState)
  },
}))
