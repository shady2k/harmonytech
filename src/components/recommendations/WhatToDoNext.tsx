import { type ReactElement, useCallback, useState } from 'react'
import { useRecommendations, type RecommendationContext } from '@/hooks/useRecommendations'
import { useUIStore } from '@/stores/ui.store'
import { ContextInput } from './ContextInput'
import { RecommendationCard } from './RecommendationCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface WhatToDoNextProps {
  className?: string
}

type ViewState = 'input' | 'loading' | 'results' | 'error'

export function WhatToDoNext({ className = '' }: WhatToDoNextProps): ReactElement {
  const { recommendations, alternativeActions, isLoading, error, getRecommendations, clearError } =
    useRecommendations()
  const { selectTask, setActiveView } = useUIStore()

  const [viewState, setViewState] = useState<ViewState>('input')
  const [showAll, setShowAll] = useState(false)
  const [lastContext, setLastContext] = useState<RecommendationContext | null>(null)

  const handleGetRecommendations = useCallback(
    async (context: RecommendationContext): Promise<void> => {
      setLastContext(context)
      setViewState('loading')
      try {
        await getRecommendations(context)
        setViewState('results')
      } catch {
        setViewState('error')
      }
    },
    [getRecommendations]
  )

  const handleRefresh = useCallback(async (): Promise<void> => {
    if (lastContext === null) return
    setViewState('loading')
    try {
      await getRecommendations(lastContext)
      setViewState('results')
    } catch {
      setViewState('error')
    }
  }, [lastContext, getRecommendations])

  const handleStartTask = useCallback(
    (taskId: string): void => {
      // Select the task and navigate to tasks view
      selectTask(taskId)
      setActiveView('tasks')
    },
    [selectTask, setActiveView]
  )

  const handleViewDetails = useCallback(
    (taskId: string): void => {
      selectTask(taskId)
      setActiveView('tasks')
    },
    [selectTask, setActiveView]
  )

  const handleReset = useCallback((): void => {
    setViewState('input')
    setShowAll(false)
    clearError()
  }, [clearError])

  // Input state
  if (viewState === 'input') {
    return (
      <Card className={className}>
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
              <svg
                className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              What should I do next?
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Tell me about your current situation and I&apos;ll suggest the best task
            </p>
          </div>

          <ContextInput
            onSubmit={(context): void => {
              void handleGetRecommendations(context)
            }}
            isLoading={isLoading}
          />
        </div>
      </Card>
    )
  }

  // Loading state
  if (viewState === 'loading' || isLoading) {
    return (
      <Card className={className}>
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Analyzing your tasks and context...
          </p>
        </div>
      </Card>
    )
  }

  // Error state
  if (viewState === 'error' || error !== null) {
    return (
      <Card className={className}>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Couldn&apos;t get recommendations
            </h3>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error ?? 'An unexpected error occurred'}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={handleReset}>
              Change Context
            </Button>
            <Button
              onClick={(): void => {
                void handleRefresh()
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Results state
  const displayedRecommendations = showAll ? recommendations : recommendations.slice(0, 1)
  const hasMoreRecommendations = recommendations.length > 1

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {recommendations.length > 0 ? 'Recommended Tasks' : 'No Matching Tasks'}
        </h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Change Context
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(): void => {
              void handleRefresh()
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 ? (
        <>
          <div className="space-y-3">
            {displayedRecommendations.map((rec, index) => {
              if (rec.task === null) return null
              return (
                <RecommendationCard
                  key={rec.taskId}
                  task={rec.task}
                  reasoning={rec.reasoning}
                  matchScore={rec.matchScore}
                  rank={index + 1}
                  onStart={handleStartTask}
                  onViewDetails={handleViewDetails}
                />
              )
            })}
          </div>

          {/* Show more/less button */}
          {hasMoreRecommendations && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={(): void => {
                setShowAll(!showAll)
              }}
            >
              {showAll
                ? 'Show less'
                : `Show ${String(recommendations.length - 1)} more option${recommendations.length - 1 === 1 ? '' : 's'}`}
            </Button>
          )}
        </>
      ) : (
        <Card>
          <div className="py-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">No tasks match your current context.</p>
            {alternativeActions.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alternative suggestions:
                </p>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {alternativeActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Alternative actions (when there are recommendations but also alternatives) */}
      {recommendations.length > 0 && alternativeActions.length > 0 && (
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Other suggestions:
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {alternativeActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1 text-indigo-500">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}
