/**
 * useMessagePreprocessing Hook
 *
 * Shared logic for message preprocessing used by both Simple and Advanced chat inputs:
 * - Memory retrieval with intelligent classification
 * - Memory context formatting and injection
 * - Streaming history entries for transparency
 *
 * This eliminates ~150 lines of duplicate code between chat-input.tsx and simple-chat-input.tsx.
 */

import { useCallback } from 'react'
import { memoryService } from '@/lib/memory-service'
import { getBackgroundModel } from '@/components/experimental-settings'
import type { Memory, UsedMemory, Message, StreamingHistoryEntry, MemorySettings, BackgroundAIModelsSettings } from '@/types'

export interface MemoryRetrievalOptions {
  /** User query to retrieve memories for */
  query: string
  /** API key for OpenRouter */
  apiKey?: string
  /** Maximum memories to include in context */
  maxMemories?: number
  /** Whether this is a persona chat (always retrieve for personas) */
  isPersonaChat?: boolean
  /** Recent messages for context-aware deduplication */
  recentMessages?: Array<{ role: string; content: string }>
  /** Background AI model settings */
  backgroundAIModels?: BackgroundAIModelsSettings
  /** Memory settings from user settings */
  memorySettings?: MemorySettings
  /** Whether this is a private chat (skip memory) */
  isPrivateChat?: boolean
}

