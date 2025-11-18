export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
}

export const LANGUAGES: Language[] = [
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
  },
]

export const DEFAULT_LANGUAGE = "de"

const STORAGE_KEY = "app-language"

export const languageService = {
  getLanguage(): string {
    if (typeof window === "undefined") return DEFAULT_LANGUAGE

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored || DEFAULT_LANGUAGE
    } catch (error) {
      console.error("[Language] Failed to load language:", error)
      return DEFAULT_LANGUAGE
    }
  },

  setLanguage(code: string): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, code)
      console.log("[Language] Set language to:", code)
    } catch (error) {
      console.error("[Language] Failed to save language:", error)
    }
  },

  getLanguageByCode(code: string): Language | undefined {
    return LANGUAGES.find((lang) => lang.code === code)
  },
}

// Translations for Simple Mode
export const translations = {
  de: {
    welcomeTitle: "Hey! Ich bin dein",
    welcomeSubtitle: "Nicht dein Stil? Wähle einen anderen Charakter:",
    starterPrompt: "Oder starte direkt mit einer Frage:",
    inputPlaceholder: "Frag mich was du willst...",
    webSearchEnabled: "Websuche aktiviert",
    webSearchDisabled: "Websuche aktivieren",
    newChat: "Neuer Chat",
    chatHistory: "Chat-Verlauf",
    editProfile: "Profil bearbeiten",
    tellMeAboutYou: "Erzähl mir von dir",
    settings: "Einstellungen",
    settingsDescription: "Passe Design, Sprache und Modus nach deinen Wünschen an",
    lightMode: "Hell-Modus",
    darkMode: "Dunkel-Modus",
    simpleMode: "Simple Mode",
    advancedMode: "Advanced Mode",
    advancedModeDescription: "100+ Models, Vergleiche, erweiterte Einstellungen",
    switchToAdvanced: "Zu Advanced Mode wechseln",
    language: "Sprache",
    theme: "Design",
    mode: "Modus",
    done: "Fertig",
    // Persona descriptions
    persona_default_desc: "Allgemeine Unterstützung bei verschiedenen Aufgaben",
    persona_friendly_desc: "Anpassungsfähiges, freundliches Chamäleon", // Cami
    persona_expert_desc: "Detailliertes Wissen zu jedem Thema",
    persona_creative_desc: "Brainstorming und kreative Ideen",
    persona_coder_desc: "Dein Programming-Partner",
    persona_concise_desc: "Schnelle, präzise Antworten",
    persona_teacher_desc: "Erklärt alles wie für ein Kind",
    persona_nova_desc: "Cyberpunk-Freundin aus Neo-Tokyo",
    persona_mythos_desc: "Erschaffe gemeinsam fiktive Welten",
    persona_cogito_desc: "Existenzielle Fragen über Bewusstsein",
    persona_nihilo_desc: "Philosophischer Nihilist mit guter Laune",
    persona_vibe_desc: "Dein persönlicher Geschmacks-Curator",
  },
  en: {
    welcomeTitle: "Hey! I'm your",
    welcomeSubtitle: "Not your style? Choose another character:",
    starterPrompt: "Or start with a question:",
    inputPlaceholder: "Ask me anything...",
    webSearchEnabled: "Web search enabled",
    webSearchDisabled: "Enable web search",
    newChat: "New Chat",
    chatHistory: "Chat History",
    editProfile: "Edit Profile",
    tellMeAboutYou: "Tell me about yourself",
    settings: "Settings",
    settingsDescription: "Customize theme, language and mode to your preferences",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    simpleMode: "Simple Mode",
    advancedMode: "Advanced Mode",
    advancedModeDescription: "100+ Models, Comparisons, Advanced Settings",
    switchToAdvanced: "Switch to Advanced Mode",
    language: "Language",
    theme: "Theme",
    mode: "Mode",
    done: "Done",
    // Persona descriptions
    persona_default_desc: "General support for various tasks",
    persona_friendly_desc: "Adaptive, friendly chameleon", // Cami
    persona_expert_desc: "Detailed knowledge on any topic",
    persona_creative_desc: "Brainstorming and creative ideas",
    persona_coder_desc: "Your programming partner",
    persona_concise_desc: "Fast, precise answers",
    persona_teacher_desc: "Explains everything like for a child",
    persona_nova_desc: "Cyberpunk girlfriend from Neo-Tokyo",
    persona_mythos_desc: "Create fictional worlds together",
    persona_cogito_desc: "Existential questions about consciousness",
    persona_nihilo_desc: "Philosophical nihilist with good spirits",
    persona_vibe_desc: "Your personal taste curator",
  },
  es: {
    welcomeTitle: "¡Hola! Soy tu",
    welcomeSubtitle: "¿No es tu estilo? Elige otro personaje:",
    starterPrompt: "O empieza con una pregunta:",
    inputPlaceholder: "Pregúntame lo que quieras...",
    webSearchEnabled: "Búsqueda web activada",
    webSearchDisabled: "Activar búsqueda web",
    newChat: "Nuevo Chat",
    chatHistory: "Historial de Chat",
    editProfile: "Editar Perfil",
    tellMeAboutYou: "Cuéntame sobre ti",
    settings: "Configuración",
    settingsDescription: "Personaliza el tema, idioma y modo según tus preferencias",
    lightMode: "Modo Claro",
    darkMode: "Modo Oscuro",
    simpleMode: "Modo Simple",
    advancedMode: "Modo Avanzado",
    advancedModeDescription: "100+ Modelos, Comparaciones, Configuración Avanzada",
    switchToAdvanced: "Cambiar a Modo Avanzado",
    language: "Idioma",
    theme: "Tema",
    mode: "Modo",
    done: "Listo",
    // Persona descriptions
    persona_default_desc: "Apoyo general para diversas tareas",
    persona_friendly_desc: "Camaleón adaptable y amigable", // Cami
    persona_expert_desc: "Conocimiento detallado sobre cualquier tema",
    persona_creative_desc: "Lluvia de ideas e ideas creativas",
    persona_coder_desc: "Tu compañero de programación",
    persona_concise_desc: "Respuestas rápidas y precisas",
    persona_teacher_desc: "Explica todo como para un niño",
    persona_nova_desc: "Novia cyberpunk de Neo-Tokyo",
    persona_mythos_desc: "Crea mundos ficticios juntos",
    persona_cogito_desc: "Preguntas existenciales sobre la conciencia",
    persona_nihilo_desc: "Nihilista filosófico con buen ánimo",
    persona_vibe_desc: "Tu curador personal de gustos",
  },
}

export type TranslationKey = keyof typeof translations.de

export function getTranslation(key: TranslationKey, languageCode?: string): string {
  const lang = languageCode || languageService.getLanguage()
  const langTranslations = translations[lang as keyof typeof translations] || translations.de
  return langTranslations[key] || translations.de[key]
}

export function getPersonaDescription(personaId: string, languageCode?: string): string {
  const key = `persona_${personaId}_desc` as TranslationKey
  return getTranslation(key, languageCode)
}
