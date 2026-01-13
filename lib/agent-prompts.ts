/**
 * Agent Mode Prompts
 *
 * System prompts and utilities for Agent Mode functionality.
 * Agent Mode enables autonomous multi-step task execution with planning.
 */

import type { AgentTask } from "@/types"
import { generateUUID } from "@/lib/utils"

/**
 * System prompt injection for Agent Mode
 * This prompt instructs the AI to plan tasks before executing
 */
export const AGENT_PLANNING_PROMPT = `
You are in AGENT MODE - an autonomous task executor with enhanced capabilities.

BEFORE answering complex requests, create a brief task plan:
1. Break the request into 1-5 discrete subtasks
2. Identify which tools you'll need for each task:
   - web_search: Search the internet for current information
   - url_fetch: Read content from a specific URL
   - youtube_transcript: Get transcripts from YouTube videos
   - get_weather: Get current weather or forecasts
3. Execute each subtask methodically
4. Synthesize results into a comprehensive answer

FORMAT your plan (the user will see this):
<agent-plan>
1. [Task description] → tool: web_search
2. [Task description] → tool: url_fetch
3. [Task description] → tool: none (synthesis)
</agent-plan>

Then execute the plan step-by-step, using tools as needed.

IMPORTANT GUIDELINES:
- You have up to 10 tool calls available (more than normal mode)
- Be thorough - fetch multiple sources when researching
- Verify facts by cross-referencing sources when possible
- If a task fails, adapt and try alternative approaches
- For simple questions that don't need tools, skip the plan and answer directly
- Always synthesize your findings into a clear, actionable response
`

/**
 * Parse agent plan from AI response
 * Extracts structured tasks from the <agent-plan> block
 */
export function parseAgentPlan(content: string): AgentTask[] | null {
  const planMatch = content.match(/<agent-plan>([\s\S]*?)<\/agent-plan>/i)
  if (!planMatch) return null

  const planContent = planMatch[1].trim()
  const lines = planContent.split("\n").filter((line) => line.trim())

  const tasks: AgentTask[] = []

  for (const line of lines) {
    // Match patterns like:
    // "1. Search for TypeScript ORMs → tool: web_search"
    // "- Task description (tool: url_fetch)"
    const match = line.match(
      /^[\d\-\*\.]+\s*(.+?)(?:\s*[→\-\(\:]\s*tool[:\s]*(\w+)|$)/i
    )

    if (match) {
      const description = match[1].trim().replace(/[\(\)→\-:]+\s*$/, "").trim()
      const toolUsed = match[2]?.toLowerCase() || undefined

      if (description) {
        tasks.push({
          id: generateUUID(),
          description,
          status: "pending",
          toolUsed:
            toolUsed && ["web_search", "url_fetch", "youtube_transcript", "get_weather"].includes(toolUsed)
              ? toolUsed
              : undefined,
        })
      }
    }
  }

  return tasks.length > 0 ? tasks : null
}

/**
 * Check if a query likely needs agent mode (complex multi-step task)
 * This is a heuristic to help the AI decide when to use planning
 */
export function isComplexQuery(query: string): boolean {
  const complexIndicators = [
    /research\s+(and|then|also)/i,
    /compare\s+(and|then|multiple|several)/i,
    /find\s+.+\s+and\s+.+/i,
    /create\s+a\s+(comparison|summary|report|analysis)/i,
    /step[\s-]by[\s-]step/i,
    /multiple\s+(sources|websites|articles)/i,
    /thorough(ly)?\s+(research|search|analysis)/i,
    /comprehensive/i,
    /in[\s-]depth/i,
  ]

  return complexIndicators.some((pattern) => pattern.test(query))
}

/**
 * Generate a minimal planning hint for simple agent mode queries
 */
export const AGENT_SIMPLE_HINT = `
You have Agent Mode enabled with up to 10 tool calls.
Use multiple tools if needed to provide a thorough answer.
For complex tasks, briefly outline your approach before starting.
`

/**
 * Tool descriptions for agent planning context
 */
export const TOOL_DESCRIPTIONS = {
  web_search: "Search the internet for current information, news, and documentation",
  url_fetch: "Read and extract content from a specific webpage URL",
  youtube_transcript: "Get the transcript/captions from a YouTube video",
  get_weather: "Get current weather conditions or multi-day forecasts for any location",
} as const

export type AgentTool = keyof typeof TOOL_DESCRIPTIONS
