# Chameleon AI Chat

An open-source AI chat application with real-time cost tracking, 31 conversational personas, and training data export.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

<!--
TODO: Add a screenshot here before public release
![Screenshot](docs/screenshot.png)
-->

## Features

- **Real-time cost tracking** - See actual billing data per message from OpenRouter, not estimates
- **31 AI personas** - From Cami (adaptive chameleon) to Dev (programmer) to Mythos (worldbuilder)
- **100+ AI models** - Access GPT-4, Claude, Gemini, Llama, and more via OpenRouter
- **Training data export** - Export conversations as JSONL for fine-tuning your own models
- **Semantic memory** - AI remembers context across conversations using RAG
- **Private chat mode** - Ephemeral conversations that leave no trace
- **Web search** - Integrated search via Tavily, Serper, or Exa
- **Voice input/output** - Whisper transcription and text-to-speech
- **Android app** - Native Android experience via Capacitor

## Quick Start

```bash
git clone https://github.com/robbyczgw-cla/Chameleon-AI-Chat.git
cd Chameleon-AI-Chat
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Requirements

- Node.js 18+
- [OpenRouter API key](https://openrouter.ai) (required)
- [Supabase account](https://supabase.com) (required for auth/sync)

### Optional

- Tavily/Serper/Exa API key for web search
- OpenAI API key for Whisper voice transcription

## Documentation

| Guide | Description |
|-------|-------------|
| [User Guide](./docs/user-guide.md) | Complete walkthrough |
| [Personas](./docs/personas.md) | All 31 personas explained |
| [Memory System](./docs/MEMORY_SYSTEM.md) | How semantic memory works |
| [Architecture](./docs/ARCHITECTURE.md) | Technical deep dive |
| [Deployment](./docs/deployment.md) | Self-hosting guide |
| [Android Build](./docs/CAPACITOR_ANDROID.md) | Building the Android app |

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **UI**: shadcn/ui components
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenRouter API
- **Mobile**: Capacitor (Android)

## Privacy

- **Private Chat Mode**: Conversations not saved anywhere
- **Self-hostable**: Run your own instance
- **Your API keys**: Keys stored locally, never on our servers
- **Row-level security**: Supabase RLS ensures data isolation

See [SECURITY.md](./SECURITY.md) for details.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

Quick links:
- [Report a bug](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues/new?template=bug_report.md)
- [Request a feature](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues/new?template=feature_request.md)
- [Discussions](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/discussions)

## License

MIT License - see [LICENSE](./LICENSE)

## Acknowledgments

- [OpenRouter](https://openrouter.ai) - AI model access
- [Supabase](https://supabase.com) - Database and auth
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Vercel](https://vercel.com) - Hosting
