import { type ReactElement } from 'react'
import type { PropertySuggestion as PropertySuggestionType } from '@/stores'

interface PropertySuggestionProps<T> {
  label: string
  suggestion: PropertySuggestionType<T>
  options?: T[]
  renderValue: (value: T) => string
  onSelect: (value: T) => void
  onCustom?: () => void
}

export function PropertySuggestion<T>({
  label,
  suggestion,
  options,
  renderValue,
  onSelect,
  onCustom,
}: PropertySuggestionProps<T>): ReactElement {
  const { value, confidence, alternatives } = suggestion

  // Combine suggested value with alternatives, removing duplicates
  const allOptions = options ?? [value, ...alternatives]

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {confidence < 1 && (
          <span className="text-xs text-gray-400">{Math.round(confidence * 100)}% confident</span>
        )}
      </div>

      {/* Options as chips */}
      <div className="flex flex-wrap gap-2">
        {allOptions.map((option, index) => {
          const isSelected = option === value
          const displayValue = renderValue(option)

          return (
            <button
              key={`${String(option)}-${String(index)}`}
              type="button"
              onClick={(): void => {
                onSelect(option)
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {displayValue}
              {isSelected && index === 0 && confidence < 1 && (
                <span className="ml-1 text-indigo-500">✓</span>
              )}
            </button>
          )
        })}

        {/* Custom option */}
        {onCustom !== undefined && (
          <button
            type="button"
            onClick={onCustom}
            className="rounded-full border-2 border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500"
          >
            Custom...
          </button>
        )}
      </div>
    </div>
  )
}
