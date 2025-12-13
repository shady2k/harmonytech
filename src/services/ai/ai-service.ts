/**
 * AI Service - manages AI provider instances
 * Provides a unified interface for AI operations across different providers
 */

import type { AIProvider, ChatMessage, ChatResponse, ProviderType } from './types'

export class AIService {
  private provider: AIProvider | null = null

  /**
   * Set the active AI provider
   */
  setProvider(provider: AIProvider | null): void {
    this.provider = provider
  }

  /**
   * Get the current AI provider
   */
  getProvider(): AIProvider | null {
    return this.provider
  }

  /**
   * Get the current provider type
   */
  getProviderType(): ProviderType | null {
    return this.provider?.type ?? null
  }

  /**
   * Check if AI is currently available
   */
  isAvailable(): boolean {
    return this.provider?.isAvailable() === true
  }

  /**
   * Send a chat completion request
   * Returns null if no provider is available
   */
  async chat(messages: ChatMessage[], model: string): Promise<ChatResponse | null> {
    if (this.provider?.isAvailable() !== true) {
      return null
    }

    return this.provider.chat(messages, model)
  }

  /**
   * Send a chat completion request with audio input
   * Returns null if no provider is available
   */
  async chatWithAudio(
    audioBase64: string,
    audioFormat: string,
    prompt: string,
    model: string
  ): Promise<ChatResponse | null> {
    if (this.provider?.isAvailable() !== true) {
      return null
    }

    return this.provider.chatWithAudio(audioBase64, audioFormat, prompt, model)
  }

  /**
   * Validate the current provider's API key
   */
  async validateKey(): Promise<boolean> {
    if (!this.provider) {
      return false
    }

    return this.provider.validateKey()
  }
}

// Singleton instance
export const aiService = new AIService()
