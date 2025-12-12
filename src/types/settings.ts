import type { TaskContext, TaskEnergy } from './task'

export type Theme = 'light' | 'dark' | 'system'

export interface Settings {
  id: string // Always "user-settings"
  openRouterApiKey?: string
  preferredModel?: string
  theme: Theme
  defaultContext: TaskContext
  defaultEnergy: TaskEnergy
}
