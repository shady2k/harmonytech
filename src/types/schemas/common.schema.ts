/**
 * Common Schemas - Shared enums and types used across multiple schemas
 */
import { z } from 'zod'

// Task-related enums (used by Task and Settings)
export const taskContextSchema = z.enum(['computer', 'phone', 'errands', 'home', 'anywhere'])
export type TaskContext = z.infer<typeof taskContextSchema>

export const taskEnergySchema = z.enum(['high', 'medium', 'low'])
export type TaskEnergy = z.infer<typeof taskEnergySchema>
