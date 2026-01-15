/**
 * Internationalization (i18n) for UI text
 * Supports English (en), German (de), and Spanish (es)
 */

export type Language = "en" | "de" | "es"

interface Translations {
  // Settings Dialog
  settings: {
    title: string
    general: string
    apiKeys: string
    systemPrompt: string
    systemPromptPlaceholder: string
    systemPromptHelp: string
    fontSize: string
    fontSizeSmall: string
    fontSizeMedium: string
    fontSizeLarge: string
    language: string
    languageEnglish: string
    languageGerman: string
    save: string
    cancel: string
  }

  // AI Memory System
  memory: {
    title: string
    subtitle: string
    disabled: string
    disabledDescription: string
    enableButton: string
    total: string
    preferences: string
    facts: string
    skills: string
    goals: string
    context: string
    howItWorks: string
    howItWorksDescription: string
    addNew: string
    content: string
    contentPlaceholder: string
    category: string
    categoryPlaceholder: string
    importance: string
    importanceLow: string
    importanceMedium: string
    importanceHigh: string
    saveMemory: string
    deleteConfirm: string
    noMemories: string
    usedTimes: string
    // Expiration/Deleted memories
    deleted: string
    noDeletedMemories: string
    deletedMemoriesInfo: string
    restore: string
    restored: string
    restoredDescription: string
    archived: string
    archivedDescription: string
    permanentDeleteConfirm: string
    permanentlyDeleted: string
    autoCleanup: string
    autoCleanupEnabled: string
    autoCleanupDisabled: string
    expiresIn: string
    autoExpired: string
    manuallyDeleted: string
    demotedExpired: string
  }

  // Advanced Settings
  advancedSettings: {
    title: string
    prompts: string
    models: string
    costTracking: string
    exportData: string
    systemPromptInstructions: string
  }

  // Labs / Experimental Settings
  labs: {
    // Warning banner
    warningTitle: string
    warningDescription: string

    // Default Model
    defaultModel: string
    defaultModelLabel: string
    defaultModelDescription: string
    defaultModelTip: string

    // Background AI Models
    backgroundModels: string
    backgroundModelsDescription: string
    textGenerationTasks: string
    titleGeneration: string
    titleGenerationDesc: string
    memoryExtraction: string
    memoryExtractionDesc: string
    queryClassification: string
    queryClassificationDesc: string
    promptHelper: string
    promptHelperDesc: string
    personaGeneration: string
    personaGenerationDesc: string
    personalityAnalysis: string
    personalityAnalysisDesc: string
    conversationInsights: string
    conversationInsightsDesc: string
    contextCompression: string
    contextCompressionDesc: string
    followUpPrimary: string
    followUpPrimaryDesc: string
    followUpFallback: string
    followUpFallbackDesc: string
    imageGenerationTasks: string
    imageGenNormal: string
    imageGenNormalDesc: string
    imageGenHigh: string
    imageGenHighDesc: string
    embeddingTasks: string
    memoryEmbeddings: string
    memoryEmbeddingsDesc: string
    backgroundModelsNote: string

    // Response Analysis
    responseAnalysis: string
    enableResponseAnalysis: string
    enableResponseAnalysisDesc: string
    responseAnalysisNote: string

    // Emotion Detection
    emotionDetection: string
    camiEmotionAwareness: string
    emotionDetectionDesc: string
    emotionDetectionDescSimple: string
    emotionDetectionDescAdvanced: string
    howItWorks: string
    emotionFrustrated: string
    emotionExcited: string
    emotionConfused: string
    emotionDiscouraged: string
    emotionUrgent: string

    // Performance Mode
    performanceMode: string
    enableAnimations: string
    enableAnimationsDesc: string
    ultraPerformanceMode: string
    ultraPerformanceModeDesc: string
    disabledEffects: string

    // Message Statistics
    messageStatistics: string
    showDetailedStats: string
    showDetailedStatsDesc: string
    statsSectionsToShow: string
    reasoning: string
    cache: string
    nativeTokens: string
    performance: string
    generation: string
    search: string
    efficiency: string
    autoExpandSections: string
    statsTip: string
    showInputStats: string
    showInputStatsDesc: string
    inputStatsShows: string

    // AI Tools
    aiTools: string
    aiToolsDescription: string
    urlFetchTool: string
    urlFetchToolDesc: string
    youtubeTool: string
    youtubeToolDesc: string
    weatherTool: string
    weatherToolDesc: string
    autoContextCompression: string
    autoContextCompressionDesc: string
    aiToolsNote: string

    // Agent Mode
    agentMode: string
    agentModeDescription: string
    maxToolCalls: string
    maxToolCallsDesc: string
    maxToolCallsNote: string
    showTaskPlan: string
    showTaskPlanDesc: string
    agentModeTip: string

    // Rich Content
    richContent: string
    richContentDescription: string
    mermaidDiagrams: string
    mermaidDiagramsDesc: string
    codeSyntax: string
    codeSyntaxDesc: string
    liveCodeSandbox: string
    liveCodeSandboxDesc: string
    dedicatedFollowUp: string
    dedicatedFollowUpDesc: string
    categorizedFollowUps: string
    categorizedFollowUpsDesc: string
    alwaysEnabled: string

    // Memory Intelligence
    memoryIntelligence: string
    memoryIntelligenceDesc: string
    semanticSearch: string
    semanticSearchDesc: string
    alwaysRetrievePersonas: string
    alwaysRetrievePersonasDesc: string
    classificationConfidence: string
    classificationConfidenceDesc: string
    classificationConfidenceTip: string
    similarityThreshold: string
    similarityThresholdDesc: string
    similarityThresholdTip: string
    minRelevanceScore: string
    minRelevanceScoreDesc: string
    minRelevanceScoreTip: string
    selfRagExplanation: string
    selfRagStep1: string
    selfRagStep2: string
    selfRagStep3: string
    selfRagStep4: string

    // Streaming Visualization
    streamingVisualization: string
    streamingVisualizationDesc: string
    detailedStreaming: string
    detailedStreamingDesc: string
    defaultStreamingNote: string
    fineTuneStreaming: string
  }

