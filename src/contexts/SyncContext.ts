/**
 * Sync context - shared state for sync functionality
 */

import { createContext } from 'react'
import type { SyncContextValue } from '@/types/sync'

export const SyncContext = createContext<SyncContextValue | null>(null)
