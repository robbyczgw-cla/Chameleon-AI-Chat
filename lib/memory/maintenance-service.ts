/**
 * Memory Maintenance Service
 *
 * Handles automatic memory lifecycle management:
 * - Expiration and archiving of stale memories
 * - Importance adjustment based on usage patterns
 * - Memory consolidation (merging duplicates via LLM)
 * - Scheduled maintenance tasks
 */

import type { Memory, DeletedMemory, MemorySettings } from '@/types'
import { loggers } from '@/lib/logger'

const log = loggers.memory

// Constants
const MS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_EXPIRATION_DAYS = 7
const DEFAULT_ARCHIVE_RETENTION_DAYS = 14

export interface MaintenanceResult {
  success: boolean
  ranImportanceAdjustment: boolean
  ranConsolidation: boolean
  importanceResults?: { boosted: number; reduced: number; skipped: number }
  consolidationResults?: { consolidated: number; kept: number; details?: ConsolidationAction[] }
  error?: string
}

export interface ConsolidationAction {
  kept: Memory
  merged: Memory[]
  reason: string
}

export interface ExpirationResult {
  expired: number
  demoted: number
  skippedProfile: number
}

export interface ImportanceAdjustmentResult {
  boosted: number
  reduced: number
  skipped: number
}

/**
 * Check and expire stale memories
 *
 * Rules:
 * - High importance (3) memories get demoted to 2 first
 * - Other memories get archived directly
 * - Profile-based memories are NEVER expired
 */
export function checkAndExpireMemories(
  memories: Memory[],
  settings: MemorySettings,
  archiveCallback: (id: string, reason: DeletedMemory['deletionReason']) => boolean
): ExpirationResult {
  if (!settings.expirationEnabled) {
    return { expired: 0, demoted: 0, skippedProfile: 0 }
  }

  const expirationDays = settings.expirationDays ?? DEFAULT_EXPIRATION_DAYS
  const expirationThreshold = Date.now() - (expirationDays * MS_PER_DAY)

  let expiredCount = 0
  let demotedCount = 0
  let skippedProfileCount = 0
  const memoriesToArchive: Memory[] = []
  const memoriesToDemote: Memory[] = []

  for (const memory of memories) {
    if (memory.lastAccessedAt < expirationThreshold) {
      // NEVER expire profile-based memories
      if (memory.source === 'profile' || memory.category === 'personal_info') {
        skippedProfileCount++
        log.debug('Skipping decay for profile memory:', memory.content.substring(0, 40))
        memory.lastAccessedAt = Date.now()
        continue
      }

      if (memory.importance === 3) {
        memoriesToDemote.push(memory)
      } else {
        memoriesToArchive.push(memory)
      }
    }
  }

  // Demote high importance memories
  for (const memory of memoriesToDemote) {
    memory.importance = 2
    memory.lastAccessedAt = Date.now()
    demotedCount++
    log.debug('Demoted high-importance memory:', memory.content.substring(0, 40))
  }

  // Archive other expired memories
  for (const memory of memoriesToArchive) {
    if (archiveCallback(memory.id, 'expired')) {
      expiredCount++
    }
  }

  if (demotedCount > 0 || expiredCount > 0 || skippedProfileCount > 0) {
    log.info('Expiration check:', { expired: expiredCount, demoted: demotedCount, skippedProfile: skippedProfileCount })
  }

  return { expired: expiredCount, demoted: demotedCount, skippedProfile: skippedProfileCount }
}

/**
 * Dynamically adjust memory importance based on usage patterns
 *
 * - Frequently accessed memories get boosted (if not already max)
 * - Rarely accessed memories get reduced (if not profile-based)
 */
