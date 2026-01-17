/**
 * Anthropic Direct API Client
 *
 * This module provides direct access to Claude models via the Anthropic API
 * using Claude Code CLI tokens (sk-ant-oat01-...) for authentication.
 *
 * Key differences from OpenRouter:
 * - Uses Bearer token authentication (OAuth token from Claude Code CLI)
 * - Different streaming format (SSE with message_start, content_block_delta, etc.)
 * - Different tool calling format
 * - Models prefixed with "anthropic:" to distinguish from OpenRouter's "anthropic/"
 */

import type { MessageContent } from "@/types"

// ============================================================================
// Types
// ============================================================================

export interface AnthropicModel {
  id: string // e.g., "anthropic:claude-sonnet-4-5"
  apiId: string // e.g., "claude-sonnet-4-5-20250929" (actual API model ID)
  name: string
  description: string
  contextWindow: number
  maxOutputTokens: number
  supportsVision: boolean
  supportsThinking: boolean
}

export interface AnthropicMessage {
  role: "user" | "assistant"
  content: string | AnthropicContentBlock[]
}

export interface AnthropicContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result" | "thinking"
  text?: string
  thinking?: string // For extended thinking content
  source?: {
    type: "base64" | "url"
    media_type?: string
    data?: string
    url?: string
  }
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string | AnthropicContentBlock[]
  is_error?: boolean
}

export interface AnthropicTool {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface AnthropicRequest {
  model: string
  messages: AnthropicMessage[]
  max_tokens: number
  system?: string
  temperature?: number
  top_p?: number
  stop_sequences?: string[]
  stream?: boolean
  tools?: AnthropicTool[]
  tool_choice?: { type: "auto" | "any" | "none" | "tool"; name?: string }
  thinking?: { type: "enabled" | "disabled"; budget_tokens?: number }
}

export interface AnthropicStreamEvent {
  type:
    | "message_start"
    | "content_block_start"
    | "content_block_delta"
    | "content_block_stop"
    | "message_delta"
    | "message_stop"
    | "ping"
    | "error"
  message?: {
    id: string
    type: "message"
    role: "assistant"
    model: string
    content: AnthropicContentBlock[]
    stop_reason: string | null
    usage: {
      input_tokens: number
      output_tokens: number
    }
  }
  index?: number
  content_block?: AnthropicContentBlock
  delta?: {
    type: "text_delta" | "thinking_delta" | "input_json_delta"
    text?: string
    thinking?: string
    partial_json?: string
    stop_reason?: string
    stop_sequence?: string
  }
  usage?: {
    output_tokens: number
  }
  error?: {
    type: string
    message: string
  }
}

// ============================================================================
// Model Definitions
// ============================================================================

/**
 * Available Claude models via direct Anthropic API
 * Prefixed with "anthropic:" to distinguish from OpenRouter's "anthropic/" format
 */
export const ANTHROPIC_DIRECT_MODELS: AnthropicModel[] = [
  {
    id: "anthropic:claude-opus-4-5",
    apiId: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5 (Direct)",
    description: "Most intelligent model - maximum capability for complex tasks",
    contextWindow: 200000,
    maxOutputTokens: 32000,
    supportsVision: true,
    supportsThinking: true,
  },
  {
    id: "anthropic:claude-sonnet-4-5",
    apiId: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5 (Direct)",
    description: "Best balance of intelligence and speed for real-world agents",
    contextWindow: 200000,
    maxOutputTokens: 64000,
    supportsVision: true,
    supportsThinking: true,
  },
  {
    id: "anthropic:claude-haiku-4-5",
    apiId: "claude-3-5-haiku-20241022",
    name: "Claude Haiku 4.5 (Direct)",
    description: "Fastest model for quick tasks and high-volume processing",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsThinking: false,
  },
]

/**
 * Check if a model ID is an Anthropic Direct model
 */
export function isAnthropicDirectModel(modelId: string): boolean {
  return modelId.startsWith("anthropic:")
}

/**
 * Get the actual Anthropic API model ID from our prefixed model ID
 */
export function getAnthropicApiModelId(modelId: string): string {
  const model = ANTHROPIC_DIRECT_MODELS.find((m) => m.id === modelId)
  return model?.apiId || modelId.replace("anthropic:", "")
}

/**
 * Get model info by ID
 */
export function getAnthropicModelInfo(modelId: string): AnthropicModel | undefined {
  return ANTHROPIC_DIRECT_MODELS.find((m) => m.id === modelId)
}

// ============================================================================
// Message Conversion
// ============================================================================

/**
 * Convert our internal message format to Anthropic's format
 * Handles multimodal content (images) and extracts system message
 */
export function convertToAnthropicMessages(
  messages: Array<{ role: string; content: MessageContent }>
): { system: string | undefined; messages: AnthropicMessage[] } {
  let systemPrompt: string | undefined

  const anthropicMessages: AnthropicMessage[] = []

  for (const msg of messages) {
    // Extract system message
    if (msg.role === "system") {
      if (typeof msg.content === "string") {
        systemPrompt = systemPrompt ? `${systemPrompt}\n\n${msg.content}` : msg.content
      }
      continue
    }

    // Skip tool messages (will be handled separately in tool calling flow)
    if (msg.role === "tool") {
      continue
    }

    // Convert user/assistant messages
    const role = msg.role as "user" | "assistant"

    if (typeof msg.content === "string") {
      anthropicMessages.push({ role, content: msg.content })
    } else if (Array.isArray(msg.content)) {
      // Multimodal content
      const contentBlocks: AnthropicContentBlock[] = []

      for (const part of msg.content) {
        if (part.type === "text" && part.text) {
          contentBlocks.push({ type: "text", text: part.text })
        } else if (part.type === "image_url" && part.image_url?.url) {
          // Convert image URL format
          const url = part.image_url.url
          if (url.startsWith("data:")) {
            // Base64 data URL
            const match = url.match(/^data:([^;]+);base64,(.+)$/)
            if (match) {
              contentBlocks.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: match[1],
                  data: match[2],
                },
              })
            }
          } else {
            // HTTP URL
            contentBlocks.push({
              type: "image",
              source: {
                type: "url",
                url,
              },
            })
          }
        }
      }

