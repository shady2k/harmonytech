import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import type { Task } from '@/types/task'

export type TaskDocType = Task
export type TaskDocument = RxDocument<TaskDocType>
export type TaskCollection = RxCollection<TaskDocType>

export const taskSchema: RxJsonSchema<TaskDocType> = {
  version: 0,
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
    },
    energy: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
    },
    timeEstimate: {
      type: 'number',
    },
    deadline: {
      type: 'string',
    },
    project: {
      type: 'string',
    },
    isSomedayMaybe: {
      type: 'boolean',
    },
    isCompleted: {
      type: 'boolean',
    },
    completedAt: {
      type: 'string',
    },
    createdAt: {
      type: 'string',
    },
    updatedAt: {
      type: 'string',
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
  indexes: ['createdAt', 'isCompleted', 'context', 'energy', 'project'],
}
