import type { ReactElement } from 'react'
import type { TaskContext } from '@/types/task'
import { CONTEXT_CONFIG } from '@/lib/context-config'

interface ContextBadgeProps {
  context: TaskContext
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
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
