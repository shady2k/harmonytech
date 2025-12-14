import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/dexie-database'
import type { Thought } from '@/types/thought'
import { thoughtSchema } from '@/types/thought'

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

const EMPTY_THOUGHTS: Thought[] = []

export function useThoughts(): UseThoughtsReturn {
  // Reactive query using Dexie liveQuery
  const allThoughts = useLiveQuery(() => db.thoughts.orderBy('createdAt').reverse().toArray(), [])

  const isLoading = allThoughts === undefined
  // Use stable reference for empty array to prevent dependency changes
  const thoughts = allThoughts ?? EMPTY_THOUGHTS

  const addThought = useCallback(
    async (thoughtData: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'>): Promise<Thought> => {
      const now = new Date().toISOString()
      const newThought: Thought = {
        ...thoughtData,
        id: generateId(),
        linkedTaskIds: thoughtData.linkedTaskIds,
        aiProcessed: thoughtData.aiProcessed,
        createdAt: now,
        updatedAt: now,
      }

      // Validate with Zod before inserting
      const validated = thoughtSchema.parse(newThought)
      await db.thoughts.add(validated)
      return validated
    },
    []
  )

  const updateThought = useCallback(
    async (id: string, updates: Partial<Thought>): Promise<void> => {
      const existing = await db.thoughts.get(id)
      if (!existing) {
        throw new Error(`Thought with id ${id} not found`)
      }

      await db.thoughts.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    },
    []
  )

  const deleteThought = useCallback(async (id: string): Promise<void> => {
    const existing = await db.thoughts.get(id)
    if (!existing) {
      throw new Error(`Thought with id ${id} not found`)
    }

    await db.thoughts.delete(id)
  }, [])

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
    isLoading,
    error: null,
    addThought,
    updateThought,
    deleteThought,
    searchThoughts,
    getThoughtById,
  }
}
