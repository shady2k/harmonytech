import type { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import type { Settings } from '@/types/settings'

export type SettingsDocType = Settings
export type SettingsDocument = RxDocument<SettingsDocType>
export type SettingsCollection = RxCollection<SettingsDocType>

export const settingsSchema: RxJsonSchema<SettingsDocType> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100,
    },
    openRouterApiKey: {
      type: 'string',
    },
    textModel: {
      type: 'string',
    },
    voiceModel: {
      type: 'string',
    },
    theme: {
      type: 'string',
      enum: ['light', 'dark', 'system'],
    },
    defaultContext: {
      type: 'string',
      enum: ['computer', 'phone', 'errands', 'home', 'anywhere'],
    },
    defaultEnergy: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
    },
  },
  required: ['id', 'theme', 'defaultContext', 'defaultEnergy'],
}
