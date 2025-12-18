# Core Features Improvement Roadmap

> **Last Updated:** December 18, 2025 (VERIFIED via code inspection + git log)
> **Total Improvements Listed:** 130+
> **Actually Implemented:** 65+ (80%)
> **Remaining:** 20+ items
> **Focus Areas:** Personas, Memory, Follow-ups, Tool Use, Streaming Visualization

This document outlines potential improvements for Chameleon AI Chat's 5 core differentiating features.

**✅ NOTE:** Last verified Dec 18, 2025 - 203 commits reviewed since Dec 10.

---

## 🚀 Recently Shipped (Dec 13-18, 2025)

**Dec 17-18:**
- ✅ **Memory Surfacing** - Shows which memories influenced each response (`memory-surfacing-badge.tsx`) - commit 9fec1a3
- ✅ **Profile Memory Protection** - Profile memories exempt from decay - commit 5a5b2d7
- ✅ **Better Duplicate Detection** - Lowered threshold 0.85→0.75, core word overlap - commit 5a5b2d7
- ✅ **Image Validation Fix** - Uses compressed size for iOS PWA - commit b681a5d
- ✅ **Gemini 3 Flash Preview** - Full support with reasoning + tool calling - commits ca527bd, 9b0f95b
- ✅ **Security: localStorage Keys** - Removed for logged-in users, stored in Supabase - commit 6a065a4
- ✅ **Security: Mermaid Strict** - Changed from "loose" to "strict" - commit 6a065a4
- ✅ **Performance: Mermaid Lazy** - ~400KB bundle reduction - commit 11073bc
- ✅ **Performance: KaTeX Lazy** - Dynamic import wrapper - commit 11073bc
- ✅ **API Auth Utility** - `lib/api-auth.ts` ready for route protection - commit 6a065a4

**Dec 13:**
- ✅ **Streaming Crash Fixes** - Throttled updates, debounced SearchService - CHANGELOG v0.10.4
- ✅ **GPU Performance** - Disabled backdrop-blur, animations on desktop - CHANGELOG v0.10.3
- ✅ **SearchSourcesBadge** - Compact search result display - CHANGELOG v0.10.2

---

## 🎯 Implementation Status Summary

### Actually Implemented ✅ (Verified Dec 18)

**Streaming & UI:**
- ✅ **Cancellation Button** - Send button transforms to stop icon during streaming
- ✅ **Tool Result Preview** - SearchResultsCard shows during streaming
- ✅ **Live Token Counter** - Tokens/sec shown in message stats
- ✅ **Streaming Phases** - 4 phases with icons: thinking, searching, tool_use, responding
- ✅ **Elapsed Time Display** - Formatted timer during generation
- ✅ **Memory Surfacing Badge** - Shows which memories influenced response (NEW Dec 17)
- ✅ **Search Sources Badge** - Compact expandable search results (NEW Dec 13)

**Memory System:**
- ✅ **Memory Search** - Keyword AND semantic search with embeddings
- ✅ **Memory Categories UI** - Tabs for preference/fact/context/skill/goal
- ✅ **Memory Filtering** - Filter by type and importance
- ✅ **Memory Conflict Detection** - Deduplication with 75% overlap detection (improved)
- ✅ **Memory Aging/Decay** - Auto-expiration after 7 days (profile exempt)
- ✅ **Memory Archive/Restore** - 14-day deleted memory retention
- ✅ **Query Classification** - LLM classifies factual/personal/ambiguous queries
- ✅ **Memory Surfacing** - Shows which memories influenced each response (NEW Dec 17)

**Personas:**
- ✅ **26 Built-in Personas** - Unique personalities in `lib/personas.ts`
- ✅ **Persona Analytics** - Relationship depth tracking, interaction frequency
- ✅ **Persona Voice Settings** - TTS voice, rate, pitch per persona
- ✅ **Persona Context Awareness** - Time-based greetings, mood detection
- ✅ **Custom Persona Builder** - Create with AI-generated avatars
- ✅ **Avatar Generation** - Vision model avatar generation

**Tool Use:**
- ✅ **5 Tools** - Web search, URL fetch, YouTube transcript, Weather, Shopify
- ✅ **Multi-Provider Search** - Tavily, Serper, Exa support
- ✅ **Tool Caching** - 5-min search cache, 10-min weather cache
- ✅ **Tool History** - streamingHistory tracks all tool executions per message
- ✅ **Gemini 3 Tool Calling** - Full support with reasoning (NEW Dec 17)

