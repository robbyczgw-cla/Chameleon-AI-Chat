/**
 * Vision Models Configuration
 * Defines which models support vision/multimodal inputs
 */

export interface VisionModelConfig {
  id: string
  supportsVision: boolean
  maxImageSize?: number // in MB
  maxImages?: number
  supportedFormats?: string[]
}

/**
 * List of models that support vision/image understanding
 */
export const VISION_CAPABLE_MODELS = new Set([
  // OpenAI GPT-5
  "openai/gpt-5-2025-08-07",
  "openai/gpt-5-mini-2025-08-07",

  // Anthropic Claude
  "anthropic/claude-4.5-sonnet-20250929",
  "anthropic/claude-opus-4.1",
  "anthropic/claude-haiku-4.5",

  // Google Gemini
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",

  // xAI Grok
  "x-ai/grok-4",
  "x-ai/grok-4-fast",

  // Qwen
  "qwen/qwen3-max",
  "qwen/qwen3-235b-a22b-thinking-2507",
])

/**
 * Check if a model supports vision/multimodal inputs
 */
export function supportsVision(modelId: string): boolean {
  return VISION_CAPABLE_MODELS.has(modelId)
}

/**
 * Get vision configuration for a model
 */
export function getVisionConfig(modelId: string): VisionModelConfig {
  const defaultConfig: VisionModelConfig = {
    id: modelId,
    supportsVision: false,
    maxImageSize: 10,
    maxImages: 1,
    supportedFormats: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  }

  if (!supportsVision(modelId)) {
    return defaultConfig
  }

  // Model-specific configurations
  if (modelId.startsWith("google/gemini")) {
    return {
      ...defaultConfig,
      supportsVision: true,
      maxImages: 16, // Gemini supports multiple images
    }
  }

  if (modelId.startsWith("anthropic/claude")) {
    return {
      ...defaultConfig,
      supportsVision: true,
      maxImages: 20, // Claude supports many images
      maxImageSize: 5, // Claude recommends smaller images
    }
  }

  if (modelId.startsWith("openai/gpt")) {
    return {
      ...defaultConfig,
      supportsVision: true,
      maxImages: 10,
    }
  }

  if (modelId.startsWith("x-ai/grok")) {
    return {
      ...defaultConfig,
      supportsVision: true,
      maxImages: 5,
    }
  }

  return {
    ...defaultConfig,
    supportsVision: true,
  }
}

/**
 * Get a recommended vision model if current model doesn't support vision
 */
export function getRecommendedVisionModel(currentModel?: string): string {
  // If current model already supports vision, return it
  if (currentModel && supportsVision(currentModel)) {
    return currentModel
  }

  // Return best default vision model
  return "anthropic/claude-4.5-sonnet-20250929"
}

/**
 * Validate image attachment against model capabilities
 */
export function validateImageForModel(
  modelId: string,
  imageCount: number,
  imageSizeMB: number
): { valid: boolean; error?: string } {
  const config = getVisionConfig(modelId)

  if (!config.supportsVision) {
    return {
      valid: false,
      error: "This model does not support image inputs. Please select a vision-capable model.",
    }
  }

  if (config.maxImages && imageCount > config.maxImages) {
    return {
      valid: false,
      error: `This model supports a maximum of ${config.maxImages} images per message.`,
    }
  }

  if (config.maxImageSize && imageSizeMB > config.maxImageSize) {
    return {
      valid: false,
      error: `Image size exceeds maximum of ${config.maxImageSize}MB for this model.`,
    }
  }

  return { valid: true }
}
