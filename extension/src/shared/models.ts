/**
 * AI Models available through OpenRouter
 * Curated list of popular models for extension
 */

export interface Model {
  id: string
  name: string
  provider: string
  description: string
  context: number
  costPer1k?: number // USD per 1k tokens (approx)
  category: "fast" | "balanced" | "powerful" | "specialized"
}

export const MODELS: Model[] = [
  // Fast & Cheap
  {
    id: "anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Fast & cheap, great for quick tasks",
    context: 200000,
    costPer1k: 0.00025,
    category: "fast",
  },
  {
    id: "google/gemini-flash-1.5",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    description: "Very fast with huge context",
    context: 1000000,
    costPer1k: 0.000075,
    category: "fast",
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and affordable GPT-4",
    context: 128000,
    costPer1k: 0.00015,
    category: "fast",
  },

  // Balanced
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Best balance of speed & quality",
    context: 200000,
    costPer1k: 0.003,
    category: "balanced",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "OpenAI's flagship multimodal",
    context: 128000,
    costPer1k: 0.005,
    category: "balanced",
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    description: "Powerful with 1M context",
    context: 1000000,
    costPer1k: 0.00125,
    category: "balanced",
  },

  // Powerful
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Most capable Claude model",
    context: 200000,
    costPer1k: 0.015,
    category: "powerful",
  },
  {
    id: "openai/o1-preview",
    name: "OpenAI o1 Preview",
    provider: "OpenAI",
    description: "Advanced reasoning model",
    context: 128000,
    costPer1k: 0.015,
    category: "powerful",
  },
  {
    id: "openai/o1-mini",
    name: "OpenAI o1 Mini",
    provider: "OpenAI",
    description: "Faster reasoning model",
    context: 128000,
    costPer1k: 0.003,
    category: "powerful",
  },

  // Specialized / Open Source
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B",
    provider: "Meta",
    description: "Powerful open-source model",
    context: 131072,
    costPer1k: 0.0004,
    category: "specialized",
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    description: "Best Mistral model",
    context: 128000,
    costPer1k: 0.002,
    category: "specialized",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    description: "Great for coding tasks",
    context: 64000,
    costPer1k: 0.00014,
    category: "specialized",
  },
  {
    id: "qwen/qwen-2.5-72b-instruct",
    name: "Qwen 2.5 72B",
    provider: "Alibaba",
    description: "Powerful multilingual model",
    context: 131072,
    costPer1k: 0.0004,
    category: "specialized",
  },
]

export const MODEL_CATEGORIES = [
  { id: "fast", name: "Fast & Cheap", emoji: "⚡" },
  { id: "balanced", name: "Balanced", emoji: "⚖️" },
  { id: "powerful", name: "Powerful", emoji: "💪" },
  { id: "specialized", name: "Specialized", emoji: "🎯" },
]

export function getModelById(id: string): Model | undefined {
  return MODELS.find((m) => m.id === id)
}

export function getDefaultModel(): Model {
  return MODELS.find((m) => m.id === "anthropic/claude-3.5-sonnet") || MODELS[0]
}

export function getModelsByCategory(category: Model["category"]): Model[] {
  return MODELS.filter((m) => m.category === category)
}
