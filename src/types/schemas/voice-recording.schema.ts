/**
 * Voice Recording Schema - Single Source of Truth
 */
import { z } from 'zod'

export const voiceRecordingStatusSchema = z.enum(['pending', 'transcribing', 'completed', 'failed'])
export type VoiceRecordingStatus = z.infer<typeof voiceRecordingStatusSchema>

export const voiceRecordingSchema = z.object({
  id: z.string(),
  audioData: z.string(), // Base64 encoded audio blob
  mimeType: z.string(), // MIME type of the audio (e.g., 'audio/mp4', 'audio/webm')
  status: voiceRecordingStatusSchema,
  transcript: z.string().optional(),
  errorMessage: z.string().optional(),
  processedAt: z.string().optional(),
  linkedThoughtId: z.string().optional(), // Thought created from this recording (set on success)
  createdByDeviceId: z.string(), // Only process on device that created it
  createdAt: z.string(),
  retryCount: z.number().optional(), // Number of transcription retry attempts
})

export type VoiceRecording = z.infer<typeof voiceRecordingSchema>
