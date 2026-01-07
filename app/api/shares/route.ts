import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/shares
 * Create a new share for a chat
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { chatId, title, expiresAt } = body

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 })
    }

    // Verify the user owns this chat
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 })
    }

    // Generate a cryptographically secure share token
    // Using Web Crypto API instead of Math.random() for security
    // Increased from 12 to 16 chars for ~95 bits of entropy
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const tokenLength = 16
    const randomValues = new Uint32Array(tokenLength)
    crypto.getRandomValues(randomValues)
    const shareToken = Array.from(randomValues)
      .map(val => chars.charAt(val % chars.length))
      .join('')

    const now = new Date().toISOString()

    // Create the share
    const { data: share, error: shareError } = await supabase
      .from("chat_shares")
      .insert({
        chat_id: chatId,
        owner_id: user.id,
        share_token: shareToken,
        title: title || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: true,
        view_count: 0,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (shareError) {
      console.error("[API/shares] Error creating share:", shareError)
      return NextResponse.json({ error: "Failed to create share" }, { status: 500 })
    }

    return NextResponse.json({
      id: share.id,
      chatId: share.chat_id,
      shareToken: share.share_token,
      title: share.title,
      expiresAt: share.expires_at,
      isActive: share.is_active,
      viewCount: share.view_count,
      createdAt: share.created_at,
    })
  } catch (error) {
    console.error("[API/shares] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * GET /api/shares
 * Get all shares for the authenticated user
 * Optional query param: ?chatId=xxx to filter by chat
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    let query = supabase
      .from("chat_shares")
      .select(`
        *,
        chats:chat_id (title)
      `)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })

    if (chatId) {
      query = query.eq("chat_id", chatId)
    }

    const { data: shares, error: sharesError } = await query

    if (sharesError) {
      console.error("[API/shares] Error fetching shares:", sharesError)
      return NextResponse.json({ error: "Failed to fetch shares" }, { status: 500 })
    }

    return NextResponse.json(
      shares.map((share: any) => ({
        id: share.id,
        chatId: share.chat_id,
        chatTitle: share.chats?.title || "Untitled Chat",
        shareToken: share.share_token,
        title: share.title,
        expiresAt: share.expires_at,
        isActive: share.is_active,
        viewCount: share.view_count,
        createdAt: share.created_at,
        updatedAt: share.updated_at,
      }))
    )
  } catch (error) {
    console.error("[API/shares] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/shares
 * Delete a share by ID
 * Body: { shareId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { shareId } = body

    if (!shareId) {
      return NextResponse.json({ error: "shareId is required" }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from("chat_shares")
      .delete()
      .eq("id", shareId)
      .eq("owner_id", user.id)

    if (deleteError) {
      console.error("[API/shares] Error deleting share:", deleteError)
      return NextResponse.json({ error: "Failed to delete share" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API/shares] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/shares
 * Update a share (toggle active, update title)
 * Body: { shareId: string, isActive?: boolean, title?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { shareId, isActive, title } = body

    if (!shareId) {
      return NextResponse.json({ error: "shareId is required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (isActive !== undefined) updateData.is_active = isActive
    if (title !== undefined) updateData.title = title

    const { data: share, error: updateError } = await supabase
      .from("chat_shares")
      .update(updateData)
      .eq("id", shareId)
      .eq("owner_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("[API/shares] Error updating share:", updateError)
      return NextResponse.json({ error: "Failed to update share" }, { status: 500 })
    }

    return NextResponse.json({
      id: share.id,
      chatId: share.chat_id,
      shareToken: share.share_token,
      title: share.title,
      expiresAt: share.expires_at,
      isActive: share.is_active,
      viewCount: share.view_count,
      createdAt: share.created_at,
      updatedAt: share.updated_at,
    })
  } catch (error) {
    console.error("[API/shares] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
