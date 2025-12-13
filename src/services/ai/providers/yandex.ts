/**
 * Yandex AI Provider implementation (stub)
 * TODO: Implement full Yandex Cloud AI integration
 */

import type { AIProvider, AIProviderConfig, ChatMessage, ChatResponse } from '../types'

export class YandexProvider implements AIProvider {
  readonly type = 'yandex' as const
  private apiKey: string
  private folderId: string
  private available = false

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.folderId = config.folderId ?? ''
  }

  async chat(_messages: ChatMessage[], _model: string): Promise<ChatResponse> {
    // TODO: Implement Yandex GPT API integration
    // API endpoint: https://llm.api.cloud.yandex.net/foundationModels/v1/completion
    throw new Error('Yandex provider not yet implemented')
  }

  async chatWithAudio(
    _audioBase64: string,
    _audioFormat: string,
    _prompt: string,
    _model: string
  ): Promise<ChatResponse> {
    // TODO: Implement Yandex SpeechKit integration for audio transcription
    // Then use Yandex GPT for processing
    throw new Error('Yandex voice processing not yet implemented')
  }

  async validateKey(): Promise<boolean> {
    // TODO: Implement Yandex API key validation
    // Check against IAM token endpoint or similar
    if (!this.apiKey || !this.folderId) {
      return false
    }
    // For now, just check if credentials are provided
    this.available = false
    return false
  }

  isAvailable(): boolean {
    return this.available && this.apiKey.length > 0 && this.folderId.length > 0
  }

  getFolderId(): string {
    return this.folderId
  }
}