export function adjustMemoryImportance(memories: Memory[]): ImportanceAdjustmentResult {
  const now = Date.now()
  let boostedCount = 0
  let reducedCount = 0
  let skippedCount = 0

  for (const memory of memories) {
    // Skip profile-based memories
    if (memory.source === 'profile' || memory.category === 'personal_info') {
      skippedCount++
      continue
    }

    const daysSinceCreated = (now - memory.createdAt) / MS_PER_DAY
    const daysSinceAccessed = (now - memory.lastAccessedAt) / MS_PER_DAY

    // Only adjust memories at least 7 days old
    if (daysSinceCreated < 7) {
      continue
    }

    // BOOST: Frequently accessed memories (10+ accesses and used recently)
    if (memory.accessCount >= 10 && daysSinceAccessed < 7 && memory.importance < 3) {
      memory.importance = Math.min(3, memory.importance + 1) as 1 | 2 | 3
      boostedCount++
      log.debug('Boosted importance:', memory.content.substring(0, 40),
        `(accessCount: ${memory.accessCount}, importance: ${memory.importance})`)
    }
    // REDUCE: Rarely accessed memories (0 accesses in 30+ days, not already low)
    else if (daysSinceAccessed > 30 && memory.accessCount === 0 && memory.importance > 1) {
      memory.importance = Math.max(1, memory.importance - 1) as 1 | 2 | 3
      reducedCount++
      log.debug('Reduced importance:', memory.content.substring(0, 40),
        `(daysSinceAccessed: ${Math.floor(daysSinceAccessed)}, importance: ${memory.importance})`)
    }
  }

  if (boostedCount > 0 || reducedCount > 0) {
    log.info('Importance adjustment:', { boosted: boostedCount, reduced: reducedCount, skipped: skippedCount })
  }

  return { boosted: boostedCount, reduced: reducedCount, skipped: skippedCount }
}

/**
 * Check if maintenance should run (24+ hours since last run)
 */
export function shouldRunMaintenance(settings: MemorySettings): {
  should: boolean
  hoursSinceLastRun: number
  hoursUntilNext: number
} {
  const now = Date.now()
  const lastRun = settings.lastMaintenanceRun || 0
  const hoursSinceLastRun = (now - lastRun) / (1000 * 60 * 60)
  const should = hoursSinceLastRun >= 24

  return {
    should,
    hoursSinceLastRun: Math.floor(hoursSinceLastRun),
    hoursUntilNext: should ? 0 : Math.ceil(24 - hoursSinceLastRun)
  }
}

/**
 * Cleanup expired memories from archive
 */
export function cleanupExpiredArchive(deletedMemories: DeletedMemory[]): DeletedMemory[] {
  const now = Date.now()
  const initialCount = deletedMemories.length
  const filtered = deletedMemories.filter(m => m.expiresAt > now)
  const removedCount = initialCount - filtered.length

  if (removedCount > 0) {
    log.info(`Permanently removed ${removedCount} expired memories from archive`)
  }

  return filtered
}

/**
 * Consolidate duplicate/similar memories using LLM
 */
