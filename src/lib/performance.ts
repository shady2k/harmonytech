/**
 * Performance measurement utilities
 * Uses Performance API to measure and log key metrics
 */

import { logger } from '@/lib/logger'

const log = logger.ai // Reusing AI logger for now

/**
 * Measure home page load performance
 */
export function measureHomeLoad(): void {
  performance.mark('home-load-start')
}

/**
 * Complete home page load measurement
 */
export function measureHomeLoadEnd(): void {
  performance.mark('home-load-end')

  try {
    const measure = performance.measure('home-load', 'home-load-start', 'home-load-end')
    log.info('Home load time:', measure.duration.toFixed(2), 'ms')
  } catch {
    // Marks may not exist, ignore
  }
}

/**
 * Measure inbox query performance
 */
export function measureInboxQuery(): void {
  performance.mark('inbox-query-start')
}

/**
 * Complete inbox query measurement
 */
export function measureInboxQueryEnd(): void {
  performance.mark('inbox-query-end')

  try {
    const measure = performance.measure('inbox-query', 'inbox-query-start', 'inbox-query-end')
    log.info('Inbox query time:', measure.duration.toFixed(2), 'ms')
  } catch {
    // Marks may not exist, ignore
  }
}

/**
 * Measure AI processing performance
 */
export function measureAIProcessing(): void {
  performance.mark('ai-processing-start')
}

/**
 * Complete AI processing measurement
 */
export function measureAIProcessingEnd(): void {
  performance.mark('ai-processing-end')

  try {
    const measure = performance.measure('ai-processing', 'ai-processing-start', 'ai-processing-end')
    log.info('AI processing time:', measure.duration.toFixed(2), 'ms')
  } catch {
    // Marks may not exist, ignore
  }
}
