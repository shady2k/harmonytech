/**
 * Yandex AI Provider implementation
 * Supports YandexGPT for chat and SpeechKit for STT
 */

import type {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ContentPart,
} from '../types'
import { AI_MAX_TOKENS_DEFAULT } from '../types'
import { logger } from '@/lib/logger'

const log = logger.yandex

// API endpoints - use proxy in development to avoid CORS issues
const isDev = import.meta.env.DEV
const YANDEX_GPT_URL = isDev
  ? '/api/yandex-llm/foundationModels/v1/completion'
  : 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
const YANDEX_STT_URL = isDev
  ? '/api/yandex-stt/stt/v3/recognizeFileAsync'
  : 'https://stt.api.cloud.yandex.net/stt/v3/recognizeFileAsync'
const YANDEX_STT_RESULT_URL = isDev
  ? '/api/yandex-stt/stt/v3/getRecognition'
  : 'https://stt.api.cloud.yandex.net/stt/v3/getRecognition'
const YANDEX_TOKENIZE_URL = isDev
  ? '/api/yandex-llm/foundationModels/v1/tokenize'
  : 'https://llm.api.cloud.yandex.net/foundationModels/v1/tokenize'

// Polling configuration
const STT_POLL_INTERVAL = 1000 // 1 second
const STT_POLL_TIMEOUT = 30000 // 30 seconds max

interface YandexGPTResult {
  alternatives?: {
    message: {
      role: string
      text: string
    }
    status: string
  }[]
  usage?: {
    inputTextTokens: string
    completionTokens: string
    totalTokens: string
  }
  modelVersion?: string
}

interface YandexGPTResponse {
  result: YandexGPTResult
}

interface YandexSTTOperationResponse {
  id: string
  done: boolean
  error?: {
    code: number
    message: string
  }
}

interface YandexSTTRecognitionResponse {
  sessionUuid?: {
    uuid: string
  }
  final?: {
    alternatives: {
      text: string
    }[]
  }
  finalRefinement?: {
    normalizedText?: {
      alternatives: {
        text: string
      }[]
    }
  }
}

