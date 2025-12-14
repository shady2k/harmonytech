import { type ReactElement, useState, useCallback } from 'react'
import type { Thought } from '@/types/thought'
import type { Task, TaskContext, TaskEnergy } from '@/types/task'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAI, toCurrentSuggestions } from '@/hooks/useAI'
import { useTasks } from '@/hooks/useTasks'
import { PropertySuggestion } from '@/components/capture/PropertySuggestion'

interface ConvertToTaskFlowProps {
  thought: Thought
  onComplete: (taskId: string) => void
  onCancel: () => void
}

type ProcessingStep = 'idle' | 'extracting' | 'suggesting' | 'review' | 'saving' | 'done' | 'error'

interface TaskDraft {
  nextAction: string
  rawInput: string
  context: TaskContext
  energy: TaskEnergy
  timeEstimate: number
  project?: string
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

export function ConvertToTaskFlow({
  thought,
  onComplete,
  onCancel,
}: ConvertToTaskFlowProps): ReactElement {
  const {
    extractTasks,
    suggestTaskProperties,
    isProcessing,
    error: aiError,
    isAIAvailable,
  } = useAI()
  const { addTask } = useTasks()

  const [step, setStep] = useState<ProcessingStep>('idle')
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Start without AI - go directly to review with default values
  const startWithoutAI = useCallback((): void => {
    const draft: TaskDraft = {
      nextAction: thought.content,
      rawInput: thought.content,
      context: 'anywhere',
      energy: 'medium',
      timeEstimate: 15,
      project: thought.linkedProject,
    }
    setTaskDraft(draft)
    setStep('review')
  }, [thought])

  const startConversion = async (): Promise<void> => {
    // If AI is not available, skip to review with defaults
    if (!isAIAvailable) {
      startWithoutAI()
      return
    }

    setStep('extracting')
    setError(null)

    try {
      // Step 1: Extract actionable task from thought content
      const extractionResult = await extractTasks(thought.content)

      let nextActionText: string
      if (extractionResult.tasks.length === 0) {
        // If no actionable task found, use the content as-is
        nextActionText = thought.content
      } else {
        // Use the first extracted task
        nextActionText = extractionResult.tasks[0].nextAction
      }

      // Create initial draft
      const draft: TaskDraft = {
        nextAction: nextActionText,
        rawInput: thought.content,
        context: 'anywhere',
        energy: 'medium',
        timeEstimate: 15,
        project: thought.linkedProject,
      }

      // Step 2: Get property suggestions
      setStep('suggesting')
      const suggestions = await suggestTaskProperties(nextActionText)
      const currentSuggestions = toCurrentSuggestions(suggestions)

      // Apply suggestions to draft
      const draftWithSuggestions: TaskDraft = {
        ...draft,
        context: currentSuggestions.context?.value ?? draft.context,
        energy: currentSuggestions.energy?.value ?? draft.energy,
        timeEstimate: currentSuggestions.timeEstimate?.value ?? draft.timeEstimate,
        project: currentSuggestions.project?.value ?? draft.project,
      }

      setTaskDraft(draftWithSuggestions)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process thought')
      setStep('error')
    }
  }

  const handleSave = async (): Promise<void> => {
    if (taskDraft === null) return

    setStep('saving')
    setError(null)

    try {
      const newTask = await addTask({
        rawInput: taskDraft.rawInput,
        nextAction: taskDraft.nextAction,
        context: taskDraft.context,
        energy: taskDraft.energy,
        timeEstimate: taskDraft.timeEstimate,
        project: taskDraft.project,
        isSomedayMaybe: false,
        isCompleted: false,
      } as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>)

      setStep('done')
      onComplete(newTask.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
      setStep('error')
    }
  }

  const updateDraftProperty = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]): void => {
    setTaskDraft((prev) => {
      if (prev === null) return null
      return { ...prev, [key]: value }
    })
  }

  // Idle state - show start button
  if (step === 'idle') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
            <svg
              className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create Related Task
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isAIAvailable
              ? 'AI will analyze this thought and suggest task properties.'
              : 'Create a task from this thought. Configure an AI provider in Settings for automatic suggestions.'}
          </p>
        </div>

        {/* Preview thought content */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm text-gray-700 dark:text-gray-300">{thought.content}</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={(): void => {
              void startConversion()
            }}
          >
            {isAIAvailable ? 'Start Conversion' : 'Create Task'}
          </Button>
        </div>
      </div>
    )
  }

  // Processing states
  if (step === 'extracting' || step === 'suggesting') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {step === 'extracting' ? 'Extracting actionable task...' : 'Getting AI suggestions...'}
        </p>
      </div>
    )
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Conversion Failed
              </h4>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error ?? aiError ?? 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={(): void => {
              setStep('idle')
              setError(null)
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Saving state
  if (step === 'saving') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Creating task...</p>
      </div>
    )
  }

  // Review state - show task draft with editable properties
  if (step === 'review' && taskDraft !== null) {
    return (
      <div className="space-y-6">
        {/* Task preview */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Next Action
          </label>
          <textarea
            value={taskDraft.nextAction}
            onChange={(e): void => {
              updateDraftProperty('nextAction', e.target.value)
            }}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Property suggestions */}
        <div className="space-y-4">
          <PropertySuggestion
            label="Context"
            suggestion={{
              value: taskDraft.context,
              confidence: 0.8,
              alternatives: CONTEXT_OPTIONS,
            }}
            options={CONTEXT_OPTIONS}
            renderValue={(v): string => CONTEXT_LABELS[v]}
            onSelect={(value): void => {
              updateDraftProperty('context', value)
            }}
          />

          <PropertySuggestion
            label="Energy Required"
            suggestion={{
              value: taskDraft.energy,
              confidence: 0.8,
              alternatives: ENERGY_OPTIONS,
            }}
            options={ENERGY_OPTIONS}
            renderValue={(v): string => ENERGY_LABELS[v]}
            onSelect={(value): void => {
              updateDraftProperty('energy', value)
            }}
          />

          <PropertySuggestion
            label="Time Estimate"
            suggestion={{
              value: taskDraft.timeEstimate,
              confidence: 0.8,
              alternatives: TIME_OPTIONS,
            }}
            options={TIME_OPTIONS}
            renderValue={formatTimeEstimate}
            onSelect={(value): void => {
              updateDraftProperty('timeEstimate', value)
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={(): void => {
              void handleSave()
            }}
            isLoading={isProcessing}
          >
            Create Task
          </Button>
        </div>
      </div>
    )
  }

  // Done state (should transition immediately via onComplete)
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
        <svg
          className="h-6 w-6 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Task created successfully!</p>
    </div>
  )
}
