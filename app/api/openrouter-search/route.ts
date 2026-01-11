import { NextRequest, NextResponse } from "next/server"

/**
 * OpenRouter Native Search API
 *
 * Uses OpenRouter's web plugin to perform searches.
 * - For OpenAI, Anthropic, Perplexity, xAI models: Uses provider's native search
 * - For other models: Uses Exa API ($0.02 per 5-result search)
 *
 * This endpoint only requires an OpenRouter API key - no separate search API key needed.
 *
 * See: https://openrouter.ai/docs/guides/features/plugins/web-search
 */

interface SearchRequest {
  query: string
  maxResults?: number
  searchModel?: string
  includeCitations?: boolean
}

// Search cache to reduce duplicate searches
const searchCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SearchRequest
    const {
      query,
      maxResults = 5,
      searchModel = "google/gemini-2.0-flash-001",
      includeCitations = true,
    } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Get API key from environment or request headers
    const apiKey = process.env.OPENROUTER_API_KEY || req.headers.get("x-openrouter-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 401 })
    }

    // Check cache
    const cacheKey = `openrouter:${query}`
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[OpenRouter Search] Cache hit for: "${query}"`)
      return NextResponse.json(cached.result)
    }

    console.log(`[OpenRouter Search] Searching for: "${query}" via ${searchModel}`)

    // Create a search-optimized prompt
    const searchPrompt = `Search the web and provide current, accurate information about: "${query}"

Requirements:
1. Provide a direct, factual answer
2. Include key facts and details from reliable sources
${includeCitations ? "3. Cite your sources with URLs in markdown format: [Source Title](URL)" : ""}
4. Focus on the most recent and relevant information

Be factual, accurate, and cite your sources.`

    // Build the request body with web plugin enabled
    const requestBody = {
      model: searchModel,
      messages: [
        {
          role: "user",
          content: searchPrompt
        }
      ],
      max_tokens: 2048,
      temperature: 0.1,
      // OpenRouter native web search plugin
      plugins: [
        {
          id: "web",
          max_results: maxResults
        }
      ]
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Chameleon AI Chat - Search",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[OpenRouter Search] Error:`, response.status, errorText)
      return NextResponse.json(
        { error: `Search failed: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message
    const content = message?.content || "No search results found."

    // Parse sources from the response
    const results: any[] = []

    // First, check for OpenRouter's annotation format (url_citation objects)
    if (message?.annotations && Array.isArray(message.annotations)) {
      for (const annotation of message.annotations) {
        if (annotation.type === "url_citation" && results.length < maxResults) {
          results.push({
            title: annotation.title || annotation.url,
            url: annotation.url,
            content: annotation.content || "",
            score: 1 - results.length * 0.1,
          })
        }
      }
    }

    // Fallback: Parse markdown links from content
    if (results.length === 0) {
      const sourceRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g
      let match
      while ((match = sourceRegex.exec(content)) !== null && results.length < maxResults) {
        const url = match[2]
        if (!results.some(r => r.url === url)) {
          results.push({
            title: match[1],
            url: url,
            content: "",
            score: 1 - results.length * 0.1,
          })
        }
      }
    }

    const result = {
      results,
      answer: content,
      provider: "openrouter",
      model: searchModel,
    }

    // Cache the result
    searchCache.set(cacheKey, { result, timestamp: Date.now() })

    console.log(`[OpenRouter Search] Completed: ${results.length} sources found`)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[OpenRouter Search] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
