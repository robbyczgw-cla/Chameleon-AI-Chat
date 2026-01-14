import type { AppSettings } from "@/types"

/**
 * Common props for all settings tab components
 */
export interface SettingsTabProps {
  localSettings: AppSettings
  setLocalSettings: (settings: AppSettings) => void
}

/**
 * Extended props for voice tab that needs additional state
 */
export interface VoiceTabProps extends SettingsTabProps {
  voices: SpeechSynthesisVoice[]
}

/**
 * Props for general tab that needs theme handling
 */
export interface GeneralTabProps extends SettingsTabProps {
  currentTheme: string
  onThemeChange: (theme: string) => void
  translations: Record<string, any>
  hideOptions?: string[]
}

/**
 * Props for API keys tab
 */
export interface ApiKeysTabProps extends SettingsTabProps {}

/**
 * Props for search tab
 */
export interface SearchTabProps extends SettingsTabProps {}
