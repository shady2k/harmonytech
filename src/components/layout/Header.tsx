import type { ReactElement } from 'react'
import { NavIcon } from './NavIcon'
import type { ViewType } from '@/types/navigation'
import { NAV_ITEMS } from '@/lib/constants/navigation'

interface HeaderProps {
  activeView: ViewType
  onMenuClick?: () => void
  onSettingsClick?: () => void
}

export function Header({ activeView, onMenuClick, onSettingsClick }: HeaderProps): ReactElement {
  const currentNavItem = NAV_ITEMS.find((item) => item.id === activeView)
  const viewTitle = currentNavItem?.label ?? 'HarmonyTech'

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
            aria-label="Open menu"
          >
            <NavIcon name="menu" className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{viewTitle}</h1>
        </div>

        <button
          type="button"
          onClick={onSettingsClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Settings"
        >
          <NavIcon name="settings" className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
