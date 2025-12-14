/**
 * Sync module - P2P sync functionality
 *
 * Re-exports all sync-related functionality from submodules.
 */

// Core sync provider and device management
export {
  getYDoc,
  getTasksMap,
  getThoughtsMap,
  getProjectsMap,
  getSyncProvider,
  initSyncProvider,
  isSyncConnected,
  disconnectSync,
  destroySync,
  getConnectedPeersCount,
  getAwarenessStates,
  onSyncStatusChange,
  onAwarenessChange,
  // Device identity
  getDeviceId,
  getDeviceName,
  setDeviceName,
  hasDeviceName,
  // Space configuration
  getSpaceId,
  setSpaceId,
  getPassword,
  setPassword,
  hasSpaceConfig,
  clearSpaceConfig,
  generateSpaceId,
  generatePassword,
  createSpace,
  joinSpace,
  // Types
  type SyncProviderConfig,
} from './core'

// Invite encoding/decoding
export {
  encodeInvite,
  decodeInvite,
  buildInviteUrl,
  parseInviteUrl,
  isValidInviteFormat,
} from './invite'

// Version checking and device list
export {
  checkVersionMismatch,
  shouldDisconnect,
  getConnectedDevices,
  formatDeviceName,
  getOutdatedPeers,
  SYNC_PROTOCOL_VERSION,
} from './version'

// QR code generation
export { generateQRCode, generateQRCodeSVG } from './qr-code'

// Sync bridge (Dexie <-> Yjs)
export { initSyncBridge, cleanupSyncBridge, isSyncBridgeInitialized } from './bridge'
