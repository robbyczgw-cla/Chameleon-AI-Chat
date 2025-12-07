# 💰 Exact Cost Tracking Guide

**Version 0.10-beta** | Revolutionary Feature | **Updated 2025-12-07**

## Overview

Chameleon Chat now tracks **EXACT COSTS** from OpenRouter's generation API instead of using estimated pricing tables. Every dollar you spend is **real billing data** that matches your openrouter.ai/activity dashboard exactly.

### What Changed

**Before (v0.9 and earlier):**
- ❌ Static pricing tables that become outdated
- ❌ Estimated costs based on token count calculations
- ❌ Inaccurate when providers change pricing
- ❌ No visibility into cache discounts
- ❌ Couldn't see which backend provider served your request

**After (v0.10-beta):**
- ✅ **Exact costs** from OpenRouter's generation API
- ✅ Real billing data (matches openrouter.ai/activity)
- ✅ Native token counts used for billing
- ✅ Provider transparency (see which backend served your request)
- ✅ Cache discount tracking (prompt caching savings)
- ✅ Reasoning token tracking (for o1/DeepSeek R1 models)
- ✅ Collapsible stats sections with toggles
- ✅ Usage Dashboard in Settings → Stats
- ✅ Retroactive "Fetch Exact Costs" for recent requests
- ✅ Export to JSON for analysis

---

## Critical Bug Fixes (2025-12-07)

### Bug #1: Stats Not Being Saved to Messages

**Symptom:** Cost, model, and provider info not showing in Detailed Stats even though logs showed generation ID was captured.

**Root Cause:** In `chat-input.tsx`, the `setChats` update was missing the `stats` field:

```javascript
// BEFORE (BROKEN)
const updatedMessages = chat.messages.map((m) =>
  m.id === assistantMessageId
    ? { ...m, tokens: finalMessage.tokens, reasoning: ..., streamingHistory: ... }
    : m,
)
// ❌ MISSING: stats: finalMessage.stats

// AFTER (FIXED)
const updatedMessages = chat.messages.map((m) =>
  m.id === assistantMessageId
    ? { ...m, tokens: finalMessage.tokens, stats: finalMessage.stats, reasoning: ..., streamingHistory: ... }
    : m,
)
// ✅ Now includes stats!
```

**Fix:** Added `stats: finalMessage.stats` to the setChats update.

**File:** `components/chat-input.tsx` (line ~1016)

---

### Bug #2: API Key Not Passed to Generation Endpoint

**Symptom:** Console showed `[AutoFetchCosts] Failed to fetch cost for xxx: <empty string>`

**Root Cause:** The `useAutoFetchCosts` hook wasn't passing the API key:

```javascript
// BEFORE (BROKEN)
const response = await fetch(`/api/generation?id=${generationId}`)
// ❌ No API key header!

// AFTER (FIXED)
const headers: Record<string, string> = {}
if (apiKey) {
  headers["x-api-key"] = apiKey
}
const response = await fetch(`/api/generation?id=${generationId}`, { headers })
// ✅ API key passed in header
```

**Fix:**
1. Added `apiKey` parameter to `useAutoFetchCosts` hook
2. Pass `settings.apiKeys?.openRouter` from `chat-messages.tsx`

**Files:**
- `hooks/use-auto-fetch-costs.ts`
- `components/chat-messages.tsx`

---

### Bug #3: OpenRouter Response Nested in `data` Object

**Symptom:** API call succeeded but `total_cost` was undefined.

**Root Cause:** OpenRouter returns `{ data: { total_cost, ... } }` but code expected `{ total_cost, ... }`:

```javascript
// OpenRouter Response Format
{
  "data": {
    "id": "gen-xxx",
    "total_cost": 0.00492,
    "native_tokens_prompt": 150,
    ...
  }
}

// BEFORE (BROKEN)
return NextResponse.json(data)
// Returns the wrapper object, not the data inside

// AFTER (FIXED)
return NextResponse.json(data.data || data)
// Unwraps the nested data
```

**Fix:** Unwrap the nested `data` object in `/api/generation/route.ts`.

**File:** `app/api/generation/route.ts` (line ~43)

---

## How It Works

### The OpenRouter Generation API

OpenRouter provides a `/api/v1/generation` endpoint that returns **exact billing data** for each request:

```
GET https://openrouter.ai/api/v1/generation?id={generationId}
Authorization: Bearer {your-api-key}
```

