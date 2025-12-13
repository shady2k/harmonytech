/**
 * Application logger using pino
 * Supports debug, info, warn, error levels
 * Debug logging enabled in dev mode or via localStorage.setItem('debug', 'true')
 * In dev mode, logs are also written to files in /logs folder
 */

import pino from 'pino'

// Check if debug mode is enabled
const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return import.meta.env.DEV
  return localStorage.getItem('debug') === 'true' || import.meta.env.DEV
}

// Check if we should log to files (only in dev mode)
const shouldLogToFile = (): boolean => {
  return import.meta.env.DEV && typeof window !== 'undefined'
}

// Send log to dev server for file logging
function sendToFileLogger(level: string, module: string, args: unknown[]): void {
  if (!shouldLogToFile()) return

  // Fire and forget - don't await
  fetch('/api/dev-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, module, args }),
  }).catch(() => {
    // Silently ignore file logging errors
  })
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
      sendToFileLogger('debug', module, args)
    },
    info: (...args: unknown[]): void => {
      child.info({ args }, `[${module}]`)
      sendToFileLogger('info', module, args)
    },
    warn: (...args: unknown[]): void => {
      child.warn({ args }, `[${module}]`)
      sendToFileLogger('warn', module, args)
    },
    error: (...args: unknown[]): void => {
      child.error({ args }, `[${module}]`)
      sendToFileLogger('error', module, args)
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
