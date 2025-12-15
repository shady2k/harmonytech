/**
 * Date Resolver Service
 *
 * Resolves semantic date anchors to actual Date objects.
 * AI extracts meaning (DateAnchor), this service calculates actual dates.
 *
 * Design principle: AI doesn't have a calendar, so it can't reliably
 * calculate dates. It extracts semantic meaning, we calculate dates.
 */

import type {
  DateAnchor,
  RelativeDateAnchor,
  OffsetDateAnchor,
  WeekdayDateAnchor,
  AbsoluteDateAnchor,
  Recurrence,
} from '@/types/schemas/task.schema'

export interface ResolvedDates {
  scheduledStart: string // ISO 8601
  scheduledEnd: string | null // ISO 8601 or null
}

/**
 * Resolve a date anchor to actual ISO dates
 * @param anchor The semantic date anchor from AI
 * @param endAnchor Optional end anchor for date ranges
 * @param fromDate Reference date (defaults to now)
 */
export function resolveDateAnchor(
  anchor: DateAnchor | undefined,
  endAnchor?: DateAnchor,
  fromDate: Date = new Date()
): ResolvedDates | null {
  if (anchor === undefined || anchor.type === 'none') {
    return null
  }

  const startDate = resolveAnchorToDate(anchor, fromDate)
  if (startDate === null) {
    return null
  }

  let endDate: Date | null = null

  // Check if this anchor type implies a range (weekend = Sat-Sun)
  if (
    anchor.type === 'relative' &&
    (anchor.value === 'this-weekend' || anchor.value === 'next-weekend')
  ) {
    // Weekend implies Saturday-Sunday range
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1) // Sunday
    endDate.setHours(23, 59, 59, 999)
  } else if (endAnchor !== undefined && endAnchor.type !== 'none') {
    // Explicit end anchor provided
    endDate = resolveAnchorToDate(endAnchor, fromDate)
    if (endDate !== null) {
      endDate.setHours(23, 59, 59, 999)
    }
  }

  return {
    scheduledStart: startDate.toISOString(),
    scheduledEnd: endDate !== null ? endDate.toISOString() : null,
  }
}

/**
 * Resolve a date anchor to a Date object
 */
function resolveAnchorToDate(anchor: DateAnchor, fromDate: Date): Date | null {
  switch (anchor.type) {
    case 'relative':
      return resolveRelativeAnchor(anchor, fromDate)
    case 'offset':
      return resolveOffsetAnchor(anchor, fromDate)
    case 'weekday':
      return resolveWeekdayAnchor(anchor, fromDate)
    case 'absolute':
      return resolveAbsoluteAnchor(anchor, fromDate)
    case 'none':
      return null
  }
}

/**
 * Resolve relative anchor ("tomorrow", "this weekend", etc.)
 */
function resolveRelativeAnchor(anchor: RelativeDateAnchor, fromDate: Date): Date {
  const result = new Date(fromDate)
  result.setHours(0, 0, 0, 0)

  switch (anchor.value) {
    case 'today':
      // Already set to today
      break

    case 'tomorrow':
      result.setDate(result.getDate() + 1)
      break

    case 'day-after-tomorrow':
      result.setDate(result.getDate() + 2)
      break

    case 'this-weekend': {
      // Find this Saturday
      const dayOfWeek = result.getDay() // 0=Sun, 6=Sat
      if (dayOfWeek === 0) {
        // Today is Sunday, "this weekend" means today
        // But typically we want Saturday, so go back 1 day
        result.setDate(result.getDate() - 1)
      } else if (dayOfWeek === 6) {
        // Today is Saturday, keep it
      } else {
        // Weekday - find next Saturday
        const daysUntilSaturday = 6 - dayOfWeek
        result.setDate(result.getDate() + daysUntilSaturday)
      }
      break
    }

    case 'next-weekend': {
      // Find next Saturday (skip this weekend if we're in it)
      const dayOfWeek = result.getDay()
      let daysUntilSaturday: number

      if (dayOfWeek === 6) {
        // Today is Saturday, next weekend is in 7 days
        daysUntilSaturday = 7
      } else if (dayOfWeek === 0) {
        // Today is Sunday, next weekend is in 6 days
        daysUntilSaturday = 6
      } else {
        // Weekday - first Saturday is this weekend, next is +7
        daysUntilSaturday = 6 - dayOfWeek + 7
      }
      result.setDate(result.getDate() + daysUntilSaturday)
      break
    }

    case 'this-week': {
      // Start of this week (Monday)
      const dayOfWeek = result.getDay()
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      result.setDate(result.getDate() - daysFromMonday)
      break
    }

    case 'next-week': {
      // Start of next week (Monday)
      const dayOfWeek = result.getDay()
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
      result.setDate(result.getDate() + daysUntilMonday)
      break
    }
  }

  // Apply time if specified
  if (anchor.time !== undefined) {
    applyTime(result, anchor.time)
  }

  return result
}