**Response includes:**
```json
{
  "data": {
    "id": "gen-abc123...",
    "model": "anthropic/claude-3.5-sonnet",
    "created_at": "2025-12-06T10:30:00Z",
    "native_tokens_prompt": 150,
    "native_tokens_completion": 300,
    "native_tokens_completion_reasoning": 45,
    "num_media_generations": null,
    "provider_name": "Anthropic",
    "total_cost": 0.001275,
    "cache_creation_tokens": 0,
    "cache_read_tokens": 500
  }
}
```

### Integration Flow

```
1. User sends message
   ↓
2. Chat API streams response from OpenRouter
   ↓
3. Server captures generation ID from response (parsed.id)
   ↓
4. Server sends {generation_id: xxx} before [DONE]
   ↓
5. Client captures via onGenerationId callback
   ↓
6. capturedGenerationId stored in finalMessage.stats
   ↓
7. setChats update includes stats: finalMessage.stats ← CRITICAL!
   ↓
8. useAutoFetchCosts finds messages with generationId
   ↓
9. Fetches /api/generation?id=xxx WITH API key
   ↓
10. /api/generation unwraps data.data response
   ↓
11. Cost data stored in message.stats.actualCost
   ↓
12. MessageStats displays with collapsible sections
```

### What Gets Tracked

**For each message:**
- **Native Tokens** - Actual tokens used for billing (not estimates!)
- **Total Cost** - Exact USD cost from OpenRouter
- **Provider Name** - Which backend served the request (Anthropic, OpenAI, etc.)
- **Generation ID** - Unique ID for OpenRouter transaction
- **Timestamp** - When the request was made

**For reasoning models (o1, o3, DeepSeek R1, Qwen Thinking):**
- **Reasoning Tokens** - Tokens spent on "thinking"
- **Reasoning Percentage** - % of output that was reasoning

**For cache-enabled models:**
- **Cache Creation Tokens** - Tokens written to cache
- **Cache Read Tokens** - Tokens read from cache
- **Cache Savings %** - Percentage of input from cache

---

## Detailed Stats Display

### Enhanced Stats Panel (v0.10-beta)

The stats panel now shows ALL data from OpenRouter with collapsible sections:

```
📊 Detailed Stats                    $0.000412
────────────────────────────────────────────
Input:  168 tokens    Output: 152 tokens
Total:  320 tokens    Rate:   $0.0013/1K

▶ 🧠 Reasoning          [42%]
   Thinking Tokens:     45
   % of Output:         42%
   Visible Output:      107

▶ 💾 Prompt Cache       [35% saved]
   Cache Hits:          500 tokens
   Cache Created:       0 tokens
   Input Cached:        35%

▶ 📏 Native Tokenizer
   Native Input:        172
   Native Output:       158
   Estimate Diff:       +2.4%

▶ ⚡ Performance        [45 t/s]
   Time to First Token: 0.32s
   Total Response Time: 3.56s
   Generation Speed:    45 tokens/sec
   Generation Time:     3.24s

▶ 🎛️ Generation
   Model:              x-ai/grok-4.1-fast
   Provider:           Together
   Stop Reason:        end_turn
   Output Ratio:       48%
   Input:Output:       1.11:1
   Generation ID:      gen-1765136398...

▶ 🔍 Web Search        [5 results]
   Provider:           serper
   Results Found:      5
   Search Time:        1.23s

▶ 📈 Efficiency
   Cost/Input Token:   $0.15/M
   Cost/Output Token:  $0.60/M
   Cost/Second:        $0.000116/s
   Chars/Token (out):  4.2
```

### Settings → Experimental → Message Statistics

Control which sections display and their default expand state:

| Setting | Description |
|---------|-------------|
| 🧠 Reasoning | Show reasoning token stats (o1/DeepSeek R1) |
| 💾 Cache | Show prompt cache statistics |
| 📏 Native Tokens | Show native tokenizer counts |
| ⚡ Performance | Show timing and speed metrics |
| 🎛️ Generation | Show model, provider, stop reason |
| 🔍 Search | Show web search statistics |
| 📈 Efficiency | Show cost efficiency metrics |
| Auto-expand 🧠 | Automatically expand reasoning section |
| Auto-expand 💾 | Automatically expand cache section |

---

## Technical Implementation

### Message Stats Type Definition

```typescript
interface MessageStats {
  // Basic info
  model?: string
  cost?: number // Deprecated, use actualCost

  // Exact cost data from OpenRouter
  actualCost?: number
  generationId?: string
  provider?: string

  // Native tokens (billing)
  nativeTokensPrompt?: number
  nativeTokensCompletion?: number
  nativeTokensCompletionReasoning?: number

  // Cache tokens
  cacheCreationTokens?: number
  cacheReadTokens?: number

  // Performance
  responseTime?: number
  tokensPerSecond?: number
  firstTokenTime?: number
  stopReason?: string

  // Search
  searchProvider?: string
  searchResults?: number
  searchTime?: number
}
```

