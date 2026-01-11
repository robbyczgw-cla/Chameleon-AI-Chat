/**
 * Memory Retrieval Service
 *
 * Handles intelligent memory retrieval:
 * - Keyword-based search with relevance scoring
 * - Semantic search using embeddings
 * - Dynamic limiting based on score distribution
 * - Context-aware deduplication
 */

import type { Memory, MemorySettings } from '@/types'
import { generateEmbedding, findSimilar, cosineSimilarity } from '@/lib/embedding-service'
import { filterMemoriesAlreadyInContext, type ConversationMessage } from './context-filter'
import { classifyQuery } from './classification'
import type { QueryClassification } from './types'
import { loggers } from '@/lib/logger'

const log = loggers.memory

export interface MemoryRetrievalDecision {
  action: 'skipped' | 'retrieved' | 'empty'
  reason: string
  details: {
    queryType?: 'factual' | 'personal' | 'ambiguous'
    confidence?: number
    searchMethod?: 'semantic' | 'keyword'
    topSimilarity?: number
    memoryCount?: number
  }
}

export interface RetrievalResult {
  memories: Memory[]
  classification: QueryClassification
  skipped: boolean
  searchMethod?: 'semantic' | 'keyword'
  decision: MemoryRetrievalDecision
}

export interface RetrievalConfig {
  maxMemoriesInContext: number
  importanceThreshold: number
  similarityThreshold: number
  minRelevanceScore: number
  classificationConfidence: number
  useSemanticSearch: boolean
  alwaysRetrieveForPersonas: boolean
}

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
      log.debug(`📊 Stopping at ${result.length} memories (score drop: ${dropPercent.toFixed(0)}%)`)
      break
    }

    // Stop if score is too low (below 25 points)
    if (current.score < 25 && result.length >= 2) {
      log.debug(`📊 Stopping at ${result.length} memories (low score: ${current.score})`)
      break
    }

    result.push(current)
  }

  // Cap at 3 for most queries
  const cap = Math.min(result.length, 3)
  if (result.length > cap) {
    log.debug(`📊 Capping at ${cap} memories (had ${result.length})`)
    return result.slice(0, cap)
  }

  return result
}

/**
 * Get relevant memories using keyword matching
 */
export function getRelevantMemoriesKeyword(
  query: string,
  memories: Memory[],
  config: RetrievalConfig
): Memory[] {
  const maxResults = config.maxMemoriesInContext
  const threshold = config.importanceThreshold
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

  // Dynamic limit: Return only truly relevant memories
  const filtered = applyDynamicLimit(scored, maxResults)
  const result = filtered.slice(0, Math.min(filtered.length, maxResults))

  if (result.length > 0) {
    log.debug(`Retrieved ${result.length} memories (keyword search)`)
  }

  return result.map(({ memory }) => memory)
}

/**
 * Get relevant memories using semantic similarity
 */
export async function getRelevantMemoriesSemantic(
  query: string,
  memories: Memory[],
  apiKey: string,
  config: RetrievalConfig,
  embeddingModel?: string,
  dbSearchFn?: (
    queryEmbedding: number[],
    options: { threshold: number; limit: number }
  ) => Promise<Array<Memory & { similarity: number }>>
): Promise<Array<Memory & { similarity?: number }>> {
  const maxResults = config.maxMemoriesInContext
  const threshold = config.minRelevanceScore || 0.25

  // Try database-level semantic search first
  if (dbSearchFn) {
    try {
      log.debug('Attempting database semantic search...')
      const queryEmbedding = await generateEmbedding(query, apiKey, { model: embeddingModel })

      const results = await dbSearchFn(queryEmbedding, { threshold, limit: maxResults })

      if (results.length > 0) {
        log.debug(`Database semantic search returned ${results.length} memories`)
        return results
      }

      // Fallback to client-side if database returned nothing
      log.debug('Database returned no results, trying client-side search...')
      return clientSideSemanticSearch(queryEmbedding, memories, maxResults, threshold)
    } catch (error) {
      log.error('Database semantic search failed:', error)
    }
  }

  // Client-side semantic search
  try {
    log.debug('Using client-side semantic search...')
    const queryEmbedding = await generateEmbedding(query, apiKey)
    return clientSideSemanticSearch(queryEmbedding, memories, maxResults, threshold)
  } catch (error) {
    log.error('Client-side semantic search failed:', error)
    // Ultimate fallback: keyword matching
    log.debug('Falling back to keyword matching')
    return getRelevantMemoriesKeyword(query, memories, config)
  }
}

/**
 * Client-side semantic search using local embeddings
 */
