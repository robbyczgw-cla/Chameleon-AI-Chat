import { useEffect, useRef } from "react"
import type { Message } from "@/types"

/**
 * Automatically fetches exact costs from OpenRouter's generation API
 * for messages that have a generationId but no actualCost yet.
 *
 * This runs in the background after the message is already displayed,
 * so it doesn't slow down the chat experience.
 *
 * Includes retry logic with delay for 404 errors - OpenRouter needs
 * time to process generation data before it's queryable.
 */

const MAX_RETRIES = 3
const INITIAL_DELAY_BEFORE_FIRST_FETCH_MS = 1500 // Wait 1.5s before first attempt (OpenRouter needs time)
const RETRY_DELAY_MS = 2000 // Wait 2s before each retry
const BACKOFF_MULTIPLIER = 1.5 // 2s, 3s, 4.5s

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  messageId: string,
  retryCount = 0
): Promise<Response | null> {
  const response = await fetch(url, { headers })

  // If 404, OpenRouter may not have processed the generation yet - retry with delay
  if (response.status === 404 && retryCount < MAX_RETRIES) {
    const delay = RETRY_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, retryCount)
    console.log(`[AutoFetchCosts] 404 for ${messageId.slice(0, 8)} - OpenRouter data not ready, retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`)
    await new Promise(resolve => setTimeout(resolve, delay))
    return fetchWithRetry(url, headers, messageId, retryCount + 1)
  }

  return response
}

export function useAutoFetchCosts(
  messages: Message[],
  onCostFetched: (messageId: string, costData: any) => void,
  apiKey?: string
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

    // Skip if no API key available (can't fetch costs without it)
    if (!apiKey) {
      console.log("[AutoFetchCosts] Skipping - no API key available")
      return
    }

    // Fetch costs for each message
    messagesToFetch.forEach(async (msg) => {
      const generationId = msg.stats?.generationId
      if (!generationId) return

      // Mark as being fetched to avoid duplicates
      fetchedIds.current.add(msg.id)

      try {
        // Wait a bit before first fetch - OpenRouter needs time to process the generation
        console.log(`[AutoFetchCosts] Waiting ${INITIAL_DELAY_BEFORE_FIRST_FETCH_MS}ms before fetching cost for ${msg.id.slice(0, 8)}...`)
        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_BEFORE_FIRST_FETCH_MS))

        console.log(`[AutoFetchCosts] Fetching exact cost for message ${msg.id.slice(0, 8)} with genId=${generationId}, apiKey=${apiKey?.slice(-4) || "none"}...`)

        const headers: Record<string, string> = {}
        if (apiKey) {
          headers["x-api-key"] = apiKey
        }

        const response = await fetchWithRetry(`/api/generation?id=${generationId}`, headers, msg.id)

        if (!response || !response.ok) {
          const errorBody = response ? await response.text().catch(() => "") : "no response"
          console.warn(`[AutoFetchCosts] Failed to fetch cost for ${msg.id.slice(0, 8)}: status=${response?.status}, statusText="${response?.statusText}", body="${errorBody}", apiKey=${apiKey ? "provided" : "missing"}`)
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
  }, [messages, onCostFetched, apiKey])
}
