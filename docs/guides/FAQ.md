# Frequently Asked Questions (FAQ)

Common questions about Chameleon AI Chat.

---

## Getting Started

### What is Chameleon AI Chat?

Chameleon AI Chat is an open-source AI chat application that gives you access to 100+ AI models (Claude, GPT-4, Gemini, DeepSeek, and more) through a single, beautiful interface. It features real-time cost tracking, 31 unique AI personas, semantic memory, web search, and works on desktop, mobile, and as a native Android app.

### Is it free to use?

The app itself is free and open-source. However, you'll need API keys from providers like OpenRouter to use the AI models, which have their own pricing. Most models cost fractions of a cent per message. You can track your exact costs in real-time within the app.

### How do I get started?

1. Visit the app or deploy your own instance
2. Go to Settings → API Keys
3. Enter your OpenRouter API key (get one free at [openrouter.ai](https://openrouter.ai))
4. Start chatting!

### Do I need to create an account?

No! You can use the app without an account (guest mode). Creating an account with Supabase enables cloud sync across devices, but it's completely optional.

---

## AI Models & Personas

### What AI models are available?

Over 100 models including:
- **Claude** (3.5 Sonnet, 3 Opus, 3 Haiku)
- **GPT-4** (GPT-4o, GPT-4 Turbo)
- **Gemini** (Gemini 2.0 Flash, Gemini Pro)
- **DeepSeek** (DeepSeek V3, DeepSeek R1)
- **Llama, Mistral, Qwen**, and many more

### What are Personas?

Personas are pre-configured AI personalities that change how the AI responds. We have 31 personas in 8 categories:

| Category | Examples |
|----------|----------|
| **Core** | Cami (friendly), Dev (coding), Flash (quick answers) |
| **Creative** | Luna (storytelling), Nova (roleplay), Mythos (mythology) |
| **Professional** | Dr. Med (health), Sol Goldman (legal), Finny (finance) |
| **Lifestyle** | Chef Marco (cooking), Fit (fitness), Zen (mindfulness) |
| **Learning** | Scholar (education), Lingua (languages), Herr Müller (German) |

### What is Cami and why does she detect emotions?

Cami is the default persona - a friendly, emotionally-aware assistant. She can detect your emotional state (frustrated, excited, confused, etc.) and adapt her responses accordingly. For example, if you seem frustrated, she'll be more empathetic and solution-focused.

---

## Features

### How does the Memory system work?

The AI can remember important information about you across conversations:
- Your preferences and interests
- Facts you've shared
- Skills and goals
- Context from past chats

Memory works locally by default. You can enable cloud sync in Settings → Memory if you want it across devices.

### How do I use Web Search?

Enable "Web Search" in settings or the chat input area. The AI will automatically search the web when it needs current information. You can choose from:
- **Tavily** (AI-optimized, default)
- **Serper** (Google Search)
- **Exa** (Neural search)

### Can I compare multiple AI models?

Yes! Use **Model Comparison** mode to run the same prompt through 2-4 models side-by-side and compare their responses.

### What is Private Chat Mode?

Private Chat Mode ensures your conversation is never saved anywhere:
- No cloud sync
- No local storage
- No memory extraction
- Chat deleted when you close it

Enable it via the lock icon in chat settings.

### How does voice input work?

Click the microphone button to speak your message. The app uses OpenAI Whisper for transcription. You'll need an OpenAI API key in settings for this feature.

---

## Cost & Usage

### How much does each message cost?

Costs vary by model. Examples (approximate):
- **GPT-4o**: ~$0.005 per message
- **Claude 3.5 Sonnet**: ~$0.003 per message
- **Gemini Flash**: ~$0.0001 per message
- **DeepSeek V3**: ~$0.0002 per message

The app shows **exact costs** from OpenRouter after each message - not estimates!

### How do I track my spending?

Go to **Stats Dashboard** to see:
- Total spending by day/week/month
- Cost breakdown by model
- Token usage statistics
- Per-message cost history

### Why do some responses cost more?

Cost depends on:
1. **Model chosen** (GPT-4 > Claude > Gemini Flash)
2. **Message length** (longer prompts = more tokens)
3. **Response length** (longer responses = more tokens)
4. **Web search** (adds tokens for search results)
5. **Image attachments** (vision models charge per image)

---

## Privacy & Security

### Where is my data stored?

- **Without account**: Everything stays in your browser (localStorage)
- **With account**: Optionally synced to Supabase (PostgreSQL)
- **API keys**: Stored locally in your browser, never on our servers

### Are my conversations private?

Yes. Your conversations are:
- Stored locally in your browser by default
- Only sent to the AI provider you choose (OpenRouter, OpenAI, etc.)
- Never shared with third parties
- Protected by Row Level Security if using cloud sync

### Is my API key safe?

Your API keys are stored in your browser's localStorage and only sent directly to the respective API providers. We never see or store your keys on any server.

---

## Mobile & Installation

### Can I use it on my phone?

Yes! The app is a Progressive Web App (PWA):
- **iOS**: Open in Safari → Share → "Add to Home Screen"
- **Android**: Chrome will prompt "Install App" or use the APK

### Is there a native app?

Yes! We have a native Android app built with Capacitor. Download from the releases page or build it yourself.

### Does it work offline?

Partially. The app interface works offline, but you need internet to chat with AI models.

---

## Troubleshooting

### Why is my message not sending?

1. Check your API key is correct in Settings → API Keys
2. Verify you have credits with your API provider
3. Check your internet connection
4. Try a different AI model

### Why do I see "Rate limit exceeded"?

Your API provider has limits on requests per minute. Wait a moment and try again, or upgrade your API plan.

### The app is slow on mobile. What can I do?

1. Enable **Performance Mode** in Settings → Advanced
2. Reduce chat history (old chats can slow things down)
3. Disable streaming visualization in Settings
4. Use the native Android app instead of browser

### How do I clear my data?

- **Clear chats**: Settings → Danger Zone → Delete All Chats
- **Clear settings**: Clear your browser's localStorage for this site
- **Reset everything**: Clear site data in browser settings

### My theme isn't applying correctly?

1. Try switching to Light mode first, then back to your theme
2. Clear browser cache
3. Disable browser extensions that modify CSS

---

## Advanced

### Can I self-host this app?

Yes! Chameleon AI Chat is open-source:

```bash
git clone https://github.com/your-repo/Chameleon-AI-Chat
npm install
cp .env.example .env.local
# Add your Supabase credentials
npm run dev
```

See [docs/deployment.md](deployment.md) for full instructions.

### What API keys do I need?

| Feature | API Key Required |
|---------|------------------|
| Chat | OpenRouter (required) |
| Web Search | Tavily, Serper, or Exa (optional) |
| Voice Input | OpenAI (optional) |
| Image Generation | OpenAI (optional) |
| Weather Tool | WeatherAPI (optional) |

### How do I add my own persona?

Currently, personas are defined in `lib/personas.ts`. Custom persona creation UI is planned for a future release.

### Can I use my own AI backend?

The app is designed for OpenRouter, but the architecture supports other backends. You'd need to modify `lib/openrouter.ts` to add alternative providers.

---

## Getting Help

### Where can I report bugs?

Open an issue on GitHub: [GitHub Issues](https://github.com/your-repo/Chameleon-AI-Chat/issues)

### How can I contribute?

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Where can I get support?

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and community support
- **Documentation**: Check the `/docs` folder for guides

---

## Quick Tips

1. **Use keyboard shortcuts**: Press `Cmd/Ctrl + K` to open command palette
2. **Quick model switch**: Press `Cmd/Ctrl + ,` to change models
3. **Export chats**: Settings → Export for backup or training data
4. **Follow-up suggestions**: After each response, see AI-suggested follow-up questions
