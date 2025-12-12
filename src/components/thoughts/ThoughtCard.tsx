import type { ReactElement } from 'react'
import type { Thought } from '@/types/thought'
import { Card } from '@/components/ui/Card'

interface ThoughtCardProps {
  thought: Thought
  onClick: (id: string) => void
  onConvertToTask?: (id: string) => void
  className?: string
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  if (diffDays <= 7) {
    return `${String(diffDays)} days ago`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ThoughtCard({
  thought,
  onClick,
  onConvertToTask,
  className = '',
}: ThoughtCardProps): ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(thought.id)
    }
  }

  const handleConvertClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onConvertToTask?.(thought.id)
  }

  return (
    <Card
      padding="none"
      className={`cursor-pointer transition-all hover:shadow-md ${className}`}
      onClick={(): void => {
        onClick(thought.id)
      }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="p-4">
        {/* Content */}
        <p className="line-clamp-3 text-sm text-gray-900 dark:text-white">{thought.content}</p>

        {/* Tags and metadata row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Tags */}
          {thought.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {thought.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                >
                  #{tag}
                </span>
              ))}
              {thought.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{String(thought.tags.length - 3)} more
                </span>
              )}
            </div>
          )}

          {/* Linked project */}
          {thought.linkedProject !== undefined && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span>📁</span>
              {thought.linkedProject}
            </span>
          )}

          {/* Voice indicator */}
          {thought.sourceRecordingId !== undefined && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              Voice
            </span>
          )}

          {/* Date */}
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {formatDate(thought.createdAt)}
          </span>
        </div>

        {/* Convert to task action */}
        {onConvertToTask !== undefined && (
          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            <button
              type="button"
              onClick={handleConvertClick}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              Convert to task
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
