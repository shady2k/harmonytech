import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { SYNC_PROTOCOL_VERSION } from '@/types/sync'
import type { DeviceAwareness } from '@/types/sync'

// Singleton Y.Doc instance
let yDoc: Y.Doc | null = null
let webrtcProvider: WebrtcProvider | null = null

/**
 * Sync provider configuration
 */
export interface SyncProviderConfig {
  spaceId: string
  password: string
  signaling?: string[]
}

/**
 * localStorage keys for sync configuration
 */
const STORAGE_KEYS = {
  spaceId: 'harmonytech-space-id',
  password: 'harmonytech-space-password',
  deviceId: 'harmonytech-device-id',
  deviceName: 'harmonytech-device-name',
  // Legacy key for migration
  legacyRoomName: 'harmonytech-room-name',
}

/**
 * Default signaling servers for WebRTC peer discovery
 *
 * MVP Note: Uses public y-webrtc signaling servers.
 * These are community-maintained and may have rate limits, downtime, or no SLA.
 * Future improvement: Deploy self-hosted signaling server.
 * See: https://github.com/yjs/y-webrtc#signaling
 */
const DEFAULT_SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com',
]

// =============================================================================
// Device Identity
// =============================================================================

/**
 * Get unique device ID for this browser instance (generates if not exists)
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEYS.deviceId)

  if (deviceId === null) {
    deviceId = `device-${crypto.randomUUID()}`
    localStorage.setItem(STORAGE_KEYS.deviceId, deviceId)
  }

  return deviceId
}

/**
 * Get device name set by user
 */
export function getDeviceName(): string | null {
  return localStorage.getItem(STORAGE_KEYS.deviceName)
}

/**
 * Set device name
 */
export function setDeviceName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.deviceName, name)
}

/**
 * Check if device name is set
 */
export function hasDeviceName(): boolean {
  return getDeviceName() !== null
}

// =============================================================================
// Sync Space Configuration
// =============================================================================

/**
 * Generate a new space ID (full UUID)
 */
export function generateSpaceId(): string {
  return `harmonytech-${crypto.randomUUID()}`
}

/**
 * Generate a random password for space encryption
 */
export function generatePassword(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

/**
 * Get current space ID
 */
export function getSpaceId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.spaceId)
}

/**
 * Set space ID
 */
export function setSpaceId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.spaceId, id)
}

/**
 * Get current space password
 */
export function getPassword(): string | null {
  return localStorage.getItem(STORAGE_KEYS.password)
}

/**
 * Set space password
 */
export function setPassword(password: string): void {
  localStorage.setItem(STORAGE_KEYS.password, password)
}

/**
 * Check if sync space is configured
 */
export function hasSpaceConfig(): boolean {
  return getSpaceId() !== null && getPassword() !== null
}

/**
 * Clear sync space configuration (for leaving/creating new space)
 */
export function clearSpaceConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.spaceId)
  localStorage.removeItem(STORAGE_KEYS.password)
}

/**
 * Create a new sync space with generated credentials
 */
export function createSpace(): { spaceId: string; password: string } {
  const spaceId = generateSpaceId()
  const password = generatePassword()

  setSpaceId(spaceId)
  setPassword(password)

  return { spaceId, password }
}

/**
 * Join an existing space with provided credentials
 */
export function joinSpace(spaceId: string, password: string): void {
  setSpaceId(spaceId)
  setPassword(password)
}

// =============================================================================
// Y.Doc Management
// =============================================================================

/**
 * Get the Y.Doc instance (creates if not exists)
 */
export function getYDoc(): Y.Doc {
  yDoc ??= new Y.Doc()
  return yDoc
}

/**
 * Get shared Y.Map for tasks
 */
export function getTasksMap(): Y.Map<unknown> {
  return getYDoc().getMap('tasks')
}

/**
 * Get shared Y.Map for thoughts
 */
export function getThoughtsMap(): Y.Map<unknown> {
  return getYDoc().getMap('thoughts')
}

