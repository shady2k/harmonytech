/**
 * AI Service - manages AI provider instances
 * Provides a unified interface for AI operations across different providers
 */

import type { AIProvider, ChatMessage, ChatOptions, ChatResponse, ProviderType } from './types'
import { AI_MAX_TOKENS_DEFAULT } from './types'
import { logger } from '@/lib/logger'

const log = logger.ai

export class AIService {
  private provider: AIProvider | null = null

  /**
   * Set the active AI provider
   */
  setProvider(provider: AIProvider | null): void {
    log.debug('Setting provider:', provider?.type ?? 'null')
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
   * @param messages - Chat messages
   * @param model - Model to use
   * @param options - Optional settings (maxTokens defaults to AI_MAX_TOKENS_DEFAULT)
   */
  async chat(
    messages: ChatMessage[],
    model: string,
    options?: ChatOptions
  ): Promise<ChatResponse | null> {
    if (this.provider?.isAvailable() !== true) {
      log.debug('Chat request skipped - provider not available')
      return null
    }

    // Apply global token limit protection
    const effectiveOptions: ChatOptions = {
      maxTokens: options?.maxTokens ?? AI_MAX_TOKENS_DEFAULT,
    }

    log.debug('Chat request:', {
      provider: this.provider.type,
      model,
      maxTokens: effectiveOptions.maxTokens,
      messageCount: messages.length,
      messages: messages.map((m) => ({
        role: m.role,
        contentPreview:
          typeof m.content === 'string'
            ? m.content.slice(0, 200) + (m.content.length > 200 ? '...' : '')
            : '[multipart content]',
      })),
    })

    try {
      const response = await this.provider.chat(messages, model, effectiveOptions)
      log.debug('Chat response:', {
        id: response.id,
        contentPreview:
          response.content.slice(0, 500) + (response.content.length > 500 ? '...' : ''),
        contentLength: response.content.length,
        usage: response.usage,
      })
      return response
    } catch (error) {
      log.error('Chat error:', error)
      throw error
    }
  }

  /**
   * Send a chat completion request with audio input
   * Returns null if no provider is available
   * @param audioBase64 - Base64 encoded audio
   * @param audioFormat - Audio format
   * @param prompt - System prompt
   * @param model - Model to use
   * @param options - Optional settings (maxTokens defaults to AI_MAX_TOKENS_DEFAULT)
   */
  async chatWithAudio(
    audioBase64: string,
    audioFormat: string,
    prompt: string,
    model: string,
    options?: ChatOptions
  ): Promise<ChatResponse | null> {
    if (this.provider?.isAvailable() !== true) {
      log.debug('Audio chat request skipped - provider not available')
      return null
    }

    // Apply global token limit protection
    const effectiveOptions: ChatOptions = {
      maxTokens: options?.maxTokens ?? AI_MAX_TOKENS_DEFAULT,
    }

    log.debug('Audio chat request:', {
      provider: this.provider.type,
      model,
      maxTokens: effectiveOptions.maxTokens,
      audioFormat,
      audioSizeKB: Math.round(audioBase64.length / 1024),
      promptPreview: prompt.slice(0, 200) + (prompt.length > 200 ? '...' : ''),
    })

    try {
      const response = await this.provider.chatWithAudio(
        audioBase64,
        audioFormat,
        prompt,
        model,
        effectiveOptions
      )
      log.debug('Audio chat response:', {
        id: response.id,
        contentPreview:
          response.content.slice(0, 500) + (response.content.length > 500 ? '...' : ''),
        contentLength: response.content.length,
        usage: response.usage,
      })
      return response
    } catch (error) {
      log.error('Audio chat error:', error)
      throw error
    }
  }

  /**
   * Validate the current provider's API key
   */
  async validateKey(): Promise<boolean> {
    if (!this.provider) {
      log.debug('Key validation skipped - no provider')
      return false
    }

    log.debug('Validating API key for provider:', this.provider.type)
    try {
      const isValid = await this.provider.validateKey()
      log.debug('Key validation result:', { provider: this.provider.type, isValid })
      return isValid
    } catch (error) {
      log.error('Key validation error:', error)
      return false
    }
  }
}

// Singleton instance
export const aiService = new AIService()
