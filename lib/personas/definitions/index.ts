/**
 * Persona Definitions Index
 *
 * Combines all category-specific persona arrays into a single PERSONAS export.
 */

import type { Persona } from "../types"
import { corePersonas } from "./core"
import { creativePersonas } from "./creative"
import { professionalPersonas } from "./professional"
import { philosophyPersonas } from "./philosophy"
import { lifestylePersonas } from "./lifestyle"
import { learningPersonas } from "./learning"
import { curatorPersonas } from "./curator"

/**
 * All personas combined in display order.
 *
 * Order: Core first (most used), then by category alphabetically.
 */
export const PERSONAS: Persona[] = [
  ...corePersonas,
  ...creativePersonas,
  ...professionalPersonas,
  ...philosophyPersonas,
  ...lifestylePersonas,
  ...learningPersonas,
  ...curatorPersonas,
]

// Re-export category arrays for direct access if needed
export {
  corePersonas,
  creativePersonas,
  professionalPersonas,
  philosophyPersonas,
  lifestylePersonas,
  learningPersonas,
  curatorPersonas,
}
