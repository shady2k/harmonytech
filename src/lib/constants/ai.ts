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

/** Cache TTL for task extraction responses (30 minutes) */
export const CACHE_TTL_EXTRACTION = 30 * 60 * 1000

/** Cache TTL for property suggestion responses (1 hour) */
export const CACHE_TTL_PROPERTIES = 60 * 60 * 1000

/** Cache TTL for recommendation responses (5 minutes) */
export const CACHE_TTL_RECOMMENDATIONS = 5 * 60 * 1000