### Stats Display Settings Type

```typescript
interface StatsDisplaySettings {
  // Which sections to show (all default to true)
  showReasoning?: boolean
  showCache?: boolean
  showNativeTokens?: boolean
  showPerformance?: boolean
  showGeneration?: boolean
  showSearch?: boolean
  showEfficiency?: boolean

  // Default expand state
  defaultExpandReasoning?: boolean // Default: true
  defaultExpandCache?: boolean // Default: false
}
```

### Key Files

| File | Purpose |
|------|---------|
| `hooks/use-auto-fetch-costs.ts` | Background fetching of exact costs |
| `app/api/generation/route.ts` | Proxy to OpenRouter generation API |
| `components/message-stats.tsx` | Stats display with collapsible sections |
| `components/experimental-settings.tsx` | Stats toggle settings |
| `components/chat-messages.tsx` | Integrates auto-fetch hook |
| `components/chat-input.tsx` | Captures generation ID, saves stats |
| `types/index.ts` | Type definitions for stats |

---

## Troubleshooting

### "Cost showing as $0.00 or not showing"

**Checklist:**
1. ✅ Check console for `[v0] 💰 Generation ID received:`
2. ✅ Check console for `[Advanced Chat] 💰 Generation ID captured:`
3. ✅ Check console for `[AutoFetchCosts] Fetching exact cost...`
4. ✅ Check console for `[AutoFetchCosts] ✅ Fetched exact cost:`

**If generation ID not received:**
- Model might not support generation IDs
- API route might have tool calls (generation ID only sent for non-tool responses)

**If fetch fails with empty error:**
- API key not being passed
- Check `settings.apiKeys?.openRouter` is set

**If cost undefined after successful fetch:**
- OpenRouter response format changed
- Check `/api/generation/route.ts` is unwrapping `data.data`

### "Stats not persisting after page reload"

**Cause:** Stats weren't being saved to the message when setChats was called.

**Fix:** Ensure `stats: finalMessage.stats` is included in the setChats update in `chat-input.tsx`.

### "Native tokens don't match estimated tokens"

**This is expected!** Native tokens use the model's actual tokenizer. Estimates use tiktoken which may differ by 5-15%.

### "Reasoning tokens showing 0"

- Model doesn't support reasoning
- Reasoning toggle wasn't enabled when message was sent
- Model returned reasoning but didn't report token count

---

## Privacy & Security

### What Gets Sent to OpenRouter

**Only:**
- Generation ID (to fetch cost data)
- Your OpenRouter API key (for authentication)

**Never:**
- Message content
- User information
- Conversation history

### Data Storage

**Client-side (localStorage):**
- All cost data stored locally
- Export anytime as JSON
- Clear with browser data

**Server-side (Supabase):**
- Cost data stored in `messages.stats` JSONB column
- Encrypted at rest
- Only YOU can access (row-level security)

---

## Changelog

### 2025-12-07
- **FIXED:** Stats not saved to messages (missing in setChats update)
- **FIXED:** API key not passed to /api/generation
- **FIXED:** OpenRouter response nested in data.data
- **ADDED:** Collapsible stats sections with toggles
- **ADDED:** Reasoning tokens display for thinking models
- **ADDED:** Cache statistics display
- **ADDED:** Provider name display
- **ADDED:** Efficiency metrics (cost/token, cost/second)
- **ADDED:** Settings to control which sections show
- **ADDED:** Auto-expand settings for sections

### Previous
- Initial exact cost tracking implementation
- Generation ID capture from stream
- Background auto-fetch hook

---

## FAQ

### Q: Why did cost tracking stop working?

**A:** Three bugs were introduced during refactoring:
1. Stats weren't saved to messages
2. API key wasn't passed to generation endpoint
3. Response data wasn't unwrapped properly

All fixed in the 2025-12-07 update.

### Q: What models support reasoning tokens?

**A:** Models with extended thinking:
- OpenAI o1, o1-mini, o1-pro
- OpenAI o3, o3-mini
- DeepSeek R1, DeepSeek Reasoner
- Qwen QwQ, Qwen Thinking series

### Q: What models support prompt caching?

**A:** Currently:
- Claude 3.5 Sonnet, Claude 3 Opus/Haiku
- Some OpenAI models via OpenRouter

### Q: Can I see exact costs for old messages?

**A:** Only if they have a `generationId` stored. Messages from before generation ID capture was implemented won't have exact costs available.

---

**Questions? Feedback?**

GitHub: https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues

**Happy cost tracking!** 🦎💰
