# Security Hardening & Performance Optimization Plan

## Executive Summary

Based on comprehensive code analysis, this document outlines critical security vulnerabilities and performance bottlenecks in Chameleon AI Chat, along with specific implementation steps to address them.

---

## Part 1: Security Hardening

### Issue 1: API Keys Exposed to Client ⚠️ CRITICAL

**Current State:**
- `lib/voice.ts` receives API key as function parameter (line 93, 298)
- API key sent in request body to `/api/whisper` (line 201)
- API key sent in request body to `/api/tts` (line 314-318)
- Keys visible in browser Network tab

**Files Affected:**
- `lib/voice.ts`
- `app/api/whisper/route.ts`
- `app/api/tts/route.ts`

**Solution:**
Server-side only API key management using environment variables.

**Implementation Steps:**

1. **Update `/app/api/whisper/route.ts`:**
```typescript
// BEFORE: Get API key from request body
const apiKey = formData.get('apiKey') as string

// AFTER: Get API key from server environment
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  return NextResponse.json({ error: 'OpenAI API key not configured on server' }, { status: 500 })
}
```

2. **Update `/app/api/tts/route.ts`:**
```typescript
// BEFORE: Get API key from request body
const { text, voice = 'nova', speed = 1.0, apiKey } = await req.json()

// AFTER: Get API key from server environment
const { text, voice = 'nova', speed = 1.0 } = await req.json()
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  return NextResponse.json({ error: 'OpenAI API key not configured on server' }, { status: 500 })
}
```

3. **Update `lib/voice.ts`:**
- Remove `apiKey` parameter from `startWhisperListening()` function signature
- Remove `formData.append('apiKey', apiKey)` line
- Remove `apiKey` parameter from `speakWithOpenAI()` function signature
- Remove `apiKey` from request body

4. **Update all call sites:**
- `components/chat-input.tsx`
- `components/simple-chat-input.tsx`
- Anywhere voice functions are called

5. **Add environment variable:**
```env
OPENAI_API_KEY=sk-...
```

---

### Issue 2: Unencrypted localStorage Storage ⚠️ CRITICAL

**Current State:**
- `contexts/settings-context.tsx` stores all API keys in plain text (line 228)
- Vulnerable to XSS attacks - any injected script can steal all keys
- Browser extensions can access localStorage

**Files Affected:**
- `contexts/settings-context.tsx`
- `contexts/app-context.tsx`

**Solution Options:**

**Option A: Server-Side Storage (Recommended)**
Store sensitive keys only in Supabase with RLS, never in localStorage.

**Option B: Client-Side Encryption**
Encrypt localStorage with a user-specific key derived from their password.

**Implementation (Option A - Server-Side):**

1. **Create new API key storage table in Supabase:**
```sql
-- Create encrypted API keys table
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL, -- 'openRouter', 'tavily', 'serper', 'exa', 'openAI'
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key_type)
);

-- RLS: Users can only access their own keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own API keys"
  ON user_api_keys FOR ALL
  USING (auth.uid() = user_id);
```

2. **Create API endpoint for key retrieval:**
```typescript
// app/api/keys/route.ts
export async function GET(req: NextRequest) {
  // Verify user session
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch keys from database
  const { data: keys } = await supabase
    .from('user_api_keys')
    .select('key_type, encrypted_key')
    .eq('user_id', user.id)

  return NextResponse.json({ keys })
}
```

3. **Update settings context:**
- Remove API keys from localStorage
- Fetch keys from server when needed
- Store keys only in memory (React state)

---

### Issue 3: No Authentication on API Routes ⚠️ HIGH

**Current State:**
- API routes only check for API key presence
- No user verification = unauthorized usage possible
- Anyone can use the endpoints if they know the URLs

**Files Affected:**
- `app/api/chat/route.ts`
- `app/api/search/route.ts`
- `app/api/embeddings/route.ts`
- `app/api/generation/route.ts`
- All other API routes

**Solution:**
Add Supabase auth verification to all API routes.

**Implementation:**

