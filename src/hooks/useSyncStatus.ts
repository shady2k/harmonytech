import { useState, useEffect, useCallback } from 'react'
import {
  getSyncProvider,
  isSyncConnected,
  getConnectedPeersCount,
  initSyncProvider,
  disconnectSync,
  getRoomName,
  setRoomName,
  getDeviceId,
} from '@/lib/sync'
import { initSyncBridge, cleanupSyncBridge, isSyncBridgeInitialized } from '@/lib/rxdb-yjs-sync'
import { useDatabase } from './useDatabase'

export interface SyncStatus {
  isEnabled: boolean
  isOnline: boolean
  isSyncing: boolean
  connectedPeers: number
  lastSyncTime: Date | null
  syncError: string | null
  roomName: string
  deviceId: string
}

interface UseSyncStatusReturn extends SyncStatus {
  enableSync: () => void
  disableSync: () => void
  setRoom: (roomName: string) => void
  refreshStatus: () => void
}

export function useSyncStatus(): UseSyncStatusReturn {
  const { db, isLoading: isDbLoading } = useDatabase()

  const [status, setStatus] = useState<SyncStatus>({
    isEnabled: false,
    isOnline: navigator.onLine,
    isSyncing: false,
    connectedPeers: 0,
    lastSyncTime: null,
    syncError: null,
    roomName: getRoomName(),
    deviceId: getDeviceId(),
  })

  // Refresh status from provider
  const refreshStatus = useCallback((): void => {
    const provider = getSyncProvider()
    setStatus((prev) => ({
      ...prev,
      isEnabled: provider !== null,
      isSyncing: isSyncConnected(),
      connectedPeers: getConnectedPeersCount(),
      isOnline: navigator.onLine,
      roomName: getRoomName(),
    }))
  }, [])

  // Enable sync
  const enableSync = useCallback((): void => {
    if (isDbLoading || db === null) {
      setStatus((prev) => ({
        ...prev,
        syncError: 'Database not ready',
      }))
      return
    }

    try {
      // Initialize provider if not already done
      const provider = initSyncProvider()

      // Initialize sync bridge
      if (!isSyncBridgeInitialized()) {
        initSyncBridge(db, { enabled: true })
      }

      // Setup status listeners
      const handleStatus = (event: { connected: boolean }): void => {
        setStatus((prev) => ({
          ...prev,
          isSyncing: event.connected,
          lastSyncTime: event.connected ? new Date() : prev.lastSyncTime,
        }))
      }

      const handlePeersChange = (): void => {
        setStatus((prev) => ({
          ...prev,
          connectedPeers: getConnectedPeersCount(),
        }))
      }

      provider.on('status', handleStatus)
      provider.awareness.on('change', handlePeersChange)

      setStatus((prev) => ({
        ...prev,
        isEnabled: true,
        syncError: null,
      }))

      refreshStatus()
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Failed to enable sync',
      }))
    }
  }, [db, isDbLoading, refreshStatus])

  // Disable sync
  const disableSync = useCallback((): void => {
    cleanupSyncBridge()
    disconnectSync()

    setStatus((prev) => ({
      ...prev,
      isEnabled: false,
      isSyncing: false,
      connectedPeers: 0,
    }))
  }, [])

  // Set room name
  const setRoom = useCallback(
    (newRoomName: string): void => {
      // Disable current sync
      disableSync()

      // Update room name
      setRoomName(newRoomName)

      setStatus((prev) => ({
        ...prev,
        roomName: newRoomName,
      }))

      // Re-enable sync with new room
      enableSync()
    },
    [disableSync, enableSync]
  )

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = (): void => {
      setStatus((prev) => ({ ...prev, isOnline: true }))
    }

    const handleOffline = (): void => {
      setStatus((prev) => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return (): void => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      // Don't cleanup sync on unmount - it should persist
    }
  }, [])

  return {
    ...status,
    enableSync,
    disableSync,
    setRoom,
    refreshStatus,
  }
}