**Follow-ups:**
- ✅ **Multi-Language Labels** - German: Schnell/Tiefer/Verwandt
- ✅ **3 Categories** - Quick ⚡, Deep 🧠, Related 🔗
- ✅ **Minimalist + Advanced Modes** - Flat view or categorized

**Security & Performance (NEW Dec 17):**
- ✅ **localStorage Keys Secured** - Removed for logged-in users, Supabase RLS
- ✅ **Mermaid Security** - Changed to "strict" mode
- ✅ **Mermaid Lazy Loading** - ~400KB bundle reduction
- ✅ **KaTeX Lazy Loading** - Dynamic import
- ✅ **Context Splitting** - settings, chats, auth contexts separated
- ✅ **GPU Animations Disabled** - No more 90%+ CPU on desktop
- ✅ **Streaming Throttled** - 100+/sec → 20/sec updates

---

### True Critical Gaps 🔴 (Actually Missing)

| # | Feature | Area | Impact | Effort |
|---|---------|------|--------|--------|
| 1 | **Memory Feedback UI** | Memory | Users can't correct wrong memories | 4 hrs |
| 2 | **Follow-up Click Tracking** | Analytics | No data on what users find useful | 2 hrs |
| 3 | **Memory Pinning UI** | Memory | Can't force-include critical memories | 3 hrs |
| 4 | **Persona Import/Export** | Personas | Can't share custom personas | 3 hrs |
| 5 | **Persona Recommendation** | Personas | No auto-suggest based on query | 4 hrs |
| 6 | **Cross-Persona Learning** | Personas | Universal prefs not shared | 6 hrs |
| 7 | **Performance Warnings** | Streaming | No alert when >30s | 2 hrs |
| 8 | **Tool Success/Failure Icons** | Tools | No visual status indicators | 2 hrs |

---

## 1. Personas System

### Current State ✅ (Mostly Implemented)
- **26 built-in personas** with distinct personalities ✅
- **Custom persona builder** with AI avatar generation ✅
- **Relationship depth tracking** (0-100 scale, 6 stages) ✅
- **Preference learning** across 8 categories ✅
- **Persona memory isolation** - each persona maintains separate history ✅
- **Voice settings** per persona (TTS customization) ✅
- **Context settings** (time-based greetings, mood detection) ✅

### Remaining Improvements

| # | Improvement | Description | Effort | Priority | Status |
|---|------------|-------------|--------|----------|--------|
| 1 | **Persona Variants/Moods** | Same persona with different moods | Medium | Medium | ❌ |
| 2 | **Persona Collaboration** | Combine 2 personas for hybrid expertise | Medium | Low | ❌ |
| 3 | **Cross-Persona Learning** | Share universal preferences (language, timezone) | Medium | **High** | ❌ |
| 4 | **Persona Recommendation Engine** | "This looks like code - switch to Dev?" | Small | **High** | ❌ |
| 5 | **Persona A/B Testing** | Compare 2 personas side-by-side | Large | Low | ❌ |
| 6 | **Persona Templates** | Pre-made templates for faster creation | Small | Medium | ❌ |
| 7 | **Persona Import/Export** | Share as JSON file or link | Small | **High** | ❌ |
| 8 | **Persona Analytics Dashboard** | Usage stats, satisfaction metrics | Medium | Medium | ⚠️ Partial |
| 9 | **Persona Voice Cloning** | ElevenLabs integration | Large | Low | ❌ |
| 10 | **Persona Avatar Generator** | DALL-E/SD avatar generation | Medium | Low | ✅ Exists |
| 11 | **Persona Memory Isolation Toggle** | Share memories between personas | Small | Medium | ❌ |
| 12 | **Persona Scheduling** | Auto-switch by time of day | Small | Low | ❌ |
| 13 | **Persona Expertise Levels** | Beginner/Intermediate/Expert mode | Small | Medium | ❌ |
| 14 | **Persona Conversation Starters** | Custom starter prompts | Small | Medium | ✅ Exists |
| 15 | **Persona Response Length** | Verbose vs concise setting | Small | Low | ❌ |
| 16 | **Persona Context Handoff** | Summarize when switching | Medium | Medium | ❌ |
| 17 | **Persona Favorites** | Pin favorite personas | Small | Medium | ❌ |
| 18 | **Persona Tool Preferences** | Dev prefers code, Researcher prefers search | Small | Medium | ❌ |

---

## 2. Memory System

