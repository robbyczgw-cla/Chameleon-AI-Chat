/**
 * Memory Module - Query Classification (Self-RAG Inspired)
 *
 * Determines if a user query needs personal memory context to answer well.
 *
 * APPROACH:
 * 1. Fast heuristics first (free, no API call)
 * 2. LLM fallback only for truly ambiguous cases
 * 3. Default to NOT retrieving if uncertain (saves tokens, prevents noise)
 *
 * CLASSIFICATION TYPES:
 * - factual: Generic questions (math, definitions, code) → Skip memory
 * - personal: Questions about user preferences, history → Retrieve memory
 * - ambiguous: Unclear → Default to skip (Self-RAG principle)
 *
 * USED BY: lib/memory-service.ts → classifyQueryForMemory()
 */

import type { QueryClassification } from './types'
import { MEMORY_MODELS } from './types'
import { loggers } from '@/lib/logger'
import { getOpenRouterHeaders } from '@/lib/utils'

const log = loggers.memory

/**
 * Classify a query to determine if it needs memory context
 *
 * Key principle: Default to NOT retrieving for ambiguous queries (Self-RAG approach)
 * Only retrieve when we're confident personal context will help
 */
export async function classifyQuery(
  query: string,
  apiKey?: string,
  model?: string
): Promise<QueryClassification> {
  // Default: DON'T retrieve for ambiguous queries (Self-RAG approach)
  // This prevents injecting irrelevant context
  const defaultClassification: QueryClassification = {
    needsMemory: false,
    confidence: 0.6,
    reason: 'Default: skip retrieval for ambiguous queries',
    queryType: 'ambiguous',
  }

  if (!apiKey) {
    log.debug('No API key for classification, using heuristic only')
    return classifyQuerySync(query)
  }

  // Quick heuristic check first (skip API call for obvious cases)
  const lowerQuery = query.toLowerCase().trim()
  const queryLength = lowerQuery.split(/\s+/).length

  // Very short queries (1-3 words) are usually commands or greetings - skip memory
  // EXCEPT for context-dependent short queries like "weather?" or "recommend?"
  const isContextDependentShort = /\b(weather|recommend|suggest|nearby|local|around here)\b/i.test(lowerQuery)
  if (queryLength <= 3 && !hasExplicitPersonalReference(lowerQuery) && !isContextDependentShort) {
    return {
      needsMemory: false,
      confidence: 0.85,
      reason: 'Short query without personal context',
      queryType: 'factual',
    }
  }

  // CONTEXT-DEPENDENT QUERIES: Factual questions that need personal context (location, preferences)
  // These MUST be checked BEFORE factual patterns to ensure they retrieve memory
  const contextDependentPatterns = [
    // Weather queries need location
    /\b(weather|forecast|temperature|rain|snow|sunny|cloudy|humid)\b/i,
    // Time/timezone queries need location
    /\b(what time|current time|time zone|timezone|local time)\b/i,
    // Location-based recommendations
    /\b(nearby|near me|around here|in my area|local|closest)\b/i,
    // Recommendation queries often need preferences + location
    /\b(recommend|suggest|should i (eat|go|visit|watch|read|try))\b/i,
    // "What should I" queries often need personal context
    /\bwhat should i (wear|bring|pack|do today)\b/i,
    // Travel/commute queries need location
    /\b(commute|traffic|transit|get to work|drive to)\b/i,
  ]

  if (contextDependentPatterns.some(p => p.test(lowerQuery))) {
    return {
      needsMemory: true,
      confidence: 0.85,
      reason: 'Context-dependent query (needs location/preferences)',
      queryType: 'personal',
    }
  }

  // Obvious factual queries that don't need personal context
  const factualPatterns = [
    /^(what|who|when|where|how|why) (is|are|was|were|did|does|do|can|could|would|should)\s(?!my|i|me)/i,
    /^(explain|define|describe|tell me about)\s(?!my|i|me)/i,
    /^(how (to|do|does|can|should))\s(?!my|i|me)/i,
    /\b(wikipedia|google|search|lookup)\b/i,
    /^(write|create|generate|make)\s+(a|an|the|some)\s+/i, // "write a poem", "create a function"
    /^(translate|convert|calculate|compute)\s/i,
    /^(list|show|give me)\s+(the|some|all)?\s*(examples?|options?|ways?|steps?)/i,
    /^(compare|contrast|difference between)\s/i,
    /^(summarize|paraphrase|rewrite)\s/i,
  ]

  // Check for obvious factual queries without personal pronouns
  const hasPersonalContext = hasExplicitPersonalReference(lowerQuery)
  const matchesFactual = factualPatterns.some(p => p.test(lowerQuery))

  if (matchesFactual && !hasPersonalContext) {
    return {
      needsMemory: false,
      confidence: 0.9,
      reason: 'Factual/generative query without personal context',
      queryType: 'factual',
    }
  }

  // Coding/technical queries without personal context
  const technicalPatterns = [
    /^(fix|debug|solve|implement|refactor)\s+(?:this|the)\s/i,
    /\b(error|exception|bug|issue|problem):\s/i, // Error messages
    /```[\s\S]*```/, // Contains code blocks
    /\b(syntax|compile|runtime|type)\s*(error|warning)/i,
  ]

  if (technicalPatterns.some(p => p.test(lowerQuery)) && !hasPersonalContext) {
    return {
      needsMemory: false,
      confidence: 0.85,
      reason: 'Technical/debugging query',
      queryType: 'factual',
    }
  }

  // Personal queries that definitely need memory
  const personalPatterns = [
    /\b(remember|recall|remind|forgot|mentioned|told you|said earlier|last time)\b/i,
    /\bmy (name|age|job|work|project|preference|favorite|style|background|experience)\b/i,
    /\b(do you know|have i told you|as i mentioned|like i said)\b/i,
    /\b(based on what you know about me|given my|considering my)\b/i,
    /\bfor me specifically\b/i,
    /\bpersonalize|personalized|tailor|tailored\b/i,
  ]

  if (personalPatterns.some(p => p.test(lowerQuery))) {
    return {
      needsMemory: true,
      confidence: 0.95,
      reason: 'Explicit personal context reference',
      queryType: 'personal',
    }
  }

  // Follow-up indicators (likely continuation, memory not needed)
  const followUpPatterns = [
    /^(yes|no|ok|okay|sure|thanks|thank you|got it|perfect|great)\b/i,
    /^(and|but|also|actually|wait|hmm|so)\b/i,
    /^(can you|could you|please|now)\s+(also|then|next)/i,
    /^(what about|how about)\s/i,
  ]

  if (followUpPatterns.some(p => p.test(lowerQuery))) {
    return {
      needsMemory: false,
      confidence: 0.8,
      reason: 'Follow-up/continuation query',
      queryType: 'factual',
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
        ...getOpenRouterHeaders("Query Classification"),
      },
      body: JSON.stringify({
        model: classificationModel,
        messages: [
          {
            role: 'system',
            content: `You are a query classifier. Determine if the query requires PERSONAL context (user preferences, history, location, facts about them) to answer well.

CLASSIFICATION RULES:
1. "factual" (no memory): Generic questions, coding help, explanations, definitions
2. "personal" (needs memory): Questions about user preferences, past conversations, personal info
3. "personal" (needs memory): CONTEXT-DEPENDENT queries like weather, recommendations, local info - these need user's LOCATION or PREFERENCES even though they seem factual

IMPORTANT: Weather, recommendation, "what should I", nearby/local queries ALWAYS need memory (for location/preferences).

Output ONLY a JSON object (no markdown):
{
  "needsMemory": boolean,
  "confidence": number (0-1),
  "queryType": "factual" | "personal" | "ambiguous",
  "reason": "brief explanation"
}

Examples:
- "What is the capital of France?" → {"needsMemory": false, "confidence": 0.95, "queryType": "factual", "reason": "General knowledge question"}
- "Help me write a function" → {"needsMemory": false, "confidence": 0.85, "queryType": "factual", "reason": "Generic coding task"}
- "What's my preferred coding style?" → {"needsMemory": true, "confidence": 0.95, "queryType": "personal", "reason": "Asks about user preference"}
- "What's the weather tomorrow?" → {"needsMemory": true, "confidence": 0.9, "queryType": "personal", "reason": "Needs user location"}
- "Recommend a restaurant" → {"needsMemory": true, "confidence": 0.85, "queryType": "personal", "reason": "Needs location and preferences"}
- "Can you help me?" → {"needsMemory": false, "confidence": 0.7, "queryType": "ambiguous", "reason": "Generic, no personal context needed"}`,
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
      const result = {
        needsMemory: Boolean(parsed.needsMemory),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
        reason: String(parsed.reason || 'LLM classification'),
        queryType: (['factual', 'personal', 'ambiguous'].includes(parsed.queryType)
          ? parsed.queryType
          : 'ambiguous') as 'factual' | 'personal' | 'ambiguous',
      }

      // Self-RAG principle: for ambiguous queries with low confidence, don't retrieve
      if (result.queryType === 'ambiguous' && result.confidence < 0.75) {
        return {
          ...result,
          needsMemory: false,
          reason: `${result.reason} (skipping: ambiguous with low confidence)`,
        }
      }

      return result
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
 * Check if query has explicit personal references
 */
function hasExplicitPersonalReference(query: string): boolean {
  return /\b(my|i('m|'ve|'ll|'d)?|me|mine|myself|we|our|us)\b/i.test(query)
}

/**
 * Quick synchronous classification using heuristics only
 * Use when you don't want to wait for API call
 *
 * Self-RAG principle: default to NOT retrieving unless clearly personal
 */
export function classifyQuerySync(query: string): QueryClassification {
  const lowerQuery = query.toLowerCase().trim()
  const queryLength = lowerQuery.split(/\s+/).length

  // Very short queries - skip memory
  // EXCEPT for context-dependent short queries like "weather?" or "recommend?"
  const isContextDependentShort = /\b(weather|recommend|suggest|nearby|local|around here)\b/i.test(lowerQuery)
  if (queryLength <= 3 && !hasExplicitPersonalReference(lowerQuery) && !isContextDependentShort) {
    return {
      needsMemory: false,
      confidence: 0.85,
      reason: 'Short query',
      queryType: 'factual',
    }
  }

  // CONTEXT-DEPENDENT QUERIES: Factual questions that need personal context (location, preferences)
  // These MUST be checked BEFORE factual patterns to ensure they retrieve memory
  const contextDependentPatterns = [
    // Weather queries need location
    /\b(weather|forecast|temperature|rain|snow|sunny|cloudy|humid)\b/i,
    // Time/timezone queries need location
    /\b(what time|current time|time zone|timezone|local time)\b/i,
    // Location-based recommendations
    /\b(nearby|near me|around here|in my area|local|closest)\b/i,
    // Recommendation queries often need preferences + location
    /\b(recommend|suggest|should i (eat|go|visit|watch|read|try))\b/i,
    // "What should I" queries often need personal context
    /\bwhat should i (wear|bring|pack|do today)\b/i,
    // Travel/commute queries need location
    /\b(commute|traffic|transit|get to work|drive to)\b/i,
  ]

  if (contextDependentPatterns.some(p => p.test(lowerQuery))) {
    return {
      needsMemory: true,
      confidence: 0.85,
      reason: 'Context-dependent query (needs location/preferences)',
      queryType: 'personal',
    }
  }

  // Explicit memory references - definitely need memory
  const hasMemoryReference = /\b(remember|recall|earlier|before|last time|mentioned|told you)\b/i.test(lowerQuery)
  if (hasMemoryReference) {
    return {
      needsMemory: true,
      confidence: 0.95,
      reason: 'Explicit memory reference',
      queryType: 'personal',
    }
  }

  // Personal preference/info queries - need memory
  if (/\bmy (name|job|work|project|preference|favorite|style)\b/i.test(lowerQuery)) {
    return {
      needsMemory: true,
      confidence: 0.9,
      reason: 'Personal info query',
      queryType: 'personal',
    }
  }

  // Obvious factual patterns
  const factualPatterns = [
    /^(what|who|when|where|how|why) (is|are|was|were|do|does|did)\s+(?!my|i|me)/i,
    /^(explain|define|describe|tell me about)\s+(?!my|i|me)/i,
    /^(write|create|generate|make|build)\s+(a|an|the|some)\s+/i,
    /^(translate|convert|calculate|compute|fix|debug|solve)\s/i,
    /^(list|show|give me)\s+(the|some|all)?\s*(examples?|options?|ways?)/i,
  ]

  if (factualPatterns.some(p => p.test(lowerQuery))) {
    return {
      needsMemory: false,
      confidence: 0.85,
      reason: 'Factual/generative query',
      queryType: 'factual',
    }
  }

  // Technical queries without "my" - factual
  if (/\b(error|exception|bug|syntax|compile|runtime)\b/i.test(lowerQuery) &&
      !hasExplicitPersonalReference(lowerQuery)) {
    return {
      needsMemory: false,
      confidence: 0.8,
      reason: 'Technical query',
      queryType: 'factual',
    }
  }

  // Follow-up patterns - no memory needed
  const followUpPatterns = [
    /^(yes|no|ok|okay|sure|thanks|thank you|got it|perfect|great)\b/i,
    /^(and|but|also|actually|wait|so)\b/i,
    /^(what about|how about)\s/i,
  ]

  if (followUpPatterns.some(p => p.test(lowerQuery))) {
    return {
      needsMemory: false,
      confidence: 0.8,
      reason: 'Follow-up query',
      queryType: 'factual',
    }
  }

  // Has personal pronouns but not explicit personal query
  // Be conservative - check if it's truly personal
  if (hasExplicitPersonalReference(lowerQuery)) {
    // "Help me with X" vs "What's my preference" - the former is generic
    if (/\b(help me|can i|could i|should i|do i need)\b/i.test(lowerQuery)) {
      return {
        needsMemory: false,
        confidence: 0.7,
        reason: 'Generic request with personal pronoun',
        queryType: 'ambiguous',
      }
    }
    return {
      needsMemory: true,
      confidence: 0.7,
      reason: 'Personal context detected',
      queryType: 'personal',
    }
  }

  // Default: DON'T retrieve for ambiguous queries (Self-RAG approach)
  return {
    needsMemory: false,
    confidence: 0.6,
    reason: 'Ambiguous - skipping retrieval',
    queryType: 'ambiguous',
  }
}
