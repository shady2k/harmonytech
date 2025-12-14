import {
  useRef,
  useEffect,
  useCallback,
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { useCaptureStore } from '@/stores'
import { CAPTURE_SHORTCUTS } from '@/config/shortcuts'

interface TextCaptureProps {
  onSubmit?: () => void
  onMicClick?: (autoStart?: boolean) => void
}

export function TextCapture({ onSubmit, onMicClick }: TextCaptureProps): ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { inputText, setInputText, setProcessingState } = useCaptureStore()

  // Auto-resize textarea with max height
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea !== null) {
      textarea.style.height = 'auto'
      const maxHeight = 300
      textarea.style.height = `${String(Math.min(textarea.scrollHeight, maxHeight))}px`
    }
  }, [inputText])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = useCallback((): void => {
    if (inputText.trim() === '') return

    setProcessingState('extracting')
    onSubmit?.()
  }, [inputText, setProcessingState, onSubmit])

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLTextAreaElement>): void => {
      // Submit on Cmd/Ctrl + Enter
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  // Keyboard shortcut for voice recording (Control + M)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent): void => {
      // Require Control key only
      if (!e.ctrlKey) return
      if (e.metaKey || e.altKey || e.shiftKey) return

      if (e.code === CAPTURE_SHORTCUTS.voiceRecord.key) {
        e.preventDefault()
        onMicClick?.(true) // Auto-start recording when triggered by keyboard
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return (): void => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [onMicClick])

  return (
    <div className="space-y-2">
      {/* Container that looks like one input field */}
      <div className="flex flex-col rounded-lg border border-gray-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800">
        {/* Textarea - no border, fills space above buttons */}
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e): void => {
            setInputText(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          className="min-h-[100px] max-h-[200px] w-full resize-none overflow-y-auto bg-transparent px-4 pt-4 pb-2 text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-500"
          rows={4}
        />
        {/* Action buttons row */}
        <div className="flex items-center justify-end gap-2 px-3 pb-3">
          <button
            type="button"
            onClick={(): void => onMicClick?.()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 focus:outline-none dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label={`Voice recording (${CAPTURE_SHORTCUTS.voiceRecord.label})`}
            title={CAPTURE_SHORTCUTS.voiceRecord.label}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={inputText.trim() === ''}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            aria-label={`Process (${CAPTURE_SHORTCUTS.submit.label})`}
            title={CAPTURE_SHORTCUTS.submit.label}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Hotkey hints */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
          {CAPTURE_SHORTCUTS.submit.label}
        </kbd>
        <span className="ml-1">{CAPTURE_SHORTCUTS.submit.description.toLowerCase()}</span>
        <span className="mx-2">·</span>
        <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">
          {CAPTURE_SHORTCUTS.voiceRecord.label}
        </kbd>
        <span className="ml-1">record</span>
      </p>
    </div>
  )
}
