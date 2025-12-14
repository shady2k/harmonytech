/**
 * Unified date formatting utilities
 * All date formatting in the app should use these functions for consistency
 */

/**
 * Format a date with full details (date + time)
 * Example: "Dec 14, 2025, 10:21 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a date without time
 * Example: "Dec 14, 2025"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a short date (no year)
 * Example: "Dec 14"
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format time only
 * Example: "10:21 PM"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Format a relative date (Today, Yesterday, X days ago, or short date)
 * Used for cards and lists
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return formatTime(d)
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  if (diffDays <= 7) {
    return `${String(diffDays)} days ago`
  }
  return formatShortDate(d)
}

/**
 * Format date with time for scheduled items
 * Example: "Dec 14 10:21 PM" or "Today 10:21 PM" or "Tomorrow 10:21 PM"
 */
export function formatScheduledDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  const timeStr = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })

  if (dateOnly.getTime() === today.getTime()) {
    return `Today ${timeStr}`
  }
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${timeStr}`
  }
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${timeStr}`
}

/**
 * Format deadline with relative text
 * Example: "Today", "Tomorrow", "3 days", "Overdue", "Dec 14"
 */
export function formatDeadline(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'Overdue'
  }
  if (diffDays === 0) {
    return 'Today'
  }
  if (diffDays === 1) {
    return 'Tomorrow'
  }
  if (diffDays <= 7) {
    return `${String(diffDays)} days`
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Check if a date is overdue (in the past)
 */
export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d < new Date()
}

/**
 * Format a relative time ago
 * Example: "just now", "5m ago", "2h ago", "3d ago"
 */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${String(minutes)}m ago`
  if (hours < 24) return `${String(hours)}h ago`
  return `${String(days)}d ago`
}
