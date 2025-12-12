import type { ReactElement } from 'react'
import type { ProcessingState } from '@/stores'
import { LoadingSpinner } from '@/components/ui'

interface ProcessingIndicatorProps {
  state: ProcessingState
}

const PROCESSING_MESSAGES: Record<ProcessingState, string> = {
  idle: '',
  recording: 'Recording...',
  transcribing: 'Transcribing audio...',
  extracting: 'Extracting tasks and thoughts...',
  suggesting: 'Generating suggestions...',
  done: 'Complete!',
}

const PROCESSING_DESCRIPTIONS: Record<ProcessingState, string> = {
  idle: '',
  recording: 'Speak clearly into your microphone',
  transcribing: 'Converting your voice to text',
  extracting: 'Identifying actionable items',
  suggesting: 'Adding context and properties',
  done: 'Review your items below',
}

export function ProcessingIndicator({ state }: ProcessingIndicatorProps): ReactElement {
  const message = PROCESSING_MESSAGES[state]
  const description = PROCESSING_DESCRIPTIONS[state]

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated spinner */}
      <div className="mb-6">
        <LoadingSpinner size="lg" />
      </div>

      {/* Processing step */}
      <div className="text-center">
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{message}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      {/* Progress dots */}
      <div className="mt-6 flex gap-2">
        <ProgressDot active={state === 'transcribing'} completed={isAfter(state, 'transcribing')} />
        <ProgressDot active={state === 'extracting'} completed={isAfter(state, 'extracting')} />
        <ProgressDot active={state === 'suggesting'} completed={isAfter(state, 'suggesting')} />
      </div>
    </div>
  )
}

interface ProgressDotProps {
  active: boolean
  completed: boolean
}

function ProgressDot({ active, completed }: ProgressDotProps): ReactElement {
  let className = 'h-2 w-2 rounded-full transition-all duration-300'

  if (completed) {
    className += ' bg-green-500'
  } else if (active) {
    className += ' animate-pulse bg-indigo-500'
  } else {
    className += ' bg-gray-300 dark:bg-gray-600'
  }

  return <div className={className} />
}

function isAfter(current: ProcessingState, target: ProcessingState): boolean {
  const order: ProcessingState[] = [
    'idle',
    'recording',
    'transcribing',
    'extracting',
    'suggesting',
    'done',
  ]
  return order.indexOf(current) > order.indexOf(target)
}
