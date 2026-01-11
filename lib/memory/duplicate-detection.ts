/**
 * Memory Duplicate Detection
 *
 * Detects duplicate memories using multiple strategies:
 * - Exact match (case-insensitive)
 * - Key-value pattern matching (e.g., "name is X", "age is Y")
 * - Same key type with high value overlap
 * - High substring overlap (>75% similar)
 */

import type { Memory } from '@/types'
import { loggers } from '@/lib/logger'

const log = loggers.memory

// Critical keys for more strict matching
const CRITICAL_KEYS = ['name', 'age', 'location', 'occupation']

interface KeyValue {
  key: string
  value: string
  rawValue: string
}

/**
 * Check if a memory is a duplicate of an existing memory
 */
export function isMemoryDuplicate(newContent: string, existingMemories: Memory[]): boolean {
  if (!newContent || existingMemories.length === 0) return false

  const newContentLower = newContent.toLowerCase().trim()
  const newContentNormalized = normalizeMemoryContent(newContentLower)

  // Extract key-value from new content once
  const newKeyValue = extractKeyValue(newContentLower)

  for (const existing of existingMemories) {
    const existingLower = existing.content.toLowerCase().trim()
    const existingNormalized = normalizeMemoryContent(existingLower)

    // Strategy 1: Exact match (normalized)
    if (newContentNormalized === existingNormalized) {
      log.debug('Duplicate: exact match')
      return true
    }

    // Strategy 2: Key-value pattern matching
    const existingKeyValue = extractKeyValue(existingLower)
    if (newKeyValue && existingKeyValue && newKeyValue.key === existingKeyValue.key) {
      // Same key type - check if values match or overlap significantly
      if (newKeyValue.value === existingKeyValue.value) {
        log.debug('Duplicate: same key-value pair', newKeyValue.key, '=', newKeyValue.value)
        return true
      }

      // For name/age/location, check if one value contains the other
      if (CRITICAL_KEYS.includes(newKeyValue.key)) {
        const newVal = newKeyValue.value
        const existingVal = existingKeyValue.value

        // Check containment
        if (newVal.includes(existingVal) || existingVal.includes(newVal)) {
          log.debug('Duplicate: same key with overlapping value',
            newKeyValue.key, ':', existingVal, '~=', newVal)
          return true
        }

        // For age, check if numeric values match
        if (newKeyValue.key === 'age') {
          const newAge = newVal.match(/\d+/)?.[0]
          const existingAge = existingVal.match(/\d+/)?.[0]
          if (newAge && existingAge && newAge === existingAge) {
            log.debug('Duplicate: same age value', newAge)
            return true
          }
        }

        // Check high similarity between values
        const valueSimilarity = calculateSimilarity(newVal, existingVal)
        if (valueSimilarity > 0.7) {
          log.debug('Duplicate: same key with similar value',
            newKeyValue.key, valueSimilarity.toFixed(2))
          return true
        }
      }
    }

    // Strategy 3: High substring overlap
    const similarity = calculateSimilarity(newContentNormalized, existingNormalized)
    if (similarity > 0.75) {
      log.debug('Duplicate: high similarity', similarity.toFixed(2))
      return true
    }

    // Strategy 4: Check if both memories contain the same core information
    if (newKeyValue && existingKeyValue &&
        newKeyValue.key === existingKeyValue.key &&
        CRITICAL_KEYS.includes(newKeyValue.key)) {
      const newWords = new Set(newKeyValue.value.split(/\s+/).filter(w => w.length >= 3))
      const existingWords = new Set(existingKeyValue.value.split(/\s+/).filter(w => w.length >= 3))

      if (newWords.size > 0 && existingWords.size > 0) {
        const intersection = [...newWords].filter(w => existingWords.has(w))
        if (intersection.length > 0) {
          log.debug('Duplicate: same key with shared core word',
            newKeyValue.key, ':', intersection.join(', '))
          return true
        }
      }
    }
  }

  return false
}

/**
 * Normalize memory content for comparison
 */
export function normalizeMemoryContent(content: string): string {
  return content
    .replace(/user's?|the user|my/gi, '')
    .replace(/\bis\b|\bare\b|\bhas\b|\bhave\b/gi, '')
    .replace(/['".,!?:;]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract key-value pattern from memory content
 */
export function extractKeyValue(content: string): KeyValue | null {
  const patternGroups: Array<{ key: string; patterns: RegExp[] }> = [
    {
      key: 'name',
      patterns: [
        /(?:user'?s?\s+)?name\s*(?:is|:)\s*(.+)/i,
        /(?:called|named)\s+(.+)/i,
        /(?:goes by|known as)\s+(.+)/i,
        /(.+?)\s+is\s+(?:the\s+)?(?:user'?s?\s+)?name/i,
      ]
    },
    {
      key: 'age',
      patterns: [
        /(?:user'?s?\s+)?age\s*(?:is|:)\s*(\d+)/i,
        /(\d+)\s*years?\s*old/i,
        /(?:is|are)\s+(\d+)\s*(?:years?\s*old)?/i,
        /born\s+in\s+(\d{4})/i,
        /age:\s*(\d+)/i,
      ]
    },
    {
      key: 'location',
      patterns: [
        /(?:user\s+)?(?:lives?|living|located|based)\s+(?:in|at)\s+(.+)/i,
        /(?:from|city|location|hometown)\s*(?:is|:)\s*(.+)/i,
        /(?:resides?|residing)\s+(?:in|at)\s+(.+)/i,
        /(?:in|at|from)\s+([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)/i,
      ]
    },
    {
      key: 'occupation',
      patterns: [
        /(?:user\s+)?(?:works?|working)\s+(?:as\s+)?(?:a\s+)?(.+)/i,
        /(?:job|occupation|profession|role|career)\s*(?:is|:)\s*(.+)/i,
        /(?:is\s+a|am\s+a)\s+(.+?)(?:\s+(?:at|for|in)|$)/i,
        /(?:employed|hired)\s+(?:as\s+)?(?:a\s+)?(.+)/i,
      ]
    },
    {
      key: 'interests',
      patterns: [
        /(?:user\s+)?(?:interested?|likes?|enjoys?|loves?)\s+(.+)/i,
        /(?:interests?|hobbies?|passions?)\s*(?:is|are|:)\s*(.+)/i,
        /(?:into|fond of|fan of)\s+(.+)/i,
      ]
    },
    {
      key: 'goals',
      patterns: [
        /(?:user\s+)?(?:wants?|wishes?|hopes?)\s+to\s+(.+)/i,
        /(?:goals?|aspirations?|objectives?)\s*(?:is|are|:)\s*(.+)/i,
        /(?:trying|planning|aiming)\s+to\s+(.+)/i,
        /(?:dreams?\s+of|strives?\s+for)\s+(.+)/i,
      ]
    },
    {
      key: 'communication',
      patterns: [
        /(?:prefers?|likes?)\s+(.+?)\s*(?:communication|responses?|style)/i,
        /(?:communication\s+style|tone)\s*(?:is|:)\s*(.+)/i,
      ]
    }
  ]

  for (const group of patternGroups) {
    for (const pattern of group.patterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        const rawValue = match[1].trim()
        const value = rawValue.toLowerCase()
          .replace(/[.,;:!?]+$/, '')
          .trim()
        return { key: group.key, value, rawValue }
      }
    }
  }

  return null
}

/**
 * Calculate Jaccard similarity between two strings
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2))
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2))

  if (words1.size === 0 && words2.size === 0) return 1
  if (words1.size === 0 || words2.size === 0) return 0

  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}
