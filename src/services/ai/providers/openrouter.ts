/**
 * OpenRouter AI Provider implementation
 */

import type { AIProvider, AIProviderConfig, ChatMessage, ChatResponse, ContentPart } from '../types'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface OpenRouterChoice {
  message: {
    role: string
    content: string
  }
  finish_reason: string
}

interface OpenRouterResponse {
  id: string
  choices: OpenRouterChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface OpenRouterError {
  error?: {
    message?: string
    type?: string
    code?: string
  }
}

export class OpenRouterProvider implements AIProvider {
  readonly type = 'openrouter' as const
  private apiKey: string
  private available = true

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey
  }

  async chat(messages: ChatMessage[], model: string): Promise<ChatResponse> {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'HarmonyTech GTD',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as OpenRouterError
      this.available = false
      throw new Error(errorData.error?.message ?? `HTTP ${String(response.status)}`)
    }

    this.available = true
    const data = (await response.json()) as OpenRouterResponse

    return {
      id: data.id,
      content: data.choices[0]?.message.content ?? '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }

  async chatWithAudio(
    audioBase64: string,
    audioFormat: string,
    prompt: string,
    model: string
  ): Promise<ChatResponse> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'input_audio',
            input_audio: {
              data: audioBase64,
              format: audioFormat,
            },
          },
        ] as ContentPart[],
      },
    ]

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'HarmonyTech GTD',
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as OpenRouterError
      this.available = false
      throw new Error(errorData.error?.message ?? `HTTP ${String(response.status)}`)
    }

    this.available = true
    const data = (await response.json()) as OpenRouterResponse

    return {
      id: data.id,
      content: data.choices[0]?.message.content ?? '',
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }

  async validateKey(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 10000)

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      this.available = response.ok
      return response.ok
    } catch {
      this.available = false
      return false
    }
  }

  isAvailable(): boolean {
    return this.available && this.apiKey.length > 0
  }

  getApiKey(): string {
    return this.apiKey
  }
}
