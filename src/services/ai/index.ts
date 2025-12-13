/**
 * AI Service module
 * Unified AI provider abstraction layer
 */

export * from './types'
export { AIService, aiService } from './ai-service'
export { OpenRouterProvider } from './providers/openrouter'
export { YandexProvider } from './providers/yandex'

import type { AIProvider, AIProviderConfig, ProviderType } from './types'
import { OpenRouterProvider } from './providers/openrouter'
import { YandexProvider } from './providers/yandex'

/**
 * Factory function to create AI provider instances
 */
export function createProvider(type: ProviderType, config: AIProviderConfig): AIProvider {
  switch (type) {
    case 'openrouter':
      return new OpenRouterProvider(config)
    case 'yandex':
      return new YandexProvider(config)
    default: {
      const exhaustiveCheck: never = type
      throw new Error(`Unknown provider type: ${exhaustiveCheck}`)
    }
  }
}
