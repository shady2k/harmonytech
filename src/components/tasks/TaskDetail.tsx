import { type ReactElement, useCallback, useEffect, useState } from 'react'
import type { Task, TaskContext, TaskEnergy } from '@/types/task'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ContextBadge, CONTEXT_CONFIG } from '@/components/ui/ContextBadge'
import { EnergyIndicator, ENERGY_CONFIG } from '@/components/ui/EnergyIndicator'
import { ProjectSelector } from './ProjectSelector'

interface TaskDetailProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  onReSuggest?: (task: Task) => void
  className?: string
}

const CONTEXTS: TaskContext[] = ['computer', 'phone', 'errands', 'home', 'anywhere']
const ENERGIES: TaskEnergy[] = ['high', 'medium', 'low']

export function TaskDetail({
  task,
  onUpdate,
  onDelete,
  onClose,
  onReSuggest,
  className = '',
}: TaskDetailProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Task>(task)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset edited task when task prop changes
  useEffect(() => {
    setEditedTask(task)
  }, [task])

  const handleSave = useCallback(async (): Promise<void> => {
    setIsSaving(true)
    try {
      await onUpdate(task.id, {
        nextAction: editedTask.nextAction,
        rawInput: editedTask.rawInput,
        context: editedTask.context,
        energy: editedTask.energy,
        timeEstimate: editedTask.timeEstimate,
        deadline: editedTask.deadline,
        project: editedTask.project,
        isSomedayMaybe: editedTask.isSomedayMaybe,
      })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }, [task.id, editedTask, onUpdate])

  const handleDelete = useCallback(async (): Promise<void> => {
    setIsDeleting(true)
    try {
      await onDelete(task.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }, [task.id, onDelete, onClose])

  const handleCancel = (): void => {
    setEditedTask(task)
    setIsEditing(false)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {/* Next Action */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Next Action
            </label>
            {isEditing ? (
              <textarea
                value={editedTask.nextAction}
                onChange={(e): void => {
                  setEditedTask({ ...editedTask, nextAction: e.target.value })
                }}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{task.nextAction}</p>
            )}
          </div>

          {/* Original Input */}
          {task.rawInput !== task.nextAction && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Original Input
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">{task.rawInput}</p>
            </div>
          )}

          {/* Context */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Context
            </label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {CONTEXTS.map((context) => (
                  <button
                    key={context}
                    type="button"
                    onClick={(): void => {
                      setEditedTask({ ...editedTask, context })
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      editedTask.context === context
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {CONTEXT_CONFIG[context].icon} {CONTEXT_CONFIG[context].label}
                  </button>
                ))}
              </div>
            ) : (
              <ContextBadge context={task.context} size="md" />
            )}
          </div>

          {/* Energy */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Energy Level
            </label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {ENERGIES.map((energy) => (
                  <button
                    key={energy}
                    type="button"
                    onClick={(): void => {
                      setEditedTask({ ...editedTask, energy })
                    }}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                      editedTask.energy === energy
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className={ENERGY_CONFIG[energy].color}>{energy}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EnergyIndicator energy={task.energy} variant="text" size="md" />
            )}
          </div>

          {/* Time Estimate */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Estimate (minutes)
            </label>
            {isEditing ? (
              <Input
                type="number"
                value={editedTask.timeEstimate}
                onChange={(e): void => {
                  setEditedTask({ ...editedTask, timeEstimate: parseInt(e.target.value) || 0 })
                }}
                min={0}
                className="w-32"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {task.timeEstimate > 0 ? `${String(task.timeEstimate)} minutes` : 'Not set'}
              </p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deadline
            </label>
            {isEditing ? (
              <Input
                type="datetime-local"
                value={editedTask.deadline?.slice(0, 16) ?? ''}
                onChange={(e): void => {
                  setEditedTask({
                    ...editedTask,
                    deadline:
                      e.target.value !== '' ? new Date(e.target.value).toISOString() : undefined,
                  })
                }}
                className="w-auto"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {task.deadline !== undefined ? formatDate(task.deadline) : 'No deadline'}
              </p>
            )}
          </div>

          {/* Project */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Project
            </label>
            {isEditing ? (
              <ProjectSelector
                value={editedTask.project}
                onChange={(project): void => {
                  setEditedTask({ ...editedTask, project })
                }}
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {task.project !== undefined ? (
                  <span className="flex items-center gap-1">
                    <span>📁</span> {task.project}
                  </span>
                ) : (
                  'No project'
                )}
              </p>
            )}
          </div>

          {/* Someday/Maybe */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Someday/Maybe
            </label>
            {isEditing ? (
              <button
                type="button"
                role="switch"
                aria-checked={editedTask.isSomedayMaybe}
                onClick={(): void => {
                  setEditedTask({ ...editedTask, isSomedayMaybe: !editedTask.isSomedayMaybe })
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  editedTask.isSomedayMaybe ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    editedTask.isSomedayMaybe ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            ) : (
              <span className="text-gray-900 dark:text-white">
                {task.isSomedayMaybe ? 'Yes' : 'No'}
              </span>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created: {formatDate(task.createdAt)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Updated: {formatDate(task.updatedAt)}
            </p>
            {task.isCompleted && task.completedAt !== undefined && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Completed: {formatDate(task.completedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">Delete this task?</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(): void => {
                  setShowDeleteConfirm(false)
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(): void => {
                  void handleDelete()
                }}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : isEditing ? (
          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={(): void => {
                void handleSave()
              }}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={(): void => {
                  setShowDeleteConfirm(true)
                }}
              >
                Delete
              </Button>
              {onReSuggest !== undefined && (
                <Button
                  variant="secondary"
                  onClick={(): void => {
                    onReSuggest(task)
                  }}
                >
                  Re-suggest
                </Button>
              )}
            </div>
            <Button
              onClick={(): void => {
                setIsEditing(true)
              }}
            >
              Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
