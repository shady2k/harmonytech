export type ViewType = 'inbox' | 'tasks' | 'thoughts' | 'settings'

export interface NavItem {
  id: ViewType
  label: string
  icon: string
}
