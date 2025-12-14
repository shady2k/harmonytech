import { type ReactElement } from 'react'
import { formatDeviceName } from '@/lib/sync'
import type { ConnectedDevice } from '@/types/sync'

interface ConnectedDevicesProps {
  devices: ConnectedDevice[]
  className?: string
}

/**
 * Display list of connected devices in sync space
 */
export function ConnectedDevices({ devices, className = '' }: ConnectedDevicesProps): ReactElement {
  if (devices.length === 0) {
    return (
      <div className={className}>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Connected Devices</h4>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No other devices connected yet
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
        Connected Devices ({devices.length})
      </h4>
      <ul className="space-y-2">
        {devices.map((device) => (
          <li
            key={device.deviceId}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2">
              {/* Device icon */}
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {formatDeviceName(device)}
              </span>
            </div>
            {/* Connection indicator */}
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </li>
        ))}
      </ul>
    </div>
  )
}
