/**
 * Web Search integration
 * Uses DuckDuckGo Instant Answer API (free, no key required)
 * For more advanced search, can use Tavily/Exa with user's API key
 */

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface SearchResponse {
  results: SearchResult[]
  answer?: string
  source?: string
}

/**
 * Search using DuckDuckGo Instant Answer API
 * Free, no API key required, but limited to instant answers
 */
export async function searchDuckDuckGo(query: string): Promise<SearchResponse> {
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
        snippet: data.Abstract,
      })
    }

    // Add related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || topic.Text.slice(0, 50),
            url: topic.FirstURL,
            snippet: topic.Text,
          })
        }
      }
    }

    return {
      results,
      answer: data.Answer || data.Abstract || undefined,
      source: data.AbstractSource || undefined,
    }
  } catch (error) {
    console.error("[Search] DuckDuckGo error:", error)
    return { results: [] }
  }
}

/**
 * Search using Tavily API (requires API key)
 * More comprehensive web search with summaries
 */
export async function searchTavily(
  query: string,
  apiKey: string,
  options: {
    searchDepth?: "basic" | "advanced"
    maxResults?: number
    includeAnswer?: boolean
  } = {}
): Promise<SearchResponse> {
  const { searchDepth = "basic", maxResults = 5, includeAnswer = true } = options

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: searchDepth,
        max_results: maxResults,
        include_answer: includeAnswer,
      }),
    })

    if (!response.ok) {
      throw new Error("Tavily search failed")
    }

    const data = await response.json()

    const results: SearchResult[] = (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }))

    return {
      results,
      answer: data.answer,
    }
  } catch (error) {
    console.error("[Search] Tavily error:", error)
    return { results: [] }
  }
}

/**
 * Format search results for AI context
 */
export function formatSearchResultsForAI(response: SearchResponse): string {
  let context = ""

  if (response.answer) {
    context += `**Answer:** ${response.answer}\n\n`
  }

  if (response.results.length > 0) {
    context += "**Search Results:**\n"
    for (const result of response.results) {
      context += `- **${result.title}**: ${result.snippet}\n`
      if (result.url) {
        context += `  Source: ${result.url}\n`
      }
    }
  }

  return context || "No search results found."
}

/**
 * Perform search and format for AI
 */
export async function searchForAI(
  query: string,
  tavilyKey?: string
): Promise<string> {
  // Use Tavily if key provided, otherwise DuckDuckGo
  const response = tavilyKey
    ? await searchTavily(query, tavilyKey)
    : await searchDuckDuckGo(query)

  return formatSearchResultsForAI(response)
}
