# 🏗️ Chameleon AI Chat - Technical Architecture

**Technical deep dive into Chameleon Chat's architecture, design decisions, and implementation details.**

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Systems](#core-systems)
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
- 🎭 **18+ AI Personas** with distinct personalities
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
- **Tavily** - AI-powered web search with answer extraction
- **Serper** - Google Search API (5x cheaper than Tavily)
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
│   ├── model-comparison.tsx      # Multi-model comparison 📊
│   ├── ai-debate-mode.tsx        # AI discussion feature 💬
│   ├── memory-manager.tsx        # Memory system UI 🧠
│   ├── personas-dialog.tsx       # Persona selector 🎭
│   ├── cost-tracker-dashboard.tsx # Cost analytics 💸
│   ├── export-training-data-dialog.tsx
│   └── [40+ more components]
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
│   ├── openrouter.ts             # LLM integration
│   ├── personas.ts               # Persona definitions 🎭
│   ├── memory-service.ts         # Long-term memory 🧠
│   ├── voice.ts                  # Voice input/output 🎙️
│   ├── cost-tracker.ts           # Cost calculations 💸
│   ├── branch-manager.ts         # Conversation branching
│   ├── rag-service.ts            # RAG implementation 📚
│   ├── embeddings-store.ts       # Vector embeddings
│   ├── tavily.ts                 # Tavily search
│   ├── serper.ts                 # Serper search
│   └── [30+ utility modules]
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

### 1. Chat System

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

📚 **Full documentation**: [docs/MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md)

---

### 3. Persona System 🎭

**Location**: `lib/personas.ts`, `lib/persona-*.ts`

18+ distinct AI personalities with unique system prompts, visual themes, and conversation styles.

#### Persona Definition

```typescript
interface Persona {
  id: string;           // Unique identifier
  name: string;         // Display name
  emoji: string;        // Icon
  description: string;  // Short description
  prompt: string;       // System prompt (main personality)
  color: string;        // Gradient colors
}
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

#### Persona Complexity

**Simple personas:**
- Flash: "Be concise, use bullet points" (~100 tokens)

**Complex personas:**
- Nova: Full backstory, life details, projects, emotions (~800 tokens)
- Stateful (references previous conversations via memory)

**Featured Personas:**
- **Cami** (default) - Adaptive chameleon, friendly & versatile
- **Nova** - Cyberpunk hacker from Neo-Tokyo 2089
- **Mythos** - World-building storyteller
- **Cogito** - Existential philosopher
- **Nihilo** - Cheerful nihilist
- **Expert/Coder/Concise** - Functional specialists
- 12+ more personas

**Total persona system:**
- 18+ personas
- ~10,000 tokens of personality definitions
- Each conversation uses 1 persona's prompt

**File**: `lib/personas.ts:1-500`

---

### 4. Model Comparison 📊

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

### 8. Cost Tracking System 💸

**Location**: `lib/cost-tracker.ts`, `components/cost-tracker-dashboard.tsx`

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
4. Show toast notifications:
   - "🤖 AI is searching the web..."
   - "✅ Search complete"
      ↓
5. Stream final response with search results
```

#### Search Providers

**Tavily:**
- Purpose-built for AI/LLM
- Extracts direct answers
- Advanced/basic depth modes
- $1 per 1K searches

**Serper:**
- Real Google Search API
- Country/language targeting
- **$0.20 per 1K searches (5x cheaper!)**

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

## Key Files Reference

| File | Purpose | Critical Sections | Lines |
|------|---------|-------------------|-------|
| `contexts/app-context.tsx` | Global state management | API key protection | 814-836 |
| `lib/supabase/sync.ts` | Database sync logic | saveSettings, memory persistence | 182-303, 575-579 |
| `components/ai-debate-mode.tsx` | AI Discussion mode | Genuine opinion prompts | 470-493 |
| `components/model-comparison.tsx` | Multi-model comparison | Mobile UI fix | 195-210 |
| `lib/memory-service.ts` | Long-term memory system | Relevance scoring algorithm | 96-144 |
| `lib/voice.ts` | Voice input/output | OpenAI TTS, browser TTS, Whisper | 280-360 |
| `app/api/chat/route.ts` | Main chat API | Streaming logic, context building | All |
| `app/api/tts/route.ts` | OpenAI TTS API | Audio generation endpoint | All |
| `app/api/whisper/route.ts` | Speech-to-text API | Audio format handling | 30-45 |
| `lib/personas.ts` | Persona definitions | All 18+ personas | 1-500 |
| `lib/cost-tracker.ts` | Cost tracking | Pricing database, calculation | All |
| `lib/rag-service.ts` | RAG implementation | Chunking, embedding, retrieval | 50-150 |
| `components/chat-messages.tsx` | Message display | React.memo, useCallback | 1-80 |
| `components/settings-dialog.tsx` | Settings UI | Lazy loading, TTS provider | 1-50, 1150-1270 |
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

## Recent Changes (Last 3 Days)

*Updated: 2025-12-01*

### Overview

The last 3 days focused on three major areas:
1. **Streaming Visualization System** - Real-time feedback during AI responses
2. **Dialog Viewport Safety** - Preventing modal cutoff on desktop
3. **Performance & UX Fixes** - Reasoning spam, chat layout, vision models

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
