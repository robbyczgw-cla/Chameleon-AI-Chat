# 🏗️ Architecture Overview

Technical deep dive into Chameleon Chat's architecture, design decisions, and implementation details.

---

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                 │
│                     (React 19 + TypeScript 5)            │
└─────────────────────────────────────────────────────────┘
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
└─────────────────┘  └────────────────┘  │  - messages  │
                                         │  - RLS       │
                                         └──────────────┘
```

---

## 📁 Project Structure

```
v0-react-chat-interface/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Edge Runtime)
│   │   ├── chat/route.ts         # LLM streaming endpoint
│   │   ├── search/route.ts       # Tavily search
│   │   └── serper/route.ts       # Serper (Google) search
│   ├── auth/                     # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── callback/route.ts     # Supabase callback
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main chat page
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── chat-*.tsx                # Core chat components
│   ├── ai-debate-mode.tsx        # Debate feature
│   ├── cost-tracker-dashboard.tsx
│   ├── export-training-data-dialog.tsx
│   └── ...
│
├── components_archived_*/        # Archived features
│   └── simple_mode/              # Old simple mode
│
├── contexts/                     # React Context
│   └── app-context.tsx           # Global app state
│
├── lib/                          # Core libraries
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   ├── middleware.ts         # Auth middleware
│   │   └── sync.ts               # Data sync
│   ├── openrouter.ts             # LLM integration
│   ├── personas.ts               # Persona definitions
│   ├── cost-tracker.ts           # Cost calculations
│   ├── branch-manager.ts         # Conversation branching
│   ├── rag-service.ts            # RAG implementation
│   └── ...
│
├── types/                        # TypeScript types
│   └── index.ts                  # Shared types
│
├── scripts/                      # SQL migrations
│   ├── 001_initial_schema.sql
│   ├── 002_add_rls_policies.sql
│   └── ...023_latest.sql
│
├── docs/                         # Documentation
│   ├── README.old.md             # Original README
│   ├── user-guide.md             # User documentation
│   ├── architecture.md           # This file
│   └── ...
│
├── public/                       # Static assets
├── middleware.ts                 # Next.js middleware
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Tailwind config
└── package.json                  # Dependencies

Total: 119 TypeScript files, 3.2MB codebase
```

---

## 🔧 Core Technologies

### Frontend Stack

**Next.js 16 (App Router)**
- React Server Components
- Streaming responses
- Edge runtime for API routes
- Built-in optimization (images, fonts, etc.)

**React 19**
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

**shadcn/ui**
- Accessible components
- Radix UI primitives
- Customizable
- No runtime dependency (copy-paste components)

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

---

## 🔐 Authentication & Security

### Supabase Auth Flow

```
1. User signs up/logs in
   ↓
2. Supabase creates JWT token
   ↓
3. Token stored in httpOnly cookie
   ↓
4. Middleware validates on each request
   ↓
