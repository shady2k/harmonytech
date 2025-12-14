import { type ReactElement, useCallback, useEffect, useState } from 'react'
import type { Thought } from '@/types/thought'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProjectSelector } from '@/components/tasks/ProjectSelector'
import { AudioPlayer } from './AudioPlayer'
import { formatDateTime } from '@/lib/date-utils'

interface ThoughtDetailProps {
  thought: Thought
  onUpdate: (id: string, updates: Partial<Thought>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  onConvertToTask?: (thought: Thought) => void
  className?: string
}

export function ThoughtDetail({
  thought,
  onUpdate,
  onDelete,
  onClose,
  onConvertToTask,
  className = '',
}: ThoughtDetailProps): ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [editedThought, setEditedThought] = useState<Thought>(thought)
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset edited thought when thought prop changes
  useEffect(() => {
    setEditedThought(thought)
  }, [thought])

  const handleSave = useCallback(async (): Promise<void> => {
    setIsSaving(true)
    try {
      await onUpdate(thought.id, {
        content: editedThought.content,
        tags: editedThought.tags,
        linkedProject: editedThought.linkedProject,
      })
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }, [thought.id, editedThought, onUpdate])

  const handleDelete = useCallback(async (): Promise<void> => {
    setIsDeleting(true)
    try {
      await onDelete(thought.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }, [thought.id, onDelete, onClose])

  const handleCancel = (): void => {
    setEditedThought(thought)
    setIsEditing(false)
    setNewTag('')
  }

  const handleAddTag = (): void => {
    const trimmedTag = newTag.trim().toLowerCase()
    if (trimmedTag !== '' && !editedThought.tags.includes(trimmedTag)) {
      setEditedThought({
        ...editedThought,
        tags: [...editedThought.tags, trimmedTag],
      })
    }
    setNewTag('')
  }

  const handleRemoveTag = (tagToRemove: string): void => {
    setEditedThought({
      ...editedThought,
      tags: editedThought.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleKeyDownTagInput = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thought Details</h2>
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
          {/* Content */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content
            </label>
            {isEditing ? (
              <textarea
                value={editedThought.content}
                onChange={(e): void => {
                  setEditedThought({ ...editedThought, content: e.target.value })
                }}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            ) : (
              <p className="whitespace-pre-wrap text-gray-900 dark:text-white">{thought.content}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {(isEditing ? editedThought.tags : thought.tags).map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
                    isEditing
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}
                >
                  #{tag}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={(): void => {
                        handleRemoveTag(tag)
                      }}
                      className="ml-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </span>
              ))}
              {(isEditing ? editedThought.tags : thought.tags).length === 0 && !isEditing && (
                <span className="text-sm text-gray-500 dark:text-gray-400">No tags</span>
              )}
            </div>
            {isEditing && (
              <div className="mt-2 flex gap-2">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e): void => {
                    setNewTag(e.target.value)
                  }}
                  onKeyDown={handleKeyDownTagInput}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={newTag.trim() === ''}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Linked Project */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Linked Project
            </label>
            {isEditing ? (
              <ProjectSelector
                value={editedThought.linkedProject}
                onChange={(project): void => {
                  setEditedThought({ ...editedThought, linkedProject: project })
                }}
              />
            ) : (
              <p className="text-gray-900 dark:text-white">
                {thought.linkedProject !== undefined ? (
                  <span className="flex items-center gap-1">
                    <span>📁</span> {thought.linkedProject}
                  </span>
                ) : (
                  'No linked project'
                )}
              </p>
            )}
          </div>

          {/* Source Recording with Audio Player */}
          {thought.sourceRecordingId !== undefined && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Voice Recording
              </label>
              <AudioPlayer recordingId={thought.sourceRecordingId} />
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created: {formatDateTime(thought.createdAt)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Updated: {formatDateTime(thought.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
        {showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">Delete this thought?</p>
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
              {onConvertToTask !== undefined && (
                <Button
                  variant="secondary"
                  onClick={(): void => {
                    onConvertToTask(thought)
                  }}
                >
                  Create related task
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
