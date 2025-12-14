import { type ReactElement, useCallback, useMemo, useState } from 'react'
import { useArchive } from '@/hooks/useArchive'
import type { Task } from '@/types/task'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ContextBadge } from '@/components/ui/ContextBadge'
import { formatDateTime } from '@/lib/date-utils'

interface ArchivedTasksListProps {
  className?: string
}

interface TaskGroup {
  label: string
  tasks: Task[]
}

function groupTasksByDate(tasks: Task[]): TaskGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())

  const groups: TaskGroup[] = [
    { label: 'Today', tasks: [] },
    { label: 'Yesterday', tasks: [] },
    { label: 'This Week', tasks: [] },
    { label: 'Older', tasks: [] },
  ]

  for (const task of tasks) {
    if (task.completedAt === undefined) continue

    const completedDate = new Date(task.completedAt)
    completedDate.setHours(0, 0, 0, 0)

    if (completedDate.getTime() === today.getTime()) {
      groups[0].tasks.push(task)
    } else if (completedDate.getTime() === yesterday.getTime()) {
      groups[1].tasks.push(task)
    } else if (completedDate >= startOfWeek) {
      groups[2].tasks.push(task)
    } else {
      groups[3].tasks.push(task)
    }
  }

  // Filter out empty groups
  return groups.filter((group) => group.tasks.length > 0)
}

export function ArchivedTasksList({ className = '' }: ArchivedTasksListProps): ReactElement {
  const { archivedTasks, isLoading, error, searchArchive, restoreTask } = useArchive()
  const [searchQuery, setSearchQuery] = useState('')
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const filteredTasks = useMemo(() => {
    return searchArchive(searchQuery)
  }, [searchArchive, searchQuery])

  const taskGroups = useMemo(() => {
    return groupTasksByDate(filteredTasks)
  }, [filteredTasks])

  const handleRestore = useCallback(
    async (id: string): Promise<void> => {
      setRestoringId(id)
      try {
        await restoreTask(id)
      } finally {
        setRestoringId(null)
      }
    },
    [restoreTask]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" label="Loading archive..." />
      </div>
    )
  }

  if (error !== null) {
    return (
      <EmptyState
        icon="empty-tasks"
        title="Unable to load archive"
        description={error.message}
        actionLabel="Try again"
        onAction={(): void => {
          window.location.reload()
        }}
      />
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <Input
          type="search"
          placeholder="Search completed tasks..."
          value={searchQuery}
          onChange={(e): void => {
            setSearchQuery(e.target.value)
          }}
          className="pl-10"
        />
      </div>

      {/* Task list */}
      {archivedTasks.length === 0 ? (
        <EmptyState
          icon="empty-tasks"
          title="No completed tasks yet"
          description="Complete some tasks and they'll appear here in your archive."
        />
      ) : taskGroups.length === 0 ? (
        <EmptyState
          icon="empty-tasks"
          title="No matching tasks"
          description={`No completed tasks match "${searchQuery}"`}
        />
      ) : (
        <div className="space-y-6">
          {taskGroups.map((group) => (
            <div key={group.label}>
              <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {group.label}
                <span className="ml-2 text-gray-400">({String(group.tasks.length)})</span>
              </h3>
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <Card key={task.id} padding="sm" className="group">
                    <div className="flex items-start gap-3">
                      {/* Checkmark icon */}
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                        <svg
                          className="h-3 w-3 text-white"
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
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-600 line-through dark:text-gray-400">
                          {task.nextAction}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <ContextBadge context={task.context} size="sm" showLabel={false} />
                          {task.project !== undefined && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              📁 {task.project}
                            </span>
                          )}
                          {task.completedAt !== undefined && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDateTime(task.completedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Restore button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(): void => {
                          void handleRestore(task.id)
                        }}
                        disabled={restoringId === task.id}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        title="Restore task"
                      >
                        {restoringId === task.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                            />
                          </svg>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