### Current State ✅ (Highly Implemented)
- **4-phase retrieval** ✅ (query classification → semantic search → intelligent retrieval → settings)
- **LLM-powered extraction** ✅ from conversations
- **5 memory types** ✅ (preference, fact, context, skill, goal)
- **3 importance levels** ✅ with scoring algorithm
- **Semantic search** ✅ with embeddings (OpenAI text-embedding-3-small)
- **Query classification** ✅ (factual/personal/ambiguous) with confidence
- **Deduplication** ✅ (exact match, key-value, 85% substring overlap)
- **Memory expiration** ✅ with 7-day auto-delete, 14-day archive
- **Export/Import** ✅ backup and restore
- **Categories UI** ✅ tabs for filtering by type
- **Search** ✅ keyword + semantic search

### Remaining Improvements

| # | Improvement | Description | Effort | Priority | Status |
|---|------------|-------------|--------|----------|--------|
| 1 | **Memory Feedback UI** | 👍/👎 buttons to correct errors | Small | **Critical** | ❌ |
| 2 | **Memory Confidence Dashboard** | Visual display of confidence % | Medium | Medium | ❌ |
| 3 | **Memory Conflict Detection** | Alert on contradictions | Medium | Medium | ✅ Dedup exists |
| 4 | **Memory Aging/Decay** | Old memories lose importance | Small | Medium | ✅ Exists |
| 5 | **Memory Relationships** | Link related memories | Medium | Medium | ⚠️ Via embeddings |
| 6 | **Memory Timeline View** | Chronological visualization | Medium | Low | ❌ |
| 7 | **Memory Categories UI** | Browse/filter by category | Small | High | ✅ Exists |
| 8 | **Memory Bulk Import** | Import from CSV/JSON | Medium | Medium | ✅ Exists |
| 9 | **Memory Export** | Download as JSON/Markdown | Small | High | ✅ Exists |
| 10 | **Memory Merge Suggestions** | "Merge these 3 similar?" | Medium | Medium | ❌ |
| 11 | **Memory Pinning** | Force-include in context | Small | **High** | ❌ |
| 12 | **Memory Privacy Levels** | Private/shareable/device-only | Small | Medium | ❌ |
| 13 | **Memory Search** | Full-text + semantic search | Small | High | ✅ Exists |
| 14 | **Memory Expiration** | Auto-delete after X days | Small | Medium | ✅ Exists |
| 15 | **Memory Source Tracking** | Link to source conversation | Small | Medium | ❌ |
| 16 | **Memory Verification Prompts** | "Is this still true?" | Medium | Medium | ❌ |
| 17 | **Memory Context Budget** | Show tokens used by memories | Small | Medium | ❌ |
| 18 | **Memory Importance Slider** | Manual 1-10 adjustment | Small | Medium | ❌ |
| 19 | **Memory Graph Visualization** | Visual knowledge graph | Large | Low | ❌ |

---

## 3. Follow-up Suggestions

### Current State ✅ (Core Implemented)
- **3 categories** ✅ (Quick ⚡, Deep 🧠, Related 🔗)
- **Multi-language labels** ✅ (German: Schnell/Tiefer/Verwandt)
- **Dual display modes** ✅ (minimalist flat + advanced categorized)
- **JSON + pipe-separated format** ✅ parsing support
- **Max 9 suggestions** ✅ (3 per category)
- **Persona example prompts** ✅ per-persona starter suggestions

### Remaining Improvements

| # | Improvement | Description | Effort | Priority | Status |
|---|------------|-------------|--------|----------|--------|
| 1 | **Click Tracking Analytics** | Track which follow-ups users click | Small | **Critical** | ❌ |
| 2 | **Persona-Aware Generation** | Dev gets code follow-ups, Prof gets academic | Medium | **High** | ⚠️ Example prompts exist |
| 3 | **User Preference Learning** | Learn deep vs quick preference | Medium | Medium | ❌ |
| 4 | **Multi-Language Labels** | Translate category labels | Small | Medium | ✅ Exists (DE) |
| 5 | **Memory-Based Follow-ups** | Generate from stored goals | Medium | **High** | ❌ |
| 6 | **Confidence Scoring** | Show which AI is most confident about | Small | Medium | ❌ |
| 7 | **Response-Type Detection** | Different for code vs text | Medium | Medium | ❌ |
| 8 | **Follow-up Chaining** | Follow-ups suggest their own follow-ups | Medium | Low | ❌ |
| 9 | **Keyboard Shortcuts** | Press 1/2/3 to select | Small | Medium | ❌ |
| 10 | **Follow-up History** | Breadcrumb of path taken | Small | Low | ❌ |

---

## 4. Tool Use Pipeline

