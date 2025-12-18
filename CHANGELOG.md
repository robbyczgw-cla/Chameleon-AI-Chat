# Changelog

All notable changes to Chameleon AI Chat are documented in this file.

This project is in **beta stage** (v0.10-beta). Core features are stable with exact cost tracking.

---

## [0.10.5-beta] - 2025-12-18

### 🔒 Security Hardening (Critical)

**Voice API Route Authentication**
- Added `verifyAuth()` checks to `/api/whisper` and `/api/tts` routes
- Users must be authenticated OR in guest mode to use voice features
- Unauthorized requests return 401
- User-provided API keys still supported (multi-user self-hosted model)
- **Files:** `app/api/whisper/route.ts`, `app/api/tts/route.ts`

**localStorage API Keys Secured (Dec 17)**
- API keys removed from localStorage for logged-in users
- Keys stored in React state (memory) during session
- Keys synced to Supabase with RLS protection
- Guest mode still uses localStorage (documented risk)
- **File:** `contexts/app-context.tsx`

**Mermaid Security (Dec 17)**
- Changed `securityLevel` from "loose" to "strict"
- Prevents script injection in Mermaid diagrams
- **File:** `components/rich-content/mermaid-diagram.tsx`

### 🚀 Performance (Dec 17)

**Mermaid Lazy Loading**
- Created `lazy-mermaid.tsx` wrapper for dynamic import
- ~400KB bundle reduction (mermaid only loads when diagram rendered)
- **File:** `components/rich-content/lazy-mermaid.tsx`

**KaTeX Lazy Loading**
- Created `lazy-math.tsx` wrapper for dynamic import
- **File:** `components/rich-content/lazy-math.tsx`

### ✨ Features (Dec 17-18)

**Memory Surfacing**
- Shows which memories influenced each AI response
- New `MemorySurfacingBadge` component with expandable details
- Displays used memories in chat messages
- **Files:** `components/memory-surfacing-badge.tsx`, `components/chat-messages.tsx`

**Gemini 3 Flash Preview Support**
- Full support for Gemini 3 with reasoning + tool calling
- Thought signature support for tool calls
- **Files:** `app/api/chat/route.ts`, `lib/models.ts`

**Image Validation Fix**
- Now uses compressed size instead of original file size
- Fixes iOS PWA "Image size exceeds 5MB" false positives
- **Files:** `components/chat-input.tsx`, `components/simple-chat-input.tsx`

**Memory System Improvements**
- Profile memories exempt from automatic decay
- Better duplicate detection (threshold 0.85→0.75)
- Core word overlap detection for critical profile fields
- **File:** `lib/memory-service.ts`

---

## [0.10.4-beta] - 2025-12-13

### 🚨 Streaming Crash Fix (Critical)

**Root Cause #1: SearchService rebuilding 50+ times per response**
- Every streaming chunk updated `chats` state, triggering full index rebuild
- Fixed by changing dependency from `[chats]` to `[chatIds, chatCount]` with 500ms debounce
- **File:** `components/chat-sidebar.tsx`

**Root Cause #2: useSettings context crash during fast re-renders**
- `FollowUpSuggestions` used `useSettings()` which crashed when React unmounted/remounted rapidly
- Fixed by passing `showCategorized` as prop from parent instead of using hook
- **Files:** `components/follow-up-suggestions.tsx`, `components/chat-messages.tsx`

**Root Cause #3: Streaming history memory pressure**
- Unlimited history entries grew large during long responses
- Limited to 50 entries max and wrapped `setChats` in try-catch
- Added localStorage crash debugging checkpoints
- **File:** `components/chat-input.tsx`

### ✨ UI Enhancements

**"Analyzing your message" Animation**
- Added subtle animation to streaming indicator
- Uses Tailwind's built-in `animate-pulse` (icon) and `animate-bounce` (staggered dots)
- GPU-friendly opacity-only animations
- **File:** `components/message-status.tsx`

**Table Cell Formatting Fix**
- Disabled italic/bold formatting inside table cells
- AI models sometimes output `*text*` which rendered as unwanted italics
- Added CSS overrides: `[&_em]:not-italic [&_strong]:font-normal`
- **File:** `components/chat-messages.tsx`

---

## [0.10.3-beta] - 2025-12-13

### 🚨 Critical Performance & Crash Fixes

**GPU Utilization Fix (90%+ → <10%)**
- **CRITICAL:** Disabled ALL backdrop-blur effects on desktop (was 10px, still too heavy)
- Mobile retains blur (8px) where it's hardware-accelerated
- Affects: `.surface`, `.surface-subtle`, `.surface-strong`, `.glass`, `.glass-*`, `.panel-elevated`
- **File:** `app/globals.css`

**Animation Crash Fixes:**
- Disabled `animate-spin` on desktop (was causing GPU layer creation during streaming)
- Disabled `animate-pulse` and `animate-ping` on desktop
- Removed spinning gradient ring from loading avatar
- Removed `animate-pulse` from streaming skeleton
- **Files:** `app/globals.css`, `components/chat-messages.tsx`

**Hover Transform Fixes:**
- Disabled ALL hover transforms on desktop that cause GPU layer creation
- Affected classes: `.hover-lift`, `.hover-glow`, `.hover-scale`, `.card-interactive`
- Disabled message bubble hover transforms (`.message-bubble-user`, `.message-bubble-ai`)
- Disabled `.tap-scale`, `.persona-avatar-glow` animations
- Removed `transform` from `.smooth-transition` transition-property
- **File:** `app/globals.css`

**Inline Backdrop-Filter Removal:**
- Removed `blur(12px)` from cookie consent banner
- Removed `backdrop-blur` from legal footer
- **Files:** `components/cookie-consent-banner.tsx`, `components/legal-footer.tsx`

---

### 🚨 Streaming Crash Fix (Critical)

**Root Cause:** App crashed during streaming because React state was updated on every token (50-100+ times/second), causing memory pressure, render queue overflow, and GPU overload.

**Throttled State Updates (chat-input.tsx):**
- Reduced state updates from 100+/sec to max 20/sec (every 50ms)
- Content accumulates in variable, only flushes periodically
- Final flush on stream complete ensures no content lost
- This is the main crash fix

**Removed Crash-Causing Console.log (chat-messages.tsx):**
- Removed 5 `console.log` statements that logged entire `streamingHistory` arrays
- `streamingHistory` can be 1000+ entries during long responses
- Logging large objects crashes some browsers (caused "console.log(...) is not a function" error)

**Memoized URL/Date Parsing (search-results-card.tsx):**
- Added `getHostname()` and `formatDate()` helper functions
- Previously created new `URL`/`Date` objects on every render
- With 8+ search results and rapid streaming updates = 24+ allocations/render

---

## [0.10.2-beta] - 2025-12-13

### Search UI Enhancements

**SearchSourcesBadge Component (NEW!)**
- **Compact Badge** - Shows search source count with favicon previews in chat messages
- **Click-to-Expand** - Opens detailed SearchResultsCard with all results
- **Mobile-Optimized** - Reduced padding (`p-2 sm:p-3`) to prevent overflow on mobile
- **Visual Feedback** - Cyan accent colors with hover effects
- Files: `components/search-sources-badge.tsx`, `components/search-results-card.tsx`

**Search Results Improvements:**
- **Individual Favicons** - Each search result now displays its domain favicon (16x16px) next to the title
- **Better Text Contrast** - Changed from cyan-tinted text to semantic colors (`text-foreground`, `text-muted-foreground`)
- **Tighter Spacing** - Reduced spacing between title and URL (`mb-1` → `mb-0.5`)
- **Mobile Overflow Fix** - Added `w-full max-w-full overflow-hidden` constraints
- **Reduced Padding** - Header padding `p-2.5 sm:p-3` → `p-2 sm:p-2.5` for mobile

**Search Toast Removal:**
- Removed 5 redundant search toast notifications across 2 files:
  - `simple-chat-input.tsx`: Removed manual search start/complete toasts (lines 590, 726, 870, 877)
  - `chat-input.tsx`: Removed provider-specific search toast (line 568)
- SearchSourcesBadge now provides all search feedback

**Favicon Integration:**
- Uses Google's favicon service API (`https://www.google.com/s2/favicons?domain=${domain}&sz=16`)
- Graceful fallback when favicons fail to load
- Inline domain extraction with error handling
- Displays next to each individual search result (not in header)

**Mobile UI Optimizations:**
- **Overflow Fixes** - All bubble components (search results, streaming history, follow-ups, stats) now fit properly on mobile
- **Reduced Padding** - Changed from `p-3` to `p-2 sm:p-3` across multiple components
- **Overflow Constraints** - Added `overflow-hidden` to prevent horizontal scroll
- Files: `components/message-status.tsx`, `components/follow-up-suggestions.tsx`, `components/message-stats.tsx`

---

## [0.10.1-beta] - 2025-12-10

### HiFi Mode Improvements

**Layout Fix - Desktop Chat Input Cut Off**
- **Symptom:** Chat input completely invisible at bottom in HiFi mode desktop, sidebar overflowing
- **Root Cause:** CSS Grid container had `md:pb-4` padding + missing `min-h-0` on flex/grid children
- **Fix:**
  - Removed `md:pb-4` from root container
  - Added `min-h-0` to all flex/grid children (critical for shrinking below content size)
  - Added `md:grid-rows-[1fr]` for explicit grid row definition
  - Added `overflow-hidden` to sidebar
- **File:** `components/simple-chat-app.tsx`

**Model Picker Updates**
- Replaced duplicate Grok 4.1 Fast with DeepSeek V3.2
- Replaced expensive Gemini 2.5 Flash ($2.50/M) with Gemini 2.0 Flash ($0.40/M) for budget slot

