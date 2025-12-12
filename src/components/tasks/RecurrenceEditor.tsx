import { type ReactElement, useCallback, useState } from 'react'
import type { Recurrence, RecurrencePattern } from '@/types/task'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface RecurrenceEditorProps {
  value?: Recurrence
  onChange: (recurrence: Recurrence | undefined) => void
  className?: string
}

const PATTERNS: { value: RecurrencePattern | 'none'; label: string }[] = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
]

function getRecurrencePreview(recurrence: Recurrence | undefined): string {
  if (recurrence === undefined) {
    return 'Does not repeat'
  }

  const { pattern, interval, daysOfWeek, dayOfMonth, endDate } = recurrence

  let preview = ''

  switch (pattern) {
    case 'daily':
      preview = interval === 1 ? 'Repeats every day' : `Repeats every ${String(interval)} days`
      break
    case 'weekly':
      if (daysOfWeek !== undefined && daysOfWeek.length > 0) {
        const dayNames = daysOfWeek
          .sort((a, b) => a - b)
          .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.fullLabel ?? '')
          .filter(Boolean)
        if (interval === 1) {
          preview = `Repeats weekly on ${dayNames.join(', ')}`
        } else {
          preview = `Repeats every ${String(interval)} weeks on ${dayNames.join(', ')}`
        }
      } else {
        preview = interval === 1 ? 'Repeats weekly' : `Repeats every ${String(interval)} weeks`
      }
      break
    case 'monthly':
      if (dayOfMonth !== undefined) {
        const suffix = getOrdinalSuffix(dayOfMonth)
        if (interval === 1) {
          preview = `Repeats monthly on the ${String(dayOfMonth)}${suffix}`
        } else {
          preview = `Repeats every ${String(interval)} months on the ${String(dayOfMonth)}${suffix}`
        }
      } else {
        preview = interval === 1 ? 'Repeats monthly' : `Repeats every ${String(interval)} months`
      }
      break
    case 'custom':
      preview = interval === 1 ? 'Repeats every day' : `Repeats every ${String(interval)} days`
      if (daysOfWeek !== undefined && daysOfWeek.length > 0) {
        const dayNames = daysOfWeek
          .sort((a, b) => a - b)
          .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label ?? '')
          .filter(Boolean)
        preview += ` on ${dayNames.join(', ')}`
      }
      break
  }

  if (endDate !== undefined) {
    const end = new Date(endDate)
    preview += ` until ${end.toLocaleDateString()}`
  }

  return preview
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  const idx = (v - 20) % 10
  if (idx >= 0 && idx < s.length) {
    return s[idx]
  }
  if (v >= 0 && v < s.length) {
    return s[v]
  }
  return 'th'
}

export function RecurrenceEditor({
  value,
  onChange,
  className = '',
}: RecurrenceEditorProps): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentPattern: RecurrencePattern | 'none' = value?.pattern ?? 'none'

  const handlePatternChange = useCallback(
    (pattern: RecurrencePattern | 'none'): void => {
      if (pattern === 'none') {
        onChange(undefined)
      } else {
        const newRecurrence: Recurrence = {
          pattern,
          interval: 1,
          daysOfWeek: pattern === 'weekly' ? [new Date().getDay()] : undefined,
          dayOfMonth: pattern === 'monthly' ? new Date().getDate() : undefined,
        }
        onChange(newRecurrence)
      }
    },
    [onChange]
  )

  const handleIntervalChange = useCallback(
    (interval: number): void => {
      if (value === undefined) return
      onChange({ ...value, interval: Math.max(1, interval) })
    },
    [value, onChange]
  )

  const handleDaysOfWeekChange = useCallback(
    (day: number): void => {
      if (value === undefined) return
      const currentDays = value.daysOfWeek ?? []
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort((a, b) => a - b)
      onChange({ ...value, daysOfWeek: newDays.length > 0 ? newDays : undefined })
    },
    [value, onChange]
  )

  const handleDayOfMonthChange = useCallback(
    (day: number): void => {
      if (value === undefined) return
      onChange({ ...value, dayOfMonth: Math.min(31, Math.max(1, day)) })
    },
    [value, onChange]
  )

  const handleEndDateChange = useCallback(
    (dateString: string): void => {
      if (value === undefined) return
      onChange({
        ...value,
        endDate: dateString !== '' ? new Date(dateString).toISOString() : undefined,
      })
    },
    [value, onChange]
  )

  const preview = getRecurrencePreview(value)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Collapsed view */}
      <button
        type="button"
        onClick={(): void => {
          setIsExpanded(!isExpanded)
        }}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-4 py-2.5 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-sm text-gray-700 dark:text-gray-300">{preview}</span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          {/* Pattern selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repeat
            </label>
            <div className="flex flex-wrap gap-2">
              {PATTERNS.map((pattern) => (
                <button
                  key={pattern.value}
                  type="button"
                  onClick={(): void => {
                    handlePatternChange(pattern.value)
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentPattern === pattern.value
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {pattern.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval (for all repeating patterns) */}
          {currentPattern !== 'none' && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Every</label>
              <Input
                type="number"
                min={1}
                max={365}
                value={value?.interval ?? 1}
                onChange={(e): void => {
                  handleIntervalChange(parseInt(e.target.value) || 1)
                }}
                className="w-20"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentPattern === 'daily' || currentPattern === 'custom'
                  ? value?.interval === 1
                    ? 'day'
                    : 'days'
                  : currentPattern === 'weekly'
                    ? value?.interval === 1
                      ? 'week'
                      : 'weeks'
                    : value?.interval === 1
                      ? 'month'
                      : 'months'}
              </span>
            </div>
          )}

          {/* Days of week (for weekly and custom) */}
          {(currentPattern === 'weekly' || currentPattern === 'custom') && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                On days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = value?.daysOfWeek?.includes(day.value) ?? false
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={(): void => {
                        handleDaysOfWeekChange(day.value)
                      }}
                      className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      title={day.fullLabel}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Day of month (for monthly) */}
          {currentPattern === 'monthly' && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">On day</label>
              <Input
                type="number"
                min={1}
                max={31}
                value={value?.dayOfMonth ?? 1}
                onChange={(e): void => {
                  handleDayOfMonthChange(parseInt(e.target.value) || 1)
                }}
                className="w-20"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">of the month</span>
            </div>
          )}

          {/* End date (for all repeating patterns) */}
          {currentPattern !== 'none' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                End date (optional)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={value?.endDate?.slice(0, 10) ?? ''}
                  onChange={(e): void => {
                    handleEndDateChange(e.target.value)
                  }}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-auto"
                />
                {value?.endDate !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(): void => {
                      handleEndDateChange('')
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {currentPattern !== 'none' && (
            <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/20">
              <p className="text-sm text-indigo-800 dark:text-indigo-200">{preview}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