      if (contentBlocks.length > 0) {
        anthropicMessages.push({ role, content: contentBlocks })
      }
    }
  }

  return { system: systemPrompt, messages: anthropicMessages }
}

// ============================================================================
// Tool Conversion
// ============================================================================

/**
 * Convert OpenRouter-style tools to Anthropic format
 */
export function convertToAnthropicTools(
  tools: Array<{
    type: "function"
    function: {
      name: string
      description: string
      parameters: Record<string, unknown>
    }
  }>
): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters as AnthropicTool["input_schema"],
  }))
}

// ============================================================================
// API Client
// ============================================================================

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
const ANTHROPIC_VERSION = "2023-06-01"

// Beta features required for OAuth token authentication (Claude Code CLI tokens)
// See: https://deepwiki.com/sst/opencode-anthropic-auth
const ANTHROPIC_BETA_FEATURES = [
  "oauth-2025-04-20",           // Required for OAuth token auth
  "interleaved-thinking-2025-05-14",  // Extended thinking support
].join(",")

/**
 * Make a streaming request to the Anthropic API
 */
export async function streamAnthropicRequest(
  request: AnthropicRequest,
  token: string,
  onEvent: (event: AnthropicStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-beta": ANTHROPIC_BETA_FEATURES,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Anthropic API error: ${response.status}`

    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message
      }
    } catch {
      if (errorText) {
        errorMessage = errorText.substring(0, 200)
      }
    }

    // Check for token-specific errors
    if (
      response.status === 401 ||
      errorMessage.includes("only authorized for use with Claude Code")
    ) {
      throw new Error(
        "Claude Code token error: This token may have expired or is restricted. " +
          "Try running 'claude setup-token' again to generate a fresh token."
      )
    }

    throw new Error(errorMessage)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("No response body")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()

        if (trimmed.startsWith("event: ")) {
          // Event type line - we'll get data on next line
          continue
        }

        if (trimmed.startsWith("data: ")) {
          const data = trimmed.slice(6)

          if (data === "[DONE]") {
            continue
          }

          try {
            const event = JSON.parse(data) as AnthropicStreamEvent
            onEvent(event)
          } catch {
            console.warn("[Anthropic] Failed to parse SSE data:", data.substring(0, 100))
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Make a non-streaming request to the Anthropic API
 */
export async function callAnthropicAPI(
  request: AnthropicRequest,
  token: string
): Promise<{
  id: string
  content: AnthropicContentBlock[]
  stop_reason: string
  usage: { input_tokens: number; output_tokens: number }
}> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-beta": ANTHROPIC_BETA_FEATURES,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...request,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Anthropic API error: ${response.status}`

    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message
      }
    } catch {
      if (errorText) {
        errorMessage = errorText.substring(0, 200)
      }
    }

    throw new Error(errorMessage)
  }

  return response.json()
}
