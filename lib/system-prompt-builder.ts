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
        .replace(/At the end of each response.*?\[\/FOLLOWUP\]/s, '')
        .replace(/IMPORTANT:.*?what might they ask next!/s, '')
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
  return prompt.includes('[FOLLOWUP]') || prompt.includes('follow-up prompts')
}

/**
 * Remove follow-up instructions from a prompt
 */
export function removeFollowUpInstructions(prompt: string): string {
  return prompt
    .replace(/At the end of each response.*?\[\/FOLLOWUP\]/s, '')
    .replace(/IMPORTANT:.*?what might they ask next!/s, '')
    .trim()
}

/**
 * Get the default system prompt for a given configuration
 */
export function getDefaultSystemPrompt(useDedicatedFollowUpModel: boolean = true): string {
  return buildSystemPrompt(useDedicatedFollowUpModel)
}
