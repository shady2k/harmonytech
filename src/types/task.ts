export type TaskContext = 'computer' | 'phone' | 'errands' | 'home' | 'anywhere'

export type TaskEnergy = 'high' | 'medium' | 'low'

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'custom'

export interface Recurrence {
  pattern: RecurrencePattern
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  endDate?: string
}

export interface AISuggestions {
  suggestedContext?: TaskContext
  suggestedEnergy?: TaskEnergy
  suggestedTimeEstimate?: number
  suggestedProject?: string
  confidence?: number
  alternatives?: {
    context?: TaskContext[]
    energy?: TaskEnergy[]
    timeEstimate?: number[]
  }
}

export interface Task {
  id: string
  rawInput: string
  nextAction: string
  context: TaskContext
  energy: TaskEnergy
  timeEstimate: number
  deadline?: string
  project?: string
  isSomedayMaybe: boolean
  isCompleted: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
  aiSuggestions?: AISuggestions
  recurrence?: Recurrence
  sourceThoughtId?: string
}
