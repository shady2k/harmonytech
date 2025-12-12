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

async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext()
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

  // Convert to WAV
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const length = audioBuffer.length

  // Create WAV file
  const wavBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
  const view = new DataView(wavBuffer)

  // WAV header
  const writeString = (offset: number, str: string): void => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length * numberOfChannels * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size
  view.setUint16(20, 1, true) // AudioFormat (PCM)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numberOfChannels * 2, true) // ByteRate
  view.setUint16(32, numberOfChannels * 2, true) // BlockAlign
  view.setUint16(34, 16, true) // BitsPerSample
  writeString(36, 'data')
  view.setUint32(40, length * numberOfChannels * 2, true)

  // Write audio data
  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i]
      // Clamp and convert to 16-bit
      const clamped = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
      offset += 2
    }
  }

  await audioContext.close()
  return new Blob([wavBuffer], { type: 'audio/wav' })
}

function getAudioFormat(mimeType: string): string {
  if (mimeType.includes('wav')) return 'wav'
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'mp4'
  if (mimeType.includes('aac')) return 'aac'
  if (mimeType.includes('flac')) return 'flac'
  if (mimeType.includes('webm')) return 'webm'
  return 'ogg' // Default to ogg as it's widely supported
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
  model: string
): Promise<VoiceProcessingResult> {
  // Convert to WAV for better compatibility with audio models
  const wavBlob = await convertToWav(audioBlob)
  const audioBase64 = await blobToBase64(wavBlob)
  const audioFormat = 'wav'

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
