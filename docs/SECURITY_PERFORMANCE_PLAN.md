# Security Hardening & Performance Optimization Plan

> **Last Verified:** December 18, 2025 (Deep code inspection - 30 commits reviewed)
> **Status:** Mostly Fixed - Only voice API keys and route auth remain

---

## Current Status Summary

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| localStorage API keys exposure | **CRITICAL** | ✅ **FIXED** | Keys removed for logged-in users (commit 6a065a4) |
| Mermaid security level | Medium | ✅ **FIXED** | Changed to `securityLevel: "strict"` |
| Mermaid lazy loading | High | ✅ **FIXED** | ~400KB bundle reduction (commit 11073bc) |
| KaTeX lazy loading | Medium | ✅ **FIXED** | lazy-math.tsx created |
| Context splitting | High | ✅ **FIXED** | settings, chats, auth contexts separated |
| GPU/Streaming performance | Critical | ✅ **FIXED** | Throttled updates, removed animations |
| SyntaxHighlighter dynamic import | Medium | ✅ **FIXED** | Already in chat-messages.tsx |
| api-auth.ts utility | High | ✅ **CREATED** | Ready for use (lib/api-auth.ts) |
| **Voice API keys client→server** | **CRITICAL** | ❌ **NOT FIXED** | voice.ts still passes keys |
| **API routes using auth** | High | ❌ **NOT IMPLEMENTED** | api-auth.ts exists but unused |
| Rate limiting persistence | Medium | ❌ **NOT FIXED** | Still in-memory Map |
| Virtual scrolling | Medium | ❌ **NOT IMPLEMENTED** | Not in codebase |

---

## Part 1: Security - WHAT'S FIXED

### ✅ Issue 1: localStorage API Keys - FIXED (Dec 17, 2025)

**Commit:** 6a065a4 - "feat: Implement security hardening for API keys and Mermaid diagrams"

**What was done:**
1. **For logged-in users:** API keys are now removed from localStorage after Supabase sync
2. **Keys stored in React state only** (memory) for session use
3. **Keys saved to Supabase** with RLS protection
4. **Settings saved WITHOUT apiKeys** to localStorage for logged-in users

**Evidence from `contexts/app-context.tsx`:**
```typescript
// Line 726-744: After Supabase load
console.log("[v0] 🔒 SECURITY: Removing API keys from localStorage (now secured in Supabase)")
delete parsed.apiKeys
localStorage.setItem("settings", JSON.stringify(parsed))

// Line 889-898: When saving settings
if (user) {
  // Logged-in user: Save settings WITHOUT API keys to localStorage
  const settingsWithoutKeys = { ...settings }
  delete settingsWithoutKeys.apiKeys
  localStorage.setItem("settings", JSON.stringify(settingsWithoutKeys))
}
```

**Guest mode:** Still uses localStorage (accepts XSS risk - documented)

---

### ✅ Issue 2: Mermaid Security Level - FIXED

**Evidence from `components/rich-content/mermaid-diagram.tsx:84`:**
```typescript
securityLevel: "strict", // SECURITY: Prevent script injection in diagrams
```

---

### ✅ Issue 3: Auth Utility Created - READY TO USE

**File:** `lib/api-auth.ts` (155 lines)

**Provides:**
- `verifyAuth(req)` - Edge-compatible auth verification
- `requireAuth(handler)` - Middleware wrapper
- `checkRateLimit(identifier, options)` - Rate limiting
- `getApiKeyFromRequest(req, keyName)` - Get API key from headers

**Note:** This utility exists and is ready, but API routes don't import it yet.

---

## Part 2: Security - WHAT'S NOT FIXED

### ❌ Issue 1: Voice API Keys Still Client→Server

**Files still affected:**
```
lib/voice.ts:93      - apiKey: string,
lib/voice.ts:201     - formData.append('apiKey', apiKey)
lib/voice.ts:298     - apiKey: string,
lib/voice.ts:318     - apiKey,

app/api/whisper/route.ts:9  - const apiKey = formData.get('apiKey')
app/api/tts/route.ts:16     - const { ...apiKey } = await req.json()
```

**Fix needed:**
1. Remove `apiKey` params from voice.ts functions
2. Use `process.env.OPENAI_API_KEY` in API routes
3. Update call sites in chat-input.tsx, simple-chat-input.tsx

---

### ❌ Issue 2: API Routes Not Using Auth

