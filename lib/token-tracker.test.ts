import { describe, test, expect } from 'vitest'
import {
  estimateTokens,
  formatCost,
  formatTokens,
} from './token-tracker'

// NOTE: calculateCost and getModelPricing removed - now using exact costs from OpenRouter API

describe('Token Tracker', () => {
  describe('estimateTokens', () => {
    test('estimates tokens for simple text', () => {
      const text = 'Hello, world!' // 13 characters
      const tokens = estimateTokens(text)
      expect(tokens).toBe(4) // ceil(13/4) = 4
    })

    test('estimates tokens for longer text', () => {
      const text = 'a'.repeat(100) // 100 characters
      const tokens = estimateTokens(text)
      expect(tokens).toBe(25) // ceil(100/4) = 25
    })

    test('handles empty string', () => {
      const tokens = estimateTokens('')
      expect(tokens).toBe(0)
    })

    test('rounds up for partial tokens', () => {
      const text = 'Hi!' // 3 characters
      const tokens = estimateTokens(text)
      expect(tokens).toBe(1) // ceil(3/4) = 1
    })
  })



  describe('formatCost', () => {
    test('formats small costs in cents', () => {
      expect(formatCost(0.005)).toBe('$0.5000¢')
      expect(formatCost(0.001)).toBe('$0.1000¢')
    })

    test('formats larger costs in dollars', () => {
      expect(formatCost(0.05)).toBe('$0.0500')
      expect(formatCost(1.23)).toBe('$1.2300')
    })

    test('handles zero cost', () => {
      expect(formatCost(0)).toBe('$0.0000¢')
    })

    test('handles boundary case at $0.01', () => {
      expect(formatCost(0.01)).toBe('$0.0100')
    })
  })

  describe('formatTokens', () => {
    test('formats small token counts as-is', () => {
      expect(formatTokens(100)).toBe('100')
      expect(formatTokens(999)).toBe('999')
    })

    test('formats large token counts with K suffix', () => {
      expect(formatTokens(1000)).toBe('1.0K')
      expect(formatTokens(1500)).toBe('1.5K')
      expect(formatTokens(10000)).toBe('10.0K')
    })

    test('handles zero tokens', () => {
      expect(formatTokens(0)).toBe('0')
    })

    test('rounds to one decimal place', () => {
      expect(formatTokens(1234)).toBe('1.2K')
      expect(formatTokens(5678)).toBe('5.7K')
    })
  })

})
