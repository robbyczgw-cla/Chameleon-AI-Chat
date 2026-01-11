/**
 * Unified Search Types
 * Single source of truth for all search providers
 */

// Base search result - common across all providers
export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
  publishedDate?: string
  highlights?: string[]
  summary?: string
  image?: string
  author?: string
}

// Unified search response
export interface SearchResponse {
  query: string
  answer: string
  results: SearchResult[]
  images?: string[]
  responseTime: number
  provider: SearchProvider
  metadata?: {
    autoprompt?: string      // Exa
    searchType?: string      // Exa
    knowledgeGraph?: any     // Serper
    answerBox?: any          // Serper
  }
}

// Available search providers
// "openrouter" uses OpenRouter's built-in search via search-enabled models (no extra API key needed)
export type SearchProvider = "openrouter" | "tavily" | "serper" | "exa"

// Base search options - common across providers
export interface BaseSearchOptions {
  maxResults?: number
  includeDomains?: string[]
  excludeDomains?: string[]
  apiKey?: string
}

// Provider-specific options
export interface TavilySearchOptions extends BaseSearchOptions {
  searchDepth?: "basic" | "advanced"
  includeImages?: boolean
  includeRawContent?: boolean
  topic?: "general" | "news"
}

export interface SerperSearchOptions extends BaseSearchOptions {
  includeImages?: boolean
  country?: string
  language?: string
  type?: "search" | "images" | "news" | "videos" | "places" | "shopping"
  timeRange?: "none" | "hour" | "day" | "week" | "month" | "year"
  autocorrect?: boolean
}

export interface ExaSearchOptions extends BaseSearchOptions {
  type?: "neural" | "keyword" | "auto"
  useAutoprompt?: boolean
  category?: "company" | "research paper" | "news" | "pdf" | "github" | "tweet" | "personal site" | "linkedin profile" | "financial report"
  includeFullText?: boolean
  includeHighlights?: boolean
  includeSummary?: boolean
  includeImages?: boolean // Include images from results
  highlightsPerResult?: number
  maxTextCharacters?: number
  livecrawl?: "never" | "fallback" | "always"
}

/**
 * OpenRouter Native Search Options
 * Uses search-enabled models on OpenRouter (like Perplexity Sonar)
 * No separate API key required - uses your OpenRouter API key
 */
export interface OpenRouterSearchOptions extends BaseSearchOptions {
  searchModel?: string // Model to use (default: perplexity/sonar-small-online)
  includeImages?: boolean // Request images in response
  includeCitations?: boolean // Include source citations
  openRouterApiKey?: string // OpenRouter API key for authentication
}

// Union type for all search options
export type SearchOptions = TavilySearchOptions | SerperSearchOptions | ExaSearchOptions | OpenRouterSearchOptions

// Search provider interface - all providers must implement this
export interface SearchProviderInterface {
  name: SearchProvider
  search(query: string, options?: SearchOptions): Promise<SearchResponse>
}