/**
 * Resolve offset anchor ("in 3 days", "in 2 weeks")
 */
function resolveOffsetAnchor(anchor: OffsetDateAnchor, fromDate: Date): Date {
  const result = new Date(fromDate)
  result.setHours(0, 0, 0, 0)

  switch (anchor.unit) {
    case 'days':
      result.setDate(result.getDate() + anchor.amount)
      break
    case 'weeks':
      result.setDate(result.getDate() + anchor.amount * 7)
      break
    case 'months':
      result.setMonth(result.getMonth() + anchor.amount)
      break
  }

  if (anchor.time !== undefined) {
    applyTime(result, anchor.time)
  }

  return result
}

/**
 * Resolve weekday anchor ("on Monday", "next Friday")
 */
function resolveWeekdayAnchor(anchor: WeekdayDateAnchor, fromDate: Date): Date {
  const result = new Date(fromDate)
  result.setHours(0, 0, 0, 0)

  // Convert ISO weekday (1-7, Mon-Sun) to JS weekday (0-6, Sun-Sat)
  const targetJsWeekday = anchor.weekday === 7 ? 0 : anchor.weekday
  const currentJsWeekday = result.getDay()

  let daysToAdd: number

  if (anchor.modifier === 'next') {
    // "next Monday" means the Monday of next week (skip this week's)
    daysToAdd = (targetJsWeekday - currentJsWeekday + 7) % 7
    if (daysToAdd === 0) {
      daysToAdd = 7 // Same day means next week
    }
    // Add 7 to ensure we skip to next week if target is later this week
    if (daysToAdd <= 7 - currentJsWeekday) {
      // Target is later this week, skip to next week
      daysToAdd += 7
    }
  } else {
    // "this" or unspecified - find the nearest upcoming occurrence
    daysToAdd = (targetJsWeekday - currentJsWeekday + 7) % 7
    if (daysToAdd === 0) {
      // Same day - could mean today or next week depending on context
      // Default to today if no modifier specified
      daysToAdd = anchor.modifier === 'this' ? 0 : 7
    }
  }

  result.setDate(result.getDate() + daysToAdd)

  if (anchor.time !== undefined) {
    applyTime(result, anchor.time)
  }

  return result
}

/**
 * Resolve absolute anchor ("January 15", "15.01.2025")
 */
function resolveAbsoluteAnchor(anchor: AbsoluteDateAnchor, fromDate: Date): Date {
  let year = anchor.year

  if (year === undefined) {
    // Infer year: if the date is in the past this year, use next year
    const currentYear = fromDate.getFullYear()
    const testDate = new Date(currentYear, anchor.month - 1, anchor.day)
    year = testDate < fromDate ? currentYear + 1 : currentYear
  }

  const result = new Date(year, anchor.month - 1, anchor.day, 0, 0, 0, 0)

  if (anchor.time !== undefined) {
    applyTime(result, anchor.time)
  }

  return result
}

/**
 * Apply time string to a date
 */
function applyTime(date: Date, time: string): void {
  const [hours, minutes] = time.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)
}

// ============================================================
// Recurrence Date Calculation
// ============================================================

/**
 * Calculate the next occurrence for a recurring task
 * This handles recurrence patterns with constraints like "weekend after 10th"
 *
 * @param recurrence The recurrence pattern
 * @param dateAnchor Optional date anchor for initial scheduling
 * @param fromDate Reference date (defaults to now)
 * @param skipCurrent If true, always move to the next occurrence (used when completing a task)
 */
