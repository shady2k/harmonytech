import type { ReactElement } from 'react'
import type { TaskEnergy } from '@/types/task'

interface EnergyIndicatorProps {
  energy: TaskEnergy
  variant?: 'icon' | 'battery' | 'text'
  size?: 'sm' | 'md'
  className?: string
}

interface EnergyConfig {
  level: number
  label: string
  color: string
  bgColor: string
}

const ENERGY_CONFIG: Record<TaskEnergy, EnergyConfig> = {
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

const SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
}

function BoltIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9.5 1L4 9h4l-1.5 6L13 7H9l.5-6z" />
    </svg>
  )
}

function BatteryIndicator({
  energy,
  size,
}: {
  energy: TaskEnergy
  size: 'sm' | 'md'
}): ReactElement {
  const config = ENERGY_CONFIG[energy]
  const batteryHeight = size === 'sm' ? 'h-3' : 'h-4'
  const batteryWidth = size === 'sm' ? 'w-6' : 'w-8'
  const fillWidth = config.level === 3 ? 'w-full' : config.level === 2 ? 'w-2/3' : 'w-1/3'

  return (
    <div
      className={`relative ${batteryWidth} ${batteryHeight} rounded-sm border-2 border-current ${config.color}`}
      title={config.label}
    >
      <div className={`absolute inset-0.5 ${fillWidth} ${config.bgColor} rounded-sm`} />
      <div className="absolute -right-1 top-1/2 h-1.5 w-0.5 -translate-y-1/2 rounded-r-sm bg-current" />
    </div>
  )
}

function IconIndicator({ energy, size }: { energy: TaskEnergy; size: 'sm' | 'md' }): ReactElement {
  const config = ENERGY_CONFIG[energy]
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <div className={`flex items-center gap-0.5 ${config.color}`} title={config.label}>
      {Array.from({ length: 3 }).map((_, index) => (
        <BoltIcon
          key={index}
          className={`${iconSize} ${index >= config.level ? 'opacity-20' : ''}`}
        />
      ))}
    </div>
  )
}

function TextIndicator({ energy, size }: { energy: TaskEnergy; size: 'sm' | 'md' }): ReactElement {
  const config = ENERGY_CONFIG[energy]

  return (
    <span
      className={`${SIZE_CLASSES[size]} ${config.color} font-medium capitalize`}
      title={config.label}
    >
      {energy}
    </span>
  )
}

export function EnergyIndicator({
  energy,
  variant = 'icon',
  size = 'sm',
  className = '',
}: EnergyIndicatorProps): ReactElement {
  return (
    <div className={`inline-flex items-center ${className}`}>
      {variant === 'battery' && <BatteryIndicator energy={energy} size={size} />}
      {variant === 'icon' && <IconIndicator energy={energy} size={size} />}
      {variant === 'text' && <TextIndicator energy={energy} size={size} />}
    </div>
  )
}

export { ENERGY_CONFIG }
