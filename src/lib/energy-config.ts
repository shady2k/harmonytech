import type { TaskEnergy } from '@/types/task'

interface EnergyConfig {
  level: number
  label: string
  color: string
  bgColor: string
}

export const ENERGY_CONFIG: Record<TaskEnergy, EnergyConfig> = {
  high: {
    level: 3,
    label: 'High energy',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500',
  },
  medium: {
    level: 2,
    label: 'Medium energy',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500',
  },
  low: {
    level: 1,
    label: 'Low energy',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500',
  },
}
