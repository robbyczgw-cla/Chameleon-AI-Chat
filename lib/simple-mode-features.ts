/**
 * Simple Mode Features - Conversation Starters, Creative Corner, Stats
 */

// ==================== CONVERSATION STARTERS ====================

export interface ConversationStarter {
  id: string
  emoji: string
  label: { en: string; de: string }
  prompt: { en: string; de: string }
  category: "fun" | "creative" | "helpful" | "learning"
}

export const conversationStarters: ConversationStarter[] = [
  {
    id: "joke",
    emoji: "😂",
    label: { en: "Tell me a joke", de: "Erzähl mir einen Witz" },
    prompt: { en: "Tell me a funny joke!", de: "Erzähl mir einen lustigen Witz!" },
    category: "fun",
  },
  {
    id: "compliment",
    emoji: "💝",
    label: { en: "Give me a compliment", de: "Mach mir ein Kompliment" },
    prompt: { en: "Give me a nice, genuine compliment to brighten my day!", de: "Mach mir ein nettes, aufrichtiges Kompliment um meinen Tag zu verschönern!" },
    category: "fun",
  },
  {
    id: "motivation",
    emoji: "💪",
    label: { en: "Motivate me", de: "Motiviere mich" },
    prompt: { en: "Give me some motivation and encouragement!", de: "Gib mir etwas Motivation und Ermutigung!" },
    category: "helpful",
  },
  {
    id: "fact",
    emoji: "🧠",
    label: { en: "Random fun fact", de: "Zufälliger Fun Fact" },
    prompt: { en: "Tell me an interesting and surprising fun fact!", de: "Erzähl mir einen interessanten und überraschenden Fun Fact!" },
    category: "learning",
  },
  {
    id: "story",
    emoji: "📖",
    label: { en: "Tell me a short story", de: "Erzähl mir eine kurze Geschichte" },
    prompt: { en: "Tell me a creative and engaging short story (about 200 words).", de: "Erzähl mir eine kreative und fesselnde Kurzgeschichte (ca. 200 Wörter)." },
    category: "creative",
  },
  {
    id: "poem",
    emoji: "🎭",
    label: { en: "Write me a poem", de: "Schreib mir ein Gedicht" },
    prompt: { en: "Write me a beautiful, creative poem about something unexpected.", de: "Schreib mir ein schönes, kreatives Gedicht über etwas Unerwartetes." },
    category: "creative",
  },
  {
    id: "riddle",
    emoji: "🔮",
    label: { en: "Give me a riddle", de: "Gib mir ein Rätsel" },
    prompt: { en: "Give me a fun riddle to solve! Don't reveal the answer until I ask.", de: "Gib mir ein lustiges Rätsel zum Lösen! Verrate die Antwort erst, wenn ich frage." },
    category: "fun",
  },
  {
    id: "cook",
    emoji: "🍳",
    label: { en: "What should I cook?", de: "Was soll ich kochen?" },
    prompt: { en: "Suggest a delicious and easy recipe I could make today!", de: "Schlage mir ein leckeres und einfaches Rezept vor, das ich heute machen könnte!" },
    category: "helpful",
  },
  {
    id: "movie",
    emoji: "🎬",
    label: { en: "Recommend a movie", de: "Empfiehl mir einen Film" },
    prompt: { en: "Recommend me a great movie to watch tonight! Tell me why it's worth watching.", de: "Empfiehl mir einen tollen Film für heute Abend! Sag mir, warum er sehenswert ist." },
    category: "fun",
  },
  {
    id: "relax",
    emoji: "🧘",
    label: { en: "Help me relax", de: "Hilf mir zu entspannen" },
    prompt: { en: "Guide me through a quick relaxation exercise to help me calm down.", de: "Führe mich durch eine kurze Entspannungsübung um mir beim Beruhigen zu helfen." },
    category: "helpful",
  },
  {
    id: "quote",
    emoji: "💭",
    label: { en: "Inspiring quote", de: "Inspirierendes Zitat" },
    prompt: { en: "Share an inspiring quote and explain why it's meaningful.", de: "Teile ein inspirierendes Zitat und erkläre warum es bedeutsam ist." },
    category: "learning",
  },
  {
    id: "adventure",
    emoji: "🗺️",
    label: { en: "Random adventure", de: "Zufälliges Abenteuer" },
    prompt: { en: "Start an interactive text adventure game with me! Give me choices.", de: "Starte ein interaktives Text-Abenteuer mit mir! Gib mir Auswahlmöglichkeiten." },
    category: "creative",
  },
]

export const getStartersForInterests = (interests: string[], lang: "en" | "de"): ConversationStarter[] => {
  // Return all starters, but could be personalized based on interests in the future
  return conversationStarters
}

// ==================== CREATIVE CORNER ====================

