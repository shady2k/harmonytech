import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import type { Thought } from '@/types/thought'

export type ThoughtDocType = Thought
export type ThoughtDocument = RxDocument<ThoughtDocType>
export type ThoughtCollection = RxCollection<ThoughtDocType>

export const thoughtSchema: RxJsonSchema<ThoughtDocType> = {
  version: 1,
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
      maxLength: 200,
    },
    createdAt: {
      type: 'string',
      maxLength: 30,
    },
    updatedAt: {
      type: 'string',
      maxLength: 30,
    },
    sourceRecordingId: {
      type: 'string',
      maxLength: 100,
    },
    linkedTaskIds: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    aiProcessed: {
      type: 'boolean',
    },
  },
  required: ['id', 'content', 'tags', 'createdAt', 'updatedAt', 'linkedTaskIds', 'aiProcessed'],
  indexes: ['createdAt', 'aiProcessed'],
}
