import { type ReactElement, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { ApiKeySetup } from '@/components/settings/ApiKeySetup'
import { useSettingsStore } from '@/stores'

interface OnboardingFlowProps {
  onComplete: () => void
  className?: string
}

type OnboardingStep = 'welcome' | 'api-key' | 'tutorial' | 'done'

const ONBOARDING_STORAGE_KEY = 'harmonytech-onboarding-completed'

export function hasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
}

export function markOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
}

export function OnboardingFlow({ onComplete, className = '' }: OnboardingFlowProps): ReactElement {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const { isApiKeyValid } = useSettingsStore()

  const handleNext = useCallback((): void => {
    switch (step) {
      case 'welcome':
        setStep('api-key')
        break
      case 'api-key':
        setStep('tutorial')
        break
      case 'tutorial':
        setStep('done')
        break
      case 'done':
        markOnboardingComplete()
        onComplete()
        break
    }
  }, [step, onComplete])

  const handleSkip = useCallback((): void => {
    markOnboardingComplete()
    onComplete()
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 p-4 ${className}`}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 bg-gray-50 px-6 py-4 dark:bg-gray-800">
          {(['welcome', 'api-key', 'tutorial', 'done'] as OnboardingStep[]).map((s, i) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-colors ${
                step === s
                  ? 'bg-indigo-600 dark:bg-indigo-400'
                  : i < ['welcome', 'api-key', 'tutorial', 'done'].indexOf(step)
                    ? 'bg-indigo-300 dark:bg-indigo-700'
                    : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <div className="p-6">
          {step === 'welcome' && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <svg
                  className="h-10 w-10 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to HarmonyTech
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Your AI-powered GTD task manager with local-first storage and P2P sync. Let&apos;s
                get you set up in just a few steps.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip setup
                </Button>
                <Button onClick={handleNext}>Get Started</Button>
              </div>
            </div>
          )}

          {step === 'api-key' && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                Connect AI Features
              </h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                HarmonyTech uses AI to extract tasks from your notes and suggest properties. Enter
                your OpenRouter API key to enable these features.
              </p>
              <ApiKeySetup />
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button onClick={handleNext} disabled={isApiKeyValid !== true}>
                  {isApiKeyValid === true ? 'Continue' : 'Verify key to continue'}
                </Button>
              </div>
            </div>
          )}

          {step === 'tutorial' && (
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Quick Tips</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Capture anything</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tap the + button to capture tasks via text or voice. AI extracts actionable
                      items automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Review suggestions
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      AI suggests context, energy level, and time estimates. Accept or customize as
                      needed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Get recommendations
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ask &quot;What should I do next?&quot; and AI recommends tasks based on your
                      energy and available time.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleNext}>Almost done</Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg
                  className="h-10 w-10 text-green-600 dark:text-green-400"
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
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                You&apos;re all set!
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Start capturing your tasks and let HarmonyTech help you stay organized.
              </p>
              <Button onClick={handleNext}>Start using HarmonyTech</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
