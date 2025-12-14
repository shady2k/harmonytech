import type { ReactElement } from 'react'
import { NAV_ITEMS } from '@/lib/constants/navigation'
import type { ViewType } from '@/types/navigation'
import { NavIcon } from './NavIcon'
import { useInbox } from '@/hooks/useInbox'

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
  const { count: inboxCount } = useInbox()

  // Insert capture button at center (3 items on each side)
  const allItems = [
    ...NAV_ITEMS.slice(0, 3),
    { id: 'capture' as const, label: '', icon: 'plus' },
    ...NAV_ITEMS.slice(3),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-gray-800 dark:bg-gray-900 md:hidden">
      <div className="grid h-16 grid-cols-7">
        {allItems.map((item) => {
          if (item.id === 'capture') {
            return (
              <button
                key="capture"
                type="button"
                onClick={onCaptureClick}
                className="flex flex-col items-center justify-center"
                aria-label="Capture"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
                  <NavIcon name="plus" className="h-6 w-6" />
                </div>
              </button>
            )
          }

          const badge = item.id === 'inbox' && inboxCount > 0 ? inboxCount : undefined
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onViewChange(item.id)
              }}
              className={`relative flex flex-col items-center justify-center gap-1 ${
                activeView === item.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <NavIcon name={item.icon} className="h-6 w-6" />
                {badge !== undefined && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
