/**
 * OpenRouter API client for browser extension
 * Matches main app's implementation patterns
 */

// Message content types (same as main app)
export interface MessageContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: {
    url: string
    detail?: "auto" | "low" | "high"
  }
}

export type MessageContent = string | MessageContentPart[]

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: MessageContent
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
  tools?: ToolDefinition[]
}

export interface ToolDefinition {
  type: "function"
  function: {
    name: string
    description: string
    parameters: {
      type: "object"
      properties: Record<string, any>
      required: string[]
    }
  }
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
      tool_calls?: ToolCall[]
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Build multimodal content from text and images
 * Matches main app's multimodal-utils.ts
 */
export function buildMultimodalContent(
  text: string,
  images: string[] = []
): MessageContent {
  if (images.length === 0) {
    return text
  }

  const contentParts: MessageContentPart[] = []

  if (text.trim()) {
    contentParts.push({ type: "text", text: text.trim() })
  }

  for (const imageDataUrl of images) {
    contentParts.push({
      type: "image_url",
      image_url: { url: imageDataUrl, detail: "auto" },
    })
  }

  return contentParts
}

/**
 * Convert MessageContent to plain text
 */
export function contentToText(content: MessageContent | undefined | null): string {
  if (!content) return ""
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""

  return content
    .map((part) => {
      if (part.type === "text") return part.text || ""
      if (part.type === "image_url") return "[Image]"
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

/**
 * Check if content has images
 */
export function hasImages(content: MessageContent | undefined | null): boolean {
  if (!content || typeof content === "string" || !Array.isArray(content)) return false
  return content.some((part) => part.type === "image_url")
}

/**
 * Call OpenRouter API (non-streaming)
 */
export async function callOpenRouter(
  apiKey: string,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chameleonai.chat",
      "X-Title": "Chameleon AI Extension",
    },
    body: JSON.stringify({
      ...request,
      stream: false,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error?.message || error.error || response.statusText)
  }

  return response.json()
}

/**
 * Call OpenRouter API with streaming
 */
export async function* callOpenRouterStreaming(
  apiKey: string,
  request: ChatCompletionRequest
): AsyncGenerator<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://chameleonai.chat",
      "X-Title": "Chameleon AI Extension",
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error?.message || error.error || response.statusText)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error("No response body")

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() || ""

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6)
        if (data === "[DONE]") return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices[0]?.delta?.content
          if (content) yield content
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

/**
 * Simple chat completion
 */
export async function chat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  const allMessages: ChatMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages

  const response = await callOpenRouter(apiKey, {
    model,
    messages: allMessages,
    temperature: 0.7,
    max_tokens: 4096,
  })

  const content = response.choices[0].message.content
  return typeof content === "string" ? content : contentToText(content)
}

/**
 * Chat with image (vision)
 */
export async function chatWithImage(
  apiKey: string,
  model: string,
  prompt: string,
  imageDataUrl: string,
  systemPrompt?: string
): Promise<string> {
  const content = buildMultimodalContent(prompt, [imageDataUrl])

  const messages: ChatMessage[] = systemPrompt
    ? [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ]
    : [{ role: "user", content }]

  const response = await callOpenRouter(apiKey, {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  })

  const responseContent = response.choices[0].message.content
  return typeof responseContent === "string" ? responseContent : contentToText(responseContent)
}

/**
 * Get available models from OpenRouter
 */
export async function getModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) throw new Error("Failed to fetch models")

  const data = await response.json()
  return data.data.map((model: any) => ({
    id: model.id,
    name: model.name || model.id,
  }))
}

/**
 * Popular models list (same as main app's openrouter.ts)
 */
export const POPULAR_MODELS = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", vision: true },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", vision: true },
  { id: "openai/gpt-4o", name: "GPT-4o", vision: true },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", vision: true },
  { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", vision: true },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5", vision: true },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", vision: false },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", vision: false },
]

/**
 * Check if model supports vision
 */
export function isVisionModel(modelId: string): boolean {
  const model = POPULAR_MODELS.find((m) => m.id === modelId)
  if (model) return model.vision

  // Check common vision model patterns
  const visionPatterns = [
    "gpt-4o",
    "gpt-4-vision",
    "claude-3",
    "gemini",
    "llama-3.2-vision",
    "qwen-vl",
    "pixtral",
  ]
  return visionPatterns.some((p) => modelId.toLowerCase().includes(p))
}