export async function consolidateMemories(
  memories: Memory[],
  apiKey: string,
  consolidationModel: string,
  dryRun: boolean = false,
  deleteCallback: (id: string) => boolean
): Promise<{
  success: boolean
  consolidated: number
  kept: number
  error?: string
  details?: ConsolidationAction[]
}> {
  if (!apiKey) {
    return { success: false, consolidated: 0, kept: 0, error: 'No API key provided' }
  }

  if (memories.length < 2) {
    return { success: true, consolidated: 0, kept: memories.length, error: 'Not enough memories to consolidate' }
  }

  try {
    log.info(`Starting consolidation with ${memories.length} memories`)

    // Group memories by type
    const memoryGroups: Record<string, Memory[]> = {
      preference: memories.filter(m => m.type === 'preference'),
      fact: memories.filter(m => m.type === 'fact'),
      context: memories.filter(m => m.type === 'context'),
      skill: memories.filter(m => m.type === 'skill'),
      goal: memories.filter(m => m.type === 'goal'),
    }

    const consolidationActions: ConsolidationAction[] = []
    let totalConsolidated = 0

    for (const [type, typeMemories] of Object.entries(memoryGroups)) {
      if (typeMemories.length < 2) continue

      log.debug(`Analyzing ${typeMemories.length} ${type} memories for consolidation`)

      const memoryList = typeMemories.map((m, idx) => ({
        index: idx,
        id: m.id,
        content: m.content,
        importance: m.importance,
        accessCount: m.accessCount,
        createdAt: new Date(m.createdAt).toISOString(),
      }))

      const prompt = buildConsolidationPrompt(type, memoryList)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-openrouter-api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: consolidationModel,
          temperature: 0.2,
          maxTokens: 2000,
          stream: false,
        }),
      })

      if (!response.ok) {
        log.error(`Consolidation API error for ${type}:`, response.status)
        continue
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        log.debug(`No consolidation groups found for ${type}`)
        continue
      }

      const groups = JSON.parse(jsonMatch[0])

      if (!Array.isArray(groups) || groups.length === 0) {
        log.debug(`No consolidation needed for ${type}`)
        continue
      }

      log.debug(`Found ${groups.length} consolidation groups for ${type}`)

      for (const group of groups) {
        if (group.isConflict) {
          log.warn('CONFLICT detected:', group.reason)
          continue
        }

        const keepMemory = typeMemories[group.keep]
        const mergeMemories = group.merge.map((idx: number) => typeMemories[idx]).filter(Boolean)

        if (!keepMemory || mergeMemories.length === 0) continue

        const totalAccessCount = keepMemory.accessCount +
          mergeMemories.reduce((sum: number, m: Memory) => sum + m.accessCount, 0)

        consolidationActions.push({
          kept: keepMemory,
          merged: mergeMemories,
          reason: group.reason
        })

        if (!dryRun) {
          keepMemory.accessCount = totalAccessCount
          const allMemories = [keepMemory, ...mergeMemories]
          keepMemory.lastAccessedAt = Math.max(...allMemories.map(m => m.lastAccessedAt))

          for (const mergedMemory of mergeMemories) {
            deleteCallback(mergedMemory.id)
            totalConsolidated++
          }

          log.debug(`Consolidated ${mergeMemories.length} memories into:`,
            keepMemory.content.substring(0, 50),
            `(total access count: ${totalAccessCount})`)
        }
      }
    }

    const keptCount = memories.length - totalConsolidated
    log.info('Consolidation complete:', { consolidated: totalConsolidated, kept: keptCount, dryRun })

    return {
      success: true,
      consolidated: totalConsolidated,
      kept: keptCount,
      details: consolidationActions
    }

  } catch (error) {
    log.error('Consolidation error:', error)
    return {
      success: false,
      consolidated: 0,
      kept: memories.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function buildConsolidationPrompt(type: string, memoryList: any[]): string {
  return `You are a memory consolidation system. Analyze these ${type} memories and identify duplicates or highly overlapping memories that should be merged.

MEMORIES:
${JSON.stringify(memoryList, null, 2)}

RULES:
1. Only merge memories that are clearly about the same thing
2. "User likes TypeScript" and "User prefers TS over JS" should merge
3. "User lives in NYC" and "User lives in San Francisco" are CONFLICTING - do NOT merge (flag as conflict)
4. Prefer keeping the memory with:
   - More detail/specificity
   - Higher access count (more useful)
   - More recent creation date (if same detail level)
5. When merging, combine access counts and keep the better content

Return a JSON array of consolidation groups. Each group should have:
- "keep": index of memory to keep
- "merge": array of indices to merge into it
- "reason": brief explanation
- "isConflict": true if these are conflicting (don't actually merge, just flag)

Example output:
[
  {
    "keep": 0,
    "merge": [2, 5],
    "reason": "All about TypeScript preference, #0 has most detail",
    "isConflict": false
  }
]

Return ONLY the JSON array, no markdown or explanation. If no consolidation needed, return [].`
}

/**
 * Remove exact duplicate memories (keeps the oldest one)
 */
export function removeDuplicates(memories: Memory[]): { deduped: Memory[]; removedIds: string[] } {
  const seen = new Map<string, Memory>()
  const duplicateIds: string[] = []

  // Sort by createdAt ascending (oldest first)
  const sorted = [...memories].sort((a, b) => a.createdAt - b.createdAt)

  for (const memory of sorted) {
    const normalizedContent = memory.content.toLowerCase().trim()

    if (seen.has(normalizedContent)) {
      duplicateIds.push(memory.id)
      log.debug('Found duplicate:', memory.content.substring(0, 40))
    } else {
      seen.set(normalizedContent, memory)
    }
  }

  if (duplicateIds.length > 0) {
    log.info(`Removed ${duplicateIds.length} duplicate memories`)
  }

  return {
    deduped: memories.filter(m => !duplicateIds.includes(m.id)),
    removedIds: duplicateIds
  }
}
