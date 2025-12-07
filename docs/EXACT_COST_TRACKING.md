# 💰 Exact Cost Tracking Guide

**Version 0.10-beta** | Revolutionary Feature

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
- ✅ Usage Dashboard in Settings → Stats
- ✅ Retroactive "Fetch Exact Costs" for recent requests
- ✅ Export to JSON for analysis

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
    "native_tokens_completion_reasoning": 0,
    "num_media_generations": null,
    "provider_name": "Anthropic",
    "total_cost": 0.001275
  }
}
```

### Integration Flow

```
1. User sends message
   ↓
2. Chat API streams response from OpenRouter
   ↓
3. OpenRouter response headers include X-Or-Id (generation ID)
   ↓
4. Chameleon extracts generation ID
   ↓
5. Background fetch to /api/v1/generation
   ↓
6. Exact cost data stored in message metadata
   ↓
7. Display in UI and track in stats
```

### What Gets Tracked

**For each message:**
- **Native Tokens** - Actual tokens used for billing (not estimates!)
- **Total Cost** - Exact USD cost from OpenRouter
- **Provider Name** - Which backend served the request (Anthropic, OpenAI, etc.)
- **Generation ID** - Unique ID for OpenRouter transaction
- **Timestamp** - When the request was made

**For cache-enabled models:**
- **Cache Creation Tokens** - Tokens written to cache
- **Cache Read Tokens** - Tokens read from cache
- **Cache Discount** - Savings from prompt caching

---

## Using the Cost Tracker

### Accessing the Dashboard

1. Click **Settings** (⚙️) in header
2. Open **Advanced Settings** dialog
3. Click **"💸 Cost Tracker"** button
4. View complete analytics dashboard

### Dashboard Sections

#### 1. Overview Cards

**Total Cost**
- All-time spending across all models
- Based on **exact billing data** (not estimates!)
- Example: `$2.45`

**Total Tokens**
- Native tokens used for billing
- Input + output + reasoning tokens
- Example: `1,250,000 tokens`

**Chat Count**
- Number of conversations with cost data
- Example: `42 chats`

**Avg Cost/Message**
- Average spending per message
- Calculated from exact costs
- Example: `$0.003`

#### 2. Monthly Projection

Based on last 7 days of usage:
```
📊 Monthly Projection: $12.34
At this rate, you'll spend $12.34 this month
```

#### 3. Cost by Model

Bar chart showing top 5 models by total cost:
```
anthropic/claude-3.5-sonnet    ████████████ $1.20
openai/gpt-4o                  ████████░░░░ $0.85
x-ai/grok-4                    █████░░░░░░░ $0.25
google/gemini-2.0-flash        ██░░░░░░░░░░ $0.10
deepseek/deepseek-chat         █░░░░░░░░░░░ $0.05
```

#### 4. Cost Over Time

14-day bar chart showing daily spending:
- Hover to see exact daily cost
- Identify spending spikes
- Track optimization improvements

#### 5. Export Data

Click **"Export Data"** to download JSON:
```json
{
  "exportDate": "2025-12-06T12:00:00Z",
  "totalCost": 2.45,
  "totalTokens": 1250000,
  "chats": [
    {
      "id": "chat-123",
      "title": "Python Tutorial",
      "createdAt": "2025-12-05T10:00:00Z",
      "messages": [
        {
          "id": "msg-456",
          "role": "assistant",
          "cost": 0.00125,
          "nativeTokensPrompt": 150,
          "nativeTokensCompletion": 300,
          "provider": "Anthropic",
          "model": "anthropic/claude-3.5-sonnet",
          "timestamp": "2025-12-05T10:01:00Z"
        }
      ],
      "totalCost": 0.00125,
      "totalTokens": 450
    }
  ]
}
```

---

## Message-Level Cost Display

### Where to See Costs

**Enable Detailed Stats:**
1. Settings → Advanced Settings
2. Toggle **"Show Detailed Stats"** ON
3. Every AI message now shows exact cost

**Stats Display:**
```
📊 Stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Model: anthropic/claude-3.5-sonnet
Provider: Anthropic

