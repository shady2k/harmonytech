/**
 * Voice Recording Schema - Single Source of Truth
 */
import { z } from 'zod'

export const voiceRecordingSchema = z.object({
  id: z.string(),
  audioData: z.string(), // Base64 encoded audio blob
  transcript: z.string().optional(),
  processedAt: z.string().optional(),
  extractedTaskIds: z.array(z.string()),
  extractedThoughtIds: z.array(z.string()),
  createdAt: z.string(),
})

export type VoiceRecording = z.infer<typeof voiceRecordingSchema>
