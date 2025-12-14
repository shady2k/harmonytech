export type ViewType = 'home' | 'inbox' | 'tasks' | 'timers' | 'thoughts' | 'settings'

export interface NavItem {
  id: ViewType
  label: string
  icon: string
  badge?: number
}