5. RLS policies enforce data access
```

### Row-Level Security (RLS)

**All tables have RLS enabled:**

```sql
-- Example: profiles table
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**Security guarantees:**
- Users can ONLY see their own data
- No cross-user data leakage
- Enforced at database level (can't bypass)
- Works even if app code is compromised

### API Key Security

**User API keys:**
- Encrypted at rest (Supabase)
- Never logged or exposed
- Transmitted only to OpenRouter
- Stored per-user (not global)

**Environment variables:**
- `.env.local` for local dev
- Vercel environment variables for production
- Never committed to git
- Validated on startup

---

## 💬 Chat Architecture

### Message Flow

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
│    - Check web search need   │
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

### Streaming Implementation

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

---

## 🎭 Persona System

### How Personas Work

**1. Persona Definition (lib/personas.ts):**
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

**2. Persona Loading:**
```typescript
// User selects persona
const persona = getPersonaById(selectedId);

// System prompt injected into messages
const messages = [
  { role: "system", content: persona.prompt },
  ...chatHistory,
  { role: "user", content: userMessage }
];
```

**3. LLM receives:**
- Persona's system prompt (personality instructions)
- Full chat history (context)
- Latest user message

**4. Response shaped by persona:**
- Communication style
- Domain expertise
- Response format
- Follow-up suggestions

### Persona Complexity

**Simple personas:**
- Flash: "Be concise, use bullet points"
- ~100 tokens

**Complex personas:**
- Nova: Full backstory, life details, projects, emotions
- ~800 tokens
- Stateful (references previous conversations)

**Total persona system:**
- 18+ personas
- ~10,000 tokens of personality definitions
- Each conversation uses 1 persona's prompt

---

## 💸 Cost Tracking System

### Architecture

**Data Flow:**
```
LLM Response
    ↓
Extract token counts
    ↓
Fetch model pricing (lib/cost-tracker.ts)
    ↓
Calculate cost
    ↓
Store in message metadata
    ↓
Aggregate for analytics
```

### Token Counting

**Two methods:**

1. **OpenRouter headers** (preferred):
```typescript
const usage = {
  prompt_tokens: response.headers['x-ratelimit-tokens-prompt'],
  completion_tokens: response.headers['x-ratelimit-tokens-completion']
};
```

2. **Fallback estimation** (if headers unavailable):
```typescript
// Rough estimate: 1 token ≈ 4 characters
const estimatedTokens = Math.ceil(text.length / 4);
```

### Pricing Database

**Hardcoded in lib/cost-tracker.ts:**
```typescript
const MODEL_PRICING = {
  "openai/gpt-4o": {
    input: 2.50,    // $ per 1M tokens
    output: 10.00
  },
  "x-ai/grok-4-fast": {
    input: 0.02,
    output: 0.10
  },
  // ... 100+ models
};
```

**Updates:**
- Manual updates when pricing changes
- OpenRouter API (future automation)

### Cost Calculation

```typescript
function calculateCost(
  promptTokens: number,
  completionTokens: number,
  modelId: string
): number {
  const pricing = MODEL_PRICING[modelId];
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
```

---

## 🔍 Web Search Integration

### Two Providers

**Tavily:**
- Purpose-built for AI/LLM
- Extracts direct answers
- Advanced/basic depth modes
- $1 per 1K searches

**Serper:**
- Real Google Search API
- Image search included
- Country/language targeting
- $0.2 per 1K searches (5x cheaper!)

### When Search Triggers

**Automatic detection:**
```typescript
function needsWebSearch(message: string): boolean {
  const triggers = [
    /latest|recent|current|today|news/i,
    /price|cost|how much/i,
    /weather|temperature/i,
    /\d{4}/ && /event|happen/i, // Years + events
  ];
  return triggers.some(regex => regex.test(message));
}
```

**Manual trigger:**
- User says "search for..."
- Settings toggle "Always search"

### Search Flow

```
1. Detect search needed
      ↓
2. Extract search query from message
      ↓
3. Call /api/search or /api/serper
      ↓
4. Parse results (title, snippet, URL)
      ↓
5. Format for LLM context
      ↓
6. Inject into system prompt
      ↓
7. LLM generates response with search context
      ↓
8. Cite sources in response
```

---

## 📊 Database Schema

### Core Tables

**profiles:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  display_name TEXT,
  age INTEGER,
  occupation TEXT,
  location TEXT,
  interests TEXT[],
  about_me TEXT,
  goals TEXT[],
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**chats:**
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  persona_id TEXT DEFAULT 'default',
  folder_id UUID REFERENCES folders(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**messages:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  metadata JSONB, -- tokens, cost, model, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**folders:**
```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

**Performance optimizations:**
```sql
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_folder_id ON chats(folder_id);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
```

**Query patterns optimized:**
- Load chat messages: `SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at`
- User's chats: `SELECT * FROM chats WHERE user_id = $1 AND is_archived = FALSE`
- Folder contents: `SELECT * FROM chats WHERE folder_id = $1`

---

## 🎯 State Management

### Global State (AppContext)

**What it manages:**
```typescript
interface AppState {
  user: User | null;
  chats: Chat[];
  currentChatId: string | null;
  settings: UserSettings;
  isLoading: boolean;
  folders: Folder[];
}
```

**Why Context, not Redux:**
- Simple state structure
- No complex async patterns
- Server-side data source (Supabase)
- Fewer dependencies
- Easier to reason about

**Context Provider:**
```typescript
<AppProvider>
  <ModeWrapper>
    <ChatApp />
  </ModeWrapper>
</AppProvider>
```

### Local State

**Component-level state:**
- Input value: `useState("")`
- Dialog open: `useState(false)`
- Loading state: `useState(false)`

**When to use local vs global:**
- Local: UI-only state (modals, inputs, toggles)
- Global: Data shared across components (chats, user, settings)

---

## 🚀 Performance Optimizations

### 1. React Server Components

**Benefits:**
- Less JavaScript sent to client
- Server-side data fetching
- Automatic code splitting
- Better SEO

**Example:**
```typescript
// app/page.tsx is RSC by default
export default async function Page() {
  const chats = await getChats(); // Runs on server
  return <ChatApp initialChats={chats} />;
}
```

### 2. Streaming Responses

**Reduces time to first token:**
- Traditional: Wait for full response (~10s)
- Streaming: First token in ~0.5s
- User sees progress immediately

### 3. Code Splitting

**Automatic in Next.js:**
- Each route = separate bundle
- Dynamic imports for large components
- Only load what's needed

**Manual optimization:**
```typescript
const AiDebateMode = dynamic(() => import('./ai-debate-mode'));
// Loaded only when accessed
```

### 4. Database Indexes

**All foreign keys indexed:**
- `chat_id` in messages
- `user_id` in chats
- `folder_id` in chats

**Query times:**
- Without index: ~500ms (full table scan)
- With index: ~5ms (index lookup)

### 5. Image Optimization

**Next.js Image component:**
```typescript
<Image
  src="/avatar.png"
  width={40}
  height={40}
  loading="lazy" // Lazy load
  placeholder="blur" // Blur placeholder
/>
```

---

## 🔄 Data Synchronization

### Supabase Real-Time

**Enabled for:**
- New messages in current chat
- Chat list updates
- User presence (future)

**Example:**
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_id=eq.${chatId}`
  }, (payload) => {
    addMessageToUI(payload.new);
  })
  .subscribe();
