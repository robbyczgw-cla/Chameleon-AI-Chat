/**
 * Vision/Image Analysis utilities
 * Matches main app's lib/vision-models.ts and lib/multimodal-utils.ts
 */

import { chatWithImage } from "./api"

export interface ImageAnalysisResult {
  description: string
  error?: string
}

/**
 * Vision-capable models (same as main app's lib/vision-models.ts)
 */
export const VISION_MODELS = [
  // OpenAI
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },

  // Anthropic
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", provider: "Anthropic" },

  // Google
  { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", provider: "Google" },
  { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "google/gemini-flash-1.5", name: "Gemini 1.5 Flash", provider: "Google" },

  // xAI
  { id: "x-ai/grok-2-vision-1212", name: "Grok 2 Vision", provider: "xAI" },

  // Meta
  { id: "meta-llama/llama-3.2-90b-vision-instruct", name: "Llama 3.2 90B Vision", provider: "Meta" },
  { id: "meta-llama/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11B Vision", provider: "Meta" },

  // Qwen
  { id: "qwen/qwen-2-vl-72b-instruct", name: "Qwen 2 VL 72B", provider: "Qwen" },
]

/**
 * Check if a model supports vision (matches main app's logic)
 */
export function isVisionModel(modelId: string): boolean {
  // First check our known list
  if (VISION_MODELS.some((m) => m.id === modelId)) {
    return true
  }

  // Check common vision model patterns (same as main app)
  const visionPatterns = [
    "gpt-4o",
    "gpt-4-vision",
    "gpt-4-turbo",
    "gpt-5",
    "claude-3",
    "claude-4",
    "gemini",
    "grok-2-vision",
    "grok-3",
    "grok-4",
    "llama-3.2-vision",
    "llama-3.2-11b-vision",
    "llama-3.2-90b-vision",
    "qwen-vl",
    "qwen-2-vl",
    "pixtral",
  ]

  const lowerModelId = modelId.toLowerCase()
  return visionPatterns.some((p) => lowerModelId.includes(p))
}

/**
 * Get recommended vision model if current model doesn't support vision
 */
export function getRecommendedVisionModel(currentModel: string): string {
  if (isVisionModel(currentModel)) {
    return currentModel
  }
  // Default to Claude 3.5 Sonnet (good balance of quality and cost)
  return "anthropic/claude-3.5-sonnet"
}

/**
 * Analyze an image using a vision-capable model
 * Uses the chatWithImage function from api.ts
 */
export async function analyzeImage(
  imageBase64: string,
  apiKey: string,
  prompt: string = "Describe what you see in this image. Identify the main content, any text, images, and the overall context. Be concise but informative.",
  model: string = "anthropic/claude-3.5-sonnet"
): Promise<string> {
  // Ensure we use a vision-capable model
  const visionModel = isVisionModel(model) ? model : getRecommendedVisionModel(model)

  // Ensure image has proper data URL format
  const imageDataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`

  return chatWithImage(apiKey, visionModel, prompt, imageDataUrl)
}

/**
 * Capture screenshot of the current tab
 * Must be called from background script
 */
export async function captureVisibleTab(): Promise<string> {
  const isFirefox = typeof browser !== "undefined"

  return new Promise((resolve, reject) => {
    if (isFirefox) {
      browser.tabs
        .captureVisibleTab(undefined, { format: "png" })
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
 * Compress image to reduce size (matches main app's lib/image-utils.ts)
 */
export async function compressImage(
  dataUrl: string,
  maxSizeKB: number = 800
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      // Calculate new dimensions (max 2048x2048)
      let { width, height } = img
      const maxDim = 2048
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // Try different quality levels
      for (let quality = 0.9; quality >= 0.1; quality -= 0.1) {
        const compressed = canvas.toDataURL("image/jpeg", quality)
        const sizeKB = (compressed.length * 3) / 4 / 1024
        if (sizeKB <= maxSizeKB) {
          resolve(compressed)
          return
        }
      }

      // Return lowest quality if still too large
      resolve(canvas.toDataURL("image/jpeg", 0.1))
    }
    img.src = dataUrl
  })
}

/**
 * Get image size in KB
 */
export function getImageSizeKB(dataUrl: string): number {
  // Base64 string length * 3/4 gives approximate byte size
  const base64Part = dataUrl.split(",")[1] || dataUrl
  return (base64Part.length * 3) / 4 / 1024
}

/**
 * Check if image needs compression
 */
export function needsCompression(dataUrl: string, maxSizeKB: number = 800): boolean {
  return getImageSizeKB(dataUrl) > maxSizeKB
}
