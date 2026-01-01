/**
 * Environment Variable Validation for Chameleon AI Chat
 *
 * Validates required and optional environment variables at build/runtime
 * to catch configuration issues early.
 */

import { logger } from './logger'

type EnvVarType = 'string' | 'boolean' | 'number' | 'url'

interface EnvVarConfig {
  name: string
  type: EnvVarType
  required: boolean
  description: string
  defaultValue?: string
  /** Only available on client (NEXT_PUBLIC_*) */
  clientSide?: boolean
}

/**
 * All environment variables used in the application
 */
const ENV_VARS: EnvVarConfig[] = [
  // Supabase Configuration
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    type: 'url',
    required: true,
    description: 'Supabase project URL',
    clientSide: true,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    type: 'string',
    required: true,
    description: 'Supabase anonymous/public key',
    clientSide: true,
  },

  // OpenRouter API
  {
    name: 'OPENROUTER_API_KEY',
    type: 'string',
    required: false,
    description: 'Server-side OpenRouter API key (optional, users provide their own)',
  },

  // Search Providers (optional)
  {
    name: 'TAVILY_API_KEY',
    type: 'string',
    required: false,
    description: 'Tavily search API key',
  },
  {
    name: 'SERPER_API_KEY',
    type: 'string',
    required: false,
    description: 'Serper (Google Search) API key',
  },
  {
    name: 'EXA_API_KEY',
    type: 'string',
    required: false,
    description: 'Exa semantic search API key',
  },

  // OpenAI (for Whisper/TTS/DALL-E)
  {
    name: 'OPENAI_API_KEY',
    type: 'string',
    required: false,
    description: 'OpenAI API key for voice and image features',
  },

  // Weather API
  {
    name: 'WEATHER_API_KEY',
    type: 'string',
    required: false,
    description: 'WeatherAPI.com API key',
  },

  // Feature Flags
  {
    name: 'NEXT_PUBLIC_ENABLE_LOGGING',
    type: 'boolean',
    required: false,
    description: 'Enable debug logging in production',
    defaultValue: 'false',
    clientSide: true,
  },

  // Shopify (Enterprise mode)
  {
    name: 'SHOPIFY_ADMIN_API_TOKEN',
    type: 'string',
    required: false,
    description: 'Shopify admin API token for enterprise features',
  },
  {
    name: 'SHOPIFY_SHOP_URL',
    type: 'url',
    required: false,
    description: 'Shopify shop URL',
  },

  // Vercel-specific
  {
    name: 'VERCEL_ENV',
    type: 'string',
    required: false,
    description: 'Vercel environment (development/preview/production)',
  },
]

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  summary: {
    required: { found: number; missing: number }
    optional: { found: number; missing: number }
  }
}

/**
 * Validate a URL string
 */
function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * Validate an environment variable value based on its type
 */
function validateValue(value: string | undefined, config: EnvVarConfig): string | null {
  if (!value) {
    return config.required ? `Missing required: ${config.name}` : null
  }

  switch (config.type) {
    case 'url':
      if (!isValidUrl(value)) {
        return `Invalid URL format for ${config.name}: ${value}`
      }
      break
    case 'boolean':
      if (value !== 'true' && value !== 'false') {
        return `Invalid boolean for ${config.name}: expected 'true' or 'false', got '${value}'`
      }
      break
    case 'number':
      if (isNaN(Number(value))) {
        return `Invalid number for ${config.name}: ${value}`
      }
      break
    // 'string' type doesn't need validation beyond existence
  }

  return null
}

/**
 * Get environment variable value (works on both server and client)
 */
function getEnvVar(name: string): string | undefined {
  // Server-side: use process.env directly
  if (typeof window === 'undefined') {
    return process.env[name]
  }

  // Client-side: only NEXT_PUBLIC_* vars are available
  if (name.startsWith('NEXT_PUBLIC_')) {
    return process.env[name]
  }

  return undefined
}

/**
 * Validate all environment variables
 */
export function validateEnv(options: { throwOnError?: boolean } = {}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const summary = {
    required: { found: 0, missing: 0 },
    optional: { found: 0, missing: 0 },
  }

  const isClient = typeof window !== 'undefined'

  for (const config of ENV_VARS) {
    // Skip server-only vars on client
    if (isClient && !config.clientSide) {
      continue
    }

    const value = getEnvVar(config.name)
    const error = validateValue(value, config)

    if (error) {
      if (config.required) {
        errors.push(error)
        summary.required.missing++
      } else {
        warnings.push(`Optional missing: ${config.name} - ${config.description}`)
        summary.optional.missing++
      }
    } else if (value) {
      if (config.required) {
        summary.required.found++
      } else {
        summary.optional.found++
      }
    }
  }

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary,
  }

  // Log results
  if (errors.length > 0) {
    logger.error('Environment validation failed:', errors)
    if (options.throwOnError) {
      throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
    }
  } else if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    logger.warn('Environment validation warnings:', warnings)
  }

  return result
}

/**
 * Get a typed environment variable with validation
 */
export function getEnv<T extends string | boolean | number>(
  name: string,
  type: EnvVarType = 'string'
): T | undefined {
  const value = getEnvVar(name)

  if (!value) return undefined

  switch (type) {
    case 'boolean':
      return (value === 'true') as T
    case 'number':
      return Number(value) as T
    default:
      return value as T
  }
}

/**
 * Get a required environment variable (throws if missing)
 */
export function getRequiredEnv(name: string): string {
  const value = getEnvVar(name)

  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }

  return value
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL
}

/**
 * Get the current environment name
 */
export function getEnvironment(): 'development' | 'preview' | 'production' {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV as 'development' | 'preview' | 'production'
  }
  return isDevelopment() ? 'development' : 'production'
}

/**
 * Export configuration summary (safe for logging, no secrets)
 */
export function getEnvSummary(): Record<string, boolean> {
  const summary: Record<string, boolean> = {}

  for (const config of ENV_VARS) {
    const value = getEnvVar(config.name)
    summary[config.name] = !!value
  }

  return summary
}
