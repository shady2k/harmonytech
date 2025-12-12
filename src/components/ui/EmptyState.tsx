import type { ReactElement, ReactNode } from 'react'
import { NavIcon } from '@/components/layout/NavIcon'
import { Button } from './Button'

type EmptyStateIcon =
  | 'empty-inbox'
  | 'empty-tasks'
  | 'empty-thoughts'
  | 'inbox'
  | 'check-square'
  | 'lightbulb'

interface EmptyStateProps {
  icon?: EmptyStateIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export function EmptyState({
  icon = 'empty-inbox',
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
        <NavIcon name={icon} className="h-12 w-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description !== undefined && (
        <p className="mb-6 max-w-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {actionLabel !== undefined && onAction !== undefined && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  )
}
