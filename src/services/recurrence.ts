import type { Recurrence, Task } from '@/types/task'

/**
 * Calculate the next occurrence date based on recurrence pattern
 */
export function calculateNextOccurrence(
  recurrence: Recurrence,
  fromDate: Date = new Date()
): Date | null {
  const { pattern, interval, daysOfWeek, dayOfMonth, endDate } = recurrence

  const nextDate = new Date(fromDate)
  nextDate.setHours(0, 0, 0, 0)

  switch (pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval)
      break

    case 'weekly':
      if (daysOfWeek !== undefined && daysOfWeek.length > 0) {
        // Find the next occurrence day
        const currentDay = nextDate.getDay()
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b)

        // Find next day in the current week
        const nextDayInWeek = sortedDays.find((d) => d > currentDay)

        if (nextDayInWeek !== undefined) {
          // Next occurrence is in the same week
          nextDate.setDate(nextDate.getDate() + (nextDayInWeek - currentDay))
        } else {
          // Next occurrence is in the next interval week
          const daysUntilFirstDay = 7 - currentDay + sortedDays[0]
          const additionalWeeks = (interval - 1) * 7
          nextDate.setDate(nextDate.getDate() + daysUntilFirstDay + additionalWeeks)
        }
      } else {
        // Simple weekly recurrence
        nextDate.setDate(nextDate.getDate() + 7 * interval)
      }
      break

    case 'monthly':
      // Move to next month(s)
      nextDate.setMonth(nextDate.getMonth() + interval)

      if (dayOfMonth !== undefined) {
        // Set to specific day of month, handling months with fewer days
        const targetDay = Math.min(
          dayOfMonth,
          getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())
        )
        nextDate.setDate(targetDay)
      }
      break

    case 'custom':
      // Custom pattern - similar to daily but can have day-of-week constraints
      if (daysOfWeek !== undefined && daysOfWeek.length > 0) {
        // Find next valid day
        let daysAdded = 0
        const maxIterations = 365 * interval // Prevent infinite loop
        while (daysAdded < maxIterations) {
          nextDate.setDate(nextDate.getDate() + 1)
          daysAdded++
          if (daysOfWeek.includes(nextDate.getDay())) {
            // Check if we've passed enough intervals (simplified)
            if (daysAdded >= interval) {
              break
            }
          }
        }
      } else {
        nextDate.setDate(nextDate.getDate() + interval)
      }
      break
  }

  // Check if next occurrence is past end date
  if (endDate !== undefined) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    if (nextDate > end) {
      return null
    }
  }

  return nextDate
}

/**
 * Get the number of days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Create the next instance of a recurring task
 */
export function createNextInstance(task: Task): Task | null {
  if (task.recurrence === undefined) {
    return null
  }

  const completedAt = task.completedAt !== undefined ? new Date(task.completedAt) : new Date()
  const nextOccurrence = calculateNextOccurrence(task.recurrence, completedAt)

  if (nextOccurrence === null) {
    // Recurrence has ended
    return null
  }

  const now = new Date().toISOString()

  // Generate ID similar to useTasks hook
  const generateId = (): string =>
    `task-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`

  // Create new task instance
  const newTask: Task = {
    id: generateId(),
    rawInput: task.rawInput,
    nextAction: task.nextAction,
    context: task.context,
    energy: task.energy,
    timeEstimate: task.timeEstimate,
    project: task.project,
    isSomedayMaybe: task.isSomedayMaybe,
    isCompleted: false,
    completedAt: undefined,
    createdAt: now,
    updatedAt: now,
    aiSuggestions: task.aiSuggestions,
    recurrence: task.recurrence,
    sourceThoughtId: task.sourceThoughtId ?? '',
    // Set deadline to next occurrence date if original had a deadline
    deadline: task.deadline !== undefined ? nextOccurrence.toISOString() : undefined,
  }

  return newTask
}

/**
 * Check if a recurrence has ended (past end date)
 */
export function isRecurrenceEnded(recurrence: Recurrence): boolean {
  if (recurrence.endDate === undefined) {
    return false
  }
  const end = new Date(recurrence.endDate)
  return new Date() > end
}

/**
 * Get a human-readable description of the recurrence
 */
export function getRecurrenceDescription(recurrence: Recurrence | undefined): string {
  if (recurrence === undefined) {
    return 'Does not repeat'
  }

  const { pattern, interval, daysOfWeek, dayOfMonth } = recurrence

  const daysMap: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  }

  switch (pattern) {
    case 'daily':
      return interval === 1 ? 'Every day' : `Every ${String(interval)} days`

    case 'weekly':
      if (daysOfWeek !== undefined && daysOfWeek.length > 0) {
        const dayNames = daysOfWeek.map((d) => daysMap[d]).filter(Boolean)
        const prefix = interval === 1 ? 'Weekly' : `Every ${String(interval)} weeks`
        return `${prefix} on ${dayNames.join(', ')}`
      }
      return interval === 1 ? 'Weekly' : `Every ${String(interval)} weeks`

    case 'monthly':
      if (dayOfMonth !== undefined) {
        const suffix = getOrdinalSuffix(dayOfMonth)
        const prefix = interval === 1 ? 'Monthly' : `Every ${String(interval)} months`
        return `${prefix} on the ${String(dayOfMonth)}${suffix}`
      }
      return interval === 1 ? 'Monthly' : `Every ${String(interval)} months`

    case 'custom':
      return `Every ${String(interval)} days`
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  const idx = (v - 20) % 10
  if (idx >= 0 && idx < s.length) {
    return s[idx]
  }
  if (v >= 0 && v < s.length) {
    return s[v]
  }
  return 'th'
}
