import type { ViewType } from '@/types/navigation'

/**
 * Centralized keyboard shortcuts configuration
 * Single source of truth for all shortcuts in the app
 */

// Shortcut definition with key, label for display, and description
export interface ShortcutDef {
  key: string // The actual key(s) to press
  label: string // Display label for UI hints (can differ from key)
  description: string
}

// Navigation shortcuts - using KeyboardEvent.code for layout independence
export const NAV_SHORTCUTS: Record<ViewType, ShortcutDef> = {
  home: { key: 'KeyH', label: 'H', description: 'Go to Home' },
  inbox: { key: 'KeyI', label: 'I', description: 'Go to Inbox' },
  tasks: { key: 'KeyT', label: 'T', description: 'Go to Tasks' },
  timers: { key: 'KeyR', label: 'R', description: 'Go to Timers' },
  thoughts: { key: 'KeyO', label: 'O', description: 'Go to Thoughts' }, // 'O' for thOughts
  settings: { key: 'KeyS', label: 'S', description: 'Go to Settings' },
}

// Action shortcuts - using KeyboardEvent.code for layout independence
export const ACTION_SHORTCUTS = {
  capture: { key: 'KeyC', label: 'C', description: 'New capture' },
  captureAlt: { key: 'KeyN', label: 'N', description: 'New capture (alt)' },
  complete: { key: 'KeyX', label: 'X', description: 'Complete task' },
  completeAlt: { key: 'Space', label: 'Space', description: 'Complete task (alt)' },
  edit: { key: 'KeyE', label: 'E', description: 'Edit item' },
  delete: { key: 'KeyD', label: 'D', description: 'Delete item' },
  search: { key: 'Slash', label: '/', description: 'Search' },
} as const

// Navigation within lists - using KeyboardEvent.code
export const LIST_SHORTCUTS = {
  next: { key: 'KeyJ', label: 'J', description: 'Move down' },
  prev: { key: 'KeyK', label: 'K', description: 'Move up' },
  select: { key: 'Enter', label: 'Enter', description: 'Open/select item' },
} as const

// General shortcuts - using KeyboardEvent.code
export const GENERAL_SHORTCUTS = {
  escape: { key: 'Escape', label: 'Esc', description: 'Close modal' },
  help: { key: 'Slash', label: '?', description: 'Show shortcuts' }, // Shift+Slash = ?
} as const

// Capture modal shortcuts - these use modifier keys
export const CAPTURE_SHORTCUTS = {
  submit: { key: 'Enter', modifier: 'cmd', label: '⌘ + ↩', description: 'Send' },
  voiceRecord: {
    key: 'KeyM',
    modifier: 'ctrl',
    label: '⌃ + M',
    description: 'Record voice',
  },
} as const

// Helper to get view key mapping for the hook
export function getViewKeyMap(): Record<string, ViewType> {
  const map: Record<string, ViewType> = {}
  for (const [view, shortcut] of Object.entries(NAV_SHORTCUTS)) {
    map[shortcut.key] = view as ViewType
  }
  return map
}

// Grouped shortcuts for help modal display
export interface ShortcutGroup {
  title: string
  shortcuts: { key: string; description: string }[]
}

export function getKeyboardShortcuts(): ShortcutGroup[] {
  return [
    {
      title: 'Navigation',
      shortcuts: [
        { key: NAV_SHORTCUTS.home.label, description: NAV_SHORTCUTS.home.description },
        { key: NAV_SHORTCUTS.inbox.label, description: NAV_SHORTCUTS.inbox.description },
        { key: NAV_SHORTCUTS.tasks.label, description: NAV_SHORTCUTS.tasks.description },
        { key: NAV_SHORTCUTS.timers.label, description: NAV_SHORTCUTS.timers.description },
        { key: NAV_SHORTCUTS.thoughts.label, description: NAV_SHORTCUTS.thoughts.description },
        { key: NAV_SHORTCUTS.settings.label, description: NAV_SHORTCUTS.settings.description },
        { key: LIST_SHORTCUTS.next.label, description: LIST_SHORTCUTS.next.description },
        { key: LIST_SHORTCUTS.prev.label, description: LIST_SHORTCUTS.prev.description },
        { key: LIST_SHORTCUTS.select.label, description: LIST_SHORTCUTS.select.description },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        {
          key: `${ACTION_SHORTCUTS.capture.label} / ${ACTION_SHORTCUTS.captureAlt.label}`,
          description: ACTION_SHORTCUTS.capture.description,
        },
        {
          key: `${ACTION_SHORTCUTS.complete.label} / ${ACTION_SHORTCUTS.completeAlt.label}`,
          description: ACTION_SHORTCUTS.complete.description,
        },
        { key: ACTION_SHORTCUTS.edit.label, description: ACTION_SHORTCUTS.edit.description },
        { key: ACTION_SHORTCUTS.delete.label, description: ACTION_SHORTCUTS.delete.description },
        { key: ACTION_SHORTCUTS.search.label, description: ACTION_SHORTCUTS.search.description },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { key: GENERAL_SHORTCUTS.escape.label, description: GENERAL_SHORTCUTS.escape.description },
        { key: GENERAL_SHORTCUTS.help.label, description: GENERAL_SHORTCUTS.help.description },
      ],
    },
  ]
}