function clientSideSemanticSearch(
  queryEmbedding: number[],
  memories: Memory[],
  maxResults: number,
  threshold: number
): Array<Memory & { similarity: number }> {
  const memoriesWithEmbeddings = memories.filter(
    m => m.embedding && m.embedding.length > 0
  )

  if (memoriesWithEmbeddings.length === 0) {
    log.debug('No memories with embeddings for client-side search')
    return []
  }

  const rawResults = findSimilar(queryEmbedding, memoriesWithEmbeddings, {
    threshold,
    maxResults,
  })

  log.debug(`Client-side semantic search found ${rawResults.length} memories`)

  // Apply dynamic limit based on similarity scores
  const scored = rawResults.map(mem => ({
    memory: mem,
    score: (mem.similarity || 0) * 100
  }))

  const filtered = applyDynamicLimit(scored, maxResults)
  const results = filtered.map(({ memory }) => memory as Memory & { similarity: number })

  log.debug(`After dynamic limit: ${results.length} memories`)

  return results
}

/**
 * Intelligent memory retrieval with classification
 *
 * Flow:
 * 1. Classify query intent (factual/personal/ambiguous)
 * 2. If factual with high confidence → skip memory entirely
 * 3. If personal or low confidence → do semantic search
 * 4. Apply minimum relevance filter
 * 5. Filter out memories already in conversation context
 */
export async function getRelevantMemoriesWithClassification(
  query: string,
  memories: Memory[],
  apiKey: string | undefined,
  config: RetrievalConfig,
  options: {
    isPersonaChat?: boolean
    recentMessages?: ConversationMessage[]
    classifierModel?: string
    embeddingModel?: string
    dbSearchFn?: (
      queryEmbedding: number[],
      opts: { threshold: number; limit: number }
    ) => Promise<Array<Memory & { similarity: number }>>
    updateAccessStats?: (memoryIds: string[]) => void
  } = {}
): Promise<RetrievalResult> {
  const confidenceThreshold = config.classificationConfidence ?? 0.7
  const minRelevance = config.minRelevanceScore ?? 0.45

  // Persona override - always retrieve for persona chats
  if (options.isPersonaChat && config.alwaysRetrieveForPersonas !== false) {
    log.debug('👤 Persona chat detected - bypassing classification')
    return performRetrieval(query, memories, apiKey, config, {
      needsMemory: true,
      confidence: 1.0,
      reason: 'Persona chat - always retrieve',
      queryType: 'personal'
    }, 'Persona chat override', options)
  }

  // Classify the query
  const classification = await classifyQuery(query, apiKey, options.classifierModel)

  // Decide based on classification + confidence threshold
  const shouldSkip = !classification.needsMemory &&
                     classification.confidence >= confidenceThreshold

  if (shouldSkip) {
    log.debug(`⏭️ Skipping memory retrieval: ${classification.reason}`,
      `(confidence: ${classification.confidence.toFixed(2)} >= ${confidenceThreshold})`)

    return {
      memories: [],
      classification,
      skipped: true,
      decision: {
        action: 'skipped',
        reason: classification.reason,
        details: {
          queryType: classification.queryType,
          confidence: classification.confidence,
        }
      }
    }
  }

  if (!classification.needsMemory && classification.confidence < confidenceThreshold) {
    log.debug(`🤔 Low confidence classification - retrieving anyway`,
      `(confidence: ${classification.confidence.toFixed(2)} < ${confidenceThreshold})`)
  }

  return performRetrieval(
    query,
    memories,
    apiKey,
    config,
    classification,
    classification.needsMemory ? 'Personal query' : 'Low confidence - retrieving anyway',
    options
  )
}

/**
 * Internal method to perform memory retrieval with relevance filtering
 */
