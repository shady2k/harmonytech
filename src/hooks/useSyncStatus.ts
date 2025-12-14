import { useState, useEffect, useCallback } from 'react'
import { createLogger } from '@/lib/logger'
import {
  getSyncProvider,
  isSyncConnected,
  isSecureContext,
  initSyncProvider,
  disconnectSync,
  getSpaceId,
  getDeviceId,
  getDeviceName as getDeviceNameFromStorage,
  setDeviceName as setDeviceNameInStorage,
  hasDeviceName,
  hasSpaceConfig,
  createSpace as createSpaceInStorage,
  joinSpace as joinSpaceInStorage,
  clearSpaceConfig,
  getAwarenessStates,
  initSyncBridge,
  cleanupSyncBridge,
  isSyncBridgeInitialized,
  checkVersionMismatch,
  getConnectedDevices,
} from '@/lib/sync'
import { useDatabase } from './useDatabase'
import type { ConnectedDevice, VersionMismatch, SyncStatus } from '@/types/sync'

interface UseSyncStatusReturn extends SyncStatus {
  enableSync: () => void
  disableSync: () => void
  createSpace: () => { spaceId: string; password: string }
  joinSpace: (spaceId: string, password: string) => void
  setDeviceName: (name: string) => void
  refreshStatus: () => void
  dismissVersionMismatch: () => void
}

const log = createLogger('SyncStatus')

export function useSyncStatus(): UseSyncStatusReturn {
  const { db, isLoading: isDbLoading } = useDatabase()

  const [status, setStatus] = useState<SyncStatus>({
    isEnabled: false,
    isOnline: navigator.onLine,
    isSyncing: false,
    connectedDevices: [],
    deviceName: getDeviceNameFromStorage(),
    spaceId: getSpaceId(),
    versionMismatch: null,
    syncError: null,
  })

  // Refresh status from provider
  const refreshStatus = useCallback((): void => {
    const provider = getSyncProvider()
    const awarenessStates = getAwarenessStates()
    const currentDeviceId = getDeviceId()

    setStatus((prev) => ({
      ...prev,
      isEnabled: provider !== null,
      isSyncing: isSyncConnected(),
      connectedDevices: getConnectedDevices(awarenessStates, currentDeviceId),
      isOnline: navigator.onLine,
      spaceId: getSpaceId(),
      deviceName: getDeviceNameFromStorage(),
    }))
  }, [])

  // Check version mismatch and update device list
  const handleAwarenessChange = useCallback((): void => {
    const awarenessStates = getAwarenessStates()
    const currentDeviceId = getDeviceId()
    const versionMismatch = checkVersionMismatch(awarenessStates)
    const connectedDevices = getConnectedDevices(awarenessStates, currentDeviceId)

    setStatus((prev) => ({
      ...prev,
      connectedDevices,
      versionMismatch: versionMismatch ?? prev.versionMismatch,
    }))

    // Auto-disconnect if version mismatch detected
    if (versionMismatch !== null) {
      disconnectSync()
      setStatus((prev) => ({
        ...prev,
        isEnabled: false,
        isSyncing: false,
        syncError: `Update required. Peer "${versionMismatch.peerDeviceName}" is running version ${String(versionMismatch.peerVersion)}, you have version ${String(versionMismatch.localVersion)}.`,
      }))
    }
  }, [])

  // Enable sync
  const enableSync = useCallback((): void => {
    log.debug('enableSync called', { isDbLoading, hasDb: db !== null })

    if (isDbLoading || db === null) {
      log.warn('Database not ready')
      setStatus((prev) => ({
        ...prev,
        syncError: 'Database not ready',
      }))
      return
    }

    if (!hasDeviceName()) {
      log.warn('Device name not set')
      setStatus((prev) => ({
        ...prev,
        syncError: 'Device name not set',
      }))
      return
    }

    if (!hasSpaceConfig()) {
      log.warn('Sync space not configured')
      setStatus((prev) => ({
        ...prev,
        syncError: 'Sync space not configured',
      }))
      return
    }

    try {
      log.info('Initializing sync provider...')
      // Initialize provider
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
        }))
      }

      provider.on('status', handleStatus)
      provider.awareness.on('change', handleAwarenessChange)

      log.info('Sync provider initialized successfully')
      setStatus((prev) => ({
        ...prev,
        isEnabled: true,
        syncError: null,
        versionMismatch: null,
      }))

      refreshStatus()
    } catch (error) {
      log.error('Failed to enable sync:', error)
      setStatus((prev) => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Failed to enable sync',
      }))
    }
  }, [db, isDbLoading, refreshStatus, handleAwarenessChange])

  // Disable sync
  const disableSync = useCallback((): void => {
    cleanupSyncBridge()
    disconnectSync()

    setStatus((prev) => ({
      ...prev,
      isEnabled: false,
      isSyncing: false,
      connectedDevices: [],
    }))
  }, [])

  // Create new sync space
  const createSpace = useCallback((): { spaceId: string; password: string } => {
    // Disable current sync if active
    disableSync()
    clearSpaceConfig()

    // Create new space
    const { spaceId, password } = createSpaceInStorage()

    setStatus((prev) => ({
      ...prev,
      spaceId,
      syncError: null,
    }))

    return { spaceId, password }
  }, [disableSync])

  // Join existing sync space
  const joinSpace = useCallback(
    (spaceId: string, password: string): void => {
      // Disable current sync if active
      disableSync()
      clearSpaceConfig()

      // Store new space config
      joinSpaceInStorage(spaceId, password)

      setStatus((prev) => ({
        ...prev,
        spaceId,
        syncError: null,
      }))
    },
    [disableSync]
  )

  // Set device name
  const setDeviceName = useCallback((name: string): void => {
    setDeviceNameInStorage(name)
    setStatus((prev) => ({
      ...prev,
      deviceName: name,
    }))
  }, [])

  // Dismiss version mismatch (continue offline)
  const dismissVersionMismatch = useCallback((): void => {
    setStatus((prev) => ({
      ...prev,
      versionMismatch: null,
      syncError: null,
    }))
  }, [])

  // Auto-enable sync on mount if fully configured
  useEffect(() => {
    const hasName = hasDeviceName()
    const hasSpace = hasSpaceConfig()
    const secure = isSecureContext()
    log.debug('Auto-enable check:', {
      isDbLoading,
      hasDb: db !== null,
      hasName,
      hasSpace,
      secure,
    })
    if (!isDbLoading && db !== null && hasName && hasSpace && secure) {
      log.info('Auto-enabling sync on mount')
      enableSync()
    } else if (!secure && hasName && hasSpace) {
      log.warn('Skipping auto-enable: not in secure context (use localhost or HTTPS)')
      setStatus((prev) => ({
        ...prev,
        syncError: 'P2P sync requires HTTPS or localhost access',
      }))
    }
  }, [isDbLoading, db, enableSync])

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

  return {
    ...status,
    enableSync,
    disableSync,
    createSpace,
    joinSpace,
    setDeviceName,
    refreshStatus,
    dismissVersionMismatch,
  }
}

// Re-export types for convenience
export type { SyncStatus, ConnectedDevice, VersionMismatch }
