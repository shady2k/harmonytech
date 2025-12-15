import { type ReactElement, useState, useCallback } from 'react'
import type { Task, TaskContext, TaskEnergy } from '@/types/task'
import { useUIStore, type CaptureItemType } from '@/stores/ui.store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProjectSelector } from '@/components/tasks/ProjectSelector'
import { RecurrenceEditor } from '@/components/tasks/RecurrenceEditor'
import { CAPTURE_SHORTCUTS } from '@/config/shortcuts'

// User-editable task fields (excludes auto-generated: id, createdAt, updatedAt, completedAt, isCompleted, sourceThoughtId, aiSuggestions, classificationStatus)
export type ManualTaskData = Pick<
  Task,
  | 'rawInput'
  | 'nextAction'
  | 'context'
  | 'energy'
  | 'timeEstimate'
  | 'project'
  | 'scheduledStart'
  | 'scheduledEnd'
  | 'deadline'
  | 'recurrence'
  | 'isSomedayMaybe'
>

export interface ManualThoughtData {
  content: string
  tags: string[]
}

interface ManualCaptureProps {
  onSave: (task: ManualTaskData | null, thought: ManualThoughtData | null) => void
  onCancel: () => void
}

const CONTEXTS: TaskContext[] = ['computer', 'phone', 'errands', 'home', 'anywhere']
const ENERGIES: TaskEnergy[] = ['high', 'medium', 'low']
const TIME_OPTIONS = [5, 15, 30, 60, 120]

const CONTEXT_LABELS: Record<TaskContext, string> = {
  computer: '💻 Computer',
  phone: '📱 Phone',
  errands: '🛒 Errands',
  home: '🏠 Home',
  anywhere: '🌍 Anywhere',
}

const ENERGY_LABELS: Record<TaskEnergy, string> = {
  high: '⚡⚡⚡ High',
  medium: '⚡⚡ Medium',
  low: '⚡ Low',
}