  // Chat Header
  chatHeader: {
    profile: string
    memory: string
    settings: string
    lightMode: string
    darkMode: string
    tune: string
    share: string
    toggleSidebar: string
  }

  // Chat Input
  chatInput: {
    placeholder: string
    searchPlaceholder: string
    send: string
    searching: string
    searchComplete: string
  }

  // Personas
  personas: {
    selectPersona: string
    noPersona: string
  }

  // Common
  common: {
    loading: string
    error: string
    success: string
    delete: string
    edit: string
    create: string
    update: string
    close: string
    and: string
    results: string
    images: string
    via: string
  }
}

const translations: Record<Language, Translations> = {
  en: {
    settings: {
      title: "Settings",
      general: "General",
      apiKeys: "API Keys",
      systemPrompt: "System Prompt",
      systemPromptPlaceholder: "You are a helpful AI assistant.",
      systemPromptHelp: "Advanced parameters (Temperature, Max Tokens) can be adjusted per model in the Model Selector.",
      fontSize: "Font Size",
      fontSizeSmall: "Small",
      fontSizeMedium: "Medium",
      fontSizeLarge: "Large",
      language: "Language",
      languageEnglish: "English",
      languageGerman: "German",
      save: "Save",
      cancel: "Cancel",
    },
    memory: {
      title: "AI Memory System",
      subtitle: "Intelligent long-term memory for your conversations",
      disabled: "Memory System is disabled",
      disabledDescription: "Enable the system to save important information about you and use it in future chats",
      enableButton: "Enable now",
      total: "Total",
      preferences: "Preferences",
      facts: "Facts",
      skills: "Skills",
      goals: "Goals",
      context: "Context",
      howItWorks: "How does it work?",
      howItWorksDescription: "Conversation Insights → saves important facts automatically • Personality Analysis → creates preference memories • Prompt Evolution → tracks your skills • Knowledge Base → uses memories for better search",
      addNew: "Add new",
      content: "Content",
      contentPlaceholder: "e.g. 'Prefers Dark Mode' or 'Works as a Developer'",
      category: "Category (optional)",
      categoryPlaceholder: "e.g. 'UI/UX'",
      importance: "Importance",
      importanceLow: "Low",
      importanceMedium: "Medium",
      importanceHigh: "High",
      saveMemory: "Save",
      deleteConfirm: "Really delete memory?",
      noMemories: "No memories available",
      usedTimes: "times used",
      // Expiration/Deleted memories
      deleted: "Deleted",
      noDeletedMemories: "No deleted memories",
      deletedMemoriesInfo: "Deleted memories can be restored here for up to 2 weeks.",
      restore: "Restore",
      restored: "Memory restored",
      restoredDescription: "The memory has been restored to your active memories.",
      archived: "Memory archived",
      archivedDescription: "You can restore it from the Deleted tab within 2 weeks.",
      permanentDeleteConfirm: "Permanently delete this memory? This cannot be undone.",
      permanentlyDeleted: "Memory permanently deleted",
      autoCleanup: "Auto-Cleanup",
      autoCleanupEnabled: "Unused memories are archived after 7 days. High-importance memories get demoted first.",
      autoCleanupDisabled: "Memories persist indefinitely until manually deleted.",
      expiresIn: "left",
      autoExpired: "Auto-expired",
      manuallyDeleted: "Manually deleted",
      demotedExpired: "Demoted & expired",
    },
    advancedSettings: {
      title: "Advanced Settings",
      prompts: "Prompts",
      models: "Models",
      costTracking: "Cost Tracking",
      exportData: "Export Data",
      systemPromptInstructions: "Instructions that guide the model's behavior and personality.",
    },
    labs: {
      // Warning banner
      warningTitle: "Experimental Features",
      warningDescription: "These features are experimental and may change or be removed in future updates. Use at your own discretion.",

      // Default Model
      defaultModel: "Default Model",
      defaultModelLabel: "Default Model for New Chats",
      defaultModelDescription: "Choose your preferred model for new conversations. System default: google/gemini-3-flash-preview",
      defaultModelTip: "Add more models to this list from the Model Management dialog (model icon in chat header). Your custom default is saved and synced across sessions.",

      // Background AI Models
      backgroundModels: "Background AI Models",
      backgroundModelsDescription: "Configure which models are used for background tasks. These run automatically without user interaction. Select from your available models or keep the defaults.",
      textGenerationTasks: "Text Generation Tasks",
      titleGeneration: "Chat Title Generation",
      titleGenerationDesc: "Generates titles for new conversations",
      memoryExtraction: "Memory Extraction",
      memoryExtractionDesc: "Extracts memories from conversations",
      queryClassification: "Query Classification",
      queryClassificationDesc: "Classifies if queries need memory context",
      promptHelper: "Prompt Helper / Improvement",
      promptHelperDesc: "Improves user prompts using AI",
      personaGeneration: "Persona Personality Generation",
      personaGenerationDesc: "Generates AI persona personalities",
      personalityAnalysis: "Personality Analysis",
      personalityAnalysisDesc: "Analyzes user communication patterns",
      conversationInsights: "Conversation Insights",
      conversationInsightsDesc: "Extracts summaries and key points",
      contextCompression: "Context Compression",
      contextCompressionDesc: "Summarizes conversation history",
      followUpPrimary: "Follow-Up Generation (Primary) ⚡ NEW",
      followUpPrimaryDesc: "Primary model for contextual follow-up questions",
      followUpFallback: "Follow-Up Generation (Fallback) ⚡ NEW",
      followUpFallbackDesc: "Fallback model if primary fails",
      imageGenerationTasks: "Image Generation Tasks",
      imageGenNormal: "Image Generation (Normal Quality)",
      imageGenNormalDesc: "Fast image generation for avatars",
      imageGenHigh: "Image Generation (High Quality)",
      imageGenHighDesc: "High-quality image generation",
      embeddingTasks: "Embedding Tasks",
      memoryEmbeddings: "Memory Embeddings",
      memoryEmbeddingsDesc: "Generates vector embeddings for semantic search",
      backgroundModelsNote: "Background models run automatically for various tasks. Default models are optimized for cost and speed. Only change if you need specific capabilities. Models must support the task type (e.g., embeddings need embedding models).",

      // Response Analysis
      responseAnalysis: "Response Analysis",
      enableResponseAnalysis: "Enable Response Analysis",
      enableResponseAnalysisDesc: "Analyze AI responses for sentiment, confidence, complexity, and more",
      responseAnalysisNote: "Response analysis shows sentiment, confidence level, hedging phrases, complexity, reading time, and tone for each AI response.",

      // Emotion Detection
      emotionDetection: "Emotion Detection",
      camiEmotionAwareness: "🦎 Cami Emotion Awareness",
      emotionDetectionDesc: "Detect user emotions (frustration, excitement, confusion, sarcasm) and adapt responses accordingly.",
      emotionDetectionDescSimple: "Default: ON in Simple Mode",
      emotionDetectionDescAdvanced: "Default: OFF in Advanced Mode",
      howItWorks: "How it works:",
      emotionFrustrated: "Frustrated/Sarcastic: Empathetic acknowledgment, then direct help",
      emotionExcited: "Excited: Matches your energy and enthusiasm",
      emotionConfused: "Confused: Simpler explanations, step-by-step, more examples",
      emotionDiscouraged: "Discouraged: Encouraging tone, breaks problems into smaller steps",
      emotionUrgent: "Urgent: Direct answers, skips pleasantries",

      // Performance Mode
      performanceMode: "Performance Mode",
      enableAnimations: "Enable Animations",
      enableAnimationsDesc: "Show animated loading indicators (e.g. \"Analyzing your message\" blinking icon)",
      ultraPerformanceMode: "Ultra Performance Mode",
      ultraPerformanceModeDesc: "Disable GPU-intensive visual effects for maximum performance",
      disabledEffects: "Disabled effects: Chameleon logo color-shift, memory icon pulse, avatar glows, background animations, and other GPU-intensive visual effects. GPU usage should be minimal.",

      // Message Statistics
      messageStatistics: "Message Statistics",
      showDetailedStats: "💰 Show Detailed Message Stats",
      showDetailedStatsDesc: "Display stats after each AI message: exact costs, tokens, performance metrics (Advanced Mode, all platforms)",
      statsSectionsToShow: "Stats Sections to Show:",
      reasoning: "🧠 Reasoning",
      cache: "💾 Cache",
      nativeTokens: "📏 Native Tokens",
      performance: "⚡ Performance",
      generation: "🎛️ Generation",
      search: "🔍 Search",
      efficiency: "📈 Efficiency",
      autoExpandSections: "Auto-expand sections:",
      statsTip: "Click section headers in stats to expand/collapse. Sections are hidden if they have no data. Toggle sections here to completely hide them.",
      showInputStats: "Show Input Stats (Before Sending)",
      showInputStatsDesc: "Display token count and estimated cost below the chat input before sending (desktop only)",
      inputStatsShows: "Shows: Character count, estimated tokens, estimated cost per message, and context window usage meter below chat input.",

      // AI Tools
      aiTools: "AI Tools",
      aiToolsDescription: "Enable additional tools that the AI can use when Auto Tool Use is enabled. The AI will decide when to use these tools based on your questions.",
      urlFetchTool: "URL Fetch Tool",
      urlFetchToolDesc: "Allow AI to fetch and read content from specific URLs you mention. Useful for analyzing articles, documentation, or web pages.",
      youtubeTool: "YouTube Transcript Tool",
      youtubeToolDesc: "Allow AI to extract and read transcripts from YouTube videos. Great for summarizing videos or answering questions about video content.",
      weatherTool: "Weather Tool",
      weatherToolDesc: "Allow AI to get current weather conditions, forecasts, and air quality. Requires WEATHER_API_KEY environment variable.",
      autoContextCompression: "Auto Context Compression",
      autoContextCompressionDesc: "Automatically summarize older messages when chat gets long. Allows unlimited conversation length without hitting context limits.",
      aiToolsNote: "These tools require Auto Tool Use to be enabled in Search settings. The AI will automatically decide when to use them based on your questions. Weather tool requires WEATHER_API_KEY environment variable; other tools need no additional API keys.",

      // Agent Mode
      agentMode: "Agent Mode",
      agentModeDescription: "Use the 🤖 button in chat to enable Agent Mode. When active, AI can make more tool calls and shows its task planning.",
      maxToolCalls: "Maximum Tool Calls",
      maxToolCallsDesc: "How many tool calls AI can make per request (normal mode: 3)",
      maxToolCallsNote: "Higher = more thorough research but higher cost. 10 is recommended.",
      showTaskPlan: "Show Task Plan",
      showTaskPlanDesc: "Display AI's planned subtasks before execution",
      agentModeTip: "💡 Best for research, comparisons, and multi-step tasks. Simple questions don't need Agent Mode.",

      // Rich Content
      richContent: "Rich Content Rendering",
      richContentDescription: "Control how AI responses display special content. Polls, timelines, tables, and math are always enabled. These features can be performance-intensive.",
      mermaidDiagrams: "Mermaid Diagrams",
      mermaidDiagramsDesc: "Render flowcharts, sequence diagrams, and other Mermaid diagrams. Uses GPU for rendering.",
      codeSyntax: "Code Syntax Highlighting",
      codeSyntaxDesc: "Show code blocks with syntax highlighting and copy button. Loads ~100KB extra bundle.",
      liveCodeSandbox: "Live Code Sandbox ⚡ NEW",
      liveCodeSandboxDesc: "Run React, HTML, and Vue code directly in chat. Adds \"Run\" button to code blocks. Auto-enables syntax highlighting. Loads ~300KB on first use, runs client-side.",
      dedicatedFollowUp: "Dedicated Follow-Up Model ⚡ NEW",
      dedicatedFollowUpDesc: "Use dedicated fast model for follow-up suggestions (parallel generation, 60% faster, 40x cheaper). Enabled by default.",
      categorizedFollowUps: "Categorized Follow-up Suggestions",
      categorizedFollowUpsDesc: "Show category labels (Quick/Deep Dive/Related) for follow-up suggestions. Default: minimalistic view.",
      alwaysEnabled: "Always enabled: Polls, timelines, progress bars, comparison cards, sortable tables, and LaTeX math rendering. Toggle the above for performance-heavy features.",

      // Memory Intelligence
      memoryIntelligence: "Memory Intelligence",
      memoryIntelligenceDesc: "Fine-tune how the AI decides when and what memories to retrieve",
      semanticSearch: "Semantic Search",
      semanticSearchDesc: "Use AI embeddings to find memories by meaning (recommended)",
      alwaysRetrievePersonas: "Always Retrieve for Personas",
      alwaysRetrievePersonasDesc: "Bypass query classification when chatting with personas",
      classificationConfidence: "Classification Confidence",
      classificationConfidenceDesc: "Skip memory retrieval when classifier confidence exceeds this threshold",
      classificationConfidenceTip: "Lower = skip more queries (fewer memories injected). Higher = inject memories more often. Tip: 70% is optimal. Above 85% causes over-retrieval.",
      similarityThreshold: "Similarity Threshold",
      similarityThresholdDesc: "Minimum semantic similarity to include a memory",
      similarityThresholdTip: "Lower = more memories (may include less relevant). Higher = fewer but more relevant. Tip: 65% provides good quality. Below 50% causes noise.",
      minRelevanceScore: "Minimum Relevance Score",
      minRelevanceScoreDesc: "Skip ALL memories if best match is below this (safety net)",
      minRelevanceScoreTip: "This is your safety net - if no memory is relevant enough, inject nothing. Tip: 45% is optimal. Below 30% lets irrelevant memories through.",
      selfRagExplanation: "How it works (Self-RAG inspired):",
      selfRagStep1: "AI classifies your query: factual (skip memory), personal (retrieve), or ambiguous (skip by default)",
      selfRagStep2: "If retrieval needed: search memories by semantic similarity + recency + importance",
      selfRagStep3: "Only memories above similarity threshold are considered",
      selfRagStep4: "If best match is below min relevance, nothing is injected (safety net)",

      // Streaming Visualization
      streamingVisualization: "Streaming Visualization",
      streamingVisualizationDesc: "Advanced Mode only - Control what you see during AI responses",
      detailedStreaming: "Detailed Streaming Mode",
      detailedStreamingDesc: "Show full step-by-step progress with phases, sub-steps, timer, and progress bar. When off, only shows current action and reasoning tokens.",
      defaultStreamingNote: "Default: Shows only the current action (search, URL fetch, etc.) and reasoning tokens as they stream in. Enable detailed mode to see the full visualization with all phases and timing information.",
      fineTuneStreaming: "Fine-tune detailed streaming visualization:",
    },
    chatHeader: {
      profile: "Profile",
      memory: "Memory System",
      settings: "Settings",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      tune: "Tune",
      share: "Share",
      toggleSidebar: "Toggle Sidebar",
    },
    chatInput: {
      placeholder: "Message...",
      searchPlaceholder: "Search query for web results",
      send: "Send",
      searching: "Searching...",
      searchComplete: "Search complete",
    },
    personas: {
      selectPersona: "Select Persona",
      noPersona: "No Persona",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      update: "Update",
      close: "Close",
      and: "and",
      results: "results",
      images: "images",
      via: "via",
    },
  },
  de: {
    settings: {
      title: "Einstellungen",
      general: "Allgemein",
      apiKeys: "API-Schlüssel",
      systemPrompt: "System-Prompt",
      systemPromptPlaceholder: "Du bist ein hilfreicher KI-Assistent.",
      systemPromptHelp: "Erweiterte Parameter (Temperature, Max Tokens) können pro Modell im Model Selector angepasst werden.",
      fontSize: "Schriftgröße",
      fontSizeSmall: "Klein",
      fontSizeMedium: "Mittel",
      fontSizeLarge: "Groß",
      language: "Sprache",
      languageEnglish: "Englisch",
      languageGerman: "Deutsch",
      save: "Speichern",
      cancel: "Abbrechen",
    },
    memory: {
      title: "AI Memory System",
      subtitle: "Intelligentes Langzeit-Gedächtnis für deine Konversationen",
      disabled: "Memory System ist deaktiviert",
      disabledDescription: "Aktiviere das System, um wichtige Informationen über dich zu speichern und in zukünftigen Chats zu nutzen",
      enableButton: "Jetzt aktivieren",
      total: "Gesamt",
      preferences: "Präferenzen",
      facts: "Fakten",
      skills: "Skills",
      goals: "Ziele",
      context: "Kontext",
      howItWorks: "Wie funktioniert es?",
      howItWorksDescription: "Conversation Insights → speichert wichtige Fakten automatisch • Personality Analysis → erstellt Präferenz-Memories • Prompt Evolution → trackt deine Skills • Knowledge Base → nutzt Memories für bessere Suche",
      addNew: "Neue",
      content: "Inhalt",
      contentPlaceholder: "z.B. 'Bevorzugt Dark Mode' oder 'Arbeitet als Entwickler'",
      category: "Kategorie (optional)",
      categoryPlaceholder: "z.B. 'UI/UX'",
      importance: "Wichtigkeit",
      importanceLow: "Niedrig",
      importanceMedium: "Mittel",
      importanceHigh: "Hoch",
      saveMemory: "Speichern",
      deleteConfirm: "Memory wirklich löschen?",
      noMemories: "Keine Memories vorhanden",
      usedTimes: "mal verwendet",
      // Expiration/Deleted memories
      deleted: "Gelöscht",
      noDeletedMemories: "Keine gelöschten Memories",
      deletedMemoriesInfo: "Gelöschte Memories können hier innerhalb von 2 Wochen wiederhergestellt werden.",
      restore: "Wiederherstellen",
      restored: "Memory wiederhergestellt",
      restoredDescription: "Die Memory wurde zu deinen aktiven Memories wiederhergestellt.",
      archived: "Memory archiviert",
      archivedDescription: "Du kannst sie innerhalb von 2 Wochen im Tab 'Gelöscht' wiederherstellen.",
      permanentDeleteConfirm: "Memory endgültig löschen? Dies kann nicht rückgängig gemacht werden.",
      permanentlyDeleted: "Memory endgültig gelöscht",
      autoCleanup: "Auto-Bereinigung",
      autoCleanupEnabled: "Ungenutzte Memories werden nach 7 Tagen archiviert. Hochpriorisierte Memories werden zuerst herabgestuft.",
      autoCleanupDisabled: "Memories bleiben unbegrenzt erhalten, bis sie manuell gelöscht werden.",
      expiresIn: "verbleibend",
      autoExpired: "Automatisch abgelaufen",
      manuallyDeleted: "Manuell gelöscht",
      demotedExpired: "Herabgestuft & abgelaufen",
    },
    advancedSettings: {
      title: "Erweiterte Einstellungen",
      prompts: "Prompts",
      models: "Modelle",
      costTracking: "Kostenverfolgung",
      exportData: "Daten exportieren",
      systemPromptInstructions: "Anweisungen, die das Verhalten und die Persönlichkeit des Modells steuern.",
    },
    labs: {
      // Warning banner
      warningTitle: "Experimentelle Funktionen",
      warningDescription: "Diese Funktionen sind experimentell und können sich in zukünftigen Updates ändern oder entfernt werden. Nutzung auf eigene Gefahr.",

      // Default Model
      defaultModel: "Standard-Modell",
      defaultModelLabel: "Standard-Modell für neue Chats",
      defaultModelDescription: "Wähle dein bevorzugtes Modell für neue Konversationen. System-Standard: google/gemini-3-flash-preview",
      defaultModelTip: "Füge weitere Modelle über den Modell-Manager hinzu (Modell-Symbol im Chat-Header). Dein Standard wird gespeichert und synchronisiert.",

      // Background AI Models
      backgroundModels: "Hintergrund-KI-Modelle",
      backgroundModelsDescription: "Konfiguriere welche Modelle für Hintergrundaufgaben verwendet werden. Diese laufen automatisch ohne Benutzerinteraktion. Wähle aus deinen verfügbaren Modellen oder behalte die Standards.",
      textGenerationTasks: "Textgenerierungs-Aufgaben",
      titleGeneration: "Chat-Titel-Generierung",
      titleGenerationDesc: "Generiert Titel für neue Konversationen",
      memoryExtraction: "Memory-Extraktion",
      memoryExtractionDesc: "Extrahiert Erinnerungen aus Konversationen",
      queryClassification: "Anfrage-Klassifizierung",
      queryClassificationDesc: "Klassifiziert ob Anfragen Memory-Kontext benötigen",
      promptHelper: "Prompt-Helfer / Verbesserung",
      promptHelperDesc: "Verbessert Benutzer-Prompts mit KI",
      personaGeneration: "Persona-Persönlichkeits-Generierung",
      personaGenerationDesc: "Generiert KI-Persona-Persönlichkeiten",
      personalityAnalysis: "Persönlichkeits-Analyse",
      personalityAnalysisDesc: "Analysiert Benutzer-Kommunikationsmuster",
      conversationInsights: "Konversations-Einblicke",
      conversationInsightsDesc: "Extrahiert Zusammenfassungen und Kernpunkte",
      contextCompression: "Kontext-Komprimierung",
      contextCompressionDesc: "Fasst Konversationsverlauf zusammen",
      followUpPrimary: "Folgefragen-Generierung (Primär) ⚡ NEU",
      followUpPrimaryDesc: "Primäres Modell für kontextuelle Folgefragen",
      followUpFallback: "Folgefragen-Generierung (Fallback) ⚡ NEU",
      followUpFallbackDesc: "Fallback-Modell wenn primäres fehlschlägt",
      imageGenerationTasks: "Bildgenerierungs-Aufgaben",
      imageGenNormal: "Bildgenerierung (Normale Qualität)",
      imageGenNormalDesc: "Schnelle Bildgenerierung für Avatare",
      imageGenHigh: "Bildgenerierung (Hohe Qualität)",
      imageGenHighDesc: "Hochwertige Bildgenerierung",
      embeddingTasks: "Embedding-Aufgaben",
      memoryEmbeddings: "Memory-Embeddings",
      memoryEmbeddingsDesc: "Generiert Vektor-Embeddings für semantische Suche",
      backgroundModelsNote: "Hintergrund-Modelle laufen automatisch für verschiedene Aufgaben. Standard-Modelle sind für Kosten und Geschwindigkeit optimiert. Nur ändern wenn spezifische Fähigkeiten benötigt werden. Modelle müssen den Aufgabentyp unterstützen (z.B. Embeddings benötigen Embedding-Modelle).",

      // Response Analysis
      responseAnalysis: "Antwort-Analyse",
      enableResponseAnalysis: "Antwort-Analyse aktivieren",
      enableResponseAnalysisDesc: "Analysiere KI-Antworten auf Stimmung, Konfidenz, Komplexität und mehr",
      responseAnalysisNote: "Antwort-Analyse zeigt Stimmung, Konfidenz-Level, Hedging-Phrasen, Komplexität, Lesezeit und Ton für jede KI-Antwort.",

      // Emotion Detection
      emotionDetection: "Emotions-Erkennung",
      camiEmotionAwareness: "🦎 Cami Emotions-Bewusstsein",
      emotionDetectionDesc: "Erkenne Benutzer-Emotionen (Frustration, Aufregung, Verwirrung, Sarkasmus) und passe Antworten entsprechend an.",
      emotionDetectionDescSimple: "Standard: AN im Simple Mode",
      emotionDetectionDescAdvanced: "Standard: AUS im Advanced Mode",
      howItWorks: "So funktioniert es:",
      emotionFrustrated: "Frustriert/Sarkastisch: Empathische Anerkennung, dann direkte Hilfe",
      emotionExcited: "Aufgeregt: Passt sich deiner Energie und Begeisterung an",
      emotionConfused: "Verwirrt: Einfachere Erklärungen, Schritt-für-Schritt, mehr Beispiele",
      emotionDiscouraged: "Entmutigt: Ermutigender Ton, teilt Probleme in kleinere Schritte",
      emotionUrgent: "Dringend: Direkte Antworten, überspringt Höflichkeiten",

      // Performance Mode
      performanceMode: "Performance-Modus",
      enableAnimations: "Animationen aktivieren",
      enableAnimationsDesc: "Zeige animierte Lade-Indikatoren (z.B. \"Analysiere deine Nachricht\" blinkendes Symbol)",
      ultraPerformanceMode: "Ultra-Performance-Modus",
      ultraPerformanceModeDesc: "Deaktiviere GPU-intensive visuelle Effekte für maximale Performance",
      disabledEffects: "Deaktivierte Effekte: Chamäleon-Logo Farbwechsel, Memory-Icon Puls, Avatar-Glühen, Hintergrund-Animationen und andere GPU-intensive visuelle Effekte. GPU-Nutzung sollte minimal sein.",

      // Message Statistics
      messageStatistics: "Nachrichten-Statistiken",
      showDetailedStats: "💰 Detaillierte Nachrichten-Stats anzeigen",
      showDetailedStatsDesc: "Zeige Stats nach jeder KI-Nachricht: genaue Kosten, Tokens, Performance-Metriken (Advanced Mode, alle Plattformen)",
      statsSectionsToShow: "Anzuzeigende Stats-Bereiche:",
      reasoning: "🧠 Reasoning",
      cache: "💾 Cache",
      nativeTokens: "📏 Native Tokens",
      performance: "⚡ Performance",
      generation: "🎛️ Generierung",
      search: "🔍 Suche",
      efficiency: "📈 Effizienz",
      autoExpandSections: "Bereiche automatisch erweitern:",
      statsTip: "Klicke auf Bereichs-Header in Stats zum Erweitern/Zuklappen. Bereiche werden ausgeblendet wenn keine Daten vorhanden. Schalte Bereiche hier um sie komplett auszublenden.",
      showInputStats: "Input-Stats anzeigen (vor dem Senden)",
      showInputStatsDesc: "Zeige Token-Anzahl und geschätzte Kosten unter dem Chat-Input vor dem Senden (nur Desktop)",
      inputStatsShows: "Zeigt: Zeichenanzahl, geschätzte Tokens, geschätzte Kosten pro Nachricht und Kontext-Fenster-Nutzungsanzeige unter dem Chat-Input.",

      // AI Tools
      aiTools: "KI-Tools",
      aiToolsDescription: "Aktiviere zusätzliche Tools die die KI nutzen kann wenn Auto Tool Use aktiviert ist. Die KI entscheidet basierend auf deinen Fragen wann sie diese Tools verwendet.",
      urlFetchTool: "URL-Abruf-Tool",
      urlFetchToolDesc: "Erlaube KI Inhalte von bestimmten URLs abzurufen und zu lesen. Nützlich für die Analyse von Artikeln, Dokumentation oder Webseiten.",
      youtubeTool: "YouTube-Transkript-Tool",
      youtubeToolDesc: "Erlaube KI Transkripte von YouTube-Videos zu extrahieren und zu lesen. Ideal zum Zusammenfassen von Videos oder Beantworten von Fragen zum Video-Inhalt.",
      weatherTool: "Wetter-Tool",
      weatherToolDesc: "Erlaube KI aktuelle Wetterbedingungen, Vorhersagen und Luftqualität abzurufen. Erfordert WEATHER_API_KEY Umgebungsvariable.",
      autoContextCompression: "Auto-Kontext-Komprimierung",
      autoContextCompressionDesc: "Fasse ältere Nachrichten automatisch zusammen wenn Chat lang wird. Ermöglicht unbegrenzte Konversationslänge ohne Kontext-Limits.",
      aiToolsNote: "Diese Tools erfordern dass Auto Tool Use in den Such-Einstellungen aktiviert ist. Die KI entscheidet automatisch wann sie diese basierend auf deinen Fragen verwendet. Wetter-Tool erfordert WEATHER_API_KEY; andere Tools benötigen keine zusätzlichen API-Schlüssel.",

      // Agent Mode
      agentMode: "Agent-Modus",
      agentModeDescription: "Nutze den 🤖 Button im Chat um Agent Mode zu aktivieren. Wenn aktiv, kann die KI mehr Tool-Aufrufe machen und zeigt ihre Aufgabenplanung.",
      maxToolCalls: "Maximale Tool-Aufrufe",
      maxToolCallsDesc: "Wie viele Tool-Aufrufe die KI pro Anfrage machen kann (normaler Modus: 3)",
      maxToolCallsNote: "Höher = gründlichere Recherche aber höhere Kosten. 10 wird empfohlen.",
      showTaskPlan: "Aufgabenplan anzeigen",
      showTaskPlanDesc: "Zeige geplante Teilaufgaben der KI vor der Ausführung",
      agentModeTip: "💡 Am besten für Recherche, Vergleiche und mehrstufige Aufgaben. Einfache Fragen brauchen keinen Agent Mode.",

      // Rich Content
      richContent: "Rich Content Rendering",
      richContentDescription: "Steuere wie KI-Antworten spezielle Inhalte anzeigen. Umfragen, Zeitachsen, Tabellen und Mathe sind immer aktiviert. Diese Funktionen können performance-intensiv sein.",
      mermaidDiagrams: "Mermaid-Diagramme",
      mermaidDiagramsDesc: "Rendere Flussdiagramme, Sequenzdiagramme und andere Mermaid-Diagramme. Nutzt GPU zum Rendern.",
      codeSyntax: "Code-Syntax-Highlighting",
      codeSyntaxDesc: "Zeige Code-Blöcke mit Syntax-Highlighting und Kopier-Button. Lädt ~100KB extra.",
      liveCodeSandbox: "Live Code Sandbox ⚡ NEU",
      liveCodeSandboxDesc: "Führe React, HTML und Vue Code direkt im Chat aus. Fügt \"Ausführen\" Button zu Code-Blöcken hinzu. Aktiviert automatisch Syntax-Highlighting. Lädt ~300KB bei erster Nutzung, läuft client-seitig.",
      dedicatedFollowUp: "Dediziertes Folgefragen-Modell ⚡ NEU",
      dedicatedFollowUpDesc: "Nutze dediziertes schnelles Modell für Folgefragen-Vorschläge (parallele Generierung, 60% schneller, 40x günstiger). Standardmäßig aktiviert.",
      categorizedFollowUps: "Kategorisierte Folgefragen-Vorschläge",
      categorizedFollowUpsDesc: "Zeige Kategorie-Labels (Schnell/Vertiefung/Verwandt) für Folgefragen-Vorschläge. Standard: minimalistische Ansicht.",
      alwaysEnabled: "Immer aktiviert: Umfragen, Zeitachsen, Fortschrittsbalken, Vergleichskarten, sortierbare Tabellen und LaTeX-Mathe-Rendering. Schalte oben für performance-intensive Funktionen.",

      // Memory Intelligence
      memoryIntelligence: "Memory-Intelligenz",
      memoryIntelligenceDesc: "Feinabstimmung wie die KI entscheidet wann und welche Erinnerungen abgerufen werden",
      semanticSearch: "Semantische Suche",
      semanticSearchDesc: "Nutze KI-Embeddings um Erinnerungen nach Bedeutung zu finden (empfohlen)",
      alwaysRetrievePersonas: "Immer für Personas abrufen",
      alwaysRetrievePersonasDesc: "Umgehe Anfrage-Klassifizierung beim Chatten mit Personas",
      classificationConfidence: "Klassifizierungs-Konfidenz",
      classificationConfidenceDesc: "Überspringe Memory-Abruf wenn Klassifizierer-Konfidenz diesen Schwellenwert überschreitet",
      classificationConfidenceTip: "Niedriger = mehr Anfragen überspringen (weniger Memories injiziert). Höher = öfter Memories injizieren. Tipp: 70% ist optimal. Über 85% verursacht Über-Abruf.",
      similarityThreshold: "Ähnlichkeits-Schwellenwert",
      similarityThresholdDesc: "Minimale semantische Ähnlichkeit um eine Erinnerung einzubeziehen",
      similarityThresholdTip: "Niedriger = mehr Memories (evtl. weniger relevant). Höher = weniger aber relevantere. Tipp: 65% bietet gute Qualität. Unter 50% verursacht Rauschen.",
      minRelevanceScore: "Minimaler Relevanz-Score",
      minRelevanceScoreDesc: "Überspringe ALLE Memories wenn bester Treffer unter diesem liegt (Sicherheitsnetz)",
      minRelevanceScoreTip: "Das ist dein Sicherheitsnetz - wenn keine Memory relevant genug ist, wird nichts injiziert. Tipp: 45% ist optimal. Unter 30% lässt irrelevante Memories durch.",
      selfRagExplanation: "So funktioniert es (Self-RAG inspiriert):",
      selfRagStep1: "KI klassifiziert deine Anfrage: faktisch (Memory überspringen), persönlich (abrufen), oder mehrdeutig (standardmäßig überspringen)",
      selfRagStep2: "Wenn Abruf nötig: suche Memories nach semantischer Ähnlichkeit + Aktualität + Wichtigkeit",
      selfRagStep3: "Nur Memories über Ähnlichkeits-Schwellenwert werden berücksichtigt",
      selfRagStep4: "Wenn bester Treffer unter Min-Relevanz liegt, wird nichts injiziert (Sicherheitsnetz)",

      // Streaming Visualization
      streamingVisualization: "Streaming-Visualisierung",
      streamingVisualizationDesc: "Nur Advanced Mode - Steuere was du während KI-Antworten siehst",
      detailedStreaming: "Detaillierter Streaming-Modus",
      detailedStreamingDesc: "Zeige vollen Schritt-für-Schritt-Fortschritt mit Phasen, Sub-Schritten, Timer und Fortschrittsbalken. Wenn aus, zeigt nur aktuelle Aktion und Reasoning-Tokens.",
      defaultStreamingNote: "Standard: Zeigt nur die aktuelle Aktion (Suche, URL-Abruf, etc.) und Reasoning-Tokens während sie streamen. Aktiviere detaillierten Modus für volle Visualisierung mit allen Phasen und Timing-Infos.",
      fineTuneStreaming: "Feinabstimmung der detaillierten Streaming-Visualisierung:",
    },
    chatHeader: {
      profile: "Profil",
      memory: "Speichersystem",
      settings: "Einstellungen",
      lightMode: "Hell-Modus",
      darkMode: "Dunkel-Modus",
      tune: "Anpassen",
      share: "Teilen",
      toggleSidebar: "Seitenleiste umschalten",
    },
    chatInput: {
      placeholder: "Nachricht...",
      searchPlaceholder: "Suchanfrage für Webergebnisse",
      send: "Senden",
      searching: "Suche läuft...",
      searchComplete: "Suche abgeschlossen",
    },
    personas: {
      selectPersona: "Persona auswählen",
      noPersona: "Keine Persona",
    },
    common: {
      loading: "Lädt...",
      error: "Fehler",
      success: "Erfolg",
      delete: "Löschen",
      edit: "Bearbeiten",
      create: "Erstellen",
      update: "Aktualisieren",
      close: "Schließen",
      and: "und",
      results: "Ergebnisse",
      images: "Bilder",
      via: "via",
    },
  },
}

/**
 * Get translation for a key in the current language
 */
export function t(key: string, language: Language = "en"): string {
  const keys = key.split(".")
  let value: any = translations[language]

  for (const k of keys) {
    value = value?.[k]
  }

  return value || key
}

/**
 * Get all translations for current language
 */
export function getTranslations(language: Language = "en"): Translations {
  return translations[language]
}

/**
 * Hook to use translations (for React components)
 */
export function useTranslation(language: Language = "en") {
  return {
    t: (key: string) => t(key, language),
    translations: getTranslations(language),
  }
}
