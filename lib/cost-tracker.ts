// Cost tracking and budgeting system for LLM usage

export interface CostEntry {
  id: string
  timestamp: number
  chatId: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number // in USD (DEPRECATED: use actualCost from OpenRouter API)
  searchProvider?: string
  searchCost?: number
  // Exact cost data from OpenRouter (when available)
  generationId?: string
  actualCost?: number // Exact cost from OpenRouter API
  nativeTokensPrompt?: number // Actual tokens used for billing
  nativeTokensCompletion?: number
  provider?: string // Which provider served the request (e.g., "Anthropic", "OpenAI")
  cacheDiscount?: number // Savings from prompt caching
  generationTime?: number // Time to generate in ms
}

export interface CostStats {
  totalCost: number
  totalTokens: number
  totalChats: number
  costByModel: Record<string, number>
  costByDay: Array<{ date: string; cost: number }>
  avgCostPerMessage: number
  totalActualCost?: number // Sum of all actualCost values (exact billing)
  totalEstimatedCost?: number // Sum of all estimated costs
  entriesWithActualCost?: number // How many entries have exact costs
  totalCacheDiscount?: number // Total savings from prompt caching
}

// NOTE: Cost tracking now uses EXACT costs from OpenRouter's generation API
// No more estimated pricing tables needed! See fetchGenerationData() below.

// Search API pricing (per search)
const SEARCH_PRICING: Record<string, number> = {
  tavily: 0.001,    // $1 per 1000 searches
  serper: 0.0002,   // $2 per 10,000 searches
  exa: 0.0005,      // $5 per 10,000 searches (2x cheaper than Tavily)
  youcom: 0.0,      // Free tier available
}

export class CostTracker {
  private entries: CostEntry[] = []
  private readonly STORAGE_KEY = "cost-tracker-entries"
  private readonly MAX_ENTRIES = 10000 // Keep last 10k entries

  constructor() {
    this.loadFromStorage()
  }

  // Track a new cost entry (use actualCost from OpenRouter's generation API)
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

  // Update entry with exact cost data from OpenRouter
  updateWithExactCost(entryId: string, generationData: GenerationData): void {
    const entry = this.entries.find((e) => e.id === entryId)
    if (!entry) return

    entry.generationId = generationData.id
    entry.actualCost = generationData.total_cost
    entry.nativeTokensPrompt = generationData.native_tokens_prompt
    entry.nativeTokensCompletion = generationData.native_tokens_completion
    entry.provider = generationData.provider
    entry.cacheDiscount = generationData.cache_discount
    entry.generationTime = generationData.generation_time

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

  // Calculate statistics (uses EXACT costs from OpenRouter API)
  getStats(timeRange?: { start: Date; end: Date }): CostStats {
    const relevantEntries = timeRange
      ? this.getEntriesInRange(timeRange.start, timeRange.end)
      : this.entries

    // Only use actual costs from OpenRouter
    const totalActualCost = relevantEntries.reduce(
      (sum, entry) => sum + (entry.actualCost || 0) + (entry.searchCost || 0),
      0
    )
    const entriesWithActualCost = relevantEntries.filter((e) => e.actualCost !== undefined).length
    const totalCacheDiscount = relevantEntries.reduce((sum, entry) => sum + (entry.cacheDiscount || 0), 0)

    // Use native tokens when available (actual billing tokens)
    const totalTokens = relevantEntries.reduce((sum, entry) => {
      if (entry.nativeTokensPrompt !== undefined && entry.nativeTokensCompletion !== undefined) {
        return sum + entry.nativeTokensPrompt + entry.nativeTokensCompletion
      }
      return sum + entry.totalTokens
    }, 0)

    const uniqueChats = new Set(relevantEntries.map((entry) => entry.chatId))

    // Cost by model (only actual costs)
    const costByModel: Record<string, number> = {}
    relevantEntries.forEach((entry) => {
      if (entry.actualCost !== undefined) {
        costByModel[entry.model] = (costByModel[entry.model] || 0) + entry.actualCost
      }
    })

    // Cost by day (only actual costs)
    const costByDay: Record<string, number> = {}
    relevantEntries.forEach((entry) => {
      if (entry.actualCost !== undefined) {
        const date = new Date(entry.timestamp).toISOString().split("T")[0]
        const cost = entry.actualCost + (entry.searchCost || 0)
        costByDay[date] = (costByDay[date] || 0) + cost
      }
    })

    const costByDayArray = Object.entries(costByDay)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalCost: totalActualCost,
      totalTokens,
      totalChats: uniqueChats.size,
      costByModel,
      costByDay: costByDayArray,
      avgCostPerMessage: relevantEntries.length > 0 ? totalActualCost / relevantEntries.length : 0,
      totalActualCost,
      totalEstimatedCost: 0, // No longer using estimates
      entriesWithActualCost,
      totalCacheDiscount,
    }
  }

  // Get cost for a specific chat (uses EXACT costs from OpenRouter API)
  getChatCost(chatId: string): number {
    return this.getChatEntries(chatId).reduce(
      (sum, entry) => sum + (entry.actualCost || 0) + (entry.searchCost || 0),
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

// Fetch exact generation data from OpenRouter
export interface GenerationData {
  id: string
  model: string
  total_cost: number
  tokens_prompt: number
  tokens_completion: number
  native_tokens_prompt: number
  native_tokens_completion: number
  generation_time?: number
  created_at?: number
  cache_discount?: number
  provider?: string
}

export async function fetchGenerationData(
  generationId: string,
  apiKey: string
): Promise<GenerationData | null> {
  try {
    const response = await fetch(
      `https://openrouter.ai/api/v1/generation?id=${generationId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      console.error(`[CostTracker] Failed to fetch generation data: ${response.status}`)
      return null
    }

    const data = await response.json()
    return data.data || null
  } catch (error) {
    console.error("[CostTracker] Error fetching generation data:", error)
    return null
  }
}
