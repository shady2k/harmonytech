import { createContext } from 'react'
import type { AIProviderType } from '@/types/settings'

export interface AIStatusContextValue {
  isAIAvailable: boolean
  aiProvider: AIProviderType | undefined
  aiError: string | null
}

export const AIStatusContext = createContext<AIStatusContextValue | null>(null)
