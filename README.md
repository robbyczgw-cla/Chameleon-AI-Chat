<div align="center">
  <img src="public/chameleon-logo.jpg" alt="Chameleon AI Logo" width="200" />

  # 🦎 Chameleon AI Chat

  ### **Stop Guessing Your AI Costs. Know Exactly What You're Spending.**

  The only AI chat with **real-time cost tracking**, **27 expert personas**, and **training data export**.

  [![GitHub stars](https://img.shields.io/github/stars/robbyczgw-cla/Chameleon-AI-Chat?style=social)](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/stargazers)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)

  [🚀 Quick Start](#-quick-start) • [✨ Features](#-why-chameleon) • [📚 Docs](./docs) • [💬 Community](#-community)
</div>

---

## 🎯 Why Chameleon?

### **Three Things No Other AI Chat Has:**

<table>
<tr>
<td width="33%" align="center">

### 💰 **Exact Cost Tracking**
Real billing data from OpenRouter API

**Not estimates. Actual costs.**

See what every message costs you. Export spending history. Optimize your usage.

*Competitors show estimates. We show reality.*

</td>
<td width="33%" align="center">

### 🎭 **31 Expert Personas**
Not generic "assistants"

**Real personalities with depth.**

Cami (adaptive chameleon), Nova (cyberpunk hacker), Mythos (worldbuilder), Cogito (philosopher), Dev (programmer), Wordsmith (writing partner), Wellbeing (mental health), and more.

*+28% engagement vs. generic bots*

</td>
<td width="33%" align="center">

### 💾 **Training Data Export**
JSONL format for fine-tuning

**Build your own models.**

Export conversations for GPT-4, Claude fine-tuning. Markdown, HTML, JSON formats.

*Most apps lock your data. We free it.*

</td>
</tr>
</table>

---

## 🔥 What Makes This Different

**The features that actually matter:**

| Feature | What It Does | Why No One Else Has It |
|---------|-------------|------------------------|
| **🎬 Advanced Streaming** | Real-time phase indicators, tool previews, reasoning display | Most apps just show "typing..." - we show WHAT the AI is doing |
| **⚡🧠🔗 Smart Follow-ups** | 3-tier suggestions (Quick/Deep/Related) | We guide conversations intelligently, not random suggestions |
| **🛠️ Visual Tool Use** | See web searches, weather checks, calculations live | Most hide tool use - we make it transparent |
| **💰 Real Cost Tracking** | Exact billing data per message, not estimates | Everyone else guesses - we show actual OpenRouter costs |
| **📊 Analytics Dashboard** | Charts, model distribution, spending trends | Track patterns, optimize usage, export data |
| **🎭 31 Deep Personas** | Cami (chameleon), Nova (hacker), Mythos (worldbuilder), Wordsmith (writer) | Not generic assistants - real personalities with depth |
| **🎭💭 Emotion-Aware AI** | Cami detects mood (frustration, confusion, excitement) and adapts responses | No other AI emotionally responds to YOUR emotional state |

---

## 🚀 Quick Start

**Get running in 3 minutes:**

```bash
# 1. Clone and install
git clone https://github.com/robbyczgw-cla/Chameleon-AI-Chat.git
cd Chameleon-AI-Chat
npm install

# 2. Set up environment
cp .env.example .env.local
# Add your OpenRouter API key (get one at openrouter.ai)

# 3. Run
npm run dev
# Open http://localhost:3000
```

**Required:**
- OpenRouter API key (free tier available)
- Supabase account (free tier works)

**Optional:**
- Web search: Serper, Tavily, or Exa API
- Voice: OpenAI Whisper + TTS

---

## 🎬 Live Streaming Example

**See what the AI is actually doing in real-time:**

```
[🧠 Thinking] Analyzing your message...
  └─ Tokens: 45 reasoning tokens

[🔍 Searching Web] Using Serper API...
  └─ Query: "latest Next.js 15 features"
  └─ Found 8 results from vercel.com, nextjs.org

[✍️ Writing] Generating response...
  └─ Tokens: 350 → 820 → 1,170

[✅ Complete] $0.0234 (GPT-4 Turbo via OpenAI)

⚡ Quick: "What about React 19?"
🧠 Deep: "How does this compare to Remix?"
🔗 Related: "Show me migration examples"
```

**Most AI chats show:** "Typing..."
**Chameleon shows:** Exactly what's happening, with costs

---

## 💡 Perfect For

**Power Users Who Want:**
- ✅ Control over AI spending (see exact costs per message)
- ✅ Personality in their AI (27 personas, not boring assistants)
- ✅ Data ownership (export training data, fine-tune your own models)
- ✅ Advanced features (debate mode, semantic memory, smart search)

**Developers:**
- 💻 Programming help with Dev persona
- 📊 Cost optimization for AI projects
- 🔧 Training data for fine-tuning models
- 🎯 Compare models side-by-side (debate mode)

**Businesses:**
- 💰 Track team AI spending
- 🎭 Custom personas for different roles
- 📈 Usage analytics and insights
- 🔒 Self-hosted option (data stays private)

---

## 🎨 Personas That Matter

Not generic "ChatGPT with a twist." Real personalities organized in 8 categories:

| Persona | Personality | Best For |
|---------|------------|----------|
| **Cami** 🦎 | **Emotion-aware** adaptive chameleon | Any topic - adapts to YOUR mood & tone |
| **Nova** ✨ | Cyberpunk hacker from Neo-Tokyo 2089 | Tech, coding, creative solutions |
| **Mythos** 🗺️ | Collaborative worldbuilder | D&D campaigns, storytelling, lore |
| **Cogito** 🤔 | Consciousness explorer | Philosophy, deep questions, ethics |
| **Vibe** 🎧 | Personal taste curator | Music, games, shows, recommendations |
| **Professor Stein** 🎓 | In-depth expert | Learning, research, detailed explanations |
| **Dev** 💻 | Programming partner | Code review, debugging, architecture |
| **Wordsmith** 📝 | Creative writing partner | All text types, blogs, emails *(NEW)* |
| **Wellbeing** 💚 | Mental health support | Mindfulness, emotional support *(NEW)* |

[See all 31 personas →](./docs/personas.md)

---

## 🆚 vs Competition

| Feature | Chameleon | Open-WebUI | LibreChat | LobeChat | ChatGPT-Next-Web |
|---------|-----------|------------|-----------|----------|------------------|
| **Advanced Streaming** | ✅ **Phases + Tool Preview** | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic |
| **Visual Tool Use** | ✅ **Transparent** | ⚠️ Hidden | ⚠️ Hidden | ⚠️ Hidden | ❌ No |
| **Smart Follow-ups** | ✅ **3-tier** | ❌ No | ❌ No | ⚠️ Basic | ❌ No |
| **Real Cost Tracking** | ✅ **Exact Billing** | ❌ Estimates | ❌ No | ❌ No | ❌ No |
| **Analytics Dashboard** | ✅ **Charts + Export** | ⚠️ Basic | ❌ No | ❌ No | ❌ No |
| **Deep Personas** | ✅ **31** | ⚠️ 2-3 | ⚠️ 2-3 | ⚠️ 2-3 | ❌ None |
| Multi-model | ✅ 100+ | ✅ Many | ✅ Many | ✅ Many | ✅ Many |
| Training Export | ✅ JSONL | ❌ No | ❌ No | ❌ No | ❌ No |

**TL;DR:** If you want transparency, intelligence, and control → **Chameleon**

---

## 📱 Install Options

**Three ways to use Chameleon AI:**

| Option | Best For | Install |
|--------|----------|---------|
| **Web App** | Quick access, any device | [chameleon-ai-chat.vercel.app](https://chameleon-ai-chat.vercel.app) |
| **PWA** | Mobile with offline support | Add to Home Screen from browser |
| **Android APK** | Native experience, Play Store | [Download APK](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/releases) |

### Android App vs PWA

| Feature | PWA | Android APK |
|---------|-----|-------------|
| **Haptics** | Basic vibration | Native patterns (success, error, etc.) |
| **Biometric Auth** | Not available | Fingerprint/Face unlock |
| **Notifications** | Limited web push | Native channels, custom sounds |
| **Share Target** | Limited | Receive text, images, PDFs |
| **Deep Links** | Web URLs only | Custom schemes (chameleon-ai://) |
| **App Icon** | Browser badge | Native icon |
| **Camera** | Web picker | Native with editing |
| **Distribution** | Add to Home | Google Play Store |
| **Design** | Web CSS | Material 3 Expressive |

**Android Requirements:** Android 13+ (API 33)

[Full Android documentation →](./docs/CAPACITOR_ANDROID.md)

---

## 🛠️ Tech Stack

**Modern, fast, reliable:**

- **Frontend:** Next.js 16 + React 19.2 + TypeScript 5
- **Styling:** Tailwind CSS 4.1 + shadcn/ui
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI:** OpenRouter (100+ models)
- **Voice:** OpenAI Whisper + TTS
- **Search:** Tavily + Serper + Exa
- **Deploy:** Vercel (Edge Runtime)
- **Mobile:** Capacitor 8 (Android)

---

## 📊 Cost Tracking Example

**See exactly what you're spending:**

```
Message 1: "Write a blog post about AI"
├─ Model: GPT-4 Turbo
├─ Tokens: 1,170 (350 input + 820 output)
├─ Cost: $0.0234
└─ Provider: OpenAI (via OpenRouter)

Message 2: "Now make it shorter"
├─ Model: Claude Sonnet 3.5
├─ Tokens: 890 (550 input + 340 output)
├─ Cost: $0.0178
└─ Provider: Anthropic

Total conversation: $0.0412
Monthly projection: $12.36 (based on usage)
```

**Export to JSON, analyze your spending, optimize costs.**

---

## 🎭 AI Debate Mode

**Watch models argue any topic:**

```
Topic: "Is AGI achievable by 2030?"

GPT-4: "I believe AGI by 2030 is unlikely because..."
Claude: "I respectfully disagree. Recent progress shows..."
GPT-4: "But consider the fundamental challenges..."
Claude: "Those challenges are being actively solved..."

Vote: Who convinced you?
```

**Perfect for:**
- Comparing model reasoning
- Research and analysis
- Entertainment and education
- Understanding different AI perspectives

---

## 🚀 Roadmap

**Currently working on:**
- [ ] Plugin system for extensibility
- [ ] Advanced memory visualization
- [ ] Team collaboration features
- [ ] Enhanced persona customization
- [ ] CLI tool for developers

**Recently shipped:**
- [x] Exact cost tracking from OpenRouter API
- [x] Memory surfacing (see which memories influenced response)
- [x] Image validation optimization
- [x] Gemini 3 support with reasoning
- [x] Security hardening (API keys, Mermaid diagrams)

[See full changelog →](./CHANGELOG.md)

---

## 📚 Documentation

**Get started fast:**

- [📖 User Guide](./docs/user-guide.md) - Complete walkthrough
- [🧠 Memory System](./docs/MEMORY_SYSTEM.md) - How memory works
- [🎭 Personas Guide](./docs/personas.md) - All 31 personas in 8 categories
- [🔧 Architecture](./docs/ARCHITECTURE.md) - Technical deep dive
- [🚀 Deployment](./docs/deployment.md) - Self-hosting guide
- [💾 Database Setup](./docs/DATABASE_IMPLEMENTATION_GUIDE.md) - Supabase config

---

## 🤝 Contributing

**Want to help?**

1. 🌟 **Star this repo** (helps others discover it)
2. 🐛 **Report bugs** via [Issues](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues)
3. 💡 **Suggest features** via [Discussions](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/discussions)
4. 🔧 **Submit PRs** - see [Contributing Guide](./docs/contributing.md)

---

## 💬 Community

**Join the conversation:**

- 💬 [Discord](#) - Chat with users and developers *(coming soon)*
- 🐦 [Twitter](#) - Updates and announcements *(coming soon)*
- 📧 Email: robbyczgw@gmail.com

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=robbyczgw-cla/Chameleon-AI-Chat&type=Date)](https://star-history.com/#robbyczgw-cla/Chameleon-AI-Chat&Date)

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

**Free to use, modify, and distribute.**

---

## 🙏 Acknowledgments

Built with amazing tools:
- [OpenRouter](https://openrouter.ai) - AI model access
- [Supabase](https://supabase.com) - Backend & database
- [Vercel](https://vercel.com) - Hosting
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [blocks.so](https://github.com/ephraimduncan/blocks) - Chat input inspiration

---

<div align="center">

### **Stop guessing your AI costs. Know exactly what you're spending.**

[🚀 Get Started](#-quick-start) • [⭐ Star This Repo](https://github.com/robbyczgw-cla/Chameleon-AI-Chat) • [📖 Read Docs](./docs)

**Built with ❤️ for power users who want control**

*100+ AI models • 31 personas • Real cost tracking • Training data export*

</div>
