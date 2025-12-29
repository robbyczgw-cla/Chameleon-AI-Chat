/**
 * Web Search integration
 * Matches main app's lib/tavily.ts and app/api/search/route.ts
 */

export interface SearchResult {
  title: string
  url: string
  content: string
  score?: number
}

export interface TavilySearchResponse {
  query: string
  results: SearchResult[]
  answer?: string
  images?: string[]
  response_time?: number
}

export interface SearchRequest {
  query: string
  maxResults?: number
  searchDepth?: "basic" | "advanced"
  includeImages?: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
  includeRawContent?: boolean
  topic?: "general" | "news"
}

/**
 * Search using Tavily API (same as main app's /api/search route)
 * https://api.tavily.com/search
 */
export async function searchTavily(
  query: string,
  apiKey: string,
  options: Partial<SearchRequest> = {}
): Promise<TavilySearchResponse> {
  const {
    maxResults = 5,
    searchDepth = "basic",
    includeImages = false,
    includeDomains,
    excludeDomains,
    includeRawContent = false,
    topic = "general",
  } = options

  const requestBody: Record<string, any> = {
    api_key: apiKey,
    query,
    max_results: maxResults,
    search_depth: searchDepth,
    include_images: includeImages,
    include_answer: true,
    include_raw_content: includeRawContent,
    topic,
  }

  if (includeDomains && includeDomains.length > 0) {
    requestBody.include_domains = includeDomains
  }
  if (excludeDomains && excludeDomains.length > 0) {
    requestBody.exclude_domains = excludeDomains
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `Tavily API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Search using DuckDuckGo Instant Answer API (free, no key required)
 * Fallback when no Tavily key is provided
 */
export async function searchDuckDuckGo(query: string): Promise<TavilySearchResponse> {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    )

    if (!response.ok) {
      throw new Error("DuckDuckGo search failed")
    }

    const data = await response.json()
    const results: SearchResult[] = []

    // Add abstract if available
    if (data.Abstract) {
      results.push({
        title: data.Heading || "Summary",
        url: data.AbstractURL || "",
        content: data.Abstract,
      })
    }

    // Add related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 50),
            url: topic.FirstURL,
            content: topic.Text,
          })
        }
      }
    }

    return {
      query,
      results,
      answer: data.Answer || data.Abstract || undefined,
    }
  } catch (error) {
    console.error("[Search] DuckDuckGo error:", error)
    return { query, results: [] }
  }
}

/**
 * Format search results for AI context
 * Matches main app's search result formatting
 */
export function formatSearchResults(response: TavilySearchResponse): string {
  let context = ""

  if (response.answer) {
    context += `## AI Answer\n${response.answer}\n\n`
  }

  if (response.results.length > 0) {
    context += "## Search Results\n\n"
    for (let i = 0; i < response.results.length; i++) {
      const result = response.results[i]
      context += `### ${i + 1}. ${result.title}\n`
      context += `${result.content}\n`
      if (result.url) {
        context += `Source: ${result.url}\n`
      }
      context += "\n"
    }
  }

  return context || "No search results found."
}

// Backward compatibility alias
export const formatSearchResultsForAI = formatSearchResults

/**
 * Perform search and format for AI
 * Uses Tavily if key provided, otherwise DuckDuckGo
 */
export async function searchForAI(
  query: string,
  tavilyKey?: string,
  options?: Partial<SearchRequest>
): Promise<string> {
  const response = tavilyKey
    ? await searchTavily(query, tavilyKey, options)
    : await searchDuckDuckGo(query)

  return formatSearchResults(response)
}

/**
 * Serper (Google Search) API
 * Matches main app's lib/serper.ts
 */
export interface SerperResult {
  title: string
  link: string
  snippet: string
  position?: number
}

export interface SerperResponse {
  organic: SerperResult[]
  answerBox?: {
    answer?: string
    snippet?: string
    title?: string
  }
  knowledgeGraph?: {
    title?: string
    description?: string
  }
}

export async function searchSerper(
  query: string,
  apiKey: string,
  options: {
    num?: number
    gl?: string
    hl?: string
  } = {}
): Promise<TavilySearchResponse> {
  const { num = 5, gl = "us", hl = "en" } = options

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ q: query, num, gl, hl }),
  })

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`)
  }

  const data: SerperResponse = await response.json()

  // Convert to Tavily format for consistency
  const results: SearchResult[] = (data.organic || []).map((r) => ({
    title: r.title,
    url: r.link,
    content: r.snippet,
  }))

  let answer: string | undefined
  if (data.answerBox?.answer) {
    answer = data.answerBox.answer
  } else if (data.answerBox?.snippet) {
    answer = data.answerBox.snippet
  } else if (data.knowledgeGraph?.description) {
    answer = data.knowledgeGraph.description
  }

  return { query, results, answer }
}
