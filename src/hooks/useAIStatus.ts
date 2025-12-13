import { useContext } from 'react'
import { AIStatusContext, type AIStatusContextValue } from '@/contexts/ai-status.context'

export function useAIStatus(): AIStatusContextValue {
  const context = useContext(AIStatusContext)
  if (context === null) {
    throw new Error('useAIStatus must be used within an AIStatusProvider')
  }
  return context
}