export class YandexProvider implements AIProvider {
  readonly type = 'yandex' as const
  private apiKey: string
  private folderId: string
  private available = true

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
    this.folderId = config.folderId ?? ''
  }

  /**
   * Send a chat completion request to YandexGPT
   */
  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ChatResponse> {
    if (this.apiKey === '' || this.folderId === '') {
      throw new Error('Yandex API key and folder ID are required')
    }

    const maxTokens = options?.maxTokens ?? AI_MAX_TOKENS_DEFAULT

    // Default to yandexgpt-lite if no model specified
    const modelName = model !== '' ? model : 'yandexgpt-lite'
    const modelUri = `gpt://${this.folderId}/${modelName}`

    const response = await fetch(YANDEX_GPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Api-Key ${this.apiKey}`,
        'x-folder-id': this.folderId,
      },
      body: JSON.stringify({
        modelUri,
        completionOptions: {
          stream: false,
          temperature: 0.3,
          maxTokens: String(maxTokens),
        },
        messages: messages.map((m) => ({
          role: m.role,
          text: typeof m.content === 'string' ? m.content : this.extractTextFromContent(m.content),
        })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      this.available = false
      throw new Error(`YandexGPT API error: ${String(response.status)} - ${errorText}`)
    }

    this.available = true
    const data = (await response.json()) as YandexGPTResponse
    log.debug('Raw response:', JSON.stringify(data))
    const result = data.result

    if (result.alternatives === undefined || result.alternatives.length === 0) {
      log.error('Empty response - result:', result)
      throw new Error('YandexGPT returned empty response')
    }

    const alternative = result.alternatives[0]

    return {
      id: `yandex-${String(Date.now())}`,
      content: alternative.message.text,
      usage: result.usage
        ? {
            promptTokens: parseInt(result.usage.inputTextTokens, 10) || 0,
            completionTokens: parseInt(result.usage.completionTokens, 10) || 0,
            totalTokens: parseInt(result.usage.totalTokens, 10) || 0,
          }
        : undefined,
    }
  }

  /**
   * Process audio with Yandex SpeechKit STT, then optionally process with YandexGPT
   */
  async chatWithAudio(
    audioBase64: string,
    audioFormat: string,
    prompt: string,
    model: string,
    options?: ChatOptions
  ): Promise<ChatResponse> {
    // Step 1: Transcribe audio using SpeechKit
    const transcript = await this.transcribeAudio(audioBase64, audioFormat)

    if (transcript === '') {
      throw new Error('Failed to transcribe audio - empty result')
    }

    // Step 2: If prompt is provided, process transcript with YandexGPT
    if (prompt !== '' && prompt.trim() !== '') {
      return this.chat(
        [
          { role: 'system', content: prompt },
          { role: 'user', content: transcript },
        ],
        model,
        options
      )
    }

    // Return just the transcript if no prompt
    return {
      id: `yandex-stt-${String(Date.now())}`,
      content: transcript,
    }
  }

  /**
   * Transcribe audio using Yandex SpeechKit async API
   */
  private async transcribeAudio(audioBase64: string, format: string): Promise<string> {
    if (this.apiKey === '' || this.folderId === '') {
      throw new Error('Yandex API key and folder ID are required for STT')
    }

    // Map format to Yandex container type
    const containerAudioType = this.mapAudioFormat(format)

    // Step 1: Start async recognition
    const startResponse = await fetch(YANDEX_STT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Api-Key ${this.apiKey}`,
      },
      body: JSON.stringify({
        content: audioBase64,
        recognitionModel: {
          model: 'general',
          audioFormat: {
            containerAudio: {
              containerAudioType,
            },
          },
          textNormalization: {
            textNormalization: 'TEXT_NORMALIZATION_ENABLED',
            literatureText: true, // Proper capitalization and punctuation
          },
          languageRestriction: {
            restrictionType: 'WHITELIST',
            languageCode: ['ru-RU', 'en-US'],
          },
        },
      }),
    })

    if (!startResponse.ok) {
      const errorText = await startResponse.text()
      throw new Error(`Yandex STT start error: ${String(startResponse.status)} - ${errorText}`)
    }

    const operationData = (await startResponse.json()) as YandexSTTOperationResponse
    const operationId = operationData.id

    if (operationId === '') {
      throw new Error('Yandex STT did not return operation ID')
    }

    // Step 2: Poll for results
    const transcript = await this.pollForTranscription(operationId)
    return transcript
  }

  /**
   * Poll the STT results endpoint until transcription is complete
   */
  private async pollForTranscription(operationId: string): Promise<string> {
    const startTime = Date.now()
    const transcriptParts: string[] = []

    while (Date.now() - startTime < STT_POLL_TIMEOUT) {
      await this.sleep(STT_POLL_INTERVAL)

      const response = await fetch(`${YANDEX_STT_RESULT_URL}?operationId=${operationId}`, {
        method: 'GET',
        headers: {
          Authorization: `Api-Key ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        // 404 means still processing, continue polling
        if (response.status === 404) {
          continue
        }
        const errorText = await response.text()
        throw new Error(`Yandex STT poll error: ${String(response.status)} - ${errorText}`)
      }

      // The response is a stream of JSON objects (one per line)
      const text = await response.text()
      const lines = text
        .trim()
        .split('\n')
        .filter((line) => line.trim() !== '')

      for (const line of lines) {
        try {
          const result = JSON.parse(line) as YandexSTTRecognitionResponse

          // Prefer normalized text (with literatureText formatting)
          const normalizedText = result.finalRefinement?.normalizedText?.alternatives[0]?.text
          const finalText = result.final?.alternatives[0]?.text

          if (normalizedText !== undefined && normalizedText !== '') {
            transcriptParts.push(normalizedText)
          } else if (finalText !== undefined && finalText !== '') {
            transcriptParts.push(finalText)
          }
        } catch {
          // Skip malformed JSON lines
        }
      }

      // If we got results, return them
      if (transcriptParts.length > 0) {
        return transcriptParts.join(' ')
      }
    }

    throw new Error('Yandex STT timeout - transcription took too long')
  }

  /**
   * Validate the API key by making a lightweight request
   */
  async validateKey(): Promise<boolean> {
    if (this.apiKey === '' || this.folderId === '') {
      this.available = false
      return false
    }

    try {
      // Use tokenize endpoint for lightweight validation
      const response = await fetch(YANDEX_TOKENIZE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Api-Key ${this.apiKey}`,
          'x-folder-id': this.folderId,
        },
        body: JSON.stringify({
          modelUri: `gpt://${this.folderId}/yandexgpt-lite`,
          text: 'test',
        }),
      })

      this.available = response.ok
      return response.ok
    } catch {
      this.available = false
      return false
    }
  }

  isAvailable(): boolean {
    return this.available && this.apiKey.length > 0 && this.folderId.length > 0
  }

  getFolderId(): string {
    return this.folderId
  }

  /**
   * Extract text content from message content parts
   */
  private extractTextFromContent(content: ContentPart[]): string {
    const textPart = content.find((p) => p.type === 'text')
    return textPart?.text ?? ''
  }

  /**
   * Map audio format to Yandex container type
   */
  private mapAudioFormat(format: string): string {
    const formatMap: Record<string, string> = {
      wav: 'WAV',
      'audio/wav': 'WAV',
      'audio/x-wav': 'WAV',
      ogg: 'OGG_OPUS',
      'audio/ogg': 'OGG_OPUS',
      opus: 'OGG_OPUS',
      mp3: 'MP3',
      'audio/mp3': 'MP3',
      'audio/mpeg': 'MP3',
    }
    return formatMap[format.toLowerCase()] ?? 'WAV'
  }

  /**
   * Simple sleep helper for polling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
