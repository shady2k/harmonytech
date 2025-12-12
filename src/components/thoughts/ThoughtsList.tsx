import { type ReactElement, useCallback, useMemo, useState } from 'react'
import type { Thought } from '@/types/thought'
import { useThoughts } from '@/hooks/useThoughts'
import { ThoughtCard } from './ThoughtCard'
import { ThoughtDetail } from './ThoughtDetail'
import { ConvertToTaskFlow } from './ConvertToTaskFlow'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Input } from '@/components/ui/Input'
import { useUIStore } from '@/stores/ui.store'

interface ThoughtsListProps {
  className?: string
}

export function ThoughtsList({ className = '' }: ThoughtsListProps): ReactElement {
  const { thoughts, isLoading, error, updateThought, deleteThought, searchThoughts } = useThoughts()
  const { openCapture } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedThoughtId, setSelectedThoughtId] = useState<string | null>(null)
  const [convertingThought, setConvertingThought] = useState<Thought | null>(null)

  const filteredThoughts = useMemo(() => {
    return searchThoughts(searchQuery)
  }, [searchThoughts, searchQuery])

  const selectedThought = useMemo(() => {
    if (selectedThoughtId === null) return null
    return thoughts.find((t) => t.id === selectedThoughtId) ?? null
  }, [thoughts, selectedThoughtId])

  const handleThoughtClick = useCallback((id: string): void => {
    setSelectedThoughtId(id)
  }, [])

  const handleConvertToTask = useCallback(
    (id: string): void => {
      const thought = thoughts.find((t) => t.id === id)
      if (thought !== undefined) {
        setConvertingThought(thought)
        setSelectedThoughtId(null)
      }
    },
    [thoughts]
  )

  const handleConvertFromDetail = useCallback((thought: Thought): void => {
    setConvertingThought(thought)
    setSelectedThoughtId(null)
  }, [])

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Thought>): Promise<void> => {
      await updateThought(id, updates)
    },
    [updateThought]
  )

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      await deleteThought(id)
    },
    [deleteThought]
  )

  const handleConversionComplete = useCallback(
    async (_taskId: string, shouldDeleteThought: boolean): Promise<void> => {
      if (shouldDeleteThought && convertingThought !== null) {
        await deleteThought(convertingThought.id)
      }
      setConvertingThought(null)
    },
    [convertingThought, deleteThought]
  )

  const handleConversionCancel = useCallback((): void => {
    setConvertingThought(null)
  }, [])

  const clearSelection = useCallback((): void => {
    setSelectedThoughtId(null)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" label="Loading thoughts..." />
      </div>
    )
  }

  if (error !== null) {
    return (
      <EmptyState
        icon="empty-thoughts"
        title="Unable to load thoughts"
        description={error.message}
        actionLabel="Try again"
        onAction={(): void => {
          window.location.reload()
        }}
      />
    )
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Main thoughts list */}
      <div className="flex-1 overflow-hidden">
        {/* Search bar */}
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e): void => {
                setSearchQuery(e.target.value)
              }}
              placeholder="Search thoughts..."
              className="pl-10"
            />
          </div>
          {searchQuery !== '' && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filteredThoughts.length} result{filteredThoughts.length !== 1 ? 's' : ''} for &quot;
              {searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Thoughts list content */}
        <div className="h-full overflow-y-auto">
          {thoughts.length === 0 ? (
            <EmptyState
              icon="empty-thoughts"
              title="No thoughts yet"
              description="Capture your first thought to get started. Use voice or text to quickly jot down ideas."
              actionLabel="Add thought"
              onAction={openCapture}
            />
          ) : filteredThoughts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">No thoughts match your search</p>
              <button
                type="button"
                onClick={(): void => {
                  setSearchQuery('')
                }}
                className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {filteredThoughts.map((thought) => (
                <ThoughtCard
                  key={thought.id}
                  thought={thought}
                  onClick={handleThoughtClick}
                  onConvertToTask={handleConvertToTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thought detail panel */}
      {selectedThought !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:static md:w-96 md:bg-transparent md:p-0">
          <div className="h-full max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900 md:max-h-full md:max-w-none md:rounded-none md:border-l md:border-gray-200 md:shadow-none md:dark:border-gray-700">
            <ThoughtDetail
              thought={selectedThought}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onClose={clearSelection}
              onConvertToTask={handleConvertFromDetail}
            />
          </div>
        </div>
      )}

      {/* Convert to task modal */}
      {convertingThought !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <ConvertToTaskFlow
              thought={convertingThought}
              onComplete={(taskId, deleteThought): void => {
                void handleConversionComplete(taskId, deleteThought)
              }}
              onCancel={handleConversionCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}
