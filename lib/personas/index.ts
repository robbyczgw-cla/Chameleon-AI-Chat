/**
 * Personas Module
 *
 * Unified exports for persona-related functionality.
 *
 * Usage:
 *   import { PERSONAS, getPersonaById, Persona } from "@/lib/personas"
 */

// ==================== Types ====================
export type {
  Persona,
  PersonaMemorySettings,
  PersonaVoiceSettings,
  PersonaContextSettings,
  PersonaCategory,
} from "./types"
export { filterPersonasByCategory, getVisiblePersonas as getVisiblePersonasFromTypes } from "./types"

// ==================== Persona Definitions ====================
export { PERSONAS } from "./definitions"
export {
  corePersonas,
  creativePersonas,
  professionalPersonas,
  philosophyPersonas,
  lifestylePersonas,
  learningPersonas,
  curatorPersonas,
} from "./definitions"

// ==================== Helper Functions ====================
export {
  getPersonaById,
  getDefaultPersona,
  getPersonasByCategory,
  getVisiblePersonas,
  getCorePersonas,
  getPersonasByCategories,
} from "./helpers"

// ==================== Example Prompts ====================
export {
  CATEGORY_LABELS,
  PERSONA_EXAMPLE_PROMPTS,
  getPersonaExamplePrompts,
} from "./example-prompts"

// ==================== Storage (Custom Personas) ====================
export { PersonasStorageService } from "../personas-storage"

// ==================== Memory Service ====================
export type {
  PersonaConversation,
  PersonaMemoryStore,
} from "../persona-memory-service"
export { personaMemoryService } from "../persona-memory-service"

// ==================== Context Awareness ====================
export type { ContextAwarenessData } from "../persona-context-awareness"
export { personaContextAwareness } from "../persona-context-awareness"

// ==================== Preferences Learning ====================
export { personaPreferencesService } from "../persona-preferences-service"