💰 Cost: $0.001275 (exact)

📝 Native Tokens
  Prompt: 150 tokens
  Completion: 300 tokens
  Total: 450 tokens

⚡ Performance
  Speed: 45.2 tokens/sec
  Time: 2.3s
  TTFT: 0.8s

🔗 Generation ID: gen-abc123...
```

### What "Exact" Means

**Not estimated** - This is the exact amount OpenRouter charged for this request
**Matches billing** - Check openrouter.ai/activity to verify
**Native tokens** - Actual tokens used for billing (not normalized estimates)

### Cache Discount Display

For models with prompt caching (Claude, etc.):
```
💰 Cost: $0.000450 (exact)
   💾 Cache savings: -$0.000825 (65% off!)

📝 Native Tokens
  Prompt: 50 tokens (new)
  Cache Read: 500 tokens (from cache!)
  Cache Write: 550 tokens (created)
  Completion: 300 tokens
```

---

## Retroactive Cost Fetching

### What It Does

Fetches exact costs for recent messages that only have estimated costs.

### How to Use

1. Open **Cost Tracker** dashboard
2. Click **"Fetch Exact Costs"** button
3. Chameleon scans recent messages (last 7 days)
4. For each message with generation ID:
   - Calls OpenRouter generation API
   - Retrieves exact cost data
   - Updates message metadata
5. Progress shown: "Fetching... 15/42 updated"

### Requirements

- Messages must have generation ID (stored in metadata)
- Generation data must still be available on OpenRouter (usually ~30 days)
- Valid OpenRouter API key

### What Gets Updated

**Before:**
```json
{
  "stats": {
    "cost": 0.001500,  // Estimated
    "tokens": {
      "prompt": 150,   // Estimated (4 chars = 1 token)
      "completion": 300 // Estimated
    }
  }
}
```

**After:**
```json
{
  "stats": {
    "cost": 0.001275,           // EXACT from OpenRouter
    "actualCost": 0.001275,     // Stored separately
    "nativeTokensPrompt": 150,  // Native billing tokens
    "nativeTokensCompletion": 300,
    "provider": "Anthropic",
    "generationId": "gen-abc123..."
  }
}
```

---

## API Integration

### Fetching Exact Costs

**Endpoint:**
```
GET /api/openrouter/generation?id={generationId}
```

**Request:**
```typescript
const response = await fetch(`/api/openrouter/generation?id=${generationId}`, {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
})

const data = await response.json()
```

**Response:**
```json
{
  "id": "gen-abc123...",
  "model": "anthropic/claude-3.5-sonnet",
  "provider_name": "Anthropic",
  "native_tokens_prompt": 150,
  "native_tokens_completion": 300,
  "total_cost": 0.001275,
  "created_at": "2025-12-06T10:30:00Z"
}
```

### Extracting Generation ID

OpenRouter includes generation ID in response headers:

```typescript
// From streaming response
const generationId = response.headers.get('X-Or-Id')
// or
const generationId = response.headers.get('X-Request-Id')
```

**Storage:**
```typescript
// Store in message metadata
message.stats = {
  ...message.stats,
  generationId: generationId
}
```

---

## Cost Optimization with Exact Data

### 1. Identify Expensive Patterns

**Check Cost by Model:**
- Which models are draining your budget?
- Are you using expensive models for simple tasks?

**Example findings:**
```
anthropic/claude-3.5-sonnet: $1.20 (48% of total)
↓ Analysis: Using for ALL messages
✅ Solution: Use only for complex tasks
```

### 2. Compare Provider Costs

**Provider transparency shows:**
- Same model, different providers can have different costs
- OpenRouter routes to cheapest available provider
- Track which providers serve your requests

**Example:**
```
Model: gpt-4o
Provider A: $0.003/message
Provider B: $0.0025/message
↓ 17% savings by using Provider B
```

### 3. Leverage Cache Discounts

**For Claude models with prompt caching:**
- First message: $0.00150 (full cost)
- Subsequent: $0.00045 (70% off from cache!)
- Keep conversations going to maximize savings

**Track cache effectiveness:**
```
Total cost without cache: $5.00
Cache savings: -$3.50 (70%)
Actual cost: $1.50
```

### 4. Set Budgets Based on Real Data

**Use monthly projection:**
```
Last 7 days: $2.45
Monthly projection: $10.50
↓ Set budget: $12/month
✅ Track weekly, adjust usage to stay under
```

### 5. Export and Analyze

**Get JSON export:**
- Import to Excel/Python
- Group by model, date, provider
- Find optimization opportunities
- Share insights with team

**Example analysis:**
```python
import json
import pandas as pd

