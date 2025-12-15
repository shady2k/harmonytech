import { type ReactElement } from 'react'
import type { CaptureAssistMode } from '@/stores/ui.store'

interface CaptureModeSwitcherProps {
  mode: CaptureAssistMode
  onModeChange: (mode: CaptureAssistMode) => void
  isAIAvailable: boolean
}

export function CaptureModeSwitcher({
  mode,
  onModeChange,
  isAIAvailable,
}: CaptureModeSwitcherProps): ReactElement {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={(): void => {
          if (isAIAvailable) {
            onModeChange('ai')
          }
        }}
        disabled={!isAIAvailable}
        title={isAIAvailable ? 'AI-assisted capture' : 'AI not configured'}
        className={`relative rounded-md px-3 py-1 text-xs font-medium transition-colors ${
          mode === 'ai'
            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
            : isAIAvailable
              ? 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              : 'cursor-not-allowed text-gray-400 dark:text-gray-600'
        }`}
      >
        AI
        {!isAIAvailable && (
          <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </button>
      <button
        type="button"
        onClick={(): void => {
          onModeChange('manual')
        }}
        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
          mode === 'manual'
            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
        }`}
      >
        Manual
      </button>
    </div>
  )
}
