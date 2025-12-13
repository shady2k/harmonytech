import type { TaskContext } from '@/types/task'

interface ContextConfig {
  icon: string
  label: string
  bgColor: string
  textColor: string
}

export const CONTEXT_CONFIG: Record<TaskContext, ContextConfig> = {
  computer: {
    icon: '💻',
    label: 'Computer',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    textColor: 'text-blue-800 dark:text-blue-200',
  },
  phone: {
    icon: '📱',
    label: 'Phone',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50',
    textColor: 'text-purple-800 dark:text-purple-200',
  },
  errands: {
    icon: '🛒',
    label: 'Errands',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
    textColor: 'text-orange-800 dark:text-orange-200',
  },
  home: {
    icon: '🏠',
    label: 'Home',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
    textColor: 'text-green-800 dark:text-green-200',
  },
  anywhere: {
    icon: '🌍',
    label: 'Anywhere',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-800 dark:text-gray-200',
  },
}