**api-auth.ts exists but no routes import it:**
```
❌ app/api/chat/route.ts - No verifyAuth import
❌ app/api/search/route.ts - No verifyAuth import
❌ app/api/embeddings/route.ts - No verifyAuth import
❌ app/api/generation/route.ts - No verifyAuth import
❌ app/api/whisper/route.ts - No verifyAuth import
❌ app/api/tts/route.ts - No verifyAuth import
```

**Fix needed:** Add `import { verifyAuth } from '@/lib/api-auth'` and use it

---

### ❌ Issue 3: Rate Limiting Still In-Memory

Both `lib/rate-limit.ts` and `lib/api-auth.ts` use in-memory Map:
```typescript
const rateLimitMap = new Map<string, ...>()
```

**Risk:** Resets on server restart, not shared across serverless instances

---

## Part 3: Performance - WHAT'S FIXED

### ✅ Mermaid Lazy Loading - FIXED (Dec 17, 2025)

**Commit:** 11073bc - "perf: Optimize markdown rendering and lazy load Mermaid (~400KB reduction)"

**Files created:**
- `components/rich-content/lazy-mermaid.tsx` - Dynamic import wrapper
- `components/rich-content/lazy-math.tsx` - KaTeX dynamic import

**Bundle savings:** ~400KB (Mermaid only loads when diagram rendered)

---

### ✅ Context Splitting - FIXED

**Contexts now separated:**
```
contexts/settings-context.tsx ✅
contexts/chats-context.tsx ✅
contexts/auth-context.tsx ✅
contexts/app-context.tsx (still exists but slimmer)
```

---

### ✅ GPU/Streaming Performance - FIXED (Dec 13, 2025)

**Per CHANGELOG v0.10.3-beta and v0.10.4-beta:**
- Disabled backdrop-blur on desktop
- Disabled heavy animations (spin, pulse, ping)
- Throttled streaming state updates (100+/sec → 20/sec)
- Limited streaming history to 50 entries
- Debounced SearchService index rebuilds

---

### ✅ SyntaxHighlighter Dynamic Import - FIXED

**Evidence from `components/chat-messages.tsx:42`:**
```typescript
const SyntaxHighlighterWithStyle = dynamic(...)
```

---

## Part 4: Performance - WHAT'S NOT FIXED

### ❌ Virtual Scrolling - NOT IMPLEMENTED

No `useVirtualizer` or `@tanstack/react-virtual` in codebase.

**Impact:** Long conversations (100+ messages) still render all DOM nodes

---

## Remaining Action Items

### 🔴 Critical (Voice Security)
1. **Fix voice API key exposure** - Only remaining critical security issue
   - Remove apiKey params from `lib/voice.ts`
   - Use env vars in `app/api/whisper/route.ts` and `app/api/tts/route.ts`

### 🟠 High Priority
2. **Wire up api-auth.ts** - Add imports to API routes
3. **Persistent rate limiting** - Redis or Supabase-backed

### 🟡 Medium Priority
4. **Virtual scrolling** - For long conversations

---

## Files Summary

### Security (FIXED):
| File | What Was Done |
|------|---------------|
| `contexts/app-context.tsx` | API keys removed from localStorage for logged-in users |
| `components/rich-content/mermaid-diagram.tsx` | securityLevel: "strict" |
| `lib/api-auth.ts` | NEW - Auth utility created |
| `scripts/046_add_secure_api_keys_table.sql` | NEW - Supabase table for keys |

### Performance (FIXED):
| File | What Was Done |
|------|---------------|
| `components/rich-content/lazy-mermaid.tsx` | NEW - ~400KB savings |
| `components/rich-content/lazy-math.tsx` | NEW - KaTeX lazy load |
| `components/chat-messages.tsx` | Static components extracted, SyntaxHighlighter dynamic |
| `app/globals.css` | GPU animations disabled |
| `components/chat-input.tsx` | Streaming throttled |

### Security (NOT FIXED):
| File | Issue |
|------|-------|
| `lib/voice.ts` | API key params still exist |
| `app/api/whisper/route.ts` | Gets key from client |
| `app/api/tts/route.ts` | Gets key from client |
| `app/api/chat/route.ts` | No auth verification |
| `lib/rate-limit.ts` | In-memory only |

---

*Last verified: December 18, 2025 via deep code inspection*
*Reviewed commits: 6a065a4, 11073bc, and 28 others*