export interface CreativeAction {
  id: string
  emoji: string
  label: { en: string; de: string }
  description: { en: string; de: string }
  promptTemplate: { en: string; de: string }
}

export const creativeActions: CreativeAction[] = [
  {
    id: "story_generator",
    emoji: "📚",
    label: { en: "Story Generator", de: "Geschichten-Generator" },
    description: { en: "Create unique stories", de: "Erstelle einzigartige Geschichten" },
    promptTemplate: {
      en: "Write a creative {genre} story about {topic}. Make it engaging with vivid descriptions and interesting characters.",
      de: "Schreibe eine kreative {genre}-Geschichte über {topic}. Mache sie fesselnd mit lebhaften Beschreibungen und interessanten Charakteren.",
    },
  },
  {
    id: "poem_writer",
    emoji: "🎭",
    label: { en: "Poem Writer", de: "Gedicht-Schreiber" },
    description: { en: "Compose beautiful poems", de: "Verfasse schöne Gedichte" },
    promptTemplate: {
      en: "Write a {style} poem about {topic}. Make it {mood} and memorable.",
      de: "Schreibe ein {style} Gedicht über {topic}. Mache es {mood} und unvergesslich.",
    },
  },
  {
    id: "name_generator",
    emoji: "✨",
    label: { en: "Name Generator", de: "Namen-Generator" },
    description: { en: "Generate creative names", de: "Generiere kreative Namen" },
    promptTemplate: {
      en: "Generate 10 creative and unique names for a {type}. Include a brief explanation for each.",
      de: "Generiere 10 kreative und einzigartige Namen für {type}. Füge eine kurze Erklärung für jeden hinzu.",
    },
  },
  {
    id: "joke_maker",
    emoji: "😂",
    label: { en: "Joke Maker", de: "Witze-Macher" },
    description: { en: "Create funny jokes", de: "Erstelle lustige Witze" },
    promptTemplate: {
      en: "Tell me 3 original, funny jokes about {topic}. Make them clever and family-friendly.",
      de: "Erzähle mir 3 originelle, lustige Witze über {topic}. Mache sie clever und familienfreundlich.",
    },
  },
  {
    id: "song_lyrics",
    emoji: "🎵",
    label: { en: "Song Lyrics", de: "Liedtexte" },
    description: { en: "Write song lyrics", de: "Schreibe Liedtexte" },
    promptTemplate: {
      en: "Write {style} song lyrics about {topic}. Include a catchy chorus.",
      de: "Schreibe {style} Liedtexte über {topic}. Füge einen eingängigen Refrain hinzu.",
    },
  },
  {
    id: "letter_writer",
    emoji: "💌",
    label: { en: "Letter Writer", de: "Brief-Schreiber" },
    description: { en: "Write heartfelt letters", de: "Schreibe herzliche Briefe" },
    promptTemplate: {
      en: "Help me write a {type} letter to {recipient}. Make it sincere and {tone}.",
      de: "Hilf mir einen {type} Brief an {recipient} zu schreiben. Mache ihn aufrichtig und {tone}.",
    },
  },
]

// ==================== STATS TRACKING ====================

export interface SimpleStats {
  totalMessages: number
  totalImages: number
  personasUsed: string[]
  creativeCornerUses: number
  questionsAsked: number
}

const SIMPLE_STATS_KEY = "chameleon-simple-stats"

export const simpleStatsService = {
  getStats(): SimpleStats {
    if (typeof window === "undefined") {
      return { totalMessages: 0, totalImages: 0, personasUsed: [], creativeCornerUses: 0, questionsAsked: 0 }
    }
    try {
      const stored = localStorage.getItem(SIMPLE_STATS_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return { totalMessages: 0, totalImages: 0, personasUsed: [], creativeCornerUses: 0, questionsAsked: 0 }
  },

  saveStats(stats: SimpleStats): void {
    if (typeof window === "undefined") return
    localStorage.setItem(SIMPLE_STATS_KEY, JSON.stringify(stats))
  },

  recordMessage(isQuestion: boolean = false): SimpleStats {
    const stats = this.getStats()
    stats.totalMessages += 1
    if (isQuestion) {
      stats.questionsAsked += 1
    }
    this.saveStats(stats)
    return stats
  },

  recordImage(): SimpleStats {
    const stats = this.getStats()
    stats.totalImages += 1
    this.saveStats(stats)
    return stats
  },

  recordPersona(personaId: string): SimpleStats {
    const stats = this.getStats()
    if (!stats.personasUsed.includes(personaId)) {
      stats.personasUsed.push(personaId)
    }
    this.saveStats(stats)
    return stats
  },

  recordCreativeCorner(): SimpleStats {
    const stats = this.getStats()
    stats.creativeCornerUses += 1
    this.saveStats(stats)
    return stats
  },
}
