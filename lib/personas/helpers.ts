/**
 * Persona Helper Functions
 *
 * Utility functions for filtering and accessing personas.
 */

import type { Persona, PersonaCategory } from "./types"
import { PERSONAS } from "./definitions"

/**
 * Find a persona by its ID.
 */
export function getPersonaById(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id)
}

/**
 * Get the default persona (Cami).
 */
export function getDefaultPersona(): Persona {
  return PERSONAS[0] // Cami (friendly chameleon)
}

/**
 * Get personas filtered by category.
 * Excludes hidden personas.
 */
export function getPersonasByCategory(category: PersonaCategory): Persona[] {
  return PERSONAS.filter((p) => p.category === category && !p.hidden)
}

/**
 * Get all visible personas (excludes hidden ones).
 */
export function getVisiblePersonas(): Persona[] {
  return PERSONAS.filter((p) => !p.hidden)
}

/**
 * Get core personas for Simple Mode.
 */
export function getCorePersonas(): Persona[] {
  return PERSONAS.filter((p) => p.category === "core" && !p.hidden)
}

/**
 * Get all categories with their personas.
 * Excludes hidden personas.
 */
export function getPersonasByCategories(): Record<PersonaCategory, Persona[]> {
  const categories: Record<PersonaCategory, Persona[]> = {
    core: [],
    creative: [],
    professional: [],
    philosophy: [],
    lifestyle: [],
    learning: [],
    curator: [],
    special: [],
  }

  PERSONAS.forEach((persona) => {
    if (persona.category && !persona.hidden) {
      categories[persona.category].push(persona)
    }
  })

  return categories
}
