import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SharedChatView } from "@/components/shared-chat-view"
import type { Metadata } from "next"

interface SharePageProps {
  params: Promise<{ token: string }>
}

// Generate metadata for the shared chat
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .rpc("get_shared_chat", { p_share_token: token })

  if (!data || data.length === 0) {
    return {
      title: "Share Not Found - Chameleon AI",
    }
  }

  const chatTitle = data[0].share_title || data[0].chat_title || "Shared Chat"

  return {
    title: `${chatTitle} - Shared on Chameleon AI`,
    description: `View this shared conversation from Chameleon AI Chat`,
    openGraph: {
      title: chatTitle,
      description: "View this shared conversation from Chameleon AI Chat",
      type: "article",
    },
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Fetch the shared chat using the RPC function
  const { data, error } = await supabase
    .rpc("get_shared_chat", { p_share_token: token })

  if (error) {
    console.error("[SharePage] Error fetching shared chat:", error)
    notFound()
  }

  if (!data || data.length === 0) {
    notFound()
  }

  const row = data[0]

  const sharedChat = {
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
  }

  return <SharedChatView chat={sharedChat} shareToken={token} />
}
