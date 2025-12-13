export type ViewType = 'home' | 'inbox' | 'tasks' | 'thoughts' | 'settings'

export interface NavItem {
  id: ViewType
  label: string
  icon: string
  badge?: number
}