function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${String(minutes)} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${String(hours)}h`
  }
  return `${String(hours)}h ${String(mins)}m`
}

const defaultTask: ManualTaskData = {
  rawInput: '',
  nextAction: '',
  context: 'anywhere',
  energy: 'medium',
  timeEstimate: 15,
  project: undefined,
  scheduledStart: undefined,
  scheduledEnd: undefined,
  deadline: undefined,
  recurrence: undefined,
  isSomedayMaybe: false,
}

const defaultThought: ManualThoughtData = {
  content: '',
  tags: [],
}

export function ManualCapture({ onSave, onCancel }: ManualCaptureProps): ReactElement {
  const { captureItemType, setCaptureItemType } = useUIStore()
  const [task, setTask] = useState<ManualTaskData>(defaultTask)
  const [thought, setThought] = useState<ManualThoughtData>(defaultThought)
  const [tagInput, setTagInput] = useState('')

  const showTask = captureItemType === 'task' || captureItemType === 'both'
  const showThought = captureItemType === 'thought' || captureItemType === 'both'

  const canSave =
    (showTask && task.nextAction.trim() !== '') || (showThought && thought.content.trim() !== '')

  const handleSave = useCallback((): void => {
    const taskToSave =
      showTask && task.nextAction.trim() !== ''
        ? { ...task, rawInput: task.nextAction } // rawInput = nextAction for manual entry
        : null
    const thoughtToSave = showThought && thought.content.trim() !== '' ? thought : null
    onSave(taskToSave, thoughtToSave)
  }, [showTask, showThought, task, thought, onSave])

  const handleAddTag = useCallback((): void => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (tag !== '' && !thought.tags.includes(tag)) {
      setThought((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }, [tagInput, thought.tags])

  const handleRemoveTag = useCallback((tagToRemove: string): void => {
    setThought((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }))
  }, [])

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddTag()
      }
    },
    [handleAddTag]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSave) {
        e.preventDefault()
        handleSave()
      }
    },
    [canSave, handleSave]
  )

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Item type toggle - fixed at top */}
      <div className="mb-4 flex shrink-0 gap-2">
        {(['task', 'thought', 'both'] as CaptureItemType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={(): void => {
              setCaptureItemType(type)
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              captureItemType === type
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Scrollable form area */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-2 pr-3 [scrollbar-gutter:stable]">
        {/* Task section */}
        {showTask && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Task</h3>

            {/* Next Action */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                What needs to be done?
              </label>
              <textarea
                value={task.nextAction}
                onChange={(e): void => {
                  setTask((prev) => ({ ...prev, nextAction: e.target.value }))
                }}
                placeholder="Enter task..."
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                autoFocus={showTask}
              />
            </div>

            {/* Context */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Context
              </label>
              <div className="flex flex-wrap gap-2">
                {CONTEXTS.map((context) => (
                  <button
                    key={context}
                    type="button"
                    onClick={(): void => {
                      setTask((prev) => ({ ...prev, context }))
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      task.context === context
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {CONTEXT_LABELS[context]}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Energy Required
              </label>
              <div className="flex flex-wrap gap-2">
                {ENERGIES.map((energy) => (
                  <button
                    key={energy}
                    type="button"
                    onClick={(): void => {
                      setTask((prev) => ({ ...prev, energy }))
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      task.energy === energy
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {ENERGY_LABELS[energy]}
                  </button>
                ))}
              </div>
            </div>

            {/* Time estimate */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Estimate
              </label>
              <div className="flex flex-wrap gap-2">
                {TIME_OPTIONS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={(): void => {
                      setTask((prev) => ({ ...prev, timeEstimate: time }))
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      task.timeEstimate === time
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {formatTimeEstimate(time)}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project
              </label>
              <ProjectSelector
                value={task.project}
                onChange={(project): void => {
                  setTask((prev) => ({ ...prev, project }))
                }}
              />
            </div>

            {/* Scheduled Start */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Scheduled Start
              </label>
              <Input
                type="datetime-local"
                value={task.scheduledStart?.slice(0, 16) ?? ''}
                onChange={(e): void => {
                  setTask((prev) => ({
                    ...prev,
                    scheduledStart:
                      e.target.value !== '' ? new Date(e.target.value).toISOString() : undefined,
                  }))
                }}
                className="w-auto"
              />
            </div>

            {/* Scheduled End */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Scheduled End
              </label>
              <Input
                type="datetime-local"
                value={task.scheduledEnd?.slice(0, 16) ?? ''}
                onChange={(e): void => {
                  setTask((prev) => ({
                    ...prev,
                    scheduledEnd:
                      e.target.value !== '' ? new Date(e.target.value).toISOString() : undefined,
                  }))
                }}
                className="w-auto"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deadline
              </label>
              <Input
                type="datetime-local"
                value={task.deadline?.slice(0, 16) ?? ''}
                onChange={(e): void => {
                  setTask((prev) => ({
                    ...prev,
                    deadline:
                      e.target.value !== '' ? new Date(e.target.value).toISOString() : undefined,
                  }))
                }}
                className="w-auto"
              />
            </div>

            {/* Recurrence */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recurrence
              </label>
              <RecurrenceEditor
                value={task.recurrence}
                onChange={(recurrence): void => {
                  setTask((prev) => ({ ...prev, recurrence }))
                }}
              />
            </div>

            {/* Someday/Maybe */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Someday/Maybe
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={task.isSomedayMaybe}
                onClick={(): void => {
                  setTask((prev) => ({ ...prev, isSomedayMaybe: !prev.isSomedayMaybe }))
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  task.isSomedayMaybe ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    task.isSomedayMaybe ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Thought section */}
        {showThought && (
          <div className="space-y-4">
            {showTask && <div className="border-t border-gray-200 pt-6 dark:border-gray-700" />}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Thought</h3>

            {/* Content */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                What&apos;s on your mind?
              </label>
              <textarea
                value={thought.content}
                onChange={(e): void => {
                  setThought((prev) => ({ ...prev, content: e.target.value }))
                }}
                placeholder="Enter thought..."
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                autoFocus={!showTask && showThought}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e): void => {
                    setTagInput(e.target.value)
                  }}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tag..."
                  className="flex-1"
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {thought.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {thought.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={(): void => {
                          handleRemoveTag(tag)
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - fixed at bottom */}
      <div className="mt-4 flex shrink-0 items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Press {CAPTURE_SHORTCUTS.submit.label} to save
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
