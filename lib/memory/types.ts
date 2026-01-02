/**
 * Memory Module - Type Definitions
 *
 * This file contains shared types used by the memory classification
 * and context filtering modules.
 *
 * Note: The main Memory, MemorySettings, and DeletedMemory types
 * are defined in @/types and re-exported here for convenience.
 */

import type { Memory, MemorySettings, DeletedMemory } from '@/types'

// Re-export base types from @/types
export type { Memory, MemorySettings, DeletedMemory }

/**
 * Query classification result from Self-RAG inspired classification.
 *
 * Used by classification.ts to determine if a query needs memory context.
 *
 * @property needsMemory - Whether the query requires personal memory context
 * @property confidence - Confidence level (0-1) in the classification
 * @property reason - Human-readable explanation of the classification
 * @property queryType - Category of the query
 */
export interface QueryClassification {
  needsMemory: boolean
  confidence: number
  reason: string
  queryType: 'factual' | 'personal' | 'ambiguous'
}

/**
 * Default models for memory background tasks.
 *
 * These are cheap, fast models suitable for:
 * - Query classification (simple intent detection)
 * - Memory extraction (structured JSON output)
 * - Memory consolidation (requires more reasoning)
 *
 * Can be overridden via experimental settings in the UI.
 */
export const MEMORY_MODELS = {
  extraction: 'openai/gpt-oss-20b',
  classifier: 'openai/gpt-oss-20b',
  consolidation: 'openai/gpt-oss-120b',
} as const
