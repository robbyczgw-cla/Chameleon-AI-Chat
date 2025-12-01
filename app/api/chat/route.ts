import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { webSearchTool, modelSupportsToolCalling, parseToolArguments } from "@/lib/tools"

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
}

// Search cache to reduce duplicate searches
const searchCache = new Map<string, { result: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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
          type: settings.searchType || "auto",
          useAutoprompt: settings.useAutoprompt !== false,
          numResults: settings.maxResults || 5,
          livecrawl: settings.livecrawl || "fallback",
          contents: {
            text: settings.includeFullText !== false ? { maxCharacters: settings.maxTextCharacters || 3000 } : false,
            highlights: settings.includeHighlights !== false ? { numSentences: settings.highlightsPerResult || 3 } : false,
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

    // Add tools if enabled
    if (shouldIncludeTools) {
      openRouterBody.tools = [webSearchTool]
      openRouterBody.tool_choice = "auto"
    }

    // Add reasoning parameter if enabled
    if (reasoning) {
      openRouterBody.reasoning = { effort: "medium" }
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

              if (finish) {
                finishReason = finish
              }

              // Accumulate tool calls
              if (delta?.tool_calls) {
                hasToolCalls = true
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

              // Forward content to client (only if not in tool call mode)
              if (delta?.content && !hasToolCalls) {
                // Send responding phase on first content
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
                await writer.write(encoder.encode(line + "\n"))
              }
            } catch (e) {
              // Ignore parse errors for incomplete JSON
            }
          }
        }

        // Handle tool calls
        if (hasToolCalls && accumulatedToolCalls.length > 0 && searchApiKey && toolsEnabled) {
          console.log("[Chat] Processing tool calls:", accumulatedToolCalls.length)

          // Parse the search query from tool call arguments
          const toolArgs = parseToolArguments(accumulatedToolCalls[0]?.function.arguments || "{}")
          const toolName = accumulatedToolCalls[0]?.function.name || "unknown"

          // Send phase and tool status events with detailed information
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: {
                  phase: "searching",
                  searching: true,
                  toolName: toolName,
                  searchQuery: toolArgs.query || accumulatedToolCalls[0]?.function.arguments,
                  // Enhanced detailed information
                  toolArguments: toolArgs,
                  searchProvider: searchProvider,
                  searchParameters: searchSettings,
                  action: `Searching ${searchProvider}: "${toolArgs.query}"`
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

          currentMessages.push(...toolResults)

          // Send search complete event with detailed results
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: {
                  searchComplete: true,
                  searchResultCount: toolResults.length,
                  resultSummary: `Found ${toolResults.length} result${toolResults.length !== 1 ? 's' : ''} from ${searchProvider}`
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
