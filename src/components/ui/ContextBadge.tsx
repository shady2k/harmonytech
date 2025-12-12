import type { ReactElement } from 'react'
import type { TaskContext } from '@/types/task'

interface ContextBadgeProps {
  context: TaskContext
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

interface ContextConfig {
  icon: string
  label: string
  bgColor: string
  textColor: string
}

const CONTEXT_CONFIG: Record<TaskContext, ContextConfig> = {
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

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
}

export function ContextBadge({
  context,
  size = 'sm',
  showLabel = true,
  className = '',
}: ContextBadgeProps): ReactElement {
  const config = CONTEXT_CONFIG[context]

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.textColor} ${SIZE_CLASSES[size]} ${className}`}
      title={config.label}
    >
      <span role="img" aria-label={config.label}>
        {config.icon}
      </span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}

export { CONTEXT_CONFIG }
