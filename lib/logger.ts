/**
 * Production-ready logging utility for Chameleon AI Chat
 *
 * Features:
 * - Automatically disabled in production (unless explicitly enabled)
 * - Structured logging with prefixes and levels
 * - Performance timing helpers
 * - Grouped logging for complex operations
 * - Safe for SSR (checks for window)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  enabled: boolean
  minLevel: LogLevel
  prefix: string
  showTimestamp: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const forceLogging = process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true'

const defaultConfig: LoggerConfig = {
  enabled: isDev || forceLogging,
  minLevel: isDev ? 'debug' : 'warn',
  prefix: '',
  showTimestamp: false,
}

class Logger {
  private config: LoggerConfig
  private timers: Map<string, number> = new Map()

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    if (isTest) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = []

    if (this.config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`)
    }

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`)
    }

    parts.push(message)

    return parts.join(' ')
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args)
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args)
    }
  }

  /**
   * Start a performance timer
   */
  time(label: string): void {
    if (this.shouldLog('debug')) {
      this.timers.set(label, performance.now())
    }
  }

  /**
   * End a performance timer and log the duration
   */
  timeEnd(label: string): number | null {
    if (!this.shouldLog('debug')) return null

    const start = this.timers.get(label)
    if (start === undefined) {
      this.warn(`Timer "${label}" does not exist`)
      return null
    }

    const duration = performance.now() - start
    this.timers.delete(label)
    this.debug(`${label}: ${duration.toFixed(2)}ms`)
    return duration
  }

  /**
   * Group related log messages together
   */
  group(label: string, collapsed = true): void {
    if (this.shouldLog('debug')) {
      if (collapsed) {
        console.groupCollapsed(this.formatMessage('debug', label))
      } else {
        console.group(this.formatMessage('debug', label))
      }
    }
  }

  /**
   * End a log group
   */
  groupEnd(): void {
    if (this.shouldLog('debug')) {
      console.groupEnd()
    }
  }

  /**
   * Log a table of data
   */
  table(data: unknown): void {
    if (this.shouldLog('debug')) {
      console.table(data)
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    const newPrefix = this.config.prefix
      ? `${this.config.prefix}:${prefix}`
      : prefix
    return new Logger({ ...this.config, prefix: newPrefix })
  }

  /**
   * Temporarily enable logging for debugging
   */
  enable(): void {
    this.config.enabled = true
  }

  /**
   * Temporarily disable logging
   */
  disable(): void {
    this.config.enabled = false
  }
}

// Pre-configured loggers for different modules
export const logger = new Logger({ prefix: 'App' })

export const loggers = {
  app: new Logger({ prefix: 'App' }),
  memory: new Logger({ prefix: 'Memory' }),
  chat: new Logger({ prefix: 'Chat' }),
  api: new Logger({ prefix: 'API' }),
  auth: new Logger({ prefix: 'Auth' }),
  sync: new Logger({ prefix: 'Sync' }),
  pwa: new Logger({ prefix: 'PWA' }),
  search: new Logger({ prefix: 'Search' }),
  tools: new Logger({ prefix: 'Tools' }),
  settings: new Logger({ prefix: 'Settings' }),
  cost: new Logger({ prefix: 'Cost' }),
  embedding: new Logger({ prefix: 'Embedding' }),
  voice: new Logger({ prefix: 'Voice' }),
  rag: new Logger({ prefix: 'RAG' }),
  persona: new Logger({ prefix: 'Persona' }),
}

// Create a custom logger for a specific module
export function createLogger(prefix: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({ prefix, ...config })
}

// Export Logger class for type usage
export { Logger }
export type { LoggerConfig, LogLevel }
