import type { ReactElement } from 'react'
import { NAV_ITEMS } from '@/lib/constants/navigation'
import type { ViewType } from '@/types/navigation'
import { NavIcon } from './NavIcon'

interface MobileNavProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onCaptureClick: () => void
}

export function MobileNav({
  activeView,
  onViewChange,
  onCaptureClick,
}: MobileNavProps): ReactElement {
  const leftItems = NAV_ITEMS.slice(0, 2)
  const rightItems = NAV_ITEMS.slice(2)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {leftItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onViewChange(item.id)
            }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 ${
              activeView === item.id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <NavIcon name={item.icon} className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={onCaptureClick}
          className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Capture"
        >
          <NavIcon name="plus" className="h-6 w-6" />
        </button>

        {rightItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onViewChange(item.id)
            }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 ${
              activeView === item.id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <NavIcon name={item.icon} className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
