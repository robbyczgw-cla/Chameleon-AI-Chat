# Intelligent Memory System

A state-of-the-art memory system that makes your AI assistant remember important things about you while being smart about when to use that knowledge.

## Table of Contents
- [Quick Start (Simple)](#quick-start-simple)
- [Advanced Usage](#advanced-usage)
- [How It Works](#how-it-works-technical)
- [Settings Reference](#settings-reference)
- [Troubleshooting](#troubleshooting)

---

## Quick Start (Simple)

### Enabling Memory

1. Click the **brain icon** (🧠) in the chat header
2. Toggle **"AI Memory System"** ON
3. That's it! The AI will now remember things about you

### Adding Memories Manually

1. Click the brain icon in the chat header
2. Click **"Add Memory"**
3. Choose a type:
   - **Preference**: Things you like/dislike ("I prefer dark mode", "I hate spicy food")
   - **Fact**: Personal information ("I'm a software engineer", "I live in Berlin")
   - **Context**: Work/project context ("I'm working on a React app")
   - **Skill**: Your abilities ("I know Python", "I'm learning Spanish")
   - **Goal**: What you're trying to achieve ("I want to learn machine learning")
4. Set importance (Low/Medium/High)
5. Save

### What Happens Automatically

- **Auto-extract**: After 4+ messages in a conversation, the AI extracts key facts
- **Smart retrieval**: Memories only appear when relevant (not for "what is 2+2")
- **Cloud sync** (optional): Access memories across devices

---

## Advanced Usage

### Getting Maximum Value

**1. Be Specific in Your Memories**
```
Bad:  "I like programming"
Good: "I prefer TypeScript over JavaScript for large projects"
Good: "I use VSCode with Vim keybindings"
```

**2. Add Context About Your Work**
```
"I'm building a SaaS app for restaurant management"
"My tech stack is Next.js, Supabase, and Tailwind"
"I follow clean architecture principles"
```

**3. Include Communication Preferences**
```
"I prefer concise answers with code examples"
"Explain things like I'm a senior developer"
"Always include TypeScript types in examples"
```

**4. Set High Importance for Critical Info**
- High (3): Things that should almost always be considered
- Medium (2): Useful context that helps personalization
- Low (1): Nice-to-know, only used when highly relevant

### Semantic Search Power

The system uses **embeddings** (AI-generated number representations) to find memories by meaning, not just keywords:

| Your Query | Memory | Why It Matches |
|------------|--------|----------------|
| "suggest something to read" | "I like scifi books" | Conceptually related |
| "help with my project" | "Building a React dashboard" | Context relevance |
| "what should I learn" | "Goal: become ML engineer" | Intent matching |

This means you don't need to use exact words - the AI understands concepts.

### Import/Export for Backup

1. Go to Settings → Memory tab
2. Click **Export** to save all memories as JSON
3. Click **Import** to restore from a backup

---

## How It Works (Technical)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Query                              │
│                  "recommend me a book"                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 1: Query Classification                   │
│                                                              │
│  LLM (gpt-oss-20b) classifies:                              │
│  • "factual" → Skip memory (2+2, definitions, conversions)  │
│  • "personal" → Retrieve memories (recommendations, advice) │
│  • "ambiguous" → Skip to save tokens                        │
│                                                              │
│  Cost: ~$0.00001 per query                                  │
│  Latency: ~500-2000ms                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ (if personal)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 2: Semantic Search                        │
│                                                              │
│  1. Generate query embedding (1536 dimensions)              │
│  2. Compare with memory embeddings using cosine similarity  │
│  3. Return memories above threshold (default 0.5)           │
│                                                              │
│  Embedding Model: openai/text-embedding-3-small             │
│  Cost: ~$0.00002 per query                                  │
│  Latency: ~200-500ms                                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Phase 3: Context Injection                      │
│                                                              │
│  Relevant memories formatted and added to system prompt:    │
│                                                              │
│  <user_memory>                                              │
│  Preferences: I like scifi books; I prefer concise answers  │
│  Facts: I'm a software engineer in Berlin                   │
│  Goals: Learning machine learning                           │
│  </user_memory>                                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              LLM Response                                    │
│                                                              │
│  "Based on your love of sci-fi, I recommend..."             │
└─────────────────────────────────────────────────────────────┘
```

### Memory Storage

**Local Storage (Default)**
- Stored in browser's localStorage
- Key: `chat_memories`
- Persists across sessions
- Maximum privacy - never leaves your device

**Cloud Storage (Optional)**
- Stored in Supabase PostgreSQL with pgvector
- Enables cross-device sync
- Embeddings stored for fast vector search
- Protected by Row Level Security (RLS)

### Embedding Process

When you add a memory:

```typescript
// 1. Memory created locally
const memory = {
  id: "uuid",
  type: "preference",
  content: "I like scifi books",
  importance: 2,
  // ... other fields
}

// 2. Embedding generated asynchronously
const embedding = await generateEmbedding(
  "I like scifi books",
  openRouterApiKey
)
// Returns: [0.023, -0.156, 0.089, ...] (1536 numbers)

// 3. Stored locally and in database
memory.embedding = embedding
localStorage.setItem("chat_memories", JSON.stringify(memories))
await supabase.from("memories").update({ embedding }).eq("id", memory.id)
```

### Semantic Search Algorithm

```typescript
// Cosine similarity: how similar are two vectors?
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Result: 0.0 = completely different, 1.0 = identical meaning
```

**Database-level search (pgvector)**:
```sql
SELECT *, 1 - (embedding <=> query_embedding) as similarity
FROM memories
WHERE user_id = auth.uid()
  AND 1 - (embedding <=> query_embedding) >= 0.5
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

### Query Classification Prompt

The LLM uses this prompt to classify queries:

```
CLASSIFICATION RULES:
- "factual": Generic questions with objective answers.
  Math, definitions, facts, code syntax. NO memory needed.
- "personal": Questions about recommendations, preferences,
  projects, or anything where knowing the user helps.
  Memory NEEDED.
- "ambiguous": Could go either way - lean towards NO memory.

EXAMPLES:
- "What is 2+2?" → factual
- "Recommend a book for me" → personal
- "Help me with my project" → personal
```

---

## Settings Reference

### Memory Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | false | Master toggle for memory system |
| `autoExtract` | true | Automatically extract memories from chats |
| `syncToDatabase` | false | Sync to Supabase for cross-device |
| `maxMemoriesInContext` | 5 | Max memories to inject per query |
| `importanceThreshold` | 2 | Minimum importance (1-3) to include |
| `useSemanticSearch` | true | Use embeddings vs keyword matching |
| `similarityThreshold` | 0.5 | Minimum similarity score (0.0-1.0) |

### Phase 3: Intelligent Retrieval Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `classificationConfidence` | 0.8 | Minimum confidence to trust "skip" decision. If classifier says "factual" with < 0.8 confidence, retrieve anyway to be safe |
| `minRelevanceScore` | 0.3 | If best memory match is below this similarity, skip all memories (prevents irrelevant context) |
| `alwaysRetrieveForPersonas` | true | Bypass classification for persona chats - always retrieve memories |

### Understanding the Flow

```
Query: "recommend a book"
        │
        ▼
┌─────────────────────┐
│ 1. Classification   │
│    → "personal"     │
│    → confidence 0.95│
└─────────┬───────────┘
          │ (needsMemory = true)
          ▼
┌─────────────────────┐
│ 2. Semantic Search  │
│    → 3 memories     │
│    → top sim: 0.72  │
└─────────┬───────────┘
          │ (0.72 >= minRelevanceScore 0.3 ✓)
          ▼
┌─────────────────────┐
│ 3. Inject Context   │
│    → 3 memories     │
│    → decision:      │
│      "retrieved"    │
└─────────────────────┘
```

### Adjusting Similarity Threshold

- **0.3**: Very loose - includes tangentially related memories
- **0.5**: Balanced (default) - good relevance without noise
- **0.7**: Strict - only highly relevant memories
- **0.9**: Very strict - almost exact matches only

---

## Troubleshooting

### Memories Not Showing Up

**Check 1: Is memory enabled?**
- Click brain icon → ensure toggle is ON

**Check 2: Is the query "personal"?**
- Factual queries skip memory retrieval
- Try: "based on what you know about me..."

**Check 3: Are there relevant memories?**
- Check your memory list in the brain icon dialog
- Ensure memories have sufficient importance

### Database Sync Not Working

**Error: "new row violates row-level security policy"**

Run this in Supabase SQL Editor:
```sql
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;
CREATE POLICY "Users can insert their own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Semantic Search Not Working

**Check 1: Is pgvector enabled?**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Check 2: Is the search function created?**
Run `scripts/032_add_semantic_search.sql` in Supabase SQL Editor.

**Check 3: Do memories have embeddings?**
- New memories get embeddings automatically
- Existing memories can be embedded via `memoryService.embedAllMemories(apiKey)`

---

## Cost Breakdown

| Operation | Model | Cost per Call |
|-----------|-------|---------------|
| Query Classification | gpt-oss-20b | ~$0.00001 |
| Memory Embedding | text-embedding-3-small | ~$0.00002 |
| Memory Extraction | gpt-oss-20b | ~$0.00005 |

**Example monthly costs (active user):**
- 100 queries/day × 30 days = 3000 queries
- Classification: 3000 × $0.00001 = $0.03
- Embedding (queries): 1000 × $0.00002 = $0.02
- **Total: ~$0.05/month** for memory system

---

## Privacy Considerations

### Local-Only Mode (Default)
- All memories stored in browser localStorage
- Never sent to any server
- Lost if browser data cleared

### Cloud Sync Mode
- Memories stored in your Supabase database
- Protected by Row Level Security
- Only accessible with your account
- Embeddings stored for search performance

### What's Sent to OpenRouter
- Memory content (for embedding generation)
- Query text (for classification and search)
- Standard API security applies

---

## API Reference

### MemoryService Methods

```typescript
// Add a memory with optional embedding
memoryService.addMemory({
  type: "preference",
  content: "I like TypeScript",
  importance: 2,
  category: "programming"
}, apiKey)

// Get relevant memories with classification
const result = await memoryService.getRelevantMemoriesWithClassification(
  "recommend a programming language",
  apiKey,
  5 // limit
)
// Returns: { memories, classification, skipped, searchMethod }

// Semantic search directly
const memories = await memoryService.getSemanticRelevantMemories(
  "what should I learn",
  apiKey,
  5
)

// Embed all existing memories
await memoryService.embedAllMemories(apiKey)

// Export/import
const all = memoryService.getAllMemories()
memoryService.clearAllMemories()
```

---

## Future Improvements

- [ ] Memory decay (reduce importance over time)
- [ ] Automatic memory consolidation (merge similar memories)
- [ ] Per-persona memories
- [ ] Memory conflicts detection
- [ ] Batch embedding on import
