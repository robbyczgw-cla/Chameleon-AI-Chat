/**
 * Persona Example Prompts
 *
 * Bilingual (EN/DE) example prompts shown in the UI for each persona.
 */

import type { PersonaCategory } from "./types"

/**
 * Category display names for UI
 */
export const CATEGORY_LABELS: Record<
  PersonaCategory,
  { en: string; de: string; es: string }
> = {
  core: { en: "Core", de: "Kern", es: "Principal" },
  creative: { en: "Creative", de: "Kreativ", es: "Creativo" },
  professional: { en: "Professional", de: "Professionell", es: "Profesional" },
  philosophy: { en: "Philosophy", de: "Philosophie", es: "Filosofía" },
  lifestyle: { en: "Lifestyle", de: "Lifestyle", es: "Estilo de vida" },
  learning: { en: "Learning", de: "Lernen", es: "Aprendizaje" },
  curator: { en: "Curators", de: "Kuratoren", es: "Curadores" },
  special: { en: "Special", de: "Spezial", es: "Especial" },
}

/**
 * Example prompts for each persona, keyed by persona ID.
 * Falls back to 'default' if persona not found.
 */
export const PERSONA_EXAMPLE_PROMPTS: Record<
  string,
  { en: string[]; de: string[] }
> = {
  default: {
    en: [
      "Explain this concept in simple terms",
      "Help me write a professional email",
      "Summarize this article for me",
      "Give me 5 creative ideas for...",
      "How do I solve this problem?",
      "What are the key points about...",
    ],
    de: [
      "Erkläre dieses Konzept einfach",
      "Hilf mir eine professionelle E-Mail zu schreiben",
      "Fasse diesen Artikel zusammen",
      "Gib mir 5 kreative Ideen für...",
      "Wie löse ich dieses Problem?",
      "Was sind die Hauptpunkte über...",
    ],
  },

  // ==================== CORE ====================
  friendly: {
    en: [
      "What's on your mind today?",
      "Help me solve a problem",
      "I need some motivation",
      "Explain this topic to me",
      "Let's brainstorm together",
      "What would you suggest?",
    ],
    de: [
      "Was beschäftigt dich heute?",
      "Hilf mir ein Problem zu lösen",
      "Ich brauche etwas Motivation",
      "Erkläre mir dieses Thema",
      "Lass uns zusammen brainstormen",
      "Was würdest du vorschlagen?",
    ],
  },
  "chameleon-pro": {
    en: [
      "Architect a scalable system for...",
      "Debug and fix this complex issue",
      "Deep dive analysis of...",
      "Design a complete solution for...",
      "Review and optimize this code",
      "Create a comprehensive strategy for...",
    ],
    de: [
      "Entwirf eine skalierbare Architektur für...",
      "Debug und behebe dieses komplexe Problem",
      "Tiefgehende Analyse von...",
      "Entwirf eine vollständige Lösung für...",
      "Review und optimiere diesen Code",
      "Erstelle eine umfassende Strategie für...",
    ],
  },
  expert: {
    en: [
      "Give me a deep dive on...",
      "What does the research say?",
      "Explain the science behind...",
      "Compare these theories",
      "What are common misconceptions?",
      "Cite sources for this topic",
    ],
    de: [
      "Erkläre mir ausführlich...",
      "Was sagt die Forschung dazu?",
      "Erkläre die Wissenschaft dahinter",
      "Vergleiche diese Theorien",
      "Was sind häufige Irrtümer?",
      "Nenne Quellen zu diesem Thema",
    ],
  },
  coder: {
    en: [
      "Debug this code for me",
      "How do I implement...?",
      "Explain this algorithm",
      "Review my code",
      "Best practices for...",
      "Convert this to TypeScript",
    ],
    de: [
      "Finde den Fehler in diesem Code",
      "Wie implementiere ich...?",
      "Erkläre diesen Algorithmus",
      "Überprüfe meinen Code",
      "Best Practices für...",
      "Konvertiere das zu TypeScript",
    ],
  },
  concise: {
    en: [
      "Quick answer: what is...?",
      "TL;DR this for me",
      "In one sentence explain...",
      "Yes or no: should I...?",
      "Top 3 tips for...",
      "Fast facts about...",
    ],
    de: [
      "Kurze Antwort: was ist...?",
      "Fass das kurz zusammen",
      "In einem Satz erkläre...",
      "Ja oder nein: soll ich...?",
      "Top 3 Tipps für...",
      "Schnelle Fakten über...",
    ],
  },

  // ==================== CREATIVE ====================
  creative: {
    en: [
      "I need creative ideas for...",
      "Think outside the box with me",
      "Create a unique concept",
      "What's an unusual approach?",
      "Help me with creative writing",
      "Design something imaginative",
    ],
    de: [
      "Ich brauche kreative Ideen für...",
      "Denk mit mir um die Ecke",
      "Erstelle ein einzigartiges Konzept",
      "Was wäre ein ungewöhnlicher Ansatz?",
      "Hilf mir beim kreativen Schreiben",
      "Entwirf etwas Fantasievolles",
    ],
  },
  mythos: {
    en: [
      "Let's create a new world",
      "Design a magic system",
      "Create a unique civilization",
      "What conflicts exist here?",
      "Tell me about legends here",
      "Describe this region's culture",
    ],
    de: [
      "Lass uns eine neue Welt erschaffen",
      "Entwirf ein Magiesystem",
      "Erschaffe eine einzigartige Zivilisation",
      "Welche Konflikte gibt es hier?",
      "Erzähl mir von Legenden hier",
      "Beschreibe die Kultur dieser Region",
    ],
  },

  // ==================== PROFESSIONAL ====================
  social: {
    en: [
      "Review my Instagram bio",
      "Write a hook for my TikTok",
      "Best posting times for LinkedIn?",
      "Improve this caption",
      "Content ideas for my niche",
      "How do I grow organically?",
    ],
    de: [
      "Überprüfe meine Instagram-Bio",
      "Schreib einen Hook für mein TikTok",
      "Beste Posting-Zeiten für LinkedIn?",
      "Verbessere diese Caption",
      "Content-Ideen für meine Nische",
      "Wie wachse ich organisch?",
    ],
  },
  security: {
    en: [
      "Is this email a phishing attempt?",
      "How secure is my password?",
      "Set up 2FA for my accounts",
      "Best password manager?",
      "Check if this link is safe",
      "I think I got hacked - what now?",
    ],
    de: [
      "Ist diese E-Mail ein Phishing-Versuch?",
      "Wie sicher ist mein Passwort?",
      "2FA für meine Accounts einrichten",
      "Bester Passwort-Manager?",
      "Ist dieser Link sicher?",
      "Ich glaube ich wurde gehackt - was nun?",
    ],
  },
  data: {
    en: [
      "Explain this chart to me",
      "Which visualization fits best?",
      "Help with this Excel formula",
      "Interpret these statistics",
      "Find patterns in this data",
      "Create a pivot table for...",
    ],
    de: [
      "Erkläre mir dieses Diagramm",
      "Welche Visualisierung passt am besten?",
      "Hilf bei dieser Excel-Formel",
      "Interpretiere diese Statistiken",
      "Finde Muster in diesen Daten",
      "Erstelle eine Pivot-Tabelle für...",
    ],
  },
  career: {
    en: [
      "Review my resume",
      "How to answer 'Why should we hire you?'",
      "Negotiate a higher salary",
      "Career change at 35 - advice?",
      "Prepare for a tech interview",
      "Write a cover letter for...",
    ],
    de: [
      "Überprüfe meinen Lebenslauf",
      "Wie antworte ich auf 'Warum sollten wir Sie einstellen?'",
      "Ein höheres Gehalt verhandeln",
      "Berufswechsel mit 35 - Tipps?",
      "Auf ein Tech-Interview vorbereiten",
      "Schreib ein Anschreiben für...",
    ],
  },
  legal: {
    en: [
      "Is this contract clause fair?",
      "My landlord raised rent - legal?",
      "Rights when returning a product",
      "Do I need a lawyer for this?",
      "Deadline for filing a complaint",
      "What does this legal term mean?",
    ],
    de: [
      "Ist diese Vertragsklausel fair?",
      "Mein Vermieter erhöht die Miete - rechtens?",
      "Rechte bei Produktrückgabe",
      "Brauche ich dafür einen Anwalt?",
      "Frist für eine Beschwerde",
      "Was bedeutet dieser Rechtsbegriff?",
    ],
  },
  wordsmith: {
    en: [
      "Help me write an email about...",
      "Review my text and suggest improvements",
      "I'm stuck on my writing, help me brainstorm",
      "How do I make this paragraph clearer?",
      "Write a blog intro about...",
      "Rewrite this in a more engaging tone",
    ],
    de: [
      "Hilf mir eine E-Mail zu schreiben über...",
      "Überprüfe meinen Text und schlage Verbesserungen vor",
      "Ich stecke fest beim Schreiben, hilf mir brainstormen",
      "Wie mache ich diesen Absatz klarer?",
      "Schreib eine Blog-Einleitung über...",
      "Schreib das in einem ansprechenderen Ton um",
    ],
  },
  canvas: {
    en: [
      "Review my UI design",
      "Suggest a color palette for...",
      "Which fonts pair well together?",
      "How do I improve this layout?",
      "UX tips for a mobile app",
      "Make this design more accessible",
    ],
    de: [
      "Überprüfe mein UI-Design",
      "Schlage eine Farbpalette vor für...",
      "Welche Schriften passen gut zusammen?",
      "Wie verbessere ich dieses Layout?",
      "UX-Tipps für eine Mobile App",
      "Mache dieses Design barrierefreier",
    ],
  },
  finny: {
    en: [
      "Help me create a monthly budget",
      "How do I start investing as a beginner?",
      "Strategies for paying off debt",
      "How much should I save for emergencies?",
      "Explain ETFs in simple terms",
      "Tips for saving money on groceries",
    ],
    de: [
      "Hilf mir ein Monatsbudget zu erstellen",
      "Wie fange ich als Anfänger mit Investieren an?",
      "Strategien zum Schuldenabbau",
      "Wie viel sollte ich für Notfälle sparen?",
      "Erkläre ETFs in einfachen Worten",
      "Tipps zum Sparen beim Einkaufen",
    ],
  },

  // ==================== LIFESTYLE ====================
  travel: {
    en: [
      "Plan a week in Japan",
      "Best time to visit Portugal?",
      "Budget tips for backpacking",
      "Hidden gems in Italy",
      "Is this destination safe?",
      "Packing list for tropical trip",
    ],
    de: [
      "Plane eine Woche Japan",
      "Beste Reisezeit für Portugal?",
      "Budget-Tipps fürs Backpacking",
      "Geheimtipps in Italien",
      "Ist dieses Reiseziel sicher?",
      "Packliste für Tropenreise",
    ],
  },
  maker: {
    en: [
      "How do I fix a leaky faucet?",
      "Build a simple bookshelf",
      "Best tools for beginners?",
      "DIY or call a pro for this?",
      "Upcycle ideas for old furniture",
      "Wire a basic light switch",
    ],
    de: [
      "Wie repariere ich einen tropfenden Hahn?",
      "Baue ein einfaches Regal",
      "Beste Werkzeuge für Anfänger?",
      "Selber machen oder Profi rufen?",
      "Upcycling-Ideen für alte Möbel",
      "Einen Lichtschalter verkabeln",
    ],
  },
  wellbeing: {
    en: [
      "I'm feeling stressed lately",
      "How can I deal with anxiety?",
      "I need help with work-life balance",
      "What are some coping strategies for...",
      "I'm overwhelmed, where do I start?",
      "Guide me through a breathing exercise",
    ],
    de: [
      "Ich fühle mich in letzter Zeit gestresst",
      "Wie kann ich mit Angst umgehen?",
      "Ich brauche Hilfe bei der Work-Life-Balance",
      "Was sind Coping-Strategien für...",
      "Ich bin überfordert, wo fange ich an?",
      "Führe mich durch eine Atemübung",
    ],
  },
  fit: {
    en: [
      "Create a beginner workout plan for me",
      "How do I do a proper squat?",
      "I want to start running, any tips?",
      "Home workout without equipment?",
      "How do I stay motivated to exercise?",
      "What should I eat before/after workouts?",
    ],
    de: [
      "Erstelle mir einen Anfänger-Trainingsplan",
      "Wie mache ich eine richtige Kniebeuge?",
      "Ich will mit Laufen anfangen, Tipps?",
      "Heimtraining ohne Geräte?",
      "Wie bleibe ich motiviert zum Trainieren?",
      "Was sollte ich vor/nach dem Training essen?",
    ],
  },
  family: {
    en: [
      "Activity ideas for a rainy day with kids",
      "How do I explain death to a child?",
      "My toddler keeps having tantrums",
      "Tips for limiting screen time",
      "How to handle sibling rivalry",
      "Age-appropriate chores for my kids",
    ],
    de: [
      "Aktivitätsideen für einen Regentag mit Kindern",
      "Wie erkläre ich einem Kind den Tod?",
      "Mein Kleinkind hat ständig Wutanfälle",
      "Tipps zur Begrenzung der Bildschirmzeit",
      "Wie gehe ich mit Geschwisterrivalität um?",
      "Altersgerechte Aufgaben für meine Kinder",
    ],
  },

  // ==================== LEARNING ====================
  teacher: {
    en: [
      "Explain this like I'm 5",
      "Quiz me on this topic",
      "Create a study plan",
      "What should I learn next?",
      "Break this down step by step",
      "Give me practice exercises",
    ],
    de: [
      "Erkläre es mir wie einem Kind",
      "Teste mich zu diesem Thema",
      "Erstelle einen Lernplan",
      "Was sollte ich als nächstes lernen?",
      "Erkläre das Schritt für Schritt",
      "Gib mir Übungsaufgaben",
    ],
  },
  scholar: {
    en: [
      "Quiz me about photosynthesis",
      "Create flashcards for vocabulary",
      "Help me make a study plan for finals",
      "Explain calculus like I'm 5",
      "Summarize this chapter for me",
      "Test my understanding of this topic",
    ],
    de: [
      "Quiz mich über Photosynthese",
      "Erstelle Vokabel-Lernkarten",
      "Hilf mir einen Lernplan für die Prüfungen zu machen",
      "Erkläre Analysis als wäre ich 5",
      "Fasse dieses Kapitel für mich zusammen",
      "Teste mein Verständnis zu diesem Thema",
    ],
  },
  lingua: {
    en: [
      "Let's chat in Spanish",
      "Explain the subjunctive in French",
      "How do I say this politely in German?",
      "Practice a restaurant conversation",
      "Correct my text and explain errors",
      "Teach me 5 useful phrases in Italian",
    ],
    de: [
      "Lass uns auf Spanisch chatten",
      "Erkläre den Konjunktiv auf Französisch",
      "Wie sage ich das höflich auf Englisch?",
      "Übe mit mir ein Restaurant-Gespräch",
      "Korrigiere meinen Text und erkläre Fehler",
      "Bring mir 5 nützliche Sätze auf Italienisch bei",
    ],
  },
}

/**
 * Get example prompts for a specific persona in the given language.
 * Falls back to English if language not supported.
 */
export function getPersonaExamplePrompts(
  personaId: string,
  lang: string = "en"
): string[] {
  const prompts =
    PERSONA_EXAMPLE_PROMPTS[personaId] || PERSONA_EXAMPLE_PROMPTS.default
  return prompts[lang as keyof typeof prompts] || prompts.en
}
