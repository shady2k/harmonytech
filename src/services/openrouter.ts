const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

export interface ContentPart {
  type: 'text' | 'input_audio'
  text?: string
  input_audio?: {
    data: string
    format: string
  }
}

interface ChatChoice {
  message: {
    role: string
    content: string
  }
  finish_reason: string
}

export interface ChatResponse {
  id: string
  choices: ChatChoice[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface OpenRouterError {
  error?: {
    message?: string
    type?: string
    code?: string
  }
}

export class OpenRouterClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(
    messages: ChatMessage[],
    model = 'anthropic/claude-3.5-sonnet'
  ): Promise<ChatResponse> {
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
      throw new Error(errorData.error?.message ?? `HTTP ${String(response.status)}`)
    }

    return response.json() as Promise<ChatResponse>
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
        ],
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
      throw new Error(errorData.error?.message ?? `HTTP ${String(response.status)}`)
    }

    return response.json() as Promise<ChatResponse>
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
      return response.ok
    } catch {
      return false
    }
  }

  getApiKey(): string {
    return this.apiKey
  }
}

let clientInstance: OpenRouterClient | null = null

export function getOpenRouterClient(apiKey: string): OpenRouterClient {
  if (clientInstance?.getApiKey() !== apiKey) {
    clientInstance = new OpenRouterClient(apiKey)
  }
  return clientInstance
}
