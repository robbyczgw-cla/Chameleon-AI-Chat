import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimitAsync, getRateLimitHeaders, type RateLimitConfig } from "@/lib/rate-limit"

// Rate limit config for share token lookups: 20 requests per minute per IP
// This prevents brute-force token enumeration while allowing legitimate use
const SHARE_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowMs: 60 * 1000, // 1 minute
}

/**
 * GET /api/shares/[token]
 * Get a shared chat by its share token
 * This is a PUBLIC endpoint - no authentication required
 * Rate limited to prevent token enumeration attacks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               request.headers.get("x-real-ip") ||
               "anonymous"

    // Check rate limit
    const rateLimitResult = await checkRateLimitAsync(`share:${ip}`, SHARE_RATE_LIMIT)
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, SHARE_RATE_LIMIT)

    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders }
      )
    }

    const { token } = await params
    const supabase = await createClient()

    // Use the RPC function to get the shared chat (bypasses RLS)
    const { data, error } = await supabase
      .rpc("get_shared_chat", { p_share_token: token })

    if (error) {
      console.error("[API/shares/token] Error fetching shared chat:", error)
      return NextResponse.json({ error: "Failed to fetch shared chat" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Share not found, expired, or inactive" },
        { status: 404 }
      )
    }

    const row = data[0]

    return NextResponse.json({
      shareId: row.share_id,
      chatId: row.chat_id,
      shareTitle: row.share_title || null,
      chatTitle: row.chat_title,
      viewCount: row.view_count,
      createdAt: row.created_at,
      messages: (row.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        model: m.model || null,
        createdAt: m.created_at,
      })),
    })
  } catch (error) {
    console.error("[API/shares/token] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
