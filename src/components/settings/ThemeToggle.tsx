import { type ReactElement, useCallback, useEffect } from 'react'
import { useSettingsStore } from '@/stores'
import { useDatabase } from '@/hooks'
import type { Theme } from '@/types/settings'

interface ThemeToggleProps {
  className?: string
}

const THEMES: { value: Theme; label: string; icon: ReactElement }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
]

function applyTheme(theme: Theme): void {
  const root = document.documentElement

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

export function ThemeToggle({ className = '' }: ThemeToggleProps): ReactElement {
  const { db } = useDatabase()
  const { theme, setTheme, syncToDatabase } = useSettingsStore()

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme)

    // Listen for system preference changes when in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (): void => {
        applyTheme('system')
      }
      mediaQuery.addEventListener('change', handleChange)
      return (): void => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
    return undefined
  }, [theme])

  const handleThemeChange = useCallback(
    (newTheme: Theme): void => {
      setTheme(newTheme)
      applyTheme(newTheme)
      if (db !== null) {
        void syncToDatabase(db)
      }
    },
    [setTheme, syncToDatabase, db]
  )

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
      <div className="flex gap-2">
        {THEMES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={(): void => {
              handleThemeChange(option.value)
            }}
            className={`flex flex-1 flex-col items-center gap-2 rounded-lg border-2 px-4 py-3 transition-colors ${
              theme === option.value
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700'
            }`}
          >
            {option.icon}
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
