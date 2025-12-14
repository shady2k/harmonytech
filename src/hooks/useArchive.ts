import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/dexie-database'
import type { Task } from '@/types/task'

export interface ArchiveStats {
  completedToday: number
  completedThisWeek: number
  completedThisMonth: number
  totalCompleted: number
  currentStreak: number
  mostProductiveContext: string | null
  averageCompletionTime: number | null
}

interface UseArchiveReturn {
  archivedTasks: Task[]
  stats: ArchiveStats
  isLoading: boolean
  error: Error | null
  searchArchive: (query: string) => Task[]
  restoreTask: (id: string) => Promise<void>
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  return date >= startOfWeek && date < endOfWeek
}

function isThisMonth(date: Date): boolean {
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function calculateStreak(completedTasks: Task[]): number {
  if (completedTasks.length === 0) return 0

  // Filter tasks with completedAt and sort by completion date descending
  const tasksWithCompletedAt = completedTasks.filter(
    (t): t is Task & { completedAt: string } => t.completedAt !== undefined
  )

  if (tasksWithCompletedAt.length === 0) return 0

  const sorted = [...tasksWithCompletedAt].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Check if there's a task completed today or yesterday
  const mostRecent = new Date(sorted[0].completedAt)
  mostRecent.setHours(0, 0, 0, 0)

  if (mostRecent < yesterday) {
    return 0 // Streak broken
  }

  // Count consecutive days
  let streak = 0
  let currentDate = mostRecent

  const tasksByDate = new Map<string, boolean>()
  for (const task of sorted) {
    const dateStr = new Date(task.completedAt).toDateString()
    tasksByDate.set(dateStr, true)
  }

  let hasMoreDays = true
  while (hasMoreDays) {
    const dateStr = currentDate.toDateString()
    if (tasksByDate.has(dateStr)) {
      streak++
      currentDate = new Date(currentDate)
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      hasMoreDays = false
    }
  }

  return streak
}

function calculateMostProductiveContext(tasks: Task[]): string | null {
  if (tasks.length === 0) return null

  const contextCounts = new Map<string, number>()

  for (const task of tasks) {
    const count = contextCounts.get(task.context) ?? 0
    contextCounts.set(task.context, count + 1)
  }

  let maxCount = 0
  let mostProductiveContext: string | null = null

  for (const [context, count] of contextCounts) {
    if (count > maxCount) {
      maxCount = count
      mostProductiveContext = context
    }
  }

  return mostProductiveContext
}

function calculateAverageCompletionTime(tasks: Task[]): number | null {
  const tasksWithTime = tasks.filter(
    (t): t is Task & { completedAt: string } => t.completedAt !== undefined
  )

  if (tasksWithTime.length === 0) return null

  const totalTime = tasksWithTime.reduce((sum, task) => {
    const created = new Date(task.createdAt).getTime()
    const completed = new Date(task.completedAt).getTime()
    return sum + (completed - created)
  }, 0)

  // Return average in hours
  return totalTime / tasksWithTime.length / (1000 * 60 * 60)
}

const EMPTY_TASKS: Task[] = []

export function useArchive(): UseArchiveReturn {
  // Reactive query for completed tasks
  const archivedTasks = useLiveQuery(
    () => db.tasks.where('isCompleted').equals(1).reverse().sortBy('completedAt'),
    []
  )

  const isLoading = archivedTasks === undefined
  // Use stable reference for empty array to prevent dependency changes
  const tasks = archivedTasks ?? EMPTY_TASKS

  // Calculate stats
  const stats = useMemo((): ArchiveStats => {
    const completedToday = tasks.filter(
      (t) => t.completedAt !== undefined && isToday(new Date(t.completedAt))
    ).length

    const completedThisWeek = tasks.filter(
      (t) => t.completedAt !== undefined && isThisWeek(new Date(t.completedAt))
    ).length

    const completedThisMonth = tasks.filter(
      (t) => t.completedAt !== undefined && isThisMonth(new Date(t.completedAt))
    ).length

    return {
      completedToday,
      completedThisWeek,
      completedThisMonth,
      totalCompleted: tasks.length,
      currentStreak: calculateStreak(tasks),
      mostProductiveContext: calculateMostProductiveContext(tasks),
      averageCompletionTime: calculateAverageCompletionTime(tasks),
    }
  }, [tasks])

  const searchArchive = useCallback(
    (query: string): Task[] => {
      if (query.trim() === '') {
        return tasks
      }

      const lowerQuery = query.toLowerCase()
      return tasks.filter((task) => {
        if (task.nextAction.toLowerCase().includes(lowerQuery)) return true
        if (task.rawInput.toLowerCase().includes(lowerQuery)) return true
        if (task.project?.toLowerCase().includes(lowerQuery) === true) return true
        return false
      })
    },
    [tasks]
  )

  const restoreTask = useCallback(async (id: string): Promise<void> => {
    const existing = await db.tasks.get(id)
    if (!existing) {
      throw new Error(`Task with id ${id} not found`)
    }

    await db.tasks.update(id, {
      isCompleted: false,
      completedAt: undefined,
      updatedAt: new Date().toISOString(),
    })
  }, [])

  return {
    archivedTasks: tasks,
    stats,
    isLoading,
    error: null,
    searchArchive,
    restoreTask,
  }
}
