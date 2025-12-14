/**
 * Application logger with pretty output
 * Supports debug, info, warn, error levels
 * Debug logging enabled in dev mode or via localStorage.setItem('debug', 'true')
 * In dev mode, logs are also written to files in /logs folder
 */

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
    body: JSON.stringify({ level, module, args, timestamp: new Date().toISOString() }),
  }).catch(() => {
    // Silently ignore file logging errors
  })
}

// Format timestamp for console
function formatTime(): string {
  const now = new Date()
  return (
    now.toLocaleTimeString('en-US', { hour12: false }) +
    '.' +
    String(now.getMilliseconds()).padStart(3, '0')
  )
}

// Format args for display
function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (arg === null) return 'null'
    if (arg === undefined) return 'undefined'
    if (typeof arg === 'object') return arg
    return arg
  })
}

// Console colors for different levels
const levelColors: Record<string, string> = {
  debug: 'color: #888',
  info: 'color: #4CAF50',
  warn: 'color: #FF9800',
  error: 'color: #f44336',
}

const levelLabels: Record<string, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
}

// Pretty console log
function prettyLog(level: string, module: string, args: unknown[]): void {
  if (level === 'debug' && !isDebugEnabled()) return

  const time = formatTime()
  const color = levelColors[level] ?? 'color: inherit'
  const label = levelLabels[level] ?? level.toUpperCase()
  const formattedArgs = formatArgs(args)

  // Pretty format: [HH:MM:SS.mmm] LEVEL [Module] message
  const prefix = `%c[${time}] ${label} [${module}]`

  if (formattedArgs.length === 0) {
    console.log(prefix, color)
  } else if (formattedArgs.length === 1) {
    console.log(prefix, color, formattedArgs[0])
  } else {
    console.log(prefix, color, ...formattedArgs)
  }
}

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
  return {
    debug: (...args: unknown[]): void => {
      prettyLog('debug', module, args)
      sendToFileLogger('debug', module, args)
    },
    info: (...args: unknown[]): void => {
      prettyLog('info', module, args)
      sendToFileLogger('info', module, args)
    },
    warn: (...args: unknown[]): void => {
      prettyLog('warn', module, args)
      sendToFileLogger('warn', module, args)
    },
    error: (...args: unknown[]): void => {
      prettyLog('error', module, args)
      sendToFileLogger('error', module, args)
    },
  }
}

// Pre-configured loggers for common modules
export const logger = {
  ai: createLogger('AI'),
  aiQueue: createLogger('AIQueue'),
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
