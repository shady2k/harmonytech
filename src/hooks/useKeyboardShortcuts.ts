import { useEffect, useCallback } from 'react'
import { useUIStore } from '@/stores/ui.store'
import type { ViewType } from '@/types/navigation'

interface KeyboardShortcutsOptions {
  enabled?: boolean
}

const VIEW_SHORTCUTS: Record<string, ViewType> = {
  '1': 'inbox',
  '2': 'tasks',
  '3': 'thoughts',
  '4': 'settings',
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}): void {
  const { enabled = true } = options
  const { openCapture, closeCapture, isCaptureOpen, setActiveView } = useUIStore()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Allow Escape to work even in input fields
      if (event.key === 'Escape') {
        if (isCaptureOpen) {
          event.preventDefault()
          closeCapture()
        }
        return
      }

      // Skip other shortcuts when in input fields
      if (isInputField) {
        return
      }

      // Check for modifier keys
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey

      // 'c' - Open capture (without modifier)
      if (event.key === 'c' && !hasModifier) {
        event.preventDefault()
        openCapture()
        return
      }

      // '/' - Focus search (future feature placeholder)
      if (event.key === '/' && !hasModifier) {
        event.preventDefault()
        // TODO: Focus search input when implemented
        return
      }

      // Number keys 1-4 - Switch views
      if (!hasModifier && event.key in VIEW_SHORTCUTS) {
        event.preventDefault()
        setActiveView(VIEW_SHORTCUTS[event.key])
        return
      }

      // 'n' - New task (alias for capture)
      if (event.key === 'n' && !hasModifier) {
        event.preventDefault()
        openCapture()
        return
      }

      // '?' - Show keyboard shortcuts help (future feature)
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault()
        // TODO: Show keyboard shortcuts modal when implemented
        return
      }
    },
    [openCapture, closeCapture, isCaptureOpen, setActiveView]
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    document.addEventListener('keydown', handleKeyDown)

    return (): void => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}

/**
 * Get a list of available keyboard shortcuts for display
 */
export function getKeyboardShortcuts(): { key: string; description: string }[] {
  return [
    { key: 'c', description: 'Open capture' },
    { key: 'n', description: 'New task' },
    { key: 'Esc', description: 'Close modal' },
    { key: '1', description: 'Go to Inbox' },
    { key: '2', description: 'Go to Tasks' },
    { key: '3', description: 'Go to Thoughts' },
    { key: '4', description: 'Go to Settings' },
    { key: '/', description: 'Search' },
  ]
}
