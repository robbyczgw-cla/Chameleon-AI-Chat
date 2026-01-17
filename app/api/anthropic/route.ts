/**
 * Anthropic Direct API Route
 *
 * This endpoint handles requests to Claude models via the Anthropic API directly,
 * using Claude Code CLI tokens for authentication. It converts the Anthropic
 * streaming format to our standard OpenRouter-compatible format.
 *
 * Key features:
 * - Uses Bearer token authentication (Claude Code CLI OAuth token)
 * - Converts Anthropic SSE format to OpenRouter-compatible format
 * - Supports tool calling
 * - Supports extended thinking mode
 */

import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import {
  getAnthropicApiModelId,
  convertToAnthropicMessages,
  convertToAnthropicTools,
  type AnthropicRequest,
  type AnthropicStreamEvent,
} from "@/lib/anthropic"
import {
  webSearchTool,
  urlFetchTool,
  youtubeTranscriptTool,
  weatherTool,
} from "@/lib/tools"
import { fetchUrlContent, fetchYouTubeTranscript, formatUrlFetchResult, formatYouTubeResult } from "@/lib/url-tools"

// IMPORTANT: Using Node.js runtime instead of Edge because:
// Vercel Edge Functions CANNOT override the user-agent header in fetch requests
// (see GitHub issues #31085, #35546). The user-agent gets forced to "Next.js Middleware".
// For Claude Code CLI token auth, Anthropic checks user-agent to verify the request
// comes from the official CLI, so we need full header control.
export const runtime = "nodejs"

// IMPORTANT: Add ?beta=true query parameter for OAuth tokens
// See: https://github.com/anomalyco/opencode-anthropic-auth/pull/11
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages?beta=true"
const ANTHROPIC_VERSION = "2023-06-01"

// Beta features required for OAuth token authentication
// See: https://github.com/anomalyco/opencode-anthropic-auth/pull/15
// IMPORTANT: Order matters and must match Claude Code's exact pattern
const ANTHROPIC_BETA_OAUTH = "oauth-2025-04-20"
const ANTHROPIC_BETA_THINKING = "interleaved-thinking-2025-05-14"
const ANTHROPIC_BETA_CLAUDE_CODE = "claude-code-20250219"

// Headers to mimic Claude Code CLI - required for OAuth tokens to work
// See: https://github.com/anomalyco/opencode-anthropic-auth/pull/15
const CLAUDE_CODE_HEADERS = {
  "user-agent": "claude-cli/2.1.7 (external, cli)",
  "x-app": "cli",
  "anthropic-dangerous-direct-browser-access": "true",
  // x-stainless headers to match official SDK
  "x-stainless-arch": "arm64",
  "x-stainless-lang": "js",
  "x-stainless-os": "linux",
  "x-stainless-package-version": "0.52.0",
  "x-stainless-retry-count": "0",
  "x-stainless-runtime": "node",
  "x-stainless-runtime-version": "v22.12.0",
}

/**
 * Convert tool name to PascalCase (required for Claude Code OAuth)
 * e.g., "web_search" -> "WebSearch"
 */
