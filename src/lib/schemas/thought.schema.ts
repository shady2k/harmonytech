import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import type { Thought } from '@/types/thought'

export type ThoughtDocType = Thought
export type ThoughtDocument = RxDocument<ThoughtDocType>
export type ThoughtCollection = RxCollection<ThoughtDocType>

export const thoughtSchema: RxJsonSchema<ThoughtDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    content: {
      type: 'string',
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    linkedProject: {
      type: 'string',
    },
    createdAt: {
      type: 'string',
    },
    updatedAt: {
      type: 'string',
    },
    sourceRecordingId: {
      type: 'string',
    },
  },
  required: ['id', 'content', 'tags', 'createdAt', 'updatedAt'],
  indexes: ['createdAt', 'linkedProject'],
}
