/**
 * Memory Module - Type Definitions
 */

import type { Memory, MemorySettings, DeletedMemory } from '@/types'

export type { Memory, MemorySettings, DeletedMemory }

/**
 * Query classification result
 */
export interface QueryClassification {
  needsMemory: boolean
  confidence: number // 0-1
  reason: string
  queryType: 'factual' | 'personal' | 'ambiguous'
}

/**
 * Memory retrieval decision - explains why memories were/weren't retrieved
 */
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

/**
 * Memory with similarity score (from semantic search)
 */
export interface ScoredMemory extends Memory {
  similarity?: number
  score?: number
}

/**
 * Memory retrieval result
 */
export interface MemoryRetrievalResult {
  memories: Memory[]
  classification: QueryClassification
  skipped: boolean
  searchMethod?: 'semantic' | 'keyword'
  decision: MemoryRetrievalDecision
}

/**
 * Memory extraction result
 */
export interface MemoryExtractionResult {
  memories: Array<{
    type: Memory['type']
    content: string
    importance: 1 | 2 | 3
    category?: string
  }>
  raw?: string
}

/**
 * Memory consolidation result
 */
export interface ConsolidationResult {
  consolidated: number
  removed: number
  errors: string[]
}

/**
 * Memory maintenance result
 */
export interface MaintenanceResult {
  expired: number
  archived: number
  consolidated: number
  cleaned: number
  errors: string[]
}

/**
 * Default memory settings
 */
export const DEFAULT_MEMORY_SETTINGS: MemorySettings = {
  enabled: false,
  autoExtract: true,
  maxMemoriesInContext: 5,
  importanceThreshold: 2,
  syncToDatabase: false,
  useSemanticSearch: true,
  similarityThreshold: 0.5,
  classificationConfidence: 0.8,
  minRelevanceScore: 0.3,
  alwaysRetrieveForPersonas: true,
  expirationEnabled: true,
  expirationDays: 7,
  archiveRetentionDays: 14,
  autoConsolidation: false,
  autoImportanceAdjustment: true,
  lastMaintenanceRun: 0,
}

/**
 * Default models for memory tasks
 */
export const MEMORY_MODELS = {
  extraction: 'openai/gpt-oss-20b',
  classifier: 'openai/gpt-oss-20b',
  consolidation: 'openai/gpt-oss-120b',
} as const

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  memories: 'chat_memories',
  deletedMemories: 'chat_deleted_memories',
} as const

/**
 * Time constants
 */
export const TIME_CONSTANTS = {
  msPerDay: 24 * 60 * 60 * 1000,
  defaultExpirationDays: 7,
  defaultArchiveRetentionDays: 14,
} as const
