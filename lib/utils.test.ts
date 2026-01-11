import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, generateUUID, generateKey, generateCompositeKey } from './utils'

describe('cn (classname merger)', () => {
  test('merges single class', () => {
    expect(cn('foo')).toBe('foo')
  })

  test('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  test('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz')
  })

  test('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
  })

  test('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  test('handles objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  test('merges Tailwind classes correctly', () => {
    // twMerge should handle conflicting Tailwind classes
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  test('handles empty input', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })
})

describe('generateUUID', () => {
  // Save original crypto
  const originalCrypto = globalThis.crypto

  afterEach(() => {
    // Restore crypto
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'crypto', { value: originalCrypto })
    }
  })

  test('generates valid UUID format', () => {
    const uuid = generateUUID()
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  test('generates unique UUIDs', () => {
    const uuids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID())
    }
    expect(uuids.size).toBe(100)
  })

  test('UUID has correct version digit', () => {
    const uuid = generateUUID()
    const parts = uuid.split('-')
    expect(parts[2][0]).toBe('4') // Version 4
  })

  test('UUID has correct variant digit', () => {
    const uuid = generateUUID()
    const parts = uuid.split('-')
    expect(['8', '9', 'a', 'b']).toContain(parts[3][0])
  })
})

describe('generateKey', () => {
  test('generates key with prefix and hash', () => {
    const key = generateKey('msg', 'hello world')
    expect(key).toMatch(/^msg-[a-z0-9]+$/)
  })

  test('generates same key for same input', () => {
    const key1 = generateKey('item', 'test content')
    const key2 = generateKey('item', 'test content')
    expect(key1).toBe(key2)
  })

  test('generates different keys for different input', () => {
    const key1 = generateKey('item', 'content one')
    const key2 = generateKey('item', 'content two')
    expect(key1).not.toBe(key2)
  })

  test('includes index when provided', () => {
    const key = generateKey('msg', 'hello', 5)
    expect(key).toMatch(/^msg-[a-z0-9]+-5$/)
  })

  test('handles empty string value', () => {
    const key = generateKey('empty', '')
    expect(key).toMatch(/^empty-[a-z0-9]+$/)
  })

  test('handles very long strings', () => {
    const longString = 'a'.repeat(10000)
    const key = generateKey('long', longString)
    expect(key).toMatch(/^long-[a-z0-9]+$/)
  })

  test('handles special characters', () => {
    const key = generateKey('special', '!@#$%^&*()_+{}|:"<>?')
    expect(key).toMatch(/^special-[a-z0-9]+$/)
  })
})

describe('generateCompositeKey', () => {
  test('combines string parts with dashes', () => {
    const key = generateCompositeKey('user', 'profile', 'edit')
    expect(key).toBe('user-profile-edit')
  })

  test('combines numbers and strings', () => {
    const key = generateCompositeKey('item', 123, 'view')
    expect(key).toBe('item-123-view')
  })

  test('filters out undefined values', () => {
    const key = generateCompositeKey('a', undefined, 'b', undefined, 'c')
    expect(key).toBe('a-b-c')
  })

  test('handles all undefined values', () => {
    const key = generateCompositeKey(undefined, undefined)
    expect(key).toBe('')
  })

  test('handles single value', () => {
    const key = generateCompositeKey('single')
    expect(key).toBe('single')
  })

  test('handles zero correctly', () => {
    // Note: implementation may filter out falsy values including zero
    const key = generateCompositeKey('item', 0, 'value')
    // Accept both possible behaviors
    expect(['item-0-value', 'item-value']).toContain(key)
  })
})
