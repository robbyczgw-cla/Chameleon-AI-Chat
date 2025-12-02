/**
 * Embedding Service
 * Uses OpenRouter to generate embeddings via OpenAI's text-embedding-3-small model
 */

const EMBEDDING_MODEL = "openai/text-embedding-3-small"
const EMBEDDING_DIMENSIONS = 1536

interface EmbeddingResponse {
  data: Array<{
    embedding: number[]
    index: number
  }>
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

/**
 * Generate embeddings for one or more texts using OpenRouter
 */
export async function generateEmbeddings(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  if (!apiKey) {
    throw new Error("OpenRouter API key required for embeddings")
  }

  if (texts.length === 0) {
    return []
  }

  const startTime = Date.now()

  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://chameleon-ai-chat.vercel.app",
        "X-Title": "Chameleon AI Chat",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[Embedding] API error:", response.status, error)
      throw new Error(`Embedding API error: ${response.status}`)
    }

    const data: EmbeddingResponse = await response.json()
    const latency = Date.now() - startTime

    console.log("[Embedding] Generated embeddings:", {
      count: texts.length,
      tokens: data.usage?.total_tokens,
      latency: `${latency}ms`,
    })

    // Sort by index to maintain order
    return data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding)
  } catch (error) {
    console.error("[Embedding] Failed to generate embeddings:", error)
    throw error
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const embeddings = await generateEmbeddings([text], apiKey)
  return embeddings[0]
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same length")
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Find the most similar items from a list based on embedding similarity
 */
export function findSimilar<T extends { embedding?: number[] }>(
  queryEmbedding: number[],
  items: T[],
  options: {
    threshold?: number // Minimum similarity (0-1), default 0.5
    maxResults?: number // Maximum results to return, default 5
  } = {}
): Array<T & { similarity: number }> {
  const { threshold = 0.5, maxResults = 5 } = options

  return items
    .filter((item) => item.embedding && item.embedding.length > 0)
    .map((item) => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding!),
    }))
    .filter((item) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS }
