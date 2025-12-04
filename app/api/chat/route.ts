import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { webSearchTool, urlFetchTool, youtubeTranscriptTool, weatherTool, modelSupportsToolCalling, parseToolArguments } from "@/lib/tools"
import { fetchUrlContent, fetchYouTubeTranscript, formatUrlFetchResult, formatYouTubeResult } from "@/lib/url-tools"

export const runtime = "edge"

/**
 * Multimodal content support for vision models
 */
interface MessageContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: {
    url: string
    detail?: "auto" | "low" | "high"
  }
}

type MessageContent = string | MessageContentPart[]

interface Message {
  role: "user" | "assistant" | "system" | "tool"
  content: MessageContent
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

interface ToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

interface ChatRequest {
  messages: Message[]
  model: string
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stream?: boolean
  reasoning?: boolean
  // Tool calling options
  enableAutoSearch?: boolean
  searchProvider?: "tavily" | "serper" | "exa"
  searchApiKey?: string
  searchSettings?: Record<string, any>
  // Experimental tool settings
  enableUrlFetchTool?: boolean
  enableYouTubeTool?: boolean
}

// Search cache to reduce duplicate searches
const searchCache = new Map<string, { result: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Weather cache
const weatherCache = new Map<string, { result: string; timestamp: number }>()
const WEATHER_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

/**
 * Execute weather API call
 */
async function executeWeather(
  location: string,
  type: string = "current"
): Promise<string> {
  console.log(`[Tool] 🌤️ Executing get_weather: "${location}" (${type})`)

  // Check cache
  const cacheKey = `${location}:${type}`
  const cached = weatherCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
    console.log(`[Tool] ✅ Weather cache hit for: "${location}"`)
    return cached.result
  }

  try {
    const apiKey = process.env.WEATHER_API_KEY
    if (!apiKey) {
      return "Weather service is not configured. Please add WEATHER_API_KEY to environment variables."
    }

    // WeatherAPI.com - Free tier: 1M calls/month
    const endpoint = type === "forecast"
      ? `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=3&aqi=yes`
      : `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}&aqi=yes`

    const response = await fetch(endpoint)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Tool] ❌ Weather API error:`, response.status, errorText)

      if (response.status === 400) {
        return `Weather location not found: "${location}". Please try with a city name, region, or coordinates.`
      }
      return `Weather service error: ${response.status}`
    }

    const data = await response.json()
    let formattedResult: string

    if (type === "forecast") {
      const location = data.location
      const forecast = data.forecast.forecastday

      let forecastText = forecast.map((day: any) => {
        return `**${day.date}**
- Condition: ${day.day.condition.text}
- Temperature: ${day.day.maxtemp_c}°C / ${day.day.mintemp_c}°C
- Rain chance: ${day.day.daily_chance_of_rain}%
- UV Index: ${day.day.uv}`
      }).join('\n\n')

      formattedResult = `## 3-Day Weather Forecast for ${location.name}, ${location.country}

${forecastText}

---
*Last updated: ${data.current.last_updated}*`
    } else {
      const location = data.location
      const current = data.current
      const aqi = current.air_quality

      formattedResult = `## Current Weather in ${location.name}, ${location.country}

**Condition:** ${current.condition.text}
**Temperature:** ${current.temp_c}°C (feels like ${current.feelslike_c}°C)
**Humidity:** ${current.humidity}%
**Wind:** ${current.wind_kph} km/h ${current.wind_dir}
**Pressure:** ${current.pressure_mb} mb
**Visibility:** ${current.vis_km} km
**UV Index:** ${current.uv}

${aqi ? `**Air Quality Index (US EPA):** ${aqi['us-epa-index']} ${getAQIDescription(aqi['us-epa-index'])}\n` : ''}
**Local Time:** ${location.localtime}

---
*Last updated: ${current.last_updated}*`
    }

    // Cache the result
    weatherCache.set(cacheKey, { result: formattedResult, timestamp: Date.now() })

    console.log(`[Tool] ✅ Weather data retrieved for: ${location}`)
    return formattedResult
  } catch (error) {
    console.error("[Tool] ❌ Weather request failed:", error)
    return `Weather service error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`
  }
}

/**
 * Get air quality description from EPA index
 */
function getAQIDescription(index: number): string {
  if (index === 1) return "(Good)"
  if (index === 2) return "(Moderate)"
  if (index === 3) return "(Unhealthy for sensitive group)"
  if (index === 4) return "(Unhealthy)"
  if (index === 5) return "(Very unhealthy)"
  if (index === 6) return "(Hazardous)"
  return ""
}

/**
 * Execute web search using the specified provider
 */
async function executeWebSearch(
  query: string,
  provider: "tavily" | "serper" | "exa",
  apiKey: string,
  settings: Record<string, any> = {}
): Promise<string> {
  console.log(`[Tool] 🔍 Executing web_search: "${query}" via ${provider}`)

  // Check cache
  const cacheKey = `${provider}:${query}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Tool] ✅ Cache hit for: "${query}"`)
    return cached.result
  }

  try {
    let searchUrl: string
    let requestBody: Record<string, any>
    let headers: Record<string, string> = { "Content-Type": "application/json" }

    switch (provider) {
      case "tavily":
        searchUrl = "https://api.tavily.com/search"
        requestBody = {
          api_key: apiKey,
          query,
          max_results: settings.maxResults || 5,
          search_depth: settings.searchDepth || "basic",
          include_images: settings.includeImages || false,
          include_answer: settings.includeAnswer !== false,
          topic: settings.topic || "general",
        }
        break

      case "serper":
        searchUrl = "https://google.serper.dev/search"
        headers["X-API-KEY"] = apiKey
        requestBody = {
          q: query,
          gl: settings.country || "us",
          hl: settings.language || "en",
          num: settings.maxResults || 5,
          autocorrect: settings.autocorrect !== false,
        }
        if (settings.timeRange && settings.timeRange !== "none") {
          const tbsMap: Record<string, string> = {
            hour: "qdr:h",
            day: "qdr:d",
            week: "qdr:w",
            month: "qdr:m",
            year: "qdr:y",
          }
          requestBody.tbs = tbsMap[settings.timeRange]
        }
        break

      case "exa":
        searchUrl = "https://api.exa.ai/search"
        headers["x-api-key"] = apiKey
        requestBody = {
          query,
          type: settings.searchType || "keyword",  // "keyword" is faster than "auto" or "neural"
          useAutoprompt: false,  // Skip query optimization for speed
          numResults: settings.maxResults || 3,  // Fewer results for faster streaming
          livecrawl: settings.livecrawl || "never",  // CRITICAL: Avoid unpredictable delays
          contents: {
            // CRITICAL: Don't fetch full text for automatic search - causes timeouts
            text: false,  // Disabled to prevent large payloads blocking stream
            highlights: settings.includeHighlights !== false ? { numSentences: 2 } : false,  // Reduced from 3
          },
        }
        if (settings.category) requestBody.category = settings.category
        break

      default:
        return `Search failed: Unknown provider "${provider}"`
    }

    const response = await fetch(searchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Tool] ❌ Search API error:`, response.status, errorText)
      return `Search failed: ${response.status} - ${errorText.substring(0, 200)}`
    }

    const data = await response.json()
    let formattedResults: string

    // Format results based on provider
    switch (provider) {
      case "tavily": {
        const results = data.results || []
        formattedResults = results
          .slice(0, 8)
          .map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.content}\n   Source: ${r.url}`)
          .join("\n\n")
        if (data.answer) {
          formattedResults = `**AI Summary:** ${data.answer}\n\n---\n\n${formattedResults}`
        }
        break
      }

      case "serper": {
        const results = data.organic || []
        formattedResults = results
          .slice(0, 8)
          .map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.link}`)
          .join("\n\n")
        if (data.answerBox?.answer) {
          formattedResults = `**Quick Answer:** ${data.answerBox.answer}\n\n---\n\n${formattedResults}`
        } else if (data.knowledgeGraph?.description) {
          formattedResults = `**Knowledge:** ${data.knowledgeGraph.description}\n\n---\n\n${formattedResults}`
        }
        break
      }

      case "exa": {
        const results = data.results || []
        formattedResults = results
          .slice(0, 8)
          .map((r: any, i: number) => {
            let content = ""
            if (r.highlights?.length) {
              content = r.highlights.slice(0, 2).join(" ... ")
            } else if (r.text) {
              content = r.text.substring(0, 300) + (r.text.length > 300 ? "..." : "")
            }
            return `${i + 1}. **${r.title}**\n   ${content}\n   Source: ${r.url}`
          })
          .join("\n\n")
        if (data.autopromptString) {
          formattedResults = `**Optimized Query:** ${data.autopromptString}\n\n${formattedResults}`
        }
        break
      }
    }

    const result = `## Web Search Results for "${query}"\n\n${formattedResults}\n\n---\n*Search provider: ${provider}*`

    // Cache the result
    searchCache.set(cacheKey, { result, timestamp: Date.now() })

    console.log(`[Tool] ✅ Search completed: ${(data.results || data.organic || []).length} results`)
    return result
  } catch (error) {
    console.error("[Tool] ❌ Search failed:", error)
    return `Search failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try rephrasing or continue without search.`
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown"
    const rateLimitResult = checkRateLimit(`chat:${clientIp}`, { limit: 100, windowMs: 60000 })

    if (rateLimitResult.limited) {
      return new NextResponse(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
        },
      })
    }

    const body = await req.json()

    const {
      messages,
      model,
      temperature = 0.7,
      maxTokens: requestedMaxTokens = 16000,
      topP = 1.0,
      frequencyPenalty = 0,
      presencePenalty = 0,
      stream = false,
      reasoning = false,
      // Tool calling options
      enableAutoSearch = false,
      searchProvider = "tavily",
      searchApiKey,
      searchSettings = {},
      // Experimental tool settings (default to true for backward compatibility)
      enableUrlFetchTool = true,
      enableYouTubeTool = true,
    } = body as ChatRequest

    const maxTokens = Math.max(requestedMaxTokens || 16000, 16000)

    console.log("[Chat] ===== API ROUTE CALLED =====")
    console.log("[Chat] Model:", model)
    console.log("[Chat] Stream:", stream)
    console.log("[Chat] Auto Search:", enableAutoSearch)
    console.log("[Chat] Search Provider:", searchProvider)

    // Get API key from environment or request headers
    const apiKey = process.env.OPENROUTER_API_KEY || req.headers.get("x-openrouter-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 401 })
    }

    // Determine if we should include tools
    const shouldIncludeTools = enableAutoSearch && searchApiKey && modelSupportsToolCalling(model)

    console.log("[Chat] Include tools:", shouldIncludeTools)

    const openRouterBody: Record<string, any> = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream,
    }

    // Add tools if enabled - conditionally include tools based on settings
    if (shouldIncludeTools) {
      const tools = [webSearchTool, weatherTool] // Web search and weather are always included when auto search is enabled
      if (enableUrlFetchTool) tools.push(urlFetchTool)
      if (enableYouTubeTool) tools.push(youtubeTranscriptTool)
      openRouterBody.tools = tools
      openRouterBody.tool_choice = "auto"
      console.log("[Chat] Tools enabled:", tools.map(t => t.function.name).join(", "))
    }

    // Add reasoning parameter if enabled (for Grok, o1, o3, DeepSeek R1, etc.)
    if (reasoning) {
      openRouterBody.reasoning = { effort: "medium" }
      // CRITICAL: OpenRouter requires include_reasoning to actually return reasoning tokens
      openRouterBody.include_reasoning = true
    }

    // Non-streaming request with tool calling
    if (!stream) {
      return handleNonStreamingRequest(openRouterBody, apiKey, searchApiKey!, searchProvider, searchSettings)
    }

    // Streaming request - more complex handling for tool calls
    return handleStreamingRequest(openRouterBody, apiKey, searchApiKey, searchProvider, searchSettings, shouldIncludeTools)
  } catch (error) {
    console.error("[Chat] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Handle non-streaming requests with tool calling
 */
async function handleNonStreamingRequest(
  openRouterBody: Record<string, any>,
  apiKey: string,
  searchApiKey: string,
  searchProvider: "tavily" | "serper" | "exa",
  searchSettings: Record<string, any>
) {
  const MAX_ITERATIONS = 3
  let iterations = 0
  let currentMessages = [...openRouterBody.messages]

  while (iterations < MAX_ITERATIONS) {
    iterations++

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Chameleon AI Chat",
      },
      body: JSON.stringify({ ...openRouterBody, messages: currentMessages }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Chat] OpenRouter error:", response.status, errorText)
      try {
        const error = JSON.parse(errorText)
        return NextResponse.json({ error: error.error?.message || "OpenRouter API error" }, { status: response.status })
      } catch {
        return NextResponse.json({ error: errorText || "OpenRouter API error" }, { status: response.status })
      }
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    // Check for tool calls
    if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls) {
      console.log("[Chat] Tool calls detected:", choice.message.tool_calls.length)

      // Add assistant message with tool calls
      currentMessages.push(choice.message)

      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        choice.message.tool_calls.map(async (toolCall: ToolCall) => {
          if (toolCall.function.name === "web_search") {
            const args = parseToolArguments(toolCall.function.arguments)
            const result = await executeWebSearch(args.query || "", searchProvider, searchApiKey, searchSettings)

            return {
              tool_call_id: toolCall.id,
              role: "tool" as const,
              name: "web_search",
              content: result,
            }
          }
          return {
            tool_call_id: toolCall.id,
            role: "tool" as const,
            name: toolCall.function.name,
            content: `Unknown tool: ${toolCall.function.name}`,
          }
        })
      )

      // Add tool results to messages
      currentMessages.push(...toolResults)

      // Continue the loop to get the final response
      continue
    }

    // No more tool calls, return the final response
    return NextResponse.json(data)
  }

  // Max iterations reached
  return NextResponse.json({ error: "Maximum tool iterations reached" }, { status: 500 })
}

