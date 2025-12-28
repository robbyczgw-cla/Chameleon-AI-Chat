/**
 * Vision/Image Analysis utilities
 * Uses vision-capable models to analyze images
 */

export interface ImageAnalysisResult {
  description: string
  error?: string
}

/**
 * Analyze an image using a vision-capable model via OpenRouter
 */
export async function analyzeImage(
  imageBase64: string,
  apiKey: string,
  prompt: string = "What's in this image? Describe it in detail.",
  model: string = "openai/gpt-4o"
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://chameleonai.chat",
      "X-Title": "Chameleon AI Extension",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith("data:")
                  ? imageBase64
                  : `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Vision API error: ${error}`)
  }

  const result = await response.json()
  return result.choices[0]?.message?.content || "No analysis available"
}

/**
 * Capture screenshot of the current tab
 * Must be called from background script
 */
export async function captureVisibleTab(): Promise<string> {
  // This uses chrome.tabs.captureVisibleTab which must be called from background
  const isFirefox = typeof browser !== "undefined"
  const tabs = isFirefox ? browser.tabs : chrome.tabs

  return new Promise((resolve, reject) => {
    if (isFirefox) {
      browser.tabs.captureVisibleTab(undefined, { format: "png" })
        .then(resolve)
        .catch(reject)
    } else {
      chrome.tabs.captureVisibleTab(undefined, { format: "png" }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          resolve(dataUrl)
        }
      })
    }
  })
}

/**
 * Vision-capable models available
 */
export const VISION_MODELS = [
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic" },
  { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "google/gemini-flash-1.5", name: "Gemini 1.5 Flash", provider: "Google" },
]

/**
 * Check if a model supports vision
 */
export function isVisionModel(modelId: string): boolean {
  return VISION_MODELS.some((m) => m.id === modelId)
}
