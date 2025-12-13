/**
 * AI Provider abstraction types
 * Supports multiple AI providers (OpenRouter, Yandex, etc.)
 */

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

export interface AIProvider {
  readonly type: ProviderType

  /**
   * Send a chat completion request
   */
  chat(messages: ChatMessage[], model: string): Promise<ChatResponse>

  /**
   * Send a chat completion request with audio input
   */
  chatWithAudio(
    audioBase64: string,
    audioFormat: string,
    prompt: string,
    model: string
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
