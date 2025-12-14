import type { ReactElement } from 'react'
import { NAV_ITEMS } from '@/lib/constants/navigation'
import type { ViewType } from '@/types/navigation'
import { NavIcon } from './NavIcon'
import { AIStatusIndicator } from './AIStatusIndicator'
import { useInbox } from '@/hooks/useInbox'
import { Kbd } from '@/components/ui/Kbd'
import { NAV_SHORTCUTS, ACTION_SHORTCUTS } from '@/config/shortcuts'

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onCaptureClick: () => void
}

export function Sidebar({ activeView, onViewChange, onCaptureClick }: SidebarProps): ReactElement {
  const { count: inboxCount } = useInbox()

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">HarmonyTech</h1>
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={onCaptureClick}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <NavIcon name="plus" className="h-5 w-5" />
            <span>Capture</span>
            <Kbd className="ml-1 border-indigo-500 bg-indigo-500 text-indigo-100">
              {ACTION_SHORTCUTS.capture.label}
            </Kbd>
          </button>
        </div>

        <nav className="mt-6 flex-1 px-2">
          {NAV_ITEMS.map((item) => {
            const badge = item.id === 'inbox' && inboxCount > 0 ? inboxCount : undefined
            const shortcut = NAV_SHORTCUTS[item.id]
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onViewChange(item.id)
                }}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                  activeView === item.id
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {badge !== undefined && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                <Kbd>{shortcut.label}</Kbd>
              </button>
            )
          })}
        </nav>

        {/* AI Status Indicator */}
        <button
          type="button"
          onClick={() => {
            onViewChange('settings')
          }}
          className="w-full cursor-pointer border-t border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
        >
          <AIStatusIndicator />
        </button>
      </div>
    </aside>
  )
}
