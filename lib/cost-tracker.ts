// Cost tracking and budgeting system for LLM usage

export interface CostEntry {
  id: string
  timestamp: number
  chatId: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number // in USD
  searchProvider?: string
  searchCost?: number
}

export interface CostStats {
  totalCost: number
  totalTokens: number
  totalChats: number
  costByModel: Record<string, number>
  costByDay: Array<{ date: string; cost: number }>
  avgCostPerMessage: number
}

// Model pricing (per 1M tokens) - OpenRouter standard format
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "x-ai/grok-4.1-fast": { input: 0.60, output: 2.0 },
  "x-ai/grok-4-fast": { input: 0.60, output: 2.0 },
  "x-ai/grok-4": { input: 3.0, output: 15.0 },
  "x-ai/grok-2": { input: 2.0, output: 10.0 },
  "anthropic/claude-4.5-sonnet-20250929": { input: 3.0, output: 15.0 },
  "anthropic/claude-3.5-sonnet": { input: 3.0, output: 15.0 },
  "anthropic/claude-haiku-4.5": { input: 0.80, output: 4.0 },
  "anthropic/claude-3.5-haiku": { input: 1.0, output: 5.0 },
  "openai/gpt-4o": { input: 2.50, output: 10.0 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.60 },
  "google/gemini-2.5-pro": { input: 1.25, output: 5.0 },
  "google/gemini-2.5-flash": { input: 0.075, output: 0.30 },
  "google/gemini-2.0-flash-exp": { input: 0.10, output: 0.70 },
  "deepseek/deepseek-chat": { input: 0.27, output: 1.10 },
  "deepseek/deepseek-chat-v3.2-experimental": { input: 0.27, output: 1.10 },
  "deepseek/deepseek-r1": { input: 0.55, output: 2.19 },
  "qwen/qwen3-235b-a22b-thinking-2507": { input: 1.0, output: 3.0 },
  // Add more models as needed
}

// Search API pricing (per search)
const SEARCH_PRICING = {
  tavily: 0.001, // $1 per 1000 searches
  serper: 0.0002, // $2 per 10,000 searches (10x cheaper!)
}

export class CostTracker {
  private entries: CostEntry[] = []
  private readonly STORAGE_KEY = "cost-tracker-entries"
  private readonly MAX_ENTRIES = 10000 // Keep last 10k entries

  constructor() {
    this.loadFromStorage()
  }

  // Calculate cost for a specific model and token usage
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING["x-ai/grok-4.1-fast"] // fallback

    // Pricing is per 1M tokens
    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output

    return inputCost + outputCost
  }

  // Track a new cost entry
  trackCost(entry: Omit<CostEntry, "id" | "timestamp">): void {
    const newEntry: CostEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }

    this.entries.unshift(newEntry) // Add to beginning

    // Keep only last MAX_ENTRIES
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries = this.entries.slice(0, this.MAX_ENTRIES)
    }

    this.saveToStorage()
  }

  // Get all entries
  getEntries(): CostEntry[] {
    return this.entries
  }

  // Get entries for a specific chat
  getChatEntries(chatId: string): CostEntry[] {
    return this.entries.filter((entry) => entry.chatId === chatId)
  }

  // Get entries within a date range
  getEntriesInRange(startDate: Date, endDate: Date): CostEntry[] {
    const start = startDate.getTime()
    const end = endDate.getTime()
    return this.entries.filter((entry) => entry.timestamp >= start && entry.timestamp <= end)
  }

  // Calculate statistics
  getStats(timeRange?: { start: Date; end: Date }): CostStats {
    const relevantEntries = timeRange
      ? this.getEntriesInRange(timeRange.start, timeRange.end)
      : this.entries

    const totalCost = relevantEntries.reduce((sum, entry) => sum + entry.cost + (entry.searchCost || 0), 0)
    const totalTokens = relevantEntries.reduce((sum, entry) => sum + entry.totalTokens, 0)
    const uniqueChats = new Set(relevantEntries.map((entry) => entry.chatId))

    // Cost by model
    const costByModel: Record<string, number> = {}
    relevantEntries.forEach((entry) => {
      costByModel[entry.model] = (costByModel[entry.model] || 0) + entry.cost
    })

    // Cost by day
    const costByDay: Record<string, number> = {}
    relevantEntries.forEach((entry) => {
      const date = new Date(entry.timestamp).toISOString().split("T")[0]
      costByDay[date] = (costByDay[date] || 0) + entry.cost + (entry.searchCost || 0)
    })

    const costByDayArray = Object.entries(costByDay)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalCost,
      totalTokens,
      totalChats: uniqueChats.size,
      costByModel,
      costByDay: costByDayArray,
      avgCostPerMessage: relevantEntries.length > 0 ? totalCost / relevantEntries.length : 0,
    }
  }

  // Get cost for a specific chat
  getChatCost(chatId: string): number {
    return this.getChatEntries(chatId).reduce(
      (sum, entry) => sum + entry.cost + (entry.searchCost || 0),
      0,
    )
  }

  // Clear all entries
  clearAll(): void {
    this.entries = []
    this.saveToStorage()
  }

  // Clear entries older than X days
  clearOlderThan(days: number): void {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    this.entries = this.entries.filter((entry) => entry.timestamp >= cutoff)
    this.saveToStorage()
  }

  // Export to JSON
  exportToJSON(): string {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalEntries: this.entries.length,
        entries: this.entries,
      },
      null,
      2,
    )
  }

  // Private methods for persistence
  private loadFromStorage(): void {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.entries = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[CostTracker] Failed to load from storage:", error)
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries))
    } catch (error) {
      console.error("[CostTracker] Failed to save to storage:", error)
    }
  }
}

// Singleton instance
let costTrackerInstance: CostTracker | null = null

export function getCostTracker(): CostTracker {
  if (!costTrackerInstance) {
    costTrackerInstance = new CostTracker()
  }
  return costTrackerInstance
}

// Helper to get search cost
export function getSearchCost(provider: "tavily" | "serper"): number {
  return SEARCH_PRICING[provider] || 0
}
