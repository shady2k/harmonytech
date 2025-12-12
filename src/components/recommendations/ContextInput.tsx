import { type ReactElement, useState } from 'react'
import type { TaskContext, TaskEnergy } from '@/types/task'
import { Button } from '@/components/ui/Button'

interface ContextInputProps {
  onSubmit: (context: { energy: TaskEnergy; timeAvailable: number; location: TaskContext }) => void
  isLoading?: boolean
  className?: string
}

const TIME_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2+ hours' },
]

const ENERGY_OPTIONS: { value: TaskEnergy; label: string; icon: string }[] = [
  { value: 'low', label: 'Low', icon: '⚡' },
  { value: 'medium', label: 'Medium', icon: '⚡⚡' },
  { value: 'high', label: 'High', icon: '⚡⚡⚡' },
]

const CONTEXT_OPTIONS: { value: TaskContext; label: string; icon: string }[] = [
  { value: 'computer', label: 'Computer', icon: '💻' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'errands', label: 'Errands', icon: '🛒' },
  { value: 'home', label: 'Home', icon: '🏠' },
  { value: 'anywhere', label: 'Anywhere', icon: '🌍' },
]

export function ContextInput({
  onSubmit,
  isLoading = false,
  className = '',
}: ContextInputProps): ReactElement {
  const [timeAvailable, setTimeAvailable] = useState<number>(30)
  const [energy, setEnergy] = useState<TaskEnergy>('medium')
  const [location, setLocation] = useState<TaskContext>('anywhere')

  const handleSubmit = (): void => {
    onSubmit({ energy, timeAvailable, location })
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Time available */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          How much time do you have?
        </label>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(): void => {
                setTimeAvailable(option.value)
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                timeAvailable === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Energy level */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          What&apos;s your energy level?
        </label>
        <div className="flex flex-wrap gap-2">
          {ENERGY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(): void => {
                setEnergy(option.value)
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                energy === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location/Context */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Where are you?
        </label>
        <div className="flex flex-wrap gap-2">
          {CONTEXT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(): void => {
                setLocation(option.value)
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                location === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span>{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <Button onClick={handleSubmit} isLoading={isLoading} className="w-full">
        Get Recommendations
      </Button>
    </div>
  )
}
