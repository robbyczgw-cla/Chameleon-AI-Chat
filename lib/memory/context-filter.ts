/**
 * Memory Module - Context-Aware Filtering
 *
 * Filters out memories that are already present in the conversation context
 * to prevent redundant information injection.
 */

import type { Memory } from './types'
import { loggers } from '@/lib/logger'

const log = loggers.memory

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface FilterResult {
  kept: Memory[]
  filtered: Memory[]
  reasons: Map<string, string>
}

/**
 * Extract key phrases from a memory for matching
 * Handles different memory formats and extracts the essential content
 */
function extractKeyPhrases(content: string): string[] {
  const normalized = content.toLowerCase().trim()

  // Remove common prefixes like "User prefers:", "User is:", etc.
  const cleanContent = normalized
    .replace(/^user\s+(prefers|is|has|wants|likes|works|uses|knows):\s*/i, '')
    .replace(/^user's?\s+/i, '')
    .replace(/^(preference|fact|goal|skill|context):\s*/i, '')

  // Extract key entities (names, technologies, roles, etc.)
  const phrases: string[] = []

  // Add the full cleaned content
  if (cleanContent.length > 3) {
    phrases.push(cleanContent)
  }

  // Extract significant words (nouns, proper nouns, technologies)
  // Filter out common words
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
    'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
    'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his',
    'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
    'they', 'them', 'their', 'theirs', 'themselves', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into',
    'over', 'after', 'user', 'prefers', 'likes', 'uses', 'wants', 'works'
  ])

  const words = cleanContent.split(/\s+/).filter(word =>
    word.length > 2 && !stopWords.has(word)
  )

  // Add individual significant words
  words.forEach(word => {
    if (word.length > 3) {
      phrases.push(word)
    }
  })

  // Extract technology/role patterns (e.g., "react", "typescript", "software engineer")
  const techPatterns = cleanContent.match(/\b(react|vue|angular|typescript|javascript|python|java|go|rust|node|sql|aws|docker|kubernetes|engineer|developer|designer|manager|senior|junior|lead|fullstack|frontend|backend)\b/gi)
  if (techPatterns) {
    phrases.push(...techPatterns.map(t => t.toLowerCase()))
  }

  // Extract quoted content if any
  const quoted = cleanContent.match(/"([^"]+)"|'([^']+)'/g)
  if (quoted) {
    phrases.push(...quoted.map(q => q.replace(/['"]/g, '')))
  }

  return [...new Set(phrases)] // Deduplicate
}

/**
 * Check if a phrase appears in the conversation context
 * Uses fuzzy matching to handle variations
 */
function isPhraseInContext(phrase: string, contextText: string): boolean {
  const phraseLower = phrase.toLowerCase()
  const contextLower = contextText.toLowerCase()

  // Direct substring match
  if (contextLower.includes(phraseLower)) {
    return true
  }

  // For multi-word phrases, check if all significant words appear
  const words = phraseLower.split(/\s+/).filter(w => w.length > 3)
  if (words.length >= 2) {
    const allWordsPresent = words.every(word => contextLower.includes(word))
    if (allWordsPresent) {
      return true
    }
  }

  return false
}

/**
 * Check if memory is asking about something (should retrieve, not filter)
 * Edge case: "Do you remember my name?" should still retrieve name memory
 */
function isAskingAboutMemory(query: string, memory: Memory): boolean {
  const queryLower = query.toLowerCase()
  const memoryPhrases = extractKeyPhrases(memory.content)

  // Patterns that indicate asking about something
  const askingPatterns = [
    /\b(do you (know|remember)|what('s| is) my|tell me (about )?my|remind me)\b/i,
    /\bwhat did i (tell|say|mention)\b/i,
    /\b(recall|remember) (what|when|where|why|how)\b/i,
  ]

  const isAsking = askingPatterns.some(p => p.test(queryLower))
  if (!isAsking) return false

  // Check if asking about this specific memory's topic
  return memoryPhrases.some(phrase => queryLower.includes(phrase))
}

/**
 * Check if memory content contradicts something in the conversation
 * Edge case: User says "I now use React" but memory says "prefers Vue"
 * In this case, we should probably inject the memory so model can resolve
 */
function isContradiction(memory: Memory, contextText: string): boolean {
  const contentLower = memory.content.toLowerCase()
  const contextLower = contextText.toLowerCase()

  // Look for negation patterns that might contradict the memory
  const keyPhrases = extractKeyPhrases(contentLower)

  for (const phrase of keyPhrases) {
    // Check if the context negates this phrase
    const negationPatterns = [
      new RegExp(`\\b(not|no longer|don't|doesn't|stopped|quit|switched from)\\s+.*\\b${phrase}\\b`, 'i'),
      new RegExp(`\\b${phrase}\\b.*\\b(anymore|no more|not anymore)\\b`, 'i'),
      new RegExp(`\\bused to\\b.*\\b${phrase}\\b`, 'i'),
    ]

    if (negationPatterns.some(p => p.test(contextLower))) {
      return true
    }
  }

  return false
}

/**
 * Main function: Filter out memories already present in conversation
 *
 * @param memories - Retrieved memories to filter
 * @param recentMessages - Last N messages from conversation (typically 4-6)
 * @param query - The current user query
 * @returns FilterResult with kept/filtered memories and reasons
 */
export function filterMemoriesAlreadyInContext(
  memories: Memory[],
  recentMessages: ConversationMessage[],
  query: string
): FilterResult {
  if (memories.length === 0 || recentMessages.length === 0) {
    return { kept: memories, filtered: [], reasons: new Map() }
  }

  // Build context text from recent messages
  // IMPORTANT: Include system messages because that's where memories are injected!
  // This prevents the same memories from being re-injected every turn
  const contextText = recentMessages
    .map(m => m.content)
    .join(' ')

  const kept: Memory[] = []
  const filtered: Memory[] = []
  const reasons = new Map<string, string>()

  for (const memory of memories) {
    const keyPhrases = extractKeyPhrases(memory.content)

    // Edge case 1: User is asking about this memory - KEEP it
    if (isAskingAboutMemory(query, memory)) {
      kept.push(memory)
      log.debug(`Keeping memory (user asking about it): ${memory.content.substring(0, 40)}...`)
      continue
    }

    // Edge case 2: Memory might contradict recent context - KEEP it
    // Model needs to see both to resolve the contradiction
    if (isContradiction(memory, contextText)) {
      kept.push(memory)
      reasons.set(memory.id, 'Kept: potential contradiction needs resolution')
      log.debug(`Keeping memory (potential contradiction): ${memory.content.substring(0, 40)}...`)
      continue
    }

    // Check if key phrases are already in context
    const phrasesInContext = keyPhrases.filter(phrase =>
      isPhraseInContext(phrase, contextText)
    )

    // If most key phrases are already in context, filter out
    const coverageRatio = keyPhrases.length > 0
      ? phrasesInContext.length / keyPhrases.length
      : 0

    // Threshold: if 60%+ of key phrases are in context, filter out
    // This handles partial matches gracefully
    if (coverageRatio >= 0.6) {
      filtered.push(memory)
      reasons.set(memory.id, `Filtered: ${Math.round(coverageRatio * 100)}% already in context`)
      log.debug(`Filtering memory (${Math.round(coverageRatio * 100)}% in context): ${memory.content.substring(0, 40)}...`)
    } else {
      kept.push(memory)
    }
  }

  if (filtered.length > 0) {
    log.info(`Context filter: kept ${kept.length}, filtered ${filtered.length} (already in conversation)`)
  }

  return { kept, filtered, reasons }
}

/**
 * Check if memory content is transient (temporary) and shouldn't be stored
 * Used during extraction to filter out non-persistent information
 */
export function isTransientContent(content: string): boolean {
  const contentLower = content.toLowerCase()

  // Patterns that indicate transient/temporary information
  const transientPatterns = [
    // Current debugging/troubleshooting (temporary)
    /\b(debugging|troubleshooting|fixing|investigating)\s+(a|an|the|this)?\s*(bug|error|issue|problem)\b/i,
    /\bcurrently (working on|debugging|fixing)\b/i,
    /\bthis (error|bug|issue)\b/i,

    // Specific code/file references (too granular)
    /\b(line \d+|file:?|\.tsx?|\.jsx?|\.py|\.java)\b/i,
    /\b(function|method|class|variable)\s+\w+\b/i,

    // One-time requests (not persistent)
    /\b(help (me )?with|can you|please|explain)\b/i,
    /\bshow me how\b/i,

    // Time-bound references
    /\b(today|yesterday|tomorrow|this (week|month)|right now)\b/i,
    /\b(at the moment|for now|temporarily)\b/i,

    // Questions (not facts)
    /\?$/,
    /^(what|how|why|when|where|can|could|would|should|is|are|do|does)\b/i,
  ]

  return transientPatterns.some(p => p.test(contentLower))
}

/**
 * Check if content is high-quality for long-term memory
 * Returns a quality score from 0-1
 */
export function assessMemoryQuality(content: string, type: string): number {
  const contentLower = content.toLowerCase()
  let score = 0.5 // Base score

  // Positive signals (increase score)

  // Contains specific identity information
  if (/\b(name is|called|known as|i am|i'm)\s+\w+/i.test(contentLower)) {
    score += 0.2
  }

  // Contains professional information
  if (/\b(work(s|ing)? (as|at|for)|engineer|developer|designer|manager|role|job|career)\b/i.test(contentLower)) {
    score += 0.15
  }

  // Contains technology preferences (persistent)
  if (/\b(prefer|always use|favorite|love using|primarily|mainly)\s+(typescript|python|react|vue)/i.test(contentLower)) {
    score += 0.15
  }

  // Contains location information
  if (/\b(live[s]? in|from|based in|located in)\s+\w+/i.test(contentLower)) {
    score += 0.1
  }

  // Contains learning goals (motivational, persistent)
  if (/\b(want to learn|learning|goal is|trying to master)\b/i.test(contentLower)) {
    score += 0.1
  }

  // Negative signals (decrease score)

  // Too short (probably not enough context)
  if (content.length < 20) {
    score -= 0.2
  }

  // Too long (probably too specific)
  if (content.length > 150) {
    score -= 0.1
  }

  // Contains uncertain language
  if (/\b(maybe|might|sometimes|occasionally|probably)\b/i.test(contentLower)) {
    score -= 0.1
  }

  // Context type with time reference (often stale)
  if (type === 'context' && /\b(currently|right now|this|today)\b/i.test(contentLower)) {
    score -= 0.2
  }

  // Transient content
  if (isTransientContent(content)) {
    score -= 0.3
  }

  return Math.max(0, Math.min(1, score))
}
