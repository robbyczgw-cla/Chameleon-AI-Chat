/**
 * Internationalization (i18n) for UI text
 * Supports English (en) and German (de)
 */

export type Language = "en" | "de"

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

  // Advanced Settings
  advancedSettings: {
    title: string
    prompts: string
    models: string
    costTracking: string
    exportData: string
    systemPromptInstructions: string
  }

  // Chat Header
  chatHeader: {
    profile: string
    memory: string
    settings: string
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
    advancedSettings: {
      title: "Advanced Settings",
      prompts: "Prompts",
      models: "Models",
      costTracking: "Cost Tracking",
      exportData: "Export Data",
      systemPromptInstructions: "Instructions that guide the model's behavior and personality.",
    },
    chatHeader: {
      profile: "Profile",
      memory: "Memory System",
      settings: "Settings",
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
    advancedSettings: {
      title: "Erweiterte Einstellungen",
      prompts: "Prompts",
      models: "Modelle",
      costTracking: "Kostenverfolgung",
      exportData: "Daten exportieren",
      systemPromptInstructions: "Anweisungen, die das Verhalten und die Persönlichkeit des Modells steuern.",
    },
    chatHeader: {
      profile: "Profil",
      memory: "Speichersystem",
      settings: "Einstellungen",
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
