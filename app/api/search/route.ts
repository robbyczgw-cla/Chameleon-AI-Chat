import { type NextRequest, NextResponse } from "next/server"
import {
  validateSearchQuery,
  validatePositiveInt,
  validateEnum,
  validateDomainArray
} from "@/lib/api-validation"

export const runtime = "edge"

const SEARCH_DEPTHS = ["basic", "advanced"] as const
const TOPICS = ["general", "news"] as const

interface SearchRequest {
  query: string
  maxResults?: number
  searchDepth?: "basic" | "advanced"
  includeImages?: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
  includeRawContent?: boolean
  topic?: "general" | "news"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SearchRequest

    // Validate query
    const queryResult = validateSearchQuery(body.query)
    if (!queryResult.success) {
      return NextResponse.json({ error: queryResult.error }, { status: 400 })
    }
    const query = queryResult.data!

    // Validate maxResults (1-20)
    const maxResultsResult = validatePositiveInt(body.maxResults ?? 5, 1, 20, "maxResults")
    if (!maxResultsResult.success) {
      return NextResponse.json({ error: maxResultsResult.error }, { status: 400 })
    }
    const maxResults = maxResultsResult.data!

    // Validate searchDepth
    const searchDepthResult = validateEnum(body.searchDepth ?? "basic", SEARCH_DEPTHS, "searchDepth")
    if (!searchDepthResult.success) {
      return NextResponse.json({ error: searchDepthResult.error }, { status: 400 })
    }
    const searchDepth = searchDepthResult.data!

    // Validate topic
    const topicResult = validateEnum(body.topic ?? "general", TOPICS, "topic")
    if (!topicResult.success) {
      return NextResponse.json({ error: topicResult.error }, { status: 400 })
    }
    const topic = topicResult.data!

    // Validate domain arrays if provided
    let includeDomains: string[] | undefined
    let excludeDomains: string[] | undefined

    if (body.includeDomains) {
      const includeResult = validateDomainArray(body.includeDomains)
      if (!includeResult.success) {
        return NextResponse.json({ error: includeResult.error }, { status: 400 })
      }
      includeDomains = includeResult.data
    }

    if (body.excludeDomains) {
      const excludeResult = validateDomainArray(body.excludeDomains)
      if (!excludeResult.success) {
        return NextResponse.json({ error: excludeResult.error }, { status: 400 })
      }
      excludeDomains = excludeResult.data
    }

    const includeImages = Boolean(body.includeImages)
    const includeRawContent = Boolean(body.includeRawContent)

    const apiKey = process.env.TAVILY_API_KEY || req.headers.get("x-tavily-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "Tavily API key not configured" }, { status: 401 })
    }

    const requestBody: any = {
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_images: includeImages,
      include_answer: true,
      include_raw_content: includeRawContent,
      topic,
    }

    // Add domain filters if provided
    if (includeDomains && includeDomains.length > 0) {
      requestBody.include_domains = includeDomains
    }
    if (excludeDomains && excludeDomains.length > 0) {
      requestBody.exclude_domains = excludeDomains
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.error || "Tavily API error" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
