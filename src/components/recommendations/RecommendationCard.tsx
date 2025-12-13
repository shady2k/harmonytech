import type { ReactElement } from 'react'
import type { Task } from '@/types/task'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ContextBadge } from '@/components/ui/ContextBadge'
import { EnergyIndicator } from '@/components/ui/EnergyIndicator'

interface RecommendationCardProps {
  task: Task
  reasoning: string
  matchScore: number
  rank: number
  onStart: (taskId: string) => void
  onViewDetails: (taskId: string) => void
  className?: string
}

function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${String(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${String(hours)}h`
  }
  return `${String(hours)}h ${String(remainingMinutes)}m`
}

function getMatchScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600 dark:text-green-400'
  if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-gray-600 dark:text-gray-400'
}

function getMatchScoreLabel(score: number): string {
  if (score >= 0.8) return 'Excellent match'
  if (score >= 0.6) return 'Good match'
  return 'Fair match'
}

export function RecommendationCard({
  task,
  reasoning,
  matchScore,
  rank,
  onStart,
  onViewDetails,
  className = '',
}: RecommendationCardProps): ReactElement {
  return (
    <Card
      className={`${rank === 1 ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-900/20' : ''} ${className}`}
    >
      <div className="space-y-3">
        {/* Header with rank */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                rank === 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {String(rank)}
            </span>
            <span className={`text-xs font-medium ${getMatchScoreColor(matchScore)}`}>
              {getMatchScoreLabel(matchScore)}
            </span>
          </div>

          {/* Match score indicator */}
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full ${
                  matchScore >= 0.8
                    ? 'bg-green-500'
                    : matchScore >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-gray-400'
                }`}
                style={{ width: `${String(matchScore * 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {String(Math.round(matchScore * 100))}%
            </span>
          </div>
        </div>

        {/* Task content */}
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{task.nextAction}</p>

          {/* Task metadata */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ContextBadge context={task.context} size="sm" showLabel={false} />
            <EnergyIndicator energy={task.energy} variant="icon" size="sm" />
            {task.timeEstimate > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatTimeEstimate(task.timeEstimate)}
              </span>
            )}
            {task.project !== undefined && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span>📁</span>
                {task.project}
              </span>
            )}
          </div>
        </div>

        {/* AI reasoning */}
        <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-900/30">
          <div className="mb-1 flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
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
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Why this task?
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{reasoning}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={(): void => {
              onStart(task.id)
            }}
          >
            Start Task
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(): void => {
              onViewDetails(task.id)
            }}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  )
}
