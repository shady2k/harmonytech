/**
 * Export Schema - Data export/import format
 */
import { z } from 'zod'
import { taskSchema } from './task.schema'
import { thoughtSchema } from './thought.schema'
import { projectSchema } from './project.schema'
import { settingsSchema } from './settings.schema'

export const exportMetadataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  appVersion: z.string(),
})

export type ExportMetadata = z.infer<typeof exportMetadataSchema>

export const exportDataSchema = z.object({
  metadata: exportMetadataSchema,
  data: z.object({
    tasks: z.array(taskSchema),
    thoughts: z.array(thoughtSchema),
    projects: z.array(projectSchema),
    settings: settingsSchema.optional(),
  }),
})

export type ExportData = z.infer<typeof exportDataSchema>