export interface MemoryRetrievalResult {
  /** Relevant memories retrieved */
  memories: Memory[]
  /** Formatted memory context string */
  memoryContext: string
  /** Decision details for transparency */
  decision: {
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
  /** Streaming history entry for this retrieval */
  historyEntry: StreamingHistoryEntry
}

/**
 * Hook for shared message preprocessing logic
 */
export function useMessagePreprocessing() {
  /**
   * Retrieve and format memory context for a message
   */
  const retrieveMemoryContext = useCallback(async (
    options: MemoryRetrievalOptions
  ): Promise<MemoryRetrievalResult> => {
    const {
      query,
      apiKey,
      maxMemories = 3,
      isPersonaChat = false,
      recentMessages = [],
      backgroundAIModels,
      memorySettings,
      isPrivateChat = false
    } = options

    // Default result for when memory is skipped
    const defaultResult: MemoryRetrievalResult = {
      memories: [],
      memoryContext: '',
      decision: {
        action: 'skipped',
        reason: 'Memory disabled or not applicable',
        details: {}
      },
      historyEntry: {
        phase: 'thinking',
        timestamp: Date.now(),
        description: 'Memory: Skipped',
        memoryDecision: {
          action: 'skipped',
          reason: 'Memory disabled'
        }
      }
    }

    // Handle private chat mode
    if (isPrivateChat) {
      console.log('[useMessagePreprocessing] 🔒 PRIVATE MODE: Skipping memory retrieval')
      return {
        ...defaultResult,
        decision: {
          action: 'skipped',
          reason: 'Private chat - no memory access',
          details: {}
        },
        historyEntry: {
          phase: 'thinking',
          timestamp: Date.now(),
          description: 'Private Mode: Memory disabled',
          memoryDecision: {
            action: 'skipped',
            reason: 'Private chat - no memory access'
          }
        }
      }
    }

    // Check if memory is enabled
    if (!memorySettings?.enabled) {
      return defaultResult
    }

    try {
      // Set background models if configured
      if (backgroundAIModels) {
        memoryService.setModels({
          classifierModel: getBackgroundModel('queryClassification', backgroundAIModels),
          extractionModel: getBackgroundModel('memoryExtraction', backgroundAIModels),
          consolidationModel: getBackgroundModel('memoryConsolidation', backgroundAIModels),
          embeddingModel: getBackgroundModel('embeddings', backgroundAIModels),
        })
      }

      console.log('[useMessagePreprocessing] 🧠 Intelligent memory retrieval for query:',
        query.substring(0, 50), isPersonaChat ? '(persona chat)' : '')

      const { memories: relevantMemories, decision, searchMethod } =
        await memoryService.getRelevantMemoriesWithClassification(
          query,
          apiKey,
          maxMemories,
          isPersonaChat,
          recentMessages
        )

      // Handle skipped decision
      if (decision.action === 'skipped') {
        console.log('[useMessagePreprocessing] ⏭️ Memory skipped:', decision.reason,
          `(type: ${decision.details.queryType}, confidence: ${decision.details.confidence?.toFixed(2)})`)

        return {
          memories: [],
          memoryContext: '',
          decision,
          historyEntry: {
            phase: 'thinking',
            timestamp: Date.now(),
            description: `Memory: ${decision.reason}`,
            memoryDecision: {
              action: 'skipped',
              reason: decision.reason,
              confidence: decision.details.confidence
            }
          }
        }
      }

      // Handle retrieved memories
      if (decision.action === 'retrieved' && relevantMemories.length > 0) {
        const memoryContext = memoryService.formatMemoriesForContext(relevantMemories)
        console.log('[useMessagePreprocessing] ✅ Memory context added:', decision.reason,
          decision.details.topSimilarity ? `(top similarity: ${decision.details.topSimilarity.toFixed(3)})` : '')

        const usedMemories: UsedMemory[] = relevantMemories.map(m => ({
          id: m.id,
          content: m.content,
          type: m.type,
          importance: m.importance,
          similarity: decision.details.topSimilarity
        }))

        return {
          memories: relevantMemories,
          memoryContext,
          decision,
          historyEntry: {
            phase: 'thinking',
            timestamp: Date.now(),
            description: `Using ${relevantMemories.length} memories`,
            usedMemories,
            memoryDecision: {
              action: 'retrieved',
              reason: decision.reason,
              searchMethod: searchMethod as 'semantic' | 'keyword' | undefined,
              confidence: decision.details.confidence
            }
          }
        }
      }

      // Handle empty result
      console.log('[useMessagePreprocessing] 📭', decision.reason,
        decision.details.topSimilarity ? `(top similarity: ${decision.details.topSimilarity.toFixed(3)})` : '')

      return {
        memories: [],
        memoryContext: '',
        decision,
        historyEntry: {
          phase: 'thinking',
          timestamp: Date.now(),
          description: decision.reason,
          memoryDecision: {
            action: 'empty',
            reason: decision.reason,
            searchMethod: searchMethod as 'semantic' | 'keyword' | undefined
          }
        }
      }
    } catch (memoryError) {
      console.error('[useMessagePreprocessing] ⚠️ Memory retrieval failed:', memoryError)

      return {
        memories: [],
        memoryContext: '',
        decision: {
          action: 'skipped',
          reason: 'Memory retrieval failed',
          details: {}
        },
        historyEntry: {
          phase: 'thinking',
          timestamp: Date.now(),
          description: 'Memory: Error during retrieval',
          memoryDecision: {
            action: 'skipped',
            reason: 'Memory retrieval failed'
          }
        }
      }
    }
  }, [])

  /**
   * Inject memory context into messages array
   * Inserts memory context as a system message before the last user message
   */
  const injectMemoryContext = useCallback((
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    memoryContext: string
  ): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> => {
    if (!memoryContext) return messages

    // Insert memory context before the last message (which is typically the user's query)
    const result = [...messages]
    result.splice(-1, 0, { role: 'system' as const, content: memoryContext })
    return result
  }, [])

  /**
   * Extract recent messages for context deduplication
   */
  const getRecentMessagesForContext = useCallback((
    messages: Message[],
    count: number = 6
  ): Array<{ role: string; content: string }> => {
    return messages.slice(-count).map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : ''
    }))
  }, [])

  return {
    retrieveMemoryContext,
    injectMemoryContext,
    getRecentMessagesForContext
  }
}
