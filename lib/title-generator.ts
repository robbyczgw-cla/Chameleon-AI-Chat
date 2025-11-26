/**
 * AI-powered chat title generation
 * Uses a small, cheap model to generate concise titles from user messages
 */

// Use a free/cheap model for title generation
const TITLE_MODEL = "google/gemma-2-9b-it:free"

interface TitleGenerationResult {
  title: string
  success: boolean
}

/**
 * Generate a concise chat title from the user's first message
 * Falls back to truncated message if API call fails
 */
export async function generateChatTitle(
  userMessage: string,
  apiKey: string
): Promise<TitleGenerationResult> {
  // Fallback title (truncated message)
  const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "")

  if (!apiKey) {
    console.log("[TitleGenerator] No API key, using fallback")
    return { title: fallbackTitle, success: false }
  }

  // Don't generate titles for very short messages
  if (userMessage.length < 10) {
    return { title: fallbackTitle, success: false }
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://chameleon-ai.app",
        "X-Title": "Chameleon AI Chat",
      },
      body: JSON.stringify({
        model: TITLE_MODEL,
        messages: [
          {
            role: "system",
            content: "Generate a very short, concise title (2-6 words) for a chat conversation based on the user's first message. Reply with ONLY the title, no quotes, no punctuation at the end, no explanation. Examples: 'Python List Sorting', 'Recipe for Pasta', 'Travel Tips Tokyo', 'Debug React Error'",
          },
          {
            role: "user",
            content: userMessage.slice(0, 500), // Limit input to save tokens
          },
        ],
        max_tokens: 20,
        temperature: 0.3, // Lower temperature for more consistent titles
      }),
    })

    if (!response.ok) {
      console.warn("[TitleGenerator] API error:", response.status)
      return { title: fallbackTitle, success: false }
    }

    const data = await response.json()
    const generatedTitle = data.choices?.[0]?.message?.content?.trim()

    if (!generatedTitle || generatedTitle.length < 2 || generatedTitle.length > 60) {
      console.warn("[TitleGenerator] Invalid title generated:", generatedTitle)
      return { title: fallbackTitle, success: false }
    }

    // Clean up the title (remove quotes, trailing punctuation)
    const cleanTitle = generatedTitle
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .replace(/[.!?]+$/, "") // Remove trailing punctuation
      .trim()

    console.log(`[TitleGenerator] Generated: "${cleanTitle}"`)
    return { title: cleanTitle, success: true }
  } catch (error) {
    console.error("[TitleGenerator] Error:", error)
    return { title: fallbackTitle, success: false }
  }
}
