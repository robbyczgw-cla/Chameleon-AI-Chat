import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

/**
 * Multimodal content support for vision models
 */
interface MessageContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: {
    url: string
    detail?: "auto" | "low" | "high"
  }
}

type MessageContent = string | MessageContentPart[]

interface Message {
  role: "user" | "assistant" | "system"
  content: MessageContent // Now supports both string and multimodal array
}

interface ChatRequest {
  messages: Message[]
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stream?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("[v0] API route - full request body:", JSON.stringify(body).substring(0, 200))

    const {
      messages,
      model,
      temperature = 0.7,
      maxTokens: requestedMaxTokens = 16000,
      topP = 1.0,
      frequencyPenalty = 0,
      presencePenalty = 0,
      stream = false,
    } = body as ChatRequest

    const maxTokens = Math.max(requestedMaxTokens || 16000, 16000)

    console.log("[v0] ===== API ROUTE CALLED =====")
    console.log("[v0] API route - model:", model)
    console.log("[v0] API route - requested maxTokens:", requestedMaxTokens)
    console.log("[v0] API route - FINAL ENFORCED maxTokens:", maxTokens, " <<<< THIS GOES TO OPENROUTER")
    console.log("[v0] API route - temperature:", temperature)
    console.log("[v0] API route - topP:", topP)
    console.log("[v0] API route - frequencyPenalty:", frequencyPenalty)
    console.log("[v0] API route - presencePenalty:", presencePenalty)
    console.log("[v0] API route - stream:", stream)

    // Get API key from environment or request headers
    const apiKey = process.env.OPENROUTER_API_KEY || req.headers.get("x-openrouter-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 401 })
    }

    const openRouterBody = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream,
    }

    console.log("[v0] ===== SENDING TO OPENROUTER =====")
    console.log("[v0] OpenRouter request body:", JSON.stringify(openRouterBody, null, 2))

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Chat Interface",
      },
      body: JSON.stringify(openRouterBody),
    })

    console.log("[v0] OpenRouter response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] OpenRouter error:", response.status, errorText)
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json({ error: error.error?.message || "OpenRouter API error" }, { status: response.status })
      } catch {
        return NextResponse.json({ error: errorText || "OpenRouter API error" }, { status: response.status })
      }
    }

    if (stream) {
      console.log("[v0] Returning streaming response")
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