### Current State ✅ (Solid Foundation)
- **5 tools** ✅ (Web Search, URL Fetch, YouTube Transcript, Weather, Shopify)
- **Multi-provider search** ✅ (Tavily, Serper, Exa)
- **Smart caching** ✅ (5-min search, 10-min weather)
- **Tool calling support** ✅ (50+ models via `modelSupportsToolCalling()`)
- **Tool result preview** ✅ during streaming (SearchResultsCard)
- **Tool history** ✅ tracked in streamingHistory per message
- **Error handling** ✅ with graceful fallbacks

### Remaining Improvements

| # | Improvement | Description | Effort | Priority | Status |
|---|------------|-------------|--------|----------|--------|
| 1 | **Tool Result Preview** | Show search results during streaming | Medium | Critical | ✅ Exists |
| 2 | **Tool Chaining** | Auto-combine search + url_fetch | Medium | Medium | ❌ |
| 3 | **Tool Success/Failure Icons** | Visual ✅/❌ indicators | Small | **High** | ❌ |
| 4 | **Tool Analytics Dashboard** | Usage stats, success rates | Medium | Medium | ❌ |
| 5 | **Multi-Provider Fallback** | Auto-fallback if one fails | Medium | Medium | ⚠️ Manual selection |
| 6 | **Tool Cache Hit Indicator** | Show cached vs fresh | Small | Low | ❌ |
| 7 | **Tool Privacy Controls** | Disable specific tools | Small | Medium | ❌ |
| 8 | **Tool History UI** | Show tools used per message | Small | Medium | ⚠️ In streamingHistory |
| 9 | **Calculator Tool** | Wolfram Alpha integration | Small | Medium | ❌ |
| 10 | **Code Execution Tool** | Sandboxed Python/JS | Large | Low | ❌ (Security) |
| 11 | **Wikipedia Tool** | Direct article fetching | Small | Medium | ❌ |
| 12 | **Image Search Tool** | Google Images/Unsplash | Medium | Low | ❌ |
| 13 | **Translation Tool** | DeepL/Google Translate | Small | Low | ❌ |

---

## 5. Streaming Visualization

### Current State ✅ (Well Implemented)
- **Cancellation button** ✅ (Stop icon during streaming, abort controller)
- **Two modes** ✅ (Simple default, Detailed verbose)
- **Multi-language** ✅ (English, German, Spanish)
- **Tool-specific styling** ✅ (different colors/icons per tool)
- **Elapsed time** ✅ with formatted display
- **Phase information** ✅ (thinking, searching, tool_use, responding)
- **Tool result preview** ✅ (SearchResultsCard during streaming)
- **Reasoning display** ✅ for o1/DeepSeek R1
- **Streaming history view** ✅ for completed messages

### Remaining Improvements

| # | Improvement | Description | Effort | Priority | Status |
|---|------------|-------------|--------|----------|--------|
| 1 | **Streaming Quality Metrics** | Tokens/sec, time remaining | Small | Medium | ⚠️ Post-gen only |
| 2 | **Tool Result Preview** | Show search results as they arrive | Medium | Critical | ✅ Exists |
| 3 | **Error Indication** | Visual warning if tool failed | Small | **High** | ❌ |
| 4 | **Actual Sub-Step Tracking** | Wire to real API events | Medium | Medium | ❌ |
| 5 | **Cache Hit Indication** | Show when cached data used | Small | Low | ❌ |
| 6 | **Performance Warnings** | Alert if >30s | Small | **High** | ❌ |
| 7 | **Live Token Counter** | Real-time during streaming | Small | Medium | ⚠️ Post-gen only |
| 8 | **Cancellation Button** | Stop streaming | Small | Critical | ✅ Exists |
| 9 | **Model Info Display** | Show model + capabilities | Small | Medium | ⚠️ In stats |
| 10 | **Retry Failed Phase** | Retry just failed phase | Medium | Medium | ❌ |

---

## 6. Cross-Feature Integrations

| # | Integration | Description | Effort | Priority | Status |
|---|------------|-------------|--------|----------|--------|
| 1 | **Persona + Memory** | Different memory strategies per persona | Medium | High | ⚠️ Isolation exists |
| 2 | **Persona + Follow-ups** | Persona-specific follow-up styles | Small | **High** | ⚠️ Example prompts |
| 3 | **Persona + Tools** | Personas prefer specific tools | Small | Medium | ❌ |
| 4 | **Memory + Follow-ups** | Generate from stored goals | Medium | **High** | ❌ |
| 5 | **Memory + Tools** | Remember location for weather | Small | Medium | ❌ |
| 6 | **Memory + Streaming** | Show memory retrieval in viz | Small | Low | ❌ |
| 7 | **Tools + Streaming** | Rich tool previews | Medium | High | ✅ Exists |
| 8 | **All + Analytics** | Unified usage dashboard | Large | Medium | ❌ |

