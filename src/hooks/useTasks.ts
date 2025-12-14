import { useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/dexie-database'
import { useUIStore, type TaskFilters } from '@/stores/ui.store'
import type { Task } from '@/types/task'
import { taskSchema } from '@/types/schemas/task.schema'
import { createNextInstance } from '@/services/recurrence'

interface UseTasksReturn {
  tasks: Task[]
  isLoading: boolean
  error: Error | null
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  completeTask: (id: string) => Promise<void>
  uncompleteTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTaskById: (id: string) => Task | undefined
}

function generateId(): string {
  return `task-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`
}

function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter((task) => {
    // Filter by completion status
    if (!filters.showCompleted && task.isCompleted) {
      return false
    }

    // Filter by context
    if (filters.context !== null && task.context !== filters.context) {
      return false
    }

    // Filter by energy
    if (filters.energy !== null && task.energy !== filters.energy) {
      return false
    }

    // Filter by project
    if (filters.project !== null && task.project !== filters.project) {
      return false
    }

    return true
  })
}

export function useTasks(): UseTasksReturn {
  const filters = useUIStore((state) => state.filters)

  // Reactive query using Dexie liveQuery
  const allTasks = useLiveQuery(() => db.tasks.orderBy('createdAt').reverse().toArray(), [])

  const isLoading = allTasks === undefined

  const tasks = useMemo(() => {
    if (!allTasks) return []
    return applyFilters(allTasks, filters)
  }, [allTasks, filters])

  const addTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
      const now = new Date().toISOString()
      const newTask: Task = {
        ...taskData,
        sourceThoughtId: taskData.sourceThoughtId ?? '',
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      }

      // Validate with Zod before inserting
      const validated = taskSchema.parse(newTask)
      await db.tasks.add(validated)
      return validated
    },
    []
  )

  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<void> => {
    const existing = await db.tasks.get(id)
    if (!existing) {
      throw new Error(`Task with id ${id} not found`)
    }

    await db.tasks.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const completeTask = useCallback(async (id: string): Promise<void> => {
    const task = await db.tasks.get(id)
    if (!task) {
      throw new Error(`Task with id ${id} not found`)
    }

    const now = new Date().toISOString()

    // Mark current task as completed
    await db.tasks.update(id, {
      isCompleted: true,
      completedAt: now,
      updatedAt: now,
    })

    // If task is recurring, create next instance
    if (task.recurrence !== undefined) {
      const nextTask = createNextInstance({ ...task, completedAt: now })
      if (nextTask !== null) {
        await db.tasks.add(nextTask)
      }
    }
  }, [])

  const uncompleteTask = useCallback(async (id: string): Promise<void> => {
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

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const existing = await db.tasks.get(id)
    if (!existing) {
      throw new Error(`Task with id ${id} not found`)
    }

    await db.tasks.delete(id)
  }, [])

  const getTaskById = useCallback(
    (id: string): Task | undefined => {
      return allTasks?.find((task) => task.id === id)
    },
    [allTasks]
  )

  return {
    tasks,
    isLoading,
    error: null,
    addTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    getTaskById,
  }
}
