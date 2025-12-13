/**
 * Vite plugin for development file logging
 * - Creates timestamped log files in /logs folder
 * - Uses pino-pretty for formatting
 * - Keeps only 10 most recent log files
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  createWriteStream,
  type WriteStream,
} from 'fs'
import { join } from 'path'
import type { Plugin, ViteDevServer } from 'vite'
import pino from 'pino'
import pinoPretty from 'pino-pretty'

const LOGS_DIR = 'logs'
const MAX_LOG_FILES = 10

// Create a pino logger with pretty output for plugin messages
const pluginLogger = pino(
  pinoPretty({
    colorize: true,
    translateTime: 'SYS:HH:MM:ss.l',
    ignore: 'pid,hostname',
  })
)

interface LogEntry {
  level: string
  module: string
  args: unknown[]
  timestamp?: string
}

function createLogFileName(): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${timestamp}.log`
}

function cleanupOldLogs(logsDir: string): void {
  if (!existsSync(logsDir)) return

  const files = readdirSync(logsDir)
    .filter((f) => f.endsWith('.log'))
    .map((f) => ({
      name: f,
      path: join(logsDir, f),
    }))
    .sort((a, b) => b.name.localeCompare(a.name)) // Newest first

  // Remove files beyond MAX_LOG_FILES
  const filesToDelete = files.slice(MAX_LOG_FILES)
  for (const file of filesToDelete) {
    try {
      unlinkSync(file.path)
      pluginLogger.info(`[dev-logger] Deleted old log: ${file.name}`)
    } catch {
      // Ignore deletion errors
    }
  }
}

function formatLogLevel(level: string): number {
  const levels: Record<string, number> = {
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
  }
  return levels[level] ?? 30
}

function formatArg(arg: unknown): string {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  if (typeof arg === 'object') return JSON.stringify(arg)
  if (typeof arg === 'string') return arg
  if (typeof arg === 'number' || typeof arg === 'boolean') return arg.toString()
  return JSON.stringify(arg)
}

export function devLoggerPlugin(): Plugin {
  let logStream: WriteStream | null = null
  let prettyStream: ReturnType<typeof pinoPretty> | null = null
  let currentLogFile = ''

  return {
    name: 'vite-plugin-dev-logger',
    apply: 'serve', // Only in dev mode

    configureServer(server: ViteDevServer): void {
      const logsDir = join(server.config.root, LOGS_DIR)

      // Create logs directory if it doesn't exist
      if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true })
      }

      // Cleanup old logs
      cleanupOldLogs(logsDir)

      // Create new log file
      currentLogFile = createLogFileName()
      const logFilePath = join(logsDir, currentLogFile)
      logStream = createWriteStream(logFilePath, { flags: 'a' })

      // Create pino-pretty stream
      prettyStream = pinoPretty({
        colorize: false,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '[{module}] {msg}',
      })

      // Pipe pretty output to file
      prettyStream.pipe(logStream)

      pluginLogger.info(`[dev-logger] Logging to: ${logFilePath}`)

      // Add middleware to handle log requests
      server.middlewares.use('/api/dev-log', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString()
        })

        req.on('end', () => {
          try {
            const logEntry = JSON.parse(body) as LogEntry

            // Format as pino-compatible JSON
            const pinoLog = {
              level: formatLogLevel(logEntry.level),
              time: Date.now(),
              module: logEntry.module,
              msg: logEntry.args.map(formatArg).join(' '),
            }

            prettyStream?.write(JSON.stringify(pinoLog) + '\n')

            res.statusCode = 200
            res.end('OK')
          } catch {
            res.statusCode = 400
            res.end('Invalid JSON')
          }
        })
      })
    },

    closeBundle(): void {
      // Cleanup on server close
      if (prettyStream) {
        prettyStream.end()
      }
      if (logStream) {
        logStream.end()
      }
    },
  }
}