/**
 * Handle streaming requests with tool calling support
 */
async function handleStreamingRequest(
  openRouterBody: Record<string, any>,
  apiKey: string,
  searchApiKey: string | undefined,
  searchProvider: "tavily" | "serper" | "exa",
  searchSettings: Record<string, any>,
  toolsEnabled: boolean
) {
  const encoder = new TextEncoder()

  // Create a TransformStream for the response
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  // Handle the streaming in the background
  ;(async () => {
    try {
      let currentMessages = [...openRouterBody.messages]
      let iterations = 0
      const MAX_ITERATIONS = 3
      let hasStartedResponding = false
      let hasStartedReasoning = false // Track if we've sent the initial reasoning phase

      // Send initial thinking phase
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            choices: [{ delta: { phase: "thinking" } }],
          })}\n\n`
        )
      )

      while (iterations < MAX_ITERATIONS) {
        iterations++

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "Chameleon AI Chat",
          },
          body: JSON.stringify({ ...openRouterBody, messages: currentMessages }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorText })}\n\n`))
          break
        }

        const reader = response.body?.getReader()
        if (!reader) break

        const decoder = new TextDecoder()
        let buffer = ""
        let accumulatedToolCalls: ToolCall[] = []
        let hasToolCalls = false
        let finishReason = ""

        // Process the stream
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6)

            if (data === "[DONE]") {
              if (!hasToolCalls) {
                await writer.write(encoder.encode("data: [DONE]\n\n"))
              }
              continue
            }

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta
              const finish = parsed.choices?.[0]?.finish_reason

              // Debug: Log delta structure for troubleshooting empty responses
              if (delta && Object.keys(delta).length > 0) {
                const deltaKeys = Object.keys(delta)
                // Only log if it's not a simple content chunk (to avoid spam)
                if (!delta.content || deltaKeys.length > 1) {
                  console.log("[Chat] Delta keys:", deltaKeys.join(", "), "hasToolCalls:", hasToolCalls)
                }
              }

              if (finish) {
                finishReason = finish
                console.log("[Chat] Finish reason:", finish)
              }

              // Accumulate tool calls - MUST check for non-empty array!
              // Empty arrays are truthy in JS and would incorrectly block content
              if (delta?.tool_calls && Array.isArray(delta.tool_calls) && delta.tool_calls.length > 0) {
                hasToolCalls = true
                console.log("[Chat] Tool calls detected in stream:", delta.tool_calls.length)
                for (const tc of delta.tool_calls) {
                  const index = tc.index ?? 0
                  if (!accumulatedToolCalls[index]) {
                    accumulatedToolCalls[index] = {
                      id: tc.id || "",
                      type: "function",
                      function: { name: "", arguments: "" },
                    }
                  }
                  if (tc.id) accumulatedToolCalls[index].id = tc.id
                  if (tc.function?.name) accumulatedToolCalls[index].function.name = tc.function.name
                  if (tc.function?.arguments) accumulatedToolCalls[index].function.arguments += tc.function.arguments
                }
              }

              // Forward reasoning content (o1, DeepSeek R1, thinking models)
              // Check for reasoning_content, reasoning, or thinking fields
              const reasoningContent = delta?.reasoning_content || delta?.reasoning || delta?.thinking
              if (reasoningContent && !hasToolCalls) {
                // Only send phase change ONCE when reasoning starts (not for every token!)
                if (!hasStartedReasoning) {
                  hasStartedReasoning = true
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        choices: [{
                          delta: {
                            phase: "thinking"
                          }
                        }]
                      })}\n\n`
                    )
                  )
                }

                // Send reasoning content WITHOUT phase spam
                await writer.write(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      choices: [{
                        delta: {
                          reasoning_content: reasoningContent
                        }
                      }]
                    })}\n\n`
                  )
                )
              }

              // Forward content to client (only if not in tool call mode)
              // Also check for 'text' field as some models use that instead of 'content'
              const contentToForward = delta?.content || delta?.text
              if (contentToForward && !hasToolCalls) {
                // Send responding phase on first content
                if (!hasStartedResponding) {
                  hasStartedResponding = true
                  console.log("[Chat] First content received, sending responding phase")
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        choices: [{ delta: { phase: "responding" } }],
                      })}\n\n`
                    )
                  )
                }
                // Forward original line with proper SSE format (double newline)
                await writer.write(encoder.encode(line + "\n\n"))
              }
            } catch (e) {
              // Log parse errors for debugging - don't silently swallow them
              console.warn("[Chat] SSE parse error:", e, "- raw data:", data?.substring(0, 100))
            }
          }
        }

        // Handle tool calls
        if (hasToolCalls && accumulatedToolCalls.length > 0 && toolsEnabled) {
          console.log("[Chat] Processing tool calls:", accumulatedToolCalls.length)

          // Parse the tool call arguments
          const toolArgs = parseToolArguments(accumulatedToolCalls[0]?.function.arguments || "{}")
          const toolName = accumulatedToolCalls[0]?.function.name || "unknown"

          // Determine phase and action based on tool type
          let phase = "tool_use"
          let action = `Using tool: ${toolName}`
          let toolQuery = toolArgs.query || toolArgs.url || ""

          if (toolName === "web_search") {
            phase = "searching"
            action = `Searching ${searchProvider}: "${toolArgs.query}"`
            toolQuery = toolArgs.query || ""
          } else if (toolName === "get_weather") {
            phase = "tool_use"
            action = `Getting weather for: ${toolArgs.location}`
            toolQuery = toolArgs.location || ""
          } else if (toolName === "url_fetch") {
            phase = "tool_use"
            action = `Fetching URL: ${toolArgs.url}`
            toolQuery = toolArgs.url || ""
          } else if (toolName === "youtube_transcript") {
            phase = "tool_use"
            action = `Getting YouTube transcript: ${toolArgs.url}`
            toolQuery = toolArgs.url || ""
          }

          // Send phase and tool status events with detailed information
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: {
                  phase: phase,
                  toolName: toolName,
                  searchQuery: toolQuery,
                  toolArguments: toolArgs,
                  searchProvider: toolName === "web_search" ? searchProvider : undefined,
                  searchParameters: toolName === "web_search" ? searchSettings : undefined,
                  action: action
                } }],
              })}\n\n`
            )
          )

          // Add assistant message with tool calls
          currentMessages.push({
            role: "assistant",
            content: "",
            tool_calls: accumulatedToolCalls,
          })

          // Execute tool calls
          const toolResults = await Promise.all(
            accumulatedToolCalls.map(async (toolCall) => {
              const args = parseToolArguments(toolCall.function.arguments)

              if (toolCall.function.name === "web_search") {
                if (!searchApiKey) {
                  return {
                    tool_call_id: toolCall.id,
                    role: "tool" as const,
                    name: "web_search",
                    content: "Error: No search API key configured",
                  }
                }
                const result = await executeWebSearch(args.query || "", searchProvider, searchApiKey, searchSettings)
                return {
                  tool_call_id: toolCall.id,
                  role: "tool" as const,
                  name: "web_search",
                  content: result,
                }
              }

              if (toolCall.function.name === "url_fetch") {
                console.log("[Chat] Executing url_fetch:", args.url)
                const result = await fetchUrlContent(args.url || "")
                return {
                  tool_call_id: toolCall.id,
                  role: "tool" as const,
                  name: "url_fetch",
                  content: formatUrlFetchResult(result),
                }
              }

              if (toolCall.function.name === "youtube_transcript") {
                console.log("[Chat] Executing youtube_transcript:", args.url)
                const result = await fetchYouTubeTranscript(args.url || "")
                return {
                  tool_call_id: toolCall.id,
                  role: "tool" as const,
                  name: "youtube_transcript",
                  content: formatYouTubeResult(result),
                }
              }

              if (toolCall.function.name === "get_weather") {
                console.log("[Chat] Executing get_weather:", args.location, args.type)
                const result = await executeWeather(args.location || "", args.type || "current")
                return {
                  tool_call_id: toolCall.id,
                  role: "tool" as const,
                  name: "get_weather",
                  content: result,
                }
              }

              return {
                tool_call_id: toolCall.id,
                role: "tool" as const,
                name: toolCall.function.name,
                content: `Unknown tool: ${toolCall.function.name}`,
              }
            })
          )

          currentMessages.push(...toolResults)

          // Extract preview from search results
          const searchResultsPreview = toolResults.length > 0
            ? toolResults[0].content.substring(0, 500) + (toolResults[0].content.length > 500 ? '...' : '')
            : ''

          // Send search complete event with detailed results
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: {
                  searchComplete: true,
                  searchResultCount: toolResults.length,
                  resultSummary: `Found ${toolResults.length} result${toolResults.length !== 1 ? 's' : ''} from ${searchProvider}`,
                  searchResultsPreview: searchResultsPreview
                } }],
              })}\n\n`
            )
          )

          // Continue to get the final response
          continue
        }

        // No more tool calls, we're done
        break
      }

      // Send done phase event
      await writer.write(
        encoder.encode(
          `data: ${JSON.stringify({
            choices: [{ delta: { phase: "done" } }],
          })}\n\n`
        )
      )
    } catch (error) {
      console.error("[Chat] Streaming error:", error)
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: "Streaming error" })}\n\n`)
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
}
