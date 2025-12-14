import { useEffect, useCallback, useState } from 'react'
import { useUIStore } from '@/stores/ui.store'
import {
  getViewKeyMap,
  ACTION_SHORTCUTS,
  LIST_SHORTCUTS,
  GENERAL_SHORTCUTS,
} from '@/config/shortcuts'

// Re-export for convenience
export { getKeyboardShortcuts } from '@/config/shortcuts'
export type { ShortcutGroup } from '@/config/shortcuts'

interface KeyboardShortcutsOptions {
  enabled?: boolean
  onNavigateNext?: () => void
  onNavigatePrev?: () => void
  onSelect?: () => void
  onAction?: (action: 'complete' | 'edit' | 'delete') => void
}

const VIEW_SHORTCUTS = getViewKeyMap()

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

      // Use event.code for layout-independent shortcuts
      const code = event.code

      // Allow Escape to work even in input fields
      if (code === GENERAL_SHORTCUTS.escape.key) {
        if (isHelpModalOpen) {
          event.preventDefault()
          setIsHelpModalOpen(false)
          return
        }
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

      // 'j' - Navigate down (next item)
      if (code === LIST_SHORTCUTS.next.key && !hasModifier) {
        event.preventDefault()
        onNavigateNext?.()
        return
      }

      // 'k' - Navigate up (previous item)
      if (code === LIST_SHORTCUTS.prev.key && !hasModifier) {
        event.preventDefault()
        onNavigatePrev?.()
        return
      }

      // Enter - Select/open current item
      if (code === LIST_SHORTCUTS.select.key && !hasModifier) {
        event.preventDefault()
        onSelect?.()
        return
      }

      // Space or 'x' - Complete task
      if (
        (code === ACTION_SHORTCUTS.completeAlt.key || code === ACTION_SHORTCUTS.complete.key) &&
        !hasModifier
      ) {
        event.preventDefault()
        onAction?.('complete')
        return
      }

      // 'e' - Edit current item
      if (code === ACTION_SHORTCUTS.edit.key && !hasModifier) {
        event.preventDefault()
        onAction?.('edit')
        return
      }

      // 'd' - Delete current item
      if (code === ACTION_SHORTCUTS.delete.key && !hasModifier) {
        event.preventDefault()
        onAction?.('delete')
        return
      }

      // 'c' - Open capture (without modifier)
      if (code === ACTION_SHORTCUTS.capture.key && !hasModifier) {
        event.preventDefault()
        openCapture()
        return
      }

      // 'n' - New task (alias for capture)
      if (code === ACTION_SHORTCUTS.captureAlt.key && !hasModifier) {
        event.preventDefault()
        openCapture()
        return
      }

      // '/' - Focus search (future feature placeholder)
      if (code === ACTION_SHORTCUTS.search.key && !hasModifier && !event.shiftKey) {
        event.preventDefault()
        // TODO: Focus search input when implemented
        return
      }

      // Letter keys for navigation (h, i, t, o, s)
      if (!hasModifier && code in VIEW_SHORTCUTS) {
        event.preventDefault()
        setActiveView(VIEW_SHORTCUTS[code])
        return
      }

      // '?' (Shift + /) - Show keyboard shortcuts help
      if (code === GENERAL_SHORTCUTS.help.key && event.shiftKey) {
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
