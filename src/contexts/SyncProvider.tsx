import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { createLogger } from '@/lib/logger'
import {
  getSyncProvider,
  isSyncConnected,
  isSecureContext,
  initSyncProvider,
  disconnectSync,
  destroySync,
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
  onSyncActivity,
  onSyncStatusChange,
  getSyncEnabledPreference,
  setSyncEnabledPreference,
} from '@/lib/sync'
import { useDatabase } from '@/hooks/useDatabase'
import { SyncContext } from '@/contexts/SyncContext'
import type { SyncState, SyncActions } from '@/types/sync'

const MAX_RECENT_EVENTS = 10
const log = createLogger('SyncContext')

interface SyncProviderProps {
  children: ReactNode
}

/**
 * SyncProvider - single global owner of sync lifecycle
 *
 * Handles:
 * - Auto-enable sync on mount if configured
 * - WebRTC provider initialization
 * - Sync bridge setup
 * - Event subscriptions
 * - State management
 */
export function SyncProvider({ children }: SyncProviderProps): ReactElement {
  const { db, isLoading: isDbLoading } = useDatabase()

  const [state, setState] = useState<SyncState>({
    isEnabled: false,
    isOnline: navigator.onLine,
    isSyncing: false,
    connectedDevices: [],
    deviceName: getDeviceNameFromStorage(),
    spaceId: getSpaceId(),
    versionMismatch: null,
    syncError: null,
    lastSyncTime: null,
    recentSyncEvents: [],
  })

  // Refs for cleanup functions
  const statusCleanupRef = useRef<(() => void) | null>(null)
  const awarenessCleanupRef = useRef<(() => void) | null>(null)
  const activityCleanupRef = useRef<(() => void) | null>(null)

  // Refresh status from provider
  const refreshStatus = useCallback((): void => {
    const provider = getSyncProvider()
    const awarenessStates = getAwarenessStates()
    const currentDeviceId = getDeviceId()

    setState((prev) => ({
      ...prev,
      isEnabled: provider !== null,
      isSyncing: isSyncConnected(),
      connectedDevices: getConnectedDevices(awarenessStates, currentDeviceId),
      isOnline: navigator.onLine,
      spaceId: getSpaceId(),
      deviceName: getDeviceNameFromStorage(),
    }))
  }, [])

  // Handle awareness changes (device list, version mismatch)
  const handleAwarenessChange = useCallback((): void => {
    const awarenessStates = getAwarenessStates()
    const currentDeviceId = getDeviceId()
    const versionMismatch = checkVersionMismatch(awarenessStates)
    const connectedDevices = getConnectedDevices(awarenessStates, currentDeviceId)

    setState((prev) => ({
      ...prev,
      connectedDevices,
      versionMismatch: versionMismatch ?? prev.versionMismatch,
    }))

    // Auto-disconnect if version mismatch detected
    if (versionMismatch !== null) {
      disconnectSync()
      setState((prev) => ({
        ...prev,
        isEnabled: false,
        isSyncing: false,
        syncError: `Update required. Peer "${versionMismatch.peerDeviceName}" is running version ${String(versionMismatch.peerVersion)}, you have version ${String(versionMismatch.localVersion)}.`,
      }))
    }
  }, [])

  // Cleanup all subscriptions
  const cleanupSubscriptions = useCallback((): void => {
    if (statusCleanupRef.current !== null) {
      statusCleanupRef.current()
      statusCleanupRef.current = null
    }
    if (awarenessCleanupRef.current !== null) {
      awarenessCleanupRef.current()
      awarenessCleanupRef.current = null
    }
    if (activityCleanupRef.current !== null) {
      activityCleanupRef.current()
      activityCleanupRef.current = null
    }
  }, [])

  // Enable sync
  const enableSync = useCallback((): void => {
    log.debug('enableSync called', { isDbLoading, hasDb: db !== null })

    if (isDbLoading || db === null) {
      log.warn('Database not ready')
      setState((prev) => ({
        ...prev,
        syncError: 'Database not ready',
      }))
      return
    }

    if (!hasDeviceName()) {
      log.warn('Device name not set')
      setState((prev) => ({
        ...prev,
        syncError: 'Device name not set',
      }))
      return
    }

    if (!hasSpaceConfig()) {
      log.warn('Sync space not configured')
      setState((prev) => ({
        ...prev,
        syncError: 'Sync space not configured',
      }))
      return
    }

    try {
      // Get or create provider
      const existingProvider = getSyncProvider()

      let provider: ReturnType<typeof initSyncProvider>
      if (existingProvider === null) {
        log.info('Initializing sync provider...')
        provider = initSyncProvider()
      } else {
        log.debug('Reusing existing provider, re-subscribing to events')
        // Clean up old subscriptions before re-subscribing
        cleanupSubscriptions()
        provider = existingProvider
      }

      // Initialize sync bridge
      if (!isSyncBridgeInitialized()) {
        initSyncBridge(db, { enabled: true })
      }

      // Subscribe to status changes
      statusCleanupRef.current = onSyncStatusChange(({ connected }) => {
        handleAwarenessChange()
        setState((prev) => ({
          ...prev,
          isSyncing: connected,
        }))
      })

      // Subscribe to awareness changes
      const handleAwareness = (): void => {
        handleAwarenessChange()
      }
      // Subscribe to awareness events (note: these don't fire reliably in y-webrtc,
      // so we also use polling below as a fallback)
      provider.awareness.on('change', handleAwareness)
      provider.awareness.on('update', handleAwareness)
      awarenessCleanupRef.current = (): void => {
        provider.awareness.off('change', handleAwareness)
        provider.awareness.off('update', handleAwareness)
      }

      // Subscribe to sync activity events
      activityCleanupRef.current = onSyncActivity((event) => {
        // Also refresh awareness when sync activity happens (peer must be connected)
        handleAwarenessChange()
        setState((prev) => ({
          ...prev,
          lastSyncTime: event.timestamp,
          recentSyncEvents: [event, ...prev.recentSyncEvents].slice(0, MAX_RECENT_EVENTS),
        }))
      })

      log.info('Sync provider initialized successfully')
      setSyncEnabledPreference(true)
      setState((prev) => ({
        ...prev,
        isEnabled: true,
        syncError: null,
        versionMismatch: null,
      }))

      refreshStatus()
    } catch (error) {
      log.error('Failed to enable sync:', error)
      setState((prev) => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Failed to enable sync',
      }))
    }
  }, [db, isDbLoading, refreshStatus, handleAwarenessChange, cleanupSubscriptions])

  // Disable sync
  const disableSync = useCallback((): void => {
    cleanupSubscriptions()
    cleanupSyncBridge()
    disconnectSync()
    setSyncEnabledPreference(false)

    setState((prev) => ({
      ...prev,
      isEnabled: false,
      isSyncing: false,
      connectedDevices: [],
    }))
  }, [cleanupSubscriptions])

  // Create new sync space
  const createSpace = useCallback((): { spaceId: string; password: string } => {
    // Disable current sync and destroy provider
    disableSync()
    destroySync()
    clearSpaceConfig()

    // Create new space
    const { spaceId, password } = createSpaceInStorage()

    setState((prev) => ({
      ...prev,
      spaceId,
      syncError: null,
    }))

    return { spaceId, password }
  }, [disableSync])

  // Join existing sync space
  const joinSpace = useCallback(
    (spaceId: string, password: string): void => {
      // Disable current sync and destroy provider
      disableSync()
      destroySync()
      clearSpaceConfig()

      // Store new space config
      joinSpaceInStorage(spaceId, password)

      setState((prev) => ({
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
    setState((prev) => ({
      ...prev,
      deviceName: name,
    }))
  }, [])

  // Dismiss version mismatch
  const dismissVersionMismatch = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      versionMismatch: null,
      syncError: null,
    }))
  }, [])

  // Auto-enable sync on mount if fully configured and user wants it enabled
  useEffect(() => {
    // Skip if sync is already initialized
    if (getSyncProvider() !== null) {
      refreshStatus()
      return
    }

    const hasName = hasDeviceName()
    const hasSpace = hasSpaceConfig()
    const secure = isSecureContext()
    const userWantsSyncEnabled = getSyncEnabledPreference()

    log.debug('Auto-enable check:', {
      isDbLoading,
      hasDb: db !== null,
      hasName,
      hasSpace,
      secure,
      userWantsSyncEnabled,
    })

    if (!isDbLoading && db !== null && hasName && hasSpace && secure && userWantsSyncEnabled) {
      log.info('Auto-enabling sync on mount')
      enableSync()
    } else if (!secure && hasName && hasSpace && userWantsSyncEnabled) {
      log.warn('Skipping auto-enable: not in secure context (use localhost or HTTPS)')
      setState((prev) => ({
        ...prev,
        syncError: 'P2P sync requires HTTPS or localhost access',
      }))
    }
  }, [isDbLoading, db, enableSync, refreshStatus])

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = (): void => {
      setState((prev) => ({ ...prev, isOnline: true }))
    }

    const handleOffline = (): void => {
      setState((prev) => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return (): void => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Poll awareness states periodically
  // (y-webrtc awareness events don't fire reliably for remote peer connections)
  useEffect(() => {
    if (!state.isEnabled) return

    const interval = setInterval(() => {
      const awarenessStates = getAwarenessStates()
      const currentDeviceId = getDeviceId()
      const connectedDevices = getConnectedDevices(awarenessStates, currentDeviceId)

      setState((prev) => {
        // Only update if devices changed
        if (prev.connectedDevices.length !== connectedDevices.length) {
          const hasPeers = connectedDevices.length > 1
          return { ...prev, connectedDevices, isSyncing: hasPeers || prev.isSyncing }
        }
        return prev
      })
    }, 2000)

    return (): void => {
      clearInterval(interval)
    }
  }, [state.isEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      cleanupSubscriptions()
    }
  }, [cleanupSubscriptions])

  const actions: SyncActions = {
    enableSync,
    disableSync,
    createSpace,
    joinSpace,
    setDeviceName,
    refreshStatus,
    dismissVersionMismatch,
  }

  return <SyncContext.Provider value={{ state, actions }}>{children}</SyncContext.Provider>
}