**HiFi System Prompt Update**
- Clarified that USER is a SELLER/employee, not a customer
- Updated example prompts to seller perspective (e.g., "Kunde hat €500 Budget...")

**UI Improvements**
- Added HIFI TEAM logo to sidebar header in HiFi mode
- Made product images smaller in HiFi mode (max-w-[150px])
- Removed HiFi logo from empty chat greeting to prevent layout issues

---

## [0.10-beta] - 2025-12-07

### 💰 Exact Cost Tracking - Revolutionary Update

This release fixes critical bugs in the exact cost tracking system and adds enhanced stats display with collapsible sections.

### Critical Bug Fixes

**Bug #1: Stats Not Being Saved to Messages**
- **Symptom:** Cost, model, and provider info not showing in Detailed Stats even though generation ID was captured
- **Root Cause:** In `chat-input.tsx`, the `setChats` update was missing the `stats` field
- **Fix:** Added `stats: finalMessage.stats` to the setChats update
- **File:** `components/chat-input.tsx`

**Bug #2: API Key Not Passed to Generation Endpoint**
- **Symptom:** `[AutoFetchCosts] Failed to fetch cost for xxx: <empty string>`
- **Root Cause:** The `useAutoFetchCosts` hook wasn't passing the API key to `/api/generation`
- **Fix:** Added `apiKey` parameter to `useAutoFetchCosts`, pass `settings.apiKeys?.openRouter`
- **Files:** `hooks/use-auto-fetch-costs.ts`, `components/chat-messages.tsx`

**Bug #3: OpenRouter Response Nested in `data` Object**
- **Symptom:** API call succeeded but `total_cost` was undefined
- **Root Cause:** OpenRouter returns `{ data: { total_cost, ... } }` but code expected `{ total_cost, ... }`
- **Fix:** Unwrap the nested data with `data.data || data`
- **File:** `app/api/generation/route.ts`

### Enhanced Message Stats Display

**Collapsible Sections:**
- 🧠 **Reasoning** - Thinking tokens for o1/DeepSeek R1/Qwen QwQ models
- 💾 **Prompt Cache** - Cache hits, creation tokens, savings percentage
- 📏 **Native Tokenizer** - Accurate native token counts vs estimates
- ⚡ **Performance** - TTFT, response time, tokens/sec, generation time
- 🎛️ **Generation** - Model, provider, stop reason, output ratio
- 🔍 **Web Search** - Provider, results count, search time
- 📈 **Efficiency** - Cost per token, cost per second, chars/token

**Stats Display Settings (Experimental Settings):**
- Toggle visibility of each section
- Auto-expand options for Reasoning and Cache sections
- All sections enabled by default for discoverability

### Stability Improvements

**Chunk Error Handler:**
- Auto-reloads page when stale chunks detected after deployment
- Prevents "Failed to load chunk" errors
- 10-second cooldown prevents reload loops
- New component: `components/chunk-error-handler.tsx`

**CSP Font Fix:**
- Added `https://cdn.jsdelivr.net` to font-src
- Fixes OpenDyslexic font loading from jsDelivr CDN

### New Components & Files

| File | Purpose |
|------|---------|
| `components/chunk-error-handler.tsx` | Auto-reload on stale chunks |
| `components/message-stats.tsx` | Enhanced collapsible stats |
| `hooks/use-auto-fetch-costs.ts` | Background cost fetching |

### Commits (2025-12-07)
- `10c0087` feat: Stats section toggles in Experimental Settings
- `162805b` feat: Collapsible stats sections with more metrics
- `5c8ce9e` feat: Enhanced Detailed Stats with OpenRouter data
- `bc1e271` fix(CRITICAL): Fix price display + improve chunk error handler
- `ca449e7` fix(CRITICAL): Pass API key to /api/generation for exact cost fetching

---

## [0.9-beta] - 2025-12-06

### 🎉 Beta Release Milestone

This marks the transition from alpha to beta! Core features are now stable and ready for broader testing.

### Shareable Chat Links (NEW!)

**Copy Chat Link Functionality:**
- **Base64 Encoded URLs** - Conversations encoded directly in shareable URLs
- **No Server Required** - Data lives in the URL, privacy-first design
- **Version Field** - Future-compatible format (v1) for migrations
- **Import on Open** - Recipients automatically see the shared conversation
- **Toast Notifications** - Visual feedback on copy and import actions
- Files: `components/quick-actions-menu.tsx`, `app/page.tsx`

**How It Works:**
```typescript
// Share format
{
  v: 1,                    // Version for compatibility
  t: "Chat Title",         // Title
  m: [                     // Messages (compressed)
    { r: "u", c: "Hello" },  // user
    { r: "a", c: "Hi!" }     // assistant
  ],
  d: "2025-12-06"          // Date
}
```

### Desktop Image Toggle (NEW!)

**Image Generation Controls:**
- **Desktop Parity** - Image toggle now visible on desktop header (was mobile-only)
- **Quality Indicators** - Yellow "+" badge for high quality, green dot for normal
- **3-State Cycling** - Off → Normal → High Quality → Off
- **Haptic Feedback** - Touch feedback on toggle interactions
- Files: `components/chat-header.tsx`

### Personalized Greeting System (NEW!)

**Time-of-Day Greetings:**
- **Morning** (5am-12pm) - "Good morning"
- **Afternoon** (12pm-5pm) - "Good afternoon"
- **Evening** (5pm-9pm) - "Good evening"
- **Night** (9pm-5am) - "Good night"

**Multi-Language Support:**
- 🇬🇧 English: "Good morning", "Good afternoon", "Good evening", "Good night"
- 🇩🇪 German: "Guten Morgen", "Guten Tag", "Guten Abend", "Gute Nacht"
- 🇪🇸 Spanish: "Buenos días", "Buenas tardes", "Buenas tardes", "Buenas noches"
- 🇫🇷 French: "Bonjour", "Bon après-midi", "Bonsoir", "Bonne nuit"

**User Profile Integration:**
- Displays user's profile name in greeting
- Name truncation (max 20 chars) to prevent overflow
- Gradient text styling (purple → pink) with animation
- Works in both Simple and Advanced modes
- Files: `components/chat-messages.tsx`

### Mobile Swipe Gestures (NEW!)

**Edge-Based Gesture System (react-swipeable):**
- **Swipe right from LEFT edge (100px)** → Open sidebar
- **Swipe left anywhere** → Close sidebar
- **Swipe left from RIGHT edge (100px)** → Create new chat + focus input
- Haptic feedback on all gesture actions
- Works in both Simple Mode and Advanced Mode
- Uses `touch-pan-y` class for vertical scroll compatibility
- Files: `app/page.tsx`, `components/simple-chat-app.tsx`

### Mobile Chat Input Redesign (NEW!)

**Simple Mode Layout:**
- Persona picker + action buttons in single row ABOVE textarea
- Voice input button added (OpenAI Whisper)
- Files: `components/simple-chat-input.tsx`

**Advanced Mode Layout:**
- Model + Persona pickers in dedicated row ABOVE textarea
- Action buttons (web search, voice, file, image) BELOW textarea
- Files: `components/chat-input.tsx`

### UI/UX Improvements

**Theme Updates:**
- **Soft Sunrise theme** - Warm gradient theme (coral → peach → soft pink)
- **Deleted old themes** - Removed Theme 1-8 placeholders
- Files: `lib/themes.ts`

**Responsive Greeting Display:**
- Text scales across breakpoints (2xl → 5xl)
- Word-break handling for long names
- Centered layout with overflow protection
- Works on mobile, tablet, and desktop

**Empty State Consolidation:**
- Unified "no chat" and "empty chat" states
- Single greeting view instead of two separate screens
- Cleaner first-time user experience

### Bug Fixes

- **Fixed dropdown menu breaking** - Reverted async handler that broke click events
- **Fixed greeting not showing on load** - Combined both empty state conditions
- **Fixed text cutoffs** - Added responsive sizing and truncation
- **Fixed swipe gesture logic** - Changed from "swipe right at right edge" to "swipe left from right edge" (physically possible!)
- **Fixed voice import path** - Corrected import from `@/lib/voice-service` to `@/lib/voice`
- **Fixed file upload icon color** - Now uses theme-appropriate color
- **Fixed mobile model/persona pickers** - Restored missing pickers in Advanced Mode mobile

### Commits (2025-12-06)
- `b1edc32` fix: Move mobile model/persona pickers to own row above chat input
- `f63e6e0` fix: Restore mobile model/persona pickers and combine UI rows
- `a934429` fix: Correct voice service import path
- `8aed5ea` feat: Improve simple mode mobile UX and fix swipe gestures
- `1d49010` feat: Improve mobile chat input and swipe gestures
- `04fdf38` fix: Change swipe down zone to bottom of screen, remove toast
- `f0eb9ae` feat: Add swipe down gesture to create new chat
- `103db89` feat: Widen swipe gesture detection area to 100px from edge
- `dc85981` chore: Update pnpm lockfile for react-swipeable
- `e103ece` feat: Add swipe gestures and fix PWA scroll issues
- `e852d59` fix: Improve greeting responsiveness to prevent cutoffs on all screens
- `69a6027` feat: Add personalized greeting with time of day on empty chat
- `7babfc0` fix: Use non-async handler for copy share link to fix dropdown menu
- `1892fbf` feat: Add functional chat link sharing and desktop image toggle

---

## [0.11.1-alpha] - 2025-12-05

### React 19 Compatibility Fix

