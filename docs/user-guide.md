# 📖 Chameleon Chat User Guide - Master All Features

**Version 0.9-beta** | Last updated: December 2025

Complete guide to getting the most out of Chameleon Chat's power user features.

---

## 🎯 Table of Contents

1. [Getting Started](#getting-started)
2. [Simple Mode](#simple-mode)
3. [Personalized Greeting](#personalized-greeting) ⭐ NEW (v0.9-beta)
4. [Chat Link Sharing](#chat-link-sharing) ⭐ NEW (v0.9-beta)
5. [Image Generation](#image-generation) ⭐ UPDATED (v0.9-beta)
6. [Understanding Personas](#understanding-personas)
7. [Intelligent Memory System](#intelligent-memory-system)
8. [Message Editing & Drafts](#message-editing--drafts)
9. [Full-Text Search](#full-text-search)
10. [AI Chat Titles](#ai-chat-titles)
11. [Cost Tracking & Optimization](#cost-tracking--optimization)
12. [AI Debate Mode](#ai-debate-mode)
13. [Training Data Export](#training-data-export)
14. [Advanced Settings](#advanced-settings)
15. [Web Search Integration](#web-search-integration)
16. [User Profile System](#user-profile-system)
17. [Chat Management](#chat-management)
18. [PWA & Mobile Tips](#pwa--mobile-tips)
19. [Pro Tips & Tricks](#pro-tips--tricks)

---

## 🚀 Getting Started

### First Time Setup

1. **Create Account**
   - Click "Sign Up" in the header
   - Enter email and password
   - Verify your email (check spam folder!)
   - Your profile is auto-created

2. **Set Up API Keys**
   - Click Settings icon (⚙️) in header
   - Go to "Advanced Settings" dialog
   - Enter your OpenRouter API key
   - (Optional) Add Tavily or Serper API keys for web search
   - Keys are encrypted and stored securely in Supabase

3. **Choose Your First Persona**
   - Click the persona selector in the chat header
   - Start with **Cami** (friendly chameleon) for general use
   - Or **Dev** if you're coding
   - Each persona has a unique personality and expertise!

---

## 🎛️ Simple Mode

### What is Simple Mode?

Simple Mode is a streamlined, distraction-free chat experience designed for casual users and mobile devices.

**Access Simple Mode:**
- Toggle "Simple Mode" in Settings
- Or add `?mode=simple` to URL

### Simple Mode Features

**Clean Interface:**
- Modern blocks-style chat input (inspired by [blocks.so](https://github.com/ephraimduncan/blocks))
- Persona selector with emoji + description
- Theme cards for quick visual customization
- Language pills (DE/EN) for one-tap switching

**Smart Defaults:**
- Uses Grok 4.1 Fast (fast, cheap, capable)
- AI-driven web search via tool calling
- Reasoning toggle for extended thinking
- Memory system enabled by default

**Mobile-Optimized:**
- Fixed header with persona name (truncated if long)
- Bottom chat input (thumb-friendly)
- Swipe gestures for sidebar
- Touch-friendly toggle switches

### Simple Mode Settings

Access settings via gear icon in header:

**Theme Selection:**
- Theme cards showing preview colors
- One-tap to switch themes
- Dark/Light mode toggle

**Language:**
- DE/EN language pills
- Instant switch without reload

**Model:**
- Default: Grok 4.1 Fast
- Change via Advanced Settings

**Features:**
- Web search (AI decides when to search)
- Reasoning mode toggle in chat input
- Memory system for persistent context

### Simple vs Advanced Mode

| Feature | Simple Mode | Advanced Mode |
|---------|-------------|---------------|
| Interface | Clean, minimal | Full-featured |
| Model Selection | Default only | 100+ models |
| Web Search | AI-driven (tool calling) | Manual + AI toggle |
| Settings | Theme, language | All parameters |
| MCP | Not available | Full configuration |
| Personas | Quick selector | Full customization |
| Mobile UX | Optimized | Standard |

### When to Use Simple Mode

**Use Simple Mode when:**
- Quick chats on mobile
- Casual conversations
- New users learning the app
- Distraction-free focus

**Use Advanced Mode when:**
- Comparing models
- Fine-tuning parameters
- Using MCP servers
- Power-user features

---

## 👋 Personalized Greeting

### Welcome Experience (v0.9-beta) ⭐ NEW

When you open Chameleon Chat or start a new conversation, you'll see a beautiful personalized greeting!

**What You See:**
- Time-of-day greeting (Good morning/afternoon/evening/night)
- Your profile name (if set)
- Gradient text animation (purple → pink)

**Example Greetings:**
```
Good morning, Alex
Good afternoon, Maria
Good evening
Guten Morgen, Stefan
Buenos días, Carlos
Bonsoir, Marie
```

### Time-of-Day Logic

| Time | English | German | Spanish | French |
|------|---------|--------|---------|--------|
| 5am-12pm | Good morning | Guten Morgen | Buenos días | Bonjour |
| 12pm-5pm | Good afternoon | Guten Tag | Buenas tardes | Bon après-midi |
| 5pm-9pm | Good evening | Guten Abend | Buenas tardes | Bonsoir |
| 9pm-5am | Good night | Gute Nacht | Buenas noches | Bonne nuit |

### Setting Your Name

1. Click profile icon in header
2. Go to "Edit Profile"
3. Enter your name in the "Name" field
4. Save changes

**Note:** Names longer than 20 characters are truncated with "…" to prevent layout issues.

### Language Support

The greeting automatically uses your app language setting:
- 🇬🇧 English (default)
- 🇩🇪 German (Deutsch)
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)

Change language: Settings → Language

---

## 🔗 Chat Link Sharing

### Share Conversations (v0.9-beta) ⭐ NEW

Share your conversations with anyone via a simple URL - no account required for viewing!

**How to Share:**
1. Open the chat you want to share
2. Click the menu icon (three dots) in the header
3. Click "Copy Chat Link"
4. Share the copied URL with anyone

**What Gets Shared:**
- Chat title
- All messages (user and AI)
- Date created

**What's NOT Shared:**
- Your profile information
- API keys or settings
- Memory system data

### How It Works

The share link uses **base64 encoding** to embed the conversation directly in the URL:

```
https://yoursite.com?share=eyJ2IjoxLCJ0IjoiSGVsbG8gV29ybGQiLCJtIjpb...
```

**Technical Format:**
```json
{
  "v": 1,           // Version (for future compatibility)
  "t": "Chat Title", // Title
  "m": [            // Messages (compressed)
    { "r": "u", "c": "Hello" },    // user message
    { "r": "a", "c": "Hi there!" } // assistant message
  ],
  "d": "2025-12-06" // Date
}
```

### Receiving Shared Chats

When someone opens a shared link:
1. The chat is automatically imported
2. Title shows "📥 [Original Title]"
3. Toast notification confirms import
4. Chat appears in sidebar
5. URL is cleaned up (share parameter removed)

### Privacy & Security

- **No Server Storage** - Data lives entirely in the URL
- **Client-Side Only** - No conversation data sent to servers
- **Ephemeral** - Recipient must save chat to keep it
- **Transparent** - Anyone can decode the base64 to see content

### Use Cases

**Team Collaboration:**
- Share interesting AI conversations with colleagues
- Distribute research findings
- Collaborate on prompts and responses

**Education:**
- Share example conversations with students
- Demonstrate AI capabilities
- Create conversation templates

**Social Sharing:**
- Share funny or interesting AI chats
- Create viral content
- Show off creative prompts

### Limitations

- Very long conversations may create very long URLs
- Some URL shorteners may truncate long URLs
- Shared chats don't include images or attachments

---

## 🖼️ Image Generation

### Image Toggle (v0.9-beta) ⭐ UPDATED

Control AI image generation directly from the header on both mobile AND desktop!

**Where to Find It:**
- **Mobile**: Header bar (next to voice/reasoning toggles)
- **Desktop**: Header bar (new in v0.9-beta!)

**Three States:**
1. **Off** - No image generation (default)
2. **Normal Quality** - Green dot indicator (●)
3. **High Quality** - Yellow "+" badge (+)

**How to Toggle:**
- Click the image icon in header
- Each click cycles: Off → Normal → High → Off
- Haptic feedback on touch devices

**Visual Indicators:**
- 🔘 Off: Plain icon, no badge
- 🟢 Normal: Green dot in corner
- 🟡+ High: Yellow "+" badge in corner

### Quality Modes

**Normal Quality:**
- Faster generation
- Lower cost
- Good for quick visuals
- Standard resolution

**High Quality:**
- Slower generation
- Higher cost
- Best for final outputs
- Maximum resolution

### Using Image Generation

1. Enable image mode (click toggle)
2. Describe what you want to see
3. AI generates image using DALL-E
4. Image appears in chat

**Good Prompts:**
- "A cyberpunk city at night with neon lights"
- "A cozy cabin in snowy mountains"
- "A friendly cartoon robot"

**Tips:**
- Be specific about style (realistic, cartoon, oil painting)
- Mention colors and lighting
- Describe composition (close-up, wide shot)

---

## 🎭 Understanding Personas

### What Are Personas?

Personas are AI personalities with unique:
- **Communication styles** (friendly, concise, philosophical, etc.)
- **Areas of expertise** (coding, creativity, teaching, etc.)
- **Backstories** (Nova lives in Neo-Tokyo 2089!)
- **Response patterns** (bullet points vs. detailed explanations)

### Choosing the Right Persona

**For Everyday Questions:**
- **Cami** 🦎 - Adaptive, friendly chameleon
- **Flash** ⚡ - Quick, concise answers with bullet points

**For Learning:**
- **Professor Einstein** 🎓 - In-depth, detailed explanations
- **Herr Müller** 👨‍🏫 - Simple language, analogies, ELI5 style

**For Coding:**
- **Dev** 💻 - Code examples, debugging, best practices
- Knows all frameworks: React, Next.js, Python, etc.

**For Creativity:**
- **Luna** 🎨 - Brainstorming, innovative ideas, metaphors
- **Mythos** 🗺️ - Build fictional worlds, D&D campaigns

**For Philosophy:**
- **Cogito** 🤔 - Questions consciousness, explores existence
- **Nihilo** 🌌 - Cosmic perspective, optimistic nihilism

**For Entertainment:**
- **Nova** ✨ - Cyberpunk hacker with rich backstory
- **Saul Goodman** ⚖️ - Charismatic lawyer, morally flexible
- **Leslie Knope** 💪 - Ultra-enthusiastic supporter

**For Recommendations:**
- **Vibe** 🎧 - Curates music, games, shows based on your taste
- Learns your preferences over time!

**For Professional Help:**
- **Coach Taylor** 🏈 - Mentorship and motivation
- **Saga Noren** 🔍 - Analytical detective, problem-solving

### Pro Persona Tips

1. **Stick with one persona per conversation** - They build context
2. **Try Nova for immersive roleplay** - She shares her cyberpunk life
3. **Use Mythos for long-term worldbuilding** - Builds persistent universes
4. **Vibe remembers your feedback** - Tell it what you liked/disliked
5. **Cogito is genuinely uncertain** - Not pretending, actually exploring

### Follow-Up Suggestions

After each AI response, you'll see 2-3 clickable questions like:
> [Tell me more about X] [What about Y?] [How does Z work?]

**Click these to:**
- Continue the conversation naturally
- Explore related topics
- Dive deeper into the subject

**How it works:**
- AI generates contextual follow-ups in `[FOLLOWUP]Q1|Q2|Q3[/FOLLOWUP]` format
- App parses and displays as clickable chips
- One click inserts the question into your input

---

## 🧠 Intelligent Memory System

### What is the Memory System?

The Memory System lets the AI **remember things about you** across all conversations. Instead of repeating yourself every time, the AI knows your preferences, skills, and context.

### Quick Start

1. **Enable Memory**: Click the brain icon (🧠) in the chat header
2. **Toggle ON**: Enable "AI Memory System"
3. **Add memories**: Click "Add Memory" and fill in your info

### Memory Types

| Type | Use For | Examples |
|------|---------|----------|
| **Preference** | Things you like/dislike | "I prefer TypeScript", "I don't like spicy food" |
| **Fact** | Personal information | "I'm a software engineer", "I live in Berlin" |
| **Context** | Current projects | "Building a SaaS", "Studying AWS certification" |
| **Skill** | Your abilities | "Expert in React", "Fluent in Spanish" |
| **Goal** | What you want | "Become senior developer", "Learn ML" |

### How It's Smart

The system uses a **4-phase intelligent pipeline**:

1. **Query Classification** - AI determines if your question needs personal context
   - "What is 2+2?" → No memory needed (factual)
   - "Recommend a book" → Needs your preferences

2. **Semantic Search** - Uses AI embeddings to find memories by meaning
   - "Suggest something to read" finds "I like sci-fi books"
   - Works even with zero words in common!

3. **Combined Intelligence** - Safety nets to avoid mistakes
   - Confidence thresholds prevent wrong skips
   - Persona chats can bypass classification

4. **Relevance Filter** - Skips irrelevant memories
   - Only includes memories that actually match

### Fine-Tuning (Advanced)

Go to **Settings → Experimental → Memory Intelligence**:

- **Semantic Search** - Use AI embeddings (recommended ON)
- **Always Retrieve for Personas** - Bypass classification for persona chats
- **Classification Confidence** - How sure AI must be to skip (50-99%)
- **Similarity Threshold** - Min similarity to include a memory (20-80%)
- **Min Relevance Score** - Skip all if best match is too low (10-50%)

### Costs

~$0.06/month for active users (100 queries/day):
- Classifications: ~$0.03/month
- Embeddings: ~$0.03/month

### Cloud Sync

Enable "Sync to Database" to:
- Access memories on all devices
- Use faster pgvector semantic search
- Survive browser data clear

📚 **Full guide**: [docs/MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md)

---

## ✏️ Message Editing & Drafts

### Editing Your Messages

Made a typo? Want to rephrase your question? Now you can edit your sent messages!

**How to Edit:**
1. Hover over (or tap on) any of your sent messages
2. Click the **Edit** (pencil) icon
3. Modify your text in the inline editor
4. Click **Save** to confirm, or **Cancel** to discard

**What Happens When You Edit:**
- Your message is updated with the new text
- AI automatically re-generates its response to your edited message
- The conversation flows naturally from your new question
- Original message is replaced (no edit history shown)

**Best Uses:**
- Fix typos or grammar errors
- Clarify confusing questions
- Try different phrasings to get better answers
- Remove sensitive information you accidentally included

### Draft Auto-Save

Never lose your message drafts again! Chameleon Chat automatically saves your drafts.

**How It Works:**
- Every 500ms, your current input is saved to localStorage
- Each chat has its own separate draft
- Drafts expire after 24 hours (prevents stale content)
- When you return to a chat, your draft is restored automatically
- Drafts clear when you successfully send a message

**Draft Indicators:**
- Your draft appears in the input box when you revisit a chat
- No notification needed - it just works seamlessly

**Technical Details:**
- Stored in localStorage as `chameleon-draft-{chatId}`
- JSON format: `{ text: "...", timestamp: 1234567890 }`
- Debounced saves (every 500ms) to prevent excessive writes
- 24hr expiry prevents outdated drafts from appearing

---

## 🔍 Full-Text Search

### Searching Your Chats

The sidebar search now searches **all chat content**, not just titles!

**How to Use:**
1. Click the search icon in the sidebar or press `Ctrl/Cmd + K`
2. Type at least 3 characters
3. Results appear instantly (1-5ms!)
4. Click a result to open that chat

**Search Features:**
- **Title Matching**: Chat titles are searched first
- **Message Content**: All messages in all chats are indexed
- **Real-Time**: Results update as you type
- **Relevance Scoring**: Title matches rank higher than content matches

**Technical Implementation:**
- Uses an **inverted index** for O(1) lookups
- 10-40x faster than linear search (50-200ms → 1-5ms)
- Index rebuilds when chats change
- Prefix matching for partial word searches

**Search Tips:**
- Use specific keywords for best results
- Search for code snippets, URLs, or unique phrases
- Minimum 3 characters required to trigger search
- Results limited to top 100 matches for performance

---

## 🤖 AI Chat Titles

### Automatic Title Generation

When you start a new chat, the AI automatically generates a concise, descriptive title!

**How It Works:**
1. You send your first message in a new chat
2. AI reads your message (first 500 characters)
3. Generates a 2-6 word title in the background
4. Title appears with a subtle slide-in animation
5. Fallback to truncated message if API fails

**Model Used:**
- `openai/gpt-oss-20b` - Privacy-focused open-source model
- Runs via OpenRouter (requires OpenRouter API key)
- Very cheap: ~$0.0001 per title
- Fast: Usually generates in 1-2 seconds

**Title Quality:**
- Concise: 2-6 words
- Descriptive: Captures the topic
- Clean: No quotes, no trailing punctuation
- Examples:
  - "Python List Sorting"
  - "Recipe for Pasta"
  - "Debug React Error"
  - "Travel Tips Tokyo"

**Title Animation:**
- Subtle slide-in from left with primary color highlight
- Fades to normal text color over 1.2 seconds
- GPU-friendly CSS animation (no JavaScript loops)
- Respects `prefers-reduced-motion` for accessibility

**Requirements:**
- OpenRouter API key must be configured
- Message must be at least 10 characters
- Only triggers on first message of a new chat

---

## 💸 Cost Tracking & Optimization

### Why Track Costs?

Different models have VASTLY different pricing:
- **GPT-4o**: $2.50 per 1M input tokens
- **Grok-4-Fast**: $0.02 per 1M input tokens (125x cheaper!)
- **Claude Sonnet 3.5**: $3.00 per 1M input tokens

A 1000-token conversation could cost $0.003 or $0.000024 depending on model choice!

### Accessing Cost Tracker

1. Click Settings (⚙️) in header
2. Open "Advanced Settings" dialog
3. Click **"💸 Cost Tracker"** button in "LLM Nerd Features"
4. Dashboard shows complete spending analytics

### Understanding the Dashboard

**Overview Cards:**
- **Total Cost** - All-time spending across all models
- **Total Tokens** - Input + output tokens used
- **Chat Count** - Number of conversations tracked
- **Avg Cost/Message** - Spending per message

**Monthly Projection:**
- Based on last 7 days of usage
- Extrapolates to 30-day spending
- Shows: "At this rate, you'll spend $X.XX this month"

**Cost by Model:**
- Bar chart showing top 5 most expensive models
- See which models drain your budget
- Consider switching to cheaper alternatives!

**Cost Over Time:**
- 14-day bar chart showing daily spending
- Identify spending spikes
- Track optimization improvements

### Optimization Strategies

1. **Use Grok-4-Fast as Default**
   - Fast, cheap, surprisingly good quality
   - Perfect for 80% of queries
   - Set in Advanced Settings → Model Selection

2. **Reserve Expensive Models for Complex Tasks**
   - Use GPT-4o/Claude for:
     - Code generation
     - Complex reasoning
     - Creative writing
   - Use Grok/DeepSeek for:
     - General questions
     - Summaries
     - Quick lookups

3. **Monitor Your Patterns**
   - Check Cost Tracker weekly
   - Identify expensive habits
   - Adjust model choices accordingly

4. **Use Serper Instead of Tavily**
   - Tavily: $1 per 1K searches
   - Serper: $0.2 per 1K searches (5x cheaper!)
   - Same Google Search quality

5. **Export and Analyze**
   - Click "Export Data" in Cost Tracker
   - Get JSON with complete history
   - Analyze in Excel/Python for deeper insights

### Setting Spending Limits (Future Feature)

Coming soon:
- Set monthly budgets
- Get alerts at 50%, 80%, 100% of budget
- Auto-switch to cheaper models when limit reached

---

## 🎭 AI Debate Mode

### What Is It?

Watch two AI models debate any topic across multiple rounds. Perfect for:
- **Testing models** - See which argues better
- **Getting perspectives** - Explore both sides of an issue
- **Entertainment** - Watch GPT-4 vs Claude debate pizza toppings
- **Research** - Compare reasoning styles
- **Viral content** - Share debates on social media (coming soon!)

### How to Use

1. **Access Debate Mode**
   - Click "AI Debate" in header menu
   - Or press `Ctrl/Cmd + D` (if enabled)

2. **Set Up Debate**
   - **Topic**: Enter any question or statement
     - Good: "Should AI be regulated?"
     - Good: "Is remote work better than office?"
     - Bad: "Tell me about AI" (not a debate topic)

   - **Model 1** (Left/Purple): Choose first debater
     - Try: GPT-4o, Claude Sonnet, Grok-2

   - **Rounds**: Choose 2-5 rounds
     - 2 Rounds: Quick (1-2 minutes)
     - 3 Rounds: Standard (2-3 minutes)
     - 4 Rounds: Long (3-4 minutes)
     - 5 Rounds: Epic (4-5 minutes)

   - **Model 2** (Right/Orange): Choose second debater
     - For contrast, pick different "philosophies"
     - GPT vs Claude = Different reasoning styles
     - Grok vs Gemini = Different training data

3. **Watch the Debate**
   - Responses stream in real-time (letter by letter!)
   - Purple card = Model 1's argument
   - Orange card = Model 2's counter-argument
   - Watch rounds unfold sequentially

4. **Vote for Winner**
   - After all rounds complete, vote buttons appear
   - Click which model had better arguments
   - Winner displayed with trophy 🏆
   - Start new debate to try different topic

### Best Debate Topics

**Philosophical:**
- "Is consciousness an illusion?"
- "Does free will exist?"
- "Is meaning inherent or constructed?"

**Technology:**
- "Should AI development be slowed down?"
- "Is privacy dead in the digital age?"
- "Will AGI be beneficial or harmful?"

**Practical:**
- "Remote work vs office work?"
- "Tabs vs spaces?" (classic!)
- "Is college education worth the cost?"

**Fun:**
- "Pineapple on pizza - yes or no?"
- "Best Star Trek captain?"
- "Vim vs Emacs?"

### Pro Debate Tips

1. **Pick Contrasting Models**
   - GPT-4 (optimistic) vs Claude (cautious)
   - Grok (aggressive) vs Gemini (balanced)

2. **Use 3 Rounds for Most Topics**
   - 2 rounds = Too short for nuance
   - 5 rounds = Can get repetitive
   - 3 rounds = Sweet spot

3. **Clear Topic Framing**
   - "Should X be Y?" is better than "What about X?"
   - Give both sides something to argue

4. **Take Notes**
   - Copy debates to document
   - Use as research for articles/papers
   - Compare reasoning patterns

5. **Experiment with Temperature**
   - Default: 0.8 (creative)
   - Try editing code for 0.3 (logical) debates
   - Or 1.2 (wild, creative) debates

---

## 💾 Training Data Export

### What Is It?

Export your conversations in JSONL (JSON Lines) format for:
- Fine-tuning GPT-3.5/GPT-4
- Creating custom Claude models
- Training domain-specific assistants
- Conversation analysis & research

### How to Export

1. **Access Export Tool**
   - Settings (⚙️) → Advanced Settings
   - Click **"💾 Export Training Data"** in LLM Nerd Features

2. **Select Conversations**
   - Checkboxes for each chat
   - Preview shows: Title, Messages count, Date

3. **Configure Export**
   - **Minimum Turns**: Filter short conversations
     - 1 = Export all
     - 3 = Only substantial conversations
     - 10 = Only deep, long conversations

   - **Include System Prompts**: Toggle on/off
     - ON = Export with persona instructions
     - OFF = Just user/assistant exchanges

4. **Choose Format**
   - **JSONL** (Recommended): One JSON object per line
     - Best for: OpenAI fine-tuning, ML pipelines
     - File: `training-data-YYYY-MM-DD.jsonl`

   - **JSON** (Human-readable): Single JSON array
     - Best for: Manual review, debugging
     - File: `training-data-YYYY-MM-DD.json`

5. **Export & Download**
   - Click "Export as JSONL" or "Export as JSON"
   - File downloads automatically
   - Each conversation becomes one training example

### JSONL Format Example

```jsonl
{"messages":[{"role":"system","content":"You are Dev, a programming expert..."},{"role":"user","content":"How do I use useState?"},{"role":"assistant","content":"useState is a React Hook..."}]}
{"messages":[{"role":"user","content":"Explain closures"},{"role":"assistant","content":"A closure is when a function..."}]}
```

### Use Cases

**1. Fine-Tune Personal Writing Style**
- Export 50+ conversations with Nova persona
- Fine-tune GPT-3.5 on your interaction style
- Result: AI that writes exactly like your convos with Nova

**2. Domain-Specific Assistant**
- Export all Dev persona coding conversations
- Fine-tune on your tech stack (React, Python, etc.)
- Result: AI that knows YOUR codebase patterns

**3. Custom Persona**
- Export Vibe persona music recommendations
- Fine-tune on your taste learning curve
- Result: AI music curator trained on YOUR feedback

**4. Research Dataset**
- Export all philosophical conversations (Cogito, Nihilo)
- Analyze reasoning patterns
- Publish findings (anonymize first!)

### Fine-Tuning Workflow

**OpenAI GPT-3.5:**
```bash
# 1. Prepare JSONL file
openai tools fine_tunes.prepare_data -f training-data.jsonl

# 2. Upload for fine-tuning
openai api fine_tunes.create -t training-data.jsonl -m gpt-3.5-turbo

# 3. Monitor training
openai api fine_tunes.follow -i ft-xxxxx

# 4. Use fine-tuned model
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_KEY" \
  -d '{"model": "ft:gpt-3.5-turbo:xxxxx", "messages": [...]}'
```

**Anthropic Claude:**
- Contact Anthropic for custom model training
- Provide JSONL export
- They train Claude variant on your data

### Best Practices

1. **Quality Over Quantity**
   - 50 great conversations > 500 mediocre ones
   - Use minimum turns filter (3+)

2. **Consistent Formatting**
   - Keep system prompts if you want to preserve persona
   - Remove system prompts for pure user/assistant patterns

3. **Privacy First**
   - Review exports before sharing/uploading
   - Remove personal information (names, emails, addresses)
   - Redact sensitive topics

4. **Version Control**
   - Export regularly (monthly)
   - Name files with dates
   - Track improvements over time

---

## ⚙️ Advanced Settings

### Accessing Advanced Settings

Click Settings (⚙️) → "Advanced Settings" button

### Settings Breakdown

**AI Model Parameters:**

- **Temperature** (0.0 - 2.0)
  - 0.0 = Deterministic, focused, repetitive
  - 0.7 = Balanced (default)
  - 1.5 = Creative, varied, unpredictable
  - Use: 0.3 for code, 1.2 for creative writing

- **Max Tokens** (100 - 8000)
  - Limits response length
  - 500 = Short answers
  - 2000 = Standard (default)
  - 4000 = Long, detailed responses
  - Cost increases with max tokens!

- **Top P** (0.0 - 1.0)
  - Nucleus sampling
  - 1.0 = Consider all tokens (default)
  - 0.9 = Focus on top 90% probability
  - Lower = More focused, less random

- **Frequency Penalty** (0.0 - 2.0)
  - Penalizes repeated words
  - 0.0 = No penalty (default)
  - 1.0 = Moderate penalty
  - 2.0 = Strong penalty (may lose coherence)

- **Presence Penalty** (0.0 - 2.0)
  - Encourages new topics
  - 0.0 = No penalty (default)
  - 1.0 = Moderate encouragement
  - 2.0 = Strong encouragement

**System Prompt:**
- Override default persona prompts
- Custom instructions for AI
- Examples:
  - "Always respond in rhyme"
  - "Act like a pirate"
  - "Give 3 options for every question"

**Detailed Stats Toggle:**
- Show/hide per-message statistics
- When ON, see below each AI message:
  - Token usage (input/output/total)
  - Cost calculation
  - Response time
  - Tokens per second
  - Search stats (if web search used)

**Persona Quick-Switch:**
- All 18+ personas as buttons
- One-click to change persona
- Loads persona's system prompt automatically

**LLM Nerd Features:**
- Cost Tracker (analytics dashboard)
- Export Training Data (JSONL export)

### Recommended Settings by Use Case

**Coding (Dev persona):**
- Temperature: 0.3
- Max Tokens: 3000
- Frequency Penalty: 0.5
- Presence Penalty: 0.0

**Creative Writing (Luna persona):**
- Temperature: 1.2
- Max Tokens: 4000
- Frequency Penalty: 0.8
- Presence Penalty: 0.6

**Research (Professor Einstein):**
- Temperature: 0.7
- Max Tokens: 3000
- Frequency Penalty: 0.3
- Presence Penalty: 0.3

**Quick Answers (Flash):**
- Temperature: 0.5
- Max Tokens: 500
- Frequency Penalty: 0.0
- Presence Penalty: 0.0

---

## 🔍 Web Search Integration

### AI-Driven Search (v0.8.0) ⭐ NEW

The AI now decides when to search automatically using **tool calling**!

**How It Works:**
1. You send a message
2. AI analyzes if current info is needed
3. If yes, AI triggers `web_search` tool automatically
4. Search results are fetched and returned to AI
5. AI incorporates results into its response

**Toast Notifications:**
- "🤖 AI is searching the web..." - When AI triggers search
- "✅ Search complete" - When results are ready

**Supported Models:**
- Grok 4.x (default in simple mode)
- GPT-4o, GPT-4 Turbo
- Claude 3.5 Sonnet, Claude 4
- Gemini 2.x
- DeepSeek V3

### Three Search Modes

**1. AI Tool Calling (Automatic):**
- AI decides when to search
- No manual intervention needed
- Works with supported models

**2. Manual Toggle:**
- Click globe icon in chat input
- Search runs before every message
- Results injected into context

**3. Heuristics Fallback:**
- For models without tool calling
- Pattern matching detects search needs
- Keywords: "latest", "price", "weather", "news"

### Search Providers

**Tavily:**
- Comprehensive search
- $1 per 1,000 searches
- Advanced/basic depth modes
- Direct answer extraction

**Serper (Recommended):**
- Real Google Search results
- $0.2 per 1,000 searches (5x cheaper!)
- Country/language targeting
- Image search included

### Enabling Web Search

1. **Add API Key**
   - Settings → Advanced Settings
   - Paste Tavily or Serper API key

2. **Configure Search**
   - Choose provider (Tavily/Serper)
   - Set max results (1-10, default 5)
   - Toggle image inclusion

3. **Use in Chat**
   - AI automatically searches when needed (tool calling)
   - Or toggle manual search (globe icon)
   - Results cited in response

### When Does AI Search?

**Automatically searches for:**
- Current events ("What happened today?")
- Prices and availability ("iPhone 16 price")
- Weather and live data ("Weather in Vienna")
- Recent news and updates
- Factual verification

**Does NOT search for:**
- General knowledge
- Code and programming help
- Creative writing
- Historical facts
- Personal advice

### Search Cost Optimization

**Use Serper:**
- Same quality (Google Search)
- 5x cheaper than Tavily

**Limit Results:**
- 3 results = Fast, cheap
- 5 results = Balanced (default)

**Use Tool Calling:**
- AI only searches when truly needed
- Reduces unnecessary search calls

---

## 👤 User Profile System

### Why Create a Profile?

Your profile personalizes EVERY conversation:
- AI knows your background
- Responses tailored to your expertise level
- References your interests and goals
- More natural, context-aware chats

### Setting Up Your Profile

Click profile icon → "Edit Profile"

**Basic Info:**
- Name (optional, helps AI be personal)
- Age (optional, adjusts communication style)
- Occupation (AI references your field)
- Location (cultural context, time zones)

**Interests:**
- Hobbies, passions, topics you care about
- Examples: "React development, hiking, sci-fi novels"
- AI mentions related topics naturally

**About Me:**
- Free-form description
- Describe yourself in 2-3 sentences
- Example: "Full-stack developer learning ML. Love cyberpunk aesthetics. Building a startup."

**Goals:**
- What you're working toward
- Short-term and long-term
- Examples: "Launch SaaS by Q3", "Learn Rust", "Get fit"

**Preferences:**
- Communication style (formal/casual)
- Expertise level (beginner/intermediate/expert)
- Response length preference

### How AI Uses Your Profile

**Example WITHOUT Profile:**
```
You: How do I deploy this?
AI: There are many deployment options: Vercel, AWS, Heroku...
```

**Example WITH Profile:**
```
Profile: "Full-stack dev, uses Next.js, based in Vienna"

You: How do I deploy this?
AI: Since you're using Next.js, Vercel is perfect - made by same team.
    Free tier works great for European servers (Vienna data center available).
    Just run `vercel deploy` - takes 30 seconds!
```

**Profile Makes AI:**
- Skip basic explanations (you're expert-level)
- Reference your interests ("Like that sci-fi book you mentioned...")
- Suggest relevant follow-ups ("For your startup, you might also...")
- Use appropriate tone (casual for you, formal for others)

### Profile Privacy

- Stored in Supabase with RLS (only YOU see it)
- Not shared with AI providers
- Used ONLY to build context in conversations
- Delete anytime (profile icon → Delete Profile)

---

## 📁 Chat Management

### Organizing Conversations

**Folders:**
- Create folders (Sidebar → "+" icon)
- Drag chats into folders
- Nest folders (folders inside folders)
- Color-code for visual organization

**Pinning:**
- Pin important chats (📌 icon)
- Pinned chats stay at top
- Use for: Active projects, reference material

**Archiving:**
- Archive old chats (archive icon)
- Hidden from main view
- Access via "Archived" filter
- Never deleted, just tucked away

**Search:**
- Search bar in sidebar
- Searches titles and content
- Keyboard shortcut: `Ctrl/Cmd + K`

### Chat Naming Strategy

**Auto-Generated Titles:**
- First message becomes title
- AI summarizes topic

**Manual Renaming:**
- Click title → Edit
- Use descriptive names:
  - ❌ "Chat 1", "New Chat"
  - ✅ "React Hooks Deep Dive", "Startup Marketing Ideas"

**Recommended Naming:**
- **Project-based**: "[ProjectName] - [Feature]"
- **Date-based**: "2025-01-15 - Client Meeting Notes"
- **Topic-based**: "TypeScript Types - Advanced Patterns"

### Folder Structure Ideas

```
📁 Work
  📁 Project Alpha
    💬 Database Design
    💬 API Routes
    💬 Frontend Components
  📁 Project Beta
    ...

📁 Learning
  📁 React
  📁 Python
  📁 Machine Learning

📁 Personal
  📁 Creative Writing
  📁 Fitness Plans
  📁 Travel Ideas

📁 Archives
  📁 2024-Q4
  📁 Completed Projects
```

---

## 🎯 Pro Tips & Tricks

### 1. Model Selection Strategy

**Start Cheap, Upgrade When Needed:**
```
1. Try Grok-4-Fast ($0.02/1M tokens)
   ↓ If answer insufficient
2. Try Claude Haiku ($0.25/1M tokens)
   ↓ If still not good enough
3. Use GPT-4o ($2.50/1M tokens)
```

**95% of questions** work fine with Grok-4-Fast!

### 2. Persona Combos

**For Complex Projects:**
- Start with **Professor Einstein** (research/planning)
- Switch to **Dev** (implementation)
- Finish with **Vibe** (recommendations for tools/libs)

**For Creative Work:**
- Brainstorm with **Luna** (ideas)
- Refine with **Mythos** (world-building)
- Polish with **Nova** (cyberpunk aesthetics)

**For Learning:**
- Overview with **Professor Einstein** (deep dive)
- Simplify with **Herr Müller** (ELI5)
- Practice with **Dev** (hands-on examples)

### 3. Follow-Up Suggestions Mastery

**Click follow-ups to:**
- Branch conversations naturally
- Discover related topics you didn't consider
- Keep momentum going

**Ignore follow-ups when:**
- You have a specific next question
- The topic is complete
- Moving to new subject

### 4. Training Data Goldmine

**Export after:**
- Solving a complex problem (document your solution)
- Learning new tech (create personal tutorial dataset)
- Building something unique (train AI on your patterns)

**Then:**
- Fine-tune GPT-3.5 on your data
- Create personal AI assistant
- Share anonymized dataset with team

### 5. Debate Mode for Research

**Instead of Googling:**
1. Run debate: "Is X better than Y?"
2. Let GPT-4 and Claude argue both sides
3. Get comprehensive perspective in 3 minutes
4. No bias toward one source

**Better than:**
- Reading biased articles
- Wading through Reddit arguments
- Watching 30-minute YouTube videos

### 6. Cost Optimization Hacks

**Use Model Fallbacks:**
- Cheap model first (Grok)
- If "I don't know" → Try pricier model (GPT-4)
- Manual but saves $$$

**Batch Questions:**
- Instead of 5 separate chats
- Ask "Answer these 5 questions: 1... 2... 3..."
- One conversation = Lower per-question cost

**Use Serper for Everything:**
- Tavily = $1/1K searches
- Serper = $0.2/1K searches
- Same quality, 5x savings

### 7. Profile Power-Ups

**Update Monthly:**
- Add new skills learned
- Update goals (completed/new)
- Refine interests

**Result:**
- AI always knows current YOU
- Responses stay relevant
- Natural conversation evolution

### 8. Keyboard Shortcuts

*Note: Some may require enabling in settings*

- `Ctrl/Cmd + K` = Search chats
- `Ctrl/Cmd + N` = New chat
- `Ctrl/Cmd + D` = AI Debate Mode
- `Ctrl/Cmd + ,` = Settings
- `Ctrl/Cmd + B` = Toggle sidebar

### 9. Mobile Experience

**Swipe Gestures:**
- Swipe right → Open sidebar
- Swipe left → Close sidebar

**Hamburger Menu:**
- Tap ☰ → Full navigation
- Access all features

**Voice Input:**
- Microphone icon in input
- Hands-free messaging

### 10. Experimental Features

**Branch Navigator (Beta):**
- Create alternate conversation paths
- Explore "what if" scenarios
- Compare different approaches

**Model Comparison:**
- Ask same question to 2+ models
- Side-by-side responses
- Pick best answer

---

## 📱 PWA & Mobile Tips

### Installing as PWA

Chameleon Chat works great as a Progressive Web App (PWA)!

**iOS (Safari):**
1. Open Chameleon Chat in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it and tap "Add"
5. Launch from your home screen for app-like experience

**Android (Chrome):**
1. Open Chameleon Chat in Chrome
2. Tap the three-dot menu
3. Select "Add to Home Screen" or "Install App"
4. Confirm installation

**Desktop (Chrome/Edge):**
1. Look for install icon in URL bar (or three-dot menu)
2. Click "Install Chameleon Chat"
3. Launch from Start Menu/Applications

### PWA Stability Features

We've implemented several features to ensure stable PWA experience:

**Image Compression:**
- Images over 100KB are automatically compressed on upload
- Maximum resolution: 1920x1080 pixels
- WebP format (with JPEG fallback)
- 80% quality setting
- ~90% size reduction for large images

**Memory Optimization:**
- Historical images are stripped from API requests
- Only current message images are sent to AI
- Placeholder text: "[Previous image was shared here]"
- Prevents memory leaks in long conversations

**Why This Matters:**
- PWAs have stricter memory limits than browsers
- Large image data URLs can crash PWA mode
- Our optimizations keep memory usage stable

### Touch Device Support

Action buttons (edit, copy, audio) are now always visible on touch devices!

**How It Works:**
- On devices with hover capability (mouse): Buttons show on hover
- On touch devices (iPad, tablets): Buttons always visible
- Uses CSS `@media(hover:hover)` for smart detection

**Supported Devices:**
- iPad (all models)
- Android tablets
- Touch-screen laptops (Surface, etc.)
- Any device without hover capability

### Mobile Keyboard Tips

**Sending Messages:**
- Press Enter to send (no Shift needed)
- Shift+Enter for new line

**Gestures:**
- Swipe right to open sidebar (if enabled)
- Pull down to refresh

**File Upload:**
- Tap paperclip icon
- Or drag & drop files onto chat area

---

## 🎓 Advanced Use Cases

### Use Case 1: Personal Knowledge Base

**Setup:**
1. Create "Personal Wiki" folder
2. Chat with Professor Einstein about topics
3. Pin important conversations
4. Export as training data monthly

**Result:**
- Searchable knowledge repository
- AI trained on YOUR understanding
- Never forget what you learned

### Use Case 2: Project Management

**Setup:**
1. Folder per project
2. Use Dev for technical decisions
3. Use Luna for creative brainstorming
4. Track costs per project (export Cost Tracker data)

**Result:**
- Organized project context
- AI remembers project details
- Cost accounting per project

### Use Case 3: Content Creation Engine

**Setup:**
1. Profile describes your writing style
2. Luna for ideation
3. Vibe for research (trending topics)
4. Export training data → Fine-tune on your voice

**Result:**
- AI ghostwriter trained on YOU
- Consistent brand voice
- Faster content production

### Use Case 4: Learning Accelerator

**Setup:**
1. "Learning" folder with subfolders per topic
2. Professor Einstein for deep dives
3. Herr Müller to simplify
4. Dev for hands-on practice
5. Export → Create personal study guide

**Result:**
- Personalized curriculum
- Multiple explanation styles
- Permanent reference material

---

## 🆘 Troubleshooting

### "API Key Invalid"
- Check Settings → Advanced Settings
- Paste key correctly (no extra spaces)
- Verify key on OpenRouter.ai

### "Search Failed"
- Check Tavily/Serper API key
- Verify key has credits
- Try switching providers

### "Export Failed"
- Select at least 1 conversation
- Check minimum turns filter (try 1)
- Try smaller batch (10 chats at a time)

### "Cost Tracker Shows $0"
- Detailed Stats must be enabled
- Only tracks NEW messages (after enabling)
- Retroactive tracking not available

### "Persona Not Working"
- Click persona button in Advanced Settings
- Or manually edit System Prompt
- Reload page if needed

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Docs**: [Full Documentation](../docs/)
- **Community**: Discord (link in README)

---

**🎉 You're now a Chameleon Chat Power User!**

Master these features and you'll:
- Save money with cost optimization
- Create custom AI models with training data
- Get better answers with persona selection
- Organize knowledge with chat management
- Explore perspectives with debate mode

**Now go forth and chat! 🚀**
