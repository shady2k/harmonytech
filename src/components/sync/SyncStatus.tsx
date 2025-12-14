import type { ReactElement } from 'react'
import { useSyncStatus } from '@/hooks/useSyncStatus'

interface SyncStatusProps {
  className?: string
  showLabel?: boolean
}

type StatusType = 'synced' | 'syncing' | 'offline' | 'disabled'

function getStatusInfo(
  isEnabled: boolean,
  isOnline: boolean,
  isSyncing: boolean,
  connectedPeers: number
): { status: StatusType; label: string; color: string } {
  if (!isEnabled) {
    return {
      status: 'disabled',
      label: 'Sync off',
      color: 'text-gray-400 dark:text-gray-500',
    }
  }

  if (!isOnline) {
    return {
      status: 'offline',
      label: 'Offline',
      color: 'text-yellow-500 dark:text-yellow-400',
    }
  }

  if (isSyncing && connectedPeers > 0) {
    return {
      status: 'synced',
      label: `${String(connectedPeers)} peer${connectedPeers === 1 ? '' : 's'}`,
      color: 'text-green-500 dark:text-green-400',
    }
  }

  if (isSyncing) {
    return {
      status: 'syncing',
      label: 'Syncing...',
      color: 'text-blue-500 dark:text-blue-400',
    }
  }

  return {
    status: 'offline',
    label: 'Connecting...',
    color: 'text-yellow-500 dark:text-yellow-400',
  }
}

export function SyncStatus({ className = '', showLabel = true }: SyncStatusProps): ReactElement {
  const { isEnabled, isOnline, isSyncing, connectedDevices } = useSyncStatus()
  const connectedPeers = connectedDevices.length > 0 ? connectedDevices.length - 1 : 0 // Exclude self
  const { status, label, color } = getStatusInfo(isEnabled, isOnline, isSyncing, connectedPeers)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Status indicator dot */}
      <div className="relative">
        <span
          className={`block h-2 w-2 rounded-full ${
            status === 'synced'
              ? 'bg-green-500'
              : status === 'syncing'
                ? 'bg-blue-500'
                : status === 'offline'
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
          }`}
        />
        {/* Pulse animation for syncing */}
        {status === 'syncing' && (
          <span className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-blue-500 opacity-75" />
        )}
      </div>

      {/* Label */}
      {showLabel && <span className={`text-xs font-medium ${color}`}>{label}</span>}

      {/* Icon based on status */}
      {status === 'synced' && connectedPeers > 0 && (
        <svg
          className={`h-3.5 w-3.5 ${color}`}
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

      {status === 'offline' && isEnabled && (
        <svg
          className={`h-3.5 w-3.5 ${color}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
      )}
    </div>
  )
}
