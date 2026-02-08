/**
 * Centralized logging service with environment-based filtering
 * Provides structured logging with different levels and transports
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, unknown>
  stack?: string
}

class Logger {
  private minLevel: LogLevel = 'info'
  private transports: Array<(entry: LogEntry) => void> = []

  constructor() {
    // Set minimum log level based on environment
    this.minLevel = import.meta.env.DEV ? 'debug' : 'warn'
    
    // Add console transport
    this.transports.push(this.consoleTransport.bind(this))
    
    // In production, could add remote logging transport
    if (!import.meta.env.DEV) {
      this.transports.push(this.remoteTransport.bind(this))
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    
    return levels[level] >= levels[this.minLevel]
  }

  private consoleTransport(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const context = entry.context ? JSON.stringify(entry.context) : ''
    
    switch (entry.level) {
      case 'debug':
        console.debug(`[DEBUG] ${timestamp} ${entry.message} ${context}`)
        break
      case 'info':
        console.info(`[INFO] ${timestamp} ${entry.message} ${context}`)
        break
      case 'warn':
        console.warn(`[WARN] ${timestamp} ${entry.message} ${context}`)
        break
      case 'error':
        console.error(`[ERROR] ${timestamp} ${entry.message} ${context}`)
        if (entry.stack) {
          console.error(entry.stack)
        }
        break
    }
  }

  private remoteTransport(): void {
    // In production, send logs to remote service
    // This is a placeholder - implement based on your logging infrastructure
    try {
      // Example: send to logging API
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // }).catch(() => {
      //   // Silent fail to prevent logging errors from breaking app
      // })
    } catch {
      // Silent fail to prevent logging errors from breaking app
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    }

    if (error && level === 'error') {
      entry.stack = error.stack
    }

    this.transports.forEach(transport => {
      try {
        transport(entry)
      } catch (transportError) {
        // Prevent transport errors from breaking logging
        console.error('Logger transport error:', transportError)
      }
    })
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('error', message, context, error)
  }

  // Specialized logging methods for common scenarios
  apiError(url: string, error: unknown, context?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    this.error(`API Error: ${url}`, { ...context, url, error: errorMessage }, error instanceof Error ? error : undefined)
  }

  authError(action: string, error: unknown, context?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    this.error(`Authentication Error: ${action}`, { ...context, action, error: errorMessage }, error instanceof Error ? error : undefined)
  }

  performanceWarning(component: string, duration: number, threshold: number): void {
    this.warn(`Performance Warning: ${component} took ${duration}ms (threshold: ${threshold}ms)`, { 
      component, 
      duration, 
      threshold 
    })
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }
}

// Create singleton instance
export const logger = new Logger()

// Convenience functions for easy importing
export const logDebug = logger.debug.bind(logger)
export const logInfo = logger.info.bind(logger)
export const logWarn = logger.warn.bind(logger)
export const logError = logger.error.bind(logger)