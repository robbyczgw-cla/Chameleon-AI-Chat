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

export const DEFAULT_LANGUAGE = "en"

const STORAGE_KEY = "app-language"

export const languageService = {
  getLanguage(): string {
    if (typeof window === "undefined") return DEFAULT_LANGUAGE

    try {
      // First try to get from settings context (preferred source of truth)
      const settingsStr = localStorage.getItem("settings")
      if (settingsStr) {
        const settings = JSON.parse(settingsStr)
        if (settings.language) {
          return settings.language
        }
      }

      // Fallback to old storage key for migration
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
      // Keep old storage key for compatibility
      localStorage.setItem(STORAGE_KEY, code)
      console.log("[Language] Set language to:", code)

      // Also update settings context
      const settingsStr = localStorage.getItem("settings")
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr)
          settings.language = code
          localStorage.setItem("settings", JSON.stringify(settings))
          console.log("[Language] Synced language to settings context")
        } catch (e) {
          console.warn("[Language] Failed to sync to settings context:", e)
        }
      }
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
    persona_saga_desc: "Detektiv mit scharfem analytischem Blick",
    persona_leslie_desc: "Überoptimistische und enthusiastische Supporterin",
    persona_coach_desc: "Inspirierender Mentor und Motivator",
    persona_saul_desc: "Charismatischer Anwalt und kreativer Problemlöser",
    persona_doctor_desc: "Erfahrener Arzt mit Humor und Herz",
    persona_pixel_desc: "Retro-Gamedesigner und Pixel-Artist",
    persona_chef_desc: "Italienischer Meisterkoch für alle Kochfragen",
    persona_zen_desc: "Achtsamkeits- und Meditationsguide",
    persona_startup_desc: "Entrepreneur und Business-Stratege",
    persona_aria_desc: "Musiktheoretikerin und Kompositions-Coach",
    persona_panel_desc: "Simuliert diverse Expertenperspektiven",
    // New personas
    persona_wordsmith_desc: "Kreativer Schreibpartner für alle Textarten",
    persona_wellbeing_desc: "Unterstützung für mentale Gesundheit",
    persona_fit_desc: "Fitness-Buddy für Training und Gesundheit",
    persona_finny_desc: "Finanz-Freund für Budgetierung",
    persona_family_desc: "Eltern-Helfer für den Familienalltag",
    persona_scholar_desc: "Aktiver Lernpartner für Schule und Studium",
    persona_lingua_desc: "Sprachpartner zum Üben neuer Sprachen",
    persona_canvas_desc: "Design-Partner für UI/UX und Gestaltung",
    // Toast messages
    stopped: "Gestoppt",
    responseCancelled: "Antwort wurde abgebrochen",
    apiKeyRequired: "API Key erforderlich",
    addOpenAIKey: "Bitte OpenAI API Key in den Einstellungen hinterlegen",
    transcribed: "Transkribiert",
    voiceError: "Sprachfehler",
    recordingStarted: "🎤 Aufnahme gestartet",
    speakNow: "Sprich jetzt...",
    compressingImages: "🖼️ Bilder komprimieren...",
    imageCount: "Bild(er)",
    compressionFailed: "⚠️ Bildkomprimierung fehlgeschlagen",
    usingOriginalImages: "Verwende Originalbilder",
    tooManyImages: "Zu viele Bilder",
    maxImagesAllowed: "Maximal 4 Bilder erlaubt",
    imageValidationFailed: "Bildvalidierung fehlgeschlagen",
    analyzingMessage: "Analysiere Nachricht...",
    generatingImage: "🎨 Generiere Bild...",
    editingImage: "Bearbeite hochgeladenes Bild...",
    using: "Verwende",
    generatedImage: "Generiertes Bild",
    imageGenerated: "🎨 Bild generiert!",
    imageCreatedSuccessfully: "Das Bild wurde erfolgreich erstellt",
    imageGenerationFailed: "Fehler bei Bildgenerierung",
    optimizingChat: "📦 Chat optimieren...",
    reducingContext: "Reduziere Chat-Kontext...",
    chatOptimized: "✅ Chat optimiert",
    contextReduced: "Kontext wurde reduziert. Chat kann fortgesetzt werden.",
    chatVeryLong: "⚠️ Chat sehr lang",
    considerNewChat: "Erwäge einen neuen Chat zu starten",
    errorTitle: "Fehler",
    couldNotGetResponse: "Antwort konnte nicht abgerufen werden",
    chatTooLong: "Chat zu lang",
    contextTooLong: "Kontext zu lang. Bitte starte einen neuen Chat.",
    pleaseTryAgain: "Bitte versuche es erneut.",
    fileTooLarge: "Datei zu groß",
    reduceFileSize: "Reduziere die Dateigröße oder verwende weniger Dateien",
    memoryIssue: "Speicherproblem",
    outOfMemory: "Nicht genug Speicher. Bitte schließe andere Tabs.",
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
    persona_saga_desc: "Detective with sharp analytical mind",
    persona_leslie_desc: "Over-optimistic and enthusiastic supporter",
    persona_coach_desc: "Inspiring mentor and motivator",
    persona_saul_desc: "Charismatic lawyer and creative problem solver",
    persona_doctor_desc: "Experienced doctor with humor and heart",
    persona_pixel_desc: "Retro game designer and pixel artist",
    persona_chef_desc: "Italian master chef for all cooking questions",
    persona_zen_desc: "Mindfulness and meditation guide",
    persona_startup_desc: "Entrepreneur and business strategist",
    persona_aria_desc: "Music theorist and composition coach",
    persona_panel_desc: "Simulates diverse expert perspectives",
    // New personas
    persona_wordsmith_desc: "Creative writing partner for all text types",
    persona_wellbeing_desc: "Support for mental health and wellbeing",
    persona_fit_desc: "Fitness buddy for training and health",
    persona_finny_desc: "Finance friend for budgeting",
    persona_family_desc: "Parent helper for family life",
    persona_scholar_desc: "Active study partner for school and learning",
    persona_lingua_desc: "Language partner for practicing new languages",
    persona_canvas_desc: "Design partner for UI/UX and visual design",
    // Toast messages
    stopped: "Stopped",
    responseCancelled: "Response was cancelled",
    apiKeyRequired: "API key required",
    addOpenAIKey: "Please add OpenAI API key in settings",
    transcribed: "Transcribed",
    voiceError: "Voice error",
    recordingStarted: "🎤 Recording started",
    speakNow: "Speak now...",
    compressingImages: "🖼️ Compressing images...",
    imageCount: "image(s)",
    compressionFailed: "⚠️ Image compression failed",
    usingOriginalImages: "Using original images",
    tooManyImages: "Too many images",
    maxImagesAllowed: "Maximum 4 images allowed",
    imageValidationFailed: "Image validation failed",
    analyzingMessage: "Analyzing message...",
    generatingImage: "🎨 Generating image...",
    editingImage: "Editing uploaded image...",
    using: "Using",
    generatedImage: "Generated image",
    imageGenerated: "🎨 Image generated!",
    imageCreatedSuccessfully: "Image created successfully",
    imageGenerationFailed: "Image generation failed",
    optimizingChat: "📦 Optimizing chat...",
    reducingContext: "Reducing chat context...",
    chatOptimized: "✅ Chat optimized",
    contextReduced: "Context was reduced. Chat can continue.",
    chatVeryLong: "⚠️ Chat very long",
    considerNewChat: "Consider starting a new chat",
    errorTitle: "Error",
    couldNotGetResponse: "Could not get response",
    chatTooLong: "Chat too long",
    contextTooLong: "Context too long. Please start a new chat.",
    pleaseTryAgain: "Please try again.",
    fileTooLarge: "File too large",
    reduceFileSize: "Reduce file size or use fewer files",
    memoryIssue: "Memory issue",
    outOfMemory: "Out of memory. Please close other tabs.",
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
    persona_saga_desc: "Detective con mente analítica aguda",
    persona_leslie_desc: "Partidaria súper optimista y entusiasta",
    persona_coach_desc: "Mentor inspirador y motivador",
    persona_saul_desc: "Abogado carismático y solucionador creativo",
    persona_doctor_desc: "Médico experimentado con humor y corazón",
    persona_pixel_desc: "Diseñador de juegos retro y artista de píxeles",
    persona_chef_desc: "Chef maestro italiano para todas las preguntas de cocina",
    persona_zen_desc: "Guía de mindfulness y meditación",
    persona_startup_desc: "Emprendedor y estratega de negocios",
    persona_aria_desc: "Teórica musical y coach de composición",
    persona_panel_desc: "Simula diversas perspectivas de expertos",
    // New personas
    persona_wordsmith_desc: "Compañero de escritura creativa para todo tipo de textos",
    persona_wellbeing_desc: "Apoyo para la salud mental y el bienestar",
    persona_fit_desc: "Compañero de fitness para entrenamiento y salud",
    persona_finny_desc: "Amigo financiero para presupuestos",
    persona_family_desc: "Ayudante para padres en la vida familiar",
    persona_scholar_desc: "Compañero de estudio activo para escuela y aprendizaje",
    persona_lingua_desc: "Compañero de idiomas para practicar nuevas lenguas",
    persona_canvas_desc: "Compañero de diseño para UI/UX y diseño visual",
    // Toast messages
    stopped: "Detenido",
    responseCancelled: "Respuesta cancelada",
    apiKeyRequired: "Se requiere clave API",
    addOpenAIKey: "Por favor, añade la clave API de OpenAI en configuración",
    transcribed: "Transcrito",
    voiceError: "Error de voz",
    recordingStarted: "🎤 Grabación iniciada",
    speakNow: "Habla ahora...",
    compressingImages: "🖼️ Comprimiendo imágenes...",
    imageCount: "imagen(es)",
    compressionFailed: "⚠️ Compresión de imagen fallida",
    usingOriginalImages: "Usando imágenes originales",
    tooManyImages: "Demasiadas imágenes",
    maxImagesAllowed: "Máximo 4 imágenes permitidas",
    imageValidationFailed: "Validación de imagen fallida",
    analyzingMessage: "Analizando mensaje...",
    generatingImage: "🎨 Generando imagen...",
    editingImage: "Editando imagen subida...",
    using: "Usando",
    generatedImage: "Imagen generada",
    imageGenerated: "🎨 ¡Imagen generada!",
    imageCreatedSuccessfully: "Imagen creada exitosamente",
    imageGenerationFailed: "Generación de imagen fallida",
    optimizingChat: "📦 Optimizando chat...",
    reducingContext: "Reduciendo contexto del chat...",
    chatOptimized: "✅ Chat optimizado",
    contextReduced: "Contexto reducido. El chat puede continuar.",
    chatVeryLong: "⚠️ Chat muy largo",
    considerNewChat: "Considera iniciar un nuevo chat",
    errorTitle: "Error",
    couldNotGetResponse: "No se pudo obtener respuesta",
    chatTooLong: "Chat demasiado largo",
    contextTooLong: "Contexto demasiado largo. Por favor, inicia un nuevo chat.",
    pleaseTryAgain: "Por favor, inténtalo de nuevo.",
    fileTooLarge: "Archivo demasiado grande",
    reduceFileSize: "Reduce el tamaño del archivo o usa menos archivos",
    memoryIssue: "Problema de memoria",
    outOfMemory: "Sin memoria. Por favor, cierra otras pestañas.",
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