1. **Create auth middleware utility:**
```typescript
// lib/api-auth.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function verifyAuth(req: NextRequest) {
  // Allow guest mode with rate limiting
  const guestMode = req.cookies.get('guest-mode')?.value === 'true'
  if (guestMode) {
    return { user: null, isGuest: true }
  }

  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, isGuest: false, error: 'Unauthorized' }
  }

  return { user, isGuest: false }
}

export function requireAuth(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    const { user, isGuest, error } = await verifyAuth(req)

    if (error && !isGuest) {
      return NextResponse.json({ error }, { status: 401 })
    }

    return handler(req, { user, isGuest }, ...args)
  }
}
```

2. **Update API routes:**
```typescript
// app/api/chat/route.ts
import { verifyAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  // Verify authentication
  const { user, isGuest, error } = await verifyAuth(req)
  if (error && !isGuest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Existing logic...
}
```

---

### Issue 4: Mermaid Security Level ⚠️ MEDIUM

**Current State:**
- `components/rich-content/mermaid-diagram.tsx` line 84
- `securityLevel: "loose"` allows script injection
- Malicious diagrams could execute JavaScript

**File:** `components/rich-content/mermaid-diagram.tsx`

**Solution:**
Change to "strict" or "sandbox" mode.

**Implementation:**
```typescript
// BEFORE (line 84):
mermaid.initialize({
  securityLevel: "loose",
  // ...
})

// AFTER:
mermaid.initialize({
  securityLevel: "strict",  // Prevents script injection
  // ...
})
```

---

### Issue 5: In-Memory Rate Limiting ⚠️ MEDIUM

**Current State:**
- `lib/rate-limit.ts` uses in-memory Map
- Resets on server restart
- Not shared across instances (serverless)

**Solution:**
Implement Redis or Supabase-backed rate limiting.

**Implementation (Supabase-based):**

```sql
-- Create rate limit tracking table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP or user ID
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Auto-cleanup old entries
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Part 2: Performance Optimizations

### Issue 1: Heavy Context Re-renders ⚠️ HIGH PRIORITY

**Current State:**
- `contexts/app-context.tsx` has 24+ dependencies in `useMemo` (line 1267-1275)
- Single AppContext causes entire app to re-render on any state change
- Streaming updates trigger frequent re-renders

**Solution:**
Split into focused, domain-specific contexts.

**Implementation:**

1. **Create `contexts/chat-context.tsx`:**
```typescript
// Chat operations only
interface ChatContextType {
  chats: Chat[]
  currentChatId: string | null
  createChat: (model?: string) => string
  deleteChat: (chatId: string) => void
  deleteAllChats: () => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  setCurrentChat: (chatId: string | null) => void
  addMessage: (chatId: string, message: Message) => void
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>
}
```

2. **Create `contexts/streaming-context.tsx`:**
```typescript
// Streaming state only - isolated from main app
interface StreamingContextType {
  streamingPhase: StreamingPhase
  setStreamingPhase: (phase: StreamingPhase) => void
  currentTool: string | null
  setCurrentTool: (tool: string | null) => void
  searchQuery: string | null
  setSearchQuery: (query: string | null) => void
  currentStreamingDetails: Partial<StreamingHistoryEntry> | null
  setCurrentStreamingDetails: (details: ...) => void
  isChatLoading: boolean
  setIsChatLoading: (loading: boolean) => void
  chatAbortControllerRef: React.MutableRefObject<AbortController | null>
  stopChatGeneration: () => void
}
```

3. **Create `contexts/ui-context.tsx`:**
```typescript
// UI state only
interface UIContextType {
  folders: ChatFolder[]
  comparisonSessions: ComparisonSession[]
  createFolder: (name: string) => string
  deleteFolder: (folderId: string) => void
  // ... comparison session methods
}
```

4. **Wrap providers hierarchically:**
```typescript
// app/providers.tsx
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ChatProvider>
          <StreamingProvider>
            <UIProvider>
              {children}
            </UIProvider>
          </StreamingProvider>
        </ChatProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
```

**Impact:** 50-70% reduction in unnecessary re-renders

---

### Issue 2: Heavy Synchronous Imports ⚠️ HIGH PRIORITY

**Current State:**
- `components/chat-messages.tsx` imports heavy libraries synchronously:
  - `react-markdown` (~40KB)
  - `remarkGfm` + `remarkMath` + `rehypeSanitize` + `rehypeKatex` (~30KB)
  - `katex` (~30KB)
  - `mermaid` (~80KB) in `mermaid-diagram.tsx`
  - `pdfjs-dist` (~200KB) somewhere in the codebase

**Files Affected:**
- `components/chat-messages.tsx`
- `components/rich-content/mermaid-diagram.tsx`

**Solution:**
Dynamic imports with loading states.

**Implementation:**

1. **Update `components/chat-messages.tsx`:**
```typescript
// BEFORE:
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeSanitize from "rehype-sanitize"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

