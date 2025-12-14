/**
 * Recurrence Utilities
 *
 * Functions to calculate next occurrence dates from recurrence patterns.
 * Handles complex patterns like "next weekend after X day of month".
 */

import type { Recurrence } from '@/types/schemas/task.schema'

/**
 * Calculate the next occurrence of a recurring task
 * @param recurrence The recurrence pattern
 * @param fromDate The date to calculate from (defaults to now)
 * @returns Object with scheduledStart and scheduledEnd dates, or null if invalid
 */
export function calculateNextOccurrence(
  recurrence: Recurrence,
  fromDate: Date = new Date()
): { scheduledStart: Date; scheduledEnd: Date | null } | null {
  const { pattern, interval = 1, daysOfWeek, dayOfMonth, anchorDay, constraint } = recurrence

  switch (pattern) {
    case 'daily':
      return calculateDailyOccurrence(fromDate, interval)

    case 'weekly':
      return calculateWeeklyOccurrence(fromDate, interval, daysOfWeek)

    case 'monthly':
      return calculateMonthlyOccurrence(fromDate, interval, dayOfMonth, anchorDay, constraint)

    case 'custom':
      // Custom patterns need specific handling based on anchorDay + constraint
      if (anchorDay !== undefined && constraint !== undefined) {
        return calculateMonthlyOccurrence(fromDate, interval, undefined, anchorDay, constraint)
      }
      return null

    default:
      return null
  }
}

/**
 * Calculate next daily occurrence
 */
function calculateDailyOccurrence(
  fromDate: Date,
  interval: number
): { scheduledStart: Date; scheduledEnd: Date | null } {
  const next = new Date(fromDate)
  next.setDate(next.getDate() + interval)
  next.setHours(0, 0, 0, 0)

  return { scheduledStart: next, scheduledEnd: null }
}

/**
 * Calculate next weekly occurrence
 */
function calculateWeeklyOccurrence(
  fromDate: Date,
  interval: number,
  daysOfWeek?: number[]
): { scheduledStart: Date; scheduledEnd: Date | null } {
  const next = new Date(fromDate)

  if (daysOfWeek !== undefined && daysOfWeek.length > 0) {
    // Find the next day that matches one of the specified days
    const currentDay = getISODay(next)
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b)

    // Find the next matching day
    let targetDay = sortedDays.find((d) => d > currentDay)
    let daysToAdd: number

    if (targetDay !== undefined) {
      // Found a day later this week
      daysToAdd = targetDay - currentDay
    } else {
      // Move to next week (or interval weeks) and pick the first day
      targetDay = sortedDays[0]
      daysToAdd = 7 * interval - currentDay + targetDay
    }

    next.setDate(next.getDate() + daysToAdd)
  } else {
    // No specific days, just add interval weeks
    next.setDate(next.getDate() + 7 * interval)
  }

  next.setHours(0, 0, 0, 0)
  return { scheduledStart: next, scheduledEnd: null }
}

/**
 * Calculate next monthly occurrence
 */
function calculateMonthlyOccurrence(
  fromDate: Date,
  interval: number,
  dayOfMonth?: number,
  anchorDay?: number,
  constraint?: Recurrence['constraint']
): { scheduledStart: Date; scheduledEnd: Date | null } {
  const next = new Date(fromDate)
  const currentDay = next.getDate()

  // Determine the target month
  let targetMonth = next.getMonth()
  let targetYear = next.getFullYear()

  // If we have a constraint (e.g., "next weekend after anchorDay")
  if (anchorDay !== undefined && constraint !== undefined) {
    return calculateConstrainedMonthlyOccurrence(fromDate, interval, anchorDay, constraint)
  }

  // Simple day of month recurrence
  if (dayOfMonth !== undefined) {
    if (currentDay >= dayOfMonth) {
      // Move to next occurrence month
      targetMonth += interval
      if (targetMonth > 11) {
        targetYear += Math.floor(targetMonth / 12)
        targetMonth = targetMonth % 12
      }
    }

    // Handle months with fewer days
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
    const actualDay = Math.min(dayOfMonth, daysInMonth)

    const scheduledStart = new Date(targetYear, targetMonth, actualDay, 0, 0, 0, 0)
    return { scheduledStart, scheduledEnd: null }
  }

  // Default: same day next month
  next.setMonth(next.getMonth() + interval)
  next.setHours(0, 0, 0, 0)
  return { scheduledStart: next, scheduledEnd: null }
}

