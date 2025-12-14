/**
 * Thought Schema - Single Source of Truth
 */
import { z } from 'zod'

export const processingStatusSchema = z.enum(['unprocessed', 'processing', 'processed', 'failed'])
export type ProcessingStatus = z.infer<typeof processingStatusSchema>

export const thoughtSchema = z.object({
  id: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  linkedProject: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceRecordingId: z.string().optional(),
  linkedTaskIds: z.array(z.string()),
  aiProcessed: z.boolean(),
  processingStatus: processingStatusSchema,
  createdByDeviceId: z.string().optional(), // Device that created this thought (for sync)
})

export type Thought = z.infer<typeof thoughtSchema>
