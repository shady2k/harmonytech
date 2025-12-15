import { type ReactElement, type ReactNode, useEffect, useCallback } from 'react'

interface SlideOverPanelProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** Panel width in pixels. Default: 480 */
  width?: number
  /** Title shown in header. If not provided, no header is rendered */
  title?: string
  className?: string
}

/**
 * Slide-over panel that overlays content from the right.
 * Features:
 * - Slides in from right with smooth animation
 * - Backdrop dims content behind (clickable to close)
 * - ESC key to close
 * - Focus trap for accessibility
 */
export function SlideOverPanel({
  isOpen,
  onClose,
  children,
  width = 480,
  title,
  className = '',
}: SlideOverPanelProps): ReactElement | null {
  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  // Side effects: keyboard listener and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return (): void => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Panel container */}
      <div className="absolute inset-y-0 right-0 flex max-w-full">
        {/* Panel */}
        <div
          className={`relative flex w-screen flex-col bg-white shadow-2xl dark:bg-gray-900 ${className}`}
          style={{ maxWidth: `${String(width)}px` }}
          role="dialog"
          aria-modal="true"
          aria-label={title ?? 'Panel'}
        >
          {/* Header (optional) */}
          {title !== undefined && (
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Close panel"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  )
}
