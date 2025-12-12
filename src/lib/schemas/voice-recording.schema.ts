import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import type { VoiceRecording } from '@/types/voice-recording'

export type VoiceRecordingDocType = VoiceRecording
export type VoiceRecordingDocument = RxDocument<VoiceRecordingDocType>
export type VoiceRecordingCollection = RxCollection<VoiceRecordingDocType>

export const voiceRecordingSchema: RxJsonSchema<VoiceRecordingDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    audioData: {
      type: 'string',
    },
    transcript: {
      type: 'string',
    },
    processedAt: {
      type: 'string',
      maxLength: 30,
    },
    extractedTaskIds: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    extractedThoughtIds: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    createdAt: {
      type: 'string',
      maxLength: 30,
    },
  },
  required: ['id', 'audioData', 'extractedTaskIds', 'extractedThoughtIds', 'createdAt'],
  indexes: ['createdAt'],
}