/**
 * Get shared Y.Map for projects
 */
export function getProjectsMap(): Y.Map<unknown> {
  return getYDoc().getMap('projects')
}

// =============================================================================
// WebRTC Provider Management
// =============================================================================

/**
 * Initialize WebRTC provider for P2P sync
 *
 * Requires space configuration (spaceId, password) and device name to be set.
 */
export function initSyncProvider(config?: Partial<SyncProviderConfig>): WebrtcProvider {
  if (webrtcProvider !== null) {
    return webrtcProvider
  }

  const spaceId = config?.spaceId ?? getSpaceId()
  const password = config?.password ?? getPassword()
  const deviceName = getDeviceName()

  if (spaceId === null || password === null) {
    throw new Error('Sync space not configured. Call createSpace() or joinSpace() first.')
  }

  if (deviceName === null) {
    throw new Error('Device name not set. Call setDeviceName() first.')
  }

  const doc = getYDoc()
  const signaling = config?.signaling ?? DEFAULT_SIGNALING_SERVERS

  webrtcProvider = new WebrtcProvider(spaceId, doc, {
    signaling,
    password,
    maxConns: 20,
    filterBcConns: true,
    peerOpts: {},
  })

  // Set awareness with device info for version checking and device list
  const deviceAwareness: DeviceAwareness = {
    deviceId: getDeviceId(),
    deviceName,
    protocolVersion: SYNC_PROTOCOL_VERSION,
  }
  webrtcProvider.awareness.setLocalStateField('device', deviceAwareness)

  return webrtcProvider
}

/**
 * Get the current WebRTC provider
 */
export function getSyncProvider(): WebrtcProvider | null {
  return webrtcProvider
}

/**
 * Check if sync is currently connected
 */
export function isSyncConnected(): boolean {
  return webrtcProvider?.connected ?? false
}

/**
 * Get the number of connected peers
 */
export function getConnectedPeersCount(): number {
  if (webrtcProvider === null) return 0
  const states = webrtcProvider.awareness.getStates()
  // Subtract 1 for our own client
  return Math.max(0, states.size - 1)
}

/**
 * Get awareness states for version checking and device list
 */
export function getAwarenessStates(): Map<number, { device?: DeviceAwareness }> {
  if (webrtcProvider === null) return new Map()
  return webrtcProvider.awareness.getStates() as Map<number, { device?: DeviceAwareness }>
}

/**
 * Disconnect and cleanup the sync provider
 */
export function disconnectSync(): void {
  if (webrtcProvider !== null) {
    webrtcProvider.disconnect()
    webrtcProvider.destroy()
    webrtcProvider = null
  }
}

/**
 * Destroy everything (for cleanup)
 */
export function destroySync(): void {
  disconnectSync()
  if (yDoc !== null) {
    yDoc.destroy()
    yDoc = null
  }
}

/**
 * Subscribe to sync status changes
 */
export function onSyncStatusChange(
  callback: (status: { connected: boolean; peers: number }) => void
): () => void {
  if (webrtcProvider === null) {
    return () => {
      /* noop */
    }
  }

  const handleStatus = (): void => {
    callback({
      connected: webrtcProvider?.connected ?? false,
      peers: getConnectedPeersCount(),
    })
  }

  // Listen to connection status changes
  webrtcProvider.on('status', handleStatus)

  // Listen to awareness changes (peer connect/disconnect)
  webrtcProvider.awareness.on('change', handleStatus)

  // Return cleanup function
  return () => {
    webrtcProvider?.off('status', handleStatus)
    webrtcProvider?.awareness.off('change', handleStatus)
  }
}

/**
 * Subscribe to awareness changes (for version checking and device list)
 */
export function onAwarenessChange(callback: () => void): () => void {
  if (webrtcProvider === null) {
    return () => {
      /* noop */
    }
  }

  webrtcProvider.awareness.on('change', callback)

  return () => {
    webrtcProvider?.awareness.off('change', callback)
  }
}

export type { Y }
export { SYNC_PROTOCOL_VERSION }
