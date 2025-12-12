import { type ReactElement, useState, useCallback } from 'react'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface SyncSettingsProps {
  className?: string
}

export function SyncSettings({ className = '' }: SyncSettingsProps): ReactElement {
  const {
    isEnabled,
    isOnline,
    isSyncing,
    connectedPeers,
    syncError,
    roomName,
    deviceId,
    enableSync,
    disableSync,
    setRoom,
  } = useSyncStatus()

  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [joinRoomCode, setJoinRoomCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleToggleSync = useCallback((): void => {
    if (isEnabled) {
      disableSync()
    } else {
      enableSync()
    }
  }, [isEnabled, enableSync, disableSync])

  const handleCopyRoomCode = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(roomName)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      // Clipboard API not available - silently fail
    }
  }, [roomName])

  const handleJoinRoom = useCallback((): void => {
    if (joinRoomCode.trim() !== '') {
      setRoom(joinRoomCode.trim())
      setShowJoinRoom(false)
      setJoinRoomCode('')
    }
  }, [joinRoomCode, setRoom])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sync Toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">P2P Sync</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sync your data across devices using peer-to-peer connection
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleSync}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={isEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {isEnabled && (
        <>
          {/* Status */}
          <Card>
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Connection</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      !isOnline
                        ? 'bg-yellow-500'
                        : isSyncing
                          ? 'bg-green-500'
                          : 'bg-blue-500 animate-pulse'
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {!isOnline ? 'Offline' : isSyncing ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Connected Peers</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {String(connectedPeers)}
                </span>
              </div>

              {syncError !== null && (
                <div className="mt-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{syncError}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Room/Device Info */}
          <Card>
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Device Info</h4>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  Room Code
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {roomName}
                  </code>
                  <Button variant="ghost" size="sm" onClick={(): void => void handleCopyRoomCode()}>
                    {copied ? (
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Share this code with other devices to sync
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                  Device ID
                </label>
                <code className="block truncate rounded bg-gray-100 px-3 py-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {deviceId}
                </code>
              </div>
            </div>
          </Card>

          {/* Connect New Device */}
          <Card>
            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              Connect New Device
            </h4>

            {!showJoinRoom ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  To connect another device, either:
                </p>
                <ul className="ml-4 list-disc space-y-1 text-sm text-gray-500 dark:text-gray-400">
                  <li>Share your room code above with the other device</li>
                  <li>Or enter a room code from another device below</li>
                </ul>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={(): void => {
                    setShowJoinRoom(true)
                  }}
                >
                  Join Another Room
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Room Code"
                  value={joinRoomCode}
                  onChange={(e): void => {
                    setJoinRoomCode(e.target.value)
                  }}
                  placeholder="Enter room code..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(): void => {
                      setShowJoinRoom(false)
                      setJoinRoomCode('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleJoinRoom} disabled={joinRoomCode.trim() === ''}>
                    Join Room
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
