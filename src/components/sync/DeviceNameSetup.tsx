import { type ReactElement, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface DeviceNameSetupProps {
  onComplete: (deviceName: string) => void
  className?: string
}

/**
 * Device name setup component
 * Shown before sync can be enabled to identify this device
 */
export function DeviceNameSetup({
  onComplete,
  className = '',
}: DeviceNameSetupProps): ReactElement {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback((): void => {
    const trimmed = name.trim()

    if (trimmed.length < 2) {
      setError('Device name must be at least 2 characters')
      return
    }

    if (trimmed.length > 50) {
      setError('Device name must be less than 50 characters')
      return
    }

    setError(null)
    onComplete(trimmed)
  }, [name, onComplete])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Name this device</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Give this device a name so you can identify it when syncing
        </p>
      </div>

      <Input
        label="Device Name"
        value={name}
        onChange={(e): void => {
          setName(e.target.value)
          setError(null)
        }}
        onKeyDown={handleKeyDown}
        placeholder="e.g., John's MacBook"
        error={error ?? undefined}
        autoFocus
      />

      <Button onClick={handleSubmit} disabled={name.trim().length < 2}>
        Continue
      </Button>
    </div>
  )
}
