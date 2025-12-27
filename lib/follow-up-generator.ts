/**
 * Dedicated Follow-Up Generator
 *
 * Generates follow-up suggestions using a dedicated fast/cheap model in parallel
 * with the main AI response. This improves speed and reduces costs.
 *
 * Default model: google/gemini-2.5-flash
 * Fallback: openai/gpt-4o-mini
 */

import type { Message, CategorizedFollowUp } from "@/types"
import { parseFollowUps } from "./follow-up-parser"

// Fast, cheap models for follow-up generation
const DEFAULT_FOLLOWUP_MODEL = "google/gemini-2.5-flash"
const FALLBACK_FOLLOWUP_MODEL = "openai/gpt-4o-mini"

/**
 * Build specialized system prompt for follow-up generation
 * Mirrors the original inline prompt style for better quality
 */
function buildFollowUpPrompt(language: string = "en"): string {
  const languageInstruction = language === "de"
    ? "Antworte auf Deutsch."
    : language === "es"
    ? "Responde en español."
    : ""

  return `Based on this conversation, suggest clickable next possible user prompts in categorized format.
${languageInstruction}

Output ONLY this JSON structure:
{
  "quick": ["Short contextual prompts from user perspective"],
  "deep": ["Detailed prompts for deeper explanations"],
  "related": ["Prompts exploring related topics"]
}

IMPORTANT:
- Prompts are from the USER's perspective - what might they ask/say next!
- Make prompts SPECIFIC to the conversation context
- Not all categories need to be used - skip if not relevant
- Keep prompts natural and conversational
- 1-3 prompts per category is fine

Output ONLY the JSON, no other text.`
}

/**
 * Generate follow-up suggestions using dedicated model
 * Tries primary model first, then fallback if it fails
 */
