/**
 * Tests for API validation utilities
 */
import { describe, it, expect } from 'vitest'
import {
  validateSearchQuery,
  validateGenerationId,
  validateUUID,
  validateTextContent,
  validateUrl,
  validatePositiveInt,
  validateDomainArray,
  validateEnum,
} from './api-validation'

describe('validateSearchQuery', () => {
  it('accepts valid queries', () => {
    expect(validateSearchQuery('hello world')).toEqual({ success: true, data: 'hello world' })
    expect(validateSearchQuery('  trimmed  ')).toEqual({ success: true, data: 'trimmed' })
  })

  it('rejects non-strings', () => {
    expect(validateSearchQuery(null)).toEqual({ success: false, error: 'Query must be a string' })
    expect(validateSearchQuery(undefined)).toEqual({ success: false, error: 'Query must be a string' })
    expect(validateSearchQuery(123)).toEqual({ success: false, error: 'Query must be a string' })
    expect(validateSearchQuery({})).toEqual({ success: false, error: 'Query must be a string' })
  })

  it('rejects empty queries', () => {
    expect(validateSearchQuery('')).toEqual({ success: false, error: 'Query cannot be empty' })
    expect(validateSearchQuery('   ')).toEqual({ success: false, error: 'Query cannot be empty' })
  })

  it('rejects queries over 500 characters', () => {
    const longQuery = 'a'.repeat(501)
    expect(validateSearchQuery(longQuery)).toEqual({
      success: false,
      error: 'Query exceeds maximum length of 500 characters'
    })
  })

  it('accepts queries at exactly 500 characters', () => {
    const exactQuery = 'a'.repeat(500)
    const result = validateSearchQuery(exactQuery)
    expect(result.success).toBe(true)
    expect(result.data?.length).toBe(500)
  })

  it('removes control characters', () => {
    const result = validateSearchQuery('hello\x00world')
    expect(result.success).toBe(true)
    expect(result.data).toBe('helloworld')
  })
})

describe('validateGenerationId', () => {
  it('accepts valid generation IDs', () => {
    expect(validateGenerationId('gen-abc123')).toEqual({ success: true, data: 'gen-abc123' })
    expect(validateGenerationId('abc_123-def')).toEqual({ success: true, data: 'abc_123-def' })
  })

  it('rejects non-strings', () => {
    expect(validateGenerationId(null)).toEqual({ success: false, error: 'Generation ID must be a string' })
    expect(validateGenerationId(undefined)).toEqual({ success: false, error: 'Generation ID must be a string' })
  })

  it('rejects empty strings', () => {
    expect(validateGenerationId('')).toEqual({ success: false, error: 'Generation ID cannot be empty' })
    expect(validateGenerationId('   ')).toEqual({ success: false, error: 'Generation ID cannot be empty' })
  })

  it('rejects IDs with invalid characters', () => {
    expect(validateGenerationId('gen-abc!@#')).toEqual({
      success: false,
      error: 'Generation ID contains invalid characters'
    })
    expect(validateGenerationId('gen abc')).toEqual({
      success: false,
      error: 'Generation ID contains invalid characters'
    })
  })

  it('rejects IDs over 100 characters', () => {
    const longId = 'a'.repeat(101)
    expect(validateGenerationId(longId)).toEqual({
      success: false,
      error: 'Generation ID exceeds maximum length'
    })
  })
})

describe('validateUUID', () => {
  it('accepts valid UUIDs', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    expect(validateUUID(uuid)).toEqual({ success: true, data: uuid })
  })

  it('normalizes UUIDs to lowercase', () => {
    const uuid = '123E4567-E89B-12D3-A456-426614174000'
    expect(validateUUID(uuid)).toEqual({ success: true, data: uuid.toLowerCase() })
  })

  it('rejects invalid UUID formats', () => {
    expect(validateUUID('not-a-uuid')).toEqual({ success: false, error: 'Invalid ID format' })
    expect(validateUUID('123e4567-e89b-12d3-a456')).toEqual({ success: false, error: 'Invalid ID format' })
  })
})

