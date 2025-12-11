import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/shares/[token]
 * Get a shared chat by its share token
 * This is a PUBLIC endpoint - no authentication required
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
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
