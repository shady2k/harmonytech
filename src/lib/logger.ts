/**
 * Application logger using pino
 * Supports debug, info, warn, error levels
 * Debug logging enabled in dev mode or via localStorage.setItem('debug', 'true')
 */

import pino from 'pino'

// Check if debug mode is enabled
const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return import.meta.env.DEV
  return localStorage.getItem('debug') === 'true' || import.meta.env.DEV
}

// Create pino logger for browser
const pinoLogger = pino({
  browser: {
    asObject: false,
  },
  level: isDebugEnabled() ? 'debug' : 'info',
})

// Logger interface with module prefixing
interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

/**
 * Create a logger for a specific module
 * @param module - Module name for prefixing logs
 */
export function createLogger(module: string): Logger {
  const child = pinoLogger.child({ module })

  return {
    debug: (...args: unknown[]): void => {
      child.debug({ args }, `[${module}]`)
    },
    info: (...args: unknown[]): void => {
      child.info({ args }, `[${module}]`)
    },
    warn: (...args: unknown[]): void => {
      child.warn({ args }, `[${module}]`)
    },
    error: (...args: unknown[]): void => {
      child.error({ args }, `[${module}]`)
    },
  }
}

// Pre-configured loggers for common modules
export const logger = {
  ai: createLogger('AI'),
  backgroundAI: createLogger('BackgroundAI'),
  yandex: createLogger('Yandex'),
  openrouter: createLogger('OpenRouter'),
  db: createLogger('Database'),
  capture: createLogger('Capture'),
}

// Enable/disable debug mode
export function setDebugMode(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('debug', 'true')
    } else {
      localStorage.removeItem('debug')
    }
    // Reload to apply new log level
    window.location.reload()
  }
}

// Check if debug mode is active
export function isDebugMode(): boolean {
  return isDebugEnabled()
}
