"use client"

import type { ChangeEvent } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { GeneralTabProps } from "../types"

export function GeneralTab({
  localSettings,
  setLocalSettings,
  currentTheme,
  onThemeChange,
  translations,
  hideOptions = [],
}: GeneralTabProps) {
  return (
    <div className="space-y-4">
      {/* Simple Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="space-y-0.5 flex-1">
          <Label htmlFor="simple-mode" className="text-sm sm:text-base font-medium">Simple Mode</Label>
          <p className="text-xs text-muted-foreground">
            Clean, persona-focused interface. Perfect for everyday conversations.
          </p>
        </div>
        <Switch
          id="simple-mode"
          checked={localSettings.simpleMode ?? false}
          onCheckedChange={(checked) =>
            setLocalSettings({ ...localSettings, simpleMode: checked })
          }
          className="flex-shrink-0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="system-prompt" className="text-sm sm:text-base">
          {translations.settings.systemPrompt}
        </Label>
        <Textarea
          id="system-prompt"
          placeholder={translations.settings.systemPromptPlaceholder}
          value={localSettings.systemPrompt}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
          rows={4}
          className="text-sm sm:text-base"
        />
        <p className="text-xs text-muted-foreground">
          {translations.settings.systemPromptHelp}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm sm:text-base">{translations.settings.language}</Label>
        <select
          value={localSettings.language || "en"}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setLocalSettings({ ...localSettings, language: e.target.value as "en" | "de" })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="en">{translations.settings.languageEnglish}</option>
          <option value="de">{translations.settings.languageGerman}</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm sm:text-base">{translations.settings.fontSize}</Label>
        <select
          value={localSettings.fontSize || "medium"}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setLocalSettings({ ...localSettings, fontSize: e.target.value as "small" | "medium" | "large" })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="small">{translations.settings.fontSizeSmall}</option>
          <option value="medium">{translations.settings.fontSizeMedium}</option>
          <option value="large">{translations.settings.fontSizeLarge}</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm sm:text-base">Font Family</Label>
        <select
          value={localSettings.fontFamily || "inter"}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setLocalSettings({
              ...localSettings,
              fontFamily: e.target.value as "inter" | "roboto" | "atkinson" | "opendyslexic" | "jetbrains" | "system" | "dmsans" | "poppins",
            })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="inter">Inter (Default)</option>
          <option value="dmsans">DM Sans (Modern)</option>
          <option value="poppins">Poppins (Geometric)</option>
          <option value="roboto">Roboto</option>
          <option value="atkinson">Atkinson Hyperlegible (Dyslexia-friendly)</option>
          <option value="opendyslexic">OpenDyslexic</option>
          <option value="jetbrains">JetBrains Mono</option>
          <option value="system">System Font</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Choose a font that's comfortable for reading. DM Sans and Poppins are modern geometric fonts. Atkinson and OpenDyslexic are designed for accessibility.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm sm:text-base">Message Spacing</Label>
        <select
          value={localSettings.messageDensity || "comfortable"}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setLocalSettings({
              ...localSettings,
              messageDensity: e.target.value as "compact" | "comfortable" | "spacious",
            })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="compact">Compact (more messages visible)</option>
          <option value="comfortable">Comfortable (normal)</option>
          <option value="spacious">Spacious (more breathing room)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm sm:text-base">Color Theme</Label>
        <select
          value={currentTheme}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onThemeChange(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="light">☀️ Light - Bright & Classic</option>
          <option value="dark">🌙 Dark - Dark & Modern</option>
          <option value="soft-sunrise">🌅 Soft Sunrise - Warm Peach & Lavender</option>
          <option value="claude">🧡 Claude - Warm Terracotta & Cream</option>
          <option value="claude-grey">🩶 Claude Grey - Modern Neutral Dark</option>
          <option value="clean-slate">🧼 Clean Slate - Minimal & Neutral</option>
          <option value="chameleon">🦎 Chameleon (Light) - Iridescent Green & Aqua</option>
          <option value="girly-violet">💜 Girly Violet - Soft & Purple</option>
          <option value="kawaii-pink">💖 Kawaii Pink - Cute & Playful</option>
          <option value="aurora">✨ Aurora - Ethereal Light & Modern</option>
          <option value="amber-pro">🔶 Amber Pro - Premium Orange & Ivory</option>
          <option value="ocean-breeze">🌊 Ocean Breeze - Fresh & Aqua</option>
          <option value="paper-mint">📄 Paper Mint - Warm & Crisp</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Choose your favorite theme for the user interface
        </p>
      </div>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="keyboard-shortcuts" className="text-sm sm:text-base">
          Enable Keyboard Shortcuts
        </Label>
        <Switch
          id="keyboard-shortcuts"
          checked={localSettings.enableKeyboardShortcuts !== false}
          onCheckedChange={(checked) =>
            setLocalSettings({ ...localSettings, enableKeyboardShortcuts: checked })
          }
        />
      </div>

      {/* Exa Search Toggle - Only shown when mode is hidden (Simple Mode) */}
      {hideOptions.includes("mode") && (
        <div className="p-3 sm:p-4 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                <span className="text-xl">🔍</span>
              </div>
              <div className="flex-1">
                <Label htmlFor="use-exa" className="text-sm sm:text-base font-medium">Exa Semantic Search (experimentell)</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nutze Exa für tiefe technische Recherche (semantische Suche, lange Kontext-Passagen)
                </p>
              </div>
              <Switch
                id="use-exa"
                checked={localSettings.useExaSearch ?? false}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, useExaSearch: checked })
                }
                className="flex-shrink-0"
              />
            </div>
            <div className="text-xs space-y-1 p-2 bg-blue-100 dark:bg-blue-950/50 rounded">
              <p className="font-medium">ℹ️ Was ist Exa?</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Semantische Suche via OpenRouter (model:online)</li>
                <li>Lange, detaillierte Passagen von Hersteller-Seiten</li>
                <li>Beste für: Technische Specs, Vergleiche, Forschung</li>
                <li>Kosten: ~$0.02 pro Anfrage (10x teurer als Serper)</li>
                <li>Kann mit Serper/Tavily kombiniert werden</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
