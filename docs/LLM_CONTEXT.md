# Chameleon AI Chat - LLM Context Document

**Purpose:** Comprehensive summary for feeding into other AI memory systems.
**Version:** 0.10-beta | **Updated:** December 2025

---

## App Identity

**Name:** Chameleon AI Chat
**Type:** Next.js 16 Progressive Web App (PWA)
**Purpose:** Multi-model AI chat interface with personas, memory, and advanced features
**Stack:** React 19, TypeScript 5, Tailwind CSS 4, Supabase, OpenRouter

---

## Core Features Summary

### 1. Multi-Model Support
- **100+ AI models** via OpenRouter (GPT-4, Claude, Grok, Gemini, Llama, Mistral, etc.)
- Real-time streaming responses (Server-Sent Events)
- Automatic tool calling for web search
- Model comparison mode (2-4 models side-by-side)
- AI debate mode (2 models discuss topics)

### 2. Chat Modes

**Simple Mode:**
- Streamlined, mobile-optimized interface
- Single default model (Grok 4.1 Fast)
- AI-driven web search via tool calling
- Quick persona selector
- Theme/language quick toggles
- Image compression for PWA stability
- Multimodal support (images, files)

**Advanced Mode:**
- Full-featured power user interface
- 100+ model selection
- Complete settings panel (temperature, max tokens, penalties)
- 7 collapsible message statistics sections
- MCP server configuration
- Conversation branching
- Training data export
- Cost tracking dashboard

### 3. Persona System (18+ Personas)

Each persona has unique:
- System prompt (personality, expertise, style)
- Emoji and visual theme
- Communication patterns

**Featured Personas:**
- **Cami** 🦎 - Adaptive chameleon (default)
- **Dev** 💻 - Programming expert
- **Nova** ✨ - Cyberpunk hacker from Neo-Tokyo 2089
- **Cogito** 🤔 - Existential philosopher
- **Professor Einstein** 🎓 - Deep explanations
- **Flash** ⚡ - Quick, concise answers
- **Vibe** 🎧 - Music/entertainment curator
- **Mythos** 🗺️ - World-building storyteller

### 4. Follow-Up Suggestions System

AI generates contextual next-step questions using `[FOLLOWUP]` tags:

**Three Categories:**
- ⚡ **Quick** (Emerald/Green) - Fast, surface-level questions
- 🧠 **Deep Dive** (Violet/Purple) - In-depth technical exploration
- 🔗 **Related** (Cyan/Blue) - Connected topics, comparisons

**Format:**
```json
[FOLLOWUP]{
  "quick": ["What's useState?", "Show example"],
  "deep": ["How do hooks work internally?"],
  "related": ["Compare to Vue Composition API"]
}[/FOLLOWUP]
```

**Display:**
- Color-coded containers with gradient backgrounds
- Pill-style category labels with icons
- Responsive: 9 on desktop, 6 on mobile (2 per category)
- Staggered animations, hover effects

### 5. Intelligent Memory System

4-phase retrieval pipeline:

1. **Query Classification** - AI determines if personal context needed
2. **Semantic Search** - Vector embeddings (1536-dim) find relevant memories
3. **Combined Intelligence** - Confidence thresholds, persona bypass
4. **Context Injection** - Relevant memories added to system prompt

**Memory Types:**
- Preference, Fact, Context, Skill, Goal

**Storage:** localStorage (offline-first) + Supabase with pgvector

### 6. Web Search Integration

**Three Strategies:**
- **AI Tool Calling** - Model automatically decides when to search
- **Manual Toggle** - User forces search before response
- **Heuristics Fallback** - Pattern matching for unsupported models

**Providers:**
- **Serper** (recommended) - Real Google results, $5/1K queries
- **Tavily** (budget) - AI-native, $1/1K queries
- **Exa** (research) - Semantic search, manual only

### 7. Voice System

- **Input:** OpenAI Whisper transcription
- **Output:** OpenAI TTS (6 voices) or Browser SpeechSynthesis (free)

### 8. Cost Tracking

**Exact Costs (v0.10+):**
- Real billing data from OpenRouter's generation API
- Native token counts, provider transparency
- Cache discount tracking, reasoning token tracking

**Stats Dashboard (5 tabs):**
- Overview, Models, Tokens, Costs, **Tools**

