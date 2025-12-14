import type { ReactElement, ReactNode } from 'react'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import type { ViewType } from '@/types/navigation'

interface AppLayoutProps {
  children: ReactNode
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onCaptureClick: () => void
}

export function AppLayout({
  children,
  activeView,
  onViewChange,
  onCaptureClick,
}: AppLayoutProps): ReactElement {
  return (
    <div className="flex min-h-dvh bg-gray-50 dark:bg-gray-900">
      <Sidebar
        activeView={activeView}
        onViewChange={onViewChange}
        onCaptureClick={onCaptureClick}
      />

      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-64">
        <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
      </main>

      <MobileNav
        activeView={activeView}
        onViewChange={onViewChange}
        onCaptureClick={onCaptureClick}
      />
    </div>
  )
}
