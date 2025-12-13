/**
 * AI Provider abstraction types
 * Supports multiple AI providers (OpenRouter, Yandex, etc.)
 */

/**
 * Global token limit for AI requests - prevents runaway costs
 * This limits the maximum completion tokens per request
 */
export const AI_MAX_TOKENS_DEFAULT = 2000

export type ProviderType = 'openrouter' | 'yandex'

export interface ContentPart {
  type: 'text' | 'input_audio'
  text?: string
  input_audio?: {
    data: string
    format: string
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

export interface ChatResponse {
  id: string
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AIProviderConfig {
  apiKey: string
  folderId?: string // Yandex-specific
}

export interface ChatOptions {
  /** Maximum completion tokens to generate (prevents runaway costs) */
  maxTokens?: number
}

export interface AIProvider {
  readonly type: ProviderType

  /**
   * Send a chat completion request
   * @param messages - Chat messages
   * @param model - Model to use
   * @param options - Optional settings including maxTokens
   */
  chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ChatResponse>

  /**
   * Send a chat completion request with audio input
   * @param audioBase64 - Base64 encoded audio
   * @param audioFormat - Audio format (wav, mp3, etc.)
   * @param prompt - System prompt
   * @param model - Model to use
   * @param options - Optional settings including maxTokens
   */
  chatWithAudio(
    audioBase64: string,
    audioFormat: string,
    prompt: string,
    model: string,
    options?: ChatOptions
  ): Promise<ChatResponse>

  /**
   * Validate that the API key is valid
   */
  validateKey(): Promise<boolean>

  /**
   * Check if the provider is currently available
   */
  isAvailable(): boolean
}