---

## 7. 🚀 NEW Priority Recommendations (Dec 13, 2025)

Based on the comprehensive audit, here are the **ACTUAL** remaining priorities:

### Tier 1: Quick Wins (2-4 hours each) 🎯

These provide high value with low effort:

| Feature | Area | Time | Why Critical |
|---------|------|------|--------------|
| **Follow-up Click Tracking** | Analytics | 2 hrs | Foundation for all improvement |
| **Tool Success/Failure Icons** | Tools | 2 hrs | User trust in tool reliability |
| **Performance Warnings** | Streaming | 2 hrs | Alert on slow responses |
| **Memory Pinning UI** | Memory | 3 hrs | User control over context |
| **Persona Import/Export** | Personas | 3 hrs | Shareability |

### Tier 2: High Impact (4-8 hours each) 💪

| Feature | Area | Time | Why Critical |
|---------|------|------|--------------|
| **Memory Feedback UI** | Memory | 4 hrs | Self-correcting system |
| **Persona Recommendation** | Personas | 4 hrs | Intelligent persona switching |
| **Memory-Based Follow-ups** | Follow-ups | 6 hrs | Personalized suggestions |
| **Cross-Persona Learning** | Personas | 6 hrs | Shared universal prefs |
| **Streaming Error Indication** | Streaming | 4 hrs | Transparency on failures |

### Tier 3: Strategic (1-2 days) 🏗️

| Feature | Area | Time | Why Important |
|---------|------|------|---------------|
| **Persona-Aware Follow-ups** | Follow-ups | 8 hrs | Consistent persona experience |
| **Tool Analytics Dashboard** | Tools | 8 hrs | Operational insights |
| **Memory Timeline View** | Memory | 8 hrs | Memory discoverability |
| **Live Token Counter** | Streaming | 6 hrs | Real-time cost awareness |

---

## 8. Recommended Sprint Plan

### Sprint 1: Analytics Foundation (Week 1)
**Goal:** Build data collection infrastructure

- [ ] Follow-up Click Tracking (2 hrs)
- [ ] Tool Usage Analytics (4 hrs)
- [ ] Persona Usage Stats (2 hrs)

**Outcome:** Data to inform future improvements

---

### Sprint 2: User Control (Week 2)
**Goal:** Give users more control

- [ ] Memory Feedback UI - 👍/👎 (4 hrs)
- [ ] Memory Pinning UI (3 hrs)
- [ ] Tool Success/Failure Icons (2 hrs)
- [ ] Performance Warnings >30s (2 hrs)

**Outcome:** Users can correct and control the system

---

### Sprint 3: Intelligence (Week 3-4)
**Goal:** Make the app smarter

- [ ] Persona Recommendation Engine (4 hrs)
- [ ] Memory-Based Follow-ups (6 hrs)
- [ ] Cross-Persona Learning (6 hrs)
- [ ] Streaming Error Indication (4 hrs)

**Outcome:** More adaptive, personalized experience

---

### Sprint 4: Shareability (Month 2)
**Goal:** Enable sharing and collaboration

- [ ] Persona Import/Export (3 hrs)
- [ ] Memory Graph Visualization (12 hrs)
- [ ] Tool Analytics Dashboard (8 hrs)

**Outcome:** Community features, operational visibility

---

## 9. What NOT to Build (De-prioritized)

These were considered but are low priority:

| Feature | Reason |
|---------|--------|
| **Code Execution Tool** | Security risk, complex sandbox needed |
| **Persona Voice Cloning** | ElevenLabs costs, niche use case |
| **Persona A/B Testing** | Complex UI, limited demand |
| **Persona Evolution** | Hard to implement well, could confuse users |
| **Memory API** | No external integrations requested yet |
| **Persona Leaderboard** | Needs community infrastructure |

---

## Changelog

| Date | Change |
|------|--------|
| Dec 13, 2025 | **COMPREHENSIVE AUDIT** - Marked 55+ features as already implemented, revised priorities |
| Dec 12, 2025 | Added implementation status, critical next steps |
| Dec 2025 | Initial roadmap created |

---

*This roadmap reflects actual codebase state as of December 13, 2025.*
