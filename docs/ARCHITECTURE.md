# 🏗️ Chameleon AI Chat - Technical Architecture

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Core Systems](#core-systems)
5. [Data Flow](#data-flow)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Database Schema](#database-schema)
9. [Performance Optimizations](#performance-optimizations)
10. [Security Architecture](#security-architecture)

---

## High-Level Overview

Chameleon is a **Next.js 16** Progressive Web App (PWA) that provides a sophisticated interface for interacting with 100+ AI models via **OpenRouter**. The architecture follows modern React patterns with server-side rendering, real-time streaming, and offline-first design.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React 19)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Personas   │  │    Memory    │  │  Model Comp  │      │
│  │   System     │  │    System    │  │  & Debate    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         App Context (Global State)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────┴─────────────────────────────────────┐
│              Next.js API Routes (Serverless)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  /chat   │  │ /whisper │  │ /search  │  │ /embedds │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────┴──────┐ ┌──────┴──────┐ ┌─────┴─────┐
│  OpenRouter  │ │  Supabase   │ │ Tavily/   │
│  (100+ LLMs) │ │ (Postgres)  │ │ Serper    │
└──────────────┘ └─────────────┘ └───────────┘
```

---

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19.2** - UI library with concurrent features
- **TypeScript 5** - Type safety
- **Tailwind CSS 4.1** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless functions
- **Supabase** - PostgreSQL database + Auth + RLS
- **Edge Runtime** - Low-latency API responses

### AI & Search
- **OpenRouter** - Unified AI model API
- **Tavily** - AI-powered web search
- **Serper** - Google search API
- **OpenAI Whisper** - Voice transcription

### Storage & State
- **LocalStorage** - Client-side caching
- **IndexedDB** - Large file storage (via browser APIs)
- **Supabase Postgres** - Persistent storage
- **React Context** - Global state management

### Build & Deploy
- **Vercel** - Deployment platform
- **pnpm** - Package manager
- **PostCSS** - CSS processing
- **Sharp** - Image optimization

---

## Directory Structure

```
Chameleon-AI-Chat/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (serverless functions)
│   │   ├── chat/          # Main chat endpoint (streaming)
│   │   ├── whisper/       # Voice transcription
│   │   ├── search/        # Web search (Tavily/Serper)
│   │   ├── embeddings/    # Vector embeddings
│   │   └── generate-image/# Image generation (DALL-E, etc.)
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Main app page
├── components/            # React components
│   ├── ui/               # Shadcn/Radix primitives
│   ├── chat-input.tsx    # Message input with voice
│   ├── chat-sidebar.tsx  # Conversation history
│   ├── model-comparison.tsx    # Multi-model comparison
│   ├── ai-debate-mode.tsx      # AI discussion feature
│   ├── memory-manager.tsx      # Memory system UI
│   ├── personas-dialog.tsx     # Persona selector
│   └── [40+ more components]
├── contexts/              # React Context providers
│   └── app-context.tsx   # Global state (settings, chats, etc.)
├── lib/                   # Utility libraries & services
│   ├── supabase/         # Database client & sync logic
│   ├── personas.ts       # Persona definitions
│   ├── memory-service.ts # Long-term memory system
│   ├── voice.ts          # Voice input/output
│   ├── openrouter.ts     # AI model integration
│   ├── tavily.ts         # Web search (Tavily)
│   ├── serper.ts         # Web search (Serper)
│   ├── rag-service.ts    # Retrieval Augmented Generation
│   ├── embeddings-store.ts # Vector embeddings
│   └── [30+ utility modules]
├── types/                 # TypeScript type definitions
├── scripts/              # SQL migration scripts
├── public/               # Static assets (music, icons, manifest)
├── docs/                 # Documentation
└── styles/               # Global CSS
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

**Key Features**:
- Streaming responses (see text as it generates)
- Multi-modal support (text, images, PDFs)
- Web search integration (inject search results into context)
- Token counting & cost tracking
- Error handling with exponential backoff

**File**: `/app/api/chat/route.ts:198` (API key header fix)

### 2. Memory System

**Location**: `lib/memory-service.ts`, `components/memory-manager.tsx`

Token-efficient long-term memory across conversations:

```typescript
interface Memory {
  id: string
  type: "preference" | "fact" | "context" | "skill" | "goal"
  content: string
  importance: 1 | 2 | 3  // Filtering threshold
  createdAt: number
  lastAccessedAt: number
  accessCount: number
}
```

**How it works**:
1. Auto-extract: Regex patterns detect facts/preferences in conversation
2. Manual add: User manually creates memories
3. Retrieval: Keyword matching + importance scoring
4. Injection: Top N memories added to system prompt

**Persistence**:
- ✅ FIXED: Now persists to Supabase via `memory_settings` JSONB column
- Script: `scripts/028_add_memory_settings.sql`

**File**: `lib/memory-service.ts:96` (relevantMemories algorithm)

### 3. Persona System

**Location**: `lib/personas.ts`, `lib/persona-*.ts`

18+ distinct AI personalities with:
- Unique system prompts
- Visual themes
- Memory contexts
- Conversation styles

```typescript
interface Persona {
  id: string
  name: string
  avatar: string
  description: string
  systemPrompt: string
  theme: string  // Visual theming
  memoryContext?: string[]  // Persona-specific memory
}
```

**Personas**:
- **Cami** (default) - Adaptive chameleon
- **Nova** - Cyberpunk hacker from Neo-Tokyo
- **Mythos** - World-building storyteller
- **Cogito** - Existential philosopher
- **Nihilo** - Cheerful nihilist
- **Expert/Coder/Concise** - Functional specialists
- 10+ more

**File**: `lib/personas.ts:1-500`

### 4. Model Comparison

**Location**: `components/model-comparison.tsx`

Run the same prompt through 2-4 different AI models simultaneously:

```
┌────────────┬────────────┬────────────┬────────────┐
│  Model 1   │  Model 2   │  Model 3   │  Model 4   │
│ (Claude)   │  (GPT-4)   │  (Grok)    │ (Llama)    │
├────────────┼────────────┼────────────┼────────────┤
│ Response A │ Response B │ Response C │ Response D │
└────────────┴────────────┴────────────┴────────────┘
```

**Features**:
- 2/3/4 column layouts
- Independent conversation threads per model
- Shared input across all models
- Cost comparison
- Performance metrics (tokens/sec, TTFT)

**Mobile UX Fix**: `components/model-comparison.tsx:195-210` (2-row header)

### 5. AI Discussion Mode

**Location**: `components/ai-debate-mode.tsx`

Have 2 AI models discuss a topic and share genuine perspectives:

```typescript
// OLD (forced debate):
Model 1: ALWAYS argues FOR the topic
Model 2: ALWAYS argues AGAINST

// NEW (genuine discussion):
Model 1: Shares authentic opinion
Model 2: Shares authentic opinion (can agree/disagree)
Judge:   Evaluates authenticity, not "winning"
```

**Styles**:
- Freestyle - Casual discussion
- Oxford - Formal structured debate
- Socratic - Question-driven exploration

**File**: `components/ai-debate-mode.tsx:470` (genuine opinion prompts)

### 6. RAG (Retrieval Augmented Generation)

**Location**: `lib/rag-service.ts`, `lib/embeddings-store.ts`

Upload documents → Generate embeddings → Retrieve relevant context:

```typescript
1. User uploads PDF/TXT
2. Text chunked into ~500-token segments
3. Each chunk embedded via OpenRouter
4. Stored in IndexedDB (client-side vector DB)
5. On query: Cosine similarity search
6. Top-k chunks injected into prompt
```

**Supported Formats**:
- PDF (via pdfjs-dist)
- TXT, MD, JSON
- Images (via vision models)

**File**: `lib/rag-service.ts:50-150`

### 7. Voice System

**Location**: `lib/voice.ts`

**Input**: Browser MediaRecorder → OpenAI Whisper API
**Output**: Web Speech API (built-in TTS)

```typescript
// Voice input flow:
1. Request microphone permission
2. Record audio (WebM format)
3. Stop recording
4. Convert to base64
5. Send to /api/whisper
6. Receive transcription
7. Auto-send as message
```

**PWA Fix**: `lib/voice.ts:20-35` (Android permission detection)

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
Optimistic UI update (show message immediately)
  ↓
POST /api/chat (streaming)
  ↓
API route validates API key
  ↓
Inject system prompt + persona + memory + RAG context
  ↓
Stream to OpenRouter
  ↓
OpenRouter streams tokens back
  ↓
Accumulate response in real-time
  ↓
Save to localStorage (instant)
  ↓
Sync to Supabase (background)
  ↓
Update token count & cost
```

### Settings Sync Flow

```
User changes setting
  ↓
AppContext.updateSettings()
  ↓
Validate & merge with existing settings
  ↓
🛡️ API Key Protection Layer
  ↓
Save to localStorage (immediate)
  ↓
Debounced sync to Supabase (1 second delay)
  ↓
Supabase RLS check (user can only update own settings)
  ↓
Settings persisted
```

**Critical Fix**: `contexts/app-context.tsx:814-836` (API key protection)
**Critical Fix**: `lib/supabase/sync.ts:192-218` (preserve existing keys)

---

## State Management

### App Context Architecture

**File**: `contexts/app-context.tsx`

Global state managed via React Context + hooks:

```typescript
interface AppContextType {
  // Chats
  chats: Chat[]
  currentChatId: string | null
  createChat: () => void
  deleteChat: (id: string) => void

  // Messages
  sendMessage: (content: string) => Promise<void>
  regenerateMessage: (messageId: string) => Promise<void>

  // Settings
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void

  // Personas
  currentPersona: Persona
  switchPersona: (id: string) => void

  // UI State
  sidebarOpen: boolean
  comparisonMode: boolean
  // ... more
}
```

**Performance Optimizations**:
- Memoized selectors (useMemo)
- Debounced Supabase syncs
- Lazy loading of chats
- Virtual scrolling for long conversations

**File**: `contexts/app-context.tsx:1-1200`

---

## API Integration

### OpenRouter Integration

**File**: `lib/openrouter.ts`

OpenRouter provides unified access to 100+ AI models:

```typescript
// Supported providers:
- OpenAI (GPT-4, GPT-4 Turbo, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Opus, Haiku)
- Meta (Llama 3.3 70B, 3.1 405B)
- X.AI (Grok 4, Grok 2)
- Google (Gemini 2.0 Flash, Pro)
- Mistral (Large, Medium, Small)
- Perplexity, Cohere, and 80+ more
```

**Key Features**:
- Streaming responses
- Token counting
- Cost tracking
- Model fallbacks
- Rate limit handling

**Authentication**:
```typescript
headers: {
  "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
  "HTTP-Referer": "https://chameleon-ai.app",
  "X-Title": "Chameleon AI Chat"
}
```

### Web Search Integration

**Tavily** (`lib/tavily.ts`):
- AI-optimized search results
- Answer extraction
- Domain filtering
- Image search

**Serper** (`lib/serper.ts`):
- Google Search API
- News, images, videos, places
- Country/language filtering
- Time-range filtering

---

## Database Schema

### Supabase PostgreSQL Tables

```sql
-- Users (managed by Supabase Auth)
auth.users
  - id (UUID, PK)
  - email
  - encrypted_password
  - created_at

-- Profiles
public.profiles
  - id (UUID, PK, FK → auth.users)
  - email
  - name
  - avatar_url
  - created_at
  - updated_at

-- Chats
public.chats
  - id (UUID, PK)
  - user_id (UUID, FK → auth.users)
  - folder_id (UUID, FK → folders, NULL)
  - title (TEXT)
  - pinned (BOOLEAN)
  - model (TEXT)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)

-- Messages
public.messages
  - id (UUID, PK)
  - chat_id (UUID, FK → chats)
  - role (TEXT: user|assistant|system)
  - content (TEXT or JSONB for multimodal)
  - model (TEXT)
  - created_at (TIMESTAMPTZ)

-- User Settings
public.user_settings
  - id (UUID, PK, FK → auth.users)
  - system_prompt (TEXT)
  - temperature (NUMERIC)
  - max_tokens (INTEGER)
  - top_p, frequency_penalty, presence_penalty (NUMERIC)
  - selected_model (TEXT)
  - selected_models (TEXT[])
  - openrouter_api_key (TEXT, encrypted)
  - openai_api_key (TEXT, encrypted)
  - tavily_api_key (TEXT, encrypted)
  - serper_api_key (TEXT, encrypted)
  - search_provider (TEXT: tavily|serper)
  - memory_settings (JSONB) ← NEW!
  - use_exa_search (BOOLEAN)
  - created_at, updated_at (TIMESTAMPTZ)

-- Folders
public.folders
  - id (UUID, PK)
  - user_id (UUID, FK → auth.users)
  - name (TEXT)
  - created_at, updated_at

-- Comparison Sessions (saved model comparisons)
public.comparison_sessions
  - id (UUID, PK)
  - user_id (UUID, FK → auth.users)
  - models (TEXT[])
  - messages (JSONB)
  - created_at
```

### Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- SELECT their own data
- INSERT their own data
- UPDATE their own data
- DELETE their own data

```sql
-- Example RLS policy:
CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Performance Optimizations

### 1. Code Splitting

Next.js automatically splits code by route:
- `app/page.tsx` → Main bundle
- `components/model-comparison.tsx` → Lazy loaded
- `components/ai-debate-mode.tsx` → Lazy loaded

### 2. Image Optimization

- Sharp for build-time optimization
- Next.js Image component for responsive images
- WebP format with fallbacks

### 3. Caching Strategy

**Client-side**:
- LocalStorage: Settings, API keys, chat cache
- IndexedDB: RAG embeddings, large documents
- Service Worker: PWA offline support (if enabled)

**Server-side**:
- Vercel Edge Network (CDN)
- Supabase connection pooling

### 4. Streaming

- SSE streaming for chat responses (reduces perceived latency)
- Incremental rendering (React 19 concurrent features)

### 5. Bundle Size

Current optimizations:
- Tree-shaking unused code
- Tailwind CSS purge
- Dynamic imports for heavy components

**Potential improvements**:
- Remove unused Radix UI components
- Split vendor bundles
- Use `next/dynamic` more aggressively

---

## Security Architecture

### 1. API Key Protection

**Triple-layer protection** to prevent API key loss:

**Layer 1**: Client-side validation
```typescript
// contexts/app-context.tsx:814-836
if (prev.apiKeys.openRouter && !merged.apiKeys.openRouter) {
  console.warn("🛡️ PROTECTION: Preventing API key from being cleared")
  merged.apiKeys.openRouter = prev.apiKeys.openRouter
}
```

**Layer 2**: Server-side preservation
```typescript
// lib/supabase/sync.ts:192-218
const openRouterKey = settings.apiKeys?.openRouter
  || existingSettings?.openrouter_api_key
  || null
```

**Layer 3**: Database RLS
```sql
-- Only user can update their own settings
CREATE POLICY "Users can update their own settings"
  ON public.user_settings
  FOR UPDATE USING (auth.uid() = id);
```

### 2. Authentication

- Supabase Auth (JWT-based)
- Email/password + magic link support
- Session management via cookies
- Automatic token refresh

### 3. Data Encryption

- API keys stored encrypted in Supabase
- HTTPS only (enforced by Vercel)
- No plaintext secrets in code

### 4. Input Validation

- TypeScript type checking
- Zod schema validation (where applicable)
- Sanitize markdown output (rehype-sanitize)

### 5. Rate Limiting

```typescript
// lib/rate-limit.ts
- Per-user request limits
- Exponential backoff on API errors
- Token bucket algorithm
```

---

## Key Files & Their Roles

| File | Purpose | Critical Sections |
|------|---------|-------------------|
| `contexts/app-context.tsx` | Global state management | Lines 814-836 (API key protection) |
| `lib/supabase/sync.ts` | Database sync logic | Lines 182-303 (saveSettings), 575-579 (memorySettings) |
| `components/ai-debate-mode.tsx` | AI Discussion mode | Lines 470-493 (genuine opinion prompts) |
| `components/model-comparison.tsx` | Multi-model comparison | Lines 195-210 (mobile UI fix) |
| `lib/memory-service.ts` | Long-term memory system | Lines 96-144 (relevance scoring) |
| `lib/voice.ts` | Voice input/output | Lines 20-35 (permission handling) |
| `app/api/chat/route.ts` | Main chat API | Entire file (streaming logic) |

---

## Migration Scripts

SQL scripts in `scripts/` directory:

**Recent migrations**:
- `028_add_memory_settings.sql` - Add memory persistence
- `027_add_openai_api_key.sql` - OpenAI API key column
- `026_add_youcom_settings.sql` - You.com search settings
- `025_add_user_preferences_to_db.sql` - User preferences
- `021_add_serper_settings.sql` - Serper search API settings

**How to apply**:
```bash
# Via Supabase dashboard
supabase migration new add_feature
# Copy SQL to new migration file
# Run migration
supabase db push
```

---

## Troubleshooting Common Issues

### 1. API Keys Not Persisting

**Fixed**: See `lib/supabase/sync.ts:192-218`

Run migration: `scripts/028_add_memory_settings.sql` (for memory settings)

### 2. UI Changes Not Showing (Vercel)

**Cause**: Browser cache, Service Worker cache, or Vercel edge cache

**Fix**:
1. Add cache-busting comments
2. Hard refresh (Ctrl+Shift+R)
3. Clear application cache (Chrome DevTools → Application → Clear storage)

### 3. Streaming Not Working

**Causes**:
- Missing `x-openrouter-api-key` header
- Wrong API endpoint
- Network interruption

**Debug**:
- Check browser Network tab
- Look for EventStream connection
- Verify API key in settings

### 4. Memory System Not Loading

**Fixed**: Run `scripts/028_add_memory_settings.sql`

Memory settings now persist to Supabase.

---

## Performance Benchmarks

**Current metrics** (as of 2025-11):
- **Bundle size**: ~800KB gzipped (main bundle)
- **First Load**: ~2.5s (on 3G)
- **Time to Interactive**: ~3.5s
- **Lighthouse Score**: 85+ (Performance)

**Future goals**:
- Bundle < 500KB
- First Load < 2s
- Lighthouse 95+

---

## Conclusion

Chameleon's architecture prioritizes:
1. **User Control**: Settings, API keys, data ownership
2. **Performance**: Streaming, caching, code splitting
3. **Extensibility**: Modular design, open source
4. **Security**: Encryption, RLS, input validation

For implementation guides, see `FUTURE_FEATURES.md`.
For power-user tips, see `POWER_USER_GUIDE.md`.
