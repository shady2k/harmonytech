import { useRef, useEffect, useCallback, type ReactElement, type KeyboardEvent } from 'react'
import { useCaptureStore } from '@/stores'
import { Button } from '@/components/ui'

interface TextCaptureProps {
  onSubmit?: () => void
}

export function TextCapture({ onSubmit }: TextCaptureProps): ReactElement {
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
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      // Submit on Cmd/Ctrl + Enter
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="space-y-4">
      <textarea
        ref={textareaRef}
        value={inputText}
        onChange={(e): void => {
          setInputText(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind?"
        className="min-h-[120px] max-h-[300px] w-full resize-none overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
        rows={4}
      />
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Press{' '}
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium dark:bg-gray-800">
            ⌘
          </kbd>
          +
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium dark:bg-gray-800">
            Enter
          </kbd>{' '}
          to submit
        </p>
        <Button onClick={handleSubmit} disabled={inputText.trim() === ''} variant="primary">
          Process
        </Button>
      </div>
    </div>
  )
}
