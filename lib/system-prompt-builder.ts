/**
 * System Prompt Builder
 *
 * Generates appropriate system prompts based on settings,
 * especially for the dedicated follow-up model feature.
 */

/**
 * Base system prompt without follow-up instructions
 */
const BASE_SYSTEM_PROMPT = "You are a friendly, helpful assistant. Provide clear, precise, and helpful answers."

/**
 * Follow-up instructions to append when NOT using dedicated model
 */
const FOLLOWUP_INSTRUCTIONS = ` At the end of each response, add exactly 6 clickable follow-up prompts in 3 categories (2 each):

[FOLLOWUP]
{
  "quick": ["Short prompt 1", "Short prompt 2"],
  "deep": ["Detailed prompt 1", "Detailed prompt 2"],
  "related": ["Related topic 1", "Related topic 2"]
}
[/FOLLOWUP]

IMPORTANT: Always provide exactly 2 prompts per category (6 total). Prompts are from the USER's perspective - what might they ask next!`

/**
 * Build system prompt based on settings
 *
 * @param useDedicatedFollowUpModel - Whether to use dedicated follow-up model
 * @param customPrompt - Optional custom system prompt (takes precedence)
 * @returns Appropriate system prompt
 */
export function buildSystemPrompt(
  useDedicatedFollowUpModel: boolean = true,
  customPrompt?: string
): string {
  // If user has custom prompt, check if it already has follow-up instructions
  if (customPrompt) {
    const hasFollowUpInstructions = customPrompt.includes('[FOLLOWUP]')

    // If using dedicated model and prompt has follow-up instructions, remove them
    if (useDedicatedFollowUpModel && hasFollowUpInstructions) {
      // Remove the follow-up instructions section
      return customPrompt
        .replace(/At the end of each response[\s\S]*?\[\/FOLLOWUP\]/, '')
        .replace(/IMPORTANT:[\s\S]*?what might they ask next!/, '')
        .trim()
    }

    // If NOT using dedicated model and prompt doesn't have instructions, add them
    if (!useDedicatedFollowUpModel && !hasFollowUpInstructions) {
      return customPrompt + FOLLOWUP_INSTRUCTIONS
    }

    // Otherwise return as-is
    return customPrompt
  }

  // Default prompt based on setting
  if (useDedicatedFollowUpModel) {
    return BASE_SYSTEM_PROMPT
  }

  return BASE_SYSTEM_PROMPT + FOLLOWUP_INSTRUCTIONS
}

/**
 * Build persona system prompt
 *
 * @param personality - Persona personality description
 * @param useDedicatedFollowUpModel - Whether to use dedicated follow-up model
 * @returns Appropriate persona prompt
 */
export function buildPersonaSystemPrompt(
  personality: string,
  useDedicatedFollowUpModel: boolean = true
): string {
  if (useDedicatedFollowUpModel) {
    // Just the personality, no follow-up instructions
    return personality
  }

  // Add follow-up instructions if not using dedicated model
  return personality + FOLLOWUP_INSTRUCTIONS
}

/**
 * Check if a system prompt has follow-up instructions
 */
export function hasFollowUpInstructions(prompt: string): boolean {
  return (
    prompt.includes('[FOLLOWUP]') ||
    prompt.includes('follow-up prompts') ||
    prompt.includes('clickable next possible user prompts') ||
    prompt.includes('Write 1-3 engaging questions')
  )
}

/**
 * Remove follow-up instructions from a prompt
 * Handles multiple formats and preserves custom parts
 * PRESERVES language instructions (WICHTIG, IMPORTANT, IMPORTANTE for responses)
 */
export function removeFollowUpInstructions(prompt: string): string {
  let cleaned = prompt

  // Remove the [FOLLOWUP] JSON block
  cleaned = cleaned.replace(/\[FOLLOWUP\][\s\S]*?\[\/FOLLOWUP\]/g, '')

  // Remove "At the end of each response..." patterns (various formats)
  cleaned = cleaned.replace(/At the end of each response[,:]?[\s\S]*?(?=\n\n|$)/gi, '')

  // Remove "Write 1-3 engaging questions..." patterns
  cleaned = cleaned.replace(/Write \d+-?\d* engaging questions[\s\S]*?(?=\n\n|$)/gi, '')

  // Remove "add exactly 6 clickable follow-up prompts..." patterns
  cleaned = cleaned.replace(/add exactly \d+ clickable follow-up prompts[\s\S]*?(?=\n\n|$)/gi, '')

  // Remove "IMPORTANT: Always provide..." patterns related to follow-ups ONLY
  // DO NOT remove language instructions like "IMPORTANT: Always respond in English"
  cleaned = cleaned.replace(/IMPORTANT:.*?(?:prompts per category|what might they ask next|from the USER's perspective|clickable follow-up).*?(?:\n|$)/gi, '')

  // Remove "Prompts are from the USER's perspective..." patterns
  cleaned = cleaned.replace(/(?:The )?prompts are from the USER'?s? perspective.*?(?:\n|$)/gi, '')

  // Remove "Not all categories need to be used" patterns
  cleaned = cleaned.replace(/Not all categories need to be used\.?(?:\n|$)/gi, '')

  // Remove extra blank lines (more than 2 consecutive newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  // Trim whitespace
  cleaned = cleaned.trim()

  return cleaned
}

/**
 * Get the default system prompt for a given configuration
 */
export function getDefaultSystemPrompt(useDedicatedFollowUpModel: boolean = true): string {
  return buildSystemPrompt(useDedicatedFollowUpModel)
}
