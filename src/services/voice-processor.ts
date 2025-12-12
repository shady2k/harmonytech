import { getOpenRouterClient } from './openrouter'
import { VOICE_TRANSCRIPTION_PROMPT } from '@/lib/ai-prompts'

export interface VoiceExtractedTask {
  rawInput: string
  nextAction: string
}

export interface VoiceExtractedThought {
  content: string
  suggestedTags: string[]
}

export interface VoiceProcessingResult {
  transcript: string
  tasks: VoiceExtractedTask[]
  thoughts: VoiceExtractedThought[]
}

interface AITaskItem {
  rawInput?: unknown
  nextAction?: unknown
}

interface AIThoughtItem {
  content?: unknown
  suggestedTags?: unknown
}

interface AIVoiceResponse {
  transcript: string
  tasks: AITaskItem[]
  thoughts: AIThoughtItem[]
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = (): void => {
      const dataUrl = reader.result as string
      const parts = dataUrl.split(',')
      resolve(parts.length > 1 ? parts[1] : '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function getAudioFormat(mimeType: string): 'wav' | 'mp3' | 'ogg' | 'webm' {
  if (mimeType.includes('wav')) return 'wav'
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}

const JSON_REGEX = /\{[\s\S]*\}/

function toString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value.toString()
  return fallback
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => toString(item))
}

function parseVoiceResponse(content: string): AIVoiceResponse {
  const jsonMatch = JSON_REGEX.exec(content)
  if (jsonMatch === null) {
    return {
      transcript: content,
      tasks: [],
      thoughts: [],
    }
  }

  const parsed = JSON.parse(jsonMatch[0]) as unknown

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      transcript: content,
      tasks: [],
      thoughts: [],
    }
  }

  const response = parsed as Record<string, unknown>

  const transcriptRaw = response['transcript']
  const tasksRaw = response['tasks']
  const thoughtsRaw = response['thoughts']

  return {
    transcript: toString(transcriptRaw, content),
    tasks: Array.isArray(tasksRaw)
      ? tasksRaw.map((t: unknown): AITaskItem => {
          const task = t as Record<string, unknown>
          return {
            rawInput: task['rawInput'],
            nextAction: task['nextAction'],
          }
        })
      : [],
    thoughts: Array.isArray(thoughtsRaw)
      ? thoughtsRaw.map((th: unknown): AIThoughtItem => {
          const thought = th as Record<string, unknown>
          return {
            content: thought['content'],
            suggestedTags: thought['suggestedTags'],
          }
        })
      : [],
  }
}

export async function processVoiceRecording(
  audioBlob: Blob,
  apiKey: string,
  model = 'google/gemini-2.0-flash-001'
): Promise<VoiceProcessingResult> {
  const audioBase64 = await blobToBase64(audioBlob)
  const audioFormat = getAudioFormat(audioBlob.type)

  const client = getOpenRouterClient(apiKey)

  const response = await client.chatWithAudio(
    audioBase64,
    audioFormat,
    VOICE_TRANSCRIPTION_PROMPT,
    model
  )

  const content = response.choices[0]?.message.content
  if (!content) {
    throw new Error('Empty response from AI')
  }

  const parsed = parseVoiceResponse(content)

  return {
    transcript: parsed.transcript,
    tasks: parsed.tasks.map((t) => ({
      rawInput: toString(t.rawInput),
      nextAction: toString(t.nextAction),
    })),
    thoughts: parsed.thoughts.map((th) => ({
      content: toString(th.content),
      suggestedTags: toStringArray(th.suggestedTags),
    })),
  }
}
