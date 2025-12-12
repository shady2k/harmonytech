import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import type { Project } from '@/types/project'

export type ProjectDocType = Project
export type ProjectDocument = RxDocument<ProjectDocType>
export type ProjectCollection = RxCollection<ProjectDocType>

export const projectSchema: RxJsonSchema<ProjectDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    name: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    isActive: {
      type: 'boolean',
    },
    createdAt: {
      type: 'string',
    },
    updatedAt: {
      type: 'string',
    },
  },
  required: ['id', 'name', 'isActive', 'createdAt', 'updatedAt'],
  indexes: ['name', 'isActive', 'createdAt'],
}
