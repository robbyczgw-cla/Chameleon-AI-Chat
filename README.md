# 🦎 Chameleon AI Chat

> **The AI chat platform that adapts to you** — 18+ personas, 100+ models, real-time cost tracking

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-DB-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Vitest-green?style=flat-square)](https://vitest.dev/)

Chameleon AI Chat is an open-source AI chat platform built for power users who want control over their AI experience. Unlike generic chat interfaces, Chameleon offers specialized AI personas, detailed cost analytics, conversation export for fine-tuning, and a mobile-first design.

---

## Screenshots

<details>
<summary>Click to view screenshots</summary>

| Chat Interface | Personas | Cost Tracker |
|:---:|:---:|:---:|
| Mobile-first chat UI | 18+ AI personalities | Real-time spending analytics |

</details>

---

## Why Chameleon?

| Feature | ChatGPT | Claude.ai | **Chameleon** |
|---------|:-------:|:---------:|:-------------:|
| Multiple AI Personas | - | - | 18+ |
| 100+ Models (GPT, Claude, Grok, Gemini) | - | - | Via OpenRouter |
| Real-time Cost Tracking | - | - | Per message |
| Export for Fine-tuning (JSONL) | - | - | Built-in |
| AI Debate Mode | - | - | 2-5 rounds |
| Long-term Memory | Limited | Limited | Persistent |
| Self-hosted Option | - | - | Full control |
| Open Source | - | - | MIT License |

---

## Key Features

### For Power Users
- **Cost Tracker** — Track LLM spending per message, project monthly costs, analyze by model
- **Training Data Export** — Export conversations in JSONL/HTML/Markdown for fine-tuning
- **AI Debate Mode** — Watch two AI models debate any topic (2-5 rounds, vote for winner)
- **Advanced Memory** — Token-efficient long-term memory that persists across sessions
- **Prompt Engineering Helper** — AI-powered prompt improvement with templates (Ctrl+Shift+P)

### For Everyone
- **18+ AI Personas** — Nova (cyberpunk hacker), Sol Goldman (lawyer), Mythos (worldbuilder), and more
- **100+ AI Models** — GPT-4, Claude, Gemini, Grok, DeepSeek via OpenRouter
- **Dual Web Search** — Tavily and Serper (Google Search) integration
- **Mobile-First UI** — WhatsApp-style navigation, optimized for one-handed use
- **Lightning Search** — Inverted index search (1-5ms vs 50-200ms brute-force)

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account ([free tier available](https://supabase.com))
- OpenRouter API key ([get one here](https://openrouter.ai))

### Installation

```bash
# Clone the repository
git clone https://github.com/robbyczgw-cla/Chameleon-AI-Chat.git
cd Chameleon-AI-Chat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key

# Optional - Web Search
NEXT_PUBLIC_TAVILY_API_KEY=your_tavily_key
NEXT_PUBLIC_SERPER_API_KEY=your_serper_key
```

```bash
# Start development server
npm run dev

# Run tests
npm test
```

Open [http://localhost:3000](http://localhost:3000) to start chatting.

---

## AI Personas

Chameleon includes 18+ unique AI personalities, each with their own expertise and communication style:

| Persona | Specialty |
|---------|-----------|
| **Cami** 🦎 | Friendly all-rounder that adapts to your needs |
| **Nova** ✨ | Cyberpunk hacker from Neo-Tokyo 2089 |
| **Dev** 💻 | Programming partner for coding tasks |
| **Professor Stein** 🎓 | Academic expert for deep dives |
| **Mythos** 🗺️ | Worldbuilder for D&D-style universes |
| **Cogito** 🤔 | Philosopher exploring consciousness |
| **Vibe** 🎧 | Curator for music, games, and shows |
| **Sol Goldman** ⚖️ | Charismatic lawyer for legal thinking |
| **Sara Norton** 🔍 | Detective for analytical problem-solving |

[View all personas →](./docs/personas.md)

---

## Architecture

```
chameleon-ai-chat/
├── app/                    # Next.js App Router pages
├── components/             # 84 React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── chat-input.tsx      # Message input with attachments
│   ├── message-bubble.tsx  # Message rendering
│   └── markdown-renderer.tsx
├── lib/                    # 46 utility modules
│   ├── personas/           # AI persona definitions
│   ├── cost-tracker.ts     # Usage & cost analytics
│   ├── memory-service.ts   # Long-term memory
│   └── search-service.ts   # Inverted index search
├── hooks/                  # Custom React hooks
├── contexts/               # React Context providers
├── __tests__/              # Vitest test suites
└── docs/                   # Documentation
```

[Full architecture docs →](./docs/ARCHITECTURE.md)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4.1, shadcn/ui |
| Database | Supabase PostgreSQL (RLS) |
| AI Models | OpenRouter (100+ models) |
| Search | Tavily, Serper |
| Testing | Vitest, React Testing Library |
| Deployment | Vercel |

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | Technical deep dive into the codebase |
| [Power User Guide](./docs/POWER_USER_GUIDE.md) | Tips, tricks, and keyboard shortcuts |
| [Personas](./docs/personas.md) | All 18+ personas explained |
| [Future Features](./docs/FUTURE_FEATURES.md) | Roadmap and implementation guides |
| [Database Schema](./docs/database.md) | Supabase tables & RLS policies |
| [Deployment](./docs/deployment.md) | How to deploy to production |
| [Contributing](./docs/contributing.md) | Development guide |

---

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint      # Run ESLint
```

---

## Contributing

Contributions are welcome! Check out:
- [Contributing Guide](./docs/contributing.md) — Development setup and guidelines
- [Future Features](./docs/FUTURE_FEATURES.md) — Features looking for implementation
- [GitHub Issues](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues) — Bug reports and feature requests

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Acknowledgments

- [OpenRouter](https://openrouter.ai) — AI model access
- [Supabase](https://supabase.com) — Backend & auth
- [shadcn/ui](https://ui.shadcn.com) — UI components
- [Vercel](https://vercel.com) — Hosting

---

<p align="center">
  <strong>Built for power users who want control over their AI experience</strong>
</p>
