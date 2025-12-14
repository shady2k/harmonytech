import { type ReactElement, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { encodeInvite, buildInviteUrl, generateQRCode } from '@/lib/sync'

interface InviteDisplayProps {
  spaceId: string
  password: string
  className?: string
}

/**
 * Display invite code and QR for sharing sync space
 */
export function InviteDisplay({
  spaceId,
  password,
  className = '',
}: InviteDisplayProps): ReactElement {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const inviteCode = encodeInvite(spaceId, password)
  const inviteUrl = buildInviteUrl(spaceId, password)

  // Generate QR code when shown
  useEffect(() => {
    if (showQR && qrDataUrl === null) {
      void generateQRCode(inviteUrl, 200).then(setQrDataUrl)
    }
  }, [showQR, inviteUrl, qrDataUrl])

  const handleCopyCode = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      // Clipboard API not available
    }
  }, [inviteCode])

  const handleCopyLink = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      // Clipboard API not available
    }
  }, [inviteUrl])

  return (
    <Card className={className}>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Invite Code</h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Share this code with other devices to sync
          </p>
        </div>

        {/* Invite Code Display */}
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200 break-all">
            {inviteCode}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={(): void => void handleCopyCode()}
            title="Copy invite code"
          >
            {copied ? (
              <svg
                className="h-4 w-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={(): void => void handleCopyLink()}>
            Copy Link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(): void => {
              setShowQR(!showQR)
            }}
          >
            {showQR ? 'Hide QR' : 'Show QR'}
          </Button>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="flex justify-center rounded-lg bg-white p-4">
            {qrDataUrl !== null ? (
              <img src={qrDataUrl} alt="Invite QR Code" className="h-48 w-48" />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
