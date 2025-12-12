import { create } from 'zustand'
import type { TaskContext, TaskEnergy } from '@/types/task'
import type { Settings, Theme } from '@/types/settings'
import type { HarmonyTechDatabase } from '@/lib/database'
import type { RxDocument } from 'rxdb'

interface SettingsState {
  // Settings values
  apiKey: string | null
  textModel: string | null
  voiceModel: string | null
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
  // API Key
  setApiKey: (apiKey: string | null) => void
  validateApiKey: () => Promise<boolean>

  // Settings updates
  setTextModel: (model: string | null) => void
  setVoiceModel: (model: string | null) => void
  setTheme: (theme: Theme) => void
  setDefaultContext: (context: TaskContext) => void
  setDefaultEnergy: (energy: TaskEnergy) => void

  // Database sync
  loadFromDatabase: (db: HarmonyTechDatabase) => Promise<void>
  syncToDatabase: (db: HarmonyTechDatabase) => Promise<void>
  subscribeToDatabase: (db: HarmonyTechDatabase) => () => void

  // Reset
  reset: () => void
}

const initialState: SettingsState = {
  apiKey: null,
  textModel: null,
  voiceModel: null,
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

  // API Key
  setApiKey: (apiKey): void => {
    set({ apiKey, isApiKeyValid: null })
  },

  validateApiKey: async (): Promise<boolean> => {
    const { apiKey } = get()
    if (apiKey === null || apiKey === '') {
      set({ isApiKeyValid: false })
      return false
    }

    set({ isValidating: true })

    try {
      // Test the API key with a timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 10000) // 10 second timeout

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const isValid = response.ok
      set({ isApiKeyValid: isValid, isValidating: false })
      return isValid
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
      const settingsDoc = await db.settings.findOne('user-settings').exec()
      if (settingsDoc) {
        set({
          apiKey: settingsDoc.openRouterApiKey ?? null,
          textModel: settingsDoc.textModel ?? null,
          voiceModel: settingsDoc.voiceModel ?? null,
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
    const { apiKey, textModel, voiceModel, theme, defaultContext, defaultEnergy } = get()

    set({ isSyncing: true })

    try {
      const settingsDoc = await db.settings.findOne('user-settings').exec()
      if (settingsDoc) {
        await settingsDoc.patch({
          openRouterApiKey: apiKey ?? undefined,
          textModel: textModel ?? undefined,
          voiceModel: voiceModel ?? undefined,
          theme,
          defaultContext,
          defaultEnergy,
        })
      }
    } catch {
      throw new Error('Failed to sync settings to database')
    } finally {
      set({ isSyncing: false })
    }
  },

  subscribeToDatabase: (db): (() => void) => {
    const subscription = db.settings.findOne('user-settings').$.subscribe({
      next: (settingsDoc: RxDocument<Settings> | null): void => {
        if (settingsDoc) {
          set({
            apiKey: settingsDoc.openRouterApiKey ?? null,
            textModel: settingsDoc.textModel ?? null,
            voiceModel: settingsDoc.voiceModel ?? null,
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
