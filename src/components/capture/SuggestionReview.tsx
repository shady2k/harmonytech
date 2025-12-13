import { type ReactElement } from 'react'
import { useCaptureStore } from '@/stores'
import { Button, Input } from '@/components/ui'
import { NavIcon } from '@/components/layout/NavIcon'
import { PropertySuggestion } from './PropertySuggestion'
import type { TaskContext, TaskEnergy } from '@/types/task'

interface SuggestionReviewProps {
  onSave: () => void
  onCancel: () => void
}

const CONTEXT_OPTIONS: TaskContext[] = ['computer', 'phone', 'errands', 'home', 'anywhere']
const ENERGY_OPTIONS: TaskEnergy[] = ['high', 'medium', 'low']
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

export function SuggestionReview({ onSave, onCancel }: SuggestionReviewProps): ReactElement {
  const {
    extractedItems,
    currentItemIndex,
    currentSuggestions,
    acceptSuggestion,
    nextItem,
    previousItem,
    removeExtractedTask,
    removeExtractedThought,
    updateExtractedTask,
  } = useCaptureStore()

  if (extractedItems === null) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">No items to review</div>
    )
  }

  const totalTasks = extractedItems.tasks.length
  const totalThoughts = extractedItems.thoughts.length
  const totalItems = totalTasks + totalThoughts

  if (totalItems === 0) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-gray-500 dark:text-gray-400">No tasks or thoughts extracted</p>
        <Button onClick={onCancel} variant="secondary">
          Try Again
        </Button>
      </div>
    )
  }

  const isTask = currentItemIndex < totalTasks
  const currentTask = isTask ? extractedItems.tasks[currentItemIndex] : null
  const currentThought = !isTask ? extractedItems.thoughts[currentItemIndex - totalTasks] : null

  const handleDelete = (): void => {
    if (isTask) {
      removeExtractedTask(currentItemIndex)
    } else {
      removeExtractedThought(currentItemIndex - totalTasks)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          Item {currentItemIndex + 1} of {totalItems}
        </span>
        <span>
          {totalTasks} task{totalTasks !== 1 ? 's' : ''}, {totalThoughts} thought
          {totalThoughts !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Item type badge */}
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            isTask
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
          }`}
        >
          {isTask ? 'Task' : 'Thought'}
        </span>
      </div>

      {/* Content display */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <p className="text-gray-900 dark:text-white">
          {isTask ? currentTask?.nextAction : currentThought?.content}
        </p>
        {isTask && currentTask?.rawInput !== currentTask?.nextAction && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Original: {currentTask?.rawInput}
          </p>
        )}
      </div>

      {/* Property suggestions for tasks */}
      {isTask && currentSuggestions !== null && (
        <div className="space-y-4">
          {currentSuggestions.context !== undefined && (
            <PropertySuggestion
              label="Context"
              suggestion={currentSuggestions.context}
              options={CONTEXT_OPTIONS}
              renderValue={(v): string => CONTEXT_LABELS[v]}
              onSelect={(value): void => {
                acceptSuggestion('context', value)
              }}
            />
          )}

          {currentSuggestions.energy !== undefined && (
            <PropertySuggestion
              label="Energy Required"
              suggestion={currentSuggestions.energy}
              options={ENERGY_OPTIONS}
              renderValue={(v): string => ENERGY_LABELS[v]}
              onSelect={(value): void => {
                acceptSuggestion('energy', value)
              }}
            />
          )}

          {currentSuggestions.timeEstimate !== undefined && (
            <PropertySuggestion
              label="Time Estimate"
              suggestion={currentSuggestions.timeEstimate}
              options={TIME_OPTIONS}
              renderValue={(v): string => formatTimeEstimate(v)}
              onSelect={(value): void => {
                acceptSuggestion('timeEstimate', value)
              }}
            />
          )}

          {currentSuggestions.project !== undefined && (
            <PropertySuggestion
              label="Project"
              suggestion={currentSuggestions.project}
              renderValue={(v): string => v}
              onSelect={(value): void => {
                acceptSuggestion('project', value)
              }}
            />
          )}
        </div>
      )}

      {/* Scheduled dates for tasks */}
      {isTask && currentTask !== null && (
        <div className="space-y-4">
          {/* Scheduled Start */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scheduled Start
            </label>
            <Input
              type="datetime-local"
              value={currentTask.scheduledStart?.slice(0, 16) ?? ''}
              onChange={(e): void => {
                updateExtractedTask(currentItemIndex, {
                  scheduledStart:
                    e.target.value !== '' ? new Date(e.target.value).toISOString() : undefined,
                })
              }}
              className="w-auto"
            />
            {currentTask.scheduledStart !== undefined && (
              <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                AI extracted: {new Date(currentTask.scheduledStart).toLocaleString()}
              </p>
            )}
          </div>

          {/* Scheduled End */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scheduled End
            </label>
            <Input
              type="datetime-local"
              value={currentTask.scheduledEnd?.slice(0, 16) ?? ''}
              onChange={(e): void => {
                updateExtractedTask(currentItemIndex, {
                  scheduledEnd:
                    e.target.value !== '' ? new Date(e.target.value).toISOString() : undefined,
                })
              }}
              className="w-auto"
            />
            {currentTask.scheduledEnd !== undefined && (
              <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                AI extracted: {new Date(currentTask.scheduledEnd).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tags for thoughts */}
      {!isTask && currentThought !== null && currentThought.tags.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
          <div className="flex flex-wrap gap-2">
            {currentThought.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation and actions */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousItem}
            disabled={currentItemIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextItem}
            disabled={currentItemIndex >= totalItems - 1}
          >
            Next
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <NavIcon name="delete" className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onSave}>
            Save All
          </Button>
        </div>
      </div>
    </div>
  )
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
