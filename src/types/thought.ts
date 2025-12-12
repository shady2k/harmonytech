export interface Thought {
  id: string
  content: string
  tags: string[]
  linkedProject?: string
  createdAt: string
  updatedAt: string
  sourceRecordingId?: string
}
