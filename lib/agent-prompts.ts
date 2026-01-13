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

STEP 1: CLARIFY BEFORE RESEARCHING (OPTIONAL)
For broad research requests, consider asking 1-2 clarifying questions BEFORE planning. This helps you research exactly what the user needs.

If you decide to ask clarifying questions, use this format:
<clarifying>
question: [Your question here]
options: [Option 1]|[Option 2]|[Option 3]|[Option 4]
</clarifying>

Examples of good clarifying questions:
<clarifying>
question: What's your main goal with this research?
options: Learning the basics|Comparing options|Making a decision|Building something
</clarifying>

<clarifying>
question: What matters most to you?
options: Cost/price|Performance|Ease of use|Reliability
</clarifying>

<clarifying>
question: What's the context for this?
options: Personal project|Work/professional|School/learning|Just curious
</clarifying>

ONLY skip clarifying questions when:
- The request includes specific criteria already (e.g., "best database for high-write loads under $100/month")
- It's a simple factual question (e.g., "What year was Python created?")
- The user says "just do it" or "skip questions"

When in doubt, ASK. Better to clarify than to research the wrong thing.

STEP 2: CREATE A TASK PLAN
For complex requests, create a brief task plan:
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

/**
 * Clarifying question structure for Agent Mode
 */
export interface ClarifyingQuestion {
  question: string
  options: string[]
}

/**
 * Parse clarifying questions from AI response
 * Extracts structured questions from <clarifying> blocks
 */
export function parseClarifyingQuestions(content: string): ClarifyingQuestion[] {
  const questions: ClarifyingQuestion[] = []

  // Match all <clarifying>...</clarifying> blocks
  const regex = /<clarifying>([\s\S]*?)<\/clarifying>/gi
  let match

  while ((match = regex.exec(content)) !== null) {
    const block = match[1].trim()

    // Extract question and options
    const questionMatch = block.match(/question:\s*(.+?)(?:\n|$)/i)
    const optionsMatch = block.match(/options:\s*(.+?)(?:\n|$)/i)

    if (questionMatch && optionsMatch) {
      const question = questionMatch[1].trim()
      const options = optionsMatch[1]
        .split("|")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0)

      if (question && options.length > 0) {
        questions.push({ question, options })
      }
    }
  }

  return questions
}

/**
 * Check if content contains clarifying questions
 */
export function hasClarifyingQuestions(content: string): boolean {
  return /<clarifying>/i.test(content)
}

/**
 * Remove clarifying question tags from content for display
 * Returns the content without the raw tags (since we render them as UI)
 */
export function stripClarifyingTags(content: string): string {
  return content.replace(/<clarifying>[\s\S]*?<\/clarifying>/gi, "").trim()
}
