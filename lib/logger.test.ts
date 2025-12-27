import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, loggers, createLogger, Logger } from './logger'

describe('Logger', () => {
  const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    group: vi.spyOn(console, 'group').mockImplementation(() => {}),
    groupCollapsed: vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {}),
    groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
    table: vi.spyOn(console, 'table').mockImplementation(() => {}),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Logger class', () => {
    it('should create a logger with default config', () => {
      const testLogger = new Logger()
      expect(testLogger).toBeInstanceOf(Logger)
    })

    it('should create a logger with custom prefix', () => {
      const testLogger = createLogger('TestModule')
      testLogger.enable() // Force enable for testing
      testLogger.debug('test message')
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[TestModule]'),
        expect.anything()
      )
    })

    it('should respect log levels', () => {
      const testLogger = new Logger({ enabled: true, minLevel: 'warn' })
      testLogger.debug('debug')
      testLogger.info('info')
      testLogger.warn('warn')
      testLogger.error('error')

      expect(consoleSpy.log).not.toHaveBeenCalled()
      expect(consoleSpy.info).not.toHaveBeenCalled()
      expect(consoleSpy.warn).toHaveBeenCalled()
      expect(consoleSpy.error).toHaveBeenCalled()
    })

    it('should handle enable/disable', () => {
      const testLogger = new Logger({ enabled: false })
      testLogger.warn('should not log')
      expect(consoleSpy.warn).not.toHaveBeenCalled()

      testLogger.enable()
      testLogger.warn('should log')
      expect(consoleSpy.warn).toHaveBeenCalled()

      testLogger.disable()
      testLogger.warn('should not log again')
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1)
    })

    it('should create child loggers with combined prefix', () => {
      const parentLogger = createLogger('Parent')
      const childLogger = parentLogger.child('Child')
      childLogger.enable()
      childLogger.debug('test')

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child]'),
        expect.anything()
      )
    })
  })

  describe('Performance timing', () => {
    it('should measure time between time() and timeEnd()', () => {
      const testLogger = new Logger({ enabled: true, minLevel: 'debug' })
      testLogger.time('test-timer')

      // Wait a bit
      const start = performance.now()
      while (performance.now() - start < 10) {
        // Busy wait for at least 10ms
      }

      const duration = testLogger.timeEnd('test-timer')
      expect(duration).toBeGreaterThanOrEqual(0)
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('test-timer'),
        expect.anything()
      )
    })

    it('should return null for non-existent timer', () => {
      const testLogger = new Logger({ enabled: true, minLevel: 'debug' })
      const result = testLogger.timeEnd('non-existent')
      expect(result).toBeNull()
    })
  })

  describe('Grouping', () => {
    it('should create collapsed groups by default', () => {
      const testLogger = new Logger({ enabled: true, minLevel: 'debug' })
      testLogger.group('Test Group')
      expect(consoleSpy.groupCollapsed).toHaveBeenCalled()
    })

    it('should create expanded groups when specified', () => {
      const testLogger = new Logger({ enabled: true, minLevel: 'debug' })
      testLogger.group('Test Group', false)
      expect(consoleSpy.group).toHaveBeenCalled()
    })

    it('should end groups correctly', () => {
      const testLogger = new Logger({ enabled: true, minLevel: 'debug' })
      testLogger.group('Test Group')
      testLogger.groupEnd()
      expect(consoleSpy.groupEnd).toHaveBeenCalled()
    })
  })

  describe('Table logging', () => {
    it('should log tables', () => {
      const testLogger = new Logger({ enabled: true, minLevel: 'debug' })
      const data = [{ a: 1, b: 2 }, { a: 3, b: 4 }]
      testLogger.table(data)
      expect(consoleSpy.table).toHaveBeenCalledWith(data)
    })
  })

  describe('Pre-configured loggers', () => {
    it('should have all expected module loggers', () => {
      expect(loggers.app).toBeInstanceOf(Logger)
      expect(loggers.memory).toBeInstanceOf(Logger)
      expect(loggers.chat).toBeInstanceOf(Logger)
      expect(loggers.api).toBeInstanceOf(Logger)
      expect(loggers.auth).toBeInstanceOf(Logger)
      expect(loggers.sync).toBeInstanceOf(Logger)
      expect(loggers.pwa).toBeInstanceOf(Logger)
      expect(loggers.search).toBeInstanceOf(Logger)
      expect(loggers.tools).toBeInstanceOf(Logger)
      expect(loggers.settings).toBeInstanceOf(Logger)
      expect(loggers.cost).toBeInstanceOf(Logger)
      expect(loggers.embedding).toBeInstanceOf(Logger)
      expect(loggers.voice).toBeInstanceOf(Logger)
      expect(loggers.rag).toBeInstanceOf(Logger)
      expect(loggers.persona).toBeInstanceOf(Logger)
    })

    it('should export default logger', () => {
      expect(logger).toBeInstanceOf(Logger)
    })
  })
})
