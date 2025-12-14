import { useState, useEffect, useCallback } from 'react'
import { parseInviteUrl } from '@/lib/sync'
import type { DecodedInvite } from '@/types/sync'

interface UseInviteLinkReturn {
  /**
   * Pending invite decoded from URL, null if none
   */
  pendingInvite: DecodedInvite | null
  /**
   * Clear the pending invite (after processing or dismissing)
   */
  clearPendingInvite: () => void
  /**
   * Whether an invite was found in the URL
   */
  hasInvite: boolean
}

/**
 * Hook to parse invite links from URL hash
 *
 * Checks for invite code in URL hash on mount:
 * - /join#XXXX-XXXX-XXXX-...
 * - #XXXX-XXXX-XXXX-...
 *
 * @returns Pending invite and clear function
 */
export function useInviteLink(): UseInviteLinkReturn {
  const [pendingInvite, setPendingInvite] = useState<DecodedInvite | null>(null)

  // Parse URL on mount
  useEffect(() => {
    const parseUrl = (): void => {
      const hash = window.location.hash
      const pathname = window.location.pathname

      // Check if we're on the join page or have a hash with invite code
      if (pathname.includes('/join') || hash.length > 1) {
        const fullUrl = window.location.href
        const invite = parseInviteUrl(fullUrl)

        if (invite !== null) {
          setPendingInvite(invite)
        }
      }
    }

    parseUrl()

    // Listen for hash changes (in case user navigates)
    window.addEventListener('hashchange', parseUrl)

    return (): void => {
      window.removeEventListener('hashchange', parseUrl)
    }
  }, [])

  // Clear pending invite and optionally clear URL hash
  const clearPendingInvite = useCallback((): void => {
    setPendingInvite(null)

    // Clear the hash from URL without triggering navigation
    if (window.location.hash.length > 0) {
      const url = new URL(window.location.href)
      url.hash = ''

      // Use replaceState to avoid adding to history
      window.history.replaceState(null, '', url.pathname + url.search)
    }
  }, [])

  return {
    pendingInvite,
    clearPendingInvite,
    hasInvite: pendingInvite !== null,
  }
}
