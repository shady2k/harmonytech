import { create } from 'zustand'
import { useSettingsStore } from './settings.store'

interface CacheEntry {
  data: unknown
  expiresAt: number
}

interface AICacheState {
  cache: Map<string, CacheEntry>
}

interface AICacheActions {
  get: (key: string) => unknown
  set: (key: string, data: unknown, ttlMs: number) => void
  invalidate: (pattern?: string) => void
  clear: () => void
}

export const useAICacheStore = create<AICacheState & AICacheActions>((set, get) => ({
  cache: new Map(),

  get: (key: string): unknown => {
    const { cache } = get()
    const entry = cache.get(key)

    if (entry === undefined) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      // Remove expired entry
      const newCache = new Map(cache)
      newCache.delete(key)
      set({ cache: newCache })
      return null
    }

    return entry.data
  },

  set: (key: string, data: unknown, ttlMs: number): void => {
    const { cache } = get()
    const newCache = new Map(cache)
    newCache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    })
    set({ cache: newCache })
  },

  invalidate: (pattern?: string): void => {
    const { cache } = get()

    if (pattern === undefined) {
      set({ cache: new Map() })
      return
    }

    const newCache = new Map(cache)
    for (const key of newCache.keys()) {
      if (key.startsWith(pattern)) {
        newCache.delete(key)
      }
    }
    set({ cache: newCache })
  },

  clear: (): void => {
    set({ cache: new Map() })
  },
}))

// Subscribe to settings changes and clear cache when AI settings change
let unsubscribe: (() => void) | null = null

export function initAICacheSubscription(): () => void {
  if (unsubscribe !== null) {
    return unsubscribe
  }

  unsubscribe = useSettingsStore.subscribe((state, prevState) => {
    // Clear cache when AI provider, API key, or model changes
    if (
      state.aiProvider !== prevState.aiProvider ||
      state.apiKey !== prevState.apiKey ||
      state.yandexApiKey !== prevState.yandexApiKey ||
      state.textModel !== prevState.textModel
    ) {
      useAICacheStore.getState().clear()
    }
  })

  return unsubscribe
}
