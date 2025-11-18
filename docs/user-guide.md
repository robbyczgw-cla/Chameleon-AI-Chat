# 📖 Marachat User Guide - Master All Features

Complete guide to getting the most out of Marachat's power user features.

---

## 🎯 Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Personas](#understanding-personas)
3. [Cost Tracking & Optimization](#cost-tracking--optimization)
4. [AI Debate Mode](#ai-debate-mode)
5. [Training Data Export](#training-data-export)
6. [Advanced Settings](#advanced-settings)
7. [Web Search Integration](#web-search-integration)
8. [User Profile System](#user-profile-system)
9. [Chat Management](#chat-management)
10. [Pro Tips & Tricks](#pro-tips--tricks)

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
- **HiFi Experte** 🔊 - Audio equipment consulting (AT/DE market)
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

### Two Search Providers

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
   - Or both! Switch between them

2. **Configure Search**
   - Choose provider (Tavily/Serper)
   - Set max results (1-10, default 5)
   - Toggle image inclusion
   - (Serper) Set country (AT, DE, US, etc.)
   - (Serper) Set language (de, en, es, etc.)

3. **Use in Chat**
   - AI automatically searches when needed
   - Or ask explicitly: "Search for..."
   - Results cited in response

### When Does AI Search?

Automatically for:
- Current events ("Latest AI news")
- Factual lookups ("Population of Vienna?")
- Price checks ("iPhone 15 price Austria")
- Recent releases ("New movies 2025")

Does NOT search for:
- General knowledge ("What is React?")
- Creative tasks ("Write a poem")
- Code help ("Debug this function")
- Personal advice

### Search Cost Optimization

**Use Serper Instead of Tavily:**
- Same quality (Google Search)
- 5x cheaper
- Better for frequent searches

**Limit Max Results:**
- 3 results = Faster, cheaper
- 5 results = Balanced (default)
- 10 results = Comprehensive, expensive

**Disable Images When Not Needed:**
- Images = Separate API call
- Only enable for visual topics

**Use Country/Language Targeting (Serper):**
- DE = German results (better for AT/DE users)
- US = English results (more comprehensive)
- Focused results = Better quality

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

**🎉 You're now a Marachat Power User!**

Master these features and you'll:
- Save money with cost optimization
- Create custom AI models with training data
- Get better answers with persona selection
- Organize knowledge with chat management
- Explore perspectives with debate mode

**Now go forth and chat! 🚀**
