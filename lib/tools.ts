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
 * Get all available tools for the chat API
 */
export function getAvailableTools(): ToolDefinition[] {
  return [webSearchTool]
}

/**
 * Check if a model supports tool calling
 * Models < 30B parameters generally don't support tool calling well
 */
export function modelSupportsToolCalling(modelId: string): boolean {
  const modelLower = modelId.toLowerCase()

  // Models known to support tool calling well
  const supportedPatterns = [
    // OpenAI
    'gpt-4', 'gpt-4o', 'gpt-4-turbo',
    // Anthropic
    'claude-3', 'claude-3.5', 'claude-3-opus', 'claude-3-sonnet', 'claude-3.5-sonnet',
    // Google
    'gemini-1.5', 'gemini-2', 'gemini-pro', 'gemini-flash',
    // DeepSeek
    'deepseek-v3', 'deepseek-chat', 'deepseek-coder',
    // Qwen
    'qwen-2.5-72b', 'qwen-2.5-coder', 'qwen2.5',
    // Mistral
    'mixtral-8x22b', 'mistral-large', 'mistral-medium',
    // xAI
    'grok-2', 'grok-beta',
    // Cohere
    'command-r-plus', 'command-r',
    // Meta (larger models)
    'llama-3.1-405b', 'llama-3.1-70b', 'llama-3.2-90b',
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
