import type { ReactElement } from 'react'
import { useArchive } from '@/hooks/useArchive'
import { Card } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ArchiveStatsProps {
  className?: string
}

const CONTEXT_LABELS: Record<string, string> = {
  computer: '💻 Computer',
  phone: '📱 Phone',
  errands: '🛒 Errands',
  home: '🏠 Home',
  anywhere: '🌍 Anywhere',
}

function formatAverageTime(hours: number | null): string {
  if (hours === null) return 'N/A'

  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${String(minutes)}m`
  }

  if (hours < 24) {
    return `${hours.toFixed(1)}h`
  }

  const days = hours / 24
  if (days < 7) {
    return `${days.toFixed(1)}d`
  }

  const weeks = days / 7
  return `${weeks.toFixed(1)}w`
}

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactElement
  color?: string
}

function StatCard({ label, value, icon, color = 'indigo' }: StatCardProps): ReactElement {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  }

  return (
    <Card padding="sm" className="flex items-center gap-3">
      <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </Card>
  )
}

export function ArchiveStats({ className = '' }: ArchiveStatsProps): ReactElement {
  const { stats, isLoading } = useArchive()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" label="Loading stats..." />
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Today"
          value={stats.completedToday}
          color="green"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          }
        />

        <StatCard
          label="This Week"
          value={stats.completedThisWeek}
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />

        <StatCard
          label="This Month"
          value={stats.completedThisMonth}
          color="purple"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />

        <StatCard
          label="Total"
          value={stats.totalCompleted}
          color="indigo"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
        />

        <StatCard
          label="Day Streak"
          value={stats.currentStreak}
          color="orange"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
          }
        />

        <StatCard
          label="Avg Time"
          value={formatAverageTime(stats.averageCompletionTime)}
          color="pink"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Most productive context */}
      {stats.mostProductiveContext !== null && (
        <Card padding="sm" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Most productive in:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {CONTEXT_LABELS[stats.mostProductiveContext] ?? stats.mostProductiveContext}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span>Top context</span>
          </div>
        </Card>
      )}
    </div>
  )
}
