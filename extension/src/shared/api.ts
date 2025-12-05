/**
 * OpenRouter API client for browser extension
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
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

/**
 * Call OpenRouter API
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
      "HTTP-Referer": window.location.origin,
      "X-Title": "Chameleon AI Extension",
    },
    body: JSON.stringify({
      ...request,
      stream: false, // Non-streaming for simplicity in extension
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(`OpenRouter API error: ${error.error || response.statusText}`)
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
      "HTTP-Referer": window.location.origin,
      "X-Title": "Chameleon AI Extension",
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`)
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
          if (content) {
            yield content
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  }
}

/**
 * Simple chat completion (convenience function)
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
  })

  return response.choices[0].message.content
}

/**
 * Get available models from OpenRouter
 */
export async function getModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch models")
  }

  const data = await response.json()
  return data.data.map((model: any) => ({
    id: model.id,
    name: model.name || model.id,
  }))
}
