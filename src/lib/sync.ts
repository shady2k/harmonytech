import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

// Singleton Y.Doc instance
let yDoc: Y.Doc | null = null
let webrtcProvider: WebrtcProvider | null = null

export interface SyncConfig {
  roomName: string
  password?: string
  signaling?: string[]
}

const DEFAULT_SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com',
]

/**
 * Generate a unique device ID for this browser instance
 */
export function getDeviceId(): string {
  const storageKey = 'harmonytech-device-id'
  let deviceId = localStorage.getItem(storageKey)

  if (deviceId === null) {
    deviceId = `device-${crypto.randomUUID()}`
    localStorage.setItem(storageKey, deviceId)
  }

  return deviceId
}

/**
 * Generate a room name from user ID or create a new one
 */
export function getRoomName(): string {
  const storageKey = 'harmonytech-room-name'
  let roomName = localStorage.getItem(storageKey)

  if (roomName === null) {
    roomName = `harmonytech-${crypto.randomUUID().slice(0, 8)}`
    localStorage.setItem(storageKey, roomName)
  }

  return roomName
}

/**
 * Set a custom room name (for joining another user's room)
 */
export function setRoomName(roomName: string): void {
  localStorage.setItem('harmonytech-room-name', roomName)
}

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

/**
 * Initialize WebRTC provider for P2P sync
 */
export function initSyncProvider(config?: Partial<SyncConfig>): WebrtcProvider {
  if (webrtcProvider !== null) {
    return webrtcProvider
  }

  const doc = getYDoc()
  const roomName = config?.roomName ?? getRoomName()
  const signaling = config?.signaling ?? DEFAULT_SIGNALING_SERVERS

  webrtcProvider = new WebrtcProvider(roomName, doc, {
    signaling,
    password: config?.password,
    maxConns: 20,
    filterBcConns: true,
    peerOpts: {},
  })

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
  // WebrtcProvider stores peers in awareness
  const states = webrtcProvider.awareness.getStates()
  // Subtract 1 for our own client
  return Math.max(0, states.size - 1)
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

export type { Y }
