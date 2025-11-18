// Token estimation and cost calculation utilities

interface ModelPricing {
  inputCost: number // Cost per million tokens
  outputCost: number // Cost per million tokens
}

// OpenRouter pricing (as of January 2025)
const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI Models
  "openai/gpt-4o": { inputCost: 5.0, outputCost: 20.0 },
  "openai/gpt-4o-mini": { inputCost: 0.15, outputCost: 0.6 },
  "openai/gpt-4-turbo": { inputCost: 10.0, outputCost: 30.0 },
  "openai/gpt-4": { inputCost: 30.0, outputCost: 60.0 },
  "openai/gpt-3.5-turbo": { inputCost: 0.5, outputCost: 1.5 },

  // Anthropic Models
  "anthropic/claude-3.5-sonnet": { inputCost: 3.0, outputCost: 15.0 },
  "anthropic/claude-3-opus": { inputCost: 15.0, outputCost: 75.0 },
  "anthropic/claude-3-sonnet": { inputCost: 3.0, outputCost: 15.0 },
  "anthropic/claude-3-haiku": { inputCost: 0.25, outputCost: 1.25 },

  // Google Models
  "google/gemini-pro": { inputCost: 0.5, outputCost: 1.5 },
  "google/gemini-pro-1.5": { inputCost: 1.25, outputCost: 5.0 },

  // Meta Models
  "meta-llama/llama-3.1-405b-instruct": { inputCost: 0.80, outputCost: 0.80 },
  "meta-llama/llama-3.1-70b-instruct": { inputCost: 0.10, outputCost: 0.28 },
  "meta-llama/llama-3.1-8b-instruct": { inputCost: 0.06, outputCost: 0.06 },

  // xAI Models (updated 2025-01)
  "x-ai/grok-beta": { inputCost: 5.0, outputCost: 15.0 },
  "x-ai/grok-4-fast": { inputCost: 0.60, outputCost: 2.0 }, // Updated from OpenRouter actual pricing
  "x-ai/grok-4": { inputCost: 0.60, outputCost: 2.0 },
  "xai/grok-4": { inputCost: 0.60, outputCost: 2.0 },
  "xai/grok-4-fast": { inputCost: 0.60, outputCost: 2.0 },

  // Default fallback
  default: { inputCost: 1.0, outputCost: 2.0 },
}

/**
 * Estimate token count for text (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Get pricing for a model
 */
export function getModelPricing(model: string): ModelPricing {
  // Try exact match first
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model]
  }

  // Try partial match (e.g., "gpt-4" in "openai/gpt-4-turbo")
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.includes(key) || key.includes(model)) {
      return pricing
    }
  }

  return MODEL_PRICING.default
}

/**
 * Calculate cost for token usage
 */
export function calculateCost(promptTokens: number, completionTokens: number, model: string): number {
  const pricing = getModelPricing(model)

  const inputCost = (promptTokens / 1_000_000) * pricing.inputCost
  const outputCost = (completionTokens / 1_000_000) * pricing.outputCost

  return inputCost + outputCost
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`
  }
  return `$${cost.toFixed(4)}`
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}