export function resolveRecurrenceDate(
  recurrence: Recurrence,
  dateAnchor?: DateAnchor,
  fromDate: Date = new Date(),
  skipCurrent = false
): ResolvedDates | null {
  const { pattern, interval = 1, daysOfWeek, dayOfMonth, anchorDay, constraint } = recurrence

  switch (pattern) {
    case 'daily':
      return resolveDailyRecurrence(fromDate, interval)

    case 'weekly':
      return resolveWeeklyRecurrence(fromDate, interval, daysOfWeek)

    case 'monthly':
      return resolveMonthlyRecurrence(
        fromDate,
        interval,
        dayOfMonth,
        anchorDay,
        constraint,
        skipCurrent
      )

    case 'custom':
      // For custom patterns with anchorDay + constraint
      if (anchorDay !== undefined && constraint !== undefined) {
        return resolveMonthlyRecurrence(
          fromDate,
          interval,
          undefined,
          anchorDay,
          constraint,
          skipCurrent
        )
      }
      // Fall back to date anchor if provided
      if (dateAnchor !== undefined) {
        return resolveDateAnchor(dateAnchor, undefined, fromDate)
      }
      return null

    default:
      return null
  }
}

/**
 * Resolve daily recurrence
 */
function resolveDailyRecurrence(fromDate: Date, interval: number): ResolvedDates {
  const next = new Date(fromDate)
  next.setDate(next.getDate() + interval)
  next.setHours(0, 0, 0, 0)

  return {
    scheduledStart: next.toISOString(),
    scheduledEnd: null,
  }
}

/**
 * Resolve weekly recurrence
 */
function resolveWeeklyRecurrence(
  fromDate: Date,
  interval: number,
  daysOfWeek?: number[]
): ResolvedDates {
  const next = new Date(fromDate)
  next.setHours(0, 0, 0, 0)

  if (daysOfWeek !== undefined && daysOfWeek.length > 0) {
    // Find the next day that matches one of the specified days
    const currentIsoDay = getISODay(next)
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b)

    // Find the next matching day
    let targetDay = sortedDays.find((d) => d > currentIsoDay)
    let daysToAdd: number

    if (targetDay !== undefined) {
      // Found a day later this week
      daysToAdd = targetDay - currentIsoDay
    } else {
      // Move to next week (or interval weeks) and pick the first day
      targetDay = sortedDays[0]
      daysToAdd = 7 * interval - currentIsoDay + targetDay
    }

    next.setDate(next.getDate() + daysToAdd)
  } else {
    // No specific days, just add interval weeks
    next.setDate(next.getDate() + 7 * interval)
  }

  return {
    scheduledStart: next.toISOString(),
    scheduledEnd: null,
  }
}

/**
 * Resolve monthly recurrence
 */
function resolveMonthlyRecurrence(
  fromDate: Date,
  interval: number,
  dayOfMonth?: number,
  anchorDay?: number,
  constraint?: Recurrence['constraint'],
  skipCurrent = false
): ResolvedDates {
  // If we have a constraint (e.g., "next weekend after anchorDay")
  if (anchorDay !== undefined && constraint !== undefined) {
    return resolveConstrainedMonthlyRecurrence(
      fromDate,
      interval,
      anchorDay,
      constraint,
      skipCurrent
    )
  }

  // Simple day of month recurrence
  const next = new Date(fromDate)
  const currentDay = next.getDate()
  let targetMonth = next.getMonth()
  let targetYear = next.getFullYear()

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
    return {
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: null,
    }
  }

  // Default: same day next month
  next.setMonth(next.getMonth() + interval)
  next.setHours(0, 0, 0, 0)

  return {
    scheduledStart: next.toISOString(),
    scheduledEnd: null,
  }
}

/**
 * Resolve monthly recurrence with constraint (e.g., "weekend after 10th")
 * @param skipCurrent If true, always move to next occurrence (for creating next instance after completion)
 */
