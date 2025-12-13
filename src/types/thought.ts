export type ProcessingStatus = 'unprocessed' | 'processing' | 'processed' | 'failed'

export interface Thought {
  id: string
  content: string
  tags: string[]
  linkedProject?: string
  createdAt: string
  updatedAt: string
  sourceRecordingId?: string
  linkedTaskIds: string[]
  aiProcessed: boolean
  processingStatus: ProcessingStatus
}
