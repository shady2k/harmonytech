import type { ReactElement } from 'react'

interface KbdProps {
  children: string
  className?: string
}

/**
 * Keyboard key badge component for displaying hotkey hints
 * Renders a small, subtle badge that looks like a keyboard key
 */
export function Kbd({ children, className = '' }: KbdProps): ReactElement {
  return (
    <kbd
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded border border-gray-300 bg-gray-100 px-1.5 font-mono text-xs font-medium text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 ${className}`}
    >
      {children}
    </kbd>
  )
}
