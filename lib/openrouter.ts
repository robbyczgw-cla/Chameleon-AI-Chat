export interface OpenRouterModel {
  id: string
  name: string
  description?: string
  context_length: number
  pricing: {
    prompt: string
    completion: string
  }
  top_provider?: {
    max_completion_tokens?: number
  }
  category?: string
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Models that are KNOWN to support reasoning parameter and return reasoning tokens
// IMPORTANT: OpenRouter handles the reasoning parameter gracefully - if a model doesn't
// support it, it simply ignores it. Therefore, we allow the reasoning toggle for ALL models.
// This list is kept for informational/documentation purposes only.
export const REASONING_MODELS_KNOWN = new Set([
  // OpenAI o-series (definitely returns reasoning tokens)
  "openai/o1",
  "openai/o1-mini",
  "openai/o1-preview",
  "openai/o3-mini",

  // DeepSeek R1 and R1-based models (confirmed to return reasoning_content)
  "deepseek/deepseek-r1",
  "deepseek/deepseek-r1:free",
  "deepseek/deepseek-r1-0528",
  "deepseek/deepseek-r1-0528:free",
  "deepseek/deepseek-reasoner",
  "deepseek/deepseek-v3.2", // DeepSeek 3.2 released Dec 1, 2025
  "deepseek/deepseek-v3.2:free",

  // Grok models with reasoning (configurable effort: low/medium/high)
  "x-ai/grok-4",
  "x-ai/grok-4-fast:free",

  // Qwen Thinking models
  "qwen/qwen3-235b-a22b-thinking-2507",

  // Alibaba Qwen models with thinking mode
  "qwen/qwen-2.5-coder-32b-instruct",
  "qwen/qwq-32b-preview",

  // Google Gemini Thinking models
  "google/gemini-2.0-flash-thinking-exp-01-21",
  "google/gemini-2.0-flash-thinking-exp",

  // MoonShot Kimi models with thinking
  "moonshotai/kimi-k2-thinking",

  // Note: Claude, Gemini Pro models may support reasoning parameter
  // but don't stream reasoning_content separately - they integrate thinking into response
  "anthropic/claude-4.5-sonnet-20250929",
  "anthropic/claude-opus-4.1",
  "google/gemini-2.5-pro",
])

// DEPRECATED: Use individual model checking instead
// Kept for backward compatibility but no longer used for UI restrictions
export const REASONING_MODELS = REASONING_MODELS_KNOWN

export const POPULAR_OPENROUTER_MODELS = [
  // 🏆 Flagship Models 2025 - Die Besten der Besten
  { id: "openai/gpt-5-2025-08-07", name: "GPT-5 (August 2025)", provider: "OpenAI", category: "flagship" },
  {
    id: "anthropic/claude-4.5-sonnet-20250929",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    category: "flagship",
  },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro (1M Context)", provider: "Google", category: "flagship" },
  { id: "x-ai/grok-4", name: "Grok 4", provider: "xAI", category: "flagship" },
  { id: "anthropic/claude-opus-4.1", name: "Claude Opus 4.1", provider: "Anthropic", category: "flagship" },

  // 💰 Beste Preis-Leistung 2025
  { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2", provider: "DeepSeek", category: "value" },
  { id: "x-ai/grok-4-fast:free", name: "Grok 4 Fast", provider: "xAI", category: "value" },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    category: "value",
  },
  { id: "openai/gpt-5-mini-2025-08-07", name: "GPT-5 Mini", provider: "OpenAI", category: "value" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", provider: "Anthropic", category: "value" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google", category: "value" },
  {
    id: "deepseek/deepseek-chat-v3.2-experimental",
    name: "DeepSeek V3.2 (Sehr günstig)",
    provider: "DeepSeek",
    category: "value",
  },

  // 🔓 Open Source & Open Weights 2025
  {
    id: "meta-llama/llama-4-maverick:free",
    name: "Llama 4 Maverick (Kostenlos)",
    provider: "Meta",
    category: "opensource",
  },
  { id: "meta-llama/llama-4-scout:free", name: "Llama 4 Scout (Kostenlos)", provider: "Meta", category: "opensource" },
  {
    id: "deepseek/deepseek-chat-v3-0324:free",
    name: "DeepSeek V3 (Kostenlos)",
    provider: "DeepSeek",
    category: "opensource",
  },
  { id: "qwen/qwen3-max", name: "Qwen 3 Max", provider: "Qwen", category: "opensource" },
  { id: "qwen/qwen3-235b-a22b-thinking-2507", name: "Qwen 3 235B Thinking", provider: "Qwen", category: "opensource" },
  { id: "zhipu/glm-4.6", name: "GLM-4.6 (China)", provider: "Zhipu AI", category: "opensource" },
  { id: "minimax/m2", name: "Minimax M2", provider: "Minimax", category: "opensource" },

  // 💻 Spezialisiert für Code 2025
  { id: "x-ai/grok-code-fast-1", name: "Grok Code Fast", provider: "xAI", category: "code" },
  { id: "qwen/qwen3-coder", name: "Qwen 3 Coder 480B", provider: "Qwen", category: "code" },
  { id: "qwen/qwen3-coder-30b-a3b-instruct", name: "Qwen 3 Coder 30B", provider: "Qwen", category: "code" },
  { id: "deepseek/deepseek-coder-v3", name: "DeepSeek Coder V3", provider: "DeepSeek", category: "code" },
  { id: "mistralai/codestral-2025", name: "Codestral 2025", provider: "Mistral", category: "code" },
]

export async function sendChatMessage(
  messages: ChatMessage[],
  model: string,
  options: {
    temperature?: number
    maxTokens?: number
    apiKey?: string
  } = {},
): Promise<ChatCompletionResponse> {
  const { temperature = 0.7, maxTokens: requestedMaxTokens = 4096, apiKey } = options
  const maxTokens = Math.max(requestedMaxTokens || 4096, 4096)

  console.log("[v0] sendChatMessage - requested:", requestedMaxTokens, "enforced:", maxTokens)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers["x-openrouter-api-key"] = apiKey
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages,
      model,
      temperature,
      maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to send message")
  }

  return response.json()
}

