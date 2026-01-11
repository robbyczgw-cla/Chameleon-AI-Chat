# Chameleon AI Chat

An open-source AI chat application with real-time cost tracking, 31 conversational personas, semantic memory, and training data export. Access 100+ AI models through a beautiful, privacy-focused interface.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)

---

![Chameleon AI Chat Screenshot](./docs/screenshot.png)

---

## Try It Now

**[camiai.xyz](https://camiai.xyz)** - Use Chameleon AI Chat instantly without any setup. Bring your own API keys and start chatting with 100+ AI models.

---

## Why Chameleon?

Most AI chat apps are either too simple (ChatGPT wrapper) or too complex (developer-only tools). Chameleon gives you the best of both worlds:

- **Simple Mode** for casual users who just want to chat
- **Advanced Mode** for power users who want full control
- **Real costs** from OpenRouter's Generation API - not estimates
- **Your data, your keys** - runs entirely in your browser or self-hosted

---

## Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **100+ AI Models** | Claude Opus 4.5, GPT-5, Gemini 3, Grok 4, Llama 4, DeepSeek R1, Mistral Large, and more via OpenRouter |
| **Real-time Cost Tracking** | Actual billing data per message from OpenRouter's Generation API - not token estimates |
| **31 AI Personas** | Pre-configured personalities from Cami (adaptive chameleon) to Dev (programmer) to Mythos (worldbuilder) |
| **Two Modes** | Simple Mode for beginners, Advanced Mode for power users with full parameter controls |
| **Training Export** | Export conversations as JSONL for fine-tuning your own models |

### AI Experience

| Feature | Description |
|---------|-------------|
| **Smart Follow-ups** | AI-generated contextual suggestions after each response (quick actions, deep dives, related topics) |
| **Semantic Memory** | AI remembers context across conversations using RAG with pgvector embeddings |
| **Live Streaming** | Watch responses generate in real-time with token-by-token streaming |
| **Streaming History** | Review past streaming sessions with performance metrics and reasoning traces |
| **Model Comparison** | Run the same prompt through 2-4 models side-by-side |
| **Conversation Branching** | Explore alternative responses by branching conversations |

### Privacy & Security

| Feature | Description |
|---------|-------------|
| **Private Chat Mode** | Ephemeral conversations that leave no trace - not saved anywhere |
| **Self-hostable** | Run your own instance with full control over your data |
| **Local API Keys** | Keys stored in browser localStorage, never sent to our servers |
| **Row-Level Security** | Supabase RLS ensures complete data isolation between users |
| **XSS Protection** | Content sanitization prevents cross-site scripting attacks |

### Integrations & Tools

| Feature | Description |
|---------|-------------|
| **Web Search** | Integrated search via Tavily (AI-optimized), Serper (Google), or Exa (Neural) |
| **Voice Input** | Whisper transcription for speech-to-text |
| **Voice Output** | Text-to-speech for AI responses |
| **Image Analysis** | Vision-capable models for understanding images |
| **Weather & More** | Extensible tool system for external APIs |

### Cross-Platform

| Platform | Support |
|----------|---------|
| **Desktop** | Full web app, installable PWA |
| **iOS** | Safari PWA (Add to Home Screen) |
| **Android** | Native APK via Capacitor + PWA |
| **Offline** | Service worker caching for offline access |

---

## Personas

31 unique AI personalities across 8 categories:

| Category | Personas |
|----------|----------|
| **Core** | Cami (adaptive), Dev (coding), Flash (quick), Scholar (research) |
| **Creative** | Luna (storytelling), Nova (roleplay), Mythos (mythology/worldbuilding) |
| **Professional** | Dr. Med (health), Sol Goldman (legal), Finny (finance), Coach (business) |
| **Lifestyle** | Chef Marco (cooking), Fit (fitness), Zen (mindfulness), Gaia (sustainability) |
| **Learning** | Scholar (education), Lingua (languages), Herr Müller (German), Science (STEM) |
| **Technical** | Dev (coding), Security (cybersec), Data (analytics), Cloud (DevOps) |
| **Fun** | Buddy (casual), Trivia (games), Sage (philosophy), Mystic (astrology) |
| **Special** | Enterprise Advisor (business), Kids Mode (child-safe) |

Each persona has custom system prompts, communication styles, and specialized knowledge. Cami (the default) features **emotion detection** - recognizing frustration, excitement, confusion, and more to adapt responses.

---

## Themes

12+ beautiful themes to personalize your experience:

- **Light/Dark** - Clean defaults with system preference detection
- **Aether** - Soft blue tones with ethereal gradients
- **Midnight** - Deep dark theme with purple accents
- **Forest** - Nature-inspired greens
- **Ocean** - Calming blue depths
- **Sunset** - Warm orange and pink gradients
- **Lavender** - Soft purple elegance
- **Amber Pro** - Premium warm elegance with sophisticated orange accents
- **Cyberpunk** - Neon-futuristic vibes
- **Nord** - Arctic-inspired color palette
- **Dracula** - Popular dark theme with vivid accents
- **High Contrast** - Accessibility-focused

---

## Quick Start

### Prerequisites

- Node.js 18+
- [OpenRouter API key](https://openrouter.ai) (required for AI models)
- [Supabase account](https://supabase.com) (required for auth and data sync)

### Installation

```bash
# Clone the repository
git clone https://github.com/robbyczgw-cla/Chameleon-AI-Chat.git
cd Chameleon-AI-Chat

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - (Optional) OPENROUTER_API_KEY for server-side fallback

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### First-Time Setup

1. Create an account or continue as guest
2. Go to **Settings → API Keys**
3. Enter your OpenRouter API key
4. (Optional) Add Tavily/Serper for web search
5. Start chatting!

---

## Guest Mode vs Account

You can use Chameleon AI Chat without creating an account. Here's what each mode offers:

### Guest Mode (No Account Required)

| Feature | Status |
|---------|--------|
| AI Chat with 100+ models | ✅ Full access |
| All 31 personas | ✅ Full access |
| Real-time cost tracking | ✅ Works |
| Voice input/output | ✅ Works |
| Web search | ✅ Works |
| Image generation | ✅ Works |
| All 12+ themes | ✅ Works |
| Settings & preferences | ✅ Stored locally |
| API keys storage | ✅ Browser localStorage |

**Limitations in Guest Mode:**
- Data stored in browser only (cleared if you clear browser data)
- No cross-device sync
- No AI memory system (requires database)
- No chat sharing

### Authenticated Mode (Free Account)

Everything in Guest Mode, plus:

| Feature | Benefit |
|---------|---------|
| Cloud sync | Access chats from any device |
| AI Memory | Long-term context across conversations |
| Chat sharing | Share conversations via public links |
| Backup | Data persists even if browser data is cleared |

**Note:** Both modes require you to bring your own API keys (OpenRouter, etc.). We never store or proxy your API keys through our servers.

---

## API Keys & Services

| Service | Purpose | Required | Cost |
|---------|---------|----------|------|
| **OpenRouter** | AI model access (100+ models) | ✅ Yes | Pay-per-use (~$0.0001-$0.06/1K tokens) |
| **Supabase** | Database, auth, vector search | ✅ For sync | Free tier available |
| **Tavily** | AI-optimized web search | ❌ Optional | Free tier (1,000 searches/month) |
| **Serper** | Google Search API | ❌ Optional | Free tier (2,500 searches/month) |
| **Exa** | Neural semantic search | ❌ Optional | Free tier available |
| **OpenAI** | Whisper voice, DALL-E images | ❌ Optional | Pay-per-use |
| **WeatherAPI** | Weather tool integration | ❌ Optional | Free tier available |

---

## Documentation

### User Guides

| Guide | Description |
|-------|-------------|
| [User Guide](./docs/user-guide.md) | Complete walkthrough for new users |
| [Power User Guide](./docs/POWER_USER_GUIDE.md) | Advanced features and shortcuts |
| [Personas](./docs/personas.md) | All 31 personas explained |
| [Memory System](./docs/MEMORY_SYSTEM.md) | How semantic memory works |
| [FAQ](./docs/FAQ.md) | Frequently asked questions |

### Developer Guides

| Guide | Description |
|-------|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | Technical deep dive |
| [Database](./docs/database.md) | Schema and RLS policies |
| [API Reference](./docs/api.md) | API endpoints |
| [Deployment](./docs/deployment.md) | Self-hosting guide |
| [Android Build](./docs/CAPACITOR_ANDROID.md) | Building the native app |

### Feature Docs

| Guide | Description |
|-------|-------------|
| [Streaming Visualization](./docs/STREAMING-VISUALIZATION.md) | Real-time streaming UI |
| [Follow-up Suggestions](./docs/FOLLOW_UP_SUGGESTIONS.md) | Smart conversation continuers |
| [Private Chat Mode](./docs/PRIVATE_CHAT_MODE.md) | Ephemeral conversations |
| [Search Providers](./docs/SEARCH-PROVIDERS-GUIDE.md) | Web search integration |

See [docs/README.md](./docs/README.md) for the complete documentation index.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| **UI Components** | shadcn/ui, Radix UI primitives, Lucide icons |
| **Database** | Supabase (PostgreSQL + pgvector for embeddings) |
| **AI Provider** | OpenRouter API (100+ models unified API) |
| **Auth** | Supabase Auth with Row-Level Security |
| **Mobile** | Capacitor 8 (Android), PWA (iOS/Desktop) |
| **Markdown** | react-markdown, remark-gfm, rehype-highlight |
| **Diagrams** | Mermaid.js for flowcharts and diagrams |

---

## Privacy & Security

| Aspect | Implementation |
|--------|----------------|
| **API Keys** | Stored in browser localStorage, never on our servers |
| **Conversations** | Local by default, optional cloud sync with Supabase |
| **Private Mode** | Zero persistence - deleted when you close the chat |
| **Data Isolation** | Supabase Row-Level Security (RLS) on all tables |
| **XSS Protection** | HTML sanitization on all user content |
| **HTTPS** | HSTS headers enforce secure connections |

See [SECURITY.md](./SECURITY.md) for the complete security policy and deployment checklist.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Links

- [Report a Bug](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues/new?template=bug_report.md)
- [Request a Feature](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues/new?template=feature_request.md)
- [Discussions](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/discussions)
- [Security Vulnerabilities](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/security/advisories/new)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + ,` | Quick model switch |
| `Cmd/Ctrl + N` | New chat |
| `Cmd/Ctrl + /` | Toggle sidebar |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |

---

## License

MIT License - see [LICENSE](./LICENSE)

---

## Acknowledgments

- [OpenRouter](https://openrouter.ai) - Unified API for 100+ AI models
- [Supabase](https://supabase.com) - Database, auth, and vector search
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Radix UI](https://radix-ui.com) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com) - Utility-first styling
- [Capacitor](https://capacitorjs.com) - Native mobile runtime
- [Vercel](https://vercel.com) - Hosting and deployment
- [Lucide](https://lucide.dev) - Icon library
- [Mermaid](https://mermaid.js.org) - Diagram rendering

---

**Built with 🦎 by the Chameleon community**
