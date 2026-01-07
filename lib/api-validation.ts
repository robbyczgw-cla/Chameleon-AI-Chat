/**
 * API Input Validation Utilities
 * Provides type-safe validation for API endpoints to prevent injection attacks
 * and ensure data integrity.
 */

export interface ValidationResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Validates a search query string
 * - Trims whitespace
 * - Enforces length limits
 * - Prevents potential injection patterns
 */
export function validateSearchQuery(query: unknown): ValidationResult<string> {
  if (typeof query !== "string") {
    return { success: false, error: "Query must be a string" }
  }

  const trimmed = query.trim()

  if (trimmed.length === 0) {
    return { success: false, error: "Query cannot be empty" }
  }

  if (trimmed.length > 500) {
    return { success: false, error: "Query exceeds maximum length of 500 characters" }
  }

  // Basic sanitization - remove null bytes and control characters
  const sanitized = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")

  return { success: true, data: sanitized }
}

/**
 * Validates an OpenRouter generation ID format
 * Expected format: gen-xxxxxxxxxxxxxxxxxxxxxxxx (alphanumeric with hyphens)
 */
export function validateGenerationId(id: unknown): ValidationResult<string> {
  if (typeof id !== "string") {
    return { success: false, error: "Generation ID must be a string" }
  }

  const trimmed = id.trim()

  if (trimmed.length === 0) {
    return { success: false, error: "Generation ID cannot be empty" }
  }

  // OpenRouter IDs are typically "gen-" prefix followed by alphanumeric chars
  // Allow reasonable length and format
  if (trimmed.length > 100) {
    return { success: false, error: "Generation ID exceeds maximum length" }
  }

  // Only allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { success: false, error: "Generation ID contains invalid characters" }
  }

  return { success: true, data: trimmed }
}

/**
 * Validates a UUID format (for chat IDs, share IDs, etc.)
 */
export function validateUUID(id: unknown, fieldName = "ID"): ValidationResult<string> {
  if (typeof id !== "string") {
    return { success: false, error: `${fieldName} must be a string` }
  }

  const trimmed = id.trim()

  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(trimmed)) {
    return { success: false, error: `Invalid ${fieldName} format` }
  }

  return { success: true, data: trimmed.toLowerCase() }
}

/**
 * Validates text content for TTS/processing
 */
export function validateTextContent(text: unknown, maxLength = 5000): ValidationResult<string> {
  if (typeof text !== "string") {
    return { success: false, error: "Text must be a string" }
  }

  const trimmed = text.trim()

  if (trimmed.length === 0) {
    return { success: false, error: "Text cannot be empty" }
  }

  if (trimmed.length > maxLength) {
    return { success: false, error: `Text exceeds maximum length of ${maxLength} characters` }
  }

  return { success: true, data: trimmed }
}

/**
 * Validates a URL string
 */
export function validateUrl(url: unknown): ValidationResult<string> {
  if (typeof url !== "string") {
    return { success: false, error: "URL must be a string" }
  }

  const trimmed = url.trim()

  if (trimmed.length === 0) {
    return { success: false, error: "URL cannot be empty" }
  }

  if (trimmed.length > 2048) {
    return { success: false, error: "URL exceeds maximum length of 2048 characters" }
  }

  try {
    const parsed = new URL(trimmed)
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { success: false, error: "URL must use http or https protocol" }
    }
    return { success: true, data: parsed.href }
  } catch {
    return { success: false, error: "Invalid URL format" }
  }
}

/**
 * Validates a positive integer within a range
 */
export function validatePositiveInt(
  value: unknown,
  min = 1,
  max = 100,
  fieldName = "Value"
): ValidationResult<number> {
  const num = typeof value === "string" ? parseInt(value, 10) : value

  if (typeof num !== "number" || isNaN(num)) {
    return { success: false, error: `${fieldName} must be a number` }
  }

  if (!Number.isInteger(num)) {
    return { success: false, error: `${fieldName} must be an integer` }
  }

  if (num < min || num > max) {
    return { success: false, error: `${fieldName} must be between ${min} and ${max}` }
  }

  return { success: true, data: num }
}

/**
 * Validates an array of domain strings
 */
export function validateDomainArray(domains: unknown): ValidationResult<string[]> {
  if (!Array.isArray(domains)) {
    return { success: false, error: "Domains must be an array" }
  }

  if (domains.length > 20) {
    return { success: false, error: "Maximum 20 domains allowed" }
  }

  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i
  const validated: string[] = []

  for (const domain of domains) {
    if (typeof domain !== "string") {
      return { success: false, error: "Each domain must be a string" }
    }

    const trimmed = domain.trim().toLowerCase()

    if (trimmed.length > 253) {
      return { success: false, error: `Domain "${trimmed}" exceeds maximum length` }
    }

    if (!domainRegex.test(trimmed)) {
      return { success: false, error: `Invalid domain format: "${trimmed}"` }
    }

    validated.push(trimmed)
  }

  return { success: true, data: validated }
}

/**
 * Validates enum values
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName = "Value"
): ValidationResult<T> {
  if (typeof value !== "string") {
    return { success: false, error: `${fieldName} must be a string` }
  }

  if (!allowedValues.includes(value as T)) {
    return {
      success: false,
      error: `${fieldName} must be one of: ${allowedValues.join(", ")}`
    }
  }

  return { success: true, data: value as T }
}
