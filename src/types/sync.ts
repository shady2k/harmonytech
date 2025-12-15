/**
 * Sync Types - P2P sync system type definitions
 */

/**
 * Current sync protocol version.
 * Increment when breaking changes occur that require all peers to update.
 */
export const SYNC_PROTOCOL_VERSION = 1

/**
 * Sync space configuration stored in localStorage
 */
export interface SyncConfig {
  spaceId: string // Full UUID
  password: string // Random string for encryption
  deviceName: string
}

/**
 * Device information from awareness (deduplicated by deviceId)
 */
export interface ConnectedDevice {
  deviceId: string
  deviceName: string
  protocolVersion: number
  isCurrentDevice: boolean
  tabCount: number // For multi-tab deduplication
}

/**
 * Version mismatch information when peer has higher version
 */
export interface VersionMismatch {
  detected: boolean
  localVersion: number
  peerVersion: number
  peerDeviceName: string
}

/**
 * Device awareness state broadcast via y-webrtc
 */
export interface DeviceAwareness {
  deviceId: string
  deviceName: string
  protocolVersion: number
}

/**
 * Sync status returned by useSyncStatus hook
 */
export interface SyncStatus {
  isEnabled: boolean
  isOnline: boolean
  isSyncing: boolean
  connectedDevices: ConnectedDevice[]
  deviceName: string | null
  spaceId: string | null
  versionMismatch: VersionMismatch | null
  syncError: string | null
}

/**
 * Decoded invite containing space credentials
 */
export interface DecodedInvite {
  spaceId: string
  password: string
}

/**
 * Sync activity event for tracking what synced
 */
export interface SyncActivityEvent {
  type: 'incoming' | 'outgoing'
  table: 'tasks' | 'thoughts' | 'projects' | 'settings'
  action: 'add' | 'update' | 'delete'
  itemId: string
  timestamp: Date
}

/**
 * Summary of recent sync activity
 */
export interface SyncActivity {
  lastSyncTime: Date | null
  recentEvents: SyncActivityEvent[]
}

/**
 * Sync context state - read-only for consumers
 */
export interface SyncState extends SyncStatus {
  lastSyncTime: Date | null
  recentSyncEvents: SyncActivityEvent[]
}

/**
 * Sync context actions - methods to control sync
 */
export interface SyncActions {
  enableSync: () => void
  disableSync: () => void
  createSpace: () => { spaceId: string; password: string }
  joinSpace: (spaceId: string, password: string) => void
  setDeviceName: (name: string) => void
  refreshStatus: () => void
  dismissVersionMismatch: () => void
}

/**
 * Sync context value
 */
export interface SyncContextValue {
  state: SyncState
  actions: SyncActions
}
