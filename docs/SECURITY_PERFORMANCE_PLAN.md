# Security Hardening & Performance Optimization Plan

> **Last Verified:** December 18, 2025 (Final security push - v0.10.5-beta)
> **Status:** ✅ ALL CRITICAL SECURITY ITEMS FIXED

---

## Current Status Summary

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| localStorage API keys exposure | **CRITICAL** | ✅ **FIXED** | Keys removed for logged-in users |
| Voice API keys client→server | **CRITICAL** | ✅ **FIXED** | Now uses server-side env var |
| API route authentication | High | ✅ **FIXED** | Voice routes use verifyAuth() |
| Mermaid security level | Medium | ✅ **FIXED** | Changed to `securityLevel: "strict"` |
| Mermaid lazy loading | High | ✅ **FIXED** | ~400KB bundle reduction |
| KaTeX lazy loading | Medium | ✅ **FIXED** | lazy-math.tsx created |
| Context splitting | High | ✅ **FIXED** | settings, chats, auth contexts separated |
| GPU/Streaming performance | Critical | ✅ **FIXED** | Throttled updates, removed animations |
| SyntaxHighlighter dynamic import | Medium | ✅ **FIXED** | Already in chat-messages.tsx |
| api-auth.ts utility | High | ✅ **DEPLOYED** | Used in voice routes |
| Rate limiting persistence | Medium | ⚠️ **IN-MEMORY** | Acceptable for current scale |
| Virtual scrolling | Low | ❌ **NOT DONE** | Future optimization |

---

## Part 1: Security - ALL CRITICAL ISSUES FIXED

### ✅ Issue 1: Voice API Keys - FIXED (Dec 18, 2025)

**What was done:**
1. Removed `apiKey` parameter from `startWhisperListening()` and `speakWithOpenAI()` functions
2. API routes now use `process.env.OPENAI_API_KEY` exclusively
3. Added `verifyAuth()` to `/api/whisper` and `/api/tts` routes
4. Updated all call sites in components

**Files changed:**
- `lib/voice.ts` - Removed apiKey params from function signatures
- `app/api/whisper/route.ts` - Uses env var + auth verification
- `app/api/tts/route.ts` - Uses env var + auth verification
- `components/chat-input.tsx` - Removed apiKey argument
- `components/simple-chat-input.tsx` - Removed apiKey argument
- `components/chat-messages.tsx` - Removed apiKey argument
- `components/settings-dialog.tsx` - Removed apiKey argument

**Security model:**
- Server uses `OPENAI_API_KEY` from environment
- Users must be authenticated OR in guest mode
- Unauthorized requests return 401

---

### ✅ Issue 2: localStorage API Keys - FIXED (Dec 17, 2025)

**Commit:** 6a065a4

**What was done:**
1. **For logged-in users:** API keys removed from localStorage after Supabase sync
2. **Keys stored in React state only** (memory) for session use
3. **Keys saved to Supabase** with RLS protection
4. **Settings saved WITHOUT apiKeys** to localStorage for logged-in users

**Guest mode:** Still uses localStorage (documented and accepted risk)

---

### ✅ Issue 3: Mermaid Security Level - FIXED (Dec 17, 2025)

**File:** `components/rich-content/mermaid-diagram.tsx:84`
```typescript
securityLevel: "strict", // SECURITY: Prevent script injection in diagrams
```

---

### ✅ Issue 4: API Auth Utility - DEPLOYED (Dec 18, 2025)

**File:** `lib/api-auth.ts`

**Now used in:**
- `/api/whisper/route.ts`
- `/api/tts/route.ts`

**Provides:**
- `verifyAuth(req)` - Edge-compatible auth verification
- `requireAuth(handler)` - Middleware wrapper
- `checkRateLimit(identifier, options)` - Rate limiting

---

## Part 2: Performance - ALL CRITICAL ISSUES FIXED

### ✅ Mermaid Lazy Loading - FIXED (Dec 17, 2025)

**Commit:** 11073bc

**Files:**
- `components/rich-content/lazy-mermaid.tsx` - Dynamic import wrapper
- `components/rich-content/lazy-math.tsx` - KaTeX dynamic import

**Impact:** ~400KB bundle reduction

---

### ✅ Context Splitting - FIXED

**Separated contexts:**
- `contexts/settings-context.tsx`
- `contexts/chats-context.tsx`
- `contexts/auth-context.tsx`

---

### ✅ GPU/Streaming Performance - FIXED (Dec 13, 2025)

**Per CHANGELOG v0.10.3-beta and v0.10.4-beta:**
- Disabled backdrop-blur on desktop
- Disabled heavy animations (spin, pulse, ping)
- Throttled streaming state updates (100+/sec → 20/sec)
- Limited streaming history to 50 entries
- Debounced SearchService index rebuilds

---

## Part 3: Remaining Items (Non-Critical)

### ⚠️ Rate Limiting - In-Memory

Both `lib/rate-limit.ts` and `lib/api-auth.ts` use in-memory Map:
```typescript
const rateLimitMap = new Map<string, ...>()
```

**Risk:** Resets on server restart, not shared across serverless instances
**Status:** Acceptable for current scale, can upgrade to Redis later

---

### ❌ Virtual Scrolling - Not Implemented

No `@tanstack/react-virtual` in codebase yet.

**Impact:** Long conversations (100+ messages) render all DOM nodes
**Status:** Low priority - can be added when needed

---

## Security Checklist for Launch ✅

- [x] API keys not visible in browser Network tab
- [x] API keys not stored in localStorage for logged-in users
- [x] Voice routes use server-side API key
- [x] Voice routes verify user authentication
- [x] Mermaid diagrams prevent script injection
- [x] Guest mode has documented security tradeoffs
- [x] Rate limiting in place (in-memory acceptable for now)

---

*Last verified: December 18, 2025 after v0.10.5-beta security push*
*All critical security items resolved*
