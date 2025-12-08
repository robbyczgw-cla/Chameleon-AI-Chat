import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

/**
 * GET /api/generation?id={generationId}
 * Fetches exact cost and token usage data from OpenRouter for a specific generation
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const generationId = searchParams.get("id")

  if (!generationId) {
    return NextResponse.json({ error: "Missing generation ID" }, { status: 400 })
  }

  const apiKey = request.headers.get("x-api-key") || process.env.OPENROUTER_API_KEY

  console.log(`[Generation] Request for ID: ${generationId}, apiKey: ${apiKey ? "provided (" + apiKey.slice(-4) + ")" : "missing"}`)

  if (!apiKey) {
    console.error(`[Generation] Missing API key - header: ${request.headers.get("x-api-key") ? "present" : "absent"}, env: ${process.env.OPENROUTER_API_KEY ? "present" : "absent"}`)
    return NextResponse.json({ error: "Missing API key" }, { status: 401 })
  }

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
      const errorText = await response.text()
      console.error(`[Generation] OpenRouter error:`, response.status, errorText)
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    // OpenRouter returns { data: { total_cost, ... } } - unwrap it
    const result = data.data || data
    console.log(`[Generation] Success for ${generationId}: total_cost=${result.total_cost}, provider=${result.provider_name}`)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[Generation] Error fetching generation data:", error)
    return NextResponse.json({ error: "Failed to fetch generation data" }, { status: 500 })
  }
}
