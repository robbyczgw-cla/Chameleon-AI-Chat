# 🦎 Chameleon AI Chat - Adapt to Any Conversation

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-DB-green?style=flat-square&logo=supabase)](https://supabase.com/)

Like a chameleon adapting to its environment, this AI chat platform transforms to match your needs with 18+ unique personas, cost tracking, and 100+ AI models via OpenRouter.

---

## 🎯 What Makes This Special

**For Power Users:**
- 🎯 **Intelligent Follow-Ups** - Categorized 3-tier suggestions (⚡ Quick / 🧠 Deep / 🔗 Related) - guide conversations naturally
- 💸 **Cost Tracker** - Track LLM spending, project monthly costs, analyze by model
- 💾 **Training Data Export** - Export conversations in JSONL/HTML/Markdown for fine-tuning
- 📊 **Unified Analytics** - Visual stats with charts, model distribution, and AI insights
- 🎭 **AI Debate Mode** - Watch two AI models debate any topic (2-5 rounds, vote for winner!)
- 🧠 **Advanced Memory** - Token-efficient long-term memory for context across sessions

**For Everyone:**
- 🎭 **18+ AI Personas** - From Nova (cyberpunk hacker) to Sol Goldman (lawyer) to Vibe (curator)
- 🤖 **100+ AI Models** - GPT-4, Claude, Gemini, Grok, DeepSeek via OpenRouter
- 🔍 **Dual Web Search** - Tavily and Serper (Google Search)
- 📱 **Mobile-First UI** - WhatsApp-style bottom nav, optimized for narrow screens (20:9)
- 🌍 **Multi-language** - German, English, Spanish
- 🎨 **Dark/Light Themes** - Beautiful gradients with seamless switching

**New Features:**
- ✨ **Prompt Engineering Helper** - AI-powered prompt improvement with 10 tips & 6 templates (Ctrl+Shift+P)
- 📁 **File Previews** - Lightbox viewer with zoom, syntax highlighting, drag & drop
- ⚡ **Lightning Search** - Inverted index = 10-40x faster (1-5ms vs 50-200ms)
- 💡 **Smart Suggestions** - Context-aware prompts (9 categories, 50+ keywords)
- 🎯 **Quick Actions** - Document collections, ambient music, export menu

**Voice Features (NEW):**
- 🎙️ **OpenAI Whisper** - High-quality voice input transcription
- 🔊 **OpenAI TTS** - 6 premium voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- 🗣️ **Browser TTS** - Free fallback with 30+ system voices
- ▶️ **Voice Output for All Messages** - Read any message aloud (user or AI)

**PWA & Performance (NEW):**
- 📱 **Native-Feel PWA** - Touch optimizations, GPU acceleration, haptic feedback
- ⚡ **React Performance** - Memo, useCallback, lazy loading for faster renders
- 🖼️ **Image Optimization** - Next.js automatic WebP conversion and resizing
- 👆 **Mobile-First Buttons** - Action buttons always visible on touch devices

**Latest Features (v0.7.0-alpha):**
- ✏️ **Message Editing** - Edit your sent messages, AI re-responds automatically
- 🔍 **Full-Text Search** - Lightning-fast search across all chat content (inverted index)
- 💾 **Draft Auto-Save** - Never lose your message drafts (localStorage, 24hr expiry)
- 🤖 **AI Chat Titles** - Auto-generated titles using `openai/gpt-oss-20b` (privacy-focused)
- ✨ **Title Animation** - Subtle slide-in animation when AI generates titles
- 🛡️ **PWA Stability** - Image compression + memory optimization prevents crashes
- 📱 **Touch Device Fix** - Action buttons always visible on iPad/touch screens

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenRouter API key

### Installation

```bash
# Clone repo
git clone https://github.com/robbyczgw-cla/Chameleon-AI-Chat.git
cd Chameleon-AI-Chat

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key

# Optional - Web Search
NEXT_PUBLIC_TAVILY_API_KEY=your_tavily_key
NEXT_PUBLIC_SERPER_API_KEY=your_serper_key  # 10x cheaper!
```

---

## ✨ Key Features

### 📱 Mobile-First Experience

**WhatsApp-Style Bottom Nav:**
- 5-button layout: Chats, Search, New Chat, Personas, Settings
- Prominent "New Chat" button (larger, primary color)
- Optimized for one-handed use
- Safe area support for notched phones

**Narrow Screen Optimized (20:9):**
- Clean text wrapping without aggressive breaking
- Responsive message bubbles (55%/65% mobile → 85%/90% desktop)
- Compact padding and spacing on mobile
- No horizontal scroll, ever

### 🎯 Intelligent Categorized Follow-Ups

**The most sophisticated conversation guidance system in any AI chat app:**

**3-Tier Smart Suggestions:**
- ⚡ **Quick** - Fast, surface-level follow-ups (clarifications, yes/no, simple next steps)
- 🧠 **Deep** - In-depth exploration (detailed analysis, technical dives, complex questions)
- 🔗 **Related** - Connected topics (tangential ideas, alternative perspectives, broader context)

**How It Works:**
1. AI analyzes your conversation and generates contextually relevant follow-ups
2. Suggestions appear as clickable chips below AI responses
3. Click any suggestion → instantly continue the conversation in that direction
4. Up to 9 suggestions (3 per category) for maximum flexibility

**Visual Design:**
- Categorized rows with icons and labels (⚡ Schnell / 🧠 Tiefer / 🔗 Verwandt)
- Animated slide-in with staggered timing for polish
- Hover effects with subtle arrow indicators
- Mobile-optimized for easy tap targets

**Technical Implementation:**
```json
[FOLLOWUP]{
  "quick": ["What's the TL;DR?", "Can you simplify this?"],
  "deep": ["Explain the technical details", "What are edge cases?"],
  "related": ["How does this compare to X?", "What about Y approach?"]
}[/FOLLOWUP]
```

**Why It's Better Than Standard "Smart Reply":**
- **Semantic categorization** - Not just random suggestions
- **Context-aware** - Persona-specific and topic-relevant
- **Multi-dimensional** - Explore conversations in different depths
- **Backwards compatible** - Falls back to simple format if needed
- **Parser-based** - Clean separation of suggestions from content

This feature alone transforms how you interact with AI - guiding you to ask better questions and explore topics more thoroughly.

---

### 🎭 AI Personas

18+ unique personalities including:

- **Cami** 🦎 - Friendly chameleon that adapts to your needs
- **Nova** ✨ - Cyberpunk hacker from Neo-Tokyo 2089
- **Dev** 💻 - Programming partner
- **Professor Stein** 🎓 - In-depth expert
- **Mythos** 🗺️ - Collaborative worldbuilder (create D&D-style universes!)
- **Cogito** 🤔 - Consciousness explorer (philosophical AI)
- **Nihilo** 🌌 - Optimistic nihilist with good vibes
- **Vibe** 🎧 - Personal taste curator (music, games, shows)
- **Sol Goldman** ⚖️ - Charismatic lawyer
- **Lisa Knight** 💪 - Enthusiastic supporter
- **Coach Thompson** 🏈 - Inspiring mentor
- **Sara Norton** 🔍 - Analytical detective
- ...and more!

[Full persona list in docs](./docs/personas.md)

### 🎭 AI Debate Mode

Watch two AI models debate any topic:
- Choose 2 models (GPT-4 vs Claude, Grok vs Gemini, etc.)
- Set rounds (2-5)
- Real-time streaming responses
- Vote for the winner!

Perfect for:
- Testing different models
- Exploring different perspectives
- Entertainment & education
- Viral content creation

### 💸 Cost Tracker

- Track spending across all models
- Monthly projections based on usage
- Cost breakdown by model
- Token usage analytics
- Export history as JSON

### 💾 Export & File Management

**Export Formats:**
- **JSONL** - Fine-tuning GPT-3.5/GPT-4, Claude
- **HTML** - Theme-aware exports (preserves dark/light mode)
- **Markdown** - Portable, readable format
- **JSON** - Full conversation data with metadata

**File Previews:**
- Lightbox modal with zoom (50-200%)
- Syntax highlighting for code files (react-syntax-highlighter)
- PDF viewer (native browser rendering)
- Drag & drop upload
- Inline thumbnails with click-to-expand

### ⚡ Lightning-Fast Search

**Inverted Index Performance:**
- 1-5ms search time (vs 50-200ms linear)
- 10-40x faster than brute-force
- Prefix matching for fuzzy results
- Relevance scoring (title +50, content +5)
- 300ms debouncing for smooth UX

### 💡 Smart Suggestions

**Context-Aware Prompts:**
- 9 persona categories (Programming, Philosophy, Creative, Analysis, etc.)
- 50+ keyword triggers
- Hidden on mobile to save space
- Instant persona matching

### 🧠 Advanced Memory System

**Token-Efficient Long-Term Memory:**
- Store user preferences, facts, context, skills, goals
- Automatic extraction from conversations
- Importance scoring (1-3)
- Relevance-based retrieval
- Recency bonus for fresh context
- Only loads relevant memories per query

### ✏️ Message Editing & Draft Auto-Save

**Edit Your Messages:**
- Click the edit icon on any of your sent messages
- Modify your text in an inline editor
- Save → AI automatically re-generates its response
- Cancel to discard changes
- Full history preserved

**Never Lose Your Drafts:**
- Drafts auto-save to localStorage every 500ms
- 24-hour expiry (prevents stale drafts)
- Restored automatically when you return to a chat
- Per-chat drafts (each chat has its own draft)
- Clear on successful send

### 🔍 Full-Text Search

**Lightning-Fast Chat Search:**
- Search across ALL chat content (not just titles!)
- Inverted index for 10-40x faster search (1-5ms)
- Minimum 3 characters to trigger search
- Combines title and message content results
- Relevance scoring (title matches rank higher)
- Real-time results as you type

### 🤖 AI-Powered Chat Titles

**Smart Title Generation:**
- First message → AI generates concise title (2-6 words)
- Uses `openai/gpt-oss-20b` (privacy-focused open-source model)
- Runs in background (doesn't block UI)
- Fallback to truncated message if API fails
- Requires OpenRouter API key

**Title Animation:**
- Subtle slide-in animation when title appears
- GPU-friendly CSS animation (no JavaScript loops)
- Respects `prefers-reduced-motion` for accessibility
- 1.2s duration with smooth easing

### 🛡️ PWA Stability Improvements

**Image Handling:**
- Auto-compress images on upload (max 1920x1080, 80% quality)
- WebP format with JPEG fallback
- 90%+ size reduction for large images
- Historical images stripped from API requests (prevents memory leaks)
- Critical for stable PWA experience

**Touch Device Support:**
- Action buttons (edit, copy, audio) visible on touch screens
- Uses `@media(hover:hover)` detection instead of screen width
- Works on iPad, tablets, touch laptops
- No more hidden buttons on non-mouse devices

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4.1 + shadcn/ui components
- **Database**: Supabase PostgreSQL (Row-Level Security)
- **AI**: OpenRouter (100+ models)
- **Voice Input**: OpenAI Whisper API
- **Voice Output**: OpenAI TTS + Browser SpeechSynthesis
- **Search**: Tavily + Serper (Google Search)
- **State**: React Context API
- **Deployment**: Vercel (Edge Runtime)

---

## 📚 Documentation

- [Changelog](./CHANGELOG.md) - Version history & release notes
- [User Guide](./docs/user-guide.md) - Complete feature guide
- [Architecture](./docs/architecture.md) - Technical deep dive
- [Personas](./docs/personas.md) - All 18+ personas explained
- [API Reference](./docs/api.md) - API routes documentation
- [Database Schema](./docs/database.md) - Supabase tables & RLS
- [Deployment](./docs/deployment.md) - How to deploy
- [Contributing](./docs/contributing.md) - Development guide

---

## 🎯 Use Cases

**Power Users:**
- Track LLM costs and optimize spending
- Export training data for custom models
- Compare different AI models side-by-side

**Developers:**
- Programming help with Dev persona
- Debug complex issues
- Learn new frameworks

**Creatives:**
- Brainstorm with Luna (creative persona)
- Build fictional worlds with Mythos
- Get content recommendations from Vibe

**Students:**
- Learn with Professor Stein
- Get explanations from Herr Müller (teacher)
- Quick answers with Flash (concise)

**Professionals:**
- Legal thinking (Sol Goldman)
- Analytical problem-solving (Sara Norton)
- Medical expertise (Dr. Jon Carson, Dr. Max Gray)

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](./docs/contributing.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- [v0.app](https://v0.app) - Initial scaffolding
- [Vercel](https://vercel.com) - Hosting
- [Supabase](https://supabase.com) - Backend & auth
- [OpenRouter](https://openrouter.ai) - AI model access
- [shadcn/ui](https://ui.shadcn.com) - UI components
- The open source community ❤️

---

**Built with ❤️ and ☕**

*AI Chat for Power Users - Track costs, export training data, debate AIs*
