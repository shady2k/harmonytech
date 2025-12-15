import { type ReactElement, useState } from 'react'
import type { Task } from '@/types/task'
import { Card } from '@/components/ui/Card'
import { ContextBadge } from '@/components/ui/ContextBadge'
import { EnergyIndicator } from '@/components/ui/EnergyIndicator'
import { LinkifiedText } from '@/components/ui/LinkifiedText'
import { formatDeadline, formatScheduledDate, isOverdue } from '@/lib/date-utils'

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string, isCompleted: boolean) => void
  onClick: (id: string) => void
  onViewSourceThought?: (thoughtId: string) => void
  className?: string
  isNew?: boolean
}

function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${String(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${String(hours)}h`
  }
  return `${String(hours)}h ${String(remainingMinutes)}m`
}

export function TaskCard({
  task,
  onToggleComplete,
  onClick,
  onViewSourceThought,
  className = '',
  isNew = false,
}: TaskCardProps): ReactElement {
  const [isAnimatingComplete, setIsAnimatingComplete] = useState(false)
  const [showCheckboxPop, setShowCheckboxPop] = useState(false)

  const handleCheckboxChange = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (!task.isCompleted) {
      // Animate completion
      setIsAnimatingComplete(true)
      setShowCheckboxPop(true)
      // Trigger actual completion after animation plays
      setTimeout(() => {
        onToggleComplete(task.id, true)
      }, 350)
    } else {
      onToggleComplete(task.id, false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(task.id)
    }
  }

  const animationClasses = [
    isNew ? 'animate-task-appear' : '',
    isAnimatingComplete ? 'animate-task-complete' : '',
    task.isCompleted && !isAnimatingComplete ? 'opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Card
      padding="none"
      className={`cursor-pointer transition-all hover:shadow-md ${animationClasses} ${className}`}
      onClick={(): void => {
        onClick(task.id)
      }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <div
          role="checkbox"
          aria-checked={task.isCompleted}
          tabIndex={0}
          onClick={handleCheckboxChange}
          onKeyDown={(e): void => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              handleCheckboxChange(e as unknown as React.MouseEvent)
            }
          }}
          className={`mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors ${
            task.isCompleted || showCheckboxPop
              ? 'border-green-500 bg-green-500'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          } ${showCheckboxPop ? 'animate-checkbox-pop' : ''}`}
        >
          {(task.isCompleted || showCheckboxPop) && (
            <svg
              className={`h-3 w-3 text-white ${showCheckboxPop && !task.isCompleted ? 'animate-checkmark-draw' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Next action */}
          <p
            className={`line-clamp-2 text-sm font-medium leading-tight ${
              task.isCompleted
                ? 'text-gray-500 line-through dark:text-gray-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            <LinkifiedText
              text={task.nextAction}
              linkClassName={
                task.isCompleted
                  ? 'text-gray-500 underline break-all'
                  : 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline break-all'
              }
            />
          </p>

          {/* Metadata row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Context badge */}
            <ContextBadge context={task.context} size="sm" showLabel={false} />

            {/* Energy indicator */}
            <EnergyIndicator energy={task.energy} variant="icon" size="sm" />

            {/* Time estimate */}
            {task.timeEstimate > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatTimeEstimate(task.timeEstimate)}
              </span>
            )}

            {/* Scheduled time */}
            {task.scheduledStart !== undefined && (
              <span className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatScheduledDate(task.scheduledStart)}
                {task.scheduledEnd !== undefined && ` - ${formatScheduledDate(task.scheduledEnd)}`}
              </span>
            )}

            {/* Deadline */}
            {task.deadline !== undefined && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  isOverdue(task.deadline)
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {formatDeadline(task.deadline)}
              </span>
            )}

            {/* Project */}
            {task.project !== undefined && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span>📁</span>
                {task.project}
              </span>
            )}

            {/* Someday/Maybe indicator */}
            {task.isSomedayMaybe && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Someday
              </span>
            )}

            {/* Source thought link */}
            {task.sourceThoughtId !== undefined &&
              task.sourceThoughtId !== '' &&
              onViewSourceThought && (
                <button
                  type="button"
                  onClick={(e): void => {
                    e.stopPropagation()
                    if (task.sourceThoughtId !== undefined) {
                      onViewSourceThought(task.sourceThoughtId)
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                  title="View source thought"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                    />
                  </svg>
                  <span>From thought</span>
                </button>
              )}
          </div>
        </div>

        {/* Chevron */}
        <svg
          className="h-5 w-5 shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Card>
  )
}
