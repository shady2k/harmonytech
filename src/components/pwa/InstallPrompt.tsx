import { type ReactElement, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptProps {
  className?: string
}

const INSTALL_PROMPT_STORAGE_KEY = 'harmonytech-install-prompt-dismissed'
const VISIT_COUNT_STORAGE_KEY = 'harmonytech-visit-count'
const REQUIRED_VISITS = 2

export function InstallPrompt({ className = '' }: InstallPromptProps): ReactElement | null {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem(INSTALL_PROMPT_STORAGE_KEY)
    if (dismissed === 'true') {
      return
    }

    // Increment visit count
    const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_STORAGE_KEY) ?? '0', 10)
    const newVisitCount = visitCount + 1
    localStorage.setItem(VISIT_COUNT_STORAGE_KEY, String(newVisitCount))

    // Don't show until required visits
    if (newVisitCount < REQUIRED_VISITS) {
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event): void => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app is already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Navigator & { standalone: boolean }).standalone)

    if (isStandalone) {
      setShowPrompt(false)
    }

    return (): void => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = useCallback(async (): Promise<void> => {
    if (deferredPrompt === null) return

    setIsInstalling(true)

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const handleDismiss = useCallback((): void => {
    setShowPrompt(false)
    localStorage.setItem(INSTALL_PROMPT_STORAGE_KEY, 'true')
  }, [])

  if (!showPrompt || deferredPrompt === null) {
    return null
  }

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-40 md:bottom-4 md:left-auto md:right-4 md:w-80 ${className}`}
    >
      <Card className="shadow-lg">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
            <svg
              className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">Install HarmonyTech</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Install for quick access and offline support
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="flex-1">
            Not now
          </Button>
          <Button
            size="sm"
            onClick={(): void => {
              void handleInstall()
            }}
            isLoading={isInstalling}
            className="flex-1"
          >
            Install
          </Button>
        </div>
      </Card>
    </div>
  )
}