function resolveConstrainedMonthlyRecurrence(
  fromDate: Date,
  interval: number,
  anchorDay: number,
  constraint: NonNullable<Recurrence['constraint']>,
  skipCurrent = false
): ResolvedDates {
  const now = new Date(fromDate)
  let targetMonth = now.getMonth()
  let targetYear = now.getFullYear()

  // Start from anchorDay of current month
  let anchor = new Date(targetYear, targetMonth, anchorDay)

  // Find the constrained date from this anchor
  let result = applyConstraint(anchor, constraint)

  // Check if we need to move to next occurrence
  let shouldMoveToNext = skipCurrent // Always move if skipCurrent is true

  if (!shouldMoveToNext) {
    // Check if the window has passed (use end date if available, otherwise start)
    // For weekend tasks, we should stay in the current month if we're still within the weekend
    const windowEnd = result.end ?? result.start
    shouldMoveToNext = windowEnd < now
  }

  // If we should move to next occurrence
  if (shouldMoveToNext) {
    targetMonth += interval
    if (targetMonth > 11) {
      targetYear += Math.floor(targetMonth / 12)
      targetMonth = targetMonth % 12
    }
    anchor = new Date(targetYear, targetMonth, anchorDay)
    result = applyConstraint(anchor, constraint)
  }

  return {
    scheduledStart: result.start.toISOString(),
    scheduledEnd: result.end !== null ? result.end.toISOString() : null,
  }
}

/**
 * Apply a constraint to find the target date
 */
function applyConstraint(
  anchor: Date,
  constraint: NonNullable<Recurrence['constraint']>
): { start: Date; end: Date | null } {
  const result = new Date(anchor)

  switch (constraint) {
    case 'next-weekend': {
      // Find first Saturday on or after anchor
      const dayOfWeek = result.getDay() // 0=Sun, 6=Sat
      let daysUntilSaturday: number
      if (dayOfWeek === 6) {
        daysUntilSaturday = 0 // Already Saturday
      } else if (dayOfWeek === 0) {
        daysUntilSaturday = 6 // Sunday -> next Saturday
      } else {
        daysUntilSaturday = 6 - dayOfWeek
      }
      result.setDate(result.getDate() + daysUntilSaturday)
      result.setHours(0, 0, 0, 0)

      // Weekend ends on Sunday
      const endDate = new Date(result)
      endDate.setDate(endDate.getDate() + 1)
      endDate.setHours(23, 59, 59, 999)

      return { start: result, end: endDate }
    }

    case 'next-saturday': {
      const dayOfWeek = result.getDay()
      let daysUntilSaturday: number
      if (dayOfWeek === 6) {
        daysUntilSaturday = 0
      } else if (dayOfWeek === 0) {
        daysUntilSaturday = 6
      } else {
        daysUntilSaturday = 6 - dayOfWeek
      }
      result.setDate(result.getDate() + daysUntilSaturday)
      result.setHours(0, 0, 0, 0)
      return { start: result, end: null }
    }

    case 'next-sunday': {
      const dayOfWeek = result.getDay()
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
      result.setDate(result.getDate() + daysUntilSunday)
      result.setHours(0, 0, 0, 0)
      return { start: result, end: null }
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
      return { start: result, end: null }
    }

    case 'end-of-month': {
      // Start from anchor day, end at last day of month
      result.setHours(0, 0, 0, 0)
      // Get last day of current month
      const endDate = new Date(result.getFullYear(), result.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      return { start: result, end: endDate }
    }

    default:
      return { start: result, end: null }
  }
}

/**
 * Get ISO day of week (1=Monday, 7=Sunday)
 */
function getISODay(date: Date): number {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

// ============================================================
// Combined Resolution (for extracted tasks)
// ============================================================

/**
 * Resolve dates for an extracted task
 * Handles both one-time date anchors and recurring patterns
 *
 * @param dateAnchor Semantic start date from AI
 * @param dateAnchorEnd Semantic end date from AI (for ranges)
 * @param recurrence Recurrence pattern from AI
 * @param fromDate Reference date (defaults to now)
 */
export function resolveExtractedTaskDates(
  dateAnchor?: DateAnchor,
  dateAnchorEnd?: DateAnchor,
  recurrence?: Recurrence,
  fromDate: Date = new Date()
): ResolvedDates | null {
  // If there's a recurrence pattern, use recurrence resolution
  if (recurrence !== undefined) {
    return resolveRecurrenceDate(recurrence, dateAnchor, fromDate)
  }

  // Otherwise, resolve the date anchor directly
  if (dateAnchor !== undefined) {
    return resolveDateAnchor(dateAnchor, dateAnchorEnd, fromDate)
  }

  return null
}