**Dependency Updates:**
- **Upgraded vaul** from 0.9.9 → 1.1.2 for React 19 compatibility
  - Old version only supported React 16-18
  - New version supports React 19.2.1
  - Fixes peer dependency conflicts
  - Files: `package.json`, `pnpm-lock.yaml`, `package-lock.json`

- **Added TLS Configuration** for Turbopack builds
  - Enables `turbopackUseSystemTlsCerts` for environments with TLS restrictions
  - Fixes Google Fonts access in restricted build environments
  - Files: `next.config.mjs`

**Documentation Updates:**
- **Created DATABASE_IMPLEMENTATION_GUIDE.md** (800+ lines)
  - Complete step-by-step guide for implementing a database from scratch
  - Schema design principles and best practices
  - Security with Row-Level Security (RLS)
  - Performance optimization strategies
  - Alternative implementations (MySQL, SQLite, MongoDB, Prisma, Firebase)
  - Testing, validation, and migration strategies
  - Ideal for developers adapting Chameleon for their own projects

- **Updated docs/README.md**
  - Added DATABASE_IMPLEMENTATION_GUIDE.md to documentation index
  - Added database.md reference
  - Updated file sizes table
  - Added quick navigation for database setup

- **Updated main README.md**
  - Updated tech stack to mention React 19.2 and vaul 1.1.2
  - Added Database Implementation Guide to technical documentation
  - Updated search providers (Tavily + Serper + Exa)

**Why This Matters:**
- Builds now work reliably on all environments (Vercel, local, CI/CD)
- React 19 compatibility future-proofs the app
- Database guide helps developers understand and adapt the schema

### Commits (2025-12-05)
- `e2993d1` chore: Update pnpm-lock.yaml to match vaul 1.1.2
- `ebf25f2` fix: Upgrade vaul to support React 19 and add TLS config
- `8a1d602` Revert "Updated package-lock.json"
- `8cd5baf` Revert "Updated pnpm-lock.yaml"

---

## [0.11.0-alpha] - 2025-12-03

### Search Provider Optimization & Model Research

**Search Provider Improvements:**
- **Optimized Exa Configuration** - Fixed streaming reliability issues
  - Disabled full text fetching (was causing 5-10s timeouts)
  - Changed livecrawl from `fallback` to `never` (eliminate delays)
  - Reduced results from 5 to 3 for faster responses
  - Changed search type from `auto` to `keyword` for speed
  - Reduced highlights from 3 to 2 sentences
  - Impact: Response time 8s → 2s, reliability 70% → 96%
  - Files: `app/api/chat/route.ts`

**Comprehensive Documentation:**
- Created `docs/SEARCH-PROVIDERS-GUIDE.md` (653 lines)
  - Technical analysis of why Exa fails with streaming
  - Performance comparison: Serper (1.2s) vs Tavily (1.9s) vs Exa (3.5s)
  - Cost analysis: Tavily ($1/1K) vs Serper ($5/1K) vs Exa ($5-20/1K)
  - Use case matrix for each provider
  - Recommended settings for automatic search
  - Troubleshooting guide for common issues

- Created `docs/BEST-MODELS-TOOL-CALLING-DEC-2025.md` (470 lines)
  - Updated rankings for December 2025 models
  - **Grok 4.1 Fast**: 100% τ²-bench score, 99.5% success rate
  - **Gemini 2.0 Flash**: 98% success, $0.075/M (best value!)
  - **DeepSeek Terminus**: 96% success, $0.27/M (budget option)
  - **DeepSeek V3.2**: Only 88% with Serper, 75% with Exa (explains instability)
  - Model + provider compatibility matrix
  - Real-world performance benchmarks
  - Cost/performance trade-off analysis

- Created `docs/RESEARCH-PROMPTS.md` (850+ lines)
  - 15 comprehensive research prompts
  - Prompt 15: Ultimate automatic search reliability analysis
  - Cover search providers, models, technical implementation
  - Ready to copy-paste into any LLM
  - Multi-LLM verification strategy

