/**
 * Memory Module - Unified Exports
 *
 * This file re-exports all memory-related functionality from the focused modules.
 * Import from '@/lib/memory' instead of individual files.
 *
 * MODULE STRUCTURE:
 * - types.ts           - Type definitions
 * - storage-service.ts - Storage & persistence operations
 * - maintenance-service.ts - Expiration, consolidation, cleanup
 * - retrieval-service.ts   - Query classification & memory retrieval
 * - extraction-service.ts  - LLM-based memory extraction
 * - duplicate-detection.ts - Duplicate detection logic
 * - classification.ts      - Query classification (Self-RAG)
 * - context-filter.ts      - Context-aware filtering
 */

// Types
export type { Memory, MemorySettings, DeletedMemory } from './types'
export type { QueryClassification, MEMORY_MODELS } from './types'

// Storage Service
export {
  getStorageKey,
  getDeletedStorageKey,
  loadMemoriesFromStorage,
  saveMemoriesToStorage,
  loadDeletedMemoriesFromStorage,
  saveDeletedMemoriesToStorage,
  clearAnonymousStorage,
  migrateOldMemories,
  DatabaseSync,
} from './storage-service'

// Maintenance Service
export {
  checkAndExpireMemories,
  adjustMemoryImportance,
  shouldRunMaintenance,
  cleanupExpiredArchive,
  consolidateMemories,
  removeDuplicates,
} from './maintenance-service'
export type {
  MaintenanceResult,
  ConsolidationAction,
  ExpirationResult,
  ImportanceAdjustmentResult,
} from './maintenance-service'

// Retrieval Service
export {
  applyDynamicLimit,
  getRelevantMemoriesKeyword,
  getRelevantMemoriesSemantic,
  getRelevantMemoriesWithClassification,
  formatMemoriesForContext,
} from './retrieval-service'
export type {
  MemoryRetrievalDecision,
  RetrievalResult,
  RetrievalConfig,
} from './retrieval-service'

// Extraction Service
export {
  extractMemoriesFromConversation,
  extractMemoriesWithLLM,
  integrateProfile,
  shouldExtractMemories,
} from './extraction-service'
export type {
  ExtractionResult,
  ProfileIntegrationResult,
} from './extraction-service'

// Duplicate Detection
export {
  isMemoryDuplicate,
  normalizeMemoryContent,
  extractKeyValue,
  calculateSimilarity,
} from './duplicate-detection'

// Classification
export {
  classifyQuery,
  classifyQuerySync,
} from './classification'

// Context Filter
export {
  filterMemoriesAlreadyInContext,
  isTransientContent,
  assessMemoryQuality,
} from './context-filter'
export type { ConversationMessage } from './context-filter'
