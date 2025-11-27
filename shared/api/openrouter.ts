/**
 * OpenRouter API Client
 * Shared between web and mobile
 */

import type { Message } from '../types'

export interface StreamOptions {
  apiKey: string
  model: string
  messages: Message[]
  temperature?: number
  maxTokens?: number
  onChunk?: (chunk: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: string) => void
}

export async function streamChatMessage(options: StreamOptions): Promise<void> {
  const {
    apiKey,
    model,
    messages,
    temperature = 0.7,
    maxTokens = 8192,
    onChunk,
    onComplete,
    onError,
  } = options

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chameleon-ai.chat',
        'X-Title': 'Chameleon AI Chat',
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    if (!reader) throw new Error('No reader available')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullText += content
              onChunk?.(content)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    onComplete?.(fullText)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    onError?.(message)
    throw error
  }
}

export async function getAvailableModels(apiKey: string): Promise<any[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data || []
}