function toPascalCase(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

/**
 * Convert PascalCase tool name back to snake_case for internal processing
 * e.g., "WebSearch" -> "web_search"
 */
function toSnakeCase(name: string): string {
  return name
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
}

interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>
  tool_calls?: Array<{
    id: string
    type: "function"
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
  name?: string
}

interface ChatRequest {
  messages: Message[]
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  reasoning?: boolean
  reasoningDepth?: "minimal" | "low" | "medium" | "high"
  // Tool calling options
  enableAutoToolUse?: boolean
  searchProvider?: "tavily" | "serper" | "exa"
  searchApiKey?: string
  searchSettings?: Record<string, any>
  enableUrlFetchTool?: boolean
  enableYouTubeTool?: boolean
  enableWeatherTool?: boolean
}

// Search cache
const searchCache = new Map<string, { result: { content: string; results: any[] }; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000

// Weather cache
const weatherCache = new Map<string, { result: string; timestamp: number }>()
const WEATHER_CACHE_TTL = 10 * 60 * 1000

async function executeWeather(location: string, type: string = "current"): Promise<string> {
  console.log(`[Anthropic] 🌤️ Executing get_weather: "${location}" (${type})`)

  const cacheKey = `${location}:${type}`
  const cached = weatherCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
    return cached.result
  }

  try {
    const apiKey = process.env.WEATHER_API_KEY
    if (!apiKey) {
      return "Weather service is not configured."
    }

    const endpoint = type === "forecast"
      ? `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3&aqi=yes`
      : `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=yes`

    const response = await fetch(endpoint)
    if (!response.ok) {
      return `Weather API error: ${response.status}`
    }

    const data = await response.json()
    const loc = data.location
    const current = data.current

    const result = `## Current Weather in ${loc.name}, ${loc.country}\n\n**Condition:** ${current.condition.text}\n**Temperature:** ${current.temp_c}°C (feels like ${current.feelslike_c}°C)\n**Humidity:** ${current.humidity}%\n**Wind:** ${current.wind_kph} km/h`

    weatherCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  } catch (error) {
    return `Weather error: ${error instanceof Error ? error.message : "Unknown"}`
  }
}

async function executeWebSearch(
  query: string,
  provider: "tavily" | "serper" | "exa",
  apiKey: string,
  settings: Record<string, any> = {}
): Promise<{ content: string; results: any[] }> {
  console.log(`[Anthropic] 🔍 Executing web_search: "${query}" via ${provider}`)

  const cacheKey = `${provider}:${query}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  try {
    let searchUrl: string
    let requestBody: Record<string, any>
    const headers: Record<string, string> = { "Content-Type": "application/json" }

    switch (provider) {
      case "tavily":
        searchUrl = "https://api.tavily.com/search"
        requestBody = {
          api_key: apiKey,
          query,
          max_results: settings.maxResults || 5,
          search_depth: settings.searchDepth || "basic",
          include_answer: true,
        }
        break

      case "serper":
        searchUrl = "https://google.serper.dev/search"
        headers["X-API-KEY"] = apiKey
        requestBody = {
          q: query,
          num: settings.maxResults || 5,
        }
        break

      case "exa":
        searchUrl = "https://api.exa.ai/search"
        headers["x-api-key"] = apiKey
        requestBody = {
          query,
          type: "keyword",
          numResults: settings.maxResults || 5,
          contents: { highlights: { numSentences: 2 } },
        }
        break

      default:
        return { content: `Unknown provider: ${provider}`, results: [] }
    }

    const response = await fetch(searchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      return { content: `Search error: ${response.status}`, results: [] }
    }

    const data = await response.json()
    let rawResults: any[] = []
    let formattedResults: string

    switch (provider) {
      case "tavily": {
        rawResults = (data.results || []).slice(0, 8).map((r: any) => ({
          title: r.title || "",
          url: r.url || "",
          content: r.content || "",
        }))
        formattedResults = rawResults
          .map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.content}\n   Source: ${r.url}`)
          .join("\n\n")
        if (data.answer) {
          formattedResults = `**AI Summary:** ${data.answer}\n\n---\n\n${formattedResults}`
        }
        break
      }

      case "serper": {
        rawResults = (data.organic || []).slice(0, 8).map((r: any) => ({
          title: r.title || "",
          url: r.link || "",
          content: r.snippet || "",
        }))
        formattedResults = rawResults
          .map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.content}\n   Source: ${r.url}`)
          .join("\n\n")
        break
      }

      case "exa": {
        rawResults = (data.results || []).slice(0, 8).map((r: any) => ({
          title: r.title || "",
          url: r.url || "",
          content: r.highlights?.join(" ... ") || "",
        }))
        formattedResults = rawResults
          .map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.content}\n   Source: ${r.url}`)
          .join("\n\n")
        break
      }
    }

    const content = `## Web Search Results for "${query}"\n\n${formattedResults}`
    const result = { content, results: rawResults }
    searchCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  } catch (error) {
    return { content: `Search error: ${error instanceof Error ? error.message : "Unknown"}`, results: [] }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    const rateLimitResult = checkRateLimit(`anthropic:${clientIp}`, { limit: 100, windowMs: 60000 })

    if (rateLimitResult.limited) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await req.json()

    const {
      messages,
      model,
      temperature = 0.7,
      maxTokens = 16000,
      topP = 1.0,
      stream = true,
      reasoning = false,
      reasoningDepth = "medium",
      enableAutoToolUse = false,
      searchProvider = "tavily",
      searchApiKey,
      searchSettings = {},
      enableUrlFetchTool = true,
      enableYouTubeTool = true,
      enableWeatherTool = true,
    } = body as ChatRequest

    // Get token from header
    const token = req.headers.get("x-anthropic-token")

    if (!token) {
      return NextResponse.json(
        { error: "Claude Code token required. Please add your token in Settings > API Keys." },
        { status: 401 }
      )
    }

    console.log("[Anthropic] ===== API ROUTE CALLED =====")
    console.log("[Anthropic] Model:", model)
    console.log("[Anthropic] Stream:", stream)
    console.log("[Anthropic] Tools enabled:", enableAutoToolUse && !!searchApiKey)

    // Convert model ID to Anthropic API model ID
    const apiModelId = getAnthropicApiModelId(model)
    console.log("[Anthropic] API Model ID:", apiModelId)

    // Convert messages
    const { system, messages: anthropicMessages } = convertToAnthropicMessages(messages)

    // Build Anthropic request
    // Note: For OAuth tokens, we must match Claude Code's exact request shape
    // See: https://github.com/anomalyco/opencode-anthropic-auth/pull/15
    const anthropicRequest: AnthropicRequest & { metadata?: { user_id: string } } = {
      model: apiModelId,
      messages: anthropicMessages,
      max_tokens: maxTokens,
      stream: true,
      // Add metadata field - PR #15 mentions this is needed for OAuth tokens
      metadata: {
        user_id: "chameleon_user",  // Placeholder - Claude Code extracts from ~/.claude.json
      },
    }

    if (system) {
      anthropicRequest.system = system
    }

    // Track if we have real tools
    let hasTools = false

    // Add tools if enabled
    // IMPORTANT: For OAuth tokens, tool names MUST be PascalCase
    // See: https://github.com/anomalyco/opencode-anthropic-auth/pull/11
    if (enableAutoToolUse && searchApiKey) {
      const openRouterTools = [webSearchTool]
      if (enableWeatherTool) openRouterTools.push(weatherTool)
      if (enableUrlFetchTool) openRouterTools.push(urlFetchTool)
      if (enableYouTubeTool) openRouterTools.push(youtubeTranscriptTool)

      // Convert tools and transform names to PascalCase
      const tools = convertToAnthropicTools(openRouterTools)
      anthropicRequest.tools = tools.map((tool) => ({
        ...tool,
        name: toPascalCase(tool.name),
      }))
      hasTools = true
      console.log("[Anthropic] Tools (PascalCase):", anthropicRequest.tools?.map((t) => t.name).join(", "))
    }

    // Add extended thinking if reasoning is enabled
    if (reasoning) {
      const budgetMap: Record<string, number> = {
        minimal: 1024,
        low: 2048,
        medium: 4096,
        high: 8192,
      }
      anthropicRequest.thinking = {
        type: "enabled",
        budget_tokens: budgetMap[reasoningDepth] || 4096,
      }
      console.log("[Anthropic] Thinking enabled with budget:", budgetMap[reasoningDepth])
    }

    // Build beta headers - must match Claude Code's exact pattern
    // See: https://github.com/anomalyco/opencode-anthropic-auth/pull/15
    // Start with just oauth beta, add others only when needed
    const betaParts = [ANTHROPIC_BETA_OAUTH]
    if (reasoning) {
      betaParts.push(ANTHROPIC_BETA_THINKING)
    }
    if (hasTools) {
      betaParts.push(ANTHROPIC_BETA_CLAUDE_CODE)
    }
    const betaFeatures = betaParts.join(",")

    console.log("[Anthropic] Beta features:", betaFeatures)
    console.log("[Anthropic] Request (without messages):", JSON.stringify({
      model: anthropicRequest.model,
      max_tokens: anthropicRequest.max_tokens,
      stream: anthropicRequest.stream,
      hasSystem: !!anthropicRequest.system,
      toolsCount: anthropicRequest.tools?.length || 0,
      thinking: anthropicRequest.thinking,
    }))

    // Streaming response
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // Handle streaming in background
    ;(async () => {
      try {
        let hasStartedResponding = false
        let hasStartedThinking = false
        let currentToolUse: { id: string; name: string; input: string } | null = null
        let accumulatedToolCalls: Array<{ id: string; name: string; input: Record<string, any> }> = []

        // Send initial phase
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              choices: [{ delta: { phase: "thinking" } }],
            })}\n\n`
          )
        )

        // Build headers object for logging
        const requestHeaders = {
          "Content-Type": "application/json",
          "anthropic-version": ANTHROPIC_VERSION,
          "anthropic-beta": betaFeatures,
          Authorization: `Bearer ${token.substring(0, 20)}...`,
          ...CLAUDE_CODE_HEADERS,
        }
        console.log("[Anthropic] Headers being sent:", JSON.stringify(requestHeaders, null, 2))

        const response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": ANTHROPIC_VERSION,
            "anthropic-beta": betaFeatures,
            Authorization: `Bearer ${token}`,
            // Claude Code CLI headers - required for OAuth tokens to work
            ...CLAUDE_CODE_HEADERS,
          },
          body: JSON.stringify(anthropicRequest),
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = `Anthropic API error: ${response.status}`
          let originalError = ""
          let errorType = ""

          try {
            const errorJson = JSON.parse(errorText)
            console.error("[Anthropic] Full error response:", JSON.stringify(errorJson, null, 2))
            if (errorJson.error) {
              originalError = errorJson.error.message || ""
              errorType = errorJson.error.type || ""
              errorMessage = originalError
            }
          } catch {
            if (errorText) {
              console.error("[Anthropic] Raw error text:", errorText)
              originalError = errorText.substring(0, 500)
              errorMessage = originalError
            }
          }

          console.error("[Anthropic] ==========================================")
          console.error("[Anthropic] API Error Status:", response.status)
          console.error("[Anthropic] Error Type:", errorType)
          console.error("[Anthropic] Error Message:", originalError)
          console.error("[Anthropic] Token prefix:", token.substring(0, 25))
          console.error("[Anthropic] ==========================================")

          // Check for token-specific errors - show full error for debugging
          if (response.status === 401 || errorMessage.includes("only authorized for use with Claude Code")) {
            errorMessage = `Auth Error (${response.status}): ${originalError}`
          }

          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
          await writer.close()
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: "No response body" })}\n\n`))
          await writer.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""
        let messageId = ""
        let inputTokens = 0
        let outputTokens = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()

            if (trimmed.startsWith("event: ")) {
              continue
            }

            if (trimmed.startsWith("data: ")) {
              const data = trimmed.slice(6)
              if (data === "[DONE]") continue

              try {
                const event = JSON.parse(data) as AnthropicStreamEvent

                switch (event.type) {
                  case "message_start":
                    if (event.message) {
                      messageId = event.message.id
                      inputTokens = event.message.usage?.input_tokens || 0
                    }
                    break

                  case "content_block_start":
                    if (event.content_block?.type === "thinking") {
                      if (!hasStartedThinking) {
                        hasStartedThinking = true
                        await writer.write(
                          encoder.encode(
                            `data: ${JSON.stringify({
                              choices: [{ delta: { phase: "thinking" } }],
                            })}\n\n`
                          )
                        )
                      }
                    } else if (event.content_block?.type === "tool_use") {
                      currentToolUse = {
                        id: event.content_block.id || "",
                        name: event.content_block.name || "",
                        input: "",
                      }
                      await writer.write(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            choices: [{
                              delta: {
                                phase: "tool_use",
                                toolName: currentToolUse.name,
                              }
                            }],
                          })}\n\n`
                        )
                      )
                    }
                    break

                  case "content_block_delta":
                    if (event.delta?.type === "thinking_delta" && event.delta.thinking) {
                      await writer.write(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            choices: [{ delta: { reasoning_content: event.delta.thinking } }],
                          })}\n\n`
                        )
                      )
                    } else if (event.delta?.type === "text_delta" && event.delta.text) {
                      if (!hasStartedResponding) {
                        hasStartedResponding = true
                        await writer.write(
                          encoder.encode(
                            `data: ${JSON.stringify({
                              choices: [{ delta: { phase: "responding" } }],
                            })}\n\n`
                          )
                        )
                      }
                      // Send in OpenRouter-compatible format
                      await writer.write(
                        encoder.encode(
                          `data: ${JSON.stringify({
                            id: messageId,
                            choices: [{ delta: { content: event.delta.text } }],
                          })}\n\n`
                        )
                      )
                    } else if (event.delta?.type === "input_json_delta" && event.delta.partial_json && currentToolUse) {
                      currentToolUse.input += event.delta.partial_json
                    }
                    break

                  case "content_block_stop":
                    if (currentToolUse) {
                      try {
                        const input = JSON.parse(currentToolUse.input || "{}")
                        accumulatedToolCalls.push({
                          id: currentToolUse.id,
                          name: currentToolUse.name,
                          input,
                        })
                      } catch {
                        console.warn("[Anthropic] Failed to parse tool input:", currentToolUse.input)
                      }
                      currentToolUse = null
                    }
                    break

                  case "message_delta":
                    if (event.usage) {
                      outputTokens = event.usage.output_tokens || 0
                    }
                    // Check for tool use stop reason
                    if (event.delta?.stop_reason === "tool_use" && accumulatedToolCalls.length > 0) {
                      // Execute tool calls
                      for (const toolCall of accumulatedToolCalls) {
                        let result = ""
                        // Convert PascalCase back to snake_case for matching
                        const toolNameSnake = toSnakeCase(toolCall.name)

                        if (toolNameSnake === "web_search" && searchApiKey) {
                          const searchResult = await executeWebSearch(
                            toolCall.input.query || "",
                            searchProvider,
                            searchApiKey,
                            searchSettings
                          )
                          result = searchResult.content
                        } else if (toolNameSnake === "get_weather") {
                          result = await executeWeather(
                            toolCall.input.location || "",
                            toolCall.input.type || "current"
                          )
                        } else if (toolNameSnake === "url_fetch") {
                          const fetchResult = await fetchUrlContent(toolCall.input.url || "")
                          result = formatUrlFetchResult(fetchResult)
                        } else if (toolNameSnake === "youtube_transcript") {
                          const ytResult = await fetchYouTubeTranscript(toolCall.input.url || "")
                          result = formatYouTubeResult(ytResult)
                        }

                        // Send tool result event
                        await writer.write(
                          encoder.encode(
                            `data: ${JSON.stringify({
                              choices: [{
                                delta: {
                                  searchComplete: true,
                                  resultSummary: `Tool ${toolCall.name} completed`,
                                }
                              }],
                            })}\n\n`
                          )
                        )

                        // For now, send the tool result as content
                        // TODO: Implement proper tool result handling with continuation
                        if (result) {
                          await writer.write(
                            encoder.encode(
                              `data: ${JSON.stringify({
                                choices: [{ delta: { content: `\n\n**Tool Result (${toolCall.name}):**\n${result}\n\n` } }],
                              })}\n\n`
                            )
                          )
                        }
                      }
                      accumulatedToolCalls = []
                    }
                    break

                  case "message_stop":
                    // Send done phase
                    await writer.write(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          choices: [{ delta: { phase: "done" } }],
                        })}\n\n`
                      )
                    )

                    // Send usage info
                    await writer.write(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          id: messageId,
                          usage: {
                            prompt_tokens: inputTokens,
                            completion_tokens: outputTokens,
                            total_tokens: inputTokens + outputTokens,
                          },
                        })}\n\n`
                      )
                    )
                    break

                  case "error":
                    console.error("[Anthropic] Stream error:", event.error)
                    await writer.write(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          error: event.error?.message || "Unknown stream error",
                        })}\n\n`
                      )
                    )
                    break
                }
              } catch {
                console.warn("[Anthropic] Failed to parse SSE data:", data.substring(0, 100))
              }
            }
          }
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"))
      } catch (error) {
        console.error("[Anthropic] Streaming error:", error)
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({
              error: error instanceof Error ? error.message : "Streaming error",
            })}\n\n`
          )
        )
      } finally {
        await writer.close()
      }
    })()

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[Anthropic] API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