```

### Optimistic Updates

**Pattern:**
```typescript
// 1. Update UI immediately
addMessageToUI(optimisticMessage);

// 2. Call API
const response = await fetch('/api/chat', ...);

// 3. Replace optimistic with real data
replaceMessage(optimisticId, realMessage);

// 4. On error, revert
if (error) removeMessage(optimisticId);
```

**Benefits:**
- Instant feedback
- No loading states
- Better UX
- Handles failures gracefully

---

## 🎨 Theming System

### Theme Structure

**5 themes:**
1. Light (default)
2. Dark
3. Cyberpunk
4. Girly Violet
5. Ocean Breeze
6. Retro Wave

**Implementation:**
```typescript
// Tailwind classes
<html className="dark">
  <body className="bg-background text-foreground">
    ...
  </body>
</html>

// CSS variables
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  // ...
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  // ...
}
```

### Persona-Specific Colors

**Each persona has gradient:**
```typescript
{
  id: "nova",
  color: "from-cyan-400 via-purple-500 to-pink-500"
}
```

**Applied to:**
- Chat header
- Message bubbles
- Accent colors

---

## 📦 Deployment

### Vercel (Recommended)

**Why Vercel:**
- Built by Next.js team
- Zero-config deployment
- Edge runtime support
- Automatic HTTPS
- Preview deployments

**Deploy process:**
```bash
# 1. Connect repo to Vercel
vercel link

# 2. Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... more env vars

# 3. Deploy
vercel --prod
```

### Self-Hosted

**Requirements:**
- Node.js 18+
- PostgreSQL (Supabase)
- HTTPS certificate

**Build:**
```bash
npm run build
npm start
```

---

## 🔮 Future Architecture Improvements

### Planned:
1. **Redis caching** for frequent queries
2. **WebSocket** for real-time typing indicators
3. **Service Worker** for offline support
4. **GraphQL** to replace REST APIs
5. **Vector DB** (Pinecone) for semantic search
6. **Edge functions** for more API routes

### Under Consideration:
- Monorepo (Turborepo)
- Micro-frontends
- Native apps (React Native)
- Desktop app (Electron)

---

**Architecture designed for:** Scale, maintainability, developer experience.