describe('validateTextContent', () => {
  it('accepts valid text', () => {
    expect(validateTextContent('hello')).toEqual({ success: true, data: 'hello' })
  })

  it('rejects empty text', () => {
    expect(validateTextContent('')).toEqual({ success: false, error: 'Text cannot be empty' })
  })

  it('enforces custom max length', () => {
    expect(validateTextContent('hello', 3)).toEqual({
      success: false,
      error: 'Text exceeds maximum length of 3 characters'
    })
  })
})

describe('validateUrl', () => {
  it('accepts valid HTTP(S) URLs', () => {
    expect(validateUrl('https://example.com')).toEqual({ success: true, data: 'https://example.com/' })
    expect(validateUrl('http://example.com/path?query=1')).toMatchObject({ success: true })
  })

  it('rejects non-HTTP protocols', () => {
    expect(validateUrl('ftp://example.com')).toEqual({
      success: false,
      error: 'URL must use http or https protocol'
    })
    expect(validateUrl('javascript:alert(1)')).toMatchObject({ success: false })
  })

  it('rejects invalid URLs', () => {
    expect(validateUrl('not a url')).toEqual({ success: false, error: 'Invalid URL format' })
  })

  it('rejects URLs over 2048 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2030)
    expect(validateUrl(longUrl)).toEqual({
      success: false,
      error: 'URL exceeds maximum length of 2048 characters'
    })
  })
})

describe('validatePositiveInt', () => {
  it('accepts valid integers in range', () => {
    expect(validatePositiveInt(5, 1, 10)).toEqual({ success: true, data: 5 })
    expect(validatePositiveInt('5', 1, 10)).toEqual({ success: true, data: 5 })
  })

  it('rejects values outside range', () => {
    expect(validatePositiveInt(0, 1, 10)).toEqual({
      success: false,
      error: 'Value must be between 1 and 10'
    })
    expect(validatePositiveInt(11, 1, 10)).toEqual({
      success: false,
      error: 'Value must be between 1 and 10'
    })
  })

  it('rejects non-integers', () => {
    expect(validatePositiveInt(5.5, 1, 10)).toEqual({
      success: false,
      error: 'Value must be an integer'
    })
  })

  it('rejects non-numbers', () => {
    expect(validatePositiveInt('abc', 1, 10)).toEqual({
      success: false,
      error: 'Value must be a number'
    })
  })
})

describe('validateDomainArray', () => {
  it('accepts valid domain arrays', () => {
    expect(validateDomainArray(['example.com', 'test.org'])).toEqual({
      success: true,
      data: ['example.com', 'test.org']
    })
  })

  it('normalizes domains to lowercase', () => {
    expect(validateDomainArray(['EXAMPLE.COM'])).toEqual({
      success: true,
      data: ['example.com']
    })
  })

  it('rejects non-arrays', () => {
    expect(validateDomainArray('example.com')).toEqual({
      success: false,
      error: 'Domains must be an array'
    })
  })

  it('rejects arrays with more than 20 domains', () => {
    const domains = Array(21).fill('example.com')
    expect(validateDomainArray(domains)).toEqual({
      success: false,
      error: 'Maximum 20 domains allowed'
    })
  })

  it('rejects invalid domain formats', () => {
    expect(validateDomainArray(['not a domain'])).toMatchObject({ success: false })
    expect(validateDomainArray(['http://example.com'])).toMatchObject({ success: false })
  })
})

describe('validateEnum', () => {
  const ALLOWED = ['a', 'b', 'c'] as const

  it('accepts valid enum values', () => {
    expect(validateEnum('a', ALLOWED)).toEqual({ success: true, data: 'a' })
  })

  it('rejects invalid enum values', () => {
    expect(validateEnum('d', ALLOWED)).toEqual({
      success: false,
      error: 'Value must be one of: a, b, c'
    })
  })

  it('rejects non-strings', () => {
    expect(validateEnum(1, ALLOWED)).toEqual({
      success: false,
      error: 'Value must be a string'
    })
  })
})
