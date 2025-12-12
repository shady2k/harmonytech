import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import type { Task, AISuggestions, Recurrence } from '@/types/task'
import type { RxDocument } from 'rxdb'

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

function documentToTask(doc: RxDocument<Task>): Task {
  const data = doc.toJSON()

  const aiSuggestions: AISuggestions | undefined = data.aiSuggestions
    ? {
        suggestedContext: data.aiSuggestions.suggestedContext,
        suggestedEnergy: data.aiSuggestions.suggestedEnergy,
        suggestedTimeEstimate: data.aiSuggestions.suggestedTimeEstimate,
        suggestedProject: data.aiSuggestions.suggestedProject,
        confidence: data.aiSuggestions.confidence,
        alternatives: data.aiSuggestions.alternatives
          ? {
              context: data.aiSuggestions.alternatives.context
                ? [...data.aiSuggestions.alternatives.context]
                : undefined,
              energy: data.aiSuggestions.alternatives.energy
                ? [...data.aiSuggestions.alternatives.energy]
                : undefined,
              timeEstimate: data.aiSuggestions.alternatives.timeEstimate
                ? [...data.aiSuggestions.alternatives.timeEstimate]
                : undefined,
            }
          : undefined,
      }
    : undefined

  const recurrence: Recurrence | undefined = data.recurrence
    ? {
        pattern: data.recurrence.pattern,
        interval: data.recurrence.interval,
        daysOfWeek: data.recurrence.daysOfWeek ? [...data.recurrence.daysOfWeek] : undefined,
        dayOfMonth: data.recurrence.dayOfMonth,
        endDate: data.recurrence.endDate,
      }
    : undefined

  return {
    id: data.id,
    rawInput: data.rawInput,
    nextAction: data.nextAction,
    context: data.context,
    energy: data.energy,
    timeEstimate: data.timeEstimate,
    deadline: data.deadline,
    project: data.project,
    isSomedayMaybe: data.isSomedayMaybe,
    isCompleted: data.isCompleted,
    completedAt: data.completedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    aiSuggestions,
    recurrence,
  }
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

export function useArchive(): UseArchiveReturn {
  const { db, isLoading: isDbLoading } = useDatabaseContext()
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isFirstRender = useRef(true)

  // Subscribe to completed tasks
  useEffect(() => {
    if (db === null || isDbLoading) {
      return
    }

    if (isFirstRender.current) {
      isFirstRender.current = false
    }

    const subscription = db.tasks
      .find({
        selector: {
          isCompleted: true,
        },
      })
      .sort({ completedAt: 'desc' })
      .$.subscribe({
        next: (docs) => {
          const tasks = docs.map((doc) => documentToTask(doc))
          setArchivedTasks(tasks)
          setIsLoading(false)
          setError(null)
        },
        error: (err: Error) => {
          setError(err)
          setIsLoading(false)
        },
      })

    return (): void => {
      subscription.unsubscribe()
    }
  }, [db, isDbLoading])

  // Calculate stats
  const stats = useMemo((): ArchiveStats => {
    const completedToday = archivedTasks.filter(
      (t) => t.completedAt !== undefined && isToday(new Date(t.completedAt))
    ).length

    const completedThisWeek = archivedTasks.filter(
      (t) => t.completedAt !== undefined && isThisWeek(new Date(t.completedAt))
    ).length

    const completedThisMonth = archivedTasks.filter(
      (t) => t.completedAt !== undefined && isThisMonth(new Date(t.completedAt))
    ).length

    return {
      completedToday,
      completedThisWeek,
      completedThisMonth,
      totalCompleted: archivedTasks.length,
      currentStreak: calculateStreak(archivedTasks),
      mostProductiveContext: calculateMostProductiveContext(archivedTasks),
      averageCompletionTime: calculateAverageCompletionTime(archivedTasks),
    }
  }, [archivedTasks])

  const searchArchive = useCallback(
    (query: string): Task[] => {
      if (query.trim() === '') {
        return archivedTasks
      }

      const lowerQuery = query.toLowerCase()
      return archivedTasks.filter((task) => {
        if (task.nextAction.toLowerCase().includes(lowerQuery)) return true
        if (task.rawInput.toLowerCase().includes(lowerQuery)) return true
        if (task.project?.toLowerCase().includes(lowerQuery) === true) return true
        return false
      })
    },
    [archivedTasks]
  )

  const restoreTask = useCallback(
    async (id: string): Promise<void> => {
      if (db === null) {
        throw new Error('Database not initialized')
      }

      const doc = await db.tasks.findOne(id).exec()
      if (doc === null) {
        throw new Error(`Task with id ${id} not found`)
      }

      await doc.patch({
        isCompleted: false,
        completedAt: undefined,
        updatedAt: new Date().toISOString(),
      })
    },
    [db]
  )

  return {
    archivedTasks,
    stats,
    isLoading: isLoading || isDbLoading,
    error,
    searchArchive,
    restoreTask,
  }
}