export async function generateFollowUpsParallel(
  messages: Message[],
  apiKey: string,
  model?: string,
  language: string = "en"
): Promise<CategorizedFollowUp[]> {
  const modelsToTry = model
    ? [model]
    : [DEFAULT_FOLLOWUP_MODEL, FALLBACK_FOLLOWUP_MODEL]

  let lastError: Error | null = null

  for (const followUpModel of modelsToTry) {
    try {
      const result = await tryGenerateFollowUps(messages, apiKey, followUpModel, language)
      return result
    } catch (error) {
      console.warn(`[FollowUpGenerator] Model ${followUpModel} failed, trying next...`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError || new Error('All models failed')
}

/**
 * Try generating follow-ups with a specific model
 */
async function tryGenerateFollowUps(
  messages: Message[],
  apiKey: string,
  followUpModel: string,
  language: string
): Promise<CategorizedFollowUp[]> {
  // Take last 4 messages for context (keeps token count low)
  // IMPORTANT: Extract only text content, not tool calls/results
  const recentMessages = messages.slice(-4).map(msg => {
    let content = ''

    if (typeof msg.content === 'string') {
      content = msg.content
    } else if (Array.isArray(msg.content)) {
      // Extract only text parts from complex message content
      content = msg.content
        .filter((part: any) => part.type === 'text' && part.text)
        .map((part: any) => part.text)
        .join('\n')
    }

    return { role: msg.role, content }
  }).filter(msg => msg.content.trim()) // Remove empty messages

  console.log(`[FollowUpGenerator] Generating follow-ups using model: ${followUpModel}, language: ${language}`)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://chameleon-ai.chat',
      'X-Title': 'Chameleon AI Chat - Follow-Up Generation'
    },
    body: JSON.stringify({
      model: followUpModel,
      messages: [
        {
          role: 'system',
          content: buildFollowUpPrompt(language)
        },
        ...recentMessages
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[FollowUpGenerator] API error:`, response.status, errorText)
    throw new Error(`Follow-up generation failed: ${response.status}`)
  }

  const data = await response.json()

  // Debug: Log response info
  console.log(`[FollowUpGenerator] Response from ${followUpModel}:`, {
    model: data.model,
    usage: data.usage,
    finish_reason: data.choices?.[0]?.finish_reason
  })

  // Handle different response structures (OpenAI vs Google)
  const choice = data.choices?.[0]
  let generatedContent = choice?.message?.content

  // Gemini sometimes puts content in a different place
  if (!generatedContent && choice?.message?.parts) {
    // Gemini multimodal format
    generatedContent = choice.message.parts.map((p: any) => p.text || '').join('')
  }

  // Handle refusal or empty responses
  if (!generatedContent && choice?.message?.refusal) {
    console.error(`[FollowUpGenerator] Model refused:`, choice.message.refusal)
    throw new Error(`Model refused: ${choice.message.refusal}`)
  }

  if (!generatedContent) {
    console.error(`[FollowUpGenerator] No content in response. Choice:`, JSON.stringify(choice, null, 2))
    throw new Error('No content generated')
  }

  console.log(`[FollowUpGenerator] Raw generated content:`, generatedContent)

  // Parse the generated follow-ups
  const parsed = parseFollowUpsFromJSON(generatedContent)

  console.log(`[FollowUpGenerator] Successfully generated ${parsed.length} follow-ups`)

  return parsed
}

/**
 * Parse follow-ups from JSON response
 * Handles various formats the model might output
 */
function parseFollowUpsFromJSON(content: string): CategorizedFollowUp[] {
  try {
    // Try to extract JSON from the content
    // Handle cases where model wraps JSON in markdown code blocks
    let jsonStr = content.trim()

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    jsonStr = jsonStr.trim()

    // Parse JSON
    const parsed = JSON.parse(jsonStr)

    // Validate we have at least one category
    if (!parsed.quick && !parsed.deep && !parsed.related) {
      console.warn('[FollowUpGenerator] No valid categories in JSON, using fallback parser')
      // Try the standard parser as fallback
      const fallback = parseFollowUps(`[FOLLOWUP]${jsonStr}[/FOLLOWUP]`)
      return fallback.categorizedFollowUps
    }

    // Convert to CategorizedFollowUp array
    const followUps: CategorizedFollowUp[] = []

    // Category metadata
    const categoryMeta = {
      quick: { icon: '⚡', label: 'Quick' },
      deep: { icon: '🧠', label: 'Deep Dive' },
      related: { icon: '🔗', label: 'Related' }
    }

    // Process each category (allow up to 3 per category, categories are optional)
    for (const category of ['quick', 'deep', 'related'] as const) {
      const questions = parsed[category]
      if (Array.isArray(questions)) {
        questions.slice(0, 3).forEach(text => {
          if (text && typeof text === 'string' && text.trim().length > 0) {
            followUps.push({
              category,
              text: text.trim(),
              icon: categoryMeta[category].icon,
              label: categoryMeta[category].label
            })
          }
        })
      }
    }

    // Ensure we have at least 1 follow-up
    if (followUps.length === 0) {
      throw new Error('No follow-ups generated')
    }

    return followUps

  } catch (error) {
    console.error('[FollowUpGenerator] Parse error:', error)
    console.error('[FollowUpGenerator] Content was:', content)
    throw error
  }
}

/**
 * Generate fallback follow-ups when dedicated model fails
 * These are context-aware template-based suggestions
 */
export function generateFallbackFollowUps(
  messages: Message[],
  conversationDepth: number,
  language: string = "en"
): CategorizedFollowUp[] {
  const lastMessage = messages[messages.length - 1]
  const content = typeof lastMessage?.content === 'string' ? lastMessage.content : ''

  // Detect message type
  const hasCode = /```|function|class|import|const|let|var/.test(content)
  const hasError = /error|exception|failed|undefined|null|crash/i.test(content)
  const isExplanation = content.length > 200
  const isEarly = conversationDepth < 3

  // German translations
  const de = {
    code: [
      { category: 'quick' as const, text: 'Kannst du den Code erklären?', icon: '⚡', label: 'Schnell' },
      { category: 'quick' as const, text: 'Zeig mir ein Beispiel', icon: '⚡', label: 'Schnell' },
      { category: 'deep' as const, text: 'Wie kann ich das optimieren?', icon: '🧠', label: 'Vertiefung' },
      { category: 'deep' as const, text: 'Was sind mögliche Grenzfälle?', icon: '🧠', label: 'Vertiefung' },
      { category: 'related' as const, text: 'Zeig alternative Ansätze', icon: '🔗', label: 'Verwandt' },
      { category: 'related' as const, text: 'Was sind Best Practices?', icon: '🔗', label: 'Verwandt' }
    ],
    error: [
      { category: 'quick' as const, text: 'Wie behebe ich den Fehler?', icon: '⚡', label: 'Schnell' },
      { category: 'quick' as const, text: 'Was bedeutet dieser Fehler?', icon: '⚡', label: 'Schnell' },
      { category: 'deep' as const, text: 'Warum ist der Fehler aufgetreten?', icon: '🧠', label: 'Vertiefung' },
      { category: 'deep' as const, text: 'Wie verhindere ich das in Zukunft?', icon: '🧠', label: 'Vertiefung' },
      { category: 'related' as const, text: 'Gibt es ähnliche Fehler?', icon: '🔗', label: 'Verwandt' },
      { category: 'related' as const, text: 'Was sind Debugging-Strategien?', icon: '🔗', label: 'Verwandt' }
    ],
    early: [
      { category: 'quick' as const, text: 'Kannst du ein Beispiel geben?', icon: '⚡', label: 'Schnell' },
      { category: 'quick' as const, text: 'Erkläre das einfacher?', icon: '⚡', label: 'Schnell' },
      { category: 'deep' as const, text: 'Wie funktioniert das im Detail?', icon: '🧠', label: 'Vertiefung' },
      { category: 'deep' as const, text: 'Was sollte ich darüber wissen?', icon: '🧠', label: 'Vertiefung' },
      { category: 'related' as const, text: 'Was sind praktische Anwendungen?', icon: '🔗', label: 'Verwandt' },
      { category: 'related' as const, text: 'Wo kann ich mehr erfahren?', icon: '🔗', label: 'Verwandt' }
    ],
    default: [
      { category: 'quick' as const, text: 'Kannst du das zusammenfassen?', icon: '⚡', label: 'Schnell' },
      { category: 'quick' as const, text: 'Gib mir ein konkretes Beispiel', icon: '⚡', label: 'Schnell' },
      { category: 'deep' as const, text: 'Erkläre die Grundprinzipien', icon: '🧠', label: 'Vertiefung' },
      { category: 'deep' as const, text: 'Was sind fortgeschrittene Anwendungen?', icon: '🧠', label: 'Vertiefung' },
      { category: 'related' as const, text: 'Wie vergleicht sich das mit Alternativen?', icon: '🔗', label: 'Verwandt' },
      { category: 'related' as const, text: 'Was sollte ich als nächstes erkunden?', icon: '🔗', label: 'Verwandt' }
    ]
  }

  // English templates
  const en = {
    code: [
      { category: 'quick' as const, text: 'Can you explain this code?', icon: '⚡', label: 'Quick' },
      { category: 'quick' as const, text: 'Show me a usage example', icon: '⚡', label: 'Quick' },
      { category: 'deep' as const, text: 'How can I optimize this?', icon: '🧠', label: 'Deep Dive' },
      { category: 'deep' as const, text: 'What are potential edge cases?', icon: '🧠', label: 'Deep Dive' },
      { category: 'related' as const, text: 'Show alternative approaches', icon: '🔗', label: 'Related' },
      { category: 'related' as const, text: 'What are best practices for this?', icon: '🔗', label: 'Related' }
    ],
    error: [
      { category: 'quick' as const, text: 'How do I fix this error?', icon: '⚡', label: 'Quick' },
      { category: 'quick' as const, text: 'What does this error mean?', icon: '⚡', label: 'Quick' },
      { category: 'deep' as const, text: 'Why did this error occur?', icon: '🧠', label: 'Deep Dive' },
      { category: 'deep' as const, text: 'How can I prevent this in future?', icon: '🧠', label: 'Deep Dive' },
      { category: 'related' as const, text: 'Are there similar errors to watch for?', icon: '🔗', label: 'Related' },
      { category: 'related' as const, text: 'What are debugging strategies?', icon: '🔗', label: 'Related' }
    ],
    early: [
      { category: 'quick' as const, text: 'Can you give me an example?', icon: '⚡', label: 'Quick' },
      { category: 'quick' as const, text: 'Explain this more simply?', icon: '⚡', label: 'Quick' },
      { category: 'deep' as const, text: 'How does this work in detail?', icon: '🧠', label: 'Deep Dive' },
      { category: 'deep' as const, text: 'What should I know about this?', icon: '🧠', label: 'Deep Dive' },
      { category: 'related' as const, text: 'What are practical use cases?', icon: '🔗', label: 'Related' },
      { category: 'related' as const, text: 'Where can I learn more?', icon: '🔗', label: 'Related' }
    ],
    default: [
      { category: 'quick' as const, text: 'Can you summarize this?', icon: '⚡', label: 'Quick' },
      { category: 'quick' as const, text: 'Give me a concrete example', icon: '⚡', label: 'Quick' },
      { category: 'deep' as const, text: 'Explain the underlying principles', icon: '🧠', label: 'Deep Dive' },
      { category: 'deep' as const, text: 'What are advanced applications?', icon: '🧠', label: 'Deep Dive' },
      { category: 'related' as const, text: 'How does this compare to alternatives?', icon: '🔗', label: 'Related' },
      { category: 'related' as const, text: 'What should I explore next?', icon: '🔗', label: 'Related' }
    ]
  }

  const templates = language === "de" ? de : en

  // Select appropriate template
  if (hasCode) return templates.code
  if (hasError) return templates.error
  if (isEarly) return templates.early
  return templates.default
}