// AFTER:
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div className="animate-pulse bg-muted h-4 rounded" />,
  ssr: false
})

// Load markdown plugins lazily
const markdownPlugins = {
  remarkPlugins: [] as any[],
  rehypePlugins: [] as any[]
}

// Load plugins on first render
if (typeof window !== 'undefined') {
  Promise.all([
    import('remark-gfm'),
    import('remark-math'),
    import('rehype-sanitize'),
    import('rehype-katex'),
  ]).then(([gfm, math, sanitize, katex]) => {
    markdownPlugins.remarkPlugins = [gfm.default, math.default]
    markdownPlugins.rehypePlugins = [sanitize.default, katex.default]
  })
}
```

2. **Update `components/rich-content/mermaid-diagram.tsx`:**
```typescript
// BEFORE:
import mermaid from "mermaid"

// AFTER:
const MermaidDiagram = dynamic(() => import('./mermaid-diagram-inner'), {
  loading: () => (
    <Card className="p-4 my-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">Loading diagram renderer...</span>
      </div>
    </Card>
  ),
  ssr: false
})
```

**Impact:** ~150KB reduction in initial bundle, 30% faster initial load

---

### Issue 3: Virtual Scrolling for Long Conversations ⚠️ MEDIUM

**Current State:**
- All messages rendered even when not visible
- Long conversations (100+ messages) cause performance issues
- Memory usage grows unbounded

**Solution:**
Implement virtual scrolling using `@tanstack/react-virtual`.

**Implementation:**

1. **Install dependency:**
```bash
pnpm add @tanstack/react-virtual
```

2. **Update `components/chat-messages.tsx`:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function ChatMessages({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated message height
    overscan: 5, // Render 5 extra items above/below viewport
  })

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <MessageBubble message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Impact:** 80% reduction in DOM nodes for long conversations

---

## Implementation Phases

### Phase 1: Critical Security (Week 1)
- [ ] Move API keys to server-side environment variables
- [ ] Add authentication to all API routes
- [ ] Fix Mermaid security level
- [ ] Audit all client-exposed sensitive data

### Phase 2: Security Hardening (Week 2)
- [ ] Implement server-side API key storage
- [ ] Add CSP headers for additional protection
- [ ] Implement proper rate limiting with persistence
- [ ] Security audit of all user inputs

### Phase 3: Performance Quick Wins (Week 3)
- [ ] Dynamic imports for heavy libraries
- [ ] Split AppContext into focused contexts
- [ ] Add React.memo to expensive components

### Phase 4: Performance Polish (Week 4)
- [ ] Implement virtual scrolling
- [ ] Add service worker caching for static assets
- [ ] Optimize Supabase queries (batch fetching)

---

## Testing Checklist

### Security Tests
- [ ] API keys not visible in Network tab
- [ ] localStorage doesn't contain plain-text keys
- [ ] API routes reject unauthenticated requests
- [ ] Mermaid diagrams don't execute scripts
- [ ] Rate limiting persists across deployments

### Performance Tests
- [ ] Initial bundle < 300KB
- [ ] Time to Interactive < 2s
- [ ] Lighthouse Performance > 90
- [ ] No layout shift during loading
- [ ] Smooth scrolling with 500+ messages

---

## Files to Modify Summary

### Security:
1. `lib/voice.ts` - Remove API key params
2. `app/api/whisper/route.ts` - Use env var
3. `app/api/tts/route.ts` - Use env var
4. `app/api/chat/route.ts` - Add auth
5. `app/api/search/route.ts` - Add auth
6. `app/api/generation/route.ts` - Add auth
7. `components/rich-content/mermaid-diagram.tsx` - Fix security level
8. `lib/rate-limit.ts` - Persistent storage

### Performance:
1. `contexts/app-context.tsx` - Split into multiple contexts
2. `components/chat-messages.tsx` - Dynamic imports + virtual scroll
3. `components/rich-content/mermaid-diagram.tsx` - Dynamic import

---

*Document created: December 2025*
*Estimated implementation time: 3-4 weeks*
