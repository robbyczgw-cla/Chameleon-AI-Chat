/**
 * Dedicated Follow-Up Generator
 *
 * Generates follow-up suggestions using a dedicated fast/cheap model in parallel
 * with the main AI response. This improves speed and reduces costs.
 *
 * Default model: google/gemini-3-flash-preview (very fast, very cheap)
 */

import type { Message, CategorizedFollowUp } from "@/types"
import { parseFollowUps } from "./follow-up-parser"

const DEFAULT_FOLLOWUP_MODEL = "google/gemini-3-flash-preview"

/**
 * Build specialized system prompt for follow-up generation
 * Includes language instruction to match user's UI language
 */
function buildFollowUpPrompt(language: string = "en"): string {
  const languageInstruction = language === "de"
    ? "WICHTIG: Generiere alle Fragen auf Deutsch."
    : language === "es"
    ? "IMPORTANTE: Genera todas las preguntas en español."
    : "Generate all questions in English."

  return `You are a specialized AI that generates contextual follow-up questions.

Your task: Analyze the conversation and generate exactly 6 follow-up questions the user might ask next.

${languageInstruction}

Categories:
- **quick**: Fast, surface-level questions (examples, definitions, clarifications)
- **deep**: In-depth exploration questions (how it works, implications, analysis)
- **related**: Connected topics (comparisons, alternatives, similar concepts)

CRITICAL RULES:
1. Generate EXACTLY 2 questions per category (6 total)
2. Questions are from the USER's perspective (what they might ask)
3. Make questions specific to the conversation context
4. Keep questions concise (under 100 characters)
5. Phrase as questions (end with ?)
6. Make them actionable and interesting

OUTPUT FORMAT (use this exact JSON structure):
{
  "quick": ["Question 1?", "Question 2?"],
  "deep": ["Question 3?", "Question 4?"],
  "related": ["Question 5?", "Question 6?"]
}

DO NOT include any other text - ONLY output the JSON object.`
}

/**
 * Generate follow-up suggestions using dedicated model
 */
export async function generateFollowUpsParallel(
  messages: Message[],
  apiKey: string,
  model?: string,
  language: string = "en"
): Promise<CategorizedFollowUp[]> {
  try {
    const followUpModel = model || DEFAULT_FOLLOWUP_MODEL

    // Take last 4 messages for context (keeps token count low)
    const recentMessages = messages.slice(-4).map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }))

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
        temperature: 0.9, // More creative for diverse suggestions
        max_tokens: 400, // Enough for 6 suggestions
        top_p: 1.0,
        frequency_penalty: 0.3, // Encourage variety
        presence_penalty: 0.3
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[FollowUpGenerator] API error:`, response.status, errorText)
      throw new Error(`Follow-up generation failed: ${response.status}`)
    }

    const data = await response.json()

    // Debug: Log full response structure
    console.log(`[FollowUpGenerator] Full API response:`, JSON.stringify(data, null, 2))

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

  } catch (error) {
    console.error(`[FollowUpGenerator] Error generating follow-ups:`, error)
    throw error // Let caller handle fallback
  }
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

    // Validate structure
    if (!parsed.quick || !parsed.deep || !parsed.related) {
      console.warn('[FollowUpGenerator] Invalid JSON structure, using fallback parser')
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

    // Process each category
    for (const category of ['quick', 'deep', 'related'] as const) {
      const questions = parsed[category]
      if (Array.isArray(questions)) {
        questions.slice(0, 2).forEach(text => {
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

    // Ensure we have at least 3 follow-ups
    if (followUps.length < 3) {
      throw new Error(`Only generated ${followUps.length} follow-ups`)
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
