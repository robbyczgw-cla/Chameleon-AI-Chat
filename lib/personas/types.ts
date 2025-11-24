/**
 * Persona type definitions
 * Shared types for all persona categories
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

export interface Persona {
  id: string
  name: string
  emoji: string
  description: string
  personality?: string // Persona-specific personality/behavior (added to base system prompt)
  prompt?: string // DEPRECATED: Full system prompt (for backward compatibility)
  color: string
  avatarUrl?: string // Generated profile picture

  // Advanced features (all optional)
  memorySettings?: PersonaMemorySettings
  voiceSettings?: PersonaVoiceSettings
  contextSettings?: PersonaContextSettings
}

export type PersonaCategory =
  | "friendly"      // Default friendly assistants
  | "professional"  // Expert/professional personas
  | "creative"      // Creative and artistic personas
  | "technical"     // Developer/technical personas
  | "entertainment" // Fun/entertainment personas
  | "philosophical" // Deep thinking personas
  | "specialized"   // Domain-specific experts
