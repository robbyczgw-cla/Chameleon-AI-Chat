import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

interface EmbeddingRequest {
  texts: string[]
  model?: string
}

/**
 * Embeddings API Route
 * Generates vector embeddings for text using OpenRouter's text-embedding-3-small model
 * Used for semantic search in Document Collections
 */
export async function POST(req: NextRequest) {
  try {
    const body: EmbeddingRequest = await req.json()
    const { texts, model = "openai/text-embedding-3-small" } = body

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: "texts array is required and must not be empty" },
        { status: 400 }
      )
    }

    // Validate text lengths (max 8192 tokens per text for text-embedding-3-small)
    const maxLength = 30000 // Roughly 8k tokens
    for (const text of texts) {
      if (text.length > maxLength) {
        return NextResponse.json(
          { error: `Text exceeds maximum length of ${maxLength} characters` },
          { status: 400 }
        )
      }
    }

    // Get API key from environment or request headers
    const apiKey = process.env.OPENROUTER_API_KEY || req.headers.get("x-openrouter-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 401 })
    }

    console.log(`[Embeddings] Generating embeddings for ${texts.length} text(s) using ${model}`)

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Chat Interface - Embeddings",
      },
      body: JSON.stringify({
        model,
        input: texts,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Embeddings] OpenRouter error:", response.status, errorText)
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json(
          { error: error.error?.message || "Embeddings API error" },
          { status: response.status }
        )
      } catch {
        return NextResponse.json(
          { error: errorText || "Embeddings API error" },
          { status: response.status }
        )
      }
    }

    const data = await response.json()
    console.log(`[Embeddings] Successfully generated ${data.data?.length || 0} embeddings`)

    // Extract embeddings from response
    const embeddings = data.data.map((item: any) => item.embedding)

    return NextResponse.json({
      embeddings,
      model: data.model,
      usage: data.usage,
    })
  } catch (error) {
    console.error("[Embeddings] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
