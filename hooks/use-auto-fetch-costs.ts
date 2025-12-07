import { useEffect, useRef } from "react"
import type { Message } from "@/types"

/**
 * Automatically fetches exact costs from OpenRouter's generation API
 * for messages that have a generationId but no actualCost yet.
 *
 * This runs in the background after the message is already displayed,
 * so it doesn't slow down the chat experience.
 */
export function useAutoFetchCosts(
  messages: Message[],
  onCostFetched: (messageId: string, costData: any) => void
) {
  const fetchedIds = useRef(new Set<string>())

  useEffect(() => {
    // Find messages that need cost fetching:
    // - Have a generationId
    // - Don't have actualCost yet
    // - Haven't been fetched before
    const messagesToFetch = messages.filter(
      (msg) =>
        msg.stats?.generationId &&
        !msg.stats?.actualCost &&
        !fetchedIds.current.has(msg.id)
    )

    if (messagesToFetch.length === 0) return

    // Fetch costs for each message
    messagesToFetch.forEach(async (msg) => {
      const generationId = msg.stats?.generationId
      if (!generationId) return

      // Mark as being fetched to avoid duplicates
      fetchedIds.current.add(msg.id)

      try {
        console.log(`[AutoFetchCosts] Fetching exact cost for message ${msg.id.slice(0, 8)}...`)

        const response = await fetch(`/api/generation?id=${generationId}`)

        if (!response.ok) {
          console.warn(`[AutoFetchCosts] Failed to fetch cost for ${msg.id.slice(0, 8)}:`, response.statusText)
          return
        }

        const data = await response.json()

        if (data.total_cost) {
          console.log(`[AutoFetchCosts] ✅ Fetched exact cost for ${msg.id.slice(0, 8)}: $${data.total_cost}`)

          // Call the callback to update the message
          onCostFetched(msg.id, {
            actualCost: data.total_cost,
            nativeTokensPrompt: data.native_tokens_prompt,
            nativeTokensCompletion: data.native_tokens_completion,
            nativeTokensCompletionReasoning: data.native_tokens_completion_reasoning,
            provider: data.provider_name,
            cacheCreationTokens: data.cache_creation_tokens,
            cacheReadTokens: data.cache_read_tokens,
          })
        }
      } catch (error) {
        console.error(`[AutoFetchCosts] Error fetching cost for ${msg.id.slice(0, 8)}:`, error)
      }
    })
  }, [messages, onCostFetched])
}
