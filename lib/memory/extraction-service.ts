/**
 * Memory Extraction Service
 *
 * Handles extracting memories from conversations:
 * - Pattern-based extraction (fast, no API)
 * - LLM-based extraction (accurate, requires API key)
 * - Profile integration (converts user profile to memories)
 */

import type { Memory } from '@/types'
import { generateUUID } from '@/lib/utils'
import { isTransientContent, assessMemoryQuality } from './context-filter'
import { loggers } from '@/lib/logger'

const log = loggers.memory

export interface ExtractionResult {
  memories: Memory[]
  skippedDuplicates: number
}

export interface ProfileIntegrationResult {
  success: boolean
  memoriesCreated: number
  error?: string
}

/**
 * Extract memories from conversation using pattern matching (no API required)
 */
export function extractMemoriesFromConversation(
  userMessage: string,
  assistantMessage: string
): Memory[] {
  const suggestions: Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>[] = []

  // Preference patterns
  const preferencePatterns = [
    /I (?:prefer|like|love|enjoy|want) (.+?)(?:\.|$)/gi,
    /I don't (?:like|want|prefer|enjoy) (.+?)(?:\.|$)/gi,
    /My preference is (.+?)(?:\.|$)/gi,
  ]

  // Fact patterns
  const factPatterns = [
    /I (?:am|work as|study|live in) (.+?)(?:\.|$)/gi,
    /My (?:name|job|role|hobby|interest) is (.+?)(?:\.|$)/gi,
    /I have (.+?)(?:\.|$)/gi,
  ]

  // Goal patterns
  const goalPatterns = [
    /I (?:want to|need to|plan to|goal is to) (.+?)(?:\.|$)/gi,
    /I'm (?:trying to|working on|learning) (.+?)(?:\.|$)/gi,
  ]

  const combined = `${userMessage} ${assistantMessage}`.toLowerCase()

  // Extract preferences
  preferencePatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(combined)) !== null) {
      const content = match[1].trim()
      if (content.length > 10 && content.length < 200) {
        suggestions.push({
          type: 'preference',
          content: `User ${match[0].includes("don't") ? "doesn't" : ""} prefers: ${content}`,
          importance: 2,
        })
      }
    }
  })

  // Extract facts
  factPatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(combined)) !== null) {
      const content = match[1].trim()
      if (content.length > 3 && content.length < 200) {
        suggestions.push({
          type: 'fact',
          content: `User ${match[0].split(' ')[1]}: ${content}`,
          importance: 2,
        })
      }
    }
  })

  // Extract goals
  goalPatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(combined)) !== null) {
      const content = match[1].trim()
      if (content.length > 10 && content.length < 200) {
        suggestions.push({
          type: 'goal',
          content: `User wants to: ${content}`,
          importance: 3,
        })
      }
    }
  })

  // Convert to full Memory objects (without saving yet)
  return suggestions.map(s => ({
    ...s,
    id: generateUUID(),
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    accessCount: 0,
  }))
}

/**
 * Extract memories using LLM
 */
