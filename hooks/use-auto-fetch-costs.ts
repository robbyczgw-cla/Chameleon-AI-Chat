import { useEffect, useRef } from "react"
import type { Message } from "@/types"

/**
 * Automatically fetches exact costs from OpenRouter's generation API
 * for messages that have a generationId but no actualCost yet.
 *
 * Now supports multiple generation IDs for tool calling - fetches costs
 * for ALL generations and sums them up.
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

interface GenerationData {
  total_cost?: number
  native_tokens_prompt?: number
  native_tokens_completion?: number
  native_tokens_completion_reasoning?: number
  provider_name?: string
  cache_creation_tokens?: number
  cache_read_tokens?: number
  // Performance metrics from OpenRouter (raw)
  generation_time?: number // Total generation time in ms
  latency?: number // First token latency in ms
  finish_reason?: string
  // OpenRouter field names (they use 'usage' not 'total_cost' in some responses)
  usage?: number
}

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

async function fetchGenerationData(
  generationId: string,
  headers: Record<string, string>,
  messageId: string
): Promise<GenerationData | null> {
  try {
    const response = await fetchWithRetry(`/api/generation?id=${generationId}`, headers, messageId)

    if (!response || !response.ok) {
      console.warn(`[AutoFetchCosts] Failed to fetch generation ${generationId.slice(0, 8)}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`[AutoFetchCosts] Error fetching generation ${generationId.slice(0, 8)}:`, error)
    return null
  }
}

export function useAutoFetchCosts(
  messages: Message[],
  onCostFetched: (messageId: string, costData: any) => void,
  apiKey?: string
) {
  const fetchedIds = useRef(new Set<string>())

  useEffect(() => {
    // Find messages that need cost fetching:
    // - Have a generationId (or allGenerationIds)
    // - Don't have actualCost yet
    // - Haven't been fetched before
    const messagesToFetch = messages.filter(
      (msg) =>
        (msg.stats?.generationId || (msg.stats?.allGenerationIds && msg.stats.allGenerationIds.length > 0)) &&
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
      const allGenerationIds = msg.stats?.allGenerationIds
      const generationId = msg.stats?.generationId

      // Determine which IDs to fetch
      const idsToFetch = allGenerationIds && allGenerationIds.length > 0
        ? allGenerationIds
        : generationId
          ? [generationId]
          : []

      if (idsToFetch.length === 0) return

      // Mark as being fetched to avoid duplicates
      fetchedIds.current.add(msg.id)

      try {
        // Wait a bit before first fetch - OpenRouter needs time to process the generation
        console.log(`[AutoFetchCosts] Waiting ${INITIAL_DELAY_BEFORE_FIRST_FETCH_MS}ms before fetching cost for ${msg.id.slice(0, 8)}...`)
        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_BEFORE_FIRST_FETCH_MS))

        const headers: Record<string, string> = {}
        if (apiKey) {
          headers["x-api-key"] = apiKey
        }

        // Fetch data for all generation IDs
        console.log(`[AutoFetchCosts] Fetching ${idsToFetch.length} generation(s) for message ${msg.id.slice(0, 8)}...`)
        const results = await Promise.all(
          idsToFetch.map(id => fetchGenerationData(id, headers, msg.id))
        )

        // Filter out failed fetches and sum up the costs
        const validResults = results.filter((r): r is GenerationData => r !== null && r.total_cost !== undefined)

        if (validResults.length === 0) {
          console.warn(`[AutoFetchCosts] No valid results for ${msg.id.slice(0, 8)}`)
          return
        }

        // Sum up all costs and tokens
        const totalCost = validResults.reduce((sum, r) => sum + (r.total_cost || 0), 0)
        const totalPromptTokens = validResults.reduce((sum, r) => sum + (r.native_tokens_prompt || 0), 0)
        const totalCompletionTokens = validResults.reduce((sum, r) => sum + (r.native_tokens_completion || 0), 0)
        const totalReasoningTokens = validResults.reduce((sum, r) => sum + (r.native_tokens_completion_reasoning || 0), 0)
        const totalCacheCreation = validResults.reduce((sum, r) => sum + (r.cache_creation_tokens || 0), 0)
        const totalCacheRead = validResults.reduce((sum, r) => sum + (r.cache_read_tokens || 0), 0)

        // Calculate tool call overhead (all generations except the last one)
        const toolCallGenerations = validResults.slice(0, -1)
        const toolCallCost = toolCallGenerations.reduce((sum, r) => sum + (r.total_cost || 0), 0)
        const toolCallTokensPrompt = toolCallGenerations.reduce((sum, r) => sum + (r.native_tokens_prompt || 0), 0)
        const toolCallTokensCompletion = toolCallGenerations.reduce((sum, r) => sum + (r.native_tokens_completion || 0), 0)

        // Get provider and performance from last generation (the final response)
        const lastResult = validResults[validResults.length - 1]
        const provider = lastResult?.provider_name

        // Calculate actual TPS from OpenRouter data: native_tokens_completion / (generation_time / 1000)
        const calculateTPS = (r: GenerationData) => {
          if (r.generation_time && r.native_tokens_completion && r.generation_time > 0) {
            return r.native_tokens_completion / (r.generation_time / 1000)
          }
          return undefined
        }

        const actualTokensPerSecond = calculateTPS(lastResult)
        // Latency is in ms, convert to seconds
        const actualFirstTokenLatency = lastResult?.latency ? lastResult.latency / 1000 : undefined

        // Get tool call TPS (average if multiple tool calls)
        const toolCallTPSValues = toolCallGenerations.map(r => calculateTPS(r)).filter((v): v is number => v !== undefined)
        const toolCallTPS = toolCallTPSValues.length > 0
          ? toolCallTPSValues.reduce((sum, v) => sum + v, 0) / toolCallTPSValues.length
          : undefined

        console.log(`[AutoFetchCosts] ✅ Fetched ${validResults.length}/${idsToFetch.length} generations for ${msg.id.slice(0, 8)}: $${totalCost.toFixed(6)} total, ${actualTokensPerSecond?.toFixed(1) || 'N/A'} t/s`)

        // Call the callback to update the message
        onCostFetched(msg.id, {
          actualCost: totalCost,
          nativeTokensPrompt: totalPromptTokens,
          nativeTokensCompletion: totalCompletionTokens,
          nativeTokensCompletionReasoning: totalReasoningTokens > 0 ? totalReasoningTokens : undefined,
          provider,
          cacheCreationTokens: totalCacheCreation > 0 ? totalCacheCreation : undefined,
          cacheReadTokens: totalCacheRead > 0 ? totalCacheRead : undefined,
          // Actual TPS from OpenRouter (not our estimate)
          ...(actualTokensPerSecond && { actualTokensPerSecond }),
          ...(actualFirstTokenLatency && { actualFirstTokenLatency }),
          // Tool calling specific costs and performance
          ...(toolCallCost > 0 && {
            toolCallCost,
            toolCallTokensPrompt,
            toolCallTokensCompletion,
          }),
          ...(toolCallTPS && { toolCallTokensPerSecond: toolCallTPS }),
        })
      } catch (error) {
        console.error(`[AutoFetchCosts] Error fetching costs for ${msg.id.slice(0, 8)}:`, error)
      }
    })
  }, [messages, onCostFetched, apiKey])
}
