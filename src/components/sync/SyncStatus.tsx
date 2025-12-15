import { useState, useEffect, type ReactElement } from 'react'
import { useSyncState } from '@/hooks/useSync'

interface SyncStatusProps {
  className?: string
  showLabel?: boolean
}

type StatusType = 'off' | 'ready' | 'connected'

function getStatusInfo(
  isEnabled: boolean,
  connectedPeers: number
): { status: StatusType; label: string } {
  if (!isEnabled) {
    return { status: 'off', label: 'Off' }
  }

  if (connectedPeers > 0) {
    return {
      status: 'connected',
      label: `${String(connectedPeers)} peer${connectedPeers === 1 ? '' : 's'}`,
    }
  }

  return { status: 'ready', label: 'Ready' }
}

export function SyncStatus({ className = '', showLabel = true }: SyncStatusProps): ReactElement {
  const { isEnabled, connectedDevices, lastSyncTime, recentSyncEvents } = useSyncState()
  const connectedPeers = connectedDevices.length > 0 ? connectedDevices.length - 1 : 0 // Exclude self
  const { status, label } = getStatusInfo(isEnabled, connectedPeers)

  // Update relative time every 10 seconds
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 10000)
    return (): void => {
      clearInterval(interval)
    }
  }, [])

  // Count recent incoming events (last 30 seconds)
  const recentIncomingCount = recentSyncEvents.filter((e) => {
    const age = now - e.timestamp.getTime()
    return e.type === 'incoming' && age < 30000
  }).length

  // Check for recent sync activity (last 5 seconds) for pulse animation
  const hasRecentActivity = recentSyncEvents.some((e) => {
    const age = now - e.timestamp.getTime()
    return age < 5000
  })

  const dotColor = status === 'off' ? 'bg-gray-400' : 'bg-green-500'
  const textColor =
    status === 'off' ? 'text-gray-400 dark:text-gray-500' : 'text-green-500 dark:text-green-400'

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Status indicator dot */}
      <div className="relative">
        <span className={`block h-2 w-2 rounded-full ${dotColor}`} />
        {/* Pulse animation for recent sync activity */}
        {hasRecentActivity && status !== 'off' && (
          <span className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-green-500 opacity-75" />
        )}
      </div>

      {/* Label */}
      {showLabel && <span className={`text-xs font-medium ${textColor}`}>{label}</span>}

      {/* Sync activity indicator */}
      {showLabel && status !== 'off' && lastSyncTime !== null && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {recentIncomingCount > 0
            ? `${String(recentIncomingCount)} received`
            : formatRelativeTime(lastSyncTime, now)}
        </span>
      )}

      {/* Peers icon when connected */}
      {status === 'connected' && (
        <svg
          className={`h-3.5 w-3.5 ${textColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      )}
    </div>
  )
}

function formatRelativeTime(date: Date, now: number): string {
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${String(diffSec)}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${String(diffMin)}m ago`
  const diffHour = Math.floor(diffMin / 60)
  return `${String(diffHour)}h ago`
}