with open('usage-export.json') as f:
    data = json.load(f)

df = pd.DataFrame(data['chats'])
print(df.groupby('model')['totalCost'].sum().sort_values(ascending=False))
```

---

## Technical Implementation

### Message Metadata Structure

```typescript
interface MessageStats {
  // Exact cost data from OpenRouter
  cost?: number                    // Exact USD cost
  actualCost?: number              // Same as cost (for clarity)

  // Native tokens (billing)
  nativeTokensPrompt?: number
  nativeTokensCompletion?: number
  nativeTokensCompletionReasoning?: number

  // Cache tokens (if applicable)
  cacheCreationTokens?: number
  cacheReadTokens?: number

  // Provider info
  provider?: string                // e.g., "Anthropic"
  generationId?: string           // OpenRouter generation ID

  // Legacy (for backwards compatibility)
  tokens?: {
    prompt: number                 // Estimated tokens
    completion: number
    total: number
  }
}
```

### Database Schema (Supabase)

**No schema changes needed!** Exact costs are stored in existing `stats` JSONB column:

```sql
-- messages table (unchanged)
CREATE TABLE messages (
  id uuid PRIMARY KEY,
  chat_id uuid REFERENCES chats(id),
  role text NOT NULL,
  content text NOT NULL,
  stats jsonb,  -- Stores exact cost data
  created_at timestamptz DEFAULT now()
);

-- Query messages with exact costs
SELECT
  id,
  content,
  stats->>'actualCost' as exact_cost,
  stats->>'provider' as provider,
  stats->>'nativeTokensPrompt' as prompt_tokens
FROM messages
WHERE stats->>'actualCost' IS NOT NULL;
```

### Backwards Compatibility

**Old messages (v0.9 and earlier):**
- Have `stats.cost` (estimated)
- Have `stats.tokens` (estimated)
- No `actualCost` or `nativeTokens`

**New messages (v0.10+):**
- Have `stats.actualCost` (exact!)
- Have `stats.nativeTokensPrompt` (exact!)
- Still have `stats.cost` for backwards compatibility

**Display logic:**
```typescript
// Prefer exact cost, fall back to estimated
const displayCost = message.stats?.actualCost ?? message.stats?.cost ?? null

