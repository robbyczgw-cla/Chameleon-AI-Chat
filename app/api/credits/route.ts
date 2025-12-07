import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

/**
 * GET /api/credits
 * Fetches remaining credits and rate limit info for the current API key
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 })
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Credits] OpenRouter error:`, response.status, errorText)
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[Credits] Error fetching credits:", error)
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
  }
}
