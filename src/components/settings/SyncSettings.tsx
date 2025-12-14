import { type ReactElement, useState, useCallback } from 'react'
import { createLogger } from '@/lib/logger'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { useInviteLink } from '@/hooks/useInviteLink'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  DeviceNameSetup,
  InviteDisplay,
  JoinSpace,
  ConnectedDevices,
  VersionMismatchAlert,
} from '@/components/sync'
import { getPassword } from '@/lib/sync'

interface SyncSettingsProps {
  className?: string
}

type SyncView = 'main' | 'join'

export function SyncSettings({ className = '' }: SyncSettingsProps): ReactElement {
  const {
    isEnabled,
    isOnline,
    isSyncing,
    connectedDevices,
    deviceName,
    spaceId,
    versionMismatch,
    syncError,
    enableSync,
    disableSync,
    createSpace,
    joinSpace,
    setDeviceName,
    dismissVersionMismatch,
  } = useSyncStatus()

  const { pendingInvite, clearPendingInvite } = useInviteLink()
  const [view, setView] = useState<SyncView>('main')
  const [password, setPassword] = useState<string | null>(null)
  // Track if user wants sync enabled (for showing setup steps)
  const [wantsSyncEnabled, setWantsSyncEnabled] = useState(false)

  // Handle device name setup completion
  const handleDeviceNameComplete = useCallback(
    (name: string): void => {
      setDeviceName(name)
    },
    [setDeviceName]
  )

  // Handle creating new space
  const handleCreateSpace = useCallback((): void => {
    const { password: newPassword } = createSpace()
    setPassword(newPassword)
    try {
      enableSync()
      // Only hide setup if sync actually enabled
      if (spaceId !== null) {
        setWantsSyncEnabled(false)
      }
    } catch (err) {
      createLogger('SyncSettings').error('Failed to enable sync:', err)
    }
  }, [createSpace, enableSync, spaceId])

  // Handle joining existing space
  const handleJoinSpace = useCallback(
    (newSpaceId: string, newPassword: string): void => {
      joinSpace(newSpaceId, newPassword)
      setPassword(newPassword)
      setView('main')
      clearPendingInvite()
      enableSync()
      setWantsSyncEnabled(false)
    },
    [joinSpace, enableSync, clearPendingInvite]
  )

  // Handle pending invite from URL
  const handleAcceptInvite = useCallback((): void => {
    if (pendingInvite !== null) {
      handleJoinSpace(pendingInvite.spaceId, pendingInvite.password)
    }
  }, [pendingInvite, handleJoinSpace])

  // Handle toggle sync
  const handleToggleSync = useCallback((): void => {
    if (isEnabled) {
      disableSync()
      setWantsSyncEnabled(false)
    } else if (wantsSyncEnabled) {
      // User is in setup flow but wants to cancel
      setWantsSyncEnabled(false)
    } else {
      // If already configured, just enable
      if (deviceName !== null && spaceId !== null) {
        enableSync()
      } else {
        // Show setup flow
        setWantsSyncEnabled(true)
      }
    }
  }, [isEnabled, wantsSyncEnabled, enableSync, disableSync, deviceName, spaceId])

  // Get current password for invite display
  const currentPassword = password ?? getPassword()

  // Determine if we should show setup (user wants sync but not configured)
  const showSetup = wantsSyncEnabled && !isEnabled

  // ========== RENDER ==========

  return (
    <Card className={className}>
      {/* Header with icon, title, and toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sync</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sync your data across devices
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleSync}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isEnabled || wantsSyncEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          role="switch"
          aria-checked={isEnabled || wantsSyncEnabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled || wantsSyncEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Version mismatch alert */}
      {versionMismatch !== null && (
        <div className="mt-6">
          <VersionMismatchAlert mismatch={versionMismatch} onDismiss={dismissVersionMismatch} />
        </div>
      )}

      {/* Pending invite prompt */}
      {pendingInvite !== null && (
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Join Sync Space</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You&apos;ve been invited to join a sync space
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAcceptInvite}>Join Space</Button>
            <Button variant="ghost" onClick={clearPendingInvite}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Setup flow - shown when user wants sync but needs configuration */}
      {showSetup && (
        <div className="mt-6 space-y-6">
          {/* Step 1: Device name setup */}
          {deviceName === null && <DeviceNameSetup onComplete={handleDeviceNameComplete} />}

          {/* Step 2: Create or join space (only after device name is set) */}
          {deviceName !== null && spaceId === null && view === 'main' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Set Up Sync Space
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Create a new space or join an existing one
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <div className="flex items-center gap-2">
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Device: {deviceName}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={handleCreateSpace} className="w-full">
                  Create New Sync Space
                </Button>
                <Button
                  variant="secondary"
                  onClick={(): void => {
                    setView('join')
                  }}
                  className="w-full"
                >
                  Join Existing Space
                </Button>
              </div>
            </div>
          )}

          {/* Join space view */}
          {deviceName !== null && view === 'join' && (
            <JoinSpace
              onJoin={handleJoinSpace}
              onCancel={(): void => {
                setView('main')
              }}
            />
          )}
        </div>
      )}

      {/* Active sync status - shown when sync is enabled */}
      {isEnabled && (
        <div className="mt-6 space-y-6">
          {/* Status */}
          <div>
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Device</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {deviceName}
                </span>
              </div>

              {syncError !== null && (
                <div className="mt-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{syncError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Invite Display */}
          {spaceId !== null && currentPassword !== null && (
            <InviteDisplay spaceId={spaceId} password={currentPassword} />
          )}

          {/* Connected Devices */}
          <ConnectedDevices devices={connectedDevices} />

          {/* Create New Space (to kick devices) */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Manage Space</h4>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Create a new space to remove unwanted devices. You&apos;ll need to re-invite devices
              you want to keep.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateSpace}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Create New Space
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
