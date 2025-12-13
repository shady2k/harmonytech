import { useEffect, useCallback, useState } from 'react'
import { useUIStore } from '@/stores/ui.store'
import type { ViewType } from '@/types/navigation'

interface KeyboardShortcutsOptions {
  enabled?: boolean
  onNavigateNext?: () => void
  onNavigatePrev?: () => void
  onSelect?: () => void
  onAction?: (action: 'complete' | 'edit' | 'delete') => void
}

const VIEW_SHORTCUTS: Record<string, ViewType> = {
  '1': 'inbox',
  '2': 'tasks',
  '3': 'thoughts',
  '4': 'settings',
}

// Go-to shortcuts (g + key)
const GOTO_SHORTCUTS: Record<string, ViewType> = {
  i: 'inbox',
  t: 'tasks',
  h: 'thoughts', // 'h' for tHoughts since 't' is taken
  s: 'settings',
}

interface UseKeyboardShortcutsReturn {
  isHelpModalOpen: boolean
  openHelpModal: () => void
  closeHelpModal: () => void
}

export function useKeyboardShortcuts(
  options: KeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn {
  const { enabled = true, onNavigateNext, onNavigatePrev, onSelect, onAction } = options
  const { openCapture, closeCapture, isCaptureOpen, setActiveView } = useUIStore()
  const [waitingForGoto, setWaitingForGoto] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

  const openHelpModal = useCallback(() => {
    setIsHelpModalOpen(true)
  }, [])
  const closeHelpModal = useCallback(() => {
    setIsHelpModalOpen(false)
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Allow Escape to work even in input fields
      if (event.key === 'Escape') {
        if (isHelpModalOpen) {
          event.preventDefault()
          setIsHelpModalOpen(false)
          return
        }
        if (isCaptureOpen) {
          event.preventDefault()
          closeCapture()
        }
        if (waitingForGoto) {
          setWaitingForGoto(false)
        }
        return
      }

      // Skip other shortcuts when in input fields
      if (isInputField) {
        return
      }

      // Check for modifier keys
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey

      // Handle g + key navigation
      if (waitingForGoto && !hasModifier) {
        setWaitingForGoto(false)
        if (event.key in GOTO_SHORTCUTS) {
          event.preventDefault()
          setActiveView(GOTO_SHORTCUTS[event.key])
          return
        }
      }

      // 'g' - Start go-to sequence
      if (event.key === 'g' && !hasModifier && !waitingForGoto) {
        setWaitingForGoto(true)
        // Auto-cancel after 1 second
        setTimeout(() => {
          setWaitingForGoto(false)
        }, 1000)
        return
      }

      // 'j' - Navigate down (next item)
      if (event.key === 'j' && !hasModifier) {
        event.preventDefault()
        onNavigateNext?.()
        return
      }

      // 'k' - Navigate up (previous item)
      if (event.key === 'k' && !hasModifier) {
        event.preventDefault()
        onNavigatePrev?.()
        return
      }

      // Enter - Select/open current item
      if (event.key === 'Enter' && !hasModifier) {
        event.preventDefault()
        onSelect?.()
        return
      }

      // Space or 'x' - Complete task
      if ((event.key === ' ' || event.key === 'x') && !hasModifier) {
        event.preventDefault()
        onAction?.('complete')
        return
      }

      // 'e' - Edit current item
      if (event.key === 'e' && !hasModifier) {
        event.preventDefault()
        onAction?.('edit')
        return
      }

      // 'd' - Delete current item
      if (event.key === 'd' && !hasModifier) {
        event.preventDefault()
        onAction?.('delete')
        return
      }

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

      // '?' - Show keyboard shortcuts help
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault()
        setIsHelpModalOpen(true)
        return
      }
    },
    [
      openCapture,
      closeCapture,
      isCaptureOpen,
      setActiveView,
      waitingForGoto,
      isHelpModalOpen,
      onNavigateNext,
      onNavigatePrev,
      onSelect,
      onAction,
    ]
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

  return {
    isHelpModalOpen,
    openHelpModal,
    closeHelpModal,
  }
}

export interface ShortcutGroup {
  title: string
  shortcuts: { key: string; description: string }[]
}

/**
 * Get all keyboard shortcuts grouped by category
 */
export function getKeyboardShortcuts(): ShortcutGroup[] {
  return [
    {
      title: 'Navigation',
      shortcuts: [
        { key: 'j', description: 'Move down' },
        { key: 'k', description: 'Move up' },
        { key: 'Enter', description: 'Open/select item' },
        { key: 'g i', description: 'Go to Inbox' },
        { key: 'g t', description: 'Go to Tasks' },
        { key: 'g h', description: 'Go to Thoughts' },
        { key: 'g s', description: 'Go to Settings' },
        { key: '1-4', description: 'Switch view' },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { key: 'c / n', description: 'New capture' },
        { key: 'x / Space', description: 'Complete task' },
        { key: 'e', description: 'Edit item' },
        { key: 'd', description: 'Delete item' },
        { key: '/', description: 'Search' },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { key: 'Esc', description: 'Close modal' },
        { key: '?', description: 'Show shortcuts' },
      ],
    },
  ]
}