**Tool Analytics Dashboard:**
- Total tool calls, usage rate
- Search queries, provider distribution
- Recent search query history

### 9. Additional Features

- **RAG System** - Upload PDFs/docs, get context-aware answers
- **Conversation Branching** - Explore alternate paths
- **Training Data Export** - JSONL format for fine-tuning
- **Chat Link Sharing** - Base64-encoded URL sharing
- **Image Generation** - DALL-E integration (normal/high quality)
- **PWA Optimizations** - Image compression, offline-first

---

## Technical Architecture

### Project Structure
```
app/                    # Next.js App Router
├── api/chat/route.ts   # LLM streaming endpoint
├── api/search/         # Web search APIs
├── api/whisper/        # Voice transcription
├── page.tsx            # Main chat page

components/             # React components
├── chat-input.tsx      # Advanced mode input
├── simple-chat-input.tsx # Simple mode input
├── follow-up-suggestions.tsx # Category-colored suggestions
├── stats-dashboard.tsx # 5-tab analytics dashboard
├── memory-manager.tsx  # Memory system UI

lib/                    # Core libraries
├── follow-up-parser.ts # [FOLLOWUP] tag parsing
├── memory-service.ts   # 4-phase memory retrieval
├── personas.ts         # 18+ persona definitions
├── openrouter.ts       # LLM integration
├── tools.ts            # Tool calling definitions

contexts/app-context.tsx # Global state management
```

### Key Data Flows

**Message Sending:**
```
User Input → ChatInput → AppContext → /api/chat → OpenRouter → Stream tokens → Parse follow-ups → Save to Supabase
```

**Memory Retrieval:**
```
User Query → Classify need → Embed query → Semantic search → Filter by relevance → Inject into context
```

**Follow-Up Rendering:**
```
AI response with [FOLLOWUP] → parseFollowUps() → Group by category → FollowUpSuggestions component → User click → Send as message
```

### Database Schema (Supabase)

- **profiles** - User profiles with preferences
- **chats** - Conversation metadata
- **messages** - Message content, stats, streamingHistory
- **settings** - API keys (encrypted), model preferences
- **memories** - Long-term memory with embeddings

---

## UI/UX Patterns

### Color Themes
- Multiple themes: Default, Dark, Cyberpunk, etc.
- Follow-up categories: Emerald (quick), Violet (deep), Cyan (related)
- Gradient accents throughout

### Mobile Optimizations
- Bottom-fixed chat input
- Swipe gestures: left edge → sidebar, right edge → new chat
- Haptic feedback
- Reduced follow-ups (6 vs 9)
- Image compression (500KB max)

### Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Reduced motion support

---

## API Integration

### OpenRouter
- Primary LLM provider
- Streaming via SSE
- Tool calling for web search
- Generation API for exact costs

### Search Providers
- Serper: `google.serper.dev/search`
- Tavily: `api.tavily.com/search`
- Exa: `api.exa.ai/search`

### Voice
- Whisper: `api.openai.com/v1/audio/transcriptions`
- TTS: `api.openai.com/v1/audio/speech`

---

## Key Configuration

### Settings Categories
- **Model:** ID, temperature, max tokens, top_p, penalties
- **UI:** Simple mode, theme, language, stats display
- **Memory:** Enabled, semantic search, thresholds
- **Search:** Provider, API keys, max results
- **Experimental:** Various feature flags

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- User-provided API keys stored encrypted in Supabase

---

## Version History Highlights

- **v0.10-beta:** Color-coded follow-ups, tool analytics, mobile follow-up limits
- **v0.9-beta:** Exact cost tracking, enhanced message stats
- **v0.8:** AI-driven web search via tool calling
- **v0.7:** Intelligent memory system with semantic search

---

## Summary for LLM Context

Chameleon AI Chat is a sophisticated multi-model AI interface featuring:
- 100+ models via OpenRouter with streaming
- 18+ distinct AI personas with unique personalities
- Intelligent memory system with semantic search
- AI-driven web search via tool calling
- Color-coded follow-up suggestions (Quick/Deep/Related)
- Two modes: Simple (mobile-optimized) and Advanced (power users)
- Exact cost tracking with 5-tab analytics dashboard
- PWA with offline support, voice I/O, image generation
- Built with Next.js 16, React 19, TypeScript, Tailwind, Supabase
