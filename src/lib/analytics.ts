/**
 * Analytics event tracking
 * For MVP, events are logged via the logger
 * Can be replaced with actual analytics service later
 */

import { logger } from '@/lib/logger'

const log = logger.ai // Reusing AI logger for analytics

type EventPayload = Record<string, unknown>

/**
 * Track an analytics event
 * @param name - Event name (e.g., 'inbox_viewed', 'task_started')
 * @param payload - Additional event data
 */
export function trackEvent(name: string, payload: EventPayload = {}): void {
  log.info('Analytics:', name, payload)
}

// Pre-defined event types for consistency
export const AnalyticsEvents = {
  INBOX_VIEWED: 'inbox_viewed',
  INBOX_ITEM_PROCESSED: 'inbox_item_processed',
  AI_EXTRACTION_APPROVED: 'ai_extraction_approved',
  AI_EXTRACTION_REJECTED: 'ai_extraction_rejected',
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
  THOUGHT_CAPTURED: 'thought_captured',
  VOICE_CAPTURE_STARTED: 'voice_capture_started',
  VOICE_CAPTURE_COMPLETED: 'voice_capture_completed',
} as const