export async function extractMemoriesWithLLM(
  userMessage: string,
  assistantMessage: string,
  apiKey: string,
  extractionModel: string,
  existingMemories: Memory[],
  isDuplicateCheck: (content: string, memories: Memory[]) => boolean
): Promise<Memory[]> {
  const existingContent = existingMemories.map(m => m.content.toLowerCase()).join('; ')

  const extractionPrompt = `Analyze this conversation and extract important facts about the user worth remembering long-term.

EXISTING MEMORIES (do NOT duplicate):
${existingContent || 'None yet'}

CONVERSATION:
User: "${userMessage}"
Assistant: "${assistantMessage}"

RULES:
1. Extract 0-2 memories per conversation (only if there's something worth remembering)
2. Focus on PERSISTENT facts that will still be relevant weeks/months from now
3. If nothing important, return empty array []

✅ GOOD TO EXTRACT:
- Profession/role: "User is a software engineer"
- Preferences: "User prefers TypeScript over JavaScript"
- Goals: "User wants to learn machine learning"
- Skills: "User knows Python and React"
- Location: "User is based in Berlin"
- Personal facts: "User's name is Alex"

❌ DO NOT EXTRACT:
- Current debugging/tasks: "User is fixing a bug" (temporary)
- One-time requests: "User asked about X" (just a question)
- Greetings/filler: "User said thanks"
- Vague statements: "User might use Python"

Return ONLY valid JSON (no markdown):
[] or [{"type": "preference|fact|skill|goal|context", "content": "User ...", "importance": 1|2|3}]

importance: 1=nice to know, 2=useful, 3=very important`

  try {
    log.debug('Starting LLM extraction with model:', extractionModel)
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openrouter-api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: extractionPrompt }],
        model: extractionModel,
        temperature: 0.3,
        maxTokens: 500,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error('Extraction API error:', response.status, errorText)
      return []
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    log.debug('LLM response:', content)

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      log.debug('No valid JSON in extraction response:', content.substring(0, 100))
      return []
    }

    let extracted = parseExtractedJson(jsonMatch[0])
    if (!Array.isArray(extracted) || extracted.length === 0) {
      log.debug('No memories extracted (empty array)')
      return []
    }

    // Process and validate extracted memories
    const newMemories: Memory[] = []
    const MAX_MEMORIES_PER_EXTRACTION = 2

    for (const item of extracted) {
      // Check for duplicates
      if (existingContent && existingContent.length > 0 && item.content?.length > 0) {
        if (isDuplicateCheck(item.content, existingMemories)) {
          log.debug('Skipping duplicate:', item.content?.substring(0, 50))
          continue
        }
      }

      // Validate structure
      if (!item.type || !item.content || item.importance === undefined) {
        log.debug('Skipping invalid item (missing fields):', item)
        continue
      }

      if (!['preference', 'fact', 'goal', 'skill', 'context'].includes(item.type)) {
        log.debug('Skipping invalid type:', item.type)
        continue
      }

      // Filter transient content
      if (isTransientContent(item.content)) {
        log.debug('Skipping transient content:', item.content?.substring(0, 50))
        continue
      }

      // Quality assessment
      const qualityScore = assessMemoryQuality(item.content, item.type)
      if (qualityScore < 0.3) {
        log.debug(`Skipping low quality memory (score: ${qualityScore.toFixed(2)}):`, item.content?.substring(0, 50))
        continue
      }

      if (![1, 2, 3].includes(item.importance)) {
        log.debug('Invalid importance, defaulting to 2:', item.importance)
        item.importance = 2
      }

      const memory: Memory = {
        id: generateUUID(),
        type: item.type,
        content: item.content,
        importance: item.importance,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        accessCount: 0,
      }

      newMemories.push(memory)
      log.debug(`Added to newMemories (quality: ${qualityScore.toFixed(2)}):`, memory.type, '-', memory.content)
    }

    // Cap at max memories per extraction
    if (newMemories.length > MAX_MEMORIES_PER_EXTRACTION) {
      log.debug(`⚠️ Extracted ${newMemories.length} memories, capping at ${MAX_MEMORIES_PER_EXTRACTION}`)
      newMemories.sort((a, b) => b.importance - a.importance)
      newMemories.splice(MAX_MEMORIES_PER_EXTRACTION)
    }

    return newMemories
  } catch (error) {
    log.error('LLM extraction error:', error)
    return []
  }
}

/**
 * Parse extracted JSON with error recovery
 */
function parseExtractedJson(jsonString: string): any[] {
  try {
    return JSON.parse(jsonString)
  } catch (parseError) {
    log.debug('JSON parse failed, attempting to fix...')
    let fixedJson = jsonString
    fixedJson = fixedJson.replace(/"(\s*)([a-zA-Z])/g, '","$2')
    fixedJson = fixedJson.replace(/,\s*([a-zA-Z_]+)\s*:/g, ',"$1":')
    fixedJson = fixedJson.replace(/([^\\])"([^"]*?)([a-zA-Z]+)":/g, '$1"$2","$3":')

    try {
      const result = JSON.parse(fixedJson)
      log.debug('Fixed JSON parsed successfully')
      return result
    } catch (secondError) {
      log.error('Could not fix malformed JSON, skipping extraction')
      return []
    }
  }
}

/**
 * Integrate profile information into memory system
 */
