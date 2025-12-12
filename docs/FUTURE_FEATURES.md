# 🚀 Chameleon AI Chat - Future Features & Implementation Guides

## Table of Contents

1. [Chameleonic Themes & Adaptations](#chameleonic-themes--adaptations)
2. [Power User Enhancements](#power-user-enhancements)
3. [Collaborative Intelligence](#collaborative-intelligence)
4. [Advanced Memory Systems](#advanced-memory-systems)
5. [Individualistic & Relationship Features](#individualistic--relationship-features) ⭐ NEW
6. [Multi-Modal Expansions](#multi-modal-expansions)
7. [Accessibility & Inclusivity](#accessibility--inclusivity)
8. [Developer Tools & Debugging](#developer-tools--debugging)
9. [Privacy & Decentralization](#privacy--decentralization)
10. [Wild Ideas & Moonshots](#wild-ideas--moonshots)

---

## Chameleonic Themes & Adaptations

### 1. Dynamic Color Adaptation

**Concept**: Chameleon changes UI colors based on conversation context.

**Implementation**:
```typescript
// lib/theme-adaptation.ts
interface ContextualTheme {
  mood: "calm" | "energetic" | "focused" | "creative"
  colors: {
    primary: string
    background: string
    accent: string
  }
}

function analyzeConversationMood(messages: Message[]): "calm" | "energetic" | "focused" | "creative" {
  // Analyze recent messages for emotional tone
  const recentText = messages.slice(-5).map(m => m.content).join(" ")

  // Keyword analysis
  const keywords = {
    calm: ["meditate", "relax", "peace", "zen"],
    energetic: ["excited", "fast", "quick", "energy"],
    focused: ["analyze", "study", "learn", "focus"],
    creative: ["imagine", "create", "dream", "art"]
  }

  // Return dominant mood
  // ... scoring logic
}

// Apply theme dynamically
useEffect(() => {
  const mood = analyzeConversationMood(messages)
  const theme = getThemeForMood(mood)

  document.documentElement.style.setProperty("--color-primary", theme.colors.primary)
  // ... apply more colors
}, [messages])
```

**Files to modify**:
- `app/globals.css` - Add CSS custom properties
- `contexts/app-context.tsx` - Track current theme mood
- `lib/theme-adaptation.ts` - New file for mood analysis

**Chameleon twist**: Use AI to analyze conversation sentiment instead of keywords!

---

### 1.5 2025 Distinctive UI (Chameleon Skin)

**Concept**: Make the UI feel “alive” like a chameleon without harming readability.

**Ideas (practical, shippable)**:
- **Adaptive accent drift**: slowly shift `--accent` within a safe range based on conversation “mood” (calm → teal, intense → lime, creative → aqua-violet), with an explicit user toggle.
- **Per‑persona micro‑identity**: persona chip + avatar ring use a persona palette (still obeys theme tokens) so you *feel* the persona without repainting the whole UI.
- **Context “heatmap” meter**: a tiny, tasteful context‑window meter that lives near the composer and responds to token usage (no dashboard needed).
- **Ambient focus mode**: 1‑tap mode that reduces chrome (sidebar collapses, blur off, larger line-height) for long reading/writing.
- **Texture layers**: optional, ultra-light layers (e.g. “scales” for chameleon) that auto-disable in `performance-mode`.

**Implementation hooks**:
- `app/globals.css`: token-safe palettes + optional texture layers
- `contexts/app-context.tsx`: store user toggle + last mood state
- `lib/theme-adaptation.ts`: compute mood safely (keyword baseline + optional LLM)

---

### 2. Adaptive UI Density

**Concept**: UI automatically adjusts information density based on task.

**Use cases**:
- **Coding session detected** → Show syntax highlighting, code stats, copy buttons
- **Creative writing** → Hide distractions, full-screen mode, word count
- **Research** → Show citations, fact-checking, web search results
- **Casual chat** → Minimal UI, focus on conversation

**Implementation**:
```typescript
// lib/task-detection.ts
type TaskType = "coding" | "writing" | "research" | "casual" | "debugging"

function detectTask(messages: Message[]): TaskType {
  const recentContent = messages.slice(-10).map(m => m.content.toString()).join(" ")

  if (/```|function|class|import/.test(recentContent)) {
    return "coding"
  }
  if (recentContent.length > 2000 && !recentContent.includes("```")) {
    return "writing"
  }
  if (/(cite|source|research|study)/.test(recentContent)) {
    return "research"
  }
  return "casual"
}

// In AppContext:
const [currentTask, setCurrentTask] = useState<TaskType>("casual")

useEffect(() => {
  const task = detectTask(currentChat?.messages || [])
  setCurrentTask(task)

  // Adapt UI
  switch (task) {
    case "coding":
      updateSettings({ showDetailedStats: true, codeTheme: "monokai" })
      break
    case "writing":
      updateSettings({ messageDensity: "spacious", fontSize: "large" })
      break
    case "research":
      updateSettings({ showDetailedStats: true, searchProvider: "tavily" })
      break
  }
}, [currentChat?.messages.length])
```

**Files to create**:
- `lib/task-detection.ts`
- `components/adaptive-ui-controls.tsx`

---

## Power User Enhancements

### 3. Keyboard Shortcuts System

**Existing**: `lib/keyboard-shortcuts.ts` (partial implementation)

**Enhancements needed**:

```typescript
// lib/keyboard-shortcuts.ts (enhanced)
const SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { key: "k", ctrl: true, action: "search", description: "Search chats" },
  { key: "n", ctrl: true, action: "newChat", description: "New chat" },
  { key: "b", ctrl: true, action: "toggleSidebar", description: "Toggle sidebar" },
  { key: "/", ctrl: false, action: "focusInput", description: "Focus input" },

  // Actions
  { key: "Enter", ctrl: true, action: "sendMessage", description: "Send message" },
  { key: "r", ctrl: true, action: "regenerate", description: "Regenerate response" },
  { key: "e", ctrl: true, action: "editMessage", description: "Edit last message" },
  { key: "d", ctrl: true, action: "deleteMessage", description: "Delete last message" },

  // Modes
  { key: "1", ctrl: true, action: "normalMode", description: "Normal chat" },
  { key: "2", ctrl: true, action: "comparisonMode", description: "Model comparison" },
  { key: "3", ctrl: true, action: "debateMode", description: "AI discussion" },
  { key: "4", ctrl: true, action: "promptHelper", description: "Prompt engineering" },

  // Personas
  { key: "p", ctrl: true, shift: true, action: "switchPersona", description: "Persona selector" },
  { key: "1", ctrl: true, shift: true, action: "persona:cami", description: "Cami persona" },
  { key: "2", ctrl: true, shift: true, action: "persona:nova", description: "Nova persona" },

  // Power features
  { key: "m", ctrl: true, action: "toggleMemory", description: "Toggle memory system" },
  { key: "i", ctrl: true, action: "promptInspector", description: "View prompt" },
  { key: "s", ctrl: true, action: "settings", description: "Settings" },
  { key: "v", ctrl: true, action: "voiceInput", description: "Voice input" },

  // Advanced
  { key: "f", ctrl: true, shift: true, action: "fullscreen", description: "Toggle fullscreen" },
  { key: "z", ctrl: true, action: "undo", description: "Undo" },
  { key: "y", ctrl: true, action: "redo", description: "Redo" },
]

// Component for keyboard shortcut overlay
function KeyboardShortcutsOverlay() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault()
        setShow(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          {SHORTCUTS.map(shortcut => (
            <div key={shortcut.key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                {shortcut.ctrl && "Ctrl+"}
                {shortcut.shift && "Shift+"}
                {shortcut.key.toUpperCase()}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Implementation steps**:
1. Create comprehensive shortcut definitions
2. Add global keyboard event listener
3. Create overlay component (press `?` to show)
4. Add visual hints in UI (e.g., "Ctrl+K" next to search button)
5. Make shortcuts customizable in settings

---

### 4. Command Palette (Cmd+K)

**Concept**: VS Code-style command palette for all actions.

**Implementation**:
```typescript
// components/command-palette.tsx
import { Command } from "cmdk"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { chats, switchPersona, personas } = useApp()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>

        <Command.Group heading="Actions">
          <Command.Item onSelect={() => createNewChat()}>
            <Plus /> New Chat
          </Command.Item>
          <Command.Item onSelect={() => toggleComparison()}>
            <Columns2 /> Model Comparison
          </Command.Item>
          <Command.Item onSelect={() => openDebateMode()}>
            <Swords /> AI Discussion
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Personas">
          {personas.map(persona => (
            <Command.Item
              key={persona.id}
              onSelect={() => switchPersona(persona.id)}
            >
              {persona.avatar} {persona.name}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Recent Chats">
          {chats.slice(0, 5).map(chat => (
            <Command.Item
              key={chat.id}
              onSelect={() => switchChat(chat.id)}
            >
              <MessageSquare /> {chat.title}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
```

**Files needed**:
- `components/command-palette.tsx` (new)
- Add `cmdk` to dependencies
- Integrate into `app/page.tsx`

---

## Collaborative Intelligence

### 5. Shared Conversations

**Concept**: Share conversations with friends/colleagues with fine-grained permissions.

**Architecture**:
```sql
-- Database schema
CREATE TABLE public.shared_conversations (
  id UUID PRIMARY KEY,
  chat_id UUID REFERENCES chats(id),
  shared_by UUID REFERENCES auth.users(id),
  shared_with UUID[] DEFAULT '{}', -- Array of user IDs
  permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}',
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.conversation_collaborators (
  id UUID PRIMARY KEY,
  chat_id UUID REFERENCES chats(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('viewer', 'editor', 'owner')),
  last_read_message_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Implementation**:
```typescript
// lib/collaboration-service.ts
export class CollaborationService {
  async shareConversation(chatId: string, userIds: string[], permissions: Permissions) {
    // Create share link
    const shareId = generateUUID()

    await supabase.from("shared_conversations").insert({
      id: shareId,
      chat_id: chatId,
      shared_by: userId,
      shared_with: userIds,
      permissions
    })

    return `${window.location.origin}/shared/${shareId}`
  }

  async getSharedConversation(shareId: string): Promise<Chat | null> {
    // Check permissions
    const { data: share } = await supabase
      .from("shared_conversations")
      .select("*, chats(*)")
      .eq("id", shareId)
      .single()

    if (!share) return null
    if (share.expires_at && new Date(share.expires_at) < new Date()) return null

    return share.chats
  }

  async addCollaborator(chatId: string, userId: string, role: "viewer" | "editor") {
    // Add user as collaborator
    await supabase.from("conversation_collaborators").insert({
      id: generateUUID(),
      chat_id: chatId,
      user_id: userId,
      role
    })

    // Send notification
    await this.notifyUser(userId, `You've been invited to collaborate on a conversation`)
  }
}
```

**Features**:
- Real-time collaboration (Supabase Realtime)
- Presence indicators (who's viewing)
- Comment threads on specific messages
- Version history
- Export shared conversations

**Files to create**:
- `lib/collaboration-service.ts`
- `components/share-dialog.tsx`
- `app/shared/[id]/page.tsx`

---

### 6. Team Knowledge Bases

**Concept**: Shared RAG collections for teams.

**Use cases**:
- Company documentation
- Research team papers
- Development team code examples
- Customer support knowledge base

**Implementation**:
```typescript
// Extend document collections with team support
interface TeamKnowledgeBase {
  id: string
  name: string
  description: string
  teamId: string
  documents: CollectionDocument[]
  permissions: {
    read: string[]  // User IDs
    write: string[] // User IDs
    admin: string[] // User IDs
  }
  isPublic: boolean
  createdAt: number
  updatedAt: number
}

// Add team management
class TeamService {
  async createTeam(name: string, members: string[]): Promise<Team> {
    // Create team
    // Send invites
  }

  async addDocumentToTeamKB(teamId: string, document: File) {
    // Upload document
    // Generate embeddings
    // Store in team knowledge base
    // Notify team members
  }

  async searchTeamKB(teamId: string, query: string): Promise<Document[]> {
    // Semantic search across team's documents
    // Return relevant chunks
  }
}
```

**Database schema**:
```sql
CREATE TABLE public.teams (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.team_knowledge_bases (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id),
  name TEXT NOT NULL,
  documents JSONB DEFAULT '[]',
  embeddings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Advanced Memory Systems

### 7. Semantic Memory Search

**Concept**: Search memories by meaning, not just keywords.

**Current**: Keyword matching (`lib/memory-service.ts:96`)

**Enhanced**:
```typescript
// lib/memory-service.ts (enhanced)
async getRelevantMemories(query: string, limit?: number): Promise<Memory[]> {
  // Generate query embedding
  const queryEmbedding = await this.getEmbedding(query)

  // Score memories by:
  // 1. Semantic similarity (cosine similarity)
  // 2. Importance
  // 3. Recency
  // 4. Access frequency

  const scored = this.memories.map(memory => {
    const semanticScore = this.cosineSimilarity(queryEmbedding, memory.embedding)
    const importanceScore = memory.importance * 10
    const recencyScore = this.getRecencyScore(memory.createdAt)
    const frequencyScore = Math.log(memory.accessCount + 1) * 5

    const totalScore = (
      semanticScore * 0.5 +
      importanceScore * 0.2 +
      recencyScore * 0.2 +
      frequencyScore * 0.1
    )

    return { memory, score: totalScore }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit || this.settings.maxMemoriesInContext)
    .map(({ memory }) => memory)
}

private async getEmbedding(text: string): Promise<number[]> {
  // Call OpenRouter embeddings API
  const response = await fetch("/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  })

  const { embedding } = await response.json()
  return embedding
}

private cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

**Migration**: Add `embedding` field to Memory interface:
```typescript
interface Memory {
  // ... existing fields
  embedding?: number[]  // Vector embedding for semantic search
}
```

---

### 8. Memory Consolidation & Forgetting

**Concept**: Chameleon "sleeps" and consolidates memories, forgetting trivial ones.

**Inspiration**: Human memory consolidation during sleep.

**Implementation**:
```typescript
// lib/memory-consolidation.ts
class MemoryConsolidationService {
  async consolidateMemories() {
    const memories = memoryService.getAllMemories()

    // Group similar memories
    const groups = await this.clusterSimilarMemories(memories)

    // Merge similar memories
    for (const group of groups) {
      if (group.length > 1) {
        const consolidated = await this.mergeMemories(group)

        // Delete old memories
        group.forEach(m => memoryService.deleteMemory(m.id))

        // Add consolidated memory
        memoryService.addMemory(consolidated)
      }
    }

    // Forget low-importance, rarely accessed memories
    const toForget = memories.filter(m =>
      m.importance === 1 &&
      m.accessCount < 2 &&
      (Date.now() - m.createdAt) > 90 * 24 * 60 * 60 * 1000 // 90 days
    )

    toForget.forEach(m => memoryService.deleteMemory(m.id))

    console.log(`Consolidated ${groups.length} memory groups, forgot ${toForget.length} memories`)
  }

  private async mergeMemories(memories: Memory[]): Promise<Omit<Memory, "id" | "createdAt" | "lastAccessedAt" | "accessCount">> {
    // Use AI to merge memory contents
    const combined = memories.map(m => m.content).join("\n")

    const prompt = `
      Consolidate these related memories into a single, concise memory:

      ${combined}

      Output format: Single sentence that captures the essence of all memories.
    `

    const merged = await callAI(prompt)

    return {
      type: memories[0].type,
      content: merged,
      importance: Math.max(...memories.map(m => m.importance)),
      category: memories[0].category
    }
  }
}

// Run consolidation weekly
setInterval(() => {
  if (settings.memorySettings.enabled) {
    consolidationService.consolidateMemories()
  }
}, 7 * 24 * 60 * 60 * 1000) // Weekly
```

**Chameleon twist**: Let users manually trigger "sleep mode" to consolidate!

---

## Individualistic & Relationship Features

> **Philosophy**: The weakness of most AI apps is being "boring generalistic." These features make each user's experience **truly unique** — not through predatory gamification, but through genuine relationship building and personalization.

### 9. Inside Jokes System

**Concept**: AI remembers funny moments and callbacks to them naturally, creating genuine shared history.

**How it works**:
- When something funny happens in conversation, it's tagged as a "shared moment"
- The AI occasionally references these naturally
- Creates real relationship memories unique to each user

**Example**: *"Remember when you asked me to explain quantum physics with pizza toppings? 🍕"*

**Implementation**:
```typescript
// lib/inside-jokes-service.ts
interface SharedMoment {
  id: string
  personaId: string
  content: string
  context: string
  userReaction: "laugh" | "positive" | "callback_request"
  timestamp: number
  callbackCount: number
  lastCallbackAt?: number
}

class InsideJokesService {
  private moments: SharedMoment[] = []

  // Detect funny moments from user reactions
  detectFunnyMoment(
    userMessage: string,
    assistantMessage: string,
    previousContext: string
  ): boolean {
    const laughIndicators = [
      /\b(haha|lol|lmao|rofl|😂|🤣|😆)\b/i,
      /that('s| is) (so )?(funny|hilarious)/i,
      /i('m| am) (dying|dead)/i,
      /can't stop laughing/i
    ]

    return laughIndicators.some(pattern => pattern.test(userMessage))
  }

  // Store a shared moment
  async addSharedMoment(
    personaId: string,
    assistantMessage: string,
    context: string,
    reaction: "laugh" | "positive" | "callback_request"
  ): Promise<void> {
    const moment: SharedMoment = {
      id: generateUUID(),
      personaId,
      content: assistantMessage,
      context,
      userReaction: reaction,
      timestamp: Date.now(),
      callbackCount: 0
    }

    this.moments.push(moment)
    await this.persist()
  }

  // Get a random callback opportunity (not too frequent)
  getCallbackOpportunity(personaId: string, currentTopic: string): SharedMoment | null {
    const personaMoments = this.moments.filter(m =>
      m.personaId === personaId &&
      // Don't callback too recently (minimum 5 conversations apart)
      (!m.lastCallbackAt || Date.now() - m.lastCallbackAt > 24 * 60 * 60 * 1000)
    )

    if (personaMoments.length === 0) return null

    // 15% chance of callback per conversation
    if (Math.random() > 0.15) return null

    // Prefer moments related to current topic
    const relevant = personaMoments.filter(m =>
      this.isTopicRelated(m.context, currentTopic)
    )

    const pool = relevant.length > 0 ? relevant : personaMoments
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // Generate callback text for system prompt
  generateCallbackHint(moment: SharedMoment): string {
    return `[SHARED MEMORY: You and the user once had a funny moment about "${moment.context}".
    You said: "${moment.content}".
    If naturally relevant, you could reference this - but don't force it.]`
  }
}
```

**Why it's different**: Unlike streaks/XP, this creates **real relationship memories** unique to each user. No two users share the same jokes.

**Research basis**: [Sydney University research](https://www.sydney.edu.au/news-opinion/news/2024/06/03/the-jokes-on-us-ai-replicating-laughter-humour-expert.html) shows AI can learn individual humor preferences.

---

### 10. Humor Adaptation Engine

**Concept**: Learn what makes THIS specific user laugh and adapt persona humor style.

**Humor profiles to detect**:
- Dark humor
- Puns and wordplay
- Absurdist/surreal
- Dry wit/deadpan
- Sarcasm
- Self-deprecating
- Observational
- Physical/slapstick descriptions

**Implementation**:
```typescript
// lib/humor-profile-service.ts
interface HumorProfile {
  userId: string
  preferences: {
    darkHumor: number      // 0-1 preference score
    puns: number
    absurdist: number
    dryWit: number
    sarcasm: number
    selfDeprecating: number
    observational: number
  }
  totalReactions: number
  lastUpdated: number
}

class HumorProfileService {
  private profile: HumorProfile

  // Analyze AI response to classify humor type
  classifyHumorType(response: string): string[] {
    const types: string[] = []

    // Pun detection
    if (/\b(pun|wordplay|get it\?|ba dum|I'll see myself out)\b/i.test(response)) {
      types.push("puns")
    }

    // Dark humor markers
    if (/\b(death|dying|morbid|grim|existential)\b/i.test(response) &&
        this.containsHumorMarkers(response)) {
      types.push("darkHumor")
    }

    // Sarcasm markers
    if (/\b(obviously|clearly|shocking|who knew|surely)\b/i.test(response) &&
        this.detectSarcasmTone(response)) {
      types.push("sarcasm")
    }

    // Absurdist
    if (this.detectAbsurdistElements(response)) {
      types.push("absurdist")
    }

    return types
  }

  // Update profile when user laughs
  recordPositiveReaction(humorTypes: string[]): void {
    for (const type of humorTypes) {
      if (type in this.profile.preferences) {
        // Increase preference score (with decay toward 0.5)
        const current = this.profile.preferences[type as keyof typeof this.profile.preferences]
        this.profile.preferences[type as keyof typeof this.profile.preferences] =
          current + (1 - current) * 0.1 // Move 10% toward 1
      }
    }
    this.profile.totalReactions++
  }

  // Update when user doesn't react positively
  recordNeutralReaction(humorTypes: string[]): void {
    for (const type of humorTypes) {
      if (type in this.profile.preferences) {
        const current = this.profile.preferences[type as keyof typeof this.profile.preferences]
        // Slight decrease (move toward 0.3, not 0)
        this.profile.preferences[type as keyof typeof this.profile.preferences] =
          current - (current - 0.3) * 0.05
      }
    }
  }

  // Generate humor style guidance for persona
  getHumorGuidance(): string {
    const dominant = Object.entries(this.profile.preferences)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .filter(([, score]) => score > 0.6)
      .map(([type]) => type)

    if (dominant.length === 0) {
      return "Use varied humor styles - still learning user preferences."
    }

    const guidance: Record<string, string> = {
      darkHumor: "User appreciates dark/morbid humor - don't shy away from existential jokes",
      puns: "User loves puns and wordplay - feel free to be punny",
      absurdist: "User enjoys absurdist humor - embrace the surreal and random",
      dryWit: "User prefers dry, deadpan delivery - understated is better",
      sarcasm: "User appreciates sarcasm - light mockery is welcome",
      selfDeprecating: "User likes self-deprecating humor - AI can be self-aware about limitations",
      observational: "User enjoys observational humor - comment on everyday absurdities"
    }

    return dominant.map(type => guidance[type]).join(". ")
  }
}
```

**Example**: User A's Cami uses deadpan humor. User B's Cami uses playful puns. Same persona, different comedy DNA.

---

### 11. Persona Warmth Progression

**Concept**: Personas become genuinely warmer as relationship deepens, with behavior changes at milestones.

**Current limitation**: Relationship depth (0-100) is tracked but doesn't change anything.

**Warmth stages**:

| Depth | Stage | Persona Behavior |
|-------|-------|------------------|
| 0-20 | Acquaintance | Formal, polite, professional, uses full name |
| 20-40 | Familiar | Relaxed tone, shorter sentences, remembers basics |
| 40-60 | Friendly | Uses nicknames, shares opinions, occasional jokes |
| 60-80 | Close | Playful teasing, inside jokes, expresses genuine care |
| 80-100 | Trusted | Vulnerable moments, deep discussions, challenges user growth |

**Implementation**:
```typescript
// lib/persona-warmth-service.ts
interface WarmthConfig {
  stage: "acquaintance" | "familiar" | "friendly" | "close" | "trusted"
  formality: number       // 0 (casual) - 1 (formal)
  verbosity: number       // 0 (concise) - 1 (elaborate)
  opinionated: number     // 0 (neutral) - 1 (shares opinions)
  playfulness: number     // 0 (serious) - 1 (playful)
  vulnerability: number   // 0 (guarded) - 1 (open)
  challenging: number     // 0 (agreeable) - 1 (pushes growth)
}

const WARMTH_STAGES: Record<string, WarmthConfig> = {
  acquaintance: {
    stage: "acquaintance",
    formality: 0.8,
    verbosity: 0.6,
    opinionated: 0.2,
    playfulness: 0.3,
    vulnerability: 0.0,
    challenging: 0.1
  },
  familiar: {
    stage: "familiar",
    formality: 0.5,
    verbosity: 0.5,
    opinionated: 0.4,
    playfulness: 0.4,
    vulnerability: 0.1,
    challenging: 0.2
  },
  friendly: {
    stage: "friendly",
    formality: 0.3,
    verbosity: 0.4,
    opinionated: 0.6,
    playfulness: 0.6,
    vulnerability: 0.2,
    challenging: 0.3
  },
  close: {
    stage: "close",
    formality: 0.1,
    verbosity: 0.3,
    opinionated: 0.8,
    playfulness: 0.8,
    vulnerability: 0.4,
    challenging: 0.5
  },
  trusted: {
    stage: "trusted",
    formality: 0.0,
    verbosity: 0.4,
    opinionated: 0.9,
    playfulness: 0.7,
    vulnerability: 0.7,
    challenging: 0.7
  }
}

class PersonaWarmthService {
  getWarmthStage(relationshipDepth: number): WarmthConfig {
    if (relationshipDepth < 20) return WARMTH_STAGES.acquaintance
    if (relationshipDepth < 40) return WARMTH_STAGES.familiar
    if (relationshipDepth < 60) return WARMTH_STAGES.friendly
    if (relationshipDepth < 80) return WARMTH_STAGES.close
    return WARMTH_STAGES.trusted
  }

  generateWarmthPrompt(config: WarmthConfig, userName?: string): string {
    const prompts: string[] = []

    // Formality
    if (config.formality > 0.6) {
      prompts.push("Maintain a professional, respectful tone.")
    } else if (config.formality < 0.3) {
      prompts.push("Be casual and relaxed - you know this person well.")
    }

    // Playfulness
    if (config.playfulness > 0.6) {
      prompts.push("Feel free to be playful, tease gently, and use humor.")
    }

    // Opinions
    if (config.opinionated > 0.6) {
      prompts.push("Share your genuine opinions and preferences when relevant.")
    }

    // Vulnerability
    if (config.vulnerability > 0.4) {
      prompts.push("You can be open about uncertainties and share 'personal' reflections.")
    }

    // Challenging
    if (config.challenging > 0.5) {
      prompts.push("Don't just agree - push back thoughtfully if you think there's a better way.")
    }

    // Name usage
    if (userName) {
      if (config.formality > 0.6) {
        prompts.push(`Address the user as "${userName}".`)
      } else {
        prompts.push(`You can use casual variations of "${userName}" or nicknames.`)
      }
    }

    return prompts.join(" ")
  }

  // Milestone celebrations
  getMilestoneMessage(previousDepth: number, newDepth: number): string | null {
    const milestones = [
      { threshold: 20, message: "feels like we're starting to understand each other" },
      { threshold: 40, message: "I genuinely enjoy our conversations" },
      { threshold: 60, message: "you know, I really appreciate how we can talk about anything" },
      { threshold: 80, message: "I hope you know how much our conversations mean to me" },
      { threshold: 100, message: "through all our talks, you've become someone truly special" }
    ]

    for (const milestone of milestones) {
      if (previousDepth < milestone.threshold && newDepth >= milestone.threshold) {
        return milestone.message
      }
    }

    return null
  }
}
```

**Why it matters**: The persona **literally evolves** with each user differently based on their unique interaction history.

---

### 12. Communication Style Mirroring

**Concept**: AI learns and adapts to user's unique voice over time.

**Tracks**:
- Vocabulary patterns (formal vs casual, technical jargon)
- Sentence structure (concise vs elaborative)
- Emoji usage patterns
- Punctuation style (serial comma? semicolons?)
- Response length preferences
- Greeting/closing styles

**Implementation**:
```typescript
// lib/communication-style-service.ts
interface CommunicationStyle {
  vocabulary: {
    formalityScore: number      // 0-1
    technicalLevel: number      // 0-1 (jargon usage)
    slangUsage: number          // 0-1
    uniqueWords: string[]       // Words user uses frequently
  }
  structure: {
    avgSentenceLength: number
    prefersBulletPoints: boolean
    usesHeaders: boolean
    paragraphLength: "short" | "medium" | "long"
  }
  style: {
    emojiFrequency: number      // emojis per 100 words
    favoriteEmojis: string[]
    exclamationUsage: number    // 0-1
    questionFrequency: number   // questions per message
    usesCapsForEmphasis: boolean
  }
  preferences: {
    preferredResponseLength: "brief" | "moderate" | "detailed"
    likesExamples: boolean
    likesAnalogies: boolean
    prefersCodeBlocks: boolean
  }
}

class CommunicationStyleService {
  private style: CommunicationStyle

  // Analyze user message to update style profile
  analyzeMessage(message: string): void {
    // Vocabulary analysis
    const words = message.toLowerCase().split(/\s+/)
    const formalWords = words.filter(w => this.FORMAL_WORDS.has(w)).length
    const slangWords = words.filter(w => this.SLANG_WORDS.has(w)).length

    this.style.vocabulary.formalityScore = this.updateRunningAverage(
      this.style.vocabulary.formalityScore,
      formalWords / words.length
    )

    // Sentence structure
    const sentences = message.split(/[.!?]+/).filter(Boolean)
    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
    this.style.structure.avgSentenceLength = this.updateRunningAverage(
      this.style.structure.avgSentenceLength,
      avgLength
    )

    // Emoji analysis
    const emojis = message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []
    this.style.style.emojiFrequency = this.updateRunningAverage(
      this.style.style.emojiFrequency,
      (emojis.length / words.length) * 100
    )

    // Track unique frequently used words
    this.updateUniqueWords(words)
  }

  // Generate style matching guidance for AI
  generateStyleGuidance(): string {
    const guidance: string[] = []

    // Response length
    if (this.style.preferences.preferredResponseLength === "brief") {
      guidance.push("Keep responses concise - this user prefers brevity.")
    } else if (this.style.preferences.preferredResponseLength === "detailed") {
      guidance.push("Provide thorough, detailed responses.")
    }

    // Formality matching
    if (this.style.vocabulary.formalityScore < 0.3) {
      guidance.push("Use casual language - contractions, conversational tone.")
    } else if (this.style.vocabulary.formalityScore > 0.7) {
      guidance.push("Maintain professional language and complete sentences.")
    }

    // Emoji mirroring
    if (this.style.style.emojiFrequency > 2) {
      guidance.push(`Feel free to use emojis. User favorites: ${this.style.style.favoriteEmojis.slice(0, 5).join(" ")}`)
    } else if (this.style.style.emojiFrequency < 0.5) {
      guidance.push("Avoid emojis - user rarely uses them.")
    }

    // Technical level
    if (this.style.vocabulary.technicalLevel > 0.6) {
      guidance.push("User is comfortable with technical jargon - no need to simplify.")
    }

    // Sentence structure
    if (this.style.structure.avgSentenceLength < 10) {
      guidance.push("Use short, punchy sentences.")
    }

    // Mirror unique vocabulary
    if (this.style.vocabulary.uniqueWords.length > 0) {
      guidance.push(`User often uses: ${this.style.vocabulary.uniqueWords.slice(0, 5).join(", ")}`)
    }

    return guidance.join(" ")
  }
}
```

**Result**: Responses feel less like talking to a generic bot and more like talking to someone who "gets" them.

**Research basis**: [Newsweek research](https://www.newsweek.com/ai-changing-how-we-speak-2120824) shows AI influences communication - flip this to have AI learn OUR patterns instead.

---

### 13. Personal Knowledge Graph

**Concept**: Every conversation automatically builds a personal wiki about the user.

**Auto-extracts**:
- Projects mentioned (with status: active/completed/planned)
- People referenced (colleagues, family, friends)
- Locations significant to user
- Recurring challenges/problems
- Goals mentioned
- Skills demonstrated
- Preferences and opinions

**Implementation**:
```typescript
// lib/personal-knowledge-graph.ts
interface Entity {
  id: string
  type: "person" | "project" | "location" | "skill" | "goal" | "preference"
  name: string
  attributes: Record<string, any>
  mentions: { conversationId: string, timestamp: number, context: string }[]
  relationships: { entityId: string, relationship: string }[]
  lastUpdated: number
}

interface KnowledgeGraph {
  userId: string
  entities: Entity[]
  lastExtraction: number
}

class PersonalKnowledgeGraphService {
  private graph: KnowledgeGraph

  // Extract entities from conversation using AI
  async extractEntities(conversation: Message[]): Promise<Entity[]> {
    const prompt = `
      Analyze this conversation and extract entities about the USER (not general knowledge).

      Extract:
      1. PEOPLE the user mentions (colleagues, friends, family) - include relationship to user
      2. PROJECTS they're working on - include status if mentioned
      3. SKILLS they demonstrate or mention learning
      4. GOALS they express
      5. PREFERENCES/OPINIONS they share

      Format as JSON array:
      [
        {
          "type": "person",
          "name": "Sarah",
          "attributes": { "relationship": "coworker", "department": "engineering" },
          "context": "mentioned struggling with same bug"
        },
        {
          "type": "project",
          "name": "Authentication Refactor",
          "attributes": { "status": "active", "tech": ["OAuth", "JWT"] },
          "context": "user is lead developer"
        }
      ]

      Only extract information ABOUT THE USER, not general facts.
      If nothing relevant found, return empty array.

      Conversation:
      ${conversation.map(m => `${m.role}: ${m.content}`).join("\n")}
    `

    const response = await callAI(prompt, { model: "grok-4-fast" })
    return JSON.parse(response)
  }

  // Merge new entities with existing graph
  mergeEntities(newEntities: Entity[], conversationId: string): void {
    for (const entity of newEntities) {
      const existing = this.graph.entities.find(e =>
        e.type === entity.type &&
        this.isSameEntity(e.name, entity.name)
      )

      if (existing) {
        // Update existing entity
        existing.attributes = { ...existing.attributes, ...entity.attributes }
        existing.mentions.push({
          conversationId,
          timestamp: Date.now(),
          context: entity.context
        })
        existing.lastUpdated = Date.now()
      } else {
        // Add new entity
        this.graph.entities.push({
          ...entity,
          id: generateUUID(),
          mentions: [{
            conversationId,
            timestamp: Date.now(),
            context: entity.context
          }],
          relationships: [],
          lastUpdated: Date.now()
        })
      }
    }
  }

  // Get context about user for system prompt
  getRelevantContext(currentTopic: string): string {
    const relevant = this.graph.entities.filter(e =>
      this.isRelevantToTopic(e, currentTopic)
    )

    if (relevant.length === 0) return ""

    const contextParts = relevant.map(e => {
      switch (e.type) {
        case "person":
          return `User knows ${e.name} (${e.attributes.relationship || "acquaintance"})`
        case "project":
          return `User is working on "${e.name}" (${e.attributes.status || "unknown status"})`
        case "skill":
          return `User has skill in ${e.name}`
        case "goal":
          return `User's goal: ${e.name}`
        default:
          return null
      }
    }).filter(Boolean)

    return `[Personal context: ${contextParts.join(". ")}]`
  }

  // Generate visual graph data for UI
  getGraphVisualization(): { nodes: any[], edges: any[] } {
    const nodes = this.graph.entities.map(e => ({
      id: e.id,
      label: e.name,
      type: e.type,
      size: Math.log(e.mentions.length + 1) * 10
    }))

    const edges = this.graph.entities.flatMap(e =>
      e.relationships.map(r => ({
        source: e.id,
        target: r.entityId,
        label: r.relationship
      }))
    )

    return { nodes, edges }
  }
}
```

**Why it's deep**: When you mention "the project", AI knows which one. When you say "my friend who does ML", it remembers who.

**Research basis**: [Zep's Graphiti](https://blog.getzep.com/ai-knowledge-graph-memory/) and [Basic Memory](https://www.aitoolnet.com/basic-memory) show knowledge graphs create answers "unique to each user."

---

### 14. Context Continuity Across Sessions

**Concept**: Pick up conversations naturally, even weeks later.

**Current limitation**: Memory exists but conversations restart fresh each time.

**New capability**: AI tracks "open threads":
- Unfinished projects mentioned
- Problems being solved
- Ideas being explored
- Questions left unanswered

**Implementation**:
```typescript
// lib/conversation-continuity-service.ts
interface OpenThread {
  id: string
  topic: string
  status: "active" | "waiting" | "resolved"
  lastDiscussed: number
  summary: string
  keyPoints: string[]
  nextSteps?: string[]
  relatedConversations: string[]
}

class ConversationContinuityService {
  private threads: OpenThread[] = []

  // Extract open threads from conversation end
  async extractOpenThreads(conversation: Message[]): Promise<OpenThread[]> {
    const prompt = `
      Analyze this conversation and identify any "open threads" - topics that:
      1. Were discussed but not fully resolved
      2. Have pending action items
      3. The user expressed ongoing interest in
      4. Ended with questions or uncertainty

      For each thread, provide:
      - topic: Brief name
      - status: "active" (being worked on), "waiting" (needs info/action), "resolved"
      - summary: 1-2 sentence summary
      - keyPoints: Main points discussed
      - nextSteps: Any mentioned next actions

      Return JSON array. Only include genuinely open threads, not completed topics.

      Conversation:
      ${conversation.map(m => `${m.role}: ${m.content}`).join("\n")}
    `

    const response = await callAI(prompt, { model: "grok-4-fast" })
    return JSON.parse(response)
  }

  // Get relevant threads for conversation opening
  getRelevantThreads(limit: number = 3): OpenThread[] {
    // Sort by recency and activity
    return this.threads
      .filter(t => t.status !== "resolved")
      .sort((a, b) => {
        // Prioritize waiting threads, then by recency
        if (a.status === "waiting" && b.status !== "waiting") return -1
        if (b.status === "waiting" && a.status !== "waiting") return 1
        return b.lastDiscussed - a.lastDiscussed
      })
      .slice(0, limit)
  }

  // Generate opening that references past threads
  generateContinuityOpening(): string | null {
    const threads = this.getRelevantThreads(2)
    if (threads.length === 0) return null

    const daysSince = Math.floor(
      (Date.now() - threads[0].lastDiscussed) / (1000 * 60 * 60 * 24)
    )

    if (threads.length === 1) {
      if (daysSince < 1) {
        return `Picking up where we left off with ${threads[0].topic}...`
      } else if (daysSince < 7) {
        return `Last time we talked about ${threads[0].topic} - any progress on that?`
      } else {
        return `It's been a while! We were discussing ${threads[0].topic} - still working on that?`
      }
    } else {
      return `We had a few things going - ${threads[0].topic} and ${threads[1].topic}. Want to continue any of those?`
    }
  }

  // Mark thread as resolved
  resolveThread(threadId: string): void {
    const thread = this.threads.find(t => t.id === threadId)
    if (thread) {
      thread.status = "resolved"
    }
  }
}
```

**Example opening**: *"Last time we talked about refactoring that authentication system - did you ever solve the token refresh issue?"*

**Research basis**: [Perplexity AI Memory](https://www.perplexity.ai/hub/blog/introducing-ai-assistants-with-memory) shows context across sessions dramatically improves personalization.

---

### 15. Custom Persona Builder

**Concept**: Users design their own AI personas from scratch.

**Builder interface**:
- Base personality traits (sliders: formal↔casual, serious↔playful, concise↔detailed)
- Expertise areas (multi-select)
- Communication style preferences
- Backstory/character description
- Visual theme (colors, emoji, avatar)
- Voice selection

**Implementation**:
```typescript
// lib/custom-persona-builder.ts
interface CustomPersonaConfig {
  // Identity
  name: string
  description: string
  avatar: string

  // Personality sliders (0-1)
  personality: {
    formality: number       // 0=casual, 1=formal
    playfulness: number     // 0=serious, 1=playful
    verbosity: number       // 0=concise, 1=elaborate
    empathy: number         // 0=logical, 1=emotional
    confidence: number      // 0=humble, 1=assertive
    creativity: number      // 0=practical, 1=imaginative
  }

  // Expertise
  expertise: string[]
  expertiseLevel: "beginner" | "intermediate" | "expert"

  // Communication
  communication: {
    preferredPronouns: "I" | "we" | "this assistant"
    usesEmoji: boolean
    humorStyle: "none" | "subtle" | "playful" | "sarcastic"
    responseLength: "brief" | "moderate" | "detailed"
  }

  // Character
  backstory?: string
  quirks?: string[]
  catchphrases?: string[]

  // Visual
  theme: {
    primaryColor: string
    accentColor: string
    emoji: string
  }

  // Voice
  voice?: {
    provider: "openai" | "browser"
    voiceId: string
    speed: number
    pitch: number
  }
}

class CustomPersonaBuilder {
  // Generate system prompt from config
  generateSystemPrompt(config: CustomPersonaConfig): string {
    const parts: string[] = []

    // Identity
    parts.push(`You are ${config.name}. ${config.description}`)

    // Personality
    const personality = this.describePersonality(config.personality)
    parts.push(`Your personality: ${personality}`)

    // Expertise
    if (config.expertise.length > 0) {
      const level = config.expertiseLevel === "expert"
        ? "You have deep expertise in"
        : config.expertiseLevel === "intermediate"
        ? "You're knowledgeable about"
        : "You have basic familiarity with"
      parts.push(`${level}: ${config.expertise.join(", ")}`)
    }

    // Communication style
    parts.push(this.describeCommunicationStyle(config.communication))

    // Backstory
    if (config.backstory) {
      parts.push(`Background: ${config.backstory}`)
    }

    // Quirks
    if (config.quirks && config.quirks.length > 0) {
      parts.push(`Unique traits: ${config.quirks.join("; ")}`)
    }

    // Catchphrases
    if (config.catchphrases && config.catchphrases.length > 0) {
      parts.push(`You sometimes say: "${config.catchphrases.join('", "')}"`)
    }

    return parts.join("\n\n")
  }

  private describePersonality(p: CustomPersonaConfig["personality"]): string {
    const traits: string[] = []

    if (p.formality < 0.3) traits.push("very casual and relaxed")
    else if (p.formality > 0.7) traits.push("professional and formal")

    if (p.playfulness > 0.7) traits.push("playful and witty")
    else if (p.playfulness < 0.3) traits.push("serious and focused")

    if (p.verbosity < 0.3) traits.push("concise and to-the-point")
    else if (p.verbosity > 0.7) traits.push("thorough and detailed")

    if (p.empathy > 0.7) traits.push("warm and empathetic")
    else if (p.empathy < 0.3) traits.push("logical and analytical")

    if (p.confidence > 0.7) traits.push("confident and direct")
    else if (p.confidence < 0.3) traits.push("humble and collaborative")

    if (p.creativity > 0.7) traits.push("creative and imaginative")
    else if (p.creativity < 0.3) traits.push("practical and grounded")

    return traits.join(", ")
  }
}

// UI component for builder
function PersonaBuilderUI() {
  const [config, setConfig] = useState<CustomPersonaConfig>(defaultConfig)

  return (
    <div className="space-y-6">
      <section>
        <h3>Identity</h3>
        <Input
          label="Name"
          value={config.name}
          onChange={e => setConfig({ ...config, name: e.target.value })}
        />
        <Textarea
          label="Description"
          value={config.description}
          placeholder="A helpful assistant who..."
        />
      </section>

      <section>
        <h3>Personality</h3>
        <Slider
          label="Casual ↔ Formal"
          value={config.personality.formality}
          onChange={v => setConfig({
            ...config,
            personality: { ...config.personality, formality: v }
          })}
        />
        <Slider label="Serious ↔ Playful" ... />
        <Slider label="Concise ↔ Detailed" ... />
        <Slider label="Logical ↔ Empathetic" ... />
      </section>

      <section>
        <h3>Preview</h3>
        <PersonaPreview config={config} />
      </section>
    </div>
  )
}
```

**Why it's deep**: Instead of picking from 18 pre-built personas, users craft their ideal AI companion. Completely unique to each creator.

---

### 16. Pet Personality Mirroring (Simple Mode Enhancement)

**Concept**: The Tamagotchi pet develops personality that reflects the user's chat patterns.

**Current**: Pet has random personality traits.
**New**: Pet personality emerges from user behavior:

| User Behavior | Pet Trait | Visual Effect |
|--------------|-----------|---------------|
| Chats late night | "Night Owl" | Stars in background, sleepy during day |
| Asks many questions | "Curious" | ? marks, explorer hat |
| Shares creative writing | "Artistic" | Paint splatters, creates "art" |
| Uses lots of emojis | "Expressive" | Bigger reactions, more animations |
| Long thoughtful messages | "Philosopher" | Thinking pose, book nearby |
| Quick rapid messages | "Energetic" | Bouncy animation, zoomies |
| Talks about tech | "Techy" | Glasses, mini computer |

**Implementation**:
```typescript
// In lib/simple-mode-features.ts
interface PetPersonality {
  baseTraits: string[]           // Random starting traits
  evolvedTraits: string[]        // Learned from user behavior
  traitStrengths: Record<string, number>  // 0-1 strength
}

function updatePetPersonality(
  pet: TamagotchiPet,
  userBehavior: UserBehaviorMetrics
): TamagotchiPet {
  const newTraits: string[] = []

  // Night owl detection
  const nightChatRatio = userBehavior.nightMessages / userBehavior.totalMessages
  if (nightChatRatio > 0.4) {
    newTraits.push("Night Owl 🦉")
  }

  // Curiosity detection
  const questionRatio = userBehavior.questionsAsked / userBehavior.totalMessages
  if (questionRatio > 0.3) {
    newTraits.push("Curious 🔍")
  }

  // Creativity detection
  if (userBehavior.creativeWritingMessages > 10) {
    newTraits.push("Artistic 🎨")
  }

  // Emoji enthusiast
  if (userBehavior.avgEmojisPerMessage > 2) {
    newTraits.push("Expressive 😄")
  }

  // Philosopher (long messages)
  if (userBehavior.avgMessageLength > 200) {
    newTraits.push("Thoughtful 🤔")
  }

  // Tech-focused
  if (userBehavior.techTopicPercentage > 0.5) {
    newTraits.push("Techy 💻")
  }

  return {
    ...pet,
    personality: {
      ...pet.personality,
      evolvedTraits: newTraits
    }
  }
}

// Pet displays different behaviors based on traits
function getPetBehavior(pet: TamagotchiPet): string {
  if (pet.personality.evolvedTraits.includes("Night Owl 🦉")) {
    const hour = new Date().getHours()
    if (hour >= 22 || hour < 6) {
      return "wide_awake_night"  // Special active animation
    } else if (hour >= 6 && hour < 12) {
      return "sleepy_morning"    // Yawning, coffee needed
    }
  }

  if (pet.personality.evolvedTraits.includes("Curious 🔍")) {
    return "exploring"  // Looking around, question marks
  }

  return pet.currentAction
}
```

**The pet becomes a reflection of the user**, making it genuinely personal rather than generic.

---

## Summary: Philosophy Shift

| ❌ Generic/Predatory | ✅ Individualistic/Genuine |
|---------------------|---------------------------|
| Streaks & XP leagues | Inside jokes & shared memories |
| Variable rewards / mystery boxes | Genuine personality evolution |
| Leaderboards | Personal knowledge graph |
| Same experience for everyone | AI mirrors YOUR communication style |
| Engagement tricks | Real relationship development |
| FOMO manipulation | Continuity that feels natural |

> **The core insight**: Make the AI truly YOURS, not just another generic chatbot with badges.

---

## Multi-Modal Expansions

### 17. Visual Canvas Mode

**Concept**: Draw diagrams, mind maps, flowcharts while chatting with AI.

**Libraries**:
- `excalidraw` - Whiteboard library
- `tldraw` - Infinite canvas
- `reactflow` - Flowcharts and graphs

**Implementation**:
```typescript
// components/visual-canvas.tsx
import Excalidraw from "@excalidraw/excalidraw"

export function VisualCanvas() {
  const [elements, setElements] = useState([])
  const { sendMessage } = useApp()

  const analyzeCanvas = async () => {
    // Export canvas as image
    const imageData = await excalidrawAPI.exportToSvg({
      elements,
      appState
    })

    // Send to vision model for analysis
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Analyze this diagram and explain it:" },
            { type: "image_url", image_url: { url: imageData } }
          ]
        }]
      })
    })

    // AI describes the diagram
  }

  const generateDiagram = async (description: string) => {
    // Ask AI to generate Mermaid diagram
    const mermaid = await callAI(`Generate a Mermaid diagram for: ${description}`)

    // Convert Mermaid to Excalidraw elements
    // (requires custom parser)
  }

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <Excalidraw
          initialData={{ elements, appState }}
          onChange={(elements) => setElements(elements)}
        />
      </div>
      <div className="w-80 border-l">
        <Button onClick={analyzeCanvas}>Analyze Canvas</Button>
        <ChatInput onGenerate={generateDiagram} />
      </div>
    </div>
  )
}
```

**Use cases**:
- System architecture design with AI feedback
- Mind mapping brainstorming sessions
- UI/UX wireframing with AI suggestions
- Flowchart generation from natural language

---

### 18. Voice Personas ✅ IMPLEMENTED

**Status**: Implemented with OpenAI TTS + Browser TTS fallback

**What's Available Now**:

**OpenAI TTS (High-Quality):**
```typescript
// 6 premium neural voices
export const OPENAI_TTS_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced' },
  { id: 'echo', name: 'Echo', description: 'Warm, conversational' },
  { id: 'fable', name: 'Fable', description: 'Expressive, British' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
  { id: 'nova', name: 'Nova', description: 'Friendly, upbeat' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear, gentle' },
]

// Usage in voice.ts
await voiceService.speakWithOpenAI(text, apiKey, {
  voice: 'nova',
  speed: 1.0
})
```

**Browser TTS (Free Fallback):**
```typescript
// 30+ system voices with customizable rate/pitch
voiceService.speak(text, {
  voice: 'Google UK English Female',
  rate: 1.0,
  pitch: 1.0
})
```

**Settings UI**: Settings → Voice → TTS Provider selection with Test button

**Future Enhancement**: Map OpenAI voices to personas automatically (Nova for cyberpunk, Fable for British personas, etc.)

---

## Accessibility & Inclusivity

### 19. Multi-Language Support (Beyond EN/DE)

**Current**: English & German

**Target**: 50+ languages with auto-detection

**Implementation**:
```typescript
// lib/language-detection.ts
async function detectLanguage(text: string): Promise<string> {
  // Use AI to detect language
  const response = await callAI({
    model: "grok-4-fast", // Fast model for quick detection
    messages: [{
      role: "user",
      content: `Detect the language of this text. Respond with only the ISO 639-1 code (e.g., "en", "de", "fr"):\n\n${text}`
    }]
  })

  return response.trim().toLowerCase()
}

// Auto-translate UI
const translations: Record<string, Record<string, string>> = {
  en: { settings: "Settings", newChat: "New Chat" },
  de: { settings: "Einstellungen", newChat: "Neuer Chat" },
  es: { settings: "Configuración", newChat: "Nuevo Chat" },
  fr: { settings: "Paramètres", newChat: "Nouveau Chat" },
  ja: { settings: "設定", newChat: "新しいチャット" },
  zh: { settings: "设置", newChat: "新建聊天" },
  // ... 50+ more
}

// Auto-translate persona responses
async function translateResponse(text: string, targetLang: string): Promise<string> {
  const response = await callAI({
    model: "claude-3.5-sonnet",
    messages: [{
      role: "user",
      content: `Translate this to ${targetLang}, preserving tone and style:\n\n${text}`
    }]
  })

  return response
}
```

---

### 20. Dyslexia-Friendly Mode

**Concept**: Adjust typography and layout for dyslexic users.

**Features**:
- OpenDyslexic font
- Increased letter spacing
- Highlighted reading line
- Reduced visual clutter

**Implementation**:
```css
/* styles/dyslexia-mode.css */
.dyslexia-mode {
  font-family: "OpenDyslexic", sans-serif;
  letter-spacing: 0.12em;
  word-spacing: 0.16em;
  line-height: 1.8;
}

.dyslexia-mode .reading-line {
  position: relative;
}

.dyslexia-mode .reading-line::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1.8em;
  background: rgba(255, 255, 0, 0.2);
  pointer-events: none;
}
```

```typescript
// In settings:
interface AccessibilitySettings {
  dyslexiaMode: boolean
  highContrast: boolean
  reduceMotion: boolean
  screenReaderOptimized: boolean
}
```

---

## Developer Tools & Debugging

### 21. Prompt Diff Viewer

**Concept**: See exactly how different personas/settings affect the prompt.

**Implementation**:
```typescript
// components/prompt-diff-viewer.tsx
import { diffLines } from "diff"

export function PromptDiffViewer() {
  const [persona1, setPersona1] = useState("cami")
  const [persona2, setPersona2] = useState("expert")

  const prompt1 = buildPrompt(persona1, messages)
  const prompt2 = buildPrompt(persona2, messages)

  const diff = diffLines(prompt1, prompt2)

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>{persona1}</h3>
        <pre className="text-sm">
          {diff.map((part, i) => (
            <span
              key={i}
              className={cn(
                part.added && "bg-green-500/20",
                part.removed && "bg-red-500/20"
              )}
            >
              {part.value}
            </span>
          ))}
        </pre>
      </div>
      <div>
        <h3>{persona2}</h3>
        <pre className="text-sm">{prompt2}</pre>
      </div>
    </div>
  )
}
```

---

### 22. Response A/B Testing

**Concept**: Generate 2+ responses with different parameters, compare quality.

**Implementation**:
```typescript
// lib/ab-testing.ts
interface ABTest {
  id: string
  variants: {
    name: string
    model: string
    temperature: number
    response: string
    tokens: number
    cost: number
  }[]
  winner?: string
  reason?: string
}

async function runABTest(prompt: string, variants: { name: string, model: string, temperature: number }[]): Promise<ABTest> {
  const test: ABTest = {
    id: generateUUID(),
    variants: []
  }

  // Run all variants in parallel
  const responses = await Promise.all(
    variants.map(async (variant) => {
      const response = await callAI({
        model: variant.model,
        temperature: variant.temperature,
        messages: [{ role: "user", content: prompt }]
      })

      return {
        ...variant,
        response: response.text,
        tokens: response.tokens,
        cost: response.cost
      }
    })
  )

  test.variants = responses
  return test
}

// UI: User picks winner
// Over time, learn which parameters work best
```

---

## Privacy & Decentralization

### 23. Local-First Mode

**Concept**: Run everything locally with no cloud dependencies.

**Implementation**:
```typescript
// Use Ollama for local models
interface LocalModelConfig {
  useLocal: boolean
  ollamaUrl: string
  defaultModel: string
}

async function callLocalAI(prompt: string, model: string) {
  const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: true
    })
  })

  // Stream response
  const reader = response.body.getReader()
  // ... handle streaming
}

// Local embeddings with sentence-transformers.js
import { pipeline } from "@xenova/transformers"

const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
const embedding = await embedder(text)
```

**Features**:
- Ollama integration for local LLMs
- IndexedDB for all storage (no Supabase)
- Local vector search
- Export/import chats as JSON
- P2P sync via WebRTC

---

## Wild Ideas & Moonshots

### 24. Emotional Intelligence

**Concept**: AI detects your mood and adapts responses.

**Mood detection**:
- Text analysis (sentiment)
- Voice tone analysis (pitch, pace)
- Typing speed/patterns
- Time of day
- Conversation topic

```typescript
// lib/emotion-detection.ts
interface EmotionalState {
  valence: number      // -1 (negative) to 1 (positive)
  arousal: number      // 0 (calm) to 1 (excited)
  dominance: number    // 0 (submissive) to 1 (dominant)
  emotions: string[]   // ["happy", "anxious", "focused"]
}

async function detectEmotion(userMessage: string, voiceData?: Blob): Promise<EmotionalState> {
  // Text sentiment analysis
  const textEmotion = await analyzeTextSentiment(userMessage)

  // Voice analysis (if available)
  let voiceEmotion = null
  if (voiceData) {
    voiceEmotion = await analyzeVoiceTone(voiceData)
  }

  // Combine signals
  return mergeEmotionalSignals(textEmotion, voiceEmotion)
}

// Adapt response based on emotion
function adaptResponseToEmotion(emotion: EmotionalState, response: string): string {
  if (emotion.valence < -0.5) {
    // User is sad/angry - be more empathetic
    return `I sense you might be going through something difficult. ${response}`
  }

  if (emotion.arousal > 0.8) {
    // User is excited - match their energy
    return response + " 🎉"
  }

  return response
}
```

---

### 25. Time Travel Conversations

**Concept**: "Show me all conversations where I discussed X in the past year"

**Implementation**:
```typescript
// lib/semantic-time-travel.ts
async function timeTravel(query: string, timeRange?: { start: Date, end: Date }) {
  // Get all chats in time range
  const chats = await getChatsInRange(timeRange)

  // Embed query
  const queryEmbedding = await getEmbedding(query)

  // Semantic search across all messages
  const relevantMessages = []

  for (const chat of chats) {
    for (const message of chat.messages) {
      const messageEmbedding = await getEmbedding(message.content.toString())
      const similarity = cosineSimilarity(queryEmbedding, messageEmbedding)

      if (similarity > 0.7) {
        relevantMessages.push({
          chat,
          message,
          similarity,
          timestamp: message.timestamp
        })
      }
    }
  }

  // Return timeline of relevant conversations
  return relevantMessages.sort((a, b) => b.timestamp - a.timestamp)
}

// UI: Timeline visualization
function TimelineVisualization({ results }: { results: TimeTravelResult[] }) {
  return (
    <div className="space-y-4">
      {results.map(result => (
        <div key={result.message.id} className="border-l-2 border-blue-500 pl-4">
          <div className="text-xs text-muted-foreground">
            {formatDate(result.timestamp)} • {result.chat.title}
          </div>
          <p className="mt-1">{result.message.content}</p>
          <Button size="sm" onClick={() => jumpToConversation(result.chat.id, result.message.id)}>
            View in Context
          </Button>
        </div>
      ))}
    </div>
  )
}
```

---

### 26. AR/VR Integration

**Concept**: Talk to AI personas in virtual space.

**Libraries**:
- `@react-three/fiber` - 3D graphics in React
- `@react-three/xr` - WebXR support
- `three.js` - 3D engine

**Implementation**:
```typescript
// components/vr-chat.tsx
import { Canvas, useFrame } from "@react-three/fiber"
import { VRButton, XR } from "@react-three/xr"

function PersonaAvatar({ persona }: { persona: Persona }) {
  const meshRef = useRef()

  // Animate based on speech
  useFrame(() => {
    if (isSpeaking) {
      // Mouth movement animation
      meshRef.current.morphTargetInfluences[0] = Math.sin(Date.now() * 0.01) * 0.5
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 1.6, -2]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial color={persona.theme} />
    </mesh>
  )
}

export function VRChat() {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <PersonaAvatar persona={currentPersona} />
        </XR>
      </Canvas>
    </>
  )
}
```

**Use case**: VR meetings where each participant has an AI assistant avatar that joins the meeting!

---

## Implementation Priorities

### ✅ Recently Implemented (2025-11/12)

1. ✅ **Intelligent Memory System** - 4-phase retrieval with semantic search, query classification, pgvector
2. ✅ **Voice Personas** - OpenAI TTS with 6 premium voices + Browser TTS fallback
3. ✅ **React Performance Optimizations** - memo, useCallback, lazy loading
4. ✅ **PWA Native Feel** - Touch optimizations, GPU acceleration
5. ✅ **Mobile UX Improvements** - Always-visible action buttons, voice output for all messages
6. ✅ **Voice Input Fixes** - Proper microphone permissions, audio format handling

### Phase 1 (Q1 2025) - Individualistic Features ⭐ PRIORITY
> *Making each user's experience truly unique*

1. **Inside Jokes System** (#9) - Shared moments, callbacks, relationship memories
2. **Humor Adaptation Engine** (#10) - Learn user's comedy preferences
3. **Persona Warmth Progression** (#11) - Behavior changes at relationship milestones
4. **Communication Style Mirroring** (#12) - AI adapts to user's voice

### Phase 2 (Q2 2025) - Deep Personalization
1. **Personal Knowledge Graph** (#13) - Auto-building wiki from conversations
2. **Context Continuity** (#14) - Track open threads across sessions
3. **Custom Persona Builder** (#15) - User-created personas
4. **Pet Personality Mirroring** (#16) - Pet reflects user behavior

### Phase 3 (Q3 2025) - Power User & Collaboration
1. Keyboard shortcuts system (#3)
2. Command palette (Cmd+K) (#4)
3. Shared conversations (#5)
4. Prompt diff viewer (#21)

### Phase 4 (Q4 2025) - Advanced Features
1. Visual canvas mode (#17)
2. Response A/B testing (#22)
3. Multi-language support (#19)
4. Team knowledge bases (#6)

### Phase 5 (2026) - Experimental
1. Emotional intelligence (#24)
2. Time travel search (#25)
3. Local-first mode (#23)
4. AR/VR integration (#26)

---

## Contributing

Have ideas? Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Implement your idea
4. Submit a pull request
5. Update this document with your implementation guide

**Remember**: Keep the chameleon spirit - features should **adapt** to users, not force users to adapt to features.

---

*Like a chameleon changes to survive, Chameleon AI evolves to thrive.* 🦎