export async function streamChatMessage(
  messages: ChatMessage[],
  model: string,
  onChunk: (content: string) => void,
  options: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    apiKey?: string
    signal?: AbortSignal
    reasoning?: boolean
    onReasoning?: (content: string) => void
    // Auto tool use options (tool calling)
    enableAutoToolUse?: boolean
    searchProvider?: "tavily" | "serper" | "exa"
    searchApiKey?: string
    searchSettings?: Record<string, any>
    // Experimental tool settings
    enableUrlFetchTool?: boolean
    enableYouTubeTool?: boolean
    enableWeatherTool?: boolean
    // Shopify tool settings (HiFi mode)
    enableShopifyTool?: boolean
    shopifyStoreUrl?: string
    shopifyAccessToken?: string
    onSearchStart?: (query: string) => void
    onSearchComplete?: () => void
    // Phase tracking callbacks for step-by-step visualization
    onPhaseChange?: (phase: "thinking" | "searching" | "tool_use" | "responding" | "done") => void
    onToolUse?: (toolName: string) => void
    onSearchQuery?: (query: string) => void
    // Generation ID callback for exact cost tracking
    onGenerationId?: (generationId: string) => void
    // All generation IDs callback (for tool calling which creates multiple generations)
    onAllGenerationIds?: (generationIds: string[], toolCallCount: number) => void
    // Stop reason callback (e.g., "stop", "length", "tool_calls")
    onStopReason?: (stopReason: string) => void
    // Enhanced streaming details callback (for advanced mode)
    onStreamingDetails?: (details: {
      phase?: string
      toolName?: string
      searchQuery?: string  // The actual search query being executed
      toolArguments?: Record<string, any>
      searchProvider?: string
      searchParameters?: Record<string, any>
      action?: string
      resultCount?: number
      resultSummary?: string
      searchResultsPreview?: string
      searchResults?: any[] // Full search results array (SearchResult[] from search/types.ts)
      reasoningContent?: string
      reasoningTokens?: number
    }) => void
  } = {},
): Promise<void> {
  const {
    temperature = 0.7,
    maxTokens: requestedMaxTokens = 16000,
    topP = 1.0,
    frequencyPenalty = 0,
    presencePenalty = 0,
    apiKey,
    signal,
    reasoning = false,
    onReasoning,
    // Auto tool use
    enableAutoToolUse = true,
    searchProvider = "tavily",
    searchApiKey,
    searchSettings = {},
    // Experimental tool settings
    enableUrlFetchTool = true,
    enableYouTubeTool = true,
    enableWeatherTool = true,
    // Shopify tool settings
    enableShopifyTool = false,
    shopifyStoreUrl,
    shopifyAccessToken,
    onSearchStart,
    onSearchComplete,
    // Phase tracking
    onPhaseChange,
    onToolUse,
    onSearchQuery,
    onGenerationId,
    onAllGenerationIds,
    onStopReason,
    // Enhanced streaming details
    onStreamingDetails,
  } = options

  const maxTokens = Math.max(requestedMaxTokens || 16000, 16000)

  console.log("[v0] ===== STREAM CHAT MESSAGE CALLED =====")
  console.log("[v0] Model:", model)
  console.log("[v0] Temperature:", temperature)
  console.log("[v0] Requested MaxTokens:", requestedMaxTokens)
  console.log("[v0] FINAL ENFORCED MaxTokens:", maxTokens, " <<<< THIS IS WHAT OPENROUTER GETS")
  console.log("[v0] Top P:", topP)
  console.log("[v0] Frequency Penalty:", frequencyPenalty)
  console.log("[v0] Presence Penalty:", presencePenalty)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers["x-openrouter-api-key"] = apiKey
  }

  const requestBody: Record<string, any> = {
    messages,
    model,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    stream: true,
  }

  // Add reasoning parameter if enabled
  if (reasoning) {
    requestBody.reasoning = true
  }

  // Add auto tool use parameters if enabled
  if (enableAutoToolUse && searchApiKey) {
    requestBody.enableAutoToolUse = true
    requestBody.searchProvider = searchProvider
    requestBody.searchApiKey = searchApiKey
    requestBody.searchSettings = searchSettings
    // Pass experimental tool settings
    requestBody.enableUrlFetchTool = enableUrlFetchTool
    requestBody.enableYouTubeTool = enableYouTubeTool
    requestBody.enableWeatherTool = enableWeatherTool
    // Pass Shopify tool settings (HiFi mode)
    if (enableShopifyTool && shopifyStoreUrl && shopifyAccessToken) {
      requestBody.enableShopifyTool = true
      requestBody.shopifyStoreUrl = shopifyStoreUrl
      requestBody.shopifyAccessToken = shopifyAccessToken
      console.log("[v0] Shopify tool enabled for store:", shopifyStoreUrl)
    }
    console.log("[v0] Auto tool use enabled with provider:", searchProvider, "tools:", { urlFetch: enableUrlFetchTool, youtube: enableYouTubeTool, weather: enableWeatherTool, shopify: enableShopifyTool })
  }

  console.log("[v0] FINAL REQUEST BODY TO /api/chat:", JSON.stringify(requestBody, null, 2))

  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
    signal,
  })

  console.log("[v0] Response received - status:", response.status)
  console.log("[v0] Response content-type:", response.headers.get("content-type"))

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Stream error response:", errorText)
    try {
      const error = JSON.parse(errorText)
      throw new Error(error.error || "Failed to send message")
    } catch {
      throw new Error(errorText || "Failed to send message")
    }
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error("No response body")
  }

  console.log("[v0] Starting to read stream...")
  let chunkCount = 0
  let totalContent = ""
  let lastFinishReason: string | null = null
  let buffer = ""

  try {
    while (true) {
      if (signal?.aborted) {
        console.log("[v0] Stream aborted by signal")
        reader.cancel()
        throw new DOMException("Aborted", "AbortError")
      }

      const { done, value } = await reader.read()

      if (done) {
        console.log("[v0] ===== STREAM COMPLETE =====")
        console.log("[v0] Total chunks received:", chunkCount)
        console.log("[v0] Total content length:", totalContent.length)
        console.log("[v0] Last finish_reason:", lastFinishReason || "NOT PROVIDED")
        if (totalContent.length < 100) {
          console.warn("[v0] ⚠️ WARNING: Response seems too short! Only", totalContent.length, "characters")
        }
        if (lastFinishReason === "length") {
          console.warn("[v0] ⚠️ WARNING: Stream ended due to LENGTH limit - maxTokens might be too low!")
        }
        // Call stop reason callback if provided
        if (onStopReason && lastFinishReason) {
          onStopReason(lastFinishReason)
        }
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.slice(6)

          if (data === "[DONE]") {
            console.log("[v0] Received [DONE] marker")
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta
            // Check for content in both 'content' and 'text' fields (model compatibility)
            const content = delta?.content || delta?.text
            const finishReason = parsed.choices?.[0]?.finish_reason

            // Handle generation ID for exact cost tracking
            if (parsed.generation_id && onGenerationId) {
              console.log("[v0] 💰 Generation ID received:", parsed.generation_id)
              onGenerationId(parsed.generation_id)
            }

            // Handle all generation IDs (for tool calling which creates multiple generations)
            if (parsed.all_generation_ids && onAllGenerationIds) {
              const toolCallCount = parsed.tool_call_count || 0
              console.log(`[v0] 💰 All generation IDs received: ${parsed.all_generation_ids.length} (${toolCallCount} tool calls)`)
              onAllGenerationIds(parsed.all_generation_ids, toolCallCount)
            }

            // Handle phase change events for step-by-step visualization
            if (delta?.phase && onPhaseChange) {
              console.log("[v0] 📍 Phase change:", delta.phase)
              onPhaseChange(delta.phase)
            }

            // Handle tool use events
            if (delta?.toolName && onToolUse) {
              console.log("[v0] 🔧 Tool use:", delta.toolName)
              onToolUse(delta.toolName)
            }

            // Handle search query for display
            if (delta?.searchQuery && onSearchQuery) {
              try {
                // Try to parse as JSON first (tool call arguments)
                const parsed = JSON.parse(delta.searchQuery)
                const query = parsed.query || delta.searchQuery
                console.log("[v0] 🔍 Search query:", query)
                onSearchQuery(query)
              } catch {
                // If not JSON, use as-is
                onSearchQuery(delta.searchQuery)
              }
            }

            // Handle enhanced streaming details (for advanced mode visualization)
            if (onStreamingDetails && (delta?.searchQuery || delta?.toolArguments || delta?.searchProvider || delta?.action || delta?.resultCount || delta?.resultSummary || delta?.searchResultsPreview || delta?.searchResults)) {
              const details = {
                phase: delta.phase,
                toolName: delta.toolName,
                searchQuery: delta.searchQuery,  // Include the actual search query
                toolArguments: delta.toolArguments,
                searchProvider: delta.searchProvider,
                searchParameters: delta.searchParameters,
                action: delta.action,
                resultCount: delta.resultCount || delta.searchResultCount,
                resultSummary: delta.resultSummary,
                searchResultsPreview: delta.searchResultsPreview,
                searchResults: delta.searchResults, // Full search results array for rich UI display
              }
              console.log("[v0] 📊 Enhanced streaming details:", details)
              onStreamingDetails(details)
            }

            // Handle search status events from tool calling (legacy support)
            if (delta?.searching && onSearchStart) {
              try {
                const searchQuery = JSON.parse(delta.searchQuery || "{}")
                console.log("[v0] 🔍 AI triggered search:", searchQuery.query)
                onSearchStart(searchQuery.query || "")
              } catch {
                onSearchStart("")
              }
              continue
            }

            if (delta?.searchComplete && onSearchComplete) {
              console.log("[v0] ✅ Search complete")
              onSearchComplete()
              continue
            }

            // Extract reasoning from various possible formats
            let reasoningContent = delta?.reasoning_content || delta?.reasoning || delta?.thinking

            // Handle reasoning_details array format (OpenRouter standard)
            if (!reasoningContent && delta?.reasoning_details && Array.isArray(delta.reasoning_details)) {
              for (const detail of delta.reasoning_details) {
                if (detail.type === "reasoning.text" && detail.text) {
                  reasoningContent = detail.text
                } else if (detail.type === "reasoning.summary" && detail.summary) {
                  reasoningContent = detail.summary
                }
              }
            }

            if (finishReason) {
              lastFinishReason = finishReason
            }

            if (reasoningContent) {
              // Call legacy onReasoning callback (accumulates on client)
              if (onReasoning) {
                onReasoning(reasoningContent)
              }

              // Send reasoning via enhanced streaming details WITHOUT redundant phase
              // (phase change is already sent separately once)
              if (onStreamingDetails) {
                onStreamingDetails({
                  reasoningContent: reasoningContent,
                  action: "Extended reasoning in progress..."
                })
              }
            }

            if (content) {
              chunkCount++
              totalContent += content
              onChunk(content)
            } else if (delta && Object.keys(delta).length > 0 && !delta.phase) {
              // Log when we receive delta without content (helps debug empty responses)
              console.log("[v0] Delta without content, keys:", Object.keys(delta).join(", "))
            }
          } catch (e) {
            console.warn("[v0] Failed to parse SSE data:", data.substring(0, 50), e)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function fetchAvailableModels(apiKey?: string): Promise<OpenRouterModel[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers,
  })

  if (!response.ok) {
    throw new Error("Failed to fetch models")
  }

  const data = await response.json()
  return data.data || []
}
