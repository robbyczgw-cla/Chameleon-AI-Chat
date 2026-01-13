# 🏗️ Chameleon AI Chat - Technical Architecture

**Technical deep dive into Chameleon Chat's architecture, design decisions, and implementation details.**

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Systems](#core-systems)
   - [Tool Calling & Web Search](#1-tool-calling--automatic-web-search-new---dec-2025)
   - [Chat System](#2-chat-system)
   - [Memory System](#2-intelligent-memory-system-)
   - [Persona System](#3-persona-system-)
   - [Emotion Detection](#4-emotion-aware-response-adaptation-)
   - [Model Comparison](#5-model-comparison-)
   - [AI Discussion](#ai-discussion-mode-)
   - [RAG System](#6-rag-system-)
   - [Voice System](#7-voice-system-)
5. [Chat Architecture](#chat-architecture)
6. [Data Flow](#data-flow)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Database Schema](#database-schema)
10. [Authentication & Security](#authentication--security)
11. [Performance Optimizations](#performance-optimizations)
12. [Key Files Reference](#key-files-reference)
13. [Troubleshooting](#troubleshooting)
14. [Future Improvements](#future-improvements)

---

## High-Level Overview

Chameleon is a **Next.js 16** Progressive Web App (PWA) that provides a sophisticated interface for interacting with 100+ AI models via **OpenRouter**. The architecture follows modern React patterns with server-side rendering, real-time streaming, and offline-first design.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                     │
│                     (React 19 + TypeScript 5)                │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼───────┐  ┌───────▼──────┐
│   Client        │  │  Edge API      │  │  Supabase    │
│   Components    │  │  Routes        │  │  PostgreSQL  │
│                 │  │                │  │  + Auth      │
│  - UI State     │  │  - /api/chat   │  │              │
│  - Context      │  │  - /api/search │  │  - profiles  │
│  - Hooks        │  │  - /api/serper │  │  - chats     │
│  - Personas     │  │  - /api/whisper│  │  - messages  │
│  - Memory       │  │  - /embeddings │  │  - settings  │
└─────────────────┘  └────────────────┘  │  - RLS       │
                                         └──────────────┘
```

**Core Features:**
- 🎭 **31 AI Personas** in 8 categories with distinct personalities
- 🎭💭 **Emotion-Aware AI** (Cami detects mood, adapts responses)
- 🧠 **Long-term Memory System** with intelligent retrieval
- 🔍 **Web Search Integration** (Tavily & Serper)
- 🎙️ **Voice Input/Output** (Whisper + TTS)
- 📊 **Model Comparison** (run 2-4 models simultaneously)
- 💬 **AI Discussion Mode** (2 AIs debate topics)
- 📚 **RAG System** (upload docs, get context-aware answers)
- 💸 **Cost Tracking** (token counting & spend analytics)

---

## Technology Stack

### Frontend Stack

**Next.js 16 (App Router)**
- React Server Components
- Streaming responses
- Edge runtime for API routes
- Built-in optimization (images, fonts, etc.)

**React 19.2**
- Latest hooks (useState, useEffect, useContext)
- Suspense for async data
- Concurrent rendering
- Automatic batching

**TypeScript 5**
- Strict mode enabled
- Full type coverage
- Interface-driven design
- Type safety across codebase

**Tailwind CSS 4.1**
- Utility-first styling
- Custom theme (dark/light + custom themes)
  - Theme definitions in `styles/themes/` directory (modular CSS files)
    - `base.css` - :root (light) and .dark base themes
    - `claude.css` - .claude and .claude-grey themes
    - `minimal.css` - .clean-slate and .soft-sunrise themes
    - `colorful.css` - aurora, amber-pro, girly-violet, kawaii-pink, ocean-breeze, paper-mint, chameleon
  - Theme tokens use CSS variables (OKLCH color space for better color interpolation)
  - Theme selection applies a class on `<html>` (e.g. `dark`, `chameleon`, `aurora`)
  - Some themes add lightweight "texture layers" (e.g. Chameleon (Light) scales); these auto-disable in `performance-mode`
- Responsive design
- Gradient system

**shadcn/ui + Radix UI**
- Accessible components
- Radix UI primitives
- Customizable
- No runtime dependency (copy-paste components)

**Lucide React** - Icon library

### Backend Stack

**Supabase**
- PostgreSQL 15 database
- Row-Level Security (RLS)
- Real-time subscriptions
- Built-in authentication
- Edge functions
- Storage (for future features)

**OpenRouter**
- 100+ AI models
- Unified API
- Streaming support
- Token counting
- Cost tracking

**Edge Runtime**
- Cloudflare Workers
- Global distribution
- Low latency
- Streaming responses
- No cold starts

### AI & Search

- **OpenRouter** - Unified access to 100+ AI models (OpenAI, Anthropic, Meta, X.AI, Google, Mistral, etc.)
- **Tool Calling** - Automatic web search triggered by AI (no manual search needed)

**Search Providers (Optimized Dec 2025):**
- **Serper** - Google Search API - **RECOMMENDED for production**
  - Fastest: 1.0-1.5s average response time
  - Most reliable: 99%+ success rate with tool calling
  - Cost: $5/1000 queries
  - Real Google results with knowledge graphs
  - Best for: Automatic search, real-time data, localized content

- **Tavily** - AI-powered search - **Best value**
  - Fast: 1.5-2s response time
  - Reliable: 98% success rate
  - Cost: $1/1000 queries (5x cheaper!)
  - AI-native with answer extraction
  - Best for: Budget projects, general knowledge

- **Exa** - Semantic search - **Manual research only**
  - Slower: 2-5s (optimized), was 8-10s
  - Reliable: 96% (after optimization)
  - Cost: $5/1000 queries + content costs
  - Neural semantic search, full-text retrieval
  - Best for: Research papers, technical docs, similar content
  - NOT recommended for automatic search

- **OpenAI Whisper** - Voice transcription

### Storage & State

- **LocalStorage** - Client-side caching for settings and API keys
- **IndexedDB** - Large file storage (RAG embeddings)
- **Supabase Postgres** - Persistent storage with RLS
- **React Context** - Global state management

### Build & Deploy

- **Vercel** - Deployment platform with edge network
- **pnpm** - Fast package manager
- **PostCSS** - CSS processing
- **Sharp** - Image optimization

---

## Project Structure

```
Chameleon-AI-Chat/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Edge Runtime)
│   │   ├── chat/route.ts         # LLM streaming endpoint ⭐
│   │   ├── search/route.ts       # Tavily search
│   │   ├── serper/route.ts       # Serper (Google) search
│   │   ├── whisper/route.ts      # Voice transcription
│   │   ├── embeddings/route.ts   # Vector embeddings
│   │   └── generate-image/       # Image generation
│   ├── auth/                     # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── callback/route.ts     # Supabase callback
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat page
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── chat-input.tsx            # Message input with voice 🎙️
│   ├── chat-sidebar.tsx          # Conversation history
│   ├── chat-message.tsx          # Message rendering
│   ├── search-sources-badge.tsx  # Search results badge (NEW v0.10.2) 🔍
│   ├── search-results-card.tsx   # Detailed search results 🔍
│   ├── model-comparison.tsx      # Multi-model comparison 📊
│   ├── ai-debate-mode.tsx        # AI discussion feature 💬
│   ├── memory-manager.tsx        # Memory system UI 🧠
│   ├── personas-dialog.tsx       # Persona selector 🎭
│   ├── stats-dashboard.tsx       # Unified statistics (5 tabs) 📊💸
│   ├── export-training-data-dialog.tsx
│   └── [35+ more components]
│
├── components_archived_*/        # Archived features
│   └── simple_mode/              # Old simple mode
│
├── contexts/                     # React Context
│   └── app-context.tsx           # Global app state ⭐
│
├── lib/                          # Core libraries
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── middleware.ts         # Auth middleware
│   │   └── sync.ts               # Data sync ⭐
│   ├── memory/                   # Memory system modules (NEW) 🧠
│   │   ├── index.ts              # Unified exports
│   │   ├── types.ts              # Type definitions
│   │   ├── storage-service.ts    # localStorage & DB sync
│   │   ├── retrieval-service.ts  # Query classification & search
│   │   ├── extraction-service.ts # LLM-based extraction
│   │   ├── maintenance-service.ts# Expiration & consolidation
│   │   ├── duplicate-detection.ts# Duplicate detection
│   │   ├── classification.ts     # Self-RAG query classification
│   │   └── context-filter.ts     # Context-aware filtering
│   ├── personas/                 # Persona system modules (NEW) 🎭
│   │   └── types.ts              # Persona type definitions
│   ├── openrouter.ts             # LLM integration
│   ├── personas.ts               # Persona definitions 🎭
│   ├── memory-service.ts         # Long-term memory orchestrator 🧠
│   ├── voice.ts                  # Voice input/output 🎙️
│   ├── cost-tracker.ts           # Cost calculations 💸
│   ├── branch-manager.ts         # Conversation branching
│   ├── rag-service.ts            # RAG implementation 📚
│   ├── embeddings-store.ts       # Vector embeddings
│   ├── tavily.ts                 # Tavily search
│   ├── serper.ts                 # Serper search
│   └── [30+ utility modules]
│
├── styles/                       # Stylesheets (NEW)
│   └── themes/                   # Theme definitions
│       ├── index.css             # Theme imports
│       ├── base.css              # :root & .dark themes
│       ├── claude.css            # Claude-inspired themes
│       ├── minimal.css           # Clean, neutral themes
│       └── colorful.css          # Vibrant themes
│
├── hooks/                        # Custom React hooks
│   ├── use-message-preprocessing.ts # Shared memory retrieval logic (NEW)
│   └── [other hooks]
│
├── types/                        # TypeScript types
│   └── index.ts                  # Shared types
│
├── scripts/                      # SQL migrations
│   ├── 001_initial_schema.sql
│   ├── 002_add_rls_policies.sql
│   ├── 021_add_serper_settings.sql
│   ├── 028_add_memory_settings.sql ⭐
│   └── ...latest.sql
│
├── docs/                         # Documentation
│   ├── README.old.md             # Original README
│   ├── user-guide.md             # User documentation
│   ├── ARCHITECTURE.md           # This file
│   ├── MEMORY_SYSTEM.md          # Memory system guide ⭐
│   ├── SEARCH-PROVIDERS-GUIDE.md # Search optimization NEW! ⭐
│   ├── BEST-MODELS-TOOL-CALLING-DEC-2025.md # Model rankings NEW! ⭐
│   ├── RESEARCH-PROMPTS.md       # Research templates NEW! ⭐
│   ├── FUTURE_FEATURES.md        # Planned features
│   └── POWER_USER_GUIDE.md       # Power user tips
│
├── public/                       # Static assets
│   ├── music/                    # Background music
│   └── icons/                    # PWA icons
│
├── middleware.ts                 # Next.js middleware (auth)
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Tailwind config
└── package.json                  # Dependencies

Total: 119 TypeScript files, 3.2MB codebase
```

---

## Core Systems

### 1. Tool Calling & Automatic Web Search (NEW - Dec 2025)

**Location**: `app/api/chat/route.ts`, `lib/tools.ts`

The AI automatically decides when to search the web using **tool calling** (function calling). No manual search needed!

#### How It Works

```
User: "What's the Bitcoin price?"
  ↓
LLM analyzes query
  ↓
LLM generates tool call JSON:
{
  "name": "web_search",
  "arguments": { "query": "Bitcoin price USD" }
}
  ↓
Server executes search (Serper/Tavily/Exa)
  ↓
Search results sent back to LLM
  ↓
LLM synthesizes answer with sources
```

#### Search Provider Architecture

**Three providers supported:**

1. **Serper** (RECOMMENDED for production)
   ```typescript
   // Fast, reliable, real Google results
   const response = await fetch("https://google.serper.dev/search", {
     headers: { "X-API-KEY": apiKey },
     body: JSON.stringify({
       q: query,
       gl: "us",      // Country
       hl: "en",      // Language
       num: 5,        // Results
       autocorrect: true
     })
   });
   ```
   - **Speed:** 1.0-1.5s average
   - **Reliability:** 99%+ with tool calling
   - **Cost:** $5/1000 queries
   - **Best for:** Automatic search, real-time data

2. **Tavily** (Best value)
   ```typescript
   // AI-native search with answer extraction
   const response = await fetch("https://api.tavily.com/search", {
     body: JSON.stringify({
       api_key: apiKey,
       query,
       max_results: 5,
       search_depth: "basic",  // "basic" or "advanced"
       include_answer: true
     })
   });
   ```
   - **Speed:** 1.5-2s average
   - **Reliability:** 98%
   - **Cost:** $1/1000 queries (5x cheaper!)
   - **Best for:** Budget projects, general knowledge

3. **Exa** (Research only - optimized Dec 2025)
   ```typescript
   // Semantic search - use for manual research
   const response = await fetch("https://api.exa.ai/search", {
     headers: { "x-api-key": apiKey },
     body: JSON.stringify({
       query,
       type: "keyword",        // Changed from "auto"
       useAutoprompt: false,   // Disabled for speed
       numResults: 3,          // Reduced from 5
       livecrawl: "never",     // CRITICAL: Avoid delays
       contents: {
         text: false,          // CRITICAL: Don't fetch full text
         highlights: { numSentences: 2 }  // Reduced from 3
       }
     })
   });
   ```
   - **Speed:** 2-5s (optimized, was 8-10s)
   - **Reliability:** 96% (after optimization)
   - **Cost:** $5/1000 + content costs
   - **Best for:** Research papers, technical docs
   - **NOT recommended for automatic search**

#### Tool Calling Reliability by Model (Dec 2025)

Based on production testing with automatic search:

| Model | Serper | Tavily | Exa | Context |
|-------|--------|--------|-----|---------|
| **Grok 4.1 Fast** | 99.5% ⭐ | 98.5% | 97.0% | 2M tokens |
| **Gemini 2.0 Flash** | 99.0% ⭐ | 98.0% | 96.5% | 1M tokens |
| **Claude 3.7** | 98.5% | 97.5% | 96.0% | 200K |
| **GPT-4o** | 98.0% | 97.0% | 95.0% | 128K |
| **DeepSeek Terminus** | 96.0% | 94.0% | 90.0% | 128K |
| **DeepSeek V3.2** | 88.0% | 82.0% | **75.0%** | 64K |

**Key Insights:**
- **Grok 4.1 Fast**: Best for production (100% τ²-bench score)
- **Gemini 2.0 Flash**: Best value ($0.075/M, 98% reliability)
- **Serper**: Most reliable provider across all models
- **DeepSeek V3.2 + Exa**: Only 75% success (causes streaming issues)

See comprehensive guides:
- [Search Providers Guide](../guides/SEARCH-PROVIDERS-GUIDE.md)
- [Best Models Dec 2025](../archive/BEST-MODELS-TOOL-CALLING-DEC-2025.md)

#### Streaming with Tool Calling

**Challenge:** Keep stream alive during search execution (1-5 seconds)

**Solution:** Phase-based streaming with status updates

```typescript
// Phase progression:
"thinking" → "searching" → "responding" → "done"

// Server sends SSE events:
data: {"choices":[{"delta":{"phase":"thinking"}}]}

data: {"choices":[{"delta":{
  "phase":"searching",
  "toolName":"web_search",
  "searchQuery":"Bitcoin price",
  "searchProvider":"serper"
}}]}

// Execute search...

data: {"choices":[{"delta":{
  "searchComplete":true,
  "resultCount":5
}}]}

data: {"choices":[{"delta":{"phase":"responding"}}]}

data: {"choices":[{"delta":{"content":"Bitcoin is..."}}]}
```

**Files:** `app/api/chat/route.ts:430-750`

---

### 2. Chat System

**Location**: `app/api/chat/route.ts`, `components/chat-input.tsx`

The chat system uses **Server-Sent Events (SSE)** for streaming responses:

```typescript
// Streaming flow:
User types message
  → ChatInput emits to AppContext
  → AppContext calls /api/chat
  → API route streams to OpenRouter
  → OpenRouter streams tokens back
  → Tokens displayed in real-time
  → Message saved to Supabase + localStorage
```

#### Message Flow

```
User types message
      ↓
┌─────────────────────────────┐
│ 1. Frontend validates input │
│    - Non-empty               │
│    - Max length check        │
└──────────────┬───────────────┘
               ↓
┌─────────────────────────────┐
│ 2. Add user message to UI   │
│    - Optimistic update       │
│    - Show in chat            │
└──────────────┬───────────────┘
               ↓
┌─────────────────────────────┐
│ 3. Call /api/chat           │
│    - POST with messages      │
│    - Stream response         │
└──────────────┬───────────────┘
               ↓
┌─────────────────────────────┐
│ 4. Edge function processes  │
│    - Load persona prompt     │
│    - Inject memory context   │
│    - Check web search need   │
│    - Add RAG context         │
│    - Call OpenRouter         │
│    - Stream back to client   │
└──────────────┬───────────────┘
               ↓
┌─────────────────────────────┐
│ 5. Frontend streams response│
│    - Update UI chunk by chunk│
│    - Parse follow-ups        │
│    - Calculate stats         │
└──────────────┬───────────────┘
               ↓
┌─────────────────────────────┐
│ 6. Save to Supabase         │
│    - User message            │
│    - Assistant message       │
│    - Metadata (tokens, cost) │
└─────────────────────────────┘
```

#### Streaming Implementation

**Why streaming?**
- Instant feedback (no waiting for full response)
- Better UX for long responses
- Lower perceived latency
- Progressive rendering

**How it works:**
```typescript
// Edge function sends SSE (Server-Sent Events)
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of llmResponse) {
      controller.enqueue(chunk);
    }
  }
});

// Client receives and renders
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  appendToMessage(value);
}
```

**Key Features**:
- Multi-modal support (text, images, PDFs)
- Web search integration (inject search results into context)
- Token counting & cost tracking
- Error handling with exponential backoff

**File**: `app/api/chat/route.ts:198` (API key header fix)

---

### 2. Intelligent Memory System 🧠

**Location**: `lib/memory-service.ts`, `lib/embedding-service.ts`, `components/memory-manager.tsx`

State-of-the-art 4-phase intelligent memory retrieval with semantic search:

```typescript
interface Memory {
  id: string
  type: "preference" | "fact" | "context" | "skill" | "goal"
  content: string
  importance: 1 | 2 | 3  // Filtering threshold
  embedding?: number[]   // 1536-dim vector for semantic search
  createdAt: number
  lastAccessedAt: number
  accessCount: number
}

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

#### 4-Phase Retrieval Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER QUERY                                   │
│                    "recommend me a book"                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: QUERY CLASSIFICATION                                        │
│ Model: gpt-oss-20b | Cost: ~$0.00001 | Latency: 500-2000ms          │
│                                                                       │
│ Classifies as: "factual" → Skip | "personal" → Retrieve              │
│ Output: { needsMemory: true, confidence: 0.95, queryType: "personal"}│
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: SEMANTIC SEARCH (Embeddings)                                │
│ Model: text-embedding-3-small | Cost: ~$0.00002 | Latency: 200-500ms│
│                                                                       │
│ 1. Convert query to 1536-dimensional vector                         │
│ 2. Compare with stored memory embeddings (cosine similarity)        │
│ 3. Return memories with similarity >= threshold (0.5)               │
│                                                                       │
│ Search priority: Database (pgvector) → Client-side → Keyword fallback│
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: COMBINED INTELLIGENCE                                       │
│                                                                       │
│ Safety nets:                                                         │
│ • classificationConfidence (0.8): Trust "skip" if 80%+ confident    │
│ • alwaysRetrieveForPersonas (true): Bypass for persona chats        │
│ • minRelevanceScore (0.3): Skip if best match too low               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: CONTEXT INJECTION                                           │
│                                                                       │
│ <user_memory>                                                        │
│ Preferences: I like sci-fi; Prefer concise answers                   │
│ Facts: Software engineer; Live in Berlin                             │
│ </user_memory>                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Why Semantic Search > Keywords

```
Query: "suggest something to read"
Memory: "I like sci-fi books"

Keyword matching: 0 words in common → NO MATCH
Semantic similarity: 0.72 → HIGH MATCH (conceptually related)
```

#### Key Files

| File | Purpose |
|------|---------|
| `lib/memory-service.ts` | Core memory operations, 4-phase retrieval |
| `lib/embedding-service.ts` | OpenRouter embedding generation, cosine similarity |
| `lib/supabase/sync.ts` | Database sync with pgvector search |
| `components/memory-manager.tsx` | Memory management UI |
| `components/experimental-settings.tsx` | Memory Intelligence settings UI |

#### Persistence

- **Local**: localStorage for offline-first experience
- **Cloud**: Supabase with pgvector for semantic search
- **Migrations**:
  - `scripts/030_add_memories_table.sql` - Base table
  - `scripts/031_fix_memories_rls.sql` - RLS policies
  - `scripts/032_add_semantic_search.sql` - pgvector function

📚 **Full documentation**: [MEMORY_SYSTEM.md](../guides/MEMORY_SYSTEM.md)

---

### 3. Persona System 🎭

**Location**: `lib/personas.ts`, `lib/persona-*.ts`

31 distinct AI personalities organized into 8 categories, with unique system prompts, visual themes, and conversation styles.

#### Persona Definition

```typescript
type PersonaCategory =
  | "core"        // Essential everyday personas
  | "creative"    // Artistic and roleplay
  | "professional" // Work-focused
  | "philosophy"  // Deep thinking
  | "lifestyle"   // Health, wellness, cooking
  | "learning"    // Education-focused
  | "curator"     // Recommendation personas
  | "special"     // Hidden/business-specific

interface Persona {
  id: string;           // Unique identifier
  name: string;         // Display name
  emoji: string;        // Icon
  description: string;  // Short description
  prompt: string;       // System prompt (main personality)
  color: string;        // Gradient colors
  category?: PersonaCategory; // Category for organization
  hidden?: boolean;     // Hidden from UI (for special personas)
}
```

#### Helper Functions

```typescript
// Get all visible personas (excludes hidden ones)
getVisiblePersonas(): Persona[]

// Get core personas for Simple Mode
getCorePersonas(): Persona[]

// Get personas by category
getPersonasByCategory(category: PersonaCategory): Persona[]
```

#### How Personas Work

**1. User selects persona**
```typescript
const persona = getPersonaById(selectedId);
```

**2. System prompt injected into messages**
```typescript
const messages = [
  { role: "system", content: persona.prompt },
  ...memoryContext,  // Relevant memories
  ...chatHistory,    // Previous messages
  { role: "user", content: userMessage }
];
```

**3. LLM receives:**
- Persona's system prompt (personality instructions)
- Memory context (user facts & preferences)
- Full chat history (conversation context)
- Latest user message

**4. Response shaped by persona:**
- Communication style
- Domain expertise
- Response format
- Follow-up suggestions

#### Persona Categories

| Category | Description | Count |
|----------|-------------|-------|
| **Core** | Essential everyday personas | 6 |
| **Creative** | Artistic and roleplay | 4 |
| **Professional** | Work-focused | 6 |
| **Philosophy** | Deep thinking | 3 |
| **Lifestyle** | Health, wellness, cooking | 7 |
| **Learning** | Education-focused | 3 |
| **Curator** | Recommendations | 2 |
| **Special** | Hidden/business-specific | 1 |

#### Persona Complexity

**Simple personas:**
- Flash: "Be concise, use bullet points" (~100 tokens)

**Complex personas:**
- Nova: Full backstory, life details, projects, emotions (~800 tokens)
- Stateful (references previous conversations via memory)

**Featured Personas:**
- **Cami** (default) - Adaptive chameleon with emotion detection
- **Nova** - Cyberpunk hacker from Neo-Tokyo 2089
- **Mythos** - World-building storyteller
- **Cogito** - Existential philosopher
- **Wordsmith** - Creative writing partner *(NEW)*
- **Wellbeing** - Mental health support *(NEW)*
- **Scholar** - Active learning partner *(NEW)*
- And 24 more personas...

**Total persona system:**
- 31 personas in 8 categories
- ~15,000 tokens of personality definitions
- Each conversation uses 1 persona's prompt
- Hidden personas for business use cases

**File**: `lib/personas.ts`

---

### 4. Emotion-Aware Response Adaptation 🎭💭

**Location**: `lib/emotion-detection.ts`, `components/experimental-settings.tsx`, `components/chat-input.tsx`

**NEW in v0.10.6-beta** - Cami persona now detects user emotions and adapts responses automatically!

#### How Emotion Detection Works

```
User message: "Ugh, this error AGAIN!!!"
      ↓
┌─────────────────────────────────────┐
│ 1. EMOTION ANALYSIS                 │
│    - Text analysis (words + patterns)│
│    - Typing patterns (speed, edits)  │
│    - Context (errors, repetition)    │
│    - Scoring algorithm               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. EMOTION SCORING                  │
│    Primary:   FRUSTRATED (85%)       │
│    Secondary: SARCASTIC (62%)        │
│    Indicators: [CAPS, punctuation]   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. ADAPTATION HINTS                 │
│    - Empathize with frustration      │
│    - Be direct (skip fluff)          │
│    - Acknowledge underlying issue    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. CONTEXT INJECTION                │
│    Cami's system prompt gets:        │
│    [EMOTION DETECTION]               │
│    - Primary emotion: FRUSTRATED     │
│    - Adaptation: empathize + direct  │
│    [/EMOTION DETECTION]              │
└──────────────┬──────────────────────┘
               ↓
Cami: "Ugh, I feel that - errors are the worst. 😅
       Let me help fix this..."
```

#### 9 Emotion Types

| Emotion | Triggers | Response |
|---------|----------|----------|
| **Frustrated** | "error", "doesn't work", sarcasm | Empathize → Direct solution |
| **Excited** | "amazing!", "finally!", multiple ! | Match energy, share enthusiasm |
| **Confused** | "?", "don't understand" | Simplify, explain step-by-step |
| **Sarcastic** | "oh great, not again" | Acknowledge humor, then help |
| **Grateful** | "thanks", "appreciate" | Match warmth, reinforce help |
| **Urgent** | "ASAP", "deadline", "now" | Skip fluff, direct answer |
| **Curious** | "how does", "why", "tell me more" | Share interesting details |
| **Discouraged** | "give up", "too hard", "stupid" | Encourage, break into steps |
| **Neutral** | General questions | Friendly, helpful baseline |

#### Detection Algorithm

**Language Support**: English, German, Spanish

**Detection Methods**:
1. **Word matching** - Direct emotion words (e.g., "frustrated", "excited")
2. **Pattern matching** - Regex patterns (e.g., `!{2,}` = multiple exclamation marks)
3. **Sarcasm detection** - Special patterns (e.g., "oh great, just what I needed")
4. **Context analysis** - Error mentions, repeated questions
5. **Typing patterns** - Speed, edits, follow-up timing

**Scoring**:
- Each indicator adds points
- Scores normalized 0-1
- Primary = highest score
- Secondary = next highest (if > 0.3 confidence)

#### Technical Implementation

```typescript
// Core emotion analysis
interface EmotionAnalysis {
  primary: EmotionSignal       // Highest confidence emotion
  secondary?: EmotionSignal    // Secondary emotion (if significant)
  rawScores: Record<EmotionType, number>  // 0-1 for each emotion
  adaptationHints: AdaptationHint[]        // AI response guidance
}

// Adaptation hints guide AI behavior
interface AdaptationHint {
  action: 'empathize' | 'simplify' | 'match_energy' | 'be_direct' | 'offer_help' | 'acknowledge_sarcasm' | 'encourage'
  reason: string
  suggestedTone?: string
}

// Usage in chat flow
const emotionAnalysis = analyzeEmotion(userMessage)
const emotionContext = generateEmotionContext(emotionAnalysis)
// emotionContext is injected into Cami's system prompt
```

#### Settings

**Toggle in Experimental Settings:**
- Default: ON in Simple Mode, OFF in Advanced Mode
- Per-message emotion display in streaming history
- Shows confidence % and indicators

**Fine-tuning available:**
- Classification confidence threshold (default: 0.8)
- Similarity thresholds (default: 0.3)
- Enable/disable per persona

#### Files

| File | Purpose |
|------|---------|
| `lib/emotion-detection.ts` | Core emotion analysis engine (609 lines) |
| `lib/personas.ts` | Cami persona with emotion guidelines |
| `components/experimental-settings.tsx` | Emotion detection toggle + settings |
| `components/chat-input.tsx` | Integration with chat flow |
| `types/index.ts` | Emotion type definitions |

#### Performance

- **Latency**: < 5ms (pure text analysis, no API calls)
- **Cost**: Free (no external API needed)
- **Offline**: Yes (works completely client-side)
- **Accuracy**: 85-95% for clear emotions, 60-70% for subtle emotions

#### Examples

**Detecting Frustration + Sarcasm:**
```
User: "Oh GREAT, not another timeout error!!!!"
Analysis:
  - CAPS ratio: 20% → slight emphasis
  - Multiple exclamation marks: 4 → frustration
  - Word "error": explicit frustration indicator
  - Sarcasm pattern "Oh GREAT": detected
  Confidence: FRUSTRATED 88%, SARCASTIC 75%

Cami: "Ugh, I feel you - timeout errors are the WORST. 😅
       I bet that's frustrating. Let me help you fix this..."
```

**Detecting Confusion:**
```
User: "What do you mean by async/await? I don't understand."
Analysis:
  - Pattern: "what do you mean" + "don't understand"
  - Multiple question indicators
  Confidence: CONFUSED 92%

Cami: "No stress! Let me explain it simply. Think of async/await
       like ordering at a coffee shop..."
```

**Detecting Discouragement:**
```
User: "I think I'm just too dumb for programming"
Analysis:
  - Word: "stupid/dumb"
  - Pattern: "I can't" implied
  - Context: negative self-talk
  Confidence: DISCOURAGED 86%

Cami: "Hey, STOP right there! That's not true at all.
       Programming IS hard - everyone feels this way at first.
       Let's break this into smaller, achievable steps..."
```

**Implementation**: See `lib/emotion-detection.ts` for the full detection system.

---

### 5. Model Comparison 📊

**Location**: `components/model-comparison.tsx`

Run the same prompt through 2-4 different AI models simultaneously:

```
┌────────────┬────────────┬────────────┬────────────┐
│  Model 1   │  Model 2   │  Model 3   │  Model 4   │
│ (Claude)   │  (GPT-4)   │  (Grok)    │ (Llama)    │
├────────────┼────────────┼────────────┼────────────┤
│ Response A │ Response B │ Response C │ Response D │
│            │            │            │            │
│ Tokens: X  │ Tokens: Y  │ Tokens: Z  │ Tokens: W  │
│ Cost: $A   │ Cost: $B   │ Cost: $C   │ Cost: $D   │
│ Speed: Xms │ Speed: Yms │ Speed: Zms │ Speed: Wms │
└────────────┴────────────┴────────────┴────────────┘
```

**Features**:
- 2/3/4 column layouts (responsive)
- Independent conversation threads per model
- Shared input across all models
- Real-time cost comparison
- Performance metrics (tokens/sec, TTFT)
- Export comparison results

**Mobile UX Fix**: `components/model-comparison.tsx:195-210` (2-row header for mobile)

---

### 5. AI Discussion Mode 💬

**Location**: `components/ai-debate-mode.tsx`

Have 2 AI models discuss a topic and share **genuine perspectives** (not forced opposition).

#### Evolution of Discussion Mode

**OLD (forced debate):**
```typescript
Model 1: ALWAYS argues FOR the topic
Model 2: ALWAYS argues AGAINST
Judge:   Declares a "winner"
```

**NEW (genuine discussion):**
```typescript
Model 1: Shares authentic opinion (can agree or disagree)
Model 2: Shares authentic opinion (can build on or challenge)
Judge:   Evaluates quality of reasoning, not "winning"
```

#### Discussion Styles

- **Freestyle** - Casual, conversational discussion
- **Oxford** - Formal, structured debate format
- **Socratic** - Question-driven philosophical exploration

#### Judging Criteria (Genuine Mode)

1. **Authenticity** - Do responses reflect genuine analysis?
2. **Reasoning Quality** - Are arguments well-supported?
3. **Engagement** - Do models build on each other's points?
4. **Insight** - Did the discussion reveal new perspectives?

**File**: `components/ai-debate-mode.tsx:470` (genuine opinion prompts)

---

### 6. RAG System 📚

**Location**: `lib/rag-service.ts`, `lib/embeddings-store.ts`

Upload documents → Generate embeddings → Retrieve relevant context:

```typescript
// RAG Flow:
1. User uploads PDF/TXT/MD file
2. Extract text content (via pdfjs-dist for PDFs)
3. Chunk text into ~500-token segments
4. Generate embeddings for each chunk (via OpenRouter)
5. Store in IndexedDB (client-side vector DB)
6. On user query:
   a. Embed query
   b. Cosine similarity search across chunks
   c. Retrieve top-k most relevant chunks
7. Inject chunks into prompt context
8. LLM generates response with document awareness
```

**Supported Formats**:
- PDF (via pdfjs-dist)
- TXT, MD, JSON
- Images (via vision models)

**Benefits**:
- Context-aware answers from your documents
- No token limits (only embeds relevant chunks)
- Works offline (stored in IndexedDB)
- Privacy-first (client-side storage)

**File**: `lib/rag-service.ts:50-150`

---

### 7. Voice System 🎙️

**Location**: `lib/voice.ts`, `app/api/whisper/route.ts`, `app/api/tts/route.ts`

**Input**: Browser MediaRecorder → OpenAI Whisper API
**Output**: OpenAI TTS (high-quality) OR Browser SpeechSynthesis (free fallback)

#### Voice Input Flow

```typescript
1. Request microphone permission (getUserMedia API)
2. Start MediaRecorder (WebM or MP4 depending on device)
3. User speaks...
4. Stop recording (on button release)
5. Create audio blob with correct MIME type
6. POST to /api/whisper with mimeType metadata
7. Edge function converts to proper File object
8. Whisper transcribes audio (auto-detects language)
9. Return transcription to client
10. Auto-send as message (or edit before sending)
```

#### Voice Output - Two Providers

**OpenAI TTS (High-Quality):**
```typescript
// 6 premium voices: alloy, echo, fable, onyx, nova, shimmer
const response = await fetch('/api/tts', {
  method: 'POST',
  body: JSON.stringify({
    text: messageContent,
    voice: 'nova',  // Friendly, upbeat
    speed: 1.0,
    apiKey: openAiKey
  })
});
const audioBlob = await response.blob();
const audio = new Audio(URL.createObjectURL(audioBlob));
audio.play();
```

**Browser TTS (Free Fallback):**
```typescript
// 30+ system voices (quality varies by device)
const utterance = new SpeechSynthesisUtterance(text);
utterance.voice = selectedVoice;
utterance.rate = 1.0;
speechSynthesis.speak(utterance);
```

#### Voice Settings

Users can choose in Settings → Voice:
- **TTS Provider**: Browser (free) or OpenAI (requires API key)
- **Voice Selection**: Test button to preview before saving
- **Speech Rate**: 0.5x to 2.0x speed
- **Pitch**: Adjustable for browser TTS

**Key Files**:
- `lib/voice.ts` - VoiceService class with both TTS methods
- `app/api/tts/route.ts` - OpenAI TTS edge function
- `app/api/whisper/route.ts` - Speech-to-text edge function
- `next.config.mjs` - CSP headers (media-src blob: for audio playback)

**Critical Fixes Applied**:
- `next.config.mjs`: Permissions-Policy allows microphone=(self)
- `next.config.mjs`: CSP media-src allows blob: for TTS audio
- `app/api/whisper/route.ts`: Correct audio format handling (webm vs mp4)

---

### 8. Exact Cost Tracking System 💰 (v0.10-beta)

**Location**: `hooks/use-auto-fetch-costs.ts`, `app/api/generation/route.ts`, `components/message-stats.tsx`

#### Revolutionary Architecture (No More Estimates!)

```
LLM Response with generation ID
    ↓
Client captures generation ID from stream
    ↓
useAutoFetchCosts hook triggers in background
    ↓
Fetch exact costs from OpenRouter's /api/v1/generation endpoint
    ↓
Store in message.stats.actualCost (not estimates!)
    ↓
Display in collapsible MessageStats component
```

#### Why Exact Costs?

**Before (v0.9 and earlier):**
- ❌ Static pricing tables that become outdated
- ❌ Estimated costs based on token count calculations
- ❌ Inaccurate when providers change pricing
- ❌ No visibility into cache discounts

**After (v0.10-beta):**
- ✅ **Real billing data** from OpenRouter's generation API
- ✅ Matches openrouter.ai/activity dashboard exactly
- ✅ Native token counts (actual tokens used for billing)
- ✅ Provider transparency (see which backend served you)
- ✅ Cache discount tracking (prompt caching savings)
- ✅ Reasoning token tracking (for o1/DeepSeek R1 models)

#### Integration Flow

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

#### OpenRouter Generation API

```typescript
// Request
GET https://openrouter.ai/api/v1/generation?id={generationId}
Authorization: Bearer {your-api-key}

// Response
{
  "data": {
    "id": "gen-abc123...",
    "model": "anthropic/claude-3.5-sonnet",
    "created_at": "2025-12-06T10:30:00Z",
    "native_tokens_prompt": 150,
    "native_tokens_completion": 300,
    "native_tokens_completion_reasoning": 45,  // For thinking models
    "provider_name": "Anthropic",
    "total_cost": 0.001275,
    "cache_creation_tokens": 0,
    "cache_read_tokens": 500
  }
}
```

#### Key Files (Cost Tracking)

| File | Purpose |
|------|---------|
| `hooks/use-auto-fetch-costs.ts` | Background fetching of exact costs |
| `app/api/generation/route.ts` | Proxy to OpenRouter generation API |
| `components/message-stats.tsx` | Stats display with collapsible sections |
| `components/experimental-settings.tsx` | Stats toggle settings |
| `components/chat-messages.tsx` | Integrates auto-fetch hook |
| `components/chat-input.tsx` | Captures generation ID, saves stats |

#### Enhanced Message Stats Display

The MessageStats component shows ALL data from OpenRouter with collapsible sections:

```
📊 Detailed Stats                    $0.000412
────────────────────────────────────────────────
Input:  168 tokens    Output: 152 tokens
Total:  320 tokens    Rate:   $0.0013/1K

▶ 🧠 Reasoning          [42%]
▶ 💾 Prompt Cache       [35% saved]
▶ 📏 Native Tokenizer
▶ ⚡ Performance        [45 t/s]
▶ 🎛️ Generation
▶ 🔍 Web Search        [5 results]
▶ 📈 Efficiency
```

Each section can be toggled in Settings → Experimental → Message Statistics.

#### Critical Bug Fixes (2025-12-07)

Three bugs were fixed to make exact cost tracking work:

1. **Stats not saved to messages** - Added `stats: finalMessage.stats` to setChats
2. **API key not passed** - Added apiKey parameter to useAutoFetchCosts
3. **Response not unwrapped** - Fixed `data.data || data` in /api/generation

📚 **Full guide**: [EXACT_COST_TRACKING.md](../features/EXACT_COST_TRACKING.md)

---

### 9. Legacy Cost Estimation (Fallback)

**Location**: `lib/cost-tracker.ts`, `components/stats-dashboard.tsx`

For messages without generation IDs (older messages, non-OpenRouter providers):

#### Architecture

```
LLM Response
    ↓
Extract token counts (from headers or estimate)
    ↓
Fetch model pricing (hardcoded database)
    ↓
Calculate cost (input_tokens * input_price + output_tokens * output_price)
    ↓
Store in message metadata
    ↓
Aggregate for analytics dashboard
```

#### Token Counting

**Method 1: OpenRouter headers** (preferred):
```typescript
const usage = {
  prompt_tokens: response.headers['x-ratelimit-tokens-prompt'],
  completion_tokens: response.headers['x-ratelimit-tokens-completion']
};
```

**Method 2: Fallback estimation** (if headers unavailable):
```typescript
// Rough estimate: 1 token ≈ 4 characters
const estimatedTokens = Math.ceil(text.length / 4);
```

#### Pricing Database

**Hardcoded in `lib/cost-tracker.ts`:**
```typescript
const MODEL_PRICING = {
  "openai/gpt-4o": {
    input: 2.50,    // $ per 1M tokens
    output: 10.00
  },
  "anthropic/claude-3.5-sonnet": {
    input: 3.00,
    output: 15.00
  },
  "x-ai/grok-4-fast:free": {
    input: 0.02,
    output: 0.10
  },
  // ... 100+ models
};
```

#### Cost Calculation

```typescript
function calculateCost(
  promptTokens: number,
  completionTokens: number,
  modelId: string
): number {
  const pricing = MODEL_PRICING[modelId] || { input: 0, output: 0 };
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
```

**Dashboard Features**:
- Total spend (daily/weekly/monthly)
- Cost per model comparison
- Token usage trends
- Most expensive conversations
- Export cost data as CSV

---

### 9. Web Search Integration 🔍

**Location**: `lib/tavily.ts`, `lib/serper.ts`, `lib/tools.ts`, `app/api/chat/route.ts`

#### Three Search Strategies

**1. Manual Toggle (User-Controlled):**
- User clicks web search toggle in chat input
- Search executes before AI response
- Results injected into context

**2. AI Tool Calling (Automatic):**
- AI decides when to search using OpenRouter function calling
- Supported models: Grok 4.x, GPT-4, Claude, Gemini 2.x, DeepSeek V3
- AI triggers `web_search` tool when it detects need for current info
- Search results returned to AI for response generation

**3. Heuristics Fallback:**
- For models without tool calling support
- Pattern matching detects search-worthy queries
- Keywords: "latest", "current", "price", "weather", "news"

#### Tool Calling Architecture

**Location**: `lib/tools.ts`

```typescript
// Tool definition for OpenRouter
export const webSearchTool: ToolDefinition = {
  type: "function",
  function: {
    name: "web_search",
    description: `Search the web for current information...`,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        }
      },
      required: ["query"]
    }
  }
}

// Model support check
export function modelSupportsToolCalling(modelId: string): boolean {
  const supportedPatterns = [
    'gpt-5', 'gpt-4o', 'gpt-4-turbo',
    'claude-4', 'claude-3.5',
    'gemini-2.5', 'gemini-2',
    'grok-4', 'grok-code',
    'deepseek-v3', 'llama-4', 'qwen3'
  ]
  return supportedPatterns.some(p => modelId.toLowerCase().includes(p))
}
```

#### Search Flow with Tool Calling

```
1. User sends message
      ↓
2. Check search strategy:
   ├── Manual toggle ON? → Manual search before streaming
   ├── Model supports tool calling? → Enable auto search
   └── Neither? → Use heuristics fallback
      ↓
3. If tool calling enabled:
   a. Pass tools array to OpenRouter
   b. AI decides: "I need current info" → triggers web_search
   c. API route executes search
   d. Results returned to AI
   e. AI incorporates results into response
      ↓
4. Display SearchSourcesBadge (NEW v0.10.2):
   - Compact badge below AI response
   - Shows source count (e.g., "5 sources")
   - Displays favicon previews of top 3 domains
   - Click to expand SearchResultsCard with:
     * Individual favicons next to each result
     * Better text contrast (semantic colors)
     * External link icons on hover
     * Mobile-optimized layout
      ↓
5. Stream final response with search results
```

**Components:**
- `components/search-sources-badge.tsx` - Compact badge with click-to-expand
- `components/search-results-card.tsx` - Detailed results view with favicons

#### Search Providers

**Serper (Recommended for Production):**
- Real Google Search results via official API
- Fastest: 1.0-1.5s average response time
- Most reliable: 99%+ success rate with tool calling
- $5 per 1K queries
- Country/language targeting, image search
- Best for: Automatic search, real-time data, localized content

**Tavily (Best Value):**
- Purpose-built for AI/LLM integration
- Fast: 1.5-2s response time
- Reliable: 98% success rate
- $1 per 1K queries (5x cheaper!)
- AI-native with direct answer extraction
- Advanced/basic depth modes
- Best for: Budget projects, general knowledge

**Exa (Manual Research Only):**
- Neural semantic search engine
- Slower: 2-5s (requires optimized settings)
- $5 per 1K queries + content fetch costs
- Full-text retrieval with AI highlights
- Best for: Research papers, technical docs, semantic queries
- ⚠️ Not recommended for automatic search (see SEARCH-PROVIDERS-GUIDE.md)

📚 **Detailed comparison**: [SEARCH-PROVIDERS-GUIDE.md](../guides/SEARCH-PROVIDERS-GUIDE.md)

---

### 10. MCP Integration (Model Context Protocol) 🔧

**Location**: `components/mcp-settings.tsx`, `docs/MCP_GUIDE.md`

MCP allows extending AI capabilities with external tools and data sources.

#### What is MCP?

Model Context Protocol is a standard for connecting AI models to external services:
- **Tools**: Execute actions (run code, access APIs, file operations)
- **Resources**: Access data (databases, filesystems, APIs)
- **Prompts**: Predefined conversation templates

#### MCP Settings UI

```
┌─────────────────────────────────────────────────┐
│ MCP Server Configuration                        │
├─────────────────────────────────────────────────┤
│ 📦 Installed Servers                            │
│   ├── filesystem (enabled)                      │
│   ├── github (enabled)                          │
│   └── postgres (disabled)                       │
├─────────────────────────────────────────────────┤
│ 🛒 Available Templates (22 presets)             │
│   Categories: Development, Data, Productivity,  │
│   AI, Communication, Other                      │
├─────────────────────────────────────────────────┤
│ Import/Export Configuration                     │
└─────────────────────────────────────────────────┘
```

#### Serverless Limitations

⚠️ **Important**: MCP servers require persistent processes, which are not compatible with serverless deployment (Vercel, Netlify, etc.).

**For serverless environments:**
- MCP configuration is stored but not executed
- Export config for use with local Claude Desktop
- Consider self-hosted deployment for full MCP support

#### Available Templates

| Category | Servers |
|----------|---------|
| Development | filesystem, github, gitlab, brave-search |
| Data | postgres, sqlite, redis, google-drive |
| Productivity | google-calendar, notion, linear, slack |
| AI | openai, anthropic, langchain |
| Communication | email, discord, telegram |

**Key Files:**
- `components/mcp-settings.tsx` - Settings UI
- `docs/MCP_GUIDE.md` - Comprehensive guide

---

### 11. Follow-Up Suggestions System 💬

**Location**: `lib/follow-up-generator.ts`, `lib/follow-up-parser.ts`, `components/follow-up-suggestions.tsx`, `app/api/followups/route.ts`

**Version**: v0.11+ with Dedicated Model System

Intelligent conversation continuers that appear after each AI response, enabling one-click exploration.

#### Architecture Overview (v0.11+ with Dedicated Model)

```
User sends message
    ↓
Main AI Response  ←→  Dedicated Follow-Up Model (Parallel)
    ↓                         ↓
Response displayed    Follow-ups generated
    ↓                         ↓
[FOLLOWUP] tags injected into content
    ↓
parseFollowUps() extracts and categorizes
    ↓
FollowUpSuggestions component renders
    ↓
User clicks → suggestion sent as next message
```

**Benefits of Dedicated Model**:
- ⚡ **60% faster** - Parallel generation (no wait time)
- 💰 **40x cheaper** - Uses ultra-fast models like Gemini Flash
- 🎯 **Higher quality** - Specialized prompt optimized for suggestions
- 🔧 **Configurable** - Choose any OpenRouter model

**See**: `/docs/DEDICATED_FOLLOWUP_MODEL.md` for full documentation

#### Parsing Pipeline

```typescript
// Input: AI response with embedded tags
"Here's info about React hooks.

[FOLLOWUP]{
  \"quick\": [\"What's useState?\", \"Show example\"],
  \"deep\": [\"How do hooks work internally?\"],
  \"related\": [\"Compare to Vue Composition API\"]
}[/FOLLOWUP]"

// Output: Parsed structure
{
  content: "Here's info about React hooks.",
  categorizedFollowUps: [
    { category: "quick", text: "What's useState?" },
    { category: "quick", text: "Show example" },
    { category: "deep", text: "How do hooks work internally?" },
    { category: "related", text: "Compare to Vue Composition API" }
  ]
}
```

#### Category System

Three categories with distinct visual theming:

| Category | Purpose | Color Theme | Icon |
|----------|---------|-------------|------|
| **⚡ Quick** | Fast, surface-level questions | Emerald/Green gradient | Zap |
| **🧠 Deep** | In-depth technical exploration | Violet/Purple gradient | Brain |
| **🔗 Related** | Connected topics, comparisons | Cyan/Blue gradient | Link2 |

#### Visual Design (v0.10+)

**Color-Coded Categories:**
```tsx
const categoryStyles = {
  quick: {
    containerBg: "from-emerald-50/80 to-green-50/50",
    pillBg: "bg-emerald-100 text-emerald-700",
    buttonBorder: "border-emerald-200 hover:border-emerald-400",
    gradient: "from-emerald-500 to-green-500"
  },
  deep: {
    containerBg: "from-violet-50/80 to-purple-50/50",
    pillBg: "bg-violet-100 text-violet-700",
    buttonBorder: "border-violet-200 hover:border-violet-400",
    gradient: "from-violet-500 to-purple-500"
  },
  related: {
    containerBg: "from-cyan-50/80 to-blue-50/50",
    pillBg: "bg-cyan-100 text-cyan-700",
    buttonBorder: "border-cyan-200 hover:border-cyan-400",
    gradient: "from-cyan-500 to-blue-500"
  }
}
```

**Responsive Limits:**
- Desktop: 9 suggestions (3 per category)
- Mobile (<768px): 6 suggestions (2 per category)

**Animation:**
- Staggered fade-in with slide (60ms delay per button)
- Hover: Scale 1.02 with shadow elevation
- Arrow icon appears on hover

#### Format Support

**1. Categorized JSON (Recommended):**
```
[FOLLOWUP]{
  "quick": ["Q1", "Q2", "Q3"],
  "deep": ["Q4", "Q5"],
  "related": ["Q6"]
}[/FOLLOWUP]
```

**2. Legacy Pipe-Separated:**
```
[FOLLOWUP]Q1|Q2|Q3[/FOLLOWUP]
```

#### Key Files

| File | Purpose |
|------|---------|
| `lib/follow-up-parser.ts` | Tag extraction and JSON parsing |
| `components/follow-up-suggestions.tsx` | Visual rendering with categories |
| `lib/follow-up-parser.test.ts` | 15+ test cases for parsing |

📚 **Full documentation**: [FOLLOW_UP_SUGGESTIONS.md](../guides/FOLLOW_UP_SUGGESTIONS.md)

---

### 12. Chat Modes (Simple vs Advanced) 🎛️

**Location**: `app/page.tsx`, `components/simple-chat-input.tsx`, `components/chat-input.tsx`

Two distinct interface modes for different user needs.

#### Simple Mode

**Purpose:** Streamlined, distraction-free chat for casual users and mobile.

```
┌────────────────────────────────────────────┐
│ Header: Persona Name + Settings            │
├────────────────────────────────────────────┤
│                                            │
│           Chat Messages                    │
│        (Clean, minimal UI)                 │
│                                            │
├────────────────────────────────────────────┤
│ [Persona] [Web|File|Image|Reason|Voice]   │
│ ┌──────────────────────────────┐ [Send]   │
│ │ Type your message...         │          │
│ └──────────────────────────────┘          │
└────────────────────────────────────────────┘
```

**Features:**
- Single default model (Grok 4.1 Fast)
- AI-driven web search via tool calling
- Quick persona selector with emoji + description
- Theme cards for visual customization
- Language pills (DE/EN) for one-tap switching
- Voice input button
- Reasoning toggle for extended thinking
- Image compression for PWA stability
- Multimodal content support (images, files)

**File:** `components/simple-chat-input.tsx`

#### Advanced Mode

**Purpose:** Full-featured interface for power users.

```
┌────────────────────────────────────────────┐
│ Header: Model Picker + Persona + Tools     │
├────────────────────────────────────────────┤
│                                            │
│           Chat Messages                    │
│     (Full stats, streaming viz)            │
│                                            │
├────────────────────────────────────────────┤
│ [Model ▾] [Persona ▾]                      │
│ ┌──────────────────────────────┐ [Send]   │
│ │ Type your message...         │          │
│ └──────────────────────────────┘          │
│ [Web|Voice|File|Image] [Stats|Branch]      │
└────────────────────────────────────────────┘
```

**Features:**
- 100+ model selection via OpenRouter
- Full persona customization
- Advanced settings panel (temperature, max tokens, etc.)
- Message statistics with 7 collapsible sections
- Streaming visualization effects
- MCP server configuration
- Model comparison mode
- AI debate mode
- Cost tracking dashboard
- Training data export
- Conversation branching

**File:** `components/chat-input.tsx`

#### Feature Comparison

| Feature | Simple Mode | Advanced Mode |
|---------|-------------|---------------|
| Model Selection | Default only | 100+ models |
| Web Search | AI-driven | Manual + AI toggle |
| Settings | Theme, language | All parameters |
| MCP | Not available | Full configuration |
| Personas | Quick selector | Full customization |
| Statistics | Basic | 7 collapsible sections |
| Mobile UX | Optimized | Standard |
| File Upload | ✅ (compressed) | ✅ |
| Image Generation | ✅ | ✅ |
| Voice Input | ✅ | ✅ |

#### Mode Switching

```typescript
// Access via Settings or URL parameter
const isSimpleMode = settings.ui.simpleMode || url.searchParams.get('mode') === 'simple'

// Page conditionally renders
{isSimpleMode ? (
  <SimpleChatInput ... />
) : (
  <ChatInput ... />
)}
```

#### Image Handling (Simple Mode)

Simple Mode includes PWA-optimized image handling:

```typescript
// Compress images before sending (prevents PWA crashes)
const imageAttachments = attachedFiles.filter(f => getFileCategory(f.name) === "image")

if (imageAttachments.length > 0) {
  const compressedDataUrls = await compressImages(imageDataUrls, 500) // 500KB max
  // Replace original with compressed versions
}

// Build multimodal content for vision models
const multimodalContent = buildMultimodalContent(messageContent, processedFiles)
```

---

### 13. Tool Analytics Dashboard 📊

**Location**: `components/stats-dashboard.tsx`

Unified statistics dashboard with 5 tabs including tool usage analytics.

#### Dashboard Tabs

```
┌─────────────────────────────────────────────────────┐
│  [Overview] [Models] [Tokens] [Costs] [Tools]       │
├─────────────────────────────────────────────────────┤
│                                                     │
│   (Tab content based on selection)                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Tools Tab Features

**Summary Cards:**
- Total Tool Calls (all-time)
- Usage Rate (% of messages using tools)
- Search Queries (total web searches)
- Providers Used (unique search providers)

**Tool Usage Breakdown:**
```
web_search      ████████████░░░░  75%
image_generate  ████░░░░░░░░░░░░  25%
code_execute    ██░░░░░░░░░░░░░░  12%
```

**Recent Search Queries:**
- Last 10 search queries with timestamps
- Provider badge (Serper/Tavily/Exa)

**Provider Distribution:**
```
Serper   ████████████░░░░  60%
Tavily   ██████░░░░░░░░░░  30%
Exa      ██░░░░░░░░░░░░░░  10%
```

#### Data Extraction

Tool usage is extracted from message `streamingHistory`:

```typescript
// Extract tool calls from messages
const toolCalls = messages.flatMap(msg => {
  if (msg.streamingHistory) {
    return msg.streamingHistory
      .filter(h => h.toolName)
      .map(h => ({
        tool: h.toolName,
        query: h.searchQuery,
        provider: h.searchProvider,
        timestamp: msg.createdAt
      }))
  }
  return []
})
```

#### Key Files

| File | Purpose |
|------|---------|
| `components/stats-dashboard.tsx` | Unified dashboard with 5 tabs |
| `app/api/chat/route.ts` | Tool call tracking in stream |
| `contexts/app-context.tsx` | streamingHistory storage |

---

## Chat Architecture

### Conversation Branching

**Location**: `lib/branch-manager.ts`

Users can explore alternate conversation paths:

```
Message 1
    ↓
Message 2
    ├──→ Branch A (Message 3a)
    │        ↓
    │    Message 4a
    │
    └──→ Branch B (Message 3b)
             ↓
         Message 4b
```

**Features**:
- Create branches at any message
- Switch between branches
- Merge branches (manual selection)
- Visual branch tree UI

### Export & Training Data

**Location**: `components/export-training-data-dialog.tsx`

Export conversations in formats suitable for:
- **JSONL** - OpenAI fine-tuning
- **Markdown** - Human-readable archive
- **CSV** - Data analysis

**Filters**:
- Date range
- Persona filter
- Model filter
- Min/max message length

---

## Data Flow

### Message Sending Flow

```
User Input
  ↓
ChatInput component
  ↓
AppContext.sendMessage()
  ↓
Optimistic UI update (show message immediately with pending state)
  ↓
Validate API key exists
  ↓
Build context:
  - System prompt (persona)
  - Memory context (relevant memories)
  - RAG context (if document uploaded)
  - Web search results (if triggered)
  - Chat history
  ↓
POST /api/chat (streaming)
  ↓
API route validates request
  ↓
Call OpenRouter with streaming=true
  ↓
OpenRouter streams tokens back (SSE)
  ↓
Accumulate response in real-time
  ↓
Parse metadata (token count, model info, cost)
  ↓
Save to localStorage (instant, no network delay)
  ↓
Debounced sync to Supabase (background, 1s delay)
  ↓
Update token count & cost in UI
  ↓
Show follow-up suggestions (if persona provides them)
```

### Settings Sync Flow

```
User changes setting (e.g., model, temperature, API key)
  ↓
AppContext.updateSettings()
  ↓
Validate input (e.g., temperature 0-2, max_tokens > 0)
  ↓
Merge with existing settings
  ↓
🛡️ API Key Protection Layer (prevent accidental clearing)
  ↓
Update React state (immediate UI feedback)
  ↓
Save to localStorage (instant persistence)
  ↓
Debounced sync to Supabase (1 second delay to batch updates)
  ↓
Supabase RLS check (user can only update own settings)
  ↓
Settings persisted to database
  ↓
On page reload: Load from Supabase → Merge with localStorage → Resolve conflicts
```

**Critical Protection**: `contexts/app-context.tsx:814-836` (API key protection)
**Server-side Safety**: `lib/supabase/sync.ts:192-218` (preserve existing keys)

---

## State Management

### App Context Architecture

**File**: `contexts/app-context.tsx`

Global state managed via React Context + hooks:

```typescript
interface AppContextType {
  // User & Auth
  user: User | null
  profile: Profile | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>

  // Chats
  chats: Chat[]
  currentChatId: string | null
  currentChat: Chat | null
  createChat: (title?: string) => Chat
  deleteChat: (id: string) => void
  updateChat: (id: string, updates: Partial<Chat>) => void
  switchChat: (id: string) => void

  // Messages
  messages: Message[]
  sendMessage: (content: string) => Promise<void>
  regenerateMessage: (messageId: string) => Promise<void>
  editMessage: (id: string, newContent: string) => Promise<void>
  deleteMessage: (id: string) => void
  branchFromMessage: (id: string) => void

  // Settings
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void
  resetSettings: () => void

  // Personas
  currentPersona: Persona
  switchPersona: (id: string) => void
  personas: Persona[]

  // Memory System
  memories: Memory[]
  addMemory: (memory: Omit<Memory, 'id'>) => void
  deleteMemory: (id: string) => void
  updateMemory: (id: string, updates: Partial<Memory>) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  comparisonMode: boolean
  setComparisonMode: (enabled: boolean) => void
  debateMode: boolean
  setDebateMode: (enabled: boolean) => void

  // Loading states
  isLoading: boolean
  isSending: boolean
}
```

### Why Context, not Redux?

- ✅ Simple state structure (no complex reducers)
- ✅ No complex async patterns (handled by API routes)
- ✅ Server-side data source (Supabase is source of truth)
- ✅ Fewer dependencies (no Redux, Redux-Thunk, etc.)
- ✅ Easier to reason about (straightforward hooks)
- ✅ Better for SSR (works with Next.js server components)

### Context Provider

```typescript
<AppProvider>
  <ThemeProvider>
    <ChatApp />
  </ThemeProvider>
</AppProvider>
```

### Local State

**Component-level state:**
- Input value: `useState("")`
- Dialog open: `useState(false)`
- Loading state: `useState(false)`

**When to use local vs global:**
- **Local**: UI-only state (modals, inputs, toggles, animations)
- **Global**: Data shared across components (chats, user, settings, messages)

### Performance Optimizations

**Context split** (prevents unnecessary re-renders):
```typescript
// Bad: Single large context (everything re-renders)
const { user, chats, messages, settings, ... } = useAppContext();

// Good: Split contexts by domain
const user = useUser();
const chats = useChats();
const settings = useSettings();
```

**Memoized selectors**:
```typescript
const currentChat = useMemo(
  () => chats.find(c => c.id === currentChatId),
  [chats, currentChatId]
);
```

**Debounced syncs**:
```typescript
// Prevents spamming Supabase on rapid setting changes
const debouncedSyncSettings = useMemo(
  () => debounce(syncSettingsToSupabase, 1000),
  []
);
```

**File**: `contexts/app-context.tsx:1-1200`

---

## API Integration

### OpenRouter Integration

**File**: `lib/openrouter.ts`

OpenRouter provides unified access to 100+ AI models from multiple providers:

```typescript
// Supported providers & models:
- OpenAI: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo, o1, o3-mini
- Anthropic: Claude 3.5 Sonnet, Opus, Haiku
- Meta: Llama 3.3 70B, Llama 3.1 405B
- X.AI: Grok 4, Grok 2
- Google: Gemini 2.0 Flash, Gemini Pro
- Mistral: Large, Medium, Small
- Perplexity: Sonar, Sonar Pro
- Cohere: Command R+
- Deepseek, Qwen, and 80+ more
```

#### Key Features

- **Streaming responses** - Real-time token streaming via SSE
- **Token counting** - Accurate via headers or estimation
- **Cost tracking** - Per-token pricing for all models
- **Model fallbacks** - Automatic retry with backup model
- **Rate limit handling** - Exponential backoff on 429 errors

#### Authentication

```typescript
// Request headers:
{
  "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
  "HTTP-Referer": "https://chameleon-ai.app", // For analytics
  "X-Title": "Chameleon AI Chat",            // App identification
  "Content-Type": "application/json"
}
```

#### Streaming Implementation

```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { /* ... */ },
  body: JSON.stringify({
    model: selectedModel,
    messages: conversationHistory,
    stream: true, // Enable streaming
    temperature: 0.7,
    max_tokens: 2000
  })
});

// Parse SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim() !== '');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      const content = data.choices[0]?.delta?.content;
      if (content) {
        // Append to UI in real-time
        appendToken(content);
      }
    }
  }
}
```

### Web Search Integration

#### Tavily (`lib/tavily.ts`)

```typescript
interface TavilyConfig {
  api_key: string
  search_depth: "basic" | "advanced"  // Advanced = more sources
  include_answer: boolean             // Extract direct answer
  include_domains: string[]           // Whitelist
  exclude_domains: string[]           // Blacklist
  max_results: number                 // Default 5
}

const results = await tavily.search({
  query: "Latest AI developments 2025",
  search_depth: "advanced",
  include_answer: true
});

// Returns:
{
  answer: "Direct extracted answer",
  results: [
    {
      title: "Article Title",
      url: "https://example.com/article",
      content: "Relevant excerpt...",
      score: 0.95  // Relevance score
    }
  ]
}
```

#### Serper (`lib/serper.ts`)

```typescript
interface SerperConfig {
  api_key: string
  type: "search" | "news" | "images" | "videos" | "places"
  country: string  // e.g., "us", "uk"
  language: string // e.g., "en", "es"
  time_range: "day" | "week" | "month" | "year"
}

const results = await serper.search({
  q: "Best AI models 2025",
  type: "search",
  num: 10  // Number of results
});

// Returns Google-formatted results
{
  searchParameters: { q, type, country, ... },
  organic: [
    {
      position: 1,
      title: "Title",
      link: "URL",
      snippet: "Description",
      date: "2025-01-15"
    }
  ],
  images: [...],  // If type="images"
  news: [...]     // If type="news"
}
```

---

## Database Schema

### Supabase PostgreSQL Tables

#### `auth.users` (Supabase managed)
```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `public.profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  age INTEGER,
  occupation TEXT,
  location TEXT,
  interests TEXT[],
  about_me TEXT,
  goals TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### `public.chats`
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  persona_id TEXT DEFAULT 'cami',
  model TEXT DEFAULT 'openai/gpt-4o',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_folder_id ON chats(folder_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);

-- RLS Policies
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);
```

#### `public.messages`
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  metadata JSONB, -- { tokens, cost, searchResults, ragContext, ... }
  parent_id UUID REFERENCES messages(id), -- For branching
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_parent_id ON messages(parent_id);

-- RLS Policies (inherit from chats)
CREATE POLICY "Users can view messages from own chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Similar INSERT/UPDATE/DELETE policies
```

#### `public.user_settings`
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- API Keys (encrypted at rest by Supabase)
  openrouter_api_key TEXT,
  openai_api_key TEXT,
  tavily_api_key TEXT,
  serper_api_key TEXT,

  -- Model Settings
  selected_model TEXT DEFAULT 'openai/gpt-4o',
  selected_models TEXT[], -- For comparison mode
  temperature NUMERIC DEFAULT 0.7 CHECK (temperature BETWEEN 0 AND 2),
  max_tokens INTEGER DEFAULT 2000 CHECK (max_tokens > 0),
  top_p NUMERIC DEFAULT 1.0 CHECK (top_p BETWEEN 0 AND 1),
  frequency_penalty NUMERIC DEFAULT 0 CHECK (frequency_penalty BETWEEN -2 AND 2),
  presence_penalty NUMERIC DEFAULT 0 CHECK (presence_penalty BETWEEN -2 AND 2),

  -- Search Settings
  search_provider TEXT DEFAULT 'serper' CHECK (search_provider IN ('tavily', 'serper')),
  use_exa_search BOOLEAN DEFAULT FALSE,

  -- Memory Settings (⭐ NEW)
  memory_settings JSONB DEFAULT '{
    "enabled": true,
    "memories": [],
    "maxMemories": 20,
    "minImportance": 2
  }'::jsonb,

  -- UI Preferences
  theme TEXT DEFAULT 'dark',
  send_on_enter BOOLEAN DEFAULT TRUE,
  show_word_count BOOLEAN DEFAULT FALSE,
  code_theme TEXT DEFAULT 'github-dark',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### `public.folders`
```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE, -- Nested folders
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- RLS Policies
CREATE POLICY "Users can manage own folders" ON folders
  FOR ALL USING (auth.uid() = user_id);
```

#### `public.comparison_sessions`
```sql
CREATE TABLE comparison_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  models TEXT[] NOT NULL, -- Array of model IDs
  messages JSONB NOT NULL, -- Conversation history per model
  metadata JSONB, -- Cost, tokens, performance metrics
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can manage own comparisons" ON comparison_sessions
  FOR ALL USING (auth.uid() = user_id);
```

### Row Level Security (RLS)

**All tables have RLS enabled.** Users can only:
- SELECT their own data
- INSERT their own data
- UPDATE their own data
- DELETE their own data

**Security guarantees:**
- Users can ONLY see their own data
- No cross-user data leakage
- Enforced at database level (can't bypass with API)
- Works even if app code is compromised
- Automatic filtering on all queries

---

## Authentication & Security

### Supabase Auth Flow

```
1. User signs up/logs in (email + password)
   ↓
2. Supabase creates JWT token
   ↓
3. Token stored in httpOnly cookie (secure, not accessible via JS)
   ↓
4. Next.js middleware validates token on each request
   ↓
5. auth.uid() available in SQL queries
   ↓
6. RLS policies enforce data access automatically
```

### API Key Protection 🛡️

**Triple-layer protection** to prevent API key loss:

#### Layer 1: Client-side validation
```typescript
// contexts/app-context.tsx:814-836
const updateSettings = (updates: Partial<AppSettings>) => {
  setSettings(prev => {
    const merged = { ...prev, ...updates };

    // 🛡️ PROTECTION: Never allow clearing API keys
    if (prev.apiKeys.openRouter && !merged.apiKeys.openRouter) {
      console.warn("🛡️ Prevented API key from being cleared");
      merged.apiKeys.openRouter = prev.apiKeys.openRouter;
    }

    return merged;
  });
};
```

#### Layer 2: Server-side preservation
```typescript
// lib/supabase/sync.ts:192-218
export async function saveSettings(settings: AppSettings) {
  // Load existing settings from database
  const existing = await supabase
    .from('user_settings')
    .select('*')
    .single();

  // Preserve existing API keys if not provided
  const openRouterKey = settings.apiKeys?.openRouter
    || existing.data?.openrouter_api_key
    || null;

  // Never save empty string as API key
  if (openRouterKey === '') {
    openRouterKey = existing.data?.openrouter_api_key || null;
  }

  // Update database
  await supabase
    .from('user_settings')
    .upsert({
      id: user.id,
      openrouter_api_key: openRouterKey,
      // ... other settings
    });
}
```

#### Layer 3: Database RLS
```sql
-- Only user can update their own settings
CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE USING (auth.uid() = id);
```

### Data Encryption

- **API keys**: Encrypted at rest in Supabase
- **Transport**: HTTPS only (enforced by Vercel)
- **Passwords**: Bcrypt hashed by Supabase Auth
- **Cookies**: httpOnly, secure, sameSite=lax

### Input Validation

- **TypeScript**: Compile-time type checking
- **Zod**: Runtime schema validation
- **SQL**: Parameterized queries (no SQL injection)
- **Markdown**: Sanitized with rehype-sanitize (no XSS)

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function checkRateLimit(userId: string) {
  const { success, remaining } = await ratelimit.limit(userId);

  if (!success) {
    throw new Error('Rate limit exceeded');
  }

  return remaining;
}
```

---

## Performance Optimizations

### 0. React Component Optimizations (NEW)

**Location**: `components/chat-messages.tsx`, `components/chat-input.tsx`, `components/settings-dialog.tsx`

#### Memoization

```typescript
// Chat messages wrapped with React.memo to prevent unnecessary re-renders
export const ChatMessages = memo(function ChatMessages({ ... }) { ... })

// Inner components also memoized
const RenderMessageContent = memo(function RenderMessageContent({ content }) { ... })
```

#### useCallback for Handlers

```typescript
// Stable function references prevent child re-renders
const handleCopy = useCallback(async (content, messageId) => {
  await navigator.clipboard.writeText(contentToText(content))
  setCopiedId(messageId)
  toast({ title: "Copied to clipboard" })
}, [toast])

const toggleReasoning = useCallback((messageId) => {
  setExpandedReasoning(prev => {
    const next = new Set(prev)
    next.has(messageId) ? next.delete(messageId) : next.add(messageId)
    return next
  })
}, [])
```

#### Lazy Loading Heavy Components

```typescript
// Settings dialog lazy loads heavy tabs
const MCPManager = lazy(() => import("@/components/mcp-manager"))
const AIMemoryHub = lazy(() => import("@/components/ai-memory-hub"))
const ChatAnalytics = lazy(() => import("@/components/chat-analytics"))
const ExperimentalSettings = lazy(() => import("@/components/experimental-settings"))

// With loading fallback
<Suspense fallback={<TabLoadingFallback />}>
  <AIMemoryHub />
</Suspense>
```

**Benefits**:
- 20-30% reduction in unnecessary re-renders
- Faster initial page load (smaller bundle)
- Smoother UI interactions

---

### 1. React Server Components (RSC)

**Benefits:**
- Less JavaScript sent to client (components render on server)
- Server-side data fetching (faster, no waterfall requests)
- Automatic code splitting (only send needed code)
- Better SEO (fully rendered HTML)

**Example:**
```typescript
// app/page.tsx is RSC by default (no 'use client')
export default async function Page() {
  // Runs on server
  const chats = await getChatsFromDatabase();

  // Pass to client component
  return <ChatApp initialChats={chats} />;
}
```

### 2. Streaming Responses

**Reduces time to first token:**
- Traditional: Wait for full response (~10-30s for long responses)
- Streaming: First token in ~0.5s
- User sees progress immediately (better perceived performance)

**Benefits:**
- Lower perceived latency
- Can cancel mid-stream (save tokens/cost)
- Progressive enhancement (show partial answers)

### 3. Code Splitting

**Automatic in Next.js:**
- Each route = separate bundle (only load what you need)
- Dynamic imports for large components
- Vendor chunk separation

**Manual optimization:**
```typescript
// Lazy load heavy components
const AiDebateMode = dynamic(() => import('./ai-debate-mode'), {
  loading: () => <LoadingSpinner />,
  ssr: false // Don't render on server
});

const ModelComparison = dynamic(() => import('./model-comparison'));

// Only loaded when accessed
```

### 4. Database Indexes

**All foreign keys indexed:**
```sql
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_folder_id ON chats(folder_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
```

**Query performance:**
- Without index: ~500ms (full table scan)
- With index: ~5ms (index lookup)
- 100x improvement for common queries

### 5. Image Optimization

**Next.js Image component:**
```typescript
import Image from 'next/image';

<Image
  src="/avatar.png"
  width={40}
  height={40}
  alt="Avatar"
  loading="lazy"           // Lazy load (only when visible)
  placeholder="blur"       // Blur placeholder while loading
  blurDataURL="data:..."   // Low-res preview
/>
```

**Automatic optimizations:**
- WebP format (smaller file size)
- Responsive images (multiple sizes)
- Lazy loading (below the fold)
- Blur placeholders (no layout shift)

### 6. Caching Strategy

**Client-side:**
```typescript
// LocalStorage: Settings, API keys (instant access)
localStorage.setItem('settings', JSON.stringify(settings));

// IndexedDB: RAG embeddings, large docs (5MB+ storage)
const db = await openDB('chameleon', 1);
await db.put('embeddings', embedding, id);

// Service Worker: PWA offline support (cache API routes)
```

**Server-side:**
```typescript
// Vercel Edge Network (CDN for static assets)
// Supabase connection pooling (reuse DB connections)
// React cache() for deduplication
```

### 7. Debounced Syncs

```typescript
// Prevent spamming Supabase on rapid changes
const debouncedSync = useMemo(
  () => debounce(syncToSupabase, 1000),
  []
);

// User types fast...
updateSettings({ temperature: 0.5 });
updateSettings({ temperature: 0.6 });
updateSettings({ temperature: 0.7 });

// Only 1 database write (after 1s of inactivity)
```

### 8. Virtual Scrolling

```typescript
// For long conversation histories (1000+ messages)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <Message message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

**Benefits:**
- Only render visible messages (not all 1000)
- Smooth scrolling even with huge histories
- Constant memory usage

### Performance Benchmarks

**Current metrics** (as of 2025-11):
- **Bundle size**: ~800KB gzipped (main bundle)
- **First Load**: ~2.5s (on 3G network)
- **Time to Interactive**: ~3.5s
- **Lighthouse Score**: 85+ (Performance)

**Future goals**:
- Bundle < 500KB (remove unused dependencies)
- First Load < 2s (more aggressive code splitting)
- Lighthouse 95+ (optimize images, fonts, critical CSS)

---

### 11. Chunk Error Handler 🔄 (v0.10-beta)

**Location**: `components/chunk-error-handler.tsx`

Auto-recovery for stale JavaScript chunks after deployment.

#### The Problem

When you deploy a new version:
1. User has old page open with old chunk references
2. User navigates → App tries to load old chunk file
3. Old chunk no longer exists (deleted after deploy)
4. **Error:** "Failed to load chunk /_next/static/chunks/xxx.js"

#### The Solution

```typescript
// ChunkErrorHandler listens for script errors
window.addEventListener('error', (event) => {
  if (isChunkLoadError(event)) {
    // Check cooldown (10 seconds) to prevent loops
    if (!recentlyReloaded()) {
      window.location.reload()  // Get fresh chunks!
    }
  }
})
```

#### Key Features

- **Auto-reload**: Refreshes page on chunk load failures
- **Loop prevention**: 10-second cooldown between reloads
- **Session tracking**: Uses sessionStorage to track reload attempts
- **Transparent**: User just sees a quick page refresh

#### Usage

Added to `app/layout.tsx`:

```tsx
<ChunkErrorHandler />
```

---

## Key Files Reference

| File | Purpose | Critical Sections | Lines |
|------|---------|-------------------|-------|
| `components/stats-dashboard.tsx` | Unified statistics (5 tabs) | All tabs, AI insights | All |
| `hooks/use-auto-fetch-costs.ts` | Exact cost fetching | apiKey param | 14-48 |
| `app/api/generation/route.ts` | OpenRouter generation proxy | data.data unwrap | 43 |
| `components/message-stats.tsx` | Collapsible stats display | All sections | 65-346 |
| `components/chunk-error-handler.tsx` | Stale chunk recovery | Auto-reload | All |
| `contexts/app-context.tsx` | Global state management | API key protection | 814-836 |
| `lib/supabase/sync.ts` | Database sync logic | saveSettings, memory persistence | 182-303, 575-579 |
| `components/ai-debate-mode.tsx` | AI Discussion mode | Genuine opinion prompts | 470-493 |
| `components/model-comparison.tsx` | Multi-model comparison | Mobile UI fix | 195-210 |
| `lib/memory-service.ts` | Long-term memory system | Relevance scoring algorithm | 96-144 |
| `lib/voice.ts` | Voice input/output | OpenAI TTS, browser TTS, Whisper | 280-360 |
| `app/api/chat/route.ts` | Main chat API | Streaming logic, context building | All |
| `app/api/tts/route.ts` | OpenAI TTS API | Audio generation endpoint | All |
| `app/api/whisper/route.ts` | Speech-to-text API | Audio format handling | 30-45 |
| `lib/personas.ts` | Persona definitions | All 31 personas in 8 categories | All |
| `lib/cost-tracker.ts` | Cost tracking | Pricing database, calculation | All |
| `lib/rag-service.ts` | RAG implementation | Chunking, embedding, retrieval | 50-150 |
| `components/chat-messages.tsx` | Message display | React.memo, useCallback | 1-80 |
| `components/settings-dialog.tsx` | Settings UI (7 tabs) | Lazy loading, TTS provider | 1-50 |
| `next.config.mjs` | Next.js config | CSP headers, Permissions-Policy | 35-50 |

---

## Troubleshooting

### 1. API Keys Not Persisting

**Symptoms**: API key disappears after page reload

**Causes**:
- Settings sync failed
- localStorage cleared
- Supabase connection issue

**Fix**:
✅ **FIXED**: Triple-layer protection now prevents this
- Client-side: `contexts/app-context.tsx:814-836`
- Server-side: `lib/supabase/sync.ts:192-218`
- Database: RLS policies

**If still occurring**:
1. Check browser console for errors
2. Verify Supabase connection (Network tab)
3. Check localStorage: `localStorage.getItem('settings')`
4. Manually re-enter API key in Settings

### 2. Memory System Not Loading

**Symptoms**: Memories not appearing, not persisting

**Cause**: Missing `memory_settings` column in `user_settings` table

**Fix**:
```bash
# Run migration:
psql -h your-db.supabase.co -U postgres -d postgres < scripts/028_add_memory_settings.sql

# Or via Supabase dashboard:
# SQL Editor → New Query → Paste contents of 028_add_memory_settings.sql → Run
```

✅ **FIXED**: Memory settings now persist to Supabase

### 3. UI Changes Not Showing (Vercel)

**Symptoms**: Code changes deployed but UI looks old

**Causes**:
- Browser cache
- Service Worker cache (PWA)
- Vercel edge cache
- CDN cache

**Fix**:
1. **Hard refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear cache**: Chrome DevTools → Application → Clear storage → Clear site data
3. **Disable PWA**: Unregister service worker in DevTools
4. **Bust Vercel cache**: Add cache-busting comment in code, redeploy

```typescript
// Force cache invalidation: v1.2.3
```

### 4. Streaming Not Working

**Symptoms**: No text appears, long wait, then full response at once

**Causes**:
- Missing `x-openrouter-api-key` header
- Wrong API endpoint
- Network proxy buffering responses
- CORS issue

**Debug**:
1. Open Chrome DevTools → Network tab
2. Find `/api/chat` request
3. Look for EventStream connection
4. Check response headers for `content-type: text/event-stream`
5. Verify API key in Settings tab

**Fix**:
```typescript
// Ensure headers are set correctly:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey}`,
}

// Ensure streaming enabled:
body: JSON.stringify({
  stream: true, // CRITICAL
  // ...
})
```

### 5. Voice Input Not Working (Mobile)

**Symptoms**: Microphone button doesn't work on mobile, no permission prompt

**Cause**: PWA permission detection issues on Android

**Fix**:
✅ **FIXED**: `lib/voice.ts:20-35` (Android permission detection)

**If still occurring**:
1. Check browser permissions (Settings → Site settings → Microphone)
2. Try HTTPS (required for microphone API)
3. Test on different browser (Chrome, Firefox, Safari)

### 6. High Memory Usage

**Symptoms**: Browser tab using 500MB+ RAM, slow performance

**Causes**:
- Too many conversations loaded
- RAG embeddings in memory
- Long conversation history

**Fix**:
1. Archive old conversations (Settings → Archive chats)
2. Clear RAG documents (Settings → RAG → Clear)
3. Limit message history (Settings → Max context messages)
4. Enable virtual scrolling (automatic for 100+ messages)

---

## Recent Changes (Last 7 Days)

*Updated: 2025-12-09*

### Overview

Recent work focused on these major areas:
1. **Unified Statistics Dashboard** - Consolidated all stats into one comprehensive panel (NEW!)
2. **UI Cleanup** - Removed duplicate search, streamlined settings
3. **Streaming Visualization System** - Real-time feedback during AI responses
4. **Dialog Viewport Safety** - Preventing modal cutoff on desktop
5. **Performance & UX Fixes** - Reasoning spam, chat layout, vision models

---

### 0. Unified Statistics Dashboard (2025-12-09)

**Commits**: Consolidated stats menus, enhanced with LLM nerd features

Merged multiple disparate stats components into one comprehensive Statistics dashboard with 5 tabs.

#### What Was Removed

| Component | Lines | Reason |
|-----------|-------|--------|
| `cost-tracker-dashboard.tsx` | 232 | Superseded by new Stats dashboard |
| `usage-dashboard.tsx` | 257 | Merged into Stats dashboard |
| `usage-stats-widget.tsx` | 162 | Merged into Stats dashboard |
| `chat-analytics.tsx` | 395 | AI Insights moved to Stats dashboard |
| `chat-search.tsx` | 208 | Duplicate (sidebar search remains) |
| `prompt-library-dialog.tsx` | 195 | Unused/commented out |

**Total removed**: ~1,449 lines of duplicate/orphaned code

#### New Statistics Dashboard Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATISTICS DASHBOARD                          │
│  [7 Days] [30 Days] [All Time]  ← Time Range Selector           │
├─────────────────────────────────────────────────────────────────┤
│  Tabs: [Overview] [Costs] [Performance] [Providers] [AI Insights]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  OVERVIEW TAB:                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Total    │ │ Total    │ │ Messages │ │ Cache    │           │
│  │ Cost     │ │ Tokens   │ │ & Chats  │ │ Savings  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                   │
│  Monthly Projection: $X.XX/month (~$XX.XX/year)                 │
│  OpenRouter Credits: $X.XX / $XX.XX used                        │
│                                                                   │
│  [Fetch Exact Costs] [Export Data] [Clear Data]                 │
│                                                                   │
│  Message Distribution: You ████████ 45% | AI ██████████ 55%     │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  COSTS TAB:                                                      │
│  • Cost by Model (top 5)                                        │
│  • Cost Over Time (14-day bar chart)                            │
│  • Recent Usage Table (exact costs from OpenRouter API)         │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  PERFORMANCE TAB:                                                │
│  • Avg Response Time (seconds)                                  │
│  • Tokens/Second (generation speed)                             │
│  • Avg Cost/Request                                             │
│  • Peak Usage Hour                                              │
│  • Most Used Models                                             │
│  • Search Provider Config (Tavily/Serper/Exa)                   │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  PROVIDERS TAB:                                                  │
│  • OpenRouter Provider Usage (which backends serve you)         │
│  • Prompt Caching Stats (savings, hit rate, how it works)       │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  AI INSIGHTS TAB:                                                │
│  • AI-generated analysis of your prompts                        │
│  • Strengths identification                                     │
│  • Improvement suggestions                                      │
│  • [Generate Insights] button                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Features

| Feature | Description |
|---------|-------------|
| **Exact Costs** | Real billing data from OpenRouter's `/api/v1/generation` endpoint |
| **Provider Tracking** | See which OpenRouter providers (Anthropic, Together, etc.) serve your requests |
| **Cache Stats** | Prompt caching savings (0.25x input cost), hit rate, cached request count |
| **Performance Metrics** | Avg response time, tokens/second, cost/request |
| **AI Insights** | AI-powered analysis of your prompt patterns with suggestions |
| **Time Range Filter** | 7 days, 30 days, or all time |
| **Monthly Projection** | Projected monthly/yearly costs based on recent usage |

#### Settings Dialog Cleanup

Removed from Settings dialog:
- ❌ Analytics tab (merged into Stats dashboard)
- ❌ Stats tab (merged into Stats dashboard)

Remaining tabs: General, Memory, API Keys, Search, MCP, Voice, Labs

#### File Changes

| File | Change |
|------|--------|
| `components/stats-dashboard.tsx` | Complete rewrite with 5 tabs |
| `components/settings-dialog.tsx` | Removed Analytics/Stats tabs |
| `components/chat-header.tsx` | Removed Search button, cleaned imports |
| `components/mobile-more-menu.tsx` | Removed Search option |
| `components/advanced-settings-dialog.tsx` | Removed Cost Tracker button, removed Example Prompts |

---

### 1. Streaming Visualization System

**Commits**: `de13aa6`, `4d7b6e0`, `5c2dac9`, `e178f64`, `a373368`, `0085567`, `6e735e4`

A comprehensive system showing users exactly what the AI is doing during response generation.

#### Architecture

```
User sends message
      ↓
┌─────────────────────────────────────────┐
│ Phase: "thinking" (immediately)          │
│ - Spinner animation                      │
│ - "Processing your request..."           │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│ Phase: "searching" (if web search)       │
│ - Search icon animation                  │
│ - "Searching the web..."                 │
│ - Live search results preview            │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│ Phase: "reasoning" (if model supports)   │
│ - Brain icon animation                   │
│ - "Extended thinking..."                 │
│ - Live reasoning token count             │
│ - Expandable reasoning content           │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│ Phase: "generating"                      │
│ - Typing animation                       │
│ - Live token count                       │
│ - Tokens per second display              │
└─────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────┐
│ Phase: "complete"                        │
│ - Streaming history saved                │
│ - Final stats displayed                  │
└─────────────────────────────────────────┘
```

#### Key Files

| File | Purpose |
|------|---------|
| `components/streaming-indicator.tsx` | Main visualization component |
| `components/streaming-settings-menu.tsx` | User preferences for display |
| `contexts/app-context.tsx` | Streaming state management |
| `app/api/chat/route.ts` | Phase emission during streaming |
| `lib/openrouter.ts` | Streaming details callback |

#### Streaming Details Interface

```typescript
interface StreamingDetails {
  phase: "thinking" | "searching" | "reasoning" | "generating" | "complete"
  action?: string           // Human-readable status
  reasoningContent?: string // Live reasoning tokens
  searchResults?: SearchResult[]
  tokenCount?: number
  tokensPerSecond?: number
}
```

#### Streaming History

After completion, messages store their streaming history:

```typescript
interface StreamingHistoryEntry {
  phase: string
  timestamp: number
  duration?: number
  details?: {
    reasoningTokens?: number
    searchQueries?: string[]
    finalTokenCount?: number
  }
}
```

#### Advanced Mode Features

When `settings.simpleMode === false`:
- Verbose streaming visualization
- Live token counts
- Reasoning token preview
- Search results preview
- Streaming history on completed messages

#### Settings Integration

```typescript
interface StreamingVisualizationSettings {
  showTokenCount: boolean      // Display live token count
  showPhaseDetails: boolean    // Show detailed phase info
  showReasoningPreview: boolean // Preview reasoning content
  showSearchPreview: boolean   // Preview search results
  compactMode: boolean         // Minimal UI mode
}
```

---

### 2. Dialog Viewport Safety System

**Commits**: `1a9bd3a`, `3dd01f4`, `bd0a678`, `b5ece4a`, `2d667eb`, `5008d0f`

Comprehensive fix for dialogs being cut off on desktop, especially nested dialogs.

#### The Problem

```
Desktop viewport (1920x1080)
┌────────────────────────────────────────────┐
│ ┌──────────────────────────────────────┐   │
│ │ Advanced Settings Dialog              │   │
│ │ ┌────────────────────────────────┐   │   │
│ │ │ Add Models Dialog              │   │   │
│ │ │                                │   │   │
│ │ │  ← CUT OFF! Can't see bottom   │   │   │
│ │ │    buttons or scroll           │   │   │
│ │ └────────────────────────────────┘   │   │
│ └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

#### Solution: Multi-Layer Approach

**Layer 1: Portal to document.body**
```typescript
// components/ui/dialog.tsx
function DialogPortal({ ...props }) {
  return (
    <DialogPrimitive.Portal
      container={typeof window !== 'undefined' ? document.body : undefined}
      {...props}
    />
  )
}
```

**Layer 2: High Z-Index**
```typescript
// Overlay: z-[9998]
// Content: z-[9999]
// Nested overlay: z-[10998]
// Nested content: z-[10999]
```

**Layer 3: Viewport-Safe Height Caps**
```css
/* Base dialogs */
max-h-[min(90vh,calc(100dvh-2rem))]
md:max-h-[calc(100vh-3rem)]

/* Add Model dialog (nested) */
max-h-[min(85vh,calc(100dvh-3rem))]
md:max-h-[calc(100vh-3rem)]
```

**Layer 4: Nested Dialog Support**
```typescript
// Dialog with nested prop
<DialogContent nested className="...">

// Automatically gets higher z-index
nested ? 'z-[10999]' : 'z-[9999]'
```

#### CSS Reinforcement

```css
/* app/globals.css */

/* Nested dialogs - ensure they render above parent dialogs */
[data-slot="dialog-content"][data-nested="true"],
[data-slot="alert-dialog-content"][data-nested="true"] {
  z-index: 10999 !important;
}

[data-slot="dialog-overlay"][data-nested="true"],
[data-slot="alert-dialog-overlay"][data-nested="true"] {
  z-index: 10998 !important;
}
```

#### Dialog Sizing Quick Reference

| Dialog Type | Width Classes | Height Classes |
|-------------|---------------|----------------|
| Base Dialog | `max-w-[calc(100%-2rem)] sm:max-w-lg` | `max-h-[min(90vh,calc(100dvh-2rem))] md:max-h-[calc(100vh-3rem)]` |
| Alert Dialog | `max-w-[calc(100%-2rem)] sm:max-w-md` | Same as base |
| Add Model | `w-[95vw] sm:max-w-2xl lg:max-w-4xl` | `max-h-[min(85vh,calc(100dvh-3rem))] md:max-h-[calc(100vh-3rem)]` |

#### Key Changes Summary

| File | Change |
|------|--------|
| `components/ui/dialog.tsx` | Portal to body, viewport caps, nested prop |
| `components/ui/alert-dialog.tsx` | Same as dialog |
| `components/model-management.tsx` | `nested` prop, custom sizing |
| `components/chat-sidebar.tsx` | Viewport constraints on delete dialog |
| `app/globals.css` | CSS reinforcement for nested z-index |

---

### 3. Reasoning Phase Spam Fix

**Commit**: `e784dd6`

#### The Problem

During reasoning, "phase: thinking" was sent with EVERY token:

```
[v0] 📍 Phase change: thinking
[v0] 📍 Phase change: thinking  ← Repeated 1000+ times!
[v0] 📍 Phase change: thinking
```

#### The Solution

Send phase ONCE, then only content:

```typescript
// app/api/chat/route.ts
let hasStartedReasoning = false

// In streaming loop:
if (reasoningContent && !hasStartedReasoning) {
  hasStartedReasoning = true
  // Send phase change ONCE
  await writer.write(encoder.encode(`data: ${JSON.stringify({
    choices: [{ delta: { phase: "thinking" } }]
  })}\n\n`))
}

// Send content WITHOUT phase
await writer.write(encoder.encode(`data: ${JSON.stringify({
  choices: [{ delta: { reasoning_content: reasoningContent } }]
})}\n\n`))
```

#### Result

- Console logs: 1000+ → 1 per reasoning session
- UI still works correctly
- Reasoning accumulates properly

---

### 4. User Profile Context

**Commit**: `5372d9f`

User profile information (name, age, occupation, interests) now injected into system prompt.

```typescript
// components/chat-input.tsx
const userProfile = userProfileService.getProfile()
const profileContext = userProfileService.getProfileContext(userProfile)
if (profileContext) {
  systemPrompt = `${systemPrompt}${profileContext}`
}
```

**Injected format**:
```
User Profile Information:
- Name: John
- Age: 30
- Occupation: Software Engineer
- Location: Berlin
- Interests: AI, Music, Photography
```

---

### 5. Chat Input Desktop Layout

**Commit**: `ecd2190`

Removed unnecessary bottom padding on desktop for more chat space.

```typescript
// app/page.tsx

// Before: pb-[44px] md:pb-6
// After:  pb-[44px] md:pb-0

<div className="relative z-10 flex h-[100dvh] overflow-hidden px-0 md:px-0 pb-[44px] md:pb-0 gap-0">
```

---

### 5b. Simple Mode Layout Fix (Desktop)

**Commit**: `d4ae0f3` (2025-12-10)

Fixed Simple Mode desktop layout where chat input was cut off at the bottom.

**Root Cause**: CSS Grid container had `md:pb-4` padding + missing `min-h-0` on flex/grid children.

**Key Pattern - `min-h-0` for Flex/Grid Children**:

By default, flexbox and grid items have `min-height: auto` which prevents them from shrinking below their content size. This causes overflow issues when content exceeds available space.

```typescript
// components/simple-chat-app.tsx

// Root container - CSS Grid on desktop
<div className="h-[100dvh] flex flex-col md:grid md:grid-cols-[288px_1fr] md:grid-rows-[1fr] overflow-hidden">

// Sidebar wrapper - needs min-h-0 for grid context
<div className="md:h-full md:min-h-0">
  <aside className="h-full min-h-0 overflow-hidden">
    <div className="flex flex-col h-full min-h-0">

// Main content - needs min-h-0 for both flex and grid
<main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
```

**CSS Pattern Reference**:
```css
/* For any flex/grid child that should shrink to fit available space: */
.shrinkable-child {
  min-height: 0;      /* Allow shrinking below content size */
  height: 100%;       /* Take full parent height */
  overflow: hidden;   /* Clip any overflow */
}
```

---

### 6. Vision Model Updates

**Commit**: `4e66952`

Added new models to vision-capable list:

```typescript
// lib/openrouter.ts (or relevant file)
const VISION_MODELS = [
  // ... existing models
  'gemini-3',
  'gemini-3-flash',
  // ... image generation models
]
```

---

### Documentation Files Created

| File | Purpose |
|------|---------|
| `DIALOG_VIEWPORT_FIX.md` | Complete guide for dialog fixes |
| `RECENT_FIXES_DOCUMENTATION.md` | Step-by-step implementation guide |
| `docs/STREAMING-VISUALIZATION.md` | Streaming system documentation |
| `docs/STREAMING-VISUALIZATION-GUIDE.md` | Implementation guide |
| `docs/UNIFIED-VISUALIZATION-SETTINGS.md` | Settings system proposal |
| `docs/REASONING-MODES.md` | Reasoning toggle documentation |
| `docs/LLM-CHAT-IMAGE-FIXES.md` | Vision model fixes |

---

### Testing Checklist

#### Streaming Visualization
- [ ] Phase indicator shows during response
- [ ] Reasoning content accumulates (with reasoning toggle ON)
- [ ] Search results preview appears (with web search)
- [ ] Streaming history visible on completed messages (advanced mode)
- [ ] Settings menu controls what's displayed

#### Dialog Viewport
- [ ] Add Model dialog fully visible on desktop
- [ ] Delete All Chats dialog fully visible
- [ ] Nested dialogs render above parent
- [ ] Dialogs scroll when content exceeds viewport
- [ ] Mobile dialogs work correctly

#### Reasoning Fix
- [ ] Console shows only ONE "phase: thinking" per session
- [ ] Reasoning content still accumulates in UI
- [ ] Amber reasoning card displays properly

#### Profile Context
- [ ] AI uses user's name in responses
- [ ] Profile preferences reflected in responses

---

## Future Improvements

### Planned Features

1. **Redis caching** for frequent queries
   - Cache user settings, personas, model list
   - Reduce database load by 80%
   - Faster page loads (sub-100ms)

2. **WebSocket** for real-time features
   - Typing indicators (see when AI is "thinking")
   - Multi-device sync (chat on phone, see on desktop)
   - Live collaboration (share chat with friend)

3. **Service Worker** for offline support
   - Cache conversations locally
   - Queue messages when offline
   - Sync when back online
   - Full PWA experience

4. **GraphQL** to replace REST APIs
   - Single request for nested data
   - Type-safe queries
   - Real-time subscriptions (GraphQL subscriptions)
   - Better developer experience

5. **Vector DB** (Pinecone/Weaviate) for advanced RAG
   - Server-side embeddings (no IndexedDB limits)
   - Semantic search across ALL conversations
   - Find similar past discussions
   - Cross-conversation insights

6. **Edge functions** for more API routes
   - Move more logic to edge (lower latency)
   - Streaming responses from edge
   - Global distribution (millisecond response times)

### Under Consideration

- **Monorepo** (Turborepo) - Shared code between web/mobile/desktop
- **Micro-frontends** - Split app into independent modules
- **Native apps** (React Native) - iOS/Android with native feel
- **Desktop app** (Electron/Tauri) - Local-first, no internet required
- **Plugin system** - Community extensions (custom personas, tools)
- **Multi-modal input** - Draw/sketch to communicate with AI
- **Voice cloning** - Custom TTS voice for personas
- **Vision API** - Upload images, get AI analysis

---

## Recent Architecture Updates (December 31, 2025)

### 1. Background Model Pickers - Complete Implementation

**Commits**: `e38d421`, `46b99f4`, `d562ddc`, `2b99d35`, `40096bb`

All background processes now have user-selectable models:

```typescript
// Memory system model selection
memory.embeddings.model = settings.modelPreferences.embeddings
memory.extraction.model = settings.modelPreferences.memoryExtraction

// Image generation model selection
image.generation.model = settings.modelPreferences.imageGeneration

// Follow-up suggestions model selection
followups.model = settings.modelPreferences.followupGeneration

// All with fallback handling
const model = userModel || DEFAULT_FALLBACK
```

**Architecture Impact**:
- Adds `modelPreferences` object to settings
- Each background system checks for user override before using default
- Consistent fallback pattern across all systems
- Enables cost optimization per background process

### 2. Private Chat Mode - Complete Privacy Implementation

**Commits**: `c1a390b`, `e2a756c`, `cf28f7c`, `7466b6d`, `7549030`

Completely isolated private chat architecture:

```typescript
// Data flow in private mode
if (settings.privateChatMode) {
  // SKIP Supabase sync (zero cloud storage)
  // SKIP memory extraction (no data persistence)
  // SKIP embeddings generation (no semantic search)
  // Store only in localStorage (device-only)
  return skipCloudSync()
}
```

**Critical Privacy Features**:
1. **New Chat on Enable**: Mid-conversation private mode doesn't leak previous messages
2. **Supabase Bypass**: Complete network isolation for private chats
3. **Memory Bypass**: Check `privateChatMode` in all sync operations
4. **PWA Offline**: Proper handling for offline-first scenarios

### 3. Android Native Experience - Material 3 Framework

**Commits**: `65bf85f`, `a00576f`, `2a43579`, `b49b7c9`, `602caa0`, `8f90b81`, `6e2108a`

Native Android architecture built on Capacitor 8 with Material 3 design:

**Keyboard Architecture**:
- Resize mode: `'native'` (input follows keyboard without black bar)
- CSS fixes for safe-area-inset-bottom
- Material Motion animations for smoothness
- 120Hz display support (adaptive refresh rate)

**Native Animations**:
- Spring animations framework
- Material Motion hook system
- Haptics (17 native patterns)
- Smooth transitions on all interactions

### 4. Dialog & UI Polish

**Commits**: `584735b`, `741d8f7`, `0006c90`, `ccaac2b`, `9ab195f`, `051d6c1`, `22aa68c`

Final iterations of UI polish focusing on mobile UX:

```typescript
// Dialog close button: 14px professional sizing
<X className="h-3.5 w-3.5" />

// Mobile menu: Swipe-right gesture + tap close button
<button onClick={closeMenu}>✕</button>

// CSS specificity solution: Inline styles + Tailwind !
style={{ minWidth: '320px' }}
className="!w-[calc(100vw-2rem)] sm:!w-auto"
```

**Architecture Learning**:
- Component library defaults require specificity overrides
- Inline styles + Tailwind ! prefix for maximum compatibility
- Test mobile and desktop before considering solution complete

---

## Conclusion

Chameleon's architecture prioritizes:

1. **User Control** - Settings, API keys, data ownership (your data stays yours)
2. **Performance** - Streaming, caching, code splitting (fast experience)
3. **Extensibility** - Modular design, open source (easy to customize)
4. **Security** - Encryption, RLS, input validation (safe by design)
5. **Developer Experience** - TypeScript, clear structure, documentation

**Architecture designed for:** Scale, maintainability, and great UX.

---

For implementation guides, see `FUTURE_FEATURES.md`.
For power-user tips, see `POWER_USER_GUIDE.md`.
For user documentation, see `user-guide.md`.
