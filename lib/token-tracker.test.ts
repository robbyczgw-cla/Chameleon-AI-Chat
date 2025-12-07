import { describe, test, expect } from 'vitest'
import {
  estimateTokens,
  calculateCost,
  formatCost,
  formatTokens,
  getModelPricing,
} from './token-tracker'

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

  describe('getModelPricing', () => {
    test('returns pricing for known model', () => {
      const pricing = getModelPricing('gpt-4')
      expect(pricing).toBeDefined()
      expect(pricing.inputCost).toBeGreaterThan(0)
      expect(pricing.outputCost).toBeGreaterThan(0)
    })

    test('returns default pricing for unknown model', () => {
      const pricing = getModelPricing('unknown-model-xyz')
      expect(pricing).toEqual({
        inputCost: 1.0,
        outputCost: 2.0,
      })
    })

    test('handles partial model name matches', () => {
      // Should match "gpt-4" in "openai/gpt-4-turbo"
      const pricing = getModelPricing('openai/gpt-4-turbo')
      expect(pricing).toBeDefined()
    })
  })

  describe('calculateCost', () => {
    test('calculates cost for basic token usage', () => {
      // Using default pricing: $1/M input, $2/M output
      const cost = calculateCost(1000, 2000, 'unknown-model')
      // 1000/1M * $1 + 2000/1M * $2 = $0.001 + $0.004 = $0.005
      expect(cost).toBeCloseTo(0.005, 6)
    })

    test('calculates cost for zero tokens', () => {
      const cost = calculateCost(0, 0, 'gpt-4')
      expect(cost).toBe(0)
    })

    test('handles large token counts', () => {
      const cost = calculateCost(1_000_000, 500_000, 'unknown-model')
      // 1M/1M * $1 + 500k/1M * $2 = $1 + $1 = $2
      expect(cost).toBeCloseTo(2.0, 6)
    })

    test('cost increases with more tokens', () => {
      const cost1 = calculateCost(1000, 1000, 'unknown-model')
      const cost2 = calculateCost(2000, 2000, 'unknown-model')
      expect(cost2).toBeGreaterThan(cost1)
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

  describe('integration: full cost calculation flow', () => {
    test('estimates and calculates cost for a message', () => {
      const userMessage = 'What is the meaning of life?'
      const aiResponse = 'The meaning of life is a philosophical question that has been debated for centuries.'

      const inputTokens = estimateTokens(userMessage)
      const outputTokens = estimateTokens(aiResponse)
      const cost = calculateCost(inputTokens, outputTokens, 'gpt-4')
      const formattedCost = formatCost(cost)

      expect(inputTokens).toBeGreaterThan(0)
      expect(outputTokens).toBeGreaterThan(0)
      expect(cost).toBeGreaterThan(0)
      expect(formattedCost).toMatch(/^\$/) // Starts with $
    })
  })
})
