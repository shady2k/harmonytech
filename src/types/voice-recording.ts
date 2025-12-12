export interface VoiceRecording {
  id: string
  audioData: string // Base64 encoded audio blob
  transcript?: string
  processedAt?: string
  extractedTaskIds: string[]
  extractedThoughtIds: string[]
  createdAt: string
}