// Show "(exact)" vs "(estimated)" label
const isExact = message.stats?.actualCost !== undefined
const label = isExact ? "exact" : "estimated"
```

---

## Troubleshooting

### "Cost showing as $0.00"

**Causes:**
- Generation data not yet available (wait 30 seconds)
- Generation ID missing from response
- OpenRouter generation expired (>30 days old)

**Solutions:**
1. Wait and click "Fetch Exact Costs" in Cost Tracker
2. Check message metadata for `generationId`
3. For old messages, estimates may be only available data

### "Fetch Exact Costs not finding any"

**Causes:**
- Messages don't have generation IDs
- All messages already have exact costs
- OpenRouter API key invalid

**Solutions:**
1. Check at least one message has `stats.generationId`
2. Check Cost Tracker for "(exact)" label on costs
3. Verify API key in Settings → Advanced Settings

### "Cost doesn't match openrouter.ai"

**This should never happen!** Exact costs are pulled directly from OpenRouter's generation API.

**If it does:**
1. Check generation ID matches on both sides
2. Ensure you're comparing same request
3. Report bug with generation ID for investigation

### "Missing cache discount info"

**Causes:**
- Model doesn't support prompt caching
- Cache not enabled in request
- First message in conversation (cache not populated yet)

**Models with caching:**
- Claude 3.5 Sonnet
- Claude 3 Opus
- Claude 3 Haiku

**Check OpenRouter docs for cache-enabled models**

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

**OpenRouter:**
- They keep generation data for ~30 days
- You can fetch exact costs during this window
- After 30 days, data may be archived (estimates remain)

---

## Frequently Asked Questions

### Q: Do I have to pay extra for exact cost tracking?

**A: No!** OpenRouter's generation API is free. You only pay for the AI requests themselves (which you're already paying for). Fetching exact costs is an additional free API call.

### Q: How accurate are the exact costs?

**A: 100% accurate.** These are the exact amounts OpenRouter charged for each request. Check openrouter.ai/activity to verify - they'll match exactly.

### Q: What about old messages before v0.10?

**A: Two options:**
1. Use "Fetch Exact Costs" to retroactively fetch data (if <30 days old)
2. Keep estimated costs (they're pretty close, just not exact)

### Q: Will costs change retroactively?

**A: No.** Once a cost is fetched from the generation API, it's locked in. That's what you were charged, and it won't change.

### Q: Can I hide estimated costs and only show exact?

**A: Yes!** In Cost Tracker settings (coming soon), you can filter by exact costs only. For now, check the "(exact)" vs "(estimated)" label.

### Q: Do exact costs include OpenRouter's markup?

**A: Yes.** OpenRouter charges base provider cost + their markup. The exact cost includes everything you were billed.

### Q: What if a model changes pricing?

**A: Doesn't matter!** Old messages show what you were charged at that time. New messages show current pricing. All exact, all correct.

---

## Migration from Estimated Costs

### What Happened to `calculateCost()`?

**Removed in v0.10-beta.** We no longer need static pricing tables or cost calculations.

**Before:**
```typescript
import { calculateCost } from '@/lib/token-tracker'

const cost = calculateCost(promptTokens, completionTokens, model)
// Returns estimated cost based on MODEL_PRICING table
```

**After:**
```typescript
// Cost comes from OpenRouter generation API
const cost = message.stats?.actualCost ?? 0
// Real billing data, not estimates!
```

### Updating Your Code

If you were using `calculateCost()`:

```typescript
// ❌ OLD - Don't do this anymore
import { calculateCost } from '@/lib/token-tracker'
const estimatedCost = calculateCost(promptTokens, completionTokens, model)

// ✅ NEW - Use exact costs from message stats
const exactCost = message.stats?.actualCost ?? 0
```

### Data Migration

**No migration needed!** Old messages keep their estimated costs. New messages get exact costs. Both work seamlessly.

---

## Roadmap

### Coming Soon

**Budget Alerts (v0.11):**
- Set monthly spending limits
- Get alerts at 50%, 80%, 100%
- Auto-switch to cheaper models

**Cost Forecasting (v0.12):**
- ML-based usage prediction
- "At this rate, you'll hit budget in 12 days"
- Optimization suggestions

**Team Cost Tracking (v0.13):**
- Shared team budgets
- Per-user cost attribution
- Department-level reporting

**Advanced Analytics (v0.14):**
- Cost per conversation topic
- ROI tracking (value vs cost)
- A/B test model costs

---

## Conclusion

Exact cost tracking transforms Chameleon from "pretty good cost estimates" to **100% accurate billing transparency**. Every dollar you spend is tracked, analyzed, and exportable.

**Key Takeaways:**

✅ **No more guessing** - Real billing data from OpenRouter
✅ **Provider transparency** - See who served your request
✅ **Cache insights** - Track prompt caching savings
✅ **Retroactive fetching** - Get exact costs for recent messages
✅ **Export everything** - JSON export for deep analysis
✅ **Backwards compatible** - Old messages keep working

**Start optimizing your AI spending with REAL data today!** 💰

---

**Questions? Feedback?**

GitHub: https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues

**Happy cost tracking!** 🦎