export async function integrateProfile(
  profile: any,
  apiKey: string,
  extractionModel: string,
  existingMemories: Memory[],
  addMemoryCallback: (memory: Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>, apiKey?: string) => Memory,
  isDuplicateCheck: (content: string, memories: Memory[]) => boolean,
  embedMemoryCallback?: (memoryId: string, content: string, apiKey: string) => Promise<void>
): Promise<ProfileIntegrationResult> {
  try {
    log.info('Integrating profile into memory system...')

    // Prepare profile data for LLM processing
    const profileData: Record<string, any> = {}
    if (profile.name) profileData.name = profile.name
    if (profile.age) profileData.age = profile.age
    if (profile.occupation) profileData.occupation = profile.occupation
    if (profile.location) profileData.location = profile.location
    if (profile.aboutMe) profileData.aboutMe = profile.aboutMe
    if (profile.interests?.length > 0) profileData.interests = profile.interests
    if (profile.goals?.length > 0) profileData.goals = profile.goals
    if (profile.preferences?.communicationStyle) profileData.communicationStyle = profile.preferences.communicationStyle
    if (profile.preferences?.topicsToAvoid?.length > 0) profileData.topicsToAvoid = profile.preferences.topicsToAvoid

    if (Object.keys(profileData).length === 0) {
      log.debug('No profile data to integrate')
      return { success: true, memoriesCreated: 0 }
    }

    // Use LLM to categorize profile information
    const prompt = buildProfileIntegrationPrompt(profileData)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://chameleon-ai.chat',
      },
      body: JSON.stringify({
        model: extractionModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.statusText}`)
    }

    const data = await response.json()
    const llmResponse = data.choices?.[0]?.message?.content?.trim()

    if (!llmResponse) {
      throw new Error('Empty LLM response')
    }

    // Parse LLM response
    let memoriesData: any[]
    try {
      const jsonMatch = llmResponse.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ||
                       llmResponse.match(/(\[[\s\S]*?\])/)
      const jsonStr = jsonMatch ? jsonMatch[1] : llmResponse
      memoriesData = JSON.parse(jsonStr)
    } catch (parseError) {
      log.error('Failed to parse LLM response:', llmResponse)
      throw new Error('Failed to parse LLM response as JSON')
    }

    if (!Array.isArray(memoriesData)) {
      throw new Error('LLM response is not an array')
    }

    // Create memories from LLM output (with deduplication)
    const nonProfileMemories = existingMemories.filter(m => m.source !== 'profile')

    let createdCount = 0
    let skippedDuplicates = 0

    for (const memData of memoriesData) {
      try {
        if (isDuplicateCheck(memData.content, nonProfileMemories)) {
          log.debug('Skipping duplicate profile memory:', memData.content.substring(0, 40))
          skippedDuplicates++
          continue
        }

        const memory = addMemoryCallback({
          type: memData.type,
          content: memData.content,
          category: memData.category,
          importance: memData.importance,
          source: 'profile',
          metadata: { profileField: 'auto-categorized' }
        }, apiKey)

        // Generate embedding if callback provided
        if (embedMemoryCallback && apiKey) {
          try {
            await embedMemoryCallback(memory.id, memory.content, apiKey)
          } catch (embedError) {
            log.warn('Failed to generate embedding for profile memory:', embedError)
          }
        }

        createdCount++
      } catch (error) {
        log.error('Failed to create memory from LLM output:', memData, error)
      }
    }

    log.info(`Profile integration complete: ${createdCount} created, ${skippedDuplicates} duplicates skipped`)
    return { success: true, memoriesCreated: createdCount }

  } catch (error) {
    log.error('Profile integration failed:', error)
    return {
      success: false,
      memoriesCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function buildProfileIntegrationPrompt(profileData: Record<string, any>): string {
  return `You are a memory categorization system. Given user profile information, convert each piece of information into structured memory entries.

For each piece of profile information, determine:
1. Memory type: "fact" (concrete information), "preference" (likes/dislikes), "goal" (aspirations), "context" (background), or "skill" (abilities)
2. Importance: 1 (low), 2 (medium), or 3 (high)
3. Clear, concise content (one fact per memory)

Guidelines:
- Name, age, occupation, location are typically "fact" type with importance 3 (high)
- Interests and hobbies are "preference" type with importance 2 (medium)
- Goals and aspirations are "goal" type with importance 2-3
- Communication style is "preference" type with importance 2
- Break lists (interests, goals) into individual memories
- Make content clear and searchable (e.g., "User's name is John" not just "John")

Profile data:
${JSON.stringify(profileData, null, 2)}

Return a JSON array of memory objects with this structure:
[
  {
    "type": "fact" | "preference" | "goal" | "context" | "skill",
    "content": "clear, searchable description",
    "category": "personal_info" | "interests" | "goals" | "communication" | "background",
    "importance": 1 | 2 | 3
  }
]

Return ONLY the JSON array, no other text.`
}

/**
 * Check if conversation qualifies for memory extraction
 */
export function shouldExtractMemories(
  messageCount: number,
  enabled: boolean,
  autoExtract: boolean
): boolean {
  const shouldExtract = enabled && autoExtract && messageCount >= 4
  log.debug('shouldExtractMemories check:', {
    enabled,
    autoExtract,
    messageCount,
    required: 4,
    result: shouldExtract
  })
  return shouldExtract
}