/**
 * Calculate monthly occurrence with constraint (e.g., "weekend after 10th")
 */
function calculateConstrainedMonthlyOccurrence(
  fromDate: Date,
  interval: number,
  anchorDay: number,
  constraint: NonNullable<Recurrence['constraint']>
): { scheduledStart: Date; scheduledEnd: Date | null } {
  const now = new Date(fromDate)
  let targetMonth = now.getMonth()
  let targetYear = now.getFullYear()

  // Start from anchorDay of current month
  let anchor = new Date(targetYear, targetMonth, anchorDay)

  // If anchor is in the past, move to next occurrence month
  if (anchor <= now) {
    targetMonth += interval
    if (targetMonth > 11) {
      targetYear += Math.floor(targetMonth / 12)
      targetMonth = targetMonth % 12
    }
    anchor = new Date(targetYear, targetMonth, anchorDay)
  }

  // Apply constraint
  const result = applyConstraint(anchor, constraint)
  return result
}

/**
 * Apply a constraint to find the target date
 */
function applyConstraint(
  anchor: Date,
  constraint: NonNullable<Recurrence['constraint']>
): { scheduledStart: Date; scheduledEnd: Date | null } {
  const result = new Date(anchor)

  switch (constraint) {
    case 'next-weekend': {
      // Find first Saturday on or after anchor
      const dayOfWeek = result.getDay() // 0=Sun, 6=Sat
      const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7 || 7
      result.setDate(result.getDate() + daysUntilSaturday)
      result.setHours(0, 0, 0, 0)

      // Weekend ends on Sunday
      const endDate = new Date(result)
      endDate.setDate(endDate.getDate() + 1)
      endDate.setHours(23, 59, 59, 999)

      return { scheduledStart: result, scheduledEnd: endDate }
    }

    case 'next-saturday': {
      const dayOfWeek = result.getDay()
      const daysUntilSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek + 7) % 7 || 7
      result.setDate(result.getDate() + daysUntilSaturday)
      result.setHours(0, 0, 0, 0)
      return { scheduledStart: result, scheduledEnd: null }
    }

    case 'next-sunday': {
      const dayOfWeek = result.getDay()
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
      result.setDate(result.getDate() + daysUntilSunday)
      result.setHours(0, 0, 0, 0)
      return { scheduledStart: result, scheduledEnd: null }
    }

    case 'next-weekday': {
      const dayOfWeek = result.getDay()
      // 0=Sun, 6=Sat - find next Mon-Fri
      if (dayOfWeek === 0) {
        result.setDate(result.getDate() + 1) // Sun -> Mon
      } else if (dayOfWeek === 6) {
        result.setDate(result.getDate() + 2) // Sat -> Mon
      }
      // else already a weekday
      result.setHours(0, 0, 0, 0)
      return { scheduledStart: result, scheduledEnd: null }
    }

    default:
      return { scheduledStart: result, scheduledEnd: null }
  }
}

/**
 * Get ISO day of week (1=Monday, 7=Sunday)
 */
