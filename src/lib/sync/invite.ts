/**
 * Sync Invite - Encode/decode invite links for sync space sharing
 *
 * Uses Base32 encoding (RFC 4648) for human-readable invite codes.
 * Format: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
 */

import type { DecodedInvite } from '@/types/sync'

// Base32 alphabet (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const BASE32_PAD = '='

/**
 * Encode bytes to Base32 string
 */
function base32Encode(bytes: Uint8Array): string {
  let result = ''
  let bits = 0
  let value = 0

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      bits -= 5
      result += BASE32_ALPHABET[(value >>> bits) & 0x1f]
    }
  }

  // Handle remaining bits
  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }

  // Add padding to make length multiple of 8
  while (result.length % 8 !== 0) {
    result += BASE32_PAD
  }

  return result
}

/**
 * Decode Base32 string to bytes
 */
function base32Decode(str: string): Uint8Array {
  // Remove padding and convert to uppercase
  const input = str.replace(/=+$/, '').toUpperCase()
  const result: number[] = []
  let bits = 0
  let value = 0

  for (const char of input) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`)
    }

    value = (value << 5) | index
    bits += 5

    if (bits >= 8) {
      bits -= 8
      result.push((value >>> bits) & 0xff)
    }
  }

  return new Uint8Array(result)
}

/**
 * Format string as grouped code: "XXXX-XXXX-XXXX-..."
 */
function formatCode(str: string): string {
  // Remove padding for cleaner display
  const clean = str.replace(/=+$/, '')
  return clean.match(/.{1,4}/g)?.join('-') ?? clean
}

/**
 * Parse grouped code back to string: "XXXX-XXXX-XXXX-..." -> "XXXXXXXX..."
 */
function parseCode(code: string): string {
  return code.replace(/-/g, '').toUpperCase()
}

/**
 * Encode space credentials into Base32 grouped code
 *
 * @param spaceId - Full space UUID
 * @param password - Space password
 * @returns Grouped Base32 code like "ABCD-EFGH-IJKL-..."
 */
export function encodeInvite(spaceId: string, password: string): string {
  const data = JSON.stringify({ s: spaceId, p: password })
  const bytes = new TextEncoder().encode(data)
  const base32 = base32Encode(bytes)
  return formatCode(base32)
}

/**
 * Decode grouped code back to space credentials
 *
 * @param code - Grouped Base32 code
 * @returns Decoded invite or null if invalid
 */
export function decodeInvite(code: string): DecodedInvite | null {
  try {
    const base32 = parseCode(code)
    const bytes = base32Decode(base32)
    const data = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(data) as { s?: string; p?: string }

    if (typeof parsed.s !== 'string' || typeof parsed.p !== 'string') {
      return null
    }

    return { spaceId: parsed.s, password: parsed.p }
  } catch {
    return null
  }
}

/**
 * Build full invite URL with encoded credentials
 *
 * @param spaceId - Full space UUID
 * @param password - Space password
 * @returns Full URL like "https://harmonytech.app/join#ABCD-EFGH-..."
 */
export function buildInviteUrl(spaceId: string, password: string): string {
  const code = encodeInvite(spaceId, password)
  // Use current origin for local development, or production URL
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join`
      : 'https://harmonytech.app/join'
  return `${baseUrl}#${code}`
}

/**
 * Parse invite code from URL hash
 *
 * @param url - Full URL or just the hash part
 * @returns Decoded invite or null if invalid
 */
export function parseInviteUrl(url: string): DecodedInvite | null {
  try {
    // Extract hash from URL or use as-is if it's just the code
    let code: string

    if (url.includes('#')) {
      code = url.split('#')[1] ?? ''
    } else if (url.includes('/join/')) {
      // Handle path-based format: /join/XXXX-XXXX-...
      code = url.split('/join/')[1] ?? ''
    } else {
      // Assume it's just the code
      code = url
    }

    if (code.length === 0) {
      return null
    }

    return decodeInvite(code)
  } catch {
    return null
  }
}

/**
 * Validate invite code format (without decoding)
 *
 * @param code - Invite code to validate
 * @returns True if code appears to be valid Base32 format
 */
export function isValidInviteFormat(code: string): boolean {
  const clean = parseCode(code)
  // Check if all characters are valid Base32
  return /^[A-Z2-7]+$/.test(clean) && clean.length >= 20
}
