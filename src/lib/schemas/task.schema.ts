/**
 * RxDB Task Schema
 *
 * This schema MUST match the master Zod schema in task.master.ts.
 * When adding new fields to Task:
 * 1. Add to task.master.ts first (single source of truth for types)
 * 2. Update this file to match
 * 3. Increment version and add migration strategy if needed
 *
 * Note: RxDB Dexie storage doesn't support indexes on optional fields.
 */
import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import type { Task } from '@/types/task'

export type TaskDocType = Task
export type TaskDocument = RxDocument<TaskDocType>
export type TaskCollection = RxCollection<TaskDocType>

/**
 * RxDB schema for Task collection
 *
 * Version history:
 * - v0: Initial schema
 * - v1: Added scheduledStart, scheduledEnd, recurrence fields
 * - v2: Schema structure fix (indexes, required fields) - no data changes
 */
export const taskSchemaRxDB: RxJsonSchema<TaskDocType> = {
  version: 2,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    rawInput: {
      type: 'string',
    },
    nextAction: {
      type: 'string',
    },
    context: {
      type: 'string',
      enum: ['computer', 'phone', 'errands', 'home', 'anywhere'],
      maxLength: 20,
    },
    energy: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      maxLength: 10,
    },
    timeEstimate: {
      type: 'number',
    },
    deadline: {
      type: 'string',
      maxLength: 30,
    },
    scheduledStart: {
      type: 'string',
      maxLength: 30,
    },
    scheduledEnd: {
      type: 'string',
      maxLength: 30,
    },
    project: {
      type: 'string',
      maxLength: 200,
    },
    isSomedayMaybe: {
      type: 'boolean',
    },
    isCompleted: {
      type: 'boolean',
    },
    completedAt: {
      type: 'string',
      maxLength: 30,
    },
    createdAt: {
      type: 'string',
      maxLength: 30,
    },
    updatedAt: {
      type: 'string',
      maxLength: 30,
    },
    aiSuggestions: {
      type: 'object',
      properties: {
        suggestedContext: {
          type: 'string',
          enum: ['computer', 'phone', 'errands', 'home', 'anywhere'],
        },
        suggestedEnergy: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
        },
        suggestedTimeEstimate: {
          type: 'number',
        },
        suggestedProject: {
          type: 'string',
        },
        confidence: {
          type: 'number',
        },
        alternatives: {
          type: 'object',
          properties: {
            context: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            energy: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            timeEstimate: {
              type: 'array',
              items: {
                type: 'number',
              },
            },
          },
        },
      },
    },
    recurrence: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly', 'custom'],
        },
        interval: {
          type: 'number',
        },
        daysOfWeek: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        dayOfMonth: {
          type: 'number',
        },
        endDate: {
          type: 'string',
        },
      },
    },
    sourceThoughtId: {
      type: 'string',
      maxLength: 100,
    },
    classificationStatus: {
      type: 'string',
      enum: ['pending', 'classified', 'user_override'],
      maxLength: 20,
    },
  },
  required: [
    'id',
    'rawInput',
    'nextAction',
    'context',
    'energy',
    'timeEstimate',
    'isSomedayMaybe',
    'isCompleted',
    'createdAt',
    'updatedAt',
  ],
  indexes: ['createdAt', 'isCompleted', 'context', 'energy'],
}
