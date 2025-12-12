import { useCallback, useEffect, useRef, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import { useUIStore, type TaskFilters } from '@/stores/ui.store'
import type { Task, AISuggestions, Recurrence } from '@/types/task'
import type { RxDocument } from 'rxdb'
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

function documentToTask(doc: RxDocument<Task>): Task {
  const data = doc.toJSON()

  // Deep clone to convert DeepReadonly types to mutable types
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
  const { db, isLoading: isDbLoading } = useDatabaseContext()
  const filters = useUIStore((state) => state.filters)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isFirstRender = useRef(true)

  // Subscribe to tasks collection
  useEffect(() => {
    if (db === null || isDbLoading) {
      return
    }

    // Only set loading on first render to avoid cascading renders
    if (isFirstRender.current) {
      isFirstRender.current = false
    }

    const subscription = db.tasks
      .find()
      .sort({ createdAt: 'desc' })
      .$.subscribe({
        next: (docs) => {
          const allTasks = docs.map((doc) => documentToTask(doc))
          const filteredTasks = applyFilters(allTasks, filters)
          setTasks(filteredTasks)
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
  }, [db, isDbLoading, filters])

  const addTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
      if (db === null) {
        throw new Error('Database not initialized')
      }

      const now = new Date().toISOString()
      const newTask: Task = {
        ...taskData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      }

      await db.tasks.insert(newTask)
      return newTask
    },
    [db]
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>): Promise<void> => {
      if (db === null) {
        throw new Error('Database not initialized')
      }

      const doc = await db.tasks.findOne(id).exec()
      if (doc === null) {
        throw new Error(`Task with id ${id} not found`)
      }

      await doc.patch({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    },
    [db]
  )

  const completeTask = useCallback(
    async (id: string): Promise<void> => {
      if (db === null) {
        throw new Error('Database not initialized')
      }

      const doc = await db.tasks.findOne(id).exec()
      if (doc === null) {
        throw new Error(`Task with id ${id} not found`)
      }

      const now = new Date().toISOString()

      // Mark current task as completed
      await doc.patch({
        isCompleted: true,
        completedAt: now,
        updatedAt: now,
      })

      // If task is recurring, create next instance
      const task = documentToTask(doc)
      if (task.recurrence !== undefined) {
        const nextTask = createNextInstance({ ...task, completedAt: now })
        if (nextTask !== null) {
          await db.tasks.insert(nextTask)
        }
      }
    },
    [db]
  )

  const uncompleteTask = useCallback(
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

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      if (db === null) {
        throw new Error('Database not initialized')
      }

      const doc = await db.tasks.findOne(id).exec()
      if (doc === null) {
        throw new Error(`Task with id ${id} not found`)
      }

      await doc.remove()
    },
    [db]
  )

  const getTaskById = useCallback(
    (id: string): Task | undefined => {
      return tasks.find((task) => task.id === id)
    },
    [tasks]
  )

  return {
    tasks,
    isLoading: isLoading || isDbLoading,
    error,
    addTask,
    updateTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    getTaskById,
  }
}
