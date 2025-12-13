/**
 * AI-related constants for configuration and thresholds
 */

/** Confidence threshold for auto-approving AI suggestions (80%) */
export const AI_CONFIDENCE_THRESHOLD = 0.8

/** Whether AI auto-approval is enabled by default */
export const AI_AUTO_APPROVE_ENABLED = true

/** Retry delays in milliseconds for exponential backoff */
export const RETRY_DELAYS = [1000, 2000, 4000]

/** Maximum number of retries for failed AI operations */
export const MAX_RETRIES = 3