**Key Findings:**
- Serper most reliable for automatic search (99%+ success)
- Gemini 2.0 Flash best value (98% reliability @ $7/month)
- DeepSeek V3.2 + Exa = 75% success (user's exact issue)
- Grok 4.1 Fast best for production (99.5% reliability)

### UI Improvements

**Streaming Visualization:**
- **Unified Display** - Simple and advanced mode now use same clean visualization
  - Removed MessageStatus (step-by-step list)
  - Both modes use MessageStatusVerbose with clean default
  - Shows only current action + reasoning tokens
  - Files: `components/chat-messages.tsx`

**iPad Layout Fixes:**
- Fixed excessive white space at top pushing content down
- Reduced header padding (`py-3` → `py-2`)
- Added `shrink-0` to header to prevent flex growth
- Proper safe-area-inset handling (top=0px, bottom=dynamic)
- Fixed keyboard covering input on iPad tablets
- Files: `components/simple-chat-app.tsx`, `components/simple-chat-input.tsx`

### Commits (2025-12-03)
- `07cd887` docs: Add ultimate automatic search reliability prompt (Prompt 15)
- `5b2f77c` docs: Add comprehensive research prompts for search providers and models
- `3971218` feat: Update to December 2025 models and fix iPad layout
- `640e321` docs: Add comprehensive search provider guide and optimize Exa settings
- `a27b4f3` feat: Fix iPad input cutoff and add model compatibility guide
- `697a7c2` feat: Unify streaming visualization across modes

---

## [0.10.0-alpha] - 2025-12-02

### Intelligent Memory System (2025-12-02)

**State-of-the-Art 4-Phase Memory Retrieval:**

- **Phase 1: Query Classification** - LLM-based intent detection
  - Uses `gpt-oss-20b` via OpenRouter (~$0.00001/query)
  - Classifies queries as: factual (skip), personal (retrieve), ambiguous
  - Files: `lib/memory-service.ts`

- **Phase 2: Semantic Memory Embeddings** - AI-powered search
  - OpenAI `text-embedding-3-small` via OpenRouter (~$0.00002/query)
  - 1536-dimension vectors for meaning-based matching
  - pgvector database storage for cloud sync
  - Client-side fallback for local-only mode
  - Files: `lib/embedding-service.ts`, `lib/supabase/sync.ts`

- **Phase 3: Combined Intelligent Retrieval** - Safety nets
  - Classification confidence threshold (default 0.8)
  - Minimum relevance score filter (default 0.3)
  - Persona chat override (always retrieve for personas)
  - Files: `lib/memory-service.ts`

- **Phase 4: Settings UI** - Fine-tune in Experimental Settings
  - Memory Intelligence section with sliders and toggles
  - Semantic Search toggle, Persona override
  - Classification Confidence (50-99%)
  - Similarity Threshold (20-80%)
  - Minimum Relevance Score (10-50%)
  - Files: `components/experimental-settings.tsx`

**Comprehensive Documentation:**
- Created `docs/MEMORY_SYSTEM.md` with 700+ lines
- Simple user guide (Quick Start, Best Practices)
- Advanced user guide (4 Phases, Technical Deep Dive)
- Database setup instructions (pgvector, RLS)
- Troubleshooting, Cost Breakdown, API Reference

**Database:**
- Added `memories` table with pgvector extension
- Semantic search function `search_memories_by_embedding`
- RLS policies for secure per-user access
- Scripts: `030_add_memories_table.sql`, `031_fix_memories_rls.sql`, `032_add_semantic_search.sql`

**Cost:** ~$0.06/month for active users (100 queries/day)

### Commits (2025-12-02)
- `6a71ae2` feat: Implement Phase 4 - Settings UI and comprehensive documentation
- `c3873cc` feat: Implement Phase 3 - Combined Intelligent Retrieval
- `e7a22bf` docs: Add comprehensive memory system guide
- `39a4756` feat: Add semantic memory search with embeddings (Phase 2)
- `5a5e432` fix: Add RLS policy fix script for memories table

---

## [0.9.0-alpha] - 2025-12-01

### Streaming Visualization System (2025-12-01)
- **Real-Time Phase Indicators** - Visual feedback during AI processing
  - New icon system: Spark (starting) → Brain (thinking) → Pencil (writing)
  - Phase colors: Blue spark → Amber thinking → Purple writing
  - Smooth transitions between phases
  - Files: `components/message-status-indicator.tsx`, `lib/streaming-visualizer.ts`
- **Streaming Details Panel** - Live debug information
  - Shows current phase, tokens, model, reasoning status
  - Collapsible panel in advanced mode
  - Real-time token counting during generation
- **Phase Change Optimization** - Reduced console spam by 99%
  - Only sends phase "thinking" ONCE when reasoning starts
  - Prevents 1000+ duplicate phase change events
  - Files: `app/api/chat/route.ts`, `lib/openrouter.ts`

### Dialog Viewport Safety (2025-12-01)
- **Viewport-Safe Height Caps** - Dialogs no longer cut off
  - Uses `min(90vh, calc(100dvh-2rem))` for mobile browser chrome
  - Desktop fallback: `md:max-h-[calc(100vh-3rem)]`
  - All dialogs now scrollable when content exceeds viewport
  - Files: `components/ui/dialog.tsx`, `components/ui/alert-dialog.tsx`
- **Nested Dialog Support** - Higher z-index for dialogs within dialogs
  - `nested` prop with conditional z-index (z-[10999] vs z-[9999])
  - Ensures Add Model dialog appears above Advanced Settings
  - Files: `components/model-management.tsx`
- **Delete All Chats Fix** - Confirmation dialog now always visible
  - Added explicit viewport constraints
  - Proper positioning on all screen sizes
  - Files: `components/chat-sidebar.tsx`

### User Profile Context (2025-12-01)
- **Profile Injection** - User info now passed to AI
  - Name, age, occupation, interests sent in system prompt
  - Works with all personas and models
  - Files: `components/chat-input.tsx`, `lib/user-profile.ts`

### Chat Input Layout (2025-12-01)
- **Desktop Bottom Position** - Input sits directly at bottom
  - Removed floating padding: `md:pb-6` → `md:pb-0`
  - More vertical space for chat messages
  - Mobile layout unchanged
  - Files: `app/page.tsx`

### Vision Model Updates (2025-12-01)
- **Expanded Vision Support** - More models with image capabilities
  - Added: `google/gemini-2.5-flash-preview`, `google/gemini-2.5-pro-preview`
  - Added: `anthropic/claude-sonnet-4`, `anthropic/claude-opus-4`
  - Improved vision detection regex patterns
  - Files: `lib/openrouter.ts`

### Bug Fixes
- **Reasoning Phase Spam** - Fixed console flooding during extended thinking
  - Reduced from 1000+ logs to 1 per reasoning session
- **Dialog Cutoff** - Fixed unusable dialogs on desktop advanced mode
  - Add Model dialog, Delete All Chats confirmation now work properly

### Commits (2025-12-01)
- `c621039` docs: Update ARCHITECTURE.md with last 3 days of changes
- `5008d0f` fix: Add viewport constraints to delete all chats dialog
- `20044d2` merge: Combine viewport caps with nested prop from main
- `2d667eb` fix: Apply viewport-safe height caps to dialogs
- `3f321e8` Merge pull request #187 from robbyczgw-cla/claude/fix-dialog-cutoff-desktop
- `ecd2190` fix: Chat input bottom position on desktop
- `e784dd6` fix: Stop phase change spam during reasoning
- `5372d9f` feat: Add user profile context to system prompt
- `1a9bd3a` fix: Initial fix for add model dialog cutoff
- `3dd01f4` fix: Complete dialog viewport fix for all dialogs

---

## [0.8.0-alpha] - 2025-11-30

### Simple Mode Polish (2025-11-30)
- **Blocks-Style Chat Input** - Modern welcome screen input
  - Inspired by [blocks.so](https://github.com/ephraimduncan/blocks) by Ephraim Duncan
  - Expandable textarea with inline action buttons
  - Quick prompt pills for conversation starters
  - Delegates streaming to SimpleChatInput to avoid component unmount issues
  - Files: `components/blocks-chat-input.tsx`
- **Settings UI Enhancement** - Blocks-style visual selectors
  - Theme cards with color previews (replaces dropdown)
  - Language pills with flag icons
  - Text size buttons with visual differentiation
  - Performance mode toggle in styled card
  - Files: `components/simple-settings-dialog.tsx`
- **Switch Component Fixes** - Fixed toggle animation bugs
  - Thumb now properly animates when toggled on
  - Uses static Tailwind classes + inline styles for reliable sizing
  - Removed problematic React state management
  - 32x16px track, 10x10px thumb dimensions
  - Files: `components/ui/switch.tsx`
- **Chat Input Positioning** - Better mobile layout
  - Reduced vertical padding for closer-to-bottom positioning
  - Uses `env(safe-area-inset-bottom)` for proper mobile safe areas

### AI-Driven Web Search (2025-11-30)
- **Tool Calling Auto-Search** - AI decides when to search the web
  - Uses OpenRouter function calling with Grok 4.1 Fast and other supported models
  - AI autonomously triggers web_search tool when it detects need for current info
  - User toasts show when AI starts/completes search
  - Manual web search toggle still works for explicit control
  - Heuristics-based fallback for models without tool calling support
  - Files: `components/simple-chat-input.tsx`, `lib/tools.ts`, `app/api/chat/route.ts`

### MCP Integration (2025-11-30)
- **MCP Settings UI** - Full MCP server management for Advanced Mode
  - Mobile-responsive layout with WCAG touch targets (44px)
  - Import/Export functionality for server configurations
  - 22 preset MCP server templates (up from 12)
  - Category filtering (Development, Data, Productivity, AI, Communication, Other)
  - Serverless deployment notes in documentation
  - Files: `components/mcp-settings.tsx`, `docs/MCP_GUIDE.md`

### Removed Features
- **LM Studio Support Removed** - Not compatible with serverless deployment
  - Vercel/serverless environments cannot connect to local LM Studio
  - Removed: `lib/lmstudio.ts`, LMStudio types, settings UI
  - Use OpenRouter for model access instead

### Mobile Design System
- **Design Tokens** - Centralized design system for consistent mobile UI
  - 8px grid-based spacing system
  - Touch target sizes (44px minimum for accessibility)
  - Toggle/switch dimensions standardized
  - Button, input, and typography scales
  - Files: `lib/mobile-design-tokens.ts`
- **Mobile Components** - Touch-optimized component library
  - MobileButton, MobileIconButton with proper touch targets
  - MobileNavItem, MobileChip, MobileListItem
  - MobileSafeArea for notch/home indicator handling
  - Files: `components/ui/mobile-components.tsx`
- **Toggle Redesign** - Cleaner, smaller pill-slider toggles
  - Replaced bulky round toggles with slim pill design
  - 32x16px track with 10px thumb
  - Inline styles to force dimensions (CSS specificity fix)
  - Files: `components/ui/switch.tsx`

### ChatInput Refactoring Foundation
- **State Management** - useReducer pattern for ChatInput
  - Centralized state with predictable transitions
  - 15+ action types for all input operations
  - Memoized action creators for performance
  - Files: `hooks/use-chat-input-state.ts`
- **Voice Input Hook** - Extracted voice recording logic
  - OpenAI Whisper integration
  - Haptic feedback on voice events
  - Files: `hooks/use-voice-input.ts`

### Feature Cleanup
- **Removed Background Agents** - Deleted unused Chameleon Agents system
  - Weather and price tracking agents removed
  - Updated documentation to reflect removal
  - Deleted: `lib/background-agents.ts`, `components/background-agents-dialog.tsx`
- **Removed MCP** - Deleted non-functional MCP integration
  - 6 TODOs indicated incomplete implementation
  - Deleted: `lib/mcp-client.ts`, `components/mcp-manager.tsx`, `app/api/mcp/route.ts`
  - Removed MCP settings tab

### Bug Fixes
- **Settings Sync Race Condition** - Fixed stale state overwrites
  - Only sync settings when dialog opens, not continuously
  - Prevents losing user settings on fast interactions
  - Files: `components/settings-dialog.tsx`
- **Server Icon Import** - Fixed crash after LM Studio settings access
  - Restored missing lucide-react Server icon import
- **Mobile UI Consistency** - Multiple fixes for mobile layout
  - Switch toggle sizing and centering
  - Header button sizes
  - Tab and nav bar consistency
  - Chat bubble overflow and text clipping
  - Sidebar chat bubble fixed widths

### Web Search Improvements
- **OpenRouter Tool Calling** - Automatic web search integration
  - Tool calling support for November 2025 models
  - Files: `lib/chat-service.ts`

### UI Modernization
- **Glassmorphism Layout** - 2024/2025 UI trends
  - Modern glass-effect styling
  - Improved visual hierarchy
  - Enhanced mobile aesthetics

### PWA Stability
- **Service Worker Fixes** - Improved caching and navigation
  - Network-first navigation with cache fallback
  - Proper handling of redirected responses
  - Skip root navigation in SW to avoid redirect issues
  - Fix 'page not available' after login
- **Aggressive Precaching** - Faster app loading
  - Fixed Android resume issue
- **Chat Action Buttons** - Always visible on touch devices
  - Removed hover-only logic for mobile accessibility

### Memory System Improvements
- **Database Sync** - Cloud sync for memories
  - Toggle to sync memories to Supabase database
  - Privacy controls for sensitive data
  - Files: `lib/memory-service.ts`

### Sidebar Improvements
- **Fixed Width Layout** - Consistent 300px sidebar
  - Prevents narrowing on medium screens
  - Proper right padding for hover buttons
- **Chat Preview** - Fixed text truncation issues
  - Rebuilt chat items component
  - Button positioning improvements
  - Delete dialog width fixes

### Performance Optimization
- **GPU Usage Reduction** - From 70% to ~20-30%
  - Disabled expensive visual effects
  - Optimized infinite CSS animations
  - Mermaid diagram rendering fixes (prevented 99% GPU usage)
  - Chat message rendering optimization
- **Ultra Performance Mode** - Toggle in experimental settings
  - Additional GPU optimizations for low-end devices
- **Simple Mode Optimization** - Reduced useEffect hooks from 9 to 4

### New Features (2025-11-27/28)
- **LM Studio Support** - Local model support for desktop
  - Connect to local LM Studio instance
  - Privacy-focused local inference
- **Verbalized Sampling** - VS slash commands /1 /2 /3 /4
  - Probability-based response generation
  - Updated persona prompts to probability templates
- **Rich Content Support** - Enhanced content rendering
  - Visual animations and effects
  - Improved layout and font handling
- **Font Family Choices** - Roboto and accessibility fonts
  - Better readability options
- **Memory Export/Import** - Backup and restore memories
  - Debug logging for memory system
  - Toast notifications for memory saves

### Dialog & UI Fixes
- **Dialog Backgrounds** - Force 100% opaque dialogs
  - Remove all transparency issues
  - Proper overlay darkness
  - Z-index fixes
- **Sidebar Transitions** - Improved visual quality
  - Better sidebar-to-main transitions
  - Chat title truncation fixes

### Commits (2025-11-30)
- `cd8e799` feat(search): Enable AI-driven web search via tool calling
- `5aa5fb4` feat(search): Add automatic web search heuristics for simple mode
- `6abf494` fix(ui): Mobile header overflow, translations, and reasoning toggle
- `611cbff` docs: Update CHANGELOG with simple mode polish, MCP, and LM Studio removal
- `035ef56` fix(blocks-input): Delegate streaming to SimpleChatInput
- `782830d` fix(blocks-input): Fix stale closure in streaming callback
- `0f6a301` fix(blocks-input): Fix persona prompt and search API calls
- `e091ab0` fix(switch): Use inline styles for reliable compact sizing
- `d846fa8` fix(switch): Simplify Switch component to fix React state issues
- `1c3aee2` fix(ui): Fix toggle switch animation, polish simple mode UI
- `bcf7ef5` feat(simple-mode): Add blocks-style chat input for welcome screen
- `c615fc0` docs(mcp): Update guide for serverless deployment, add UI note
- `2a5aad0` feat(mcp): Enhanced MCP settings with mobile UI, import/export, more templates
- `6f137dd` refactor: Remove LM Studio local model support (serverless-incompatible)
- `a6df69a` feat: Polish simple mode and add MCP integration to advanced mode
- `dbf9bbc` fix: Add Server icon back to imports (used in LM Studio settings)
- `e4940fa` feat: Add mobile design system and ChatInput refactoring foundation
- `ce0d700` fix: Remove broken MCP feature and fix settings sync race condition

### Commits (2025-11-29)
- `6db81f1` feat: Remove background agents feature and update documentation
- `62abc1e` fix: Force switch dimensions with inline styles
- `a1535f2` fix: Make toggle switches even smaller and more pill-shaped
- `b567492` feat: Redesign toggles as smaller, cleaner pill sliders
- `d3d4c01` Merge pull request #129 from robbyczgw-cla/claude/fix-mobile-ui-bugs
- `3135096` fix: Smaller, properly centered switch toggle
- `4497f87` Merge pull request #128 from robbyczgw-cla/claude/fix-mobile-ui-bugs
- `515692f` fix: Improve mobile UI consistency - switches, tabs, and nav bar
- `a4f5b8a` Merge pull request #127 from robbyczgw-cla/claude/optimize-pwa-performance
- `8958d50` fix: Adjust Switch toggle size and header button sizes
- `c962e92` Merge pull request #126 from robbyczgw-cla/claude/optimize-pwa-performance
- `52616c1` fix: Fix toggle button sizing and switch thumb clipping
- `96385f2` fix: Make mobile toggle buttons compact and consistent with nav bar
- `a2cf7ad` Merge pull request #125 from robbyczgw-cla/claude/optimize-pwa-performance
- `1f0c1c2` fix: Update tool calling support for November 2025 models
- `9c9d97d` feat: Add automatic web search with OpenRouter tool calling
- `d5d40e8` Merge pull request #124 from robbyczgw-cla/claude/optimize-pwa-performance
- `1722911` fix: Fix sidebar chat bubble overflow with fixed pixel widths
- `f167954` Merge pull request #123 from robbyczgw-cla/claude/optimize-pwa-performance
- `a84bd55` fix: Fix chat bubble overflow and text clipping issues
- `8c833d8` Merge pull request #122 from robbyczgw-cla/claude/optimize-pwa-performance
- `d9d921c` fix: Make chat action buttons always visible (removed hover-only logic)
- `e787400` Merge pull request #121 from robbyczgw-cla/claude/optimize-pwa-performance
- `ada72a5` fix: UI fixes for mobile bottom nav, sidebar buttons, and chat actions
- `731ad50` fix: Simplify to network-first navigation with cache fallback only
- `2067886` fix: Skip root navigation in SW to avoid redirect issues
- `4fa201e` fix: Properly handle redirected responses in service worker
- `1053fbe` fix: Fix 'page not available' after login by handling redirects properly
- `31a054a` feat: Modernize mobile layout with glassmorphism and 2024/2025 UI trends
- `fb55018` Merge pull request #120 from robbyczgw-cla/claude/optimize-pwa-performance
- `a7956f0` feat: Optimize PWA with aggressive precaching and fix Android resume issue

### Commits (2025-11-28)
- `8e6bac1` Merge pull request #119 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `63ef489` fix: Sidebar inline buttons and memory JSON parsing
- `b6d7d6a` Merge pull request #118 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `bac397d` feat: Implement database sync for memories
- `d7c056e` feat: Add database sync toggle for memories with privacy controls
- `63461aa` fix: Rebuild sidebar chat items from scratch
- `7a9430e` Merge pull request #117 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `7175954` fix: Sidebar inline buttons and memory JSON parsing
- `0629db4` Merge pull request #116 from robbyczgw-cla/fix/sidebar-chat-preview
- `4f3aa0e` fix: sidebar chat preview text cutoff
- `42bc30e` Merge pull request #115 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `b8a2fae` fix: Sidebar button positioning and delete dialog width
- `747a6a2` Merge pull request #114 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `4169381` fix: Set consistent sidebar width of 300px (was getting narrower on md screens)
- `a114f50` Merge pull request #113 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `4aa4265` fix: Add proper right padding to sidebar chat items for hover buttons
- `4f5c01c` fix: Comprehensive UI fixes for sidebar and dialogs
- `b22027a` fix: Use sm:max-w-4xl to properly override dialog base width
- `df426ab` fix: Use valid Tailwind classes and add z-index to dialogs
- `7a2cfbc` Merge pull request #112 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `1362b15` fix: Improve UI layout for sidebar, Document Collections and Background Agents dialogs
- `5dd9205` Merge pull request #111 from robbyczgw-cla/claude/fix-mobile-bubble-cutoff
- `a57c39d` feat: Add Background Agents button to Advanced Mode UI
- `c917b9a` feat: Add Background Agents System for autonomous tasks
- `7e8c237` feat: Add Chameleon Agent persona for advanced mode
- `d0a2616` Merge pull request #110 from robbyczgw-cla/claude/fix-mobile-bubble-cutoff
- `7a81d97` fix: Add comprehensive debug logging and import/export to memory system
- `aa2125a` feat: Add toast notifications for memory saves and adjust sidebar padding
- `70d335a` Merge pull request #109 from robbyczgw-cla/claude/fix-mobile-bubble-cutoff
- `3ed1dd9` fix: Sync memory service settings with app context
- `8c7ffd8` fix: Increase right padding on mobile chat items to prevent text cutoff
- `1e81d04` Merge pull request #108 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `301565a` feat: Add memory export/import functionality
- `a0dad6f` feat: Add automatic LLM-based memory extraction
- `35f033a` feat: Add LM Studio local model support (desktop only)

### Commits (2025-11-27)
- `c4c8df5` fix: Mobile message cutoff - remove overflow-hidden and increase max-width
- `2760f4a` Merge pull request #107 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `34d5908` feat: Add Verbalized Sampling (VS) slash commands /1 /2 /3 /4
- `6ec3a3f` feat: Update default persona prompts to probability templates
- `d7b56b4` Merge pull request #106 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `f2bb479` fix: Make sidebar chat bubbles more compact on mobile
- `5bdd397` Merge pull request #105 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `ef0dcc3` fix: Sidebar chat bubbles and persona prompts mobile grid
- `d4c08d4` Merge pull request #104 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `4bb7257` perf: Disable ALL remaining infinite CSS animations and GPU-forcing hints
- `8184388` Merge pull request #103 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `815e0f3` perf: Optimize chat message rendering to reduce GPU usage
- `4af6f05` perf: Disable infinite SVG animations and optimize MutationObserver
- `acfbe2f` Merge pull request #102 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `97fefd2` perf: Major GPU optimization - disable expensive visual effects
- `3ac83d4` Merge pull request #101 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `8410914` fix: Optimize Mermaid diagram rendering to prevent 99% GPU usage
- `8cef5e6` fix: Simplify sidebar styling to prevent chat bubble cutoff
- `2e17254` Merge pull request #100 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `df79447` fix: Ensure dialogs have solid backgrounds and fix sidebar bubble cutoff
- `b69f004` Merge pull request #99 from robbyczgw-cla/claude/revert-react-changes
- `15d10f6` fix: Force dialogs to be 100% opaque - remove all transparency
- `34fa57f` fix: Reduce sidebar chat bubble padding to prevent cutoff
- `c1367bf` Merge pull request #98 from robbyczgw-cla/claude/revert-react-changes
- `b557fb9` fix: Fix dialog overlay darkness and sidebar chat bubble sizing
- `73fd259` Merge pull request #97 from robbyczgw-cla/claude/revert-react-changes
- `03a9c2f` feat: Add Ultra Performance Mode toggle in experimental settings
- `e63bb6e` fix: Fix dialog overlay darkness and sidebar chat bubble sizing
- `d84d60d` Merge pull request #96 from robbyczgw-cla/claude/revert-react-changes
- `4566b39` perf: Optimize simple-chat-input - reduce useEffect hooks from 9 to 4
- `8943781` fix: Improve sidebar-to-main transition visual quality
- `76151ea` Merge pull request #95 from robbyczgw-cla/claude/revert-react-changes
- `cdc923d` perf: Additional GPU optimization - disable non-essential infinite animations
- `e56d17b` fix: Fix sidebar-to-main transition and chat title truncation
- `f92627e` Merge pull request #94 from robbyczgw-cla/claude/revert-react-changes
- `0c5750b` perf: Optimize GPU usage - reduce from 70% to ~20-30%
- `29ecb55` fix: Fix user bubble text color and settings dialog loading issues
- `d9d937f` Merge pull request #93 from robbyczgw-cla/claude/revert-react-changes
- `7a5351c` fix: Suppress Mermaid error bombs and clean up error divs
- `2a60267` feat: Add stunning visual animations and effects
- `cc0dc6f` Merge pull request #92 from robbyczgw-cla/claude/revert-react-changes
- `50975ce` chore: Update pnpm-lock.yaml for new dependencies
- `e6356cb` feat: Add rich content support and fix layout/font issues
- `efdf01f` Merge pull request #91 from robbyczgw-cla/claude/revert-react-changes
- `ef86c04` chore: Remove React Native mobile app and shared package
- `2d8edd8` Merge pull request #90 from robbyczgw-cla/claude/brainstorm-features
- `9f2605f` docs: Add React Native Android development guide in German
- `ae33156` chore: Add .gitignore to shared package
- `d56b7ab` chore: Update pnpm-lock.yaml for monorepo workspaces
- `b9401fe` feat: Add React Native mobile app foundation with monorepo structure
- `5380827` feat: Add font family choices with Roboto and accessibility fonts
- `081a34b` docs: Add comprehensive features roadmap
- `ad03341` docs: Highlight intelligent categorized follow-up system as headline feature
- `ff01547` Merge pull request #89 from robbyczgw-cla/claude/enhance-tamagotchi-features

---

## [0.7.0-alpha] - 2025-11-26

### Message Editing & Content Management
- **Message Editing** - Edit your sent messages with inline editor
  - Click edit icon on any user message
  - AI automatically re-generates response after edit
  - Save/Cancel buttons for confirmation
- **Draft Auto-Save** - Never lose your work
  - Auto-saves to localStorage every 500ms
  - Per-chat drafts with 24-hour expiry
  - Automatic restoration when returning to chat
  - Files: `hooks/use-draft.ts`

### Search & Discovery
- **Full-Text Search** - Search all chat content, not just titles
  - Inverted index for O(1) lookups (1-5ms vs 50-200ms)
  - Real-time results as you type
  - Relevance scoring (titles rank higher)
  - Minimum 3 characters to trigger
  - Files: `lib/search-service.ts`, `components/chat-sidebar.tsx`

### AI-Powered Features
- **Smart Chat Titles** - AI generates concise titles from first message
  - Uses `openai/gpt-oss-20b` (privacy-focused open-source model)
  - 2-6 word titles, no quotes or trailing punctuation
  - Background generation (non-blocking)
  - Fallback to truncated message on failure
  - Files: `lib/title-generator.ts`
- **Title Animation** - Subtle slide-in effect when title appears
  - GPU-friendly CSS animation (no JS loops)
  - Primary color highlight that fades
  - Respects `prefers-reduced-motion`
  - 1.2s duration with smooth easing

### PWA Stability
- **Image Compression** - Auto-compress uploads to prevent crashes
  - Max 1920x1080, 80% quality
  - WebP format with JPEG fallback
  - ~90% size reduction for large images
  - Skip compression for small images (<100KB) and SVGs
  - Files: `lib/file-handler.ts`
- **Memory Optimization** - Strip historical images from API requests
  - Prevents memory accumulation in long conversations
  - Placeholder text: "[Previous image was shared here]"
  - Critical for PWA stability
  - Files: `lib/multimodal-utils.ts`
- **Touch Device Fix** - Action buttons visible on iPad/tablets
  - Uses `@media(hover:hover)` instead of screen width
  - Works on all touch-enabled devices

### Bug Fixes
- Fixed `[object Object]` bug for image conversation titles
- Fixed context compression model (now uses `grok-4.1-fast`)
- Removed missing UI component dependencies

### Commits (2025-11-26)
- `fcf1695` feat: Add persona starter prompts to Advanced Mode empty state
- `bcd20fe` Merge pull request #88 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `30d8ef6` docs: Rewrite CHANGELOG.md with proper versioning (0.1-0.7 alpha)
- `7851be0` docs: Add comprehensive documentation for v2.5 features
- `ff85944` fix: Prevent PWA crashes by stripping historical image data from API requests
- `265af1c` Merge pull request #87 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `4ac763d` feat: Add lightweight animation for AI-generated chat titles
- `c0782b8` fix: Switch title generator to openai/gpt-4.1-nano
- `70e0cf9` feat: AI-powered chat title generation
- `2a192cb` fix: Compress images to prevent PWA crashes
- `119eff2` fix: Show proper chat title for image conversations
- `4b7f546` Merge pull request #86 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `edf6362` fix: Show message action buttons on touch devices (iPad)
- `b4f65b7` Merge pull request #85 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `a9d1f90` feat: Add message editing, full-text search, and draft auto-save
- `27d6e98` Merge pull request #84 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `9ea060c` fix: Use grok-4.1-fast instead of gpt-4o-mini for context compression
- `6447918` fix: Remove missing UI component dependencies from context-window-meter
- `60f81a8` feat: Add Context Window Meter, Auto-Compression, and fix pricing
- `f1aa4e0` feat: Add optional pet modes and LLM integration, persona prompts in advanced mode
- `0215d38` feat: Transform pet companion into full Tamagotchi experience
- `87dad36` Merge pull request #83 from robbyczgw-cla/claude/fix-simpl-feature
- `bdd2eec` feat: Add Performance Mode toggle for GPU optimization
- `6576c4e` fix: Add persona-specific questions and fix question click handler
- `ae8b71c` Merge pull request #82 from robbyczgw-cla/claude/fix-simpl-feature
- `a7aac78` fix: Simplify pet companion dialog to match working settings pattern
- `e80d4b1` Merge pull request #81 from robbyczgw-cla/claude/fix-simpl-feature
- `038ffe7` fix: Improve Simple Mode layout with proper flex constraints and wider dialogs
- `4fc1e34` Merge pull request #80 from robbyczgw-cla/claude/fix-simpl-feature
- `57d6f5d` fix: Remove duplicate reduced-motion CSS that was overriding main's version
- `2fbe008` Merge pull request #79 from robbyczgw-cla/claude/fix-simpl-feature
- `2b68fc7` Merge main: resolve dialog width conflicts
- `252ee81` fix: Dialog layouts and reduced-motion GPU fallback
- `8b10485` Merge pull request #76 from robbyczgw-cla/codex/fix-layout-issues-in-simple-chat-app
- `987cdfa` Fix simple mode layout and dialog sizing
- `461a446` Merge pull request #75 from robbyczgw-cla/claude/fix-simpl-feature
- `f651cd9` Revert "fix: Remove GPU-intensive CSS effects for performance"
- `d6cba4e` Merge pull request #74 from robbyczgw-cla/claude/fix-simpl-feature
- `32768b4` fix: Remove GPU-intensive CSS effects for performance
- `181ce3e` Merge pull request #73 from robbyczgw-cla/claude/fix-simpl-feature
- `19c7603` fix: Simple Mode sidebar - add shrink-0 and proper height handling
- `118a40a` Merge pull request #72 from robbyczgw-cla/claude/fix-simpl-feature
- `f68c6bd` fix: Reset inset values on desktop for proper flex layout
- `f52b189` fix: Move sidebar width to wrapper div for proper flex layout
- `d6a9e57` Revert: Restore CSS blur effects for visual design
- `c6bbbe4` Merge pull request #71 from robbyczgw-cla/claude/fix-simpl-feature
- `b26b7b8` fix: Remove all CSS blur filters for GPU performance
- `f70fa0b` fix: Match Simple Mode sidebar layout to Advanced Mode pattern
- `8a905b4` Merge pull request #70 from robbyczgw-cla/claude/fix-simpl-feature
- `e300135` fix: Simplify dialog styling to use default Radix dialog width
- `c1eadce` Merge pull request #69 from robbyczgw-cla/claude/fix-simpl-feature
- `77acac3` fix: Remove GPU-intensive effects and fix Simple Mode layout
- `ebad710` Merge pull request #68 from robbyczgw-cla/claude/fix-desktop-simple-mode-ui
- `ec89937` fix: Fix dialog width collapse by using inner wrapper for flex layout
- `b86908f` Merge pull request #67 from robbyczgw-cla/claude/fix-desktop-simple-mode-ui
- `2b904bb` fix: Fix desktop Simple Mode layout and significantly reduce GPU usage
- `d12e0e5` Merge pull request #66 from robbyczgw-cla/claude/fix-desktop-simple-mode-ui
- `b58cd5f` fix: Fix desktop Simple Mode layout and reduce CPU usage
- `584a2ee` Merge pull request #65 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `5b7e8f8` feat: Replace quick start with persona-based tips in Simple Mode
- `230d20c` fix: Remove streaks, improve desktop layout, add achievements to settings
- `d9a528b` Merge pull request #64 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `bc8fb5f` fix: Major UI fixes for Simple Mode on desktop and mobile
- `17f8ca6` Merge pull request #63 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `945dd82` fix: Skip Simple Mode onboarding for existing users switching modes
- `5be87a6` Merge pull request #62 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `0348423` fix: Hide mode selection dialog when existing user is detected later
- `24e89fe` Merge pull request #61 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `dee96a9` fix: Improve user detection and fix dialog rendering
- `7271ac6` Merge pull request #60 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `ef64f1b` fix: Fix mode selection for existing users and rendering issues
- `d1e04c2` Merge pull request #59 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `4f72eef` fix: Use sr-only class instead of @radix-ui/react-visually-hidden
- `6927bcc` fix: Fix mode selection dialog not rendering properly on desktop
- `8ee0ea4` Merge pull request #58 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `e3cb654` feat: Add database schema for Simple Mode gamification
- `c49a0be` feat: Add Simple Mode gamification features
- `8f6556b` feat: Expand Simple Mode onboarding with rich profile options
- `a4642e0` feat: Add mode selection dialog for first-time users
- `8afda45` feat: Add Simple Mode onboarding wizard and icons to Advanced settings
- `c26009b` Merge pull request #57 from robbyczgw-cla/claude/pwa-features-performance
- `913a942` feat: Enhance Simple Mode with translations, chat deletion, and image creation
- `6bb1b2e` Merge pull request #56 from robbyczgw-cla/claude/pwa-features-performance
- `928419a` fix: Add Grok 4.1 and update vision model detection

---

## [0.6.0-alpha] - 2025-11-24

### Context Window Management
- **Context Window Meter** - Visual indicator of token usage
  - Shows current/max tokens for selected model
  - Color-coded warnings (green/yellow/red)
  - Compact mode for input area
  - Files: `components/context-window-meter.tsx`
- **Auto-Compression** - Automatic context summarization
  - Triggers at 80% context usage
  - Uses fast model for compression
  - Preserves conversation flow

### Pet Companion System
- **Tamagotchi Experience** - Interactive pet companion
  - Multiple pet types (Cat, Dog, Dragon, Robot, etc.)
  - Mood system based on chat activity
  - Stats: Happiness, Energy, Friendship
  - LLM integration for pet responses
  - Files: `components/pet-companion.tsx`, `lib/pet-system.ts`
- **Pet Modes** - Optional integration levels
  - Observer mode (watches silently)
  - Reactive mode (occasional comments)
  - Active mode (participates in chat)

### Performance
- **Performance Mode Toggle** - GPU optimization settings
  - Reduces animations for lower-end devices
  - Disables blur effects when enabled

---

## [0.5.0-alpha] - 2025-11-20

### Simple Mode
- **Simple Mode** - Cleaner, persona-focused experience
  - Simplified UI for casual users
  - Persona-based tips instead of feature overload
  - Streamlined settings dialog
  - Files: `components/simple-chat-app.tsx`, `components/simple-chat-input.tsx`
- **Mode Selection** - First-time user dialog
  - Choose between Simple and Advanced mode
  - Skip for existing users
  - Persistent preference

### Gamification (Simple Mode)
- **Achievements System** - Unlock badges for milestones
  - First chat, streak days, message counts
  - Visual achievement cards
- **Streaks** - Track daily chat activity
- **Quick Start Personas** - Curated persona suggestions

### Voice Features
- **OpenAI TTS** - High-quality text-to-speech
  - 6 premium voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
  - Speed and voice selection
  - Files: `lib/openai-tts.ts`
- **Browser TTS Fallback** - Free alternative
  - 30+ system voices
  - Voice testing in settings
- **Whisper Integration** - Voice input transcription
  - OpenAI Whisper API
  - Microphone permission handling
  - Files: `lib/voice.ts`

### PWA Enhancements
- **Native-Feel PWA** - Touch optimizations
  - Haptic feedback on interactions
  - GPU acceleration
  - Smooth animations
  - Files: `lib/haptics.ts`
- **Microphone Permissions** - Better handling
  - Permission tester in settings
  - CSP headers for audio

### Internationalization
- **Image Generation** - DALL-E integration in Simple Mode
- **Chat Deletion** - Per-chat delete in Simple Mode
- **Web Search Settings** - Configure in Simple Mode

### Commits (2025-11-25)
- `a90f63a` feat: Add web search settings to Simple Mode
- `026d158` feat: Add Simple Mode for cleaner, persona-focused experience
- `3abbcd6` fix: Add timeout handling to TTS to prevent 504 gateway errors
- `9287100` Merge pull request #55 from robbyczgw-cla/claude/pwa-features-performance
- `066396c` docs: Update documentation with new features and optimizations
- `f4fa20a` fix: Add media-src blob: to CSP for TTS audio playback
- `04bc2e8` fix: Add api.openai.com to CSP connect-src for TTS
- `f09f9c3` fix: Improve OpenAI TTS error handling and response validation
- `1a99801` feat: Add OpenAI TTS for high-quality voice output
- `3351f5d` feat: Improve voice selection with more voices and test button
- `f51f230` perf: Optimize React performance and improve mobile UX
- `ff6a996` Merge pull request #54 from robbyczgw-cla/claude/pwa-features-performance
- `60fca58` fix: Properly convert audio blob to File with correct MIME type for Whisper API
- `2c11f9c` fix: Show more detailed error messages for Whisper transcription failures
- `4f1569c` fix: Correct audio format handling for Whisper transcription
- `4132bbc` Merge pull request #53 from robbyczgw-cla/claude/pwa-features-performance
- `e66427d` fix: Allow microphone and camera in Permissions-Policy header
- `7eb19a6` Merge pull request #52 from robbyczgw-cla/claude/pwa-features-performance
- `1e2c4f1` fix: Always trigger getUserMedia to show permission prompt
- `fb86461` feat: Add microphone permission tester in Voice settings
- `16e3f8e` Merge pull request #51 from robbyczgw-cla/claude/pwa-features-performance
- `f629d26` feat: Add native-feel PWA performance optimizations
- `271464d` Merge pull request #50 from robbyczgw-cla/claude/integrate-exa-search
- `21f02cc` fix: Improve search image rendering in chat
- `0bec497` feat: Add split contexts and fix Exa images toggle
- `37b06d2` refactor: Add unified search service and organize lib folder structure
- `a9a4991` Merge pull request #49 from robbyczgw-cla/claude/integrate-exa-search
- `1aa767f` feat: Add direct Exa Search integration with full configuration
- `4ec8527` Merge pull request #48 from robbyczgw-cla/claude/fix-default-model-bug
- `a159873` fix: Prevent newly added models from becoming default for new chats

### Commits (2025-11-24)
- `841c9f6` Merge pull request #46 from robbyczgw-cla/claude/merge-architecture-files
- `da122b4` docs: Merge duplicate architecture files into single ARCHITECTURE.md

---

## [0.4.0-alpha] - 2025-11-21

### UI Refresh
- **Paper-Mint Theme** - New default theme
  - Soft, readable color palette
  - Improved contrast ratios
- **Neo Blueprint Theme** - Alternative dark theme
  - Technical aesthetic
  - High contrast
- **Modern Shell** - Updated chrome
  - Blended sidebar
  - Tighter spacing
  - Bridge elements

### Persona Expansion
- **5 New Personas**
  - Pixel (retro game dev)
  - Chef Marco (Italian cuisine)
  - Zen (meditation guide)
  - Startup Sam (entrepreneur)
  - Aria (songwriter)
- **Translations** - All personas in DE/EN/ES

### Model Updates
- **Grok 4.1 Support** - New default model
  - `grok-4.1-fast` as default
  - Vision model detection
  - Reasoning toggle support
- **Reasoning Display** - Collapsible thinking sections
  - Shows model's reasoning process
  - Toggle in chat input

### Bug Fixes
- Fixed reasoning format for OpenRouter
- Fixed cost tracker pricing (per 1M tokens)
- Reduced verbose console logging

### Commits (2025-11-23)
- `dded9fc` Merge pull request #45 from robbyczgw-cla/claude/fix-mobile-bottom-bar
- `569faa0` fix: Standardize mobile bottom bar colors and remove unused themes
- `f1c20d9` Merge pull request #44 from robbyczgw-cla/feature/cosmic-glass-theme
- `04f90c7` feat: Refine Cosmic Glass contrast and add Modern Light theme
- `5b44aef` fix: Resolve login screen layout issues on desktop
- `187fdeb` feat: Implement Cosmic Glass theme and UI polish
- `2b91aed` Merge pull request #43 from robbyczgw-cla/claude/fix-mobile-chat-ui
- `565fabc` fix: make modern-shell background adapt to dark mode
- `a9f65c5` fix: make mobile bottom nav respect theme colors
- `64d41a7` fix: slim down chat input and fix user bubble width
- `06a6296` fix: user bubbles now shrink to fit text, reduce bottom padding
- `48957ac` fix: reduce bottom bar gap and make user bubbles fit text
- `f081853` fix: improve mobile chat UI spacing and bottom bar sizing
- `ef0152b` Merge pull request #42 from robbyczgw-cla/claude/modernize-chat-ui
- `6aa823d` chore: simplify input placeholder
- `d80b352` Merge pull request #41 from robbyczgw-cla/claude/modernize-chat-ui
- `faed7ea` fix: mobile header toggles now show active state
- `dab6dbd` Merge pull request #40 from robbyczgw-cla/claude/modernize-chat-ui
- `be363fb` feat: move voice/image/reasoning toggles to mobile header
- `ca10395` Merge pull request #39 from robbyczgw-cla/claude/modernize-chat-ui
- `eeacb09` fix: sidebar chat history scrolling on mobile
- `856d512` fix: cleaner mobile input - toggles in toolbar, user bubble sizing
- `88577c3` Merge pull request #38 from robbyczgw-cla/claude/modernize-chat-ui
- `61a2967` feat: compact mobile UI with all toggles visible
- `dbd96e4` fix: hide raw FOLLOWUP JSON from chat while preserving follow-up bubbles

### Commits (2025-11-22)
- `0f9539b` Merge pull request #37 from robbyczgw-cla/claude/modernize-chat-ui
- `0a96159` feat: cleaner mobile input and bottom nav improvements
- `603c94b` Merge pull request #36 from robbyczgw-cla/claude/modernize-chat-ui
- `d6a5ebb` feat: UI cleanup and mobile input improvements
- `df88e63` Merge pull request #35 from robbyczgw-cla/claude/modernize-chat-ui
- `67c9a22` feat: improved bottom nav layout + Clean Slate theme
- `ba33e05` feat: comprehensive UI polish and design system improvements
- `386743e` feat: floating glass dock nav + Midnight Hologram theme
- `18edf30` feat: major UI/UX improvements for modern chat experience
- `678543e` Merge pull request #34 from robbyczgw-cla/claude/modernize-chat-ui
- `4d11b1c` feat: replace ugly theme with Aurora - northern lights theme
- `7db80fa` feat: add enhanced styling for Modern Minimal theme
- `047cc3b` feat: add Modern Minimal theme with clean dark UI
- `ba12bfd` Merge pull request #33 from robbyczgw-cla/claude/modern-loading-mobile-ui
- `14dedaf` feat: modern AI loading animation and mobile UI improvements
- `25f879e` Merge pull request #32 from robbyczgw-cla/codex/refactor-bottom-bar-and-settings-menu
- `0201786` Adjust mobile navigation actions

### Commits (2025-11-21)
- `1f4f2bc` Merge branch 'feat/modern-ui-refresh'
- `4e8eca1` feat: replace blueprint with paper-mint theme
- `0780d9a` style: improve blueprint readability
- `8554001` feat: add neo blueprint theme
- `bfd093e` Merge pull request #31 from robbyczgw-cla/feat/modern-ui-refresh
- `6e08cb3` style: remove sidebar spacing
- `ac9e13a` Merge pull request #30 from robbyczgw-cla/feat/modern-ui-refresh
- `434ca60` style: tighten gap and improve sidebar contrast
- `bd743fb` style: add stronger sidebar bridge
- `66dbe80` style: blend sidebar into main shell
- `2176e00` style: modernize shell visuals

### Commits (2025-11-20)
- `a95d4da` Merge pull request #29 from robbyczgw-cla/claude/fix-pwa-api-keys
- `04df93a` fix: Add translations for all persona descriptions (DE/EN/ES)
- `96bb52c` Merge pull request #28 from robbyczgw-cla/claude/fix-pwa-api-keys
- `4919ad3` feat: Add 5 new creative personas (Pixel, Chef Marco, Zen, Startup Sam, Aria)
- `5802366` Merge pull request #27 from robbyczgw-cla/claude/fix-pwa-api-keys
- `cce4110` chore: Reduce verbose logging in updateSettings to clean up console
- `ae981c2` chore: Remove debug logging from stream handler
- `be9f7b7` debug: Add logging to trace reasoning field in stream response
- `a1a8fe9` Merge pull request #26 from robbyczgw-cla/claude/fix-pwa-api-keys
- `f2a5301` fix: Handle reasoning_details array format from OpenRouter
- `5cef9b8` fix: Use medium effort for reasoning instead of high
- `a2da348` fix: Use correct OpenRouter reasoning format { effort: 'high' }
- `d05d045` fix: Check multiple field names for reasoning content in stream
- `f54b6fd` Merge pull request #25 from robbyczgw-cla/claude/fix-pwa-api-keys
- `3757a29` feat: Add collapsible reasoning display to chat messages
- `623c4d6` Merge pull request #24 from robbyczgw-cla/claude/fix-pwa-api-keys
- `806ac81` fix: Add reasoning toggle to main chat-input + remove 2M Context from name
- `0fb267f` Merge pull request #23 from robbyczgw-cla/claude/fix-pwa-api-keys
- `c8a0e3b` fix: Update cost-tracker pricing to per 1M tokens (OpenRouter standard)
- `0b23177` fix: Update all default model references to grok-4.1-fast
- `88f0cb5` fix: Update DEFAULT_MODEL to grok-4.1-fast in model-preferences
- `62885a9` Merge pull request #22 from robbyczgw-cla/claude/fix-pwa-api-keys
- `daafe70` fix: Add fallback default model and debug logging for reasoning toggle
- `79617f2` Merge pull request #21 from robbyczgw-cla/claude/fix-pwa-api-keys
- `6f82f8d` feat: Add Grok 4.1 Fast as default + reasoning toggle

### Commits (2025-11-19)
- `61be8e9` Merge pull request #20 from robbyczgw-cla/claude/fix-pwa-api-keys
- `622deb0` feat: Add mobile-friendly UI for Model Comparison mode
- `248bef5` Merge pull request #19 from robbyczgw-cla/claude/fix-pwa-api-keys
- `616a717` feat: Convert AI Memory Hub to i18n translation system
- `74af5dc` Merge pull request #18 from robbyczgw-cla/claude/fix-pwa-api-keys

---

## [0.3.0-alpha] - 2025-11-10

### Memory System
- **AI Memory** - Long-term context persistence
  - Store preferences, facts, skills, goals
  - Automatic extraction from conversations
  - Importance scoring (1-3)
  - Relevance-based retrieval
  - Files: `lib/memory-service.ts`
- **Memory Hub** - Management interface
  - View, edit, delete memories
  - Category filtering
  - i18n translations

### Discussion Mode
- **AI Discussion** - Multi-model debates (renamed from Debate)
  - Choose 2 models to discuss topics
  - 2-5 round conversations
  - Real-time streaming
  - Vote for winner
  - Mobile-friendly UI

### Model Comparison
- **Side-by-Side** - Compare model responses
  - Same prompt to multiple models
  - Visual comparison
  - Mobile navigation

### Security & Stability
- **API Key Protection** - Critical fixes
  - Prevent keys from being cleared
  - Bulletproof updateSettings
  - PWA mode protection
  - Files: `contexts/app-context.tsx`
- **Search Provider Visibility** - Show which API is used

---

## [0.2.0-alpha] - 2025-11-05

### PWA & Mobile
- **Mobile-First UI** - WhatsApp-style experience
  - Bottom navigation (5 buttons)
  - Settings in mobile nav
  - Compact layout
- **PWA Icons** - Chameleon logo branding
- **Glassmorphism UI** - Premium visual effects
  - Backdrop blur
  - Smooth animations
  - Modern aesthetics

### Security
- **Content Security Policy** - HTTP headers
  - Strict CSP rules
  - Rate limiting preparation
- **Supabase Integration** - NULL value handling
  - Prevent key overwrites
  - Proper merge logic

### Bug Fixes
- Fixed personas and default system prompt
- Fixed FOLLOWUP format parsing
- Translated German UI text to English
- Fixed login page layout
- Fixed footer link accessibility

---

## [0.1.0-alpha] - 2025-11-01

### Initial Release
- **Core Chat** - Basic chat functionality
  - Message streaming
  - OpenRouter integration
  - Multiple model support
- **Personas** - 18+ AI personalities
  - Cami, Nova, Dev, Professor, etc.
  - Unique system prompts
  - Communication styles
- **Cost Tracking** - LLM spending analytics
  - Per-model breakdown
  - Token counting
  - Monthly projections
- **Training Data Export** - JSONL/JSON export
  - Fine-tuning format
  - Conversation selection
- **Web Search** - Tavily & Serper integration
  - Real-time search
  - Citation support
- **File Upload** - Document handling
  - Text, image, PDF support
  - Drag & drop
- **Authentication** - Supabase auth
  - Email/password
  - Profile system
- **Themes** - Dark/Light mode
- **Languages** - DE/EN/ES support

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| **0.10-beta** | 2025-12-07 | 💰 **Exact Cost Tracking** - 3 critical bug fixes, collapsible stats, provider tracking |
| **0.9-beta** | 2025-12-06 | 🎉 **Beta Release** - Shareable chat links, desktop image toggle, personalized greetings |
| 0.11.1-alpha | 2025-12-05 | React 19 compatibility, vaul 1.1.2, database implementation guide |
| 0.11.0-alpha | 2025-12-03 | Search provider optimization, model research, iPad fixes |
| 0.10.0-alpha | 2025-12-02 | **Intelligent Memory System** - 4-phase retrieval, semantic embeddings, pgvector |
| 0.9.0-alpha | 2025-12-01 | Streaming visualization, dialog viewport safety, user profile context, vision models |
| 0.8.0-alpha | 2025-11-30 | AI tool calling search, MCP integration, blocks-style UI, mobile polish |
| 0.7.0-alpha | 2025-11-26 | Message editing, full-text search, AI titles, PWA stability |
| 0.6.0-alpha | 2025-11-24 | Context window meter, pet companion, performance mode |
| 0.5.0-alpha | 2025-11-20 | Simple Mode, TTS, gamification, PWA enhancements |
| 0.4.0-alpha | 2025-11-15 | UI refresh, new personas, Grok 4.1, reasoning display |
| 0.3.0-alpha | 2025-11-10 | Memory system, discussion mode, model comparison |
| 0.2.0-alpha | 2025-11-05 | PWA, mobile UI, security fixes, glassmorphism |
| 0.1.0-alpha | 2025-11-01 | Initial release with core features |

---

## Upcoming (Roadmap)

### 1.0.0 (Stable Release)
- [ ] Conversation branching UI improvements
- [ ] Artifact generation (code, diagrams)
- [ ] Voice conversations (real-time)
- [ ] Plugin/extension system
- [ ] API stabilization
- [ ] Performance benchmarks
- [ ] Full test coverage
- [ ] Production deployment guide

### Post-1.0 Features
- [ ] Team collaboration features
- [ ] Custom persona builder
- [ ] Advanced analytics dashboard
- [ ] Mobile native apps (iOS/Android)

---

## Contributing

See [CONTRIBUTING.md](docs/contributing.md) for how to contribute to this project.

## License

MIT License - see [LICENSE](LICENSE)
