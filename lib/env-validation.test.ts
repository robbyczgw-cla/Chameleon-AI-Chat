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
  // Store original values of env vars we'll modify
  const originalEnvValues: Record<string, string | undefined> = {}
  const envKeysToReset = [
    'TEST_VAR', 'TEST_BOOL', 'TEST_NUM', 'REQUIRED_VAR',
    'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NODE_ENV', 'VERCEL', 'VERCEL_ENV'
  ]

  beforeEach(() => {
    // Save original values
    for (const key of envKeysToReset) {
      originalEnvValues[key] = process.env[key]
    }
  })

  afterEach(() => {
    // Restore original values
    for (const key of envKeysToReset) {
      if (originalEnvValues[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = originalEnvValues[key]
      }
    }
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
    // Note: In jsdom environment, window is defined, so only NEXT_PUBLIC_* vars are accessible
    it('should get string environment variable', () => {
      process.env.NEXT_PUBLIC_TEST_VAR = 'test-value'
      const result = getEnv('NEXT_PUBLIC_TEST_VAR')
      expect(result).toBe('test-value')
      delete process.env.NEXT_PUBLIC_TEST_VAR
    })

    it('should get boolean environment variable', () => {
      process.env.NEXT_PUBLIC_TEST_BOOL = 'true'
      const result = getEnv<boolean>('NEXT_PUBLIC_TEST_BOOL', 'boolean')
      expect(result).toBe(true)
      delete process.env.NEXT_PUBLIC_TEST_BOOL
    })

    it('should get number environment variable', () => {
      process.env.NEXT_PUBLIC_TEST_NUM = '42'
      const result = getEnv<number>('NEXT_PUBLIC_TEST_NUM', 'number')
      expect(result).toBe(42)
      delete process.env.NEXT_PUBLIC_TEST_NUM
    })

    it('should return undefined for missing variable', () => {
      const result = getEnv('NON_EXISTENT_VAR')
      expect(result).toBeUndefined()
    })
  })

  describe('getRequiredEnv', () => {
    it('should return value when variable exists', () => {
      process.env.NEXT_PUBLIC_REQUIRED_VAR = 'required-value'
      const result = getRequiredEnv('NEXT_PUBLIC_REQUIRED_VAR')
      expect(result).toBe('required-value')
      delete process.env.NEXT_PUBLIC_REQUIRED_VAR
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
      const originalVercel = process.env.VERCEL
      delete process.env.VERCEL
      expect(isVercel()).toBe(false)

      process.env.VERCEL = '1'
      expect(isVercel()).toBe(true)

      // Restore
      if (originalVercel) {
        process.env.VERCEL = originalVercel
      } else {
        delete process.env.VERCEL
      }
    })

    it('getEnvironment should return appropriate environment', () => {
      const originalVercelEnv = process.env.VERCEL_ENV
      const originalNodeEnv = process.env.NODE_ENV

      process.env.VERCEL_ENV = 'preview'
      expect(getEnvironment()).toBe('preview')

      delete process.env.VERCEL_ENV
      process.env.NODE_ENV = 'development'
      expect(getEnvironment()).toBe('development')

      // Restore
      if (originalVercelEnv) {
        process.env.VERCEL_ENV = originalVercelEnv
      }
      process.env.NODE_ENV = originalNodeEnv
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
