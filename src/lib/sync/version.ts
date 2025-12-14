/**
 * Sync Version - Protocol version checking and device list management
 *
 * Handles version mismatch detection and connected device list from awareness.
 */

import type { ConnectedDevice, DeviceAwareness, VersionMismatch } from '@/types/sync'
import { SYNC_PROTOCOL_VERSION } from '@/types/sync'

export { SYNC_PROTOCOL_VERSION }

/**
 * Check if any peer has a higher protocol version (requires update)
 *
 * @param awarenessStates - Map of awareness states from WebRTC provider
 * @returns VersionMismatch if update required, null otherwise
 */
export function checkVersionMismatch(
  awarenessStates: Map<number, { device?: DeviceAwareness }>
): VersionMismatch | null {
  for (const [, state] of awarenessStates) {
    const device = state.device
    if (!device) continue

    if (device.protocolVersion > SYNC_PROTOCOL_VERSION) {
      return {
        detected: true,
        localVersion: SYNC_PROTOCOL_VERSION,
        peerVersion: device.protocolVersion,
        peerDeviceName: device.deviceName,
      }
    }
  }

  return null
}

/**
 * Check if we should disconnect due to version mismatch
 *
 * @param peerVersion - Peer's protocol version
 * @returns True if peer has higher version (we should disconnect)
 */
export function shouldDisconnect(peerVersion: number): boolean {
  return peerVersion > SYNC_PROTOCOL_VERSION
}

/**
 * Get list of connected devices from awareness states
 * Deduplicates by deviceId and counts tabs for multi-tab detection
 *
 * @param awarenessStates - Map of awareness states from WebRTC provider
 * @param currentDeviceId - Current device's ID for marking "this device"
 * @returns Array of connected devices
 */
export function getConnectedDevices(
  awarenessStates: Map<number, { device?: DeviceAwareness }>,
  currentDeviceId: string
): ConnectedDevice[] {
  const deviceMap = new Map<string, ConnectedDevice>()

  for (const [, state] of awarenessStates) {
    const device = state.device
    if (device === undefined || device.deviceId === '') continue

    const existing = deviceMap.get(device.deviceId)

    if (existing) {
      // Same device, multiple tabs/connections
      existing.tabCount++
    } else {
      deviceMap.set(device.deviceId, {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        protocolVersion: device.protocolVersion,
        isCurrentDevice: device.deviceId === currentDeviceId,
        tabCount: 1,
      })
    }
  }

  // Sort: current device first, then alphabetically by name
  return Array.from(deviceMap.values()).sort((a, b) => {
    if (a.isCurrentDevice) return -1
    if (b.isCurrentDevice) return 1
    return a.deviceName.localeCompare(b.deviceName)
  })
}

/**
 * Format device display name with tab count if multiple
 *
 * @param device - Connected device
 * @returns Formatted name like "John's MacBook" or "John's MacBook (2 tabs)"
 */
export function formatDeviceName(device: ConnectedDevice): string {
  let name = device.deviceName

  if (device.isCurrentDevice) {
    name += ' (this device)'
  }

  if (device.tabCount > 1) {
    name += ` (${String(device.tabCount)} tabs)`
  }

  return name
}

/**
 * Check if any connected peer has an outdated version
 * (We're newer, they should update - informational only)
 *
 * @param awarenessStates - Map of awareness states from WebRTC provider
 * @returns Array of device names with outdated versions
 */
export function getOutdatedPeers(
  awarenessStates: Map<number, { device?: DeviceAwareness }>
): string[] {
  const outdated: string[] = []

  for (const [, state] of awarenessStates) {
    const device = state.device
    if (device === undefined) continue

    if (device.protocolVersion < SYNC_PROTOCOL_VERSION) {
      outdated.push(device.deviceName)
    }
  }

  return outdated
}
