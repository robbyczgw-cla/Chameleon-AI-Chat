import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { webSearchTool, urlFetchTool, youtubeTranscriptTool, weatherTool, shopifyTool, modelSupportsToolCalling, parseToolArguments } from "@/lib/tools"
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
  reasoningDepth?: "minimal" | "low" | "medium" | "high"
  // Tool calling options
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
}

// Search cache to reduce duplicate searches
const searchCache = new Map<string, { result: { content: string; results: any[] }; timestamp: number }>()
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

      const forecastText = forecast.map((day: any) => {
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
 * Execute Shopify API call
 */
async function executeShopify(
  action: string,
  args: Record<string, any>,
  storeUrl: string,
  accessToken: string
): Promise<string> {
  console.log(`[Tool] 🛒 Executing shopify_products: "${action}"`, args)

  try {
    // Clean up store URL
    const cleanStoreUrl = storeUrl
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")

    const graphqlEndpoint = `https://${cleanStoreUrl}/admin/api/2024-01/graphql.json`

    let graphqlQuery: string
    let variables: any

    switch (action) {
      case "search_products":
        graphqlQuery = `
          query searchProducts($query: String!, $first: Int!) {
            products(first: $first, query: $query) {
              edges {
                node {
                  id
                  title
                  handle
                  description
                  vendor
                  status
                  onlineStoreUrl
                  featuredImage {
                    url
                    altText
                  }
                  images(first: 3) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                  variants(first: 5) {
                    edges {
                      node {
                        title
                        price
                        compareAtPrice
                        sku
                        inventoryQuantity
                        availableForSale
                      }
                    }
                  }
                }
              }
            }
          }
        `
        variables = { query: args.query || "", first: Math.min(parseInt(args.limit) || 10, 50) }
        break

      case "list_products":
        graphqlQuery = `
          query listProducts($first: Int!) {
            products(first: $first) {
              edges {
                node {
                  id
                  title
                  handle
                  description
                  vendor
                  status
                  onlineStoreUrl
                  featuredImage {
                    url
                    altText
                  }
                  images(first: 3) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                  variants(first: 5) {
                    edges {
                      node {
                        title
                        price
                        compareAtPrice
                        sku
                        inventoryQuantity
                        availableForSale
                      }
                    }
                  }
                }
              }
            }
          }
        `
        variables = { first: Math.min(parseInt(args.limit) || 10, 50) }
        break

      case "get_inventory":
        graphqlQuery = `
          query getInventory($first: Int!) {
            products(first: $first) {
              edges {
                node {
                  title
                  variants(first: 10) {
                    edges {
                      node {
                        title
                        sku
                        inventoryQuantity
                        availableForSale
                      }
                    }
                  }
                }
              }
            }
          }
        `
        variables = { first: Math.min(parseInt(args.limit) || 50, 100) }
        break

      default:
        return `Unbekannte Shopify-Aktion: ${action}`
    }

    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables,
      }),
    })

    if (!response.ok) {
      console.error("[Tool] ❌ Shopify API error:", response.status)
      return `Shopify API Fehler: ${response.status}. Bitte prüfe die Store-Einstellungen.`
    }

    const data = await response.json()

    if (data.errors) {
      console.error("[Tool] ❌ Shopify GraphQL errors:", data.errors)
      return `Shopify Fehler: ${data.errors[0]?.message || "Unbekannter Fehler"}`
    }

    // Format results for the AI
    const products = data.data?.products?.edges || []

    if (products.length === 0) {
      return action === "search_products"
        ? `Keine Produkte gefunden für "${args.query}".`
        : "Keine Produkte im Store gefunden."
    }

    let formattedResult = `## Shopify Produkte${action === "search_products" ? ` für "${args.query}"` : ""}\n\n`

    // Get public store domain for product links (remove /admin part from URL)
    const publicStoreDomain = cleanStoreUrl.replace(".myshopify.com", ".myshopify.com").replace(/\/admin.*$/, "")

    products.forEach((edge: any, index: number) => {
      const product = edge.node
      const variants = product.variants?.edges || []
      const firstVariant = variants[0]?.node

      formattedResult += `### ${index + 1}. ${product.title}\n`

      // Add product image if available
      const imageUrl = product.featuredImage?.url || product.images?.edges?.[0]?.node?.url
      if (imageUrl) {
        const altText = product.featuredImage?.altText || product.images?.edges?.[0]?.node?.altText || product.title
        formattedResult += `![${altText}](${imageUrl})\n\n`
      }

      if (product.description) {
        formattedResult += `${product.description.substring(0, 200)}${product.description.length > 200 ? "..." : ""}\n`
      }

      // Add product link - use onlineStoreUrl if available, otherwise construct from handle
      const productUrl = product.onlineStoreUrl || (product.handle ? `https://${publicStoreDomain}/products/${product.handle}` : null)
      if (productUrl) {
        formattedResult += `- **Link:** [Zum Produkt](${productUrl})\n`
      }

      formattedResult += `- **Status:** ${product.status === "ACTIVE" ? "Aktiv" : "Inaktiv"}\n`

      if (firstVariant) {
        const price = parseFloat(firstVariant.price)
        const compareAtPrice = firstVariant.compareAtPrice ? parseFloat(firstVariant.compareAtPrice) : null

        // Format price with UVP and discount if applicable
        if (compareAtPrice && compareAtPrice > price) {
          const discountPercent = Math.round((1 - price / compareAtPrice) * 100)
          formattedResult += `- **Preis:** €${price.toFixed(2)} ~~€${compareAtPrice.toFixed(2)}~~ **(-${discountPercent}%)**\n`
        } else {
          formattedResult += `- **Preis:** €${price.toFixed(2)}\n`
        }

        if (firstVariant.inventoryQuantity !== undefined) {
          formattedResult += `- **Lagerbestand:** ${firstVariant.inventoryQuantity} Stück\n`
          formattedResult += `- **Verfügbar:** ${firstVariant.availableForSale ? "Ja" : "Nein"}\n`
        }
        if (firstVariant.sku) {
          formattedResult += `- **SKU:** ${firstVariant.sku}\n`
        }
      }

      // Show other variants if available
      if (variants.length > 1) {
        formattedResult += `- **Varianten:** ${variants.length} (${variants.slice(0, 3).map((v: any) => v.node.title).join(", ")}${variants.length > 3 ? "..." : ""})\n`
      }

      // Show additional images if available
      const additionalImages = product.images?.edges?.slice(1, 3) || []
      if (additionalImages.length > 0) {
        formattedResult += `- **Weitere Bilder:** ${additionalImages.length}\n`
      }

      formattedResult += "\n"
    })

    formattedResult += `---\n*${products.length} Produkt${products.length !== 1 ? "e" : ""} gefunden*`

    console.log(`[Tool] ✅ Shopify: ${products.length} products found`)
    return formattedResult
  } catch (error) {
    console.error("[Tool] ❌ Shopify request failed:", error)
    return `Shopify Fehler: ${error instanceof Error ? error.message : "Unbekannter Fehler"}. Bitte versuche es erneut.`
  }
}

