import { type ReactElement, useCallback, useMemo, useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useUIStore } from '@/stores/ui.store'
import type { Task } from '@/types/task'
import { TaskCard } from './TaskCard'
import { TaskDetail } from './TaskDetail'
import { TaskFilters } from './TaskFilters'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SlideOverPanel } from '@/components/ui/SlideOverPanel'

interface TaskListProps {
  groupByProject?: boolean
  showFilters?: boolean
  className?: string
}

interface TaskGroup {
  project: string | null
  tasks: Task[]
}

function groupTasksByProject(tasks: Task[]): TaskGroup[] {
  const groups = new Map<string | null, Task[]>()

  for (const task of tasks) {
    const project = task.project ?? null
    const existing = groups.get(project) ?? []
    groups.set(project, [...existing, task])
  }

  // Sort groups: projects first (alphabetically), then "No project" at the end
  const sortedGroups: TaskGroup[] = []
  const projectNames = Array.from(groups.keys())
    .filter((p): p is string => p !== null)
    .sort()

  for (const project of projectNames) {
    const projectTasks = groups.get(project)
    if (projectTasks !== undefined) {
      sortedGroups.push({ project, tasks: projectTasks })
    }
  }

  // Add "No project" group at the end
  const noProjectTasks = groups.get(null)
  if (noProjectTasks !== undefined) {
    sortedGroups.push({ project: null, tasks: noProjectTasks })
  }

  return sortedGroups
}

export function TaskList({
  groupByProject = false,
  showFilters = true,
  className = '',
}: TaskListProps): ReactElement {
  const { tasks, isLoading, error, completeTask, uncompleteTask, updateTask, deleteTask } =
    useTasks()
  const { selectedTaskId, selectTask, clearSelection, openCaptureForTask } = useUIStore()
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  // Track new tasks for animation using creation timestamp
  const recentThreshold = 500 // Tasks created within last 500ms are considered "new"
  const isNewTask = useCallback((task: Task): boolean => {
    const createdAt = new Date(task.createdAt).getTime()
    const now = Date.now()
    return now - createdAt < recentThreshold
  }, [])

  const selectedTask = useMemo(() => {
    if (selectedTaskId === null) return null
    return tasks.find((t) => t.id === selectedTaskId) ?? null
  }, [tasks, selectedTaskId])

  const taskGroups = useMemo(() => {
    if (groupByProject) {
      return groupTasksByProject(tasks)
    }
    return [{ project: null, tasks }]
  }, [tasks, groupByProject])

  const handleToggleComplete = useCallback(
    (id: string, isCompleted: boolean): void => {
      setCompleteError(null)
      if (isCompleted) {
        completeTask(id).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to complete task'
          setCompleteError(message)
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            setCompleteError(null)
          }, 5000)
        })
      } else {
        void uncompleteTask(id)
      }
    },
    [completeTask, uncompleteTask]
  )

  const handleTaskClick = useCallback(
    (id: string): void => {
      selectTask(id)
    },
    [selectTask]
  )

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Task>): Promise<void> => {
      await updateTask(id, updates)
    },
    [updateTask]
  )

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      await deleteTask(id)
    },
    [deleteTask]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" label="Loading tasks..." />
      </div>
    )
  }

  if (error !== null) {
    return (
      <EmptyState
        icon="empty-tasks"
        title="Unable to load tasks"
        description={error.message}
        actionLabel="Try again"
        onAction={(): void => {
          window.location.reload()
        }}
      />
    )
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Error message for task completion */}
      {completeError !== null && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 shadow-lg dark:bg-red-900 dark:text-red-200">
          {completeError}
        </div>
      )}

      {/* Main task list */}
      <div className="flex-1 overflow-hidden">
        {/* Filter toggle for mobile */}
        {showFilters && (
          <div className="border-b border-gray-200 p-4 dark:border-gray-700 md:hidden">
            <button
              type="button"
              onClick={(): void => {
                setShowFilterPanel(!showFilterPanel)
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filters
            </button>
            {showFilterPanel && (
              <div className="mt-4">
                <TaskFilters />
              </div>
            )}
          </div>
        )}

        {/* Task list content */}
        <div className="h-full overflow-y-auto">
          {tasks.length === 0 ? (
            <EmptyState
              icon="empty-tasks"
              title="No tasks yet"
              description="Capture your first task to get started. Use voice or text to quickly add tasks."
              actionLabel="Add task"
              onAction={openCaptureForTask}
            />
          ) : (
            <div className="space-y-6 p-4">
              {taskGroups.map((group, index) => (
                <div key={group.project ?? `no-project-${String(index)}`}>
                  {/* Project header (only if grouping by project) */}
                  {groupByProject && (
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {group.project !== null ? (
                        <>
                          <span>📁</span>
                          {group.project}
                        </>
                      ) : (
                        'No project'
                      )}
                      <span className="text-gray-400">({String(group.tasks.length)})</span>
                    </h3>
                  )}

                  {/* Tasks */}
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onClick={handleTaskClick}
                        isNew={isNewTask(task)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters sidebar (desktop only) */}
      {showFilters && (
        <div className="hidden w-64 shrink-0 border-l border-gray-200 p-4 dark:border-gray-700 md:block">
          <TaskFilters />
        </div>
      )}

      {/* Task detail slide-over panel */}
      <SlideOverPanel isOpen={selectedTask !== null} onClose={clearSelection} width={480}>
        {selectedTask !== null && (
          <TaskDetail
            task={selectedTask}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onComplete={completeTask}
            onClose={clearSelection}
          />
        )}
      </SlideOverPanel>
    </div>
  )
}
