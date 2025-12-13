import { useCallback, useEffect, useRef, useState } from 'react'
import { useDatabaseContext } from '@/contexts/DatabaseContext'
import type { Thought } from '@/types/thought'
import type { RxDocument } from 'rxdb'

interface UseThoughtsReturn {
  thoughts: Thought[]
  isLoading: boolean
  error: Error | null
  addThought: (thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Thought>
  updateThought: (id: string, updates: Partial<Thought>) => Promise<void>
  deleteThought: (id: string) => Promise<void>
  searchThoughts: (query: string) => Thought[]
  getThoughtById: (id: string) => Thought | undefined
}

function generateId(): string {
  return `thought-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`
}

function documentToThought(doc: RxDocument<Thought>): Thought {
  const data = doc.toJSON()

  // Safely extract tags with proper typing
  const tags: string[] = Array.isArray(data.tags)
    ? data.tags.filter((tag): tag is string => typeof tag === 'string')
    : []

  // Safely extract linkedTaskIds with proper typing
  const linkedTaskIds: string[] = Array.isArray(data.linkedTaskIds)
    ? data.linkedTaskIds.filter((id): id is string => typeof id === 'string')
    : []

  return {
    id: data.id,
    content: data.content,
    tags,
    linkedProject: data.linkedProject,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    sourceRecordingId: data.sourceRecordingId,
    linkedTaskIds,
    aiProcessed: data.aiProcessed,
    processingStatus: data.processingStatus,
  }
}

export function useThoughts(): UseThoughtsReturn {
  const { db, isLoading: isDbLoading } = useDatabaseContext()
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isFirstRender = useRef(true)

  // Subscribe to thoughts collection
  useEffect(() => {
    if (db === null || isDbLoading) {
      return
    }

    // Only set loading on first render to avoid cascading renders
    if (isFirstRender.current) {
      isFirstRender.current = false
    }

    const subscription = db.thoughts
      .find()
      .sort({ createdAt: 'desc' })
      .$.subscribe({
        next: (docs) => {
          const allThoughts = docs.map((doc) => documentToThought(doc))
          setThoughts(allThoughts)
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

  const addThought = useCallback(
    async (thoughtData: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>): Promise<Thought> => {
      if (db === null) {
        throw new Error('Database not initialized')
      }

      const now = new Date().toISOString()
      const newThought: Thought = {
        ...thoughtData,
        id: generateId(),
        linkedTaskIds: thoughtData.linkedTaskIds,
        aiProcessed: thoughtData.aiProcessed,
        createdAt: now,
        updatedAt: now,
      }

      await db.thoughts.insert(newThought)
      return newThought
    },
    [db]
  )

  const updateThought = useCallback(
    async (id: string, updates: Partial<Thought>): Promise<void> => {
      if (db === null) {
        throw new Error('Database not initialized')
      }

      const doc = await db.thoughts.findOne(id).exec()
      if (doc === null) {
        throw new Error(`Thought with id ${id} not found`)
      }

      await doc.patch({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    },
    [db]
  )

  const deleteThought = useCallback(
    async (id: string): Promise<void> => {
      if (db === null) {
        throw new Error('Database not initialized')
      }

      const doc = await db.thoughts.findOne(id).exec()
      if (doc === null) {
        throw new Error(`Thought with id ${id} not found`)
      }

      await doc.remove()
    },
    [db]
  )

  const searchThoughts = useCallback(
    (query: string): Thought[] => {
      if (query.trim() === '') {
        return thoughts
      }

      const lowerQuery = query.toLowerCase()
      return thoughts.filter((thought) => {
        // Search in content
        if (thought.content.toLowerCase().includes(lowerQuery)) {
          return true
        }

        // Search in tags
        if (thought.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
          return true
        }

        // Search in linked project
        if (thought.linkedProject?.toLowerCase().includes(lowerQuery) === true) {
          return true
        }

        return false
      })
    },
    [thoughts]
  )

  const getThoughtById = useCallback(
    (id: string): Thought | undefined => {
      return thoughts.find((thought) => thought.id === id)
    },
    [thoughts]
  )

  return {
    thoughts,
    isLoading: isLoading || isDbLoading,
    error,
    addThought,
    updateThought,
    deleteThought,
    searchThoughts,
    getThoughtById,
  }
}