/**
 * Execute web search using the specified provider
 * Returns both formatted text and raw search results for UI display
 */
async function executeWebSearch(
  query: string,
  provider: "tavily" | "serper" | "exa",
  apiKey: string,
  settings: Record<string, any> = {}
): Promise<{ content: string; results: any[] }> {
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
    const headers: Record<string, string> = { "Content-Type": "application/json" }

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
        return { content: `Search failed: Unknown provider "${provider}"`, results: [] }
    }

    const response = await fetch(searchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Tool] ❌ Search API error:`, response.status, errorText)
      return { content: `Search failed: ${response.status} - ${errorText.substring(0, 200)}`, results: [] }
    }

    const data = await response.json()
    let formattedResults: string
    let rawResults: any[] = []

    // Format results based on provider
    switch (provider) {
      case "tavily": {
        const results = data.results || []
        rawResults = results.slice(0, 8).map((r: any) => ({
          title: r.title || "",
          url: r.url || "",
          content: r.content || "",
          score: r.score || 0,
          publishedDate: r.published_date,
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
        const results = data.organic || []
        rawResults = results.slice(0, 8).map((r: any) => ({
          title: r.title || "",
          url: r.link || "",
          content: r.snippet || "",
          score: r.position || 0,
        }))
        formattedResults = rawResults
          .map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.content}\n   Source: ${r.url}`)
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
        rawResults = results.slice(0, 8).map((r: any) => ({
          title: r.title || "",
          url: r.url || "",
          content: r.text || "",
          score: r.score || 0,
          publishedDate: r.publishedDate,
          highlights: r.highlights || [],
          image: r.image,
          author: r.author,
        }))
        formattedResults = rawResults
          .map((r: any, i: number) => {
            let content = ""
            if (r.highlights?.length) {
              content = r.highlights.slice(0, 2).join(" ... ")
            } else if (r.content) {
              content = r.content.substring(0, 300) + (r.content.length > 300 ? "..." : "")
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

    const content = `## Web Search Results for "${query}"\n\n${formattedResults}\n\n---\n*Search provider: ${provider}*`
    const result = { content, results: rawResults }

    // Cache the result
    searchCache.set(cacheKey, { result, timestamp: Date.now() })

    console.log(`[Tool] ✅ Search completed: ${rawResults.length} results`)
    return result
  } catch (error) {
    console.error("[Tool] ❌ Search failed:", error)
    return { content: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}. Please try rephrasing or continue without search.`, results: [] }
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
      reasoningDepth = "medium",
      // Tool calling options
      enableAutoToolUse = true,
      searchProvider = "tavily",
      searchApiKey,
      searchSettings = {},
      // Experimental tool settings (default to true for backward compatibility)
      enableUrlFetchTool = true,
      enableYouTubeTool = true,
      enableWeatherTool = true,
      // Shopify tool settings (HiFi mode)
      enableShopifyTool = false,
      shopifyStoreUrl,
      shopifyAccessToken,
    } = body as ChatRequest

    const maxTokens = Math.max(requestedMaxTokens || 16000, 16000)

    // Inject current date into system message so AI knows the current date for search queries
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const dateContext = `\n\n[CURRENT DATE: ${currentDate}. When searching for "current", "latest", or "recent" information, use ${new Date().getFullYear()} as the year, not previous years.]`

    // Add date context to the first system message
    const messagesWithDate = messages.map((msg: Message, index: number) => {
      if (msg.role === "system" && index === 0 && typeof msg.content === "string") {
        return { ...msg, content: msg.content + dateContext }
      }
      return msg
    })

    console.log("[Chat] ===== API ROUTE CALLED =====")
    console.log("[Chat] Model:", model)
    console.log("[Chat] Stream:", stream)
    console.log("[Chat] Auto Tool Use:", enableAutoToolUse)
    console.log("[Chat] Search Provider:", searchProvider)

    // Get API key from environment or request headers
    const apiKey = process.env.OPENROUTER_API_KEY || req.headers.get("x-openrouter-api-key")

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 401 })
    }

    // Determine if we should include tools
    const modelSupportsTool = modelSupportsToolCalling(model)
    const shouldIncludeTools = enableAutoToolUse && searchApiKey && modelSupportsTool

    console.log("[Chat] Include tools:", shouldIncludeTools, "| Model supports tools:", modelSupportsTool, "| enableAutoToolUse:", enableAutoToolUse, "| hasSearchApiKey:", !!searchApiKey)

    const openRouterBody: Record<string, any> = {
      model,
      messages: messagesWithDate,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream,
    }

    // Add tools if enabled - conditionally include tools based on settings
    if (shouldIncludeTools) {
      const tools = [webSearchTool] // Web search is always included when auto tool use is enabled
      if (enableWeatherTool) tools.push(weatherTool)
      if (enableUrlFetchTool) tools.push(urlFetchTool)
      if (enableYouTubeTool) tools.push(youtubeTranscriptTool)
      // Add Shopify tool for HiFi users with configured store
      if (enableShopifyTool && shopifyStoreUrl && shopifyAccessToken) {
        tools.push(shopifyTool)
        console.log("[Chat] Shopify tool enabled for store:", shopifyStoreUrl)
      }
      openRouterBody.tools = tools
      openRouterBody.tool_choice = "auto"
      console.log("[Chat] Tools enabled:", tools.map(t => t.function.name).join(", "))
    }

    // Add reasoning parameter if enabled
    // Different models use different reasoning formats and parameter names:
    // - Gemini 3: thinking_level (minimal, low, medium, high)
    // - OpenAI o1/o3/GPT-5: effort (none, minimal, low, medium, high, xhigh)
    // - Grok: effort (low, medium, high)
    // - Claude: Extended thinking is automatic (not configurable depth)
    // - DeepSeek R1: Just on/off (no configurable depth)
    // - MiMo: Should NOT use reasoning with tools (OpenRouter recommendation)
    const modelLower = model.toLowerCase()
    const isMimoModel = modelLower.includes('mimo')
    const isGemini3Model = modelLower.includes('gemini-3')
    const isOpenAIReasoning = modelLower.includes('o1') || modelLower.includes('o3') || modelLower.includes('gpt-5')
    const isGrokModel = modelLower.includes('grok')
    const isDeepSeekR1 = modelLower.includes('deepseek-r1') || modelLower.includes('deepseek/r1')
    const isClaudeModel = modelLower.includes('claude')

    const shouldUseReasoning = reasoning && !(isMimoModel && shouldIncludeTools)

    if (shouldUseReasoning) {
      if (isGemini3Model) {
        // Gemini 3: thinking_level (minimal, low, medium, high)
        openRouterBody.reasoning = { thinking_level: reasoningDepth }
        console.log(`[Chat] Gemini 3 reasoning enabled with thinking_level: ${reasoningDepth}`)
      } else if (isOpenAIReasoning) {
        // OpenAI o1/o3/GPT-5: effort (none, minimal, low, medium, high, xhigh)
        // Map our levels to OpenAI's scale
        const openAIEffort = reasoningDepth === "minimal" ? "low" : reasoningDepth
        openRouterBody.reasoning = { effort: openAIEffort }
        console.log(`[Chat] OpenAI reasoning enabled with effort: ${openAIEffort}`)
      } else if (isGrokModel) {
        // Grok: Just on/off reasoning (no configurable depth)
        openRouterBody.reasoning = { enabled: true }
        console.log("[Chat] Grok reasoning enabled (on/off only)")
      } else if (isDeepSeekR1) {
        // DeepSeek R1: Just on/off, no configurable depth
        openRouterBody.reasoning = { enabled: true }
        console.log("[Chat] DeepSeek R1 reasoning enabled (depth not configurable)")
      } else if (isClaudeModel) {
        // Claude: Extended thinking is automatic via include_reasoning
        // No explicit reasoning parameter needed, just include_reasoning
        console.log("[Chat] Claude extended thinking enabled (automatic)")
      } else {
        // Fallback for other models: use effort parameter
        openRouterBody.reasoning = { effort: reasoningDepth }
        console.log(`[Chat] Generic reasoning enabled with effort: ${reasoningDepth}`)
      }
      // CRITICAL: OpenRouter requires include_reasoning to actually return reasoning tokens
      openRouterBody.include_reasoning = true
    }

    if (isMimoModel && reasoning && shouldIncludeTools) {
      console.log("[Chat] ⚠️ MiMo: Disabled reasoning because tools are enabled (OpenRouter recommendation)")
    }

    // Non-streaming request with tool calling
    if (!stream) {
      return handleNonStreamingRequest(openRouterBody, apiKey, searchApiKey!, searchProvider, searchSettings, { shopifyStoreUrl, shopifyAccessToken })
    }

    // Streaming request - more complex handling for tool calls
    return handleStreamingRequest(openRouterBody, apiKey, searchApiKey, searchProvider, searchSettings, Boolean(shouldIncludeTools), { shopifyStoreUrl, shopifyAccessToken })
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
  searchSettings: Record<string, any>,
  shopifyConfig?: { shopifyStoreUrl?: string; shopifyAccessToken?: string }
) {
  const MAX_ITERATIONS = 3
  let iterations = 0
  const currentMessages = [...openRouterBody.messages]

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
          const args = parseToolArguments(toolCall.function.arguments)

          if (toolCall.function.name === "web_search") {
            const searchResult = await executeWebSearch(args.query || "", searchProvider, searchApiKey, searchSettings)
            return {
              tool_call_id: toolCall.id,
              role: "tool" as const,
              name: "web_search",
              content: searchResult.content,
              searchResults: searchResult.results, // Store raw results for frontend
            }
          }

          if (toolCall.function.name === "shopify_products") {
            if (!shopifyConfig?.shopifyStoreUrl || !shopifyConfig?.shopifyAccessToken) {
              return {
                tool_call_id: toolCall.id,
                role: "tool" as const,
                name: "shopify_products",
                content: "Shopify ist nicht konfiguriert. Bitte gib Store-URL und Access Token in den Einstellungen ein.",
              }
            }
            const result = await executeShopify(
              args.action || "list_products",
              args,
              shopifyConfig.shopifyStoreUrl,
              shopifyConfig.shopifyAccessToken
            )
            return {
              tool_call_id: toolCall.id,
              role: "tool" as const,
              name: "shopify_products",
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

    // No more tool calls, return the final response with generation ID
    // OpenRouter returns the generation ID in the response for exact cost tracking
    return NextResponse.json({
      ...data,
      generation_id: data.id, // Expose generation ID for exact cost tracking
    })
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
  toolsEnabled: boolean,
  shopifyConfig?: { shopifyStoreUrl?: string; shopifyAccessToken?: string }
) {
  const encoder = new TextEncoder()

  // Create a TransformStream for the response
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  // Handle the streaming in the background
  ;(async () => {
    try {
      const currentMessages = [...openRouterBody.messages]
      let iterations = 0
      const MAX_ITERATIONS = 3
      let hasStartedResponding = false
      let hasStartedReasoning = false // Track if we've sent the initial reasoning phase
      const allGenerationIds: string[] = [] // Track ALL generation IDs for tool calling cost tracking
      let lastToolCallIteration = 0 // Track which iteration had tool calls (for fallback logic)

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
        console.log(`[Chat] ===== Iteration ${iterations} of ${MAX_ITERATIONS} =====`)
        console.log(`[Chat] Current messages count: ${currentMessages.length}`)

        // Log the last message to debug tool result format
        const lastMsg = currentMessages[currentMessages.length - 1]
        if (lastMsg) {
          console.log(`[Chat] Last message role: ${lastMsg.role}, has content: ${!!lastMsg.content}`)
          if (lastMsg.role === "tool") {
            console.log(`[Chat] Tool result name: ${(lastMsg as any).name}, content length: ${(lastMsg as any).content?.length || 0}`)
          }
        }

        // Log the request being sent (for debugging tool call issues)
        if (iterations > 1) {
          console.log(`[Chat] Second iteration - sending ${currentMessages.length} messages to OpenRouter`)
          // Log the last few messages to see tool result format
          const lastThree = currentMessages.slice(-3)
          lastThree.forEach((msg, i) => {
            const msgIndex = currentMessages.length - 3 + i
            const msgAny = msg as any
            console.log(`[Chat] Message[${msgIndex}]: role=${msg.role}, hasContent=${!!msg.content}, contentLength=${(msg.content as string)?.length || 0}`)
            if (msg.tool_calls) {
              console.log(`[Chat] Message[${msgIndex}]: has tool_calls=${msg.tool_calls.length}`)
            }
            // Log thought signature presence (critical for Gemini 3)
            if (msgAny.thought_signature) {
              console.log(`[Chat] Message[${msgIndex}]: has thought_signature ✓`)
            }
            if (msgAny.reasoning_details) {
              console.log(`[Chat] Message[${msgIndex}]: has reasoning_details (${msgAny.reasoning_details.length} items) ✓`)
            }
          })
        }

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

        console.log(`[Chat] OpenRouter response status: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[Chat] OpenRouter error response: ${errorText.substring(0, 500)}`)
          await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorText })}\n\n`))
          break
        }

        const reader = response.body?.getReader()
        if (!reader) break

        const decoder = new TextDecoder()
        let buffer = ""
        const accumulatedToolCalls: ToolCall[] = []
        let hasToolCalls = false
        let finishReason = ""
        let generationId: string | undefined = undefined
        // Gemini 3 thought signatures - MUST be preserved for multi-turn tool calling
        // See: https://ai.google.dev/gemini-api/docs/thought-signatures
        let accumulatedReasoningDetails: any[] = []
        let thoughtSignature: string | undefined = undefined

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
                // Send ALL generation IDs before [DONE] for exact cost tracking
                // Tool calling creates multiple generations, each with its own cost
                if (allGenerationIds.length > 0) {
                  await writer.write(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        generation_id: generationId, // Last generation ID (for backwards compatibility)
                        all_generation_ids: allGenerationIds, // All IDs for complete cost tracking
                        tool_call_count: allGenerationIds.length - 1, // Number of tool call iterations
                      })}\n\n`
                    )
                  )
                  console.log(`[Chat] Sent ${allGenerationIds.length} generation IDs for cost tracking`)
                }
                await writer.write(encoder.encode("data: [DONE]\n\n"))
              }
              continue
            }

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta
              const finish = parsed.choices?.[0]?.finish_reason

              // DEBUG: Log ALL SSE events from first iteration to diagnose MiMo empty response
              if (iterations === 1) {
                const eventSummary = {
                  hasContent: !!delta?.content,
                  hasText: !!delta?.text,
                  hasToolCalls: !!delta?.tool_calls,
                  toolCallsLength: delta?.tool_calls?.length,
                  finishReason: finish,
                  deltaKeys: delta ? Object.keys(delta) : [],
                  choiceKeys: parsed.choices?.[0] ? Object.keys(parsed.choices[0]) : [],
                }
                console.log("[Chat] SSE event:", JSON.stringify(eventSummary))
                // Log full event for tool calls or unexpected formats
                if (delta?.tool_calls || (!delta?.content && !delta?.text && Object.keys(delta || {}).length > 0)) {
                  console.log("[Chat] Full SSE data:", JSON.stringify(parsed).substring(0, 500))
                }
              }

              // Capture generation ID from response for exact cost tracking
              // Each API call (including tool call iterations) gets its own generation ID
              if (parsed.id && !generationId) {
                generationId = parsed.id
                allGenerationIds.push(parsed.id) // Track all generation IDs for total cost
                console.log(`[Chat] Captured generation ID #${allGenerationIds.length}: ${parsed.id}`)
              }

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

              // Capture Gemini 3 thought signatures for multi-turn tool calling
              // These MUST be preserved and passed back, otherwise Gemini 3 returns 400 error
              // See: https://ai.google.dev/gemini-api/docs/thought-signatures
              if (delta?.thought_signature) {
                thoughtSignature = delta.thought_signature
                console.log("[Chat] Captured thought_signature for Gemini 3")
              }
              // Also check parsed level (OpenRouter may put it at choice level)
              if (parsed.choices?.[0]?.thought_signature) {
                thoughtSignature = parsed.choices[0].thought_signature
                console.log("[Chat] Captured thought_signature from choice level")
              }
              // Capture reasoning_details array (OpenRouter format for reasoning tokens)
              if (delta?.reasoning_details && Array.isArray(delta.reasoning_details)) {
                accumulatedReasoningDetails.push(...delta.reasoning_details)
                // Check if any reasoning detail contains a thought signature
                for (const detail of delta.reasoning_details) {
                  if (detail.thought_signature) {
                    thoughtSignature = detail.thought_signature
                    console.log("[Chat] Captured thought_signature from reasoning_details")
                  }
                }
              }
              // Also check at message level
              if (parsed.choices?.[0]?.message?.reasoning_details) {
                const msgReasoningDetails = parsed.choices[0].message.reasoning_details
                if (Array.isArray(msgReasoningDetails)) {
                  accumulatedReasoningDetails = msgReasoningDetails
                  console.log("[Chat] Captured reasoning_details from message level:", msgReasoningDetails.length)
                }
              }

              // Forward reasoning content (o1, DeepSeek R1, Grok, thinking models)
              // Check for reasoning_content, reasoning, thinking fields AND reasoning_details array
              let reasoningContent = delta?.reasoning_content || delta?.reasoning || delta?.thinking

              // Handle reasoning_details array format (OpenRouter standard for Grok, newer models)
              if (!reasoningContent && delta?.reasoning_details && Array.isArray(delta.reasoning_details)) {
                for (const detail of delta.reasoning_details) {
                  if (detail.type === "reasoning.text" && detail.text) {
                    reasoningContent = detail.text
                  } else if (detail.type === "reasoning.summary" && detail.summary) {
                    reasoningContent = detail.summary
                  }
                }
              }

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
                await writer.write(encoder.encode(`${line  }\n\n`))
              }
            } catch (e) {
              // Log parse errors for debugging - don't silently swallow them
              console.warn("[Chat] SSE parse error:", e, "- raw data:", data?.substring(0, 100))
            }
          }
        }

        // Debug: Log stream completion summary
        console.log(`[Chat] Stream ${iterations} complete - hasToolCalls: ${hasToolCalls}, finishReason: ${finishReason}, generationId: ${generationId}`)
        console.log(`[Chat] Accumulated tool calls: ${accumulatedToolCalls.length}`)

        // Handle tool calls
        if (hasToolCalls && accumulatedToolCalls.length > 0 && toolsEnabled) {
          console.log("[Chat] Processing tool calls:", accumulatedToolCalls.length)
          lastToolCallIteration = iterations // Track this iteration had tool calls

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
          } else if (toolName === "shopify_products") {
            phase = "tool_use"
            action = `Shopify: ${toolArgs.action === "search_products" ? `Suche "${toolArgs.query}"` : toolArgs.action === "get_inventory" ? "Lagerbestand abrufen" : "Produkte laden"}`
            toolQuery = toolArgs.query || toolArgs.action || ""
          }

          // Send phase and tool status events with detailed information
          await writer.write(
            encoder.encode(
              `data: ${JSON.stringify({
                choices: [{ delta: {
                  phase,
                  toolName,
                  // Only send searchQuery for web_search to avoid confusing the frontend
                  ...(toolName === "web_search" && { searchQuery: toolQuery }),
                  // Send toolInput for all tools so frontend can show what's being processed
                  toolInput: toolQuery,
                  toolArguments: toolArgs,
                  searchProvider: toolName === "web_search" ? searchProvider : undefined,
                  searchParameters: toolName === "web_search" ? searchSettings : undefined,
                  action
                } }],
              })}\n\n`
            )
          )

          // Add assistant message with tool calls
          // CRITICAL: For Gemini 3, we MUST include thought_signature and reasoning_details
          // Otherwise the model returns 400 error or empty response on the next turn
          // See: https://ai.google.dev/gemini-api/docs/thought-signatures
          const assistantMessage: any = {
            role: "assistant",
            content: "",
            tool_calls: accumulatedToolCalls,
          }
          // Include thought signature if captured (required for Gemini 3)
          if (thoughtSignature) {
            assistantMessage.thought_signature = thoughtSignature
            console.log("[Chat] Including thought_signature in assistant message")
          }
          // Include reasoning_details if captured (OpenRouter format)
          if (accumulatedReasoningDetails.length > 0) {
            assistantMessage.reasoning_details = accumulatedReasoningDetails
            console.log("[Chat] Including reasoning_details in assistant message:", accumulatedReasoningDetails.length)
          }
          currentMessages.push(assistantMessage)

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
                    searchResults: [],
                  }
                }
                const searchResult = await executeWebSearch(args.query || "", searchProvider, searchApiKey, searchSettings)
                return {
                  tool_call_id: toolCall.id,
                  role: "tool" as const,
                  name: "web_search",
                  content: searchResult.content,
                  searchResults: searchResult.results, // Store raw results for frontend
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

              if (toolCall.function.name === "shopify_products") {
                console.log("[Chat] Executing shopify_products:", args.action)
                if (!shopifyConfig?.shopifyStoreUrl || !shopifyConfig?.shopifyAccessToken) {
                  return {
                    tool_call_id: toolCall.id,
                    role: "tool" as const,
                    name: "shopify_products",
                    content: "Shopify ist nicht konfiguriert. Bitte gib Store-URL und Access Token in den Einstellungen ein.",
                  }
                }
                const result = await executeShopify(
                  args.action || "list_products",
                  args,
                  shopifyConfig.shopifyStoreUrl,
                  shopifyConfig.shopifyAccessToken
                )
                return {
                  tool_call_id: toolCall.id,
                  role: "tool" as const,
                  name: "shopify_products",
                  content: result,
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
          console.log(`[Chat] Added ${toolResults.length} tool results to messages. Total messages: ${currentMessages.length}`)
          console.log(`[Chat] Tool result content length: ${toolResults[0]?.content?.length || 0}`)

          // Extract search results from tool results (only for web_search)
          const firstToolName = accumulatedToolCalls[0]?.function.name
          const searchResults = firstToolName === "web_search" && toolResults.length > 0 && toolResults[0].searchResults
            ? toolResults[0].searchResults
            : []
          const searchResultsPreview = firstToolName === "web_search" && toolResults.length > 0
            ? toolResults[0].content.substring(0, 500) + (toolResults[0].content.length > 500 ? '...' : '')
            : ''

          // Send search complete event with detailed results (only for web_search)
          if (firstToolName === "web_search") {
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({
                  choices: [{ delta: {
                    searchComplete: true,
                    searchResultCount: searchResults.length,
                    resultSummary: `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} from ${searchProvider}`,
                    searchResultsPreview,
                    searchResults // Send full results array for rich UI display
                  } }],
                })}\n\n`
              )
            )
          }

          // Continue to get the final response
          continue
        }

        // No more tool calls, we're done
        // FALLBACK: If first iteration returns empty response WITH tools enabled, retry WITHOUT tools
        // This handles models like MiMo that claim tool support but may fail silently
        if (iterations === 1 && !hasStartedResponding && !hasToolCalls && toolsEnabled) {
          console.log("[Chat] ⚠️ Empty response with tools enabled - retrying WITHOUT tools")

          // Remove tools from request and retry
          delete openRouterBody.tools
          delete openRouterBody.tool_choice

          // Reset generation tracking for retry
          allGenerationIds.length = 0

          // Continue to next iteration (will be iteration 2, without tools)
          continue
        }

        // Check if we got content in this iteration (after tool use)
        if (iterations > 1 && !hasStartedResponding && lastToolCallIteration > 0) {
          console.warn(`[Chat] ⚠️ Iteration ${iterations}: No content received after tool execution in iteration ${lastToolCallIteration}!`)
          console.warn(`[Chat] finishReason: ${finishReason}, hasToolCalls: ${hasToolCalls}, model: ${openRouterBody.model}`)
          console.warn(`[Chat] Model may not support multi-turn tool calling properly through OpenRouter`)

          // FALLBACK: If we have tool results but no model response, send the tool result directly
          // This ensures users at least see the tool output even if the model can't synthesize it
          const toolResultMessages = currentMessages.filter(m => m.role === "tool")
          if (toolResultMessages.length > 0) {
            console.log(`[Chat] 🔄 FALLBACK: Sending ${toolResultMessages.length} tool results directly to user`)

            // Send responding phase first
            await writer.write(
              encoder.encode(
                `data: ${JSON.stringify({
                  choices: [{ delta: { phase: "responding" } }],
                })}\n\n`
              )
            )

            // Format and send tool results as markdown content
            for (const toolResult of toolResultMessages) {
              const resultContent = (toolResult as any).content || "No result available"
              const toolName = (toolResult as any).name || "tool"

              // Send the tool result as content chunks
              const fallbackMessage = `\n\n**${toolName === "get_weather" ? "🌤️ Weather" : toolName === "web_search" ? "🔍 Search Results" : "📋 Tool Result"}:**\n\n${resultContent}\n\n*Note: Model could not synthesize this result, showing raw tool output.*`

              // Send in chunks to simulate streaming
              const chunkSize = 50
              for (let i = 0; i < fallbackMessage.length; i += chunkSize) {
                const chunk = fallbackMessage.slice(i, i + chunkSize)
                await writer.write(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      choices: [{ delta: { content: chunk } }],
                    })}\n\n`
                  )
                )
              }
            }

            await writer.write(encoder.encode("data: [DONE]\n\n"))
          }
        }
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
