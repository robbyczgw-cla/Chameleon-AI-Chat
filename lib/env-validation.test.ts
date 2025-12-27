import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateEnv,
  getEnv,
  getRequiredEnv,
  isProduction,
  isDevelopment,
  isVercel,
  getEnvironment,
  getEnvSummary,
} from './env-validation'

describe('Environment Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateEnv', () => {
    it('should return validation result object', () => {
      const result = validateEnv()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('summary')
    })

    it('should report missing required variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = undefined
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined

      const result = validateEnv()
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should pass when required variables are set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

      const result = validateEnv()
      expect(result.errors.filter(e => e.includes('SUPABASE'))).toHaveLength(0)
    })

    it('should validate URL format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url'

      const result = validateEnv()
      expect(result.errors.some(e => e.includes('Invalid URL'))).toBe(true)
    })

    it('should throw on error when throwOnError is true', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = undefined
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined

      expect(() => validateEnv({ throwOnError: true })).toThrow()
    })
  })

  describe('getEnv', () => {
    it('should get string environment variable', () => {
      process.env.TEST_VAR = 'test-value'
      const result = getEnv('TEST_VAR')
      expect(result).toBe('test-value')
    })

    it('should get boolean environment variable', () => {
      process.env.TEST_BOOL = 'true'
      const result = getEnv<boolean>('TEST_BOOL', 'boolean')
      expect(result).toBe(true)
    })

    it('should get number environment variable', () => {
      process.env.TEST_NUM = '42'
      const result = getEnv<number>('TEST_NUM', 'number')
      expect(result).toBe(42)
    })

    it('should return undefined for missing variable', () => {
      const result = getEnv('NON_EXISTENT_VAR')
      expect(result).toBeUndefined()
    })
  })

  describe('getRequiredEnv', () => {
    it('should return value when variable exists', () => {
      process.env.REQUIRED_VAR = 'required-value'
      const result = getRequiredEnv('REQUIRED_VAR')
      expect(result).toBe('required-value')
    })

    it('should throw when variable is missing', () => {
      expect(() => getRequiredEnv('MISSING_REQUIRED')).toThrow()
    })
  })

  describe('Environment checks', () => {
    it('isProduction should check NODE_ENV', () => {
      process.env.NODE_ENV = 'production'
      expect(isProduction()).toBe(true)

      process.env.NODE_ENV = 'development'
      expect(isProduction()).toBe(false)
    })

    it('isDevelopment should check NODE_ENV', () => {
      process.env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)

      process.env.NODE_ENV = 'production'
      expect(isDevelopment()).toBe(false)
    })

    it('isVercel should check VERCEL env var', () => {
      process.env.VERCEL = undefined
      expect(isVercel()).toBe(false)

      process.env.VERCEL = '1'
      expect(isVercel()).toBe(true)
    })

    it('getEnvironment should return appropriate environment', () => {
      process.env.VERCEL_ENV = 'preview'
      expect(getEnvironment()).toBe('preview')

      process.env.VERCEL_ENV = undefined
      process.env.NODE_ENV = 'development'
      expect(getEnvironment()).toBe('development')
    })
  })

  describe('getEnvSummary', () => {
    it('should return object with boolean values', () => {
      const summary = getEnvSummary()
      expect(typeof summary).toBe('object')
      Object.values(summary).forEach(value => {
        expect(typeof value).toBe('boolean')
      })
    })

    it('should indicate which vars are set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      const summary = getEnvSummary()
      expect(summary.NEXT_PUBLIC_SUPABASE_URL).toBe(true)
    })
  })
})
