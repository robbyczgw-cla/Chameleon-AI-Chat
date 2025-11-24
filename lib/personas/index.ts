/**
 * Personas Index - Combines all persona categories
 *
 * This file re-exports everything to maintain backward compatibility.
 * Imports like `from "@/lib/personas"` will continue to work unchanged.
 */

// Re-export types
export type {
  Persona,
  PersonaMemorySettings,
  PersonaVoiceSettings,
  PersonaContextSettings,
  PersonaCategory,
} from "./types"

// Import all persona categories
import { FRIENDLY_PERSONAS } from "./friendly"
import { PROFESSIONAL_PERSONAS } from "./professional"
import { CREATIVE_PERSONAS } from "./creative"
import { TECHNICAL_PERSONAS } from "./technical"
import { PHILOSOPHICAL_PERSONAS } from "./philosophical"
import { ENTERTAINMENT_PERSONAS } from "./entertainment"
import { SPECIALIZED_PERSONAS } from "./specialized"

import type { Persona } from "./types"

// Export individual categories for selective imports
export {
  FRIENDLY_PERSONAS,
  PROFESSIONAL_PERSONAS,
  CREATIVE_PERSONAS,
  TECHNICAL_PERSONAS,
  PHILOSOPHICAL_PERSONAS,
  ENTERTAINMENT_PERSONAS,
  SPECIALIZED_PERSONAS,
}

// Create a lookup map for efficient persona retrieval
const ALL_PERSONAS_MAP = new Map<string, Persona>()

// Add all personas to the map
;[
  ...FRIENDLY_PERSONAS,
  ...PROFESSIONAL_PERSONAS,
  ...CREATIVE_PERSONAS,
  ...TECHNICAL_PERSONAS,
  ...PHILOSOPHICAL_PERSONAS,
  ...ENTERTAINMENT_PERSONAS,
  ...SPECIALIZED_PERSONAS,
].forEach((p) => {
  if (!ALL_PERSONAS_MAP.has(p.id)) {
    ALL_PERSONAS_MAP.set(p.id, p)
  }
})

// Helper to get persona by ID from map
const getFromMap = (id: string): Persona | undefined => ALL_PERSONAS_MAP.get(id)

/**
 * Combined array of all personas - maintains EXACT original order for backward compatibility
 * This is the main export that existing code uses
 */
export const PERSONAS: Persona[] = [
  // Original order from the old personas.ts file
  getFromMap("friendly"),    // Cami
  getFromMap("expert"),      // Professor Stein
  getFromMap("creative"),    // Luna
  getFromMap("coder"),       // Dev
  getFromMap("concise"),     // Flash
  getFromMap("teacher"),     // Herr Muller
  getFromMap("nova"),        // Nova
  getFromMap("mythos"),      // Mythos
  getFromMap("cogito"),      // Cogito
  getFromMap("nihilo"),      // Nihilo
  getFromMap("vibe"),        // Vibe
  getFromMap("saga"),        // Sara Norton
  getFromMap("leslie"),      // Lisa Knight
  getFromMap("coach"),       // Coach Thompson
  getFromMap("saul"),        // Sol Goldman
  getFromMap("johncarter"),  // Dr. Jon Carson
  getFromMap("markgreene"),  // Dr. Max Gray
  getFromMap("rust"),        // Rustin Cole
  getFromMap("mayuri"),      // Mari Shizuka
  getFromMap("elliot"),      // Ellis Anderson
  getFromMap("louie"),       // Louis K.
  getFromMap("pixel"),       // Pixel
  getFromMap("chef"),        // Chef Marco
  getFromMap("zen"),         // Zen
  getFromMap("startup"),     // Startup Sam
  getFromMap("aria"),        // Aria
].filter((p): p is Persona => p !== undefined)

/**
 * Get persona by ID
 * @param id - Persona ID
 * @returns Persona or undefined
 */
export function getPersonaById(id: string): Persona | undefined {
  return ALL_PERSONAS_MAP.get(id)
}

/**
 * Get the default persona (Cami)
 * @returns Default persona
 */
export function getDefaultPersona(): Persona {
  return PERSONAS[0] // Cami (friendly chameleon)
}

/**
 * Get personas by category
 * Useful for filtering UI
 */
export function getPersonasByCategory(category: string): Persona[] {
  switch (category) {
    case "friendly":
      return FRIENDLY_PERSONAS
    case "professional":
      return PROFESSIONAL_PERSONAS
    case "creative":
      return CREATIVE_PERSONAS
    case "technical":
      return TECHNICAL_PERSONAS
    case "philosophical":
      return PHILOSOPHICAL_PERSONAS
    case "entertainment":
      return ENTERTAINMENT_PERSONAS
    case "specialized":
      return SPECIALIZED_PERSONAS
    default:
      return PERSONAS
  }
}

/**
 * Lazy load persona personality (for future optimization)
 * Currently returns immediately, but can be modified to fetch from server
 */
export async function loadPersonaPersonality(id: string): Promise<string | undefined> {
  const persona = getPersonaById(id)
  return persona?.personality
}
