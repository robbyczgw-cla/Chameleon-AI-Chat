/**
 * OpenRouter Tool Calling - Web Search Tool
 *
 * This module defines tools that can be called by capable LLMs via OpenRouter.
 * The AI model decides when to use these tools based on user queries.
 *
 * Compatible models:
 * - GPT-4, GPT-4 Turbo, GPT-4o (OpenAI)
 * - Claude 3.5 Sonnet, Claude 3 Opus (Anthropic)
 * - Gemini 1.5 Pro, Gemini 2.0 Flash (Google)
 * - DeepSeek V3, DeepSeek Chat (DeepSeek)
 * - Qwen 2.5 72B+ (Alibaba)
 */

export interface ToolDefinition {
  type: "function"
  function: {
    name: string
    description: string
    parameters: {
      type: "object"
      properties: Record<string, {
        type: string
        description: string
        enum?: string[]
      }>
      required: string[]
    }
  }
}

export interface ToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string // JSON string
  }
}

export interface ToolResult {
  tool_call_id: string
  role: "tool"
  name: string
  content: string
}

/**
 * Web Search Tool Definition
 *
 * The model uses this to search the web for current information.
 * The detailed description helps the model decide WHEN to use it.
 */
export const webSearchTool: ToolDefinition = {
  type: "function",
  function: {
    name: "web_search",
    description: `Search the web for current information, news, events, real-time data, or recent facts. Use this when the user asks about:
- Current events, news, or recent happenings (e.g., "What happened today?", "Latest news about...")
- Today's weather, stock prices, sports scores, or live data
- Recent product releases, updates, or announcements
- Local events, places, or businesses (concerts, restaurants, etc.)
- Prices, availability, or shopping comparisons
- Factual verification of recent claims or rumors
- Any information that might have changed since your knowledge cutoff

DO NOT use for:
- General knowledge questions (e.g., "What is Python?", "Explain quantum physics")
- Historical facts (e.g., "When was WW2?", "Who invented the telephone?")
- Conceptual explanations (e.g., "How does gravity work?", "What is machine learning?")
- Math calculations or code generation
- Creative writing or brainstorming
- Personal opinions or subjective questions`,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query. Be specific and concise. Include relevant context like location, timeframe, or specific product names. For example: 'iPhone 16 Pro price Austria December 2024' rather than just 'iPhone price'."
        }
      },
      required: ["query"]
    }
  }
}

/**
 * URL Fetch Tool Definition
 *
 * Fetches and extracts content from a specific URL
 */
export const urlFetchTool: ToolDefinition = {
  type: "function",
  function: {
    name: "url_fetch",
    description: `Fetch and extract content from a specific URL that the user has provided. Use this when:
- The user shares a specific URL and asks you to read, summarize, or analyze it
- The user pastes an article link and wants information from it
- The user wants you to extract content from a webpage they specified

Examples:
- "Summarize this article: https://example.com/article"
- "What does this page say? [URL]"
- "Read this and tell me the main points: [URL]"

DO NOT use for:
- Searching for information (use web_search instead)
- YouTube videos (use youtube_transcript instead)
- General questions without a specific URL`,
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The full URL to fetch content from. Must be a valid HTTP/HTTPS URL."
        }
      },
      required: ["url"]
    }
  }
}

/**
 * YouTube Transcript Tool Definition
 *
 * Extracts transcript/captions from YouTube videos
 */
export const youtubeTranscriptTool: ToolDefinition = {
  type: "function",
  function: {
    name: "youtube_transcript",
    description: `Get the transcript (subtitles/captions) from a YouTube video. Use this when:
- The user shares a YouTube video link and wants to know what's said in it
- The user asks you to summarize or analyze a YouTube video
- The user wants a text version of video content

Examples:
- "What does this video talk about? https://youtube.com/watch?v=..."
- "Summarize this YouTube video: [URL]"
- "Can you tell me what's discussed in this video?"

DO NOT use for:
- Non-YouTube video links
- General web pages (use url_fetch instead)
- Searching for videos (use web_search instead)

Note: Only works for videos that have captions/subtitles available.`,
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The YouTube video URL. Supports formats: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID"
        }
      },
      required: ["url"]
    }
  }
}

/**
 * Weather Tool Definition
 *
 * Gets current weather conditions, forecasts, and air quality
 */
export const weatherTool: ToolDefinition = {
  type: "function",
  function: {
    name: "get_weather",
    description: `Get current weather conditions, forecasts, and air quality for any location. Use this when:
- The user asks about weather conditions ("What's the weather like in Vienna?")
- The user asks about temperature ("How hot is it in London?")
- The user wants weather forecasts ("Will it rain tomorrow in Berlin?")
- The user asks about air quality or pollution
- The user asks about sunrise/sunset times
- The user needs to plan outdoor activities based on weather

Examples:
- "What's the weather in Vienna?"
- "Is it raining in Tokyo right now?"
- "Should I bring an umbrella today?"
- "What's the temperature in New York?"
- "Will it snow this weekend in Munich?"
- "When is sunset today?"

DO NOT use for:
- Historical weather data (use web_search instead)
- Long-term climate information (use web_search)
- General questions about weather concepts`,
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name, region, or coordinates. Examples: 'Vienna, Austria', 'London', 'New York', '48.2082,16.3738'"
        },
        type: {
          type: "string",
          description: "Type of weather data requested",
          enum: ["current", "forecast"]
        }
      },
      required: ["location"]
    }
  }
}

/**
 * Get all available tools for the chat API
 */
export function getAvailableTools(): ToolDefinition[] {
  return [webSearchTool, urlFetchTool, youtubeTranscriptTool, weatherTool]
}

/**
 * Check if a model supports tool calling
 * Updated for November 2025 model landscape
 */
export function modelSupportsToolCalling(modelId: string): boolean {
  const modelLower = modelId.toLowerCase()

  // Models known to support tool calling well (November 2025)
  const supportedPatterns = [
    // OpenAI (2025)
    'gpt-5', 'gpt-5-mini', 'gpt-4o', 'gpt-4-turbo',
    // Anthropic (2025)
    'claude-4', 'claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4',
    'claude-3.5', 'claude-3-opus',
    // Google (2025)
    'gemini-2.5', 'gemini-2', 'gemini-pro', 'gemini-flash',
    // xAI (2025)
    'grok-4', 'grok-code',
    // DeepSeek (2025)
    'deepseek-v3', 'deepseek-chat-v3', 'deepseek-coder-v3',
    // Meta (2025)
    'llama-4', 'llama-4-maverick', 'llama-4-scout',
    // Qwen (2025)
    'qwen3', 'qwen3-max', 'qwen3-coder', 'qwen3-235b',
    // Mistral (2025)
    'codestral-2025', 'mistral-large', 'mixtral',
    // Others
    'glm-4', 'minimax-m2', 'command-r',
  ]

  // Check if model matches any supported pattern
  return supportedPatterns.some(pattern => modelLower.includes(pattern))
}

/**
 * Parse tool call arguments safely
 */
export function parseToolArguments(argsString: string): Record<string, any> {
  try {
    return JSON.parse(argsString)
  } catch (error) {
    console.error('[Tools] Failed to parse tool arguments:', error)
    return {}
  }
}
