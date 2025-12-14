import { type ReactElement, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { decodeInvite, isValidInviteFormat } from '@/lib/sync'

interface JoinSpaceProps {
  onJoin: (spaceId: string, password: string) => void
  onCancel?: () => void
  initialCode?: string
  className?: string
}

/**
 * Join sync space by entering invite code
 */
export function JoinSpace({
  onJoin,
  onCancel,
  initialCode = '',
  className = '',
}: JoinSpaceProps): ReactElement {
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = useCallback((): void => {
    const trimmed = code.trim()

    if (trimmed.length === 0) {
      setError('Please enter an invite code')
      return
    }

    if (!isValidInviteFormat(trimmed)) {
      setError('Invalid invite code format')
      return
    }

    const invite = decodeInvite(trimmed)
    if (invite === null) {
      setError('Invalid invite code')
      return
    }

    setError(null)
    onJoin(invite.spaceId, invite.password)
  }, [code, onJoin])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        handleJoin()
      }
    },
    [handleJoin]
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    // Auto-format: convert to uppercase and allow dashes
    const value = e.target.value.toUpperCase()
    setCode(value)
    setError(null)
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Join Sync Space</h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter the invite code from another device
        </p>
      </div>

      <Input
        label="Invite Code"
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
        error={error ?? undefined}
        autoFocus
        className="font-mono"
      />

      <div className="flex gap-2">
        {onCancel !== undefined && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" onClick={handleJoin} disabled={code.trim() === ''}>
          Join Space
        </Button>
      </div>
    </div>
  )
}
