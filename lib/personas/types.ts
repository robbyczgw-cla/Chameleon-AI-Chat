/**
 * Persona Type Definitions
 *
 * Interfaces and types for the persona system.
 */

export interface PersonaMemorySettings {
  enabled: boolean
  maxConversations?: number // How many past conversations to remember (default: 10)
}

export interface PersonaVoiceSettings {
  enabled: boolean
  voiceName?: string // TTS voice to use
  rate?: number // Speaking rate (0.5 - 2.0)
  pitch?: number // Voice pitch (0.5 - 2.0)
}

export interface PersonaContextSettings {
  enabled: boolean
  useTimeBasedGreetings?: boolean // "Good morning!" vs "Working late?"
  detectMood?: boolean // Adapt to user's emotional tone
  trackTopics?: boolean // Remember what you've discussed before
}

// Persona categories for organization and filtering
export type PersonaCategory =
  | "core"        // Essential personas shown in Simple Mode (Cami, Dev, Flash, etc.)
  | "creative"    // Creative and roleplay personas (Luna, Mythos, Nova, Pixel)
  | "professional" // Work-focused personas (Startup Sam, Dr. Med, Wordsmith)
  | "philosophy"  // Deep thinking personas (Cogito, Nihilo, The Panel)
  | "lifestyle"   // Health, wellness, cooking (Chef, Zen, Wellbeing, Fit)
  | "learning"    // Education-focused (Scholar, Lingua, Teacher)
  | "curator"     // Recommendation personas (Vibe, Aria)

export interface Persona {
  id: string
  name: string
  emoji: string
  description: string
  personality?: string // Persona-specific personality/behavior (added to base system prompt)
  prompt?: string // DEPRECATED: Full system prompt (for backward compatibility)
  color: string
  avatarUrl?: string // Generated profile picture
  category?: PersonaCategory // Category for filtering and organization
  hidden?: boolean // If true, not shown in regular persona picker

  // Advanced features (all optional)
  memorySettings?: PersonaMemorySettings
  voiceSettings?: PersonaVoiceSettings
  contextSettings?: PersonaContextSettings
}

/**
 * Helper function to get personas by category
 */
export function filterPersonasByCategory(personas: Persona[], category: PersonaCategory): Persona[] {
  return personas.filter(p => p.category === category)
}

/**
 * Helper function to get visible personas (not hidden)
 */
export function getVisiblePersonas(personas: Persona[]): Persona[] {
  return personas.filter(p => !p.hidden)
}
