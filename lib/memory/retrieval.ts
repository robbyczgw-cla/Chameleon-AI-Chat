/**
 * Memory Module - Retrieval Logic
 *
 * Handles keyword and semantic search for memories
 */

import type { Memory, MemorySettings, ScoredMemory } from './types'
import { loggers } from '@/lib/logger'
import { generateEmbedding, findSimilar, cosineSimilarity } from '@/lib/embedding-service'
import { supabaseSync } from '@/lib/supabase/sync'

const log = loggers.memory

/**
 * Apply dynamic limit based on score distribution
 * Returns only truly relevant memories, not just top N
 */
export function applyDynamicLimit(
  scored: Array<{ memory: Memory; score: number }>,
  maxResults: number
): Array<{ memory: Memory; score: number }> {
  if (scored.length === 0) return []
  if (scored.length <= 2) return scored

  const result: Array<{ memory: Memory; score: number }> = [scored[0]]

  for (let i = 1; i < Math.min(scored.length, maxResults); i++) {
    const current = scored[i]
    const previous = scored[i - 1]

    // Calculate score drop percentage
    const dropPercent = ((previous.score - current.score) / previous.score) * 100

    // Stop if significant drop (30%+) after getting at least 1 memory
    if (dropPercent >= 30 && result.length >= 1) {
      log.debug(`Stopping at ${result.length} memories (score drop: ${dropPercent.toFixed(0)}%)`)
      break
    }

    // Stop if score is too low
    if (current.score < 25 && result.length >= 2) {
      log.debug(`Stopping at ${result.length} memories (low score: ${current.score})`)
      break
    }

    result.push(current)
  }

  // Cap at 3 for most queries
  const cap = Math.min(result.length, 3)
  if (result.length > cap) {
    log.debug(`Capping at ${cap} memories (had ${result.length})`)
    return result.slice(0, cap)
  }

  return result
}

/**
 * Get relevant memories using keyword matching
 */
export function getRelevantByKeyword(
  memories: Memory[],
  query: string,
  settings: MemorySettings
): ScoredMemory[] {
  const maxResults = settings.maxMemoriesInContext || 5
  const threshold = settings.importanceThreshold || 2
  const minScore = 15

  // Tokenize query
  const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)

  // Score each memory
  const scored = memories
    .filter(m => m.importance >= threshold)
    .map(memory => {
      let score = 0

      // Importance weight (0-15 points)
      score += memory.importance * 5

      // Keyword matching (0-50 points)
      const contentLower = memory.content.toLowerCase()
      const categoryLower = (memory.category || '').toLowerCase()

      for (const token of queryTokens) {
        if (contentLower.includes(token)) score += 10
        if (categoryLower.includes(token)) score += 5
      }

      // Recency bonus (0-20 points)
      const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 7) score += 20
      else if (daysSinceCreated < 30) score += 10
      else if (daysSinceCreated < 90) score += 5

      return { memory, score }
    })
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)

  // Apply dynamic limiting
  const filtered = applyDynamicLimit(scored, maxResults)

  return filtered.map(({ memory, score }) => ({
    ...memory,
    score,
  }))
}

/**
 * Calculate recency score (0-1) with exponential decay
 * Recent memories get higher scores
 */
function calculateRecencyScore(memory: Memory): number {
  const now = Date.now()
  const daysSinceAccess = (now - (memory.lastAccessedAt || memory.createdAt)) / (1000 * 60 * 60 * 24)

  // Exponential decay: score halves every 30 days
  // Recent (< 7 days): ~1.0
  // 1 month: ~0.5
  // 3 months: ~0.125
  return Math.exp(-daysSinceAccess / 30)
}

/**
 * Calculate combined relevance score
 * Factors: semantic similarity (60%), recency (25%), importance (15%)
 */
function calculateCombinedScore(
  similarity: number,
  memory: Memory
): number {
  const recencyScore = calculateRecencyScore(memory)
  const importanceScore = memory.importance / 3 // Normalize 1-3 to 0.33-1.0

  // Weighted combination
  const combined = (
    similarity * 0.60 +      // Semantic match is most important
    recencyScore * 0.25 +    // Recent memories preferred
    importanceScore * 0.15   // High importance memories preferred
  )

  return combined
}

/**
 * Get relevant memories using semantic similarity
 * Uses multi-factor scoring: similarity + recency + importance
 */
export async function getRelevantBySemantic(
  memories: Memory[],
  query: string,
  apiKey: string,
  settings: MemorySettings,
  options?: {
    userId?: string
    syncEnabled?: boolean
  }
): Promise<ScoredMemory[]> {
  const maxResults = settings.maxMemoriesInContext || 3
  const threshold = settings.minRelevanceScore || 0.45

  // Try database-level semantic search first if sync is enabled
  if (options?.syncEnabled && options?.userId) {
    try {
      log.debug('Attempting database semantic search...')
      const queryEmbedding = await generateEmbedding(query, apiKey)

      const results = await supabaseSync.semanticSearchMemories(
        options.userId,
        queryEmbedding,
        { threshold, limit: maxResults * 2 } // Get more for post-filtering
      )

      if (results.length > 0) {
        // Apply combined scoring with recency decay
        const scoredResults = results.map(r => ({
          ...r,
          similarity: r.similarity,
          combinedScore: calculateCombinedScore(r.similarity || 0, r),
        }))

        // Re-sort by combined score and limit
        const finalResults = scoredResults
          .sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0))
          .slice(0, maxResults)

        log.info(`Found ${finalResults.length} memories via database semantic search (with recency decay)`)
        return finalResults
      }
    } catch (error) {
      log.warn('Database semantic search failed, falling back to local:', error)
    }
  }

  // Fall back to local semantic search
  try {
    const queryEmbedding = await generateEmbedding(query, apiKey)

    // Find memories with embeddings
    const memoriesWithEmbeddings = memories.filter(m => m.embedding && m.embedding.length > 0)

    if (memoriesWithEmbeddings.length === 0) {
      log.debug('No memories with embeddings, falling back to keyword search')
      return getRelevantByKeyword(memories, query, settings)
    }

    // Calculate similarities with combined scoring
    const scored = memoriesWithEmbeddings.map(memory => {
      const similarity = cosineSimilarity(queryEmbedding, memory.embedding!)
      const combinedScore = calculateCombinedScore(similarity, memory)
      return { memory, similarity, combinedScore }
    })

    // Filter by base similarity threshold, then sort by combined score
    const filtered = scored
      .filter(({ similarity }) => similarity >= threshold)
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, maxResults)

    log.info(`Found ${filtered.length} memories via local semantic search (with recency decay)`)

    return filtered.map(({ memory, similarity, combinedScore }) => ({
      ...memory,
      similarity,
      score: Math.round(combinedScore * 100), // Normalize to 0-100 for display
    }))
  } catch (error) {
    log.error('Semantic search failed:', error)
    // Fall back to keyword search
    return getRelevantByKeyword(memories, query, settings)
  }
}

/**
 * Update access stats for retrieved memories
 */
export function updateAccessStats(memories: Memory[], retrievedIds: string[]): void {
  for (const memory of memories) {
    if (retrievedIds.includes(memory.id)) {
      memory.lastAccessedAt = Date.now()
      memory.accessCount++
    }
  }
}
