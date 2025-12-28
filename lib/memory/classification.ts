/**
 * Memory Module - Query Classification
 *
 * Classifies queries to determine if memory retrieval is needed
 */

import type { QueryClassification } from './types'
import { MEMORY_MODELS } from './types'
import { loggers } from '@/lib/logger'

const log = loggers.memory

/**
 * Classify a query to determine if it needs memory context
 */
export async function classifyQuery(
  query: string,
  apiKey?: string,
  model?: string
): Promise<QueryClassification> {
  // Default classification for when API key is not available
  const defaultClassification: QueryClassification = {
    needsMemory: true,
    confidence: 0.5,
    reason: 'Default: retrieve memories for context',
    queryType: 'ambiguous',
  }

  if (!apiKey) {
    log.debug('No API key for classification, defaulting to retrieve')
    return defaultClassification
  }

  // Quick heuristic check first (skip API call for obvious cases)
  const lowerQuery = query.toLowerCase()

  // Obvious factual queries that don't need personal context
  const factualPatterns = [
    /^(what|who|when|where|how|why) (is|are|was|were|did|does|do|can|could|would|should)\s/i,
    /^(explain|define|describe|tell me about)\s/i,
    /^(how (to|do|does|can|should))\s/i,
    /\b(wikipedia|google|search|lookup)\b/i,
  ]

  // Check for obvious factual queries without personal pronouns
  const hasPersonalContext = /\b(my|i|me|mine|we|our|us)\b/i.test(lowerQuery)
  const matchesFactual = factualPatterns.some(p => p.test(lowerQuery))

  if (matchesFactual && !hasPersonalContext) {
    return {
      needsMemory: false,
      confidence: 0.85,
      reason: 'Heuristic: factual query without personal context',
      queryType: 'factual',
    }
  }

  // Personal queries that definitely need memory
  const personalPatterns = [
    /\b(remember|recall|remind|forgot|mentioned|told you|said earlier)\b/i,
    /\bmy (name|age|job|work|project|preference|favorite)\b/i,
    /\b(do you know|have i told you)\b/i,
  ]

  if (personalPatterns.some(p => p.test(lowerQuery))) {
    return {
      needsMemory: true,
      confidence: 0.9,
      reason: 'Heuristic: explicit personal context reference',
      queryType: 'personal',
    }
  }

  // For ambiguous queries, use LLM classification
  try {
    const classificationModel = model || MEMORY_MODELS.classifier

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'Chameleon AI Chat',
      },
      body: JSON.stringify({
        model: classificationModel,
        messages: [
          {
            role: 'system',
            content: `You are a query classifier. Analyze if the user's query requires personal context/memory to answer well.

Output ONLY a JSON object (no markdown, no explanation):
{
  "needsMemory": boolean,
  "confidence": number (0-1),
  "queryType": "factual" | "personal" | "ambiguous",
  "reason": "brief explanation"
}

Examples:
- "What is the capital of France?" → factual, no memory needed
- "What did I tell you about my project?" → personal, memory needed
- "Can you help me with code?" → ambiguous, could benefit from context`,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`Classification API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Parse JSON response
    try {
      const parsed = JSON.parse(content.trim())
      return {
        needsMemory: Boolean(parsed.needsMemory),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
        reason: String(parsed.reason || 'LLM classification'),
        queryType: ['factual', 'personal', 'ambiguous'].includes(parsed.queryType)
          ? parsed.queryType
          : 'ambiguous',
      }
    } catch (parseError) {
      log.warn('Failed to parse classification response:', content)
      return defaultClassification
    }
  } catch (error) {
    log.error('Classification API call failed:', error)
    return defaultClassification
  }
}

/**
 * Quick synchronous classification using heuristics only
 * Use when you don't want to wait for API call
 */
export function classifyQuerySync(query: string): QueryClassification {
  const lowerQuery = query.toLowerCase()

  // Check for personal references
  const hasPersonalContext = /\b(my|i|me|mine|we|our|us|you|your)\b/i.test(lowerQuery)
  const hasMemoryReference = /\b(remember|recall|earlier|before|last time|mentioned)\b/i.test(lowerQuery)

  // Obvious factual patterns
  const factualPatterns = [
    /^(what|who|when|where) (is|are|was|were)\s+(?!my|i|me)/i,
    /^(explain|define)\s/i,
    /\b(code|programming|error|bug|syntax)\b/i,
  ]

  if (hasMemoryReference) {
    return {
      needsMemory: true,
      confidence: 0.9,
      reason: 'Contains memory reference',
      queryType: 'personal',
    }
  }

  if (!hasPersonalContext && factualPatterns.some(p => p.test(lowerQuery))) {
    return {
      needsMemory: false,
      confidence: 0.75,
      reason: 'Factual query pattern',
      queryType: 'factual',
    }
  }

  if (hasPersonalContext) {
    return {
      needsMemory: true,
      confidence: 0.7,
      reason: 'Contains personal context',
      queryType: 'personal',
    }
  }

  return {
    needsMemory: true,
    confidence: 0.5,
    reason: 'Ambiguous - defaulting to retrieve',
    queryType: 'ambiguous',
  }
}
