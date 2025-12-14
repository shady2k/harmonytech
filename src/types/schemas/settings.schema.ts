/**
 * Settings Schema - Single Source of Truth
 */
import { z } from 'zod'
import { taskContextSchema, taskEnergySchema } from './common.schema'

export const themeSchema = z.enum(['light', 'dark', 'system'])
export type Theme = z.infer<typeof themeSchema>

export const aiProviderSchema = z.enum(['openrouter', 'yandex'])
export type AIProviderType = z.infer<typeof aiProviderSchema>

export const settingsSchema = z.object({
  id: z.string(), // Always "user-settings"
  aiProvider: aiProviderSchema,
  openRouterApiKey: z.string().optional(),
  yandexApiKey: z.string().optional(),
  yandexFolderId: z.string().optional(),
  textModel: z.string().optional(),
  voiceModel: z.string().optional(),
  aiEnabled: z.boolean().optional(),
  aiConfidenceThreshold: z.number().optional(),
  theme: themeSchema,
  defaultContext: taskContextSchema,
  defaultEnergy: taskEnergySchema,
})

export type Settings = z.infer<typeof settingsSchema>
