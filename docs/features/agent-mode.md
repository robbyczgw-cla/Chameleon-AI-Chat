# Agent Mode

Transform Chameleon AI Chat from a simple Q&A tool into an autonomous task executor with multi-step research capabilities.

## Overview

Agent Mode enables the AI to:
- **Plan before acting** - Break complex requests into discrete subtasks
- **Execute more tool calls** - Up to 10 iterations (vs 3 in normal mode)
- **Ask clarifying questions** - Understand your needs before researching
- **Show progress** - Visual task plan with real-time completion status

## When to Use Agent Mode

### Good for:
- Research tasks requiring multiple searches
- Comparisons (products, technologies, options)
- Multi-source synthesis ("summarize these 3 articles")
- Complex questions with many facets

### Not needed for:
- Simple factual questions ("What's the capital of France?")
- Single-search queries ("Weather in Tokyo")
- Quick definitions or explanations
- Casual conversation

## How to Enable

### Quick Toggle (Recommended)
1. Ensure you're in **Advanced Mode** (Agent Mode is hidden in Simple Mode)
2. Click the **🤖 Robot button** in the chat input toolbar
3. The button glows purple when active with a green pulse indicator

### Settings Configuration
1. Go to **Settings → Labs → Agent Mode**
2. Adjust settings:
   - **Maximum Tool Calls** - 3 to 15 (default: 10)
   - **Show Task Plan** - Display progress UI (default: ON)

## How It Works

### 1. Clarifying Questions (New!)

For broad or ambiguous requests, the AI asks 1-2 quick questions before planning:

```
User: "Research TypeScript ORMs"

AI: "Before I dive in, a couple quick questions:
     - What's your main goal - learning, comparing options, or making a decision?
     - Any specific criteria that matter most (performance, type safety, ease of use)?"

User: "Making a decision for a REST API. Type safety is critical."

AI: <now creates a targeted research plan>
```

The AI skips clarifying questions when:
- The request is already specific and clear
- It's a simple factual question
- The user says "just research it" or similar

### 2. Task Planning

After understanding your needs, the AI creates a plan:

```
🤖 Agent Plan
├─ 1. Search for TypeScript ORM comparisons 2026 → tool: web_search
├─ 2. Fetch Prisma official documentation → tool: url_fetch
├─ 3. Fetch Drizzle ORM documentation → tool: url_fetch
├─ 4. Compare type safety features → tool: none (synthesis)
└─ 5. Create comparison table → tool: none (synthesis)
```

### 3. Execution with Progress

As each task completes, you see real-time progress:
- ⚪ Pending - Not started
- 🔵 Active - Currently executing (with spinner)
- ✅ Completed - Done (with duration)
- ❌ Failed - Error occurred

### 4. Synthesis

Finally, the AI synthesizes all findings into a comprehensive answer.

## Technical Architecture

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ 1. User sends message with Agent Mode enabled                │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Backend injects AGENT_PLANNING_PROMPT into system message │
│    - Clarifying questions instruction                        │
│    - Task planning format                                    │
│    - Guidelines for tool usage                               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. AI responds with clarifying questions OR task plan        │
│    (depending on request clarity)                            │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Tool calling loop (up to MAX_ITERATIONS)                  │
│    - AI decides which tool to use                            │
│    - Tool executes (search, fetch, etc.)                     │
│    - Results added to context                                │
│    - AI decides next action                                  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. AI synthesizes all gathered information                   │
│    - Final response generated                                │
│    - All generation IDs tracked for cost                     │
└──────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/agent-prompts.ts` | Planning prompt, plan parser, complexity detection |
| `components/agent-task-item.tsx` | Task progress display component |
| `app/api/chat/route.ts` | Dynamic iterations, prompt injection |
| `components/chat-input.tsx` | Robot toggle button |
| `components/message-status.tsx` | Plan display integration |
| `types/index.ts` | `AgentTask` type, settings interface |

### Agent Planning Prompt

Located in `lib/agent-prompts.ts`:

```typescript
export const AGENT_PLANNING_PROMPT = `
You are in AGENT MODE - an autonomous task executor with enhanced capabilities.

STEP 1: CLARIFY IF NEEDED
For broad or ambiguous research requests, ask 1-2 quick clarifying questions...

STEP 2: CREATE A TASK PLAN
For complex requests, create a brief task plan:
1. Break the request into 1-5 discrete subtasks
2. Identify which tools you'll need for each task
3. Execute each subtask methodically
4. Synthesize results into a comprehensive answer

FORMAT your plan (the user will see this):
<agent-plan>
1. [Task description] → tool: web_search
2. [Task description] → tool: url_fetch
3. [Task description] → tool: none (synthesis)
</agent-plan>

IMPORTANT GUIDELINES:
- You have up to 10 tool calls available (more than normal mode)
- Be thorough - fetch multiple sources when researching
- Verify facts by cross-referencing sources when possible
...
`
```

### Plan Parsing

The `<agent-plan>` tags are parsed by `parseAgentPlan()` which extracts:
- Task descriptions
- Associated tools
- Creates `AgentTask[]` for UI display

### Dynamic Iterations

```typescript
// In route.ts
const MAX_ITERATIONS = agentMode ? agentMaxIterations : 3
```

Normal mode is always capped at 3 iterations. Agent mode uses the user-configured limit (default 10, max 15).

### Cost Tracking

Each tool call iteration creates a new generation ID. All IDs are tracked and sent to the frontend for accurate cost calculation:

```typescript
// All generation IDs tracked
const allGenerationIds: string[] = []

// Sent before [DONE]
{
  generation_id: lastId,
  all_generation_ids: allGenerationIds,
  tool_call_count: allGenerationIds.length - 1
}
```

## Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | false | Master toggle for Agent Mode |
| `maxIterations` | number | 10 | Max tool calls per request (3-15) |
| `showTaskPlan` | boolean | true | Display visual progress UI |
| `autoVerify` | boolean | false | Self-verification step (future) |

## Edge Cases

### Simple Mode Protection
Agent Mode toggle is hidden when Simple Mode is active. Simple Mode users never see or accidentally enable Agent Mode.

### No Tools Available
If no search API key is configured, Agent Mode still works - it just allows more AI thinking time without tool calls.

### Clarifying Questions Bypass
If a user's request is very specific or they say "just research it", the AI skips clarifying questions and proceeds directly to planning.

### Failed Tasks
If a tool call fails, the AI adapts and tries alternative approaches. The UI shows failed tasks with a red X.

## Future Enhancements

- **Auto-verify** - AI verifies its own output quality before responding
- **Parallel tools** - Execute independent tool calls simultaneously
- **Task templates** - Pre-built workflows for common research patterns
- **Memory integration** - Remember successful research patterns

## Troubleshooting

### Agent Mode button not visible
- Ensure you're in Advanced Mode (Settings → Simple Mode = OFF)
- Refresh the page if just switched modes

### AI not asking clarifying questions
- Request may already be specific enough
- AI uses judgment - very clear requests skip clarification

### Plan not displaying
- Check Settings → Labs → Show Task Plan is ON
- `<agent-plan>` tags must be properly formatted by AI

### Costs higher than expected
- Each tool call creates a new API request
- Check Settings → Labs → Maximum Tool Calls to reduce limit
- Simple questions don't need Agent Mode