async function performRetrieval(
  query: string,
  memories: Memory[],
  apiKey: string | undefined,
  config: RetrievalConfig,
  classification: QueryClassification,
  retrievalReason: string,
  options: {
    recentMessages?: ConversationMessage[]
    embeddingModel?: string
    dbSearchFn?: (
      queryEmbedding: number[],
      opts: { threshold: number; limit: number }
    ) => Promise<Array<Memory & { similarity: number }>>
    updateAccessStats?: (memoryIds: string[]) => void
  }
): Promise<RetrievalResult> {
  const minRelevance = config.minRelevanceScore ?? 0.45
  log.debug(`✅ Retrieving memories: ${retrievalReason}`)

  let retrievedMemories: Array<Memory & { similarity?: number }> = []
  let searchMethod: 'semantic' | 'keyword' = 'keyword'
  let topSimilarity: number | undefined

  // Try semantic search first if enabled and API key available
  if (apiKey && config.useSemanticSearch !== false) {
    try {
      log.debug('Using semantic search (embedding-based)')
      const semanticResults = await getRelevantMemoriesSemantic(
        query,
        memories,
        apiKey,
        config,
        options.embeddingModel,
        options.dbSearchFn
      )
      retrievedMemories = semanticResults
      searchMethod = 'semantic'

      // Get top similarity score
      if (semanticResults.length > 0) {
        const similarities = semanticResults
          .filter((m): m is Memory & { similarity: number } => 'similarity' in m)
          .map(m => m.similarity)

        if (similarities.length > 0) {
          topSimilarity = Math.max(...similarities)
          log.debug(`Semantic search top similarity: ${topSimilarity.toFixed(3)}`)
        }
      }
    } catch (error) {
      log.error('Semantic search failed, falling back to keyword:', error)
      retrievedMemories = getRelevantMemoriesKeyword(query, memories, config)
      searchMethod = 'keyword'
    }
  } else {
    log.debug('Using keyword matching (no API key or semantic disabled)')
    retrievedMemories = getRelevantMemoriesKeyword(query, memories, config)
  }

  // Apply minimum relevance filter for semantic search
  if (searchMethod === 'semantic' && topSimilarity !== undefined && topSimilarity < minRelevance) {
    log.debug(`📉 Top similarity ${topSimilarity.toFixed(3)} < minRelevance ${minRelevance} - skipping all memories`)

    return {
      memories: [],
      classification,
      skipped: false,
      searchMethod,
      decision: {
        action: 'empty',
        reason: `Best match similarity (${topSimilarity.toFixed(2)}) below threshold (${minRelevance})`,
        details: {
          queryType: classification.queryType,
          confidence: classification.confidence,
          searchMethod,
          topSimilarity,
          memoryCount: 0
        }
      }
    }
  }

  // Context-aware deduplication
  let filteredMemories = retrievedMemories
  let filteredCount = 0

  if (options.recentMessages && options.recentMessages.length > 0 && retrievedMemories.length > 0) {
    const contextMessages = options.recentMessages.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }))

    const filterResult = filterMemoriesAlreadyInContext(retrievedMemories, contextMessages, query)
    filteredMemories = filterResult.kept
    filteredCount = filterResult.filtered.length

    if (filteredCount > 0) {
      log.debug(`🔍 Context filter: kept ${filteredMemories.length}, filtered ${filteredCount} (already in conversation)`)
    }
  }

  // Update access stats for retrieved memories
  if (options.updateAccessStats && filteredMemories.length > 0) {
    options.updateAccessStats(filteredMemories.map(m => m.id))
  }

  const finalCount = filteredMemories.length
  log.debug(`Retrieved ${finalCount} memories via ${searchMethod} search`,
    filteredCount > 0 ? `(${filteredCount} filtered as already in context)` : '')

  return {
    memories: filteredMemories,
    classification,
    skipped: false,
    searchMethod,
    decision: {
      action: finalCount > 0 ? 'retrieved' : 'empty',
      reason: finalCount > 0
        ? `Retrieved ${finalCount} relevant memories via ${searchMethod} search${filteredCount > 0 ? ` (${filteredCount} filtered)` : ''}`
        : filteredCount > 0 ? `All ${filteredCount} memories already in conversation context` : 'No memories matched the query',
      details: {
        queryType: classification.queryType,
        confidence: classification.confidence,
        searchMethod,
        topSimilarity,
        memoryCount: finalCount
      }
    }
  }
}

/**
 * Format memories for LLM context (token-efficient)
 */
export function formatMemoriesForContext(memories: Memory[]): string {
  if (memories.length === 0) return ''

  const grouped: Record<Memory['type'], Memory[]> = {
    preference: [],
    fact: [],
    context: [],
    skill: [],
    goal: [],
  }

  memories.forEach(m => grouped[m.type].push(m))

  const sections: string[] = []

  if (grouped.preference.length > 0) {
    sections.push(`Preferences: ${grouped.preference.map(m => m.content).join('; ')}`)
  }
  if (grouped.fact.length > 0) {
    sections.push(`Facts: ${grouped.fact.map(m => m.content).join('; ')}`)
  }
  if (grouped.context.length > 0) {
    sections.push(`Context: ${grouped.context.map(m => m.content).join('; ')}`)
  }
  if (grouped.skill.length > 0) {
    sections.push(`Skills: ${grouped.skill.map(m => m.content).join('; ')}`)
  }
  if (grouped.goal.length > 0) {
    sections.push(`Goals: ${grouped.goal.map(m => m.content).join('; ')}`)
  }

  return `<user_memory>\n${sections.join('\n')}\n</user_memory>`
}