function getISODay(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

/**
 * Calculate this weekend's dates (Saturday to Sunday)
 */
export function getThisWeekend(fromDate: Date = new Date()): { start: Date; end: Date } {
  const result = new Date(fromDate)
  const dayOfWeek = result.getDay()

  // Calculate days until Saturday
  const daysUntilSaturday = dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 6 : 6 - dayOfWeek

  result.setDate(result.getDate() + daysUntilSaturday)
  result.setHours(0, 0, 0, 0)

  const endDate = new Date(result)
  endDate.setDate(endDate.getDate() + 1)
  endDate.setHours(23, 59, 59, 999)

  return { start: result, end: endDate }
}

/**
 * Calculate next weekend's dates (Saturday to Sunday)
 */
export function getNextWeekend(fromDate: Date = new Date()): { start: Date; end: Date } {
  const thisWeekend = getThisWeekend(fromDate)

  // If we're before this weekend, return this weekend
  if (fromDate < thisWeekend.start) {
    return thisWeekend
  }

  // Otherwise, return next week's weekend
  const nextSaturday = new Date(thisWeekend.start)
  nextSaturday.setDate(nextSaturday.getDate() + 7)

  const nextSunday = new Date(nextSaturday)
  nextSunday.setDate(nextSunday.getDate() + 1)
  nextSunday.setHours(23, 59, 59, 999)

  return { start: nextSaturday, end: nextSunday }
}

/**
 * Format a recurrence pattern for display
 */
export function formatRecurrence(recurrence: Recurrence): string {
  const { pattern, interval = 1, daysOfWeek, dayOfMonth, anchorDay, constraint } = recurrence

  const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  switch (pattern) {
    case 'daily':
      return interval === 1 ? 'Daily' : `Every ${String(interval)} days`

    case 'weekly':
      if (daysOfWeek !== undefined && daysOfWeek.length > 0) {
        const days = daysOfWeek.map((d) => dayNames[d]).join(', ')
        return interval === 1 ? `Weekly on ${days}` : `Every ${String(interval)} weeks on ${days}`
      }
      return interval === 1 ? 'Weekly' : `Every ${String(interval)} weeks`

    case 'monthly':
      if (anchorDay !== undefined && constraint !== undefined) {
        const constraintText =
          constraint === 'next-weekend'
            ? 'weekend'
            : constraint === 'next-weekday'
              ? 'weekday'
              : constraint === 'next-saturday'
                ? 'Saturday'
                : 'Sunday'
        return `Monthly, ${constraintText} after the ${String(anchorDay)}${getOrdinalSuffix(anchorDay)}`
      }
      if (dayOfMonth !== undefined) {
        return `Monthly on the ${String(dayOfMonth)}${getOrdinalSuffix(dayOfMonth)}`
      }
      return interval === 1 ? 'Monthly' : `Every ${String(interval)} months`

    case 'custom':
      return 'Custom recurrence'

    default:
      return 'Recurring'
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

/**
 * Check if a task is currently actionable based on its schedule
 * @param scheduledStart ISO date string, null, or undefined
 * @param scheduledEnd ISO date string, null, or undefined
 * @param now Current date (defaults to now)
 * @returns true if the task can be worked on now
 */
export function isTaskScheduledNow(
  scheduledStart: string | null | undefined,
  scheduledEnd: string | null | undefined,
  now: Date = new Date()
): boolean {
  // No scheduling = always actionable (handle both null and undefined)
  if (scheduledStart === undefined || scheduledStart === null) {
    return true
  }

  const startDate = new Date(scheduledStart)
  if (Number.isNaN(startDate.getTime())) {
    // Invalid date = treat as no scheduling
    return true
  }

  // Task hasn't started yet
  if (now < startDate) {
    return false
  }

  // If there's an end date, check if we're past it
  if (scheduledEnd !== undefined && scheduledEnd !== null) {
    const endDate = new Date(scheduledEnd)
    if (!Number.isNaN(endDate.getTime()) && now > endDate) {
      // Past the scheduled window - for recurring tasks this means
      // the window has passed but task wasn't completed
      // Still show it as actionable (overdue)
      return true
    }
  }

  return true
}
