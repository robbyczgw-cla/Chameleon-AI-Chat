# Intelligent Memory System

A state-of-the-art memory system that makes your AI assistant remember important things about you while being smart about when to use that knowledge.

## Table of Contents

**For Simple Users:**
- [What is the Memory System?](#what-is-the-memory-system)
- [Quick Start Guide](#quick-start-guide)
- [Adding Memories](#adding-memories)
- [Best Practices](#best-practices)

**For Advanced Users:**
- [How It Works (Technical Deep Dive)](#how-it-works-technical-deep-dive)
- [The Four Phases](#the-four-phases)
- [Settings Reference](#settings-reference)
- [Fine-Tuning in Experimental Settings](#fine-tuning-in-experimental-settings)
- [Database Setup](#database-setup)

**Reference:**
- [Troubleshooting](#troubleshooting)
- [Cost Breakdown](#cost-breakdown)
- [Privacy](#privacy)
- [API Reference](#api-reference)

---

# For Simple Users

## What is the Memory System?

The Memory System lets the AI **remember things about you** across conversations. Instead of repeating yourself every time, the AI knows:

- Your preferences ("I prefer dark mode", "I like sci-fi books")
- Facts about you ("I'm a software engineer", "I live in Berlin")
- Your projects ("I'm building a React app")
- Your skills ("I know Python")
- Your goals ("I want to learn machine learning")

**The Smart Part:** The AI only uses memories when relevant. Ask "What is 2+2?" and it won't mention your book preferences. Ask "Recommend me a book?" and it remembers you like sci-fi.

---

## Quick Start Guide

### Step 1: Enable Memory

1. Look for the **brain icon** (🧠) in the chat header (top of the screen)
2. Click it to open the Memory Manager
3. Toggle **"AI Memory System"** to ON

That's it! The system is now active.

### Step 2: Add Your First Memory

1. Click the brain icon again
2. Click **"Add Memory"**
3. Fill in:
   - **Type**: What kind of info is this? (Preference, Fact, etc.)
   - **Content**: The actual information
   - **Importance**: How important is this? (Low/Medium/High)
4. Click **Save**

### Step 3: Test It

Try these queries:
- ❌ "What is 2+2?" → No memory used (factual question)
- ✅ "Recommend me a book" → Uses your preferences
- ✅ "Help me with my project" → Uses your context

Check the browser console (F12 → Console) to see logs like:
```
[ChatInput] ✅ Memory context added: 3 memories
```

---

## Adding Memories

### Memory Types Explained

| Type | Use For | Examples |
|------|---------|----------|
| **Preference** | Things you like or dislike | "I prefer TypeScript over JavaScript", "I don't like spicy food" |
| **Fact** | Personal information | "I'm 28 years old", "I live in Berlin", "My name is Alex" |
| **Context** | Current situation/projects | "I'm building a SaaS for restaurants", "I'm studying for AWS certification" |
| **Skill** | Things you know how to do | "I know React and Node.js", "I'm fluent in Spanish" |
| **Goal** | What you want to achieve | "I want to become a senior developer", "I'm trying to lose weight" |

### Importance Levels

| Level | When to Use | Effect |
|-------|-------------|--------|
| **High (3)** | Critical info that should almost always be considered | Highest priority in retrieval |
| **Medium (2)** | Useful context that helps personalization | Default, good balance |
| **Low (1)** | Nice-to-know, only use when highly relevant | Only retrieved for very relevant queries |

### Tips for Good Memories

**Be Specific:**
```
❌ Bad:  "I like programming"
✅ Good: "I prefer TypeScript with strict mode for large projects"
```

**Include Context:**
```
❌ Bad:  "React"
✅ Good: "I'm building a React dashboard for my company's inventory system"
```

**Be Concise:**
```
❌ Bad:  "I really really love science fiction books especially ones about space exploration and alien civilizations"
✅ Good: "I love sci-fi books, especially space exploration themes"
```

---

## Best Practices

### What Works Well

1. **Add communication preferences early:**
   - "I prefer concise answers with code examples"
   - "Explain things like I'm a senior developer"
   - "Always use TypeScript in examples"

2. **Keep work context updated:**
   - "I'm working on a Next.js e-commerce app"
   - "My tech stack is React, Supabase, Tailwind"

3. **Note your learning goals:**
   - "I'm learning Rust"
   - "I want to understand system design better"

### What to Avoid

1. **Temporary info** - Don't add things that change daily
2. **Sensitive data** - Don't add passwords, API keys, or private info
3. **Duplicate memories** - Check if similar memory exists first
4. **Vague statements** - "I like stuff" isn't helpful

---

# For Advanced Users

## How It Works (Technical Deep Dive)

The memory system uses a **four-phase intelligent retrieval pipeline**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER QUERY                                   │
│                    "recommend me a book"                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: QUERY CLASSIFICATION                                        │
│                                                                       │
│ • Model: gpt-oss-20b via OpenRouter                                  │
│ • Cost: ~$0.00001 per query                                          │
│ • Latency: 500-2000ms                                                │
│                                                                       │
│ Classifies query as:                                                 │
│   • "factual" (2+2, definitions) → Skip memory                       │
│   • "personal" (recommendations, projects) → Retrieve memory         │
│   • "ambiguous" (unclear) → Skip to save tokens                      │
│                                                                       │
│ Output: { needsMemory: true, confidence: 0.95, queryType: "personal"}│
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: CONFIDENCE CHECK                                            │
│                                                                       │
│ • If needsMemory = false AND confidence >= 0.8 → SKIP                │
│ • If needsMemory = false AND confidence < 0.8 → RETRIEVE (safer)     │
│ • If needsMemory = true → RETRIEVE                                   │
│ • If persona chat AND alwaysRetrieveForPersonas → RETRIEVE           │
│                                                                       │
│ This prevents wrong "skip" decisions when classifier is unsure.      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: SEMANTIC SEARCH                                             │
│                                                                       │
│ • Model: openai/text-embedding-3-small via OpenRouter                │
│ • Cost: ~$0.00002 per query                                          │
│ • Latency: 200-500ms                                                 │
│                                                                       │
│ How it works:                                                        │
│ 1. Convert query to 1536-dimensional vector (embedding)              │
│ 2. Compare with stored memory embeddings using cosine similarity     │
│ 3. Return memories with similarity >= similarityThreshold (0.5)      │
│                                                                       │
│ Search priority:                                                     │
│ 1. Database (pgvector) if cloud sync enabled                         │
│ 2. Client-side if local-only                                         │
│ 3. Keyword matching as fallback                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: RELEVANCE FILTER                                            │
│                                                                       │
│ • Check: Is top similarity >= minRelevanceScore (0.3)?               │
│ • If NO: Skip ALL memories (prevents irrelevant context)             │
│ • If YES: Proceed with injection                                     │
│                                                                       │
│ Example:                                                             │
│   Query: "what's the weather?"                                       │
│   Best match: "I like sci-fi books" (similarity: 0.15)               │
│   0.15 < 0.3 → Skip all memories (irrelevant)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ CONTEXT INJECTION                                                    │
│                                                                       │
│ Memories formatted and added to system prompt:                       │
│                                                                       │
│ <user_memory>                                                        │
│ Preferences: I like sci-fi books; I prefer concise answers           │
│ Facts: I'm a software engineer; I live in Berlin                     │
│ Goals: Learning machine learning                                     │
│ </user_memory>                                                       │
│                                                                       │
│ Injected before user message in the message array.                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ LLM RESPONSE                                                         │
│                                                                       │
│ "Based on your love of sci-fi, here are my top recommendations:      │
│  1. Dune by Frank Herbert - Epic space opera...                      │
│  2. Foundation by Isaac Asimov..."                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Four Phases

### Phase 1: Query Classification

Uses a cheap, fast LLM (gpt-oss-20b, ~$0.00001/call) to classify if the query needs personal context.

**Classification Prompt:**
```
CLASSIFICATION RULES:
- "factual": Generic questions with objective answers.
  Math, definitions, facts, code syntax. NO memory needed.
- "personal": Questions about recommendations, preferences,
  projects, or anything where knowing the user helps. Memory NEEDED.
- "ambiguous": Could go either way - lean towards NO memory.

EXAMPLES:
- "What is 2+2?" → factual (math)
- "Convert 5kg to lbs" → factual (conversion)
- "Recommend a book for me" → personal (needs preferences)
- "Help me with my project" → personal (needs context)
```

**Output:**
```typescript
{
  needsMemory: boolean,    // true = retrieve, false = skip
  confidence: number,      // 0.0 to 1.0
  reason: string,          // "Simple math question..."
  queryType: "factual" | "personal" | "ambiguous"
}
```

### Phase 2: Semantic Search with Embeddings

**What are embeddings?**
- Text converted to numbers (vectors)
- 1536 numbers per text for text-embedding-3-small
- Similar meanings = similar vectors = high cosine similarity

**Example:**
```
"I like sci-fi books"     → [0.023, -0.156, 0.089, ...]
"suggest something to read" → [0.018, -0.142, 0.095, ...]

Cosine similarity: 0.72 (high! semantically related)
```

**Why better than keywords?**
- "suggest something to read" has NO words in common with "I like sci-fi books"
- But they're conceptually related
- Embeddings capture meaning, not just words

### Phase 3: Combined Intelligent Retrieval

The new Phase 3 settings add safety nets:

| Setting | Default | Purpose |
|---------|---------|---------|
| `classificationConfidence` | 0.8 | Only trust "skip" if classifier is 80%+ confident |
| `minRelevanceScore` | 0.3 | Skip memories if best match is < 30% similar |
| `alwaysRetrieveForPersonas` | true | Bypass classification for persona chats |

**Logic Flow:**
```typescript
// Persona override
if (isPersonaChat && alwaysRetrieveForPersonas) {
  return retrieveMemories() // Always retrieve
}

// Classification
const result = await classifyQuery(query)

// Confidence check
if (!result.needsMemory && result.confidence >= 0.8) {
  return [] // Skip - classifier is confident it's factual
}

if (!result.needsMemory && result.confidence < 0.8) {
  // Classifier says skip but isn't sure
  // Retrieve anyway to be safe
}

// Semantic search
const memories = await semanticSearch(query)

// Relevance filter
if (topSimilarity < 0.3) {
  return [] // Best match isn't good enough
}

return memories
```

### Phase 4: Settings UI

All intelligent retrieval settings are now configurable in:
**Settings → Experimental → Memory Intelligence**

(Only visible when Memory System is enabled)

---

## Settings Reference

### Basic Memory Settings

| Setting | Default | Location | Description |
|---------|---------|----------|-------------|
| `enabled` | false | Memory Dialog | Master toggle for memory system |
| `autoExtract` | true | Memory Dialog | Auto-extract memories from conversations |
| `syncToDatabase` | false | Memory Dialog | Sync to Supabase for cross-device access |
| `maxMemoriesInContext` | 5 | - | Max memories to inject per query |
| `importanceThreshold` | 2 | - | Minimum importance (1-3) to include |

### Intelligent Retrieval Settings

| Setting | Default | Location | Description |
|---------|---------|----------|-------------|
| `useSemanticSearch` | true | Experimental | Use embeddings for search (recommended) |
| `similarityThreshold` | 0.5 | Experimental | Min similarity to include a memory (0.0-1.0) |
| `classificationConfidence` | 0.8 | Experimental | Min confidence to trust "skip" decision (0.0-1.0) |
| `minRelevanceScore` | 0.3 | Experimental | Skip ALL if best match below this (0.0-1.0) |
| `alwaysRetrieveForPersonas` | true | Experimental | Bypass classification for persona chats |

---

## Fine-Tuning in Experimental Settings

When Memory is enabled, go to **Settings → Experimental** to see **Memory Intelligence** settings:

### Semantic Search Toggle
- **ON (default):** Uses AI embeddings to find memories by meaning
- **OFF:** Falls back to keyword matching (less accurate but no API cost)

### Always Retrieve for Personas Toggle
- **ON (default):** Persona chats always get memory context
- **OFF:** Classification decides for persona chats too

### Classification Confidence Slider (50%-99%)
Controls when to trust the classifier's "skip" decision.

| Value | Behavior |
|-------|----------|
| **50%** | Retrieve unless classifier is very sure (safer, more API calls) |
| **80% (default)** | Good balance - skip when reasonably confident |
| **99%** | Almost never skip (wastes tokens on factual queries) |

**Recommendation:** Keep at 80% unless you notice wrong "skip" decisions.

### Similarity Threshold Slider (20%-80%)
Controls which memories are included in results.

| Value | Behavior |
|-------|----------|
| **20%** | Include loosely related memories (more context, may be noisy) |
| **50% (default)** | Balanced - good relevance |
| **80%** | Very strict - only highly relevant memories |

**Recommendation:** Start at 50%, lower if memories aren't showing up.

### Minimum Relevance Score Slider (10%-50%)
Skip ALL memories if even the best match is below this.

| Value | Behavior |
|-------|----------|
| **10%** | Almost always inject something (may be irrelevant) |
| **30% (default)** | Skip if no memory is reasonably related |
| **50%** | Very strict - skip unless highly relevant |

**Recommendation:** Keep at 30% to prevent irrelevant context.

---

## Database Setup

### Required SQL Scripts

Run these in **Supabase SQL Editor** in order:

**1. Create memories table (scripts/030_add_memories_table.sql):**
```sql
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('preference', 'fact', 'context', 'skill', 'goal')),
  content TEXT NOT NULL,
  category TEXT,
  importance INTEGER NOT NULL CHECK (importance IN (1, 2, 3)),
  source TEXT,
  metadata JSONB DEFAULT '{}',
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memories" ON public.memories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memories" ON public.memories
  FOR DELETE USING (auth.uid() = user_id);
```

**2. Enable pgvector and add embedding column:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_memories_embedding
ON public.memories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**3. Create semantic search function (scripts/032_add_semantic_search.sql):**
```sql
CREATE OR REPLACE FUNCTION search_memories_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, user_id uuid, type text, content text, category text,
  importance int, source text, metadata jsonb, access_count int,
  created_at timestamptz, last_accessed_at timestamptz,
  embedding vector(1536), similarity float
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.user_id, m.type, m.content, m.category, m.importance,
         m.source, m.metadata, m.access_count, m.created_at, m.last_accessed_at,
         m.embedding, 1 - (m.embedding <=> query_embedding) as similarity
  FROM memories m
  WHERE m.user_id = COALESCE(p_user_id, auth.uid())
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) >= match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END; $$;

GRANT EXECUTE ON FUNCTION search_memories_by_embedding TO authenticated;
```

**4. Fix RLS if needed (scripts/031_fix_memories_rls.sql):**
```sql
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;
CREATE POLICY "Users can insert their own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Troubleshooting

### Memories Not Being Retrieved

**Symptom:** You ask "recommend a book" but no memories appear.

**Fixes:**
1. Check console (F12) for `[Memory]` logs
2. Is memory enabled? (brain icon → toggle ON)
3. Do you have memories? (brain icon → check list)
4. Is the query being classified as "factual"? (check logs)
5. Lower `similarityThreshold` in Experimental settings

### Database Sync Failing

**Error:** `new row violates row-level security policy`

**Fix:** Run scripts/031_fix_memories_rls.sql in Supabase SQL Editor.

### Semantic Search Not Working

**Symptom:** Logs show "Falling back to keyword matching"

**Fixes:**
1. Check pgvector is enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';`
2. Run scripts/032_add_semantic_search.sql
3. Check if memories have embeddings (new memories get them automatically)

### Too Many Irrelevant Memories

**Symptom:** Unrelated memories appearing in context.

**Fixes:**
1. Increase `similarityThreshold` (0.5 → 0.6)
2. Increase `minRelevanceScore` (0.3 → 0.4)
3. Delete irrelevant memories

### Memories Skipped Too Often

**Symptom:** Personal queries not getting memory context.

**Fixes:**
1. Lower `classificationConfidence` (0.8 → 0.6)
2. Check if query contains keywords that make it seem "factual"
3. Try rephrasing: "based on my preferences, recommend..."

---

## Cost Breakdown

| Operation | Model | Cost per Call |
|-----------|-------|---------------|
| Query Classification | gpt-oss-20b | ~$0.00001 |
| Query Embedding | text-embedding-3-small | ~$0.00002 |
| Memory Embedding (once) | text-embedding-3-small | ~$0.00002 |
| Memory Extraction | gpt-oss-20b | ~$0.00005 |

**Example monthly costs (active user, 100 queries/day):**
- Classifications: 3000 × $0.00001 = $0.03
- Query embeddings: 1500 × $0.00002 = $0.03
- Memory embeddings: 50 × $0.00002 = $0.001
- **Total: ~$0.06/month**

---

## Privacy

### Local-Only Mode (Default)
- Memories stored in browser's localStorage
- Embeddings stored locally
- Never sent to any server (except OpenRouter for embedding generation)
- Lost if browser data cleared

### Cloud Sync Mode
- Memories stored in your Supabase database
- Protected by Row Level Security (only you can access)
- Embeddings stored in PostgreSQL with pgvector
- Survives browser data clear, accessible on all devices

### What's Sent to OpenRouter
- Memory content (for embedding generation only)
- Query text (for classification and embedding)
- Standard API security (HTTPS, no storage)

---

## API Reference

### MemoryService Methods

```typescript
// Add a memory (embedding generated async if apiKey provided)
memoryService.addMemory({
  type: "preference",
  content: "I like TypeScript",
  importance: 2,
  category: "programming"
}, apiKey)

// Intelligent retrieval (classification + semantic search)
const result = await memoryService.getRelevantMemoriesWithClassification(
  "recommend a programming language",
  apiKey,
  5,     // limit
  false  // isPersonaChat
)
// Returns: { memories, classification, skipped, searchMethod, decision }

// Direct semantic search
const memories = await memoryService.getSemanticRelevantMemories(
  "what should I learn",
  apiKey,
  5
)

// Generate embedding for a memory
await memoryService.embedMemory(memoryId, content, apiKey)

// Embed all memories without embeddings
await memoryService.embedAllMemories(apiKey)

// Get all memories
const all = memoryService.getAllMemories()

// Delete a memory
memoryService.deleteMemory(id)

// Clear all memories
memoryService.clearAllMemories()

// Automatic maintenance methods
await memoryService.runMaintenance(apiKey, force=false)
memoryService.adjustMemoryImportance()
await memoryService.consolidateMemories(apiKey, dryRun=false)
memoryService.shouldRunMaintenance() // Check if maintenance is due
```

### Decision Object

```typescript
interface MemoryRetrievalDecision {
  action: "skipped" | "retrieved" | "empty"
  reason: string
  details: {
    queryType?: "factual" | "personal" | "ambiguous"
    confidence?: number
    searchMethod?: "semantic" | "keyword"
    topSimilarity?: number
    memoryCount?: number
  }
}
```

**Examples:**
```typescript
// Skipped - factual query
{
  action: "skipped",
  reason: "Simple math question with objective answer",
  details: { queryType: "factual", confidence: 0.99 }
}

// Retrieved successfully
{
  action: "retrieved",
  reason: "Retrieved 3 relevant memories via semantic search",
  details: { queryType: "personal", confidence: 0.95, searchMethod: "semantic", topSimilarity: 0.72, memoryCount: 3 }
}

// Empty - low relevance
{
  action: "empty",
  reason: "Best match similarity (0.18) below threshold (0.3)",
  details: { queryType: "personal", confidence: 0.85, searchMethod: "semantic", topSimilarity: 0.18, memoryCount: 0 }
}
```

---

## Future Improvements

- [x] ~~Memory decay (reduce importance over time for unused memories)~~ ✅ **IMPLEMENTED** (see Automatic Memory Maintenance)
- [x] ~~Automatic memory consolidation (merge similar/redundant memories)~~ ✅ **IMPLEMENTED** (see Automatic Memory Maintenance)
- [x] ~~Memory conflicts detection (alert when memories contradict)~~ ✅ **IMPLEMENTED** (consolidation flags conflicts)
- [ ] Per-persona memories (different memories for different personas)
- [ ] Batch embedding on import
- [ ] Memory suggestions based on conversation patterns
- [ ] Temporal context (memories with validity periods)
- [ ] Memory relationships graph

---

## Automatic Memory Maintenance

The memory system includes intelligent automatic maintenance that keeps your memories clean and well-organized.

### What is Automatic Maintenance?

Automatic maintenance runs **daily** in the background and performs three key tasks:

1. **Dynamic Importance Adjustment** - Automatically adjusts memory importance based on actual usage
2. **Memory Consolidation** - Finds and merges duplicate/similar memories
3. **Memory Expiration** - Archives old, unused memories

### How It Works in the Background

#### 1. Dynamic Importance Adjustment ⚡

**Purpose:** Ensure importance reflects actual usefulness, not just initial classification.

**How it works:**
```
For each memory (7+ days old):
  IF accessed 10+ times AND used recently (< 7 days):
    → Boost importance by 1 level (e.g., Medium → High)

  IF NOT accessed in 30+ days AND importance > Low:
    → Reduce importance by 1 level (e.g., High → Medium)

  IF memory is from profile OR category is "personal_info":
    → Skip (profile memories never auto-adjust)
```

**Example:**
- Memory: "User likes TypeScript"
  - Initially: importance = Medium (2)
  - After 30 days: accessed 15 times
  - Result: **Boosted to High (3)**

- Memory: "User tried Rust once"
  - Initially: importance = Medium (2)
  - After 60 days: never accessed
  - Result: **Reduced to Low (1)**

**Benefits:**
- ✅ Frequently used memories get higher priority
- ✅ Unused memories don't clutter high-importance slots
- ✅ Profile memories stay protected

#### 2. Memory Consolidation 🧹

**Purpose:** Find and merge duplicate/semantically similar memories to reduce clutter.

**How it works:**
```
1. Group memories by type (preference, fact, context, skill, goal)
2. For each group:
   a. Send to LLM (gpt-oss-120b by default)
   b. LLM analyzes for duplicates and similarities
   c. LLM decides which to keep and which to merge
   d. Merge access counts from duplicates into kept memory
   e. Delete merged memories
3. Flag conflicts instead of merging
```

**LLM Decision Making:**
```
MERGE: Same thing, different wording
"User likes TypeScript" + "User prefers TS over JS"
→ Keep: "User likes TypeScript" (more detailed)
→ Merge: "User prefers TS over JS"
→ Combined access count: 15 (5 + 10)

CONFLICT: Contradictory information
"User lives in NYC" + "User lives in San Francisco"
→ Flag as conflict (don't merge!)
→ User should resolve manually

KEEP SEPARATE: Different things
"User knows Python" + "User wants to learn Rust"
→ No merge (different memories)
```

**Benefits:**
- ✅ Reduces duplicate memories
- ✅ Preserves access statistics
- ✅ Detects conflicts
- ✅ Keeps memories clean and organized

#### 3. Memory Expiration 🗑️

**Purpose:** Archive old, unused memories to keep the active set relevant.

**How it works:**
```
For each memory not accessed in 7+ days:

  IF source is "profile" OR category is "personal_info":
    → Skip (never expire profile memories)

  IF importance is High (3):
    → Demote to Medium (2)
    → Give 7 more days

  IF importance is Medium or Low:
    → Archive to deleted memories
    → Keep in archive for 14 days
    → Can be restored manually
```

**Archive System:**
- Deleted memories stored separately
- Retained for 14 days (configurable)
- Can be restored manually in Memory Manager
- Automatically purged after retention period

### Running Maintenance

#### Automatic (Background)

Maintenance checks run when:
- ✅ User logs in (check if 24+ hours since last run)
- ✅ Memory system loads (check if maintenance is due)
- ✅ At most once per 24 hours

**Settings:**
```typescript
memorySettings: {
  autoImportanceAdjustment: true,  // Default: ON
  autoConsolidation: false,         // Default: OFF (opt-in)
}
```

#### Manual (Advanced Mode)

In Advanced Mode → Memory Manager:
1. Click **"Run Maintenance"** button
2. System performs all maintenance tasks immediately
3. Shows toast with results:
   - "Adjusted X memories"
   - "Consolidated Y duplicates"

**Force Run:**
```typescript
// Bypass 24-hour limit
await memoryService.runMaintenance(apiKey, force=true)
```

### Maintenance Results

```typescript
{
  success: true,
  ranImportanceAdjustment: true,
  ranConsolidation: true,
  importanceResults: {
    boosted: 3,   // Memories promoted to higher importance
    reduced: 5,   // Memories demoted to lower importance
    skipped: 12   // Profile memories (protected)
  },
  consolidationResults: {
    consolidated: 8,  // Duplicate memories merged
    kept: 42,         // Total memories after consolidation
    details: [
      {
        kept: Memory,    // Memory that was kept
        merged: [Memory, Memory],  // Memories that were merged into it
        reason: "All about TypeScript preference, #0 has most detail"
      }
    ]
  }
}
```

### Configuration

#### Memory Settings

```typescript
memorySettings: {
  // Automatic maintenance
  autoImportanceAdjustment: boolean // Auto-adjust based on usage (default: true)
  autoConsolidation: boolean        // Auto-merge duplicates (default: false, opt-in)
  lastMaintenanceRun: number        // Timestamp of last run

  // Expiration settings
  expirationEnabled: boolean        // Enable expiration (default: true)
  expirationDays: number           // Days before expiration (default: 7)
  archiveRetentionDays: number     // Days to keep in archive (default: 14)
}
```

#### Experimental Settings (Advanced Mode)

Configure which LLM model to use for consolidation:

```typescript
experimental: {
  backgroundAIModels: {
    memoryConsolidation: "openai/gpt-oss-120b"  // Default
  }
}
```

**Recommended Models:**
- `openai/gpt-oss-20b` - Fast & cheap, may miss subtle duplicates
- `openai/gpt-oss-120b` - **Default**, good balance
- `meta-llama/llama-3.1-70b-instruct` - More intelligent, higher cost
- `qwen/qwen-2.5-72b-instruct` - Similar to Llama, good reasoning

### Cost Estimation

**Importance Adjustment:** FREE (no API calls)

**Consolidation (50 memories):**
- gpt-oss-20b: ~$0.0005
- gpt-oss-120b: ~$0.001 (default)
- llama-3.1-70b: ~$0.005

**Typical monthly cost (100 queries/day + daily maintenance):**
- Query classification: $0.03
- Embeddings: $0.02
- Consolidation (weekly): $0.004
- **Total: ~$0.06/month**

### Monitoring Maintenance

Check browser console for logs:
```
[Memory] 🔧 Starting automatic maintenance...
[Memory] Running importance adjustment...
[Memory] Boosted importance: User likes TypeScript...
[Memory] ✅ Importance adjustment complete
[Memory] Running memory consolidation...
[Memory] Found 2 consolidation groups for preference
[Memory] Consolidated 3 memories into: User prefers TypeScript...
[Memory] ✅ Consolidation complete
[Memory] Running expiration check...
[Memory] 🎉 Maintenance complete
```

### Best Practices

**1. Start with Auto-Adjustment Only**
```typescript
autoImportanceAdjustment: true   // Safe, always useful
autoConsolidation: false         // Review results manually first
```

**2. Test Consolidation First**
- Run maintenance manually in Memory Manager
- Review what would be merged
- Enable auto-consolidation once comfortable

**3. Monitor Results**
- Check console logs after maintenance
- Review deleted memories archive
- Restore any incorrectly merged memories

**4. Adjust Retention Periods**
```typescript
expirationDays: 7        // Default: 7 days without use
archiveRetentionDays: 14 // Default: 14 days to restore
```

---

**Note:** Memory decay and automatic consolidation features have been implemented! See the "Automatic Memory Maintenance" section above for details.
