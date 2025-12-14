import { describe, test, expect } from 'vitest'
import { getImageSizeKB, needsCompression } from './image-utils'

describe('Image Utils', () => {
  describe('getImageSizeKB', () => {
    test('calculates size in KB for data URL', () => {
      const dataUrl = `data:image/png;base64,${  'A'.repeat(1024)}` // ~1KB
      const size = getImageSizeKB(dataUrl)
      expect(size).toBeGreaterThan(1)
      expect(size).toBeLessThan(2)
    })

    test('handles empty data URL', () => {
      const size = getImageSizeKB('')
      expect(size).toBe(0)
    })

    test('calculates size correctly for various sizes', () => {
      const small = `data:image/png;base64,${  'A'.repeat(512)}` // ~0.5KB
      const medium = `data:image/png;base64,${  'A'.repeat(10240)}` // ~10KB
      const large = `data:image/png;base64,${  'A'.repeat(102400)}` // ~100KB

      expect(getImageSizeKB(small)).toBeLessThan(1)
      expect(getImageSizeKB(medium)).toBeGreaterThan(10)
      expect(getImageSizeKB(medium)).toBeLessThan(11)
      expect(getImageSizeKB(large)).toBeGreaterThan(100)
      expect(getImageSizeKB(large)).toBeLessThan(101)
    })

    test('size increases with data URL length', () => {
      const small = 'data:image/png;base64,AAAA'
      const large = `data:image/png;base64,${  'A'.repeat(1000)}`

      expect(getImageSizeKB(large)).toBeGreaterThan(getImageSizeKB(small))
    })
  })

  describe('needsCompression', () => {
    test('returns true when image exceeds default 800KB', () => {
      const largeImage = `data:image/png;base64,${  'A'.repeat(820 * 1024)}` // > 800KB
      expect(needsCompression(largeImage)).toBe(true)
    })

    test('returns false when image is under default 800KB', () => {
      const smallImage = `data:image/png;base64,${  'A'.repeat(500 * 1024)}` // < 800KB
      expect(needsCompression(smallImage)).toBe(false)
    })

    test('respects custom maxSizeKB parameter', () => {
      const image = `data:image/png;base64,${  'A'.repeat(600 * 1024)}` // ~600KB

      expect(needsCompression(image, 500)).toBe(true) // > 500KB
      expect(needsCompression(image, 700)).toBe(false) // < 700KB
    })

    test('handles boundary case at exact size', () => {
      const image = `data:image/png;base64,${  'A'.repeat(800 * 1024)}` // Exactly 800KB
      const size = getImageSizeKB(image)

      // Should be very close to 800KB
      expect(size).toBeGreaterThanOrEqual(800)
      expect(needsCompression(image, 800)).toBe(true) // > 800KB (because of prefix)
    })

    test('handles empty image', () => {
      expect(needsCompression('')).toBe(false)
    })

    test('handles very small images', () => {
      const tiny = 'data:image/png;base64,ABC'
      expect(needsCompression(tiny)).toBe(false)
    })
  })

  describe('integration: size and compression check', () => {
    test('small image does not need compression', () => {
      const small = `data:image/png;base64,${  'A'.repeat(100 * 1024)}` // 100KB
      const size = getImageSizeKB(small)

      expect(size).toBeLessThan(800)
      expect(needsCompression(small)).toBe(false)
    })

    test('large image needs compression', () => {
      const large = `data:image/png;base64,${  'A'.repeat(1000 * 1024)}` // 1000KB
      const size = getImageSizeKB(large)

      expect(size).toBeGreaterThan(800)
      expect(needsCompression(large)).toBe(true)
    })

    test('threshold calculation is consistent', () => {
      const image = `data:image/png;base64,${  'A'.repeat(900 * 1024)}`
      const size = getImageSizeKB(image)
      const needs = needsCompression(image, size - 1) // Just below threshold

      expect(needs).toBe(true)
      expect(needsCompression(image, size + 1)).toBe(false) // Just above threshold
    })
  })

  describe('default parameters', () => {
    test('needsCompression uses 800KB as default', () => {
      // Create image slightly over 800KB
      const image = `data:image/png;base64,${  'A'.repeat(810 * 1024)}`

      // Should need compression with default
      expect(needsCompression(image)).toBe(true)

      // Should not need compression with higher threshold
      expect(needsCompression(image, 900)).toBe(false)
    })
  })
})
