"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import type { SearchTabProps } from "../types"

export function SearchTab({ localSettings, setLocalSettings }: SearchTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">Websuche Einstellungen</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Konfigurieren Sie die Websuche für genauere und relevantere Ergebnisse.
        </p>
      </div>

      {/* Auto Tool Use Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-green-500/30 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <Label htmlFor="auto-tool-use" className="text-sm sm:text-base font-medium">
              Automatic Tool Use (AI Tool Calling)
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Let AI automatically decide when to use tools like web search, weather lookup, URL fetching, etc. The model will intelligently choose the right tool based on your question.
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">GPT-5</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">Claude 4.5</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">Gemini 2.5</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">Grok 4</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300">DeepSeek V3</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">Llama 4</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300">Qwen 3</span>
          </div>
        </div>
        <Switch
          id="auto-tool-use"
          checked={localSettings.enableAutoToolUse ?? true}
          onCheckedChange={(checked) =>
            setLocalSettings({ ...localSettings, enableAutoToolUse: checked })
          }
          className="flex-shrink-0"
        />
      </div>

      {localSettings.enableAutoToolUse && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs space-y-1">
          <p className="font-medium text-amber-700 dark:text-amber-400">Requirements:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
            <li>For web search: A search API key (Tavily, Serper, or Exa) must be configured</li>
            <li>For weather: Add WEATHER_API_KEY environment variable (optional)</li>
            <li>Use a model with tool calling support (GPT-5, Claude 4.5, Gemini 2.5, Grok 4, Llama 4, etc.)</li>
            <li>Most 2025 flagship and mid-tier models support this feature</li>
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="search-provider" className="text-sm sm:text-base">
          Search Provider
        </Label>
        <select
          id="search-provider"
          value={localSettings.searchProvider || "tavily"}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              searchProvider: e.target.value as "tavily" | "serper" | "exa",
            })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="tavily">🌐 Tavily - LLM-optimiert (~$0.01/search)</option>
          <option value="serper">🔍 Serper - Google Search (~$0.001/search)</option>
          <option value="exa">🔮 Exa - Neural/Semantic Search (~$0.01/search)</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Wähle den Suchanbieter für die Web-Suche. Exa bietet semantische Suche für beste RAG-Ergebnisse.
        </p>
      </div>

      {/* Serper Settings */}
      {localSettings.searchProvider === "serper" && (
        <SerperSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
      )}

      {/* Exa Settings */}
      {localSettings.searchProvider === "exa" && (
        <ExaSettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
      )}

      {/* Tavily Settings */}
      {(!localSettings.searchProvider || localSettings.searchProvider === "tavily") && (
        <TavilySettings localSettings={localSettings} setLocalSettings={setLocalSettings} />
      )}
    </div>
  )
}

function SerperSettings({ localSettings, setLocalSettings }: SearchTabProps) {
  return (
    <div className="rounded-lg border p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20">
      <h4 className="font-medium mb-2 text-sm sm:text-base">🔍 Serper (Google Search)</h4>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm sm:text-base">
            Max Ergebnisse: {localSettings.serperSettings?.maxResults || 5}
          </Label>
          <Slider
            value={[localSettings.serperSettings?.maxResults || 5]}
            onValueChange={([value]) =>
              setLocalSettings({
                ...localSettings,
                serperSettings: { ...localSettings.serperSettings, maxResults: value } as any,
              })
            }
            min={1}
            max={10}
            step={1}
            className="touch-none"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <Label htmlFor="serper-images" className="text-sm sm:text-base">
            Produktbilder einbeziehen
          </Label>
          <Switch
            id="serper-images"
            checked={localSettings.serperSettings?.includeImages !== false}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                serperSettings: { ...localSettings.serperSettings, includeImages: checked } as any,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serper-country" className="text-sm sm:text-base">
            Land
          </Label>
          <select
            id="serper-country"
            value={localSettings.serperSettings?.country || "at"}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                serperSettings: { ...localSettings.serperSettings, country: e.target.value } as any,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
          >
            <option value="at">🇦🇹 Österreich</option>
            <option value="de">🇩🇪 Deutschland</option>
            <option value="ch">🇨🇭 Schweiz</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serper-language" className="text-sm sm:text-base">
            Sprache
          </Label>
          <select
            id="serper-language"
            value={localSettings.serperSettings?.language || "de"}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                serperSettings: { ...localSettings.serperSettings, language: e.target.value } as any,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serper-type" className="text-sm sm:text-base">
            Suchtyp
          </Label>
          <select
            id="serper-type"
            value={localSettings.serperSettings?.type || "search"}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                serperSettings: { ...localSettings.serperSettings, type: e.target.value as any } as any,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
          >
            <option value="search">🔍 Web Search</option>
            <option value="news">📰 News</option>
            <option value="images">🖼️ Images</option>
            <option value="videos">🎥 Videos</option>
            <option value="places">📍 Places</option>
            <option value="shopping">🛒 Shopping</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serper-timerange" className="text-sm sm:text-base">
            Zeitfilter
          </Label>
          <select
            id="serper-timerange"
            value={localSettings.serperSettings?.timeRange || "none"}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                serperSettings: { ...localSettings.serperSettings, timeRange: e.target.value as any } as any,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
          >
            <option value="none">⏰ Alle Ergebnisse</option>
            <option value="hour">Letzte Stunde</option>
            <option value="day">Letzter Tag</option>
            <option value="week">Letzte Woche</option>
            <option value="month">Letzter Monat</option>
            <option value="year">Letztes Jahr</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-2">
          <Label htmlFor="serper-autocorrect" className="text-sm sm:text-base">
            Rechtschreibkorrektur
          </Label>
          <Switch
            id="serper-autocorrect"
            checked={localSettings.serperSettings?.autocorrect !== false}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                serperSettings: { ...localSettings.serperSettings, autocorrect: checked } as any,
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

function ExaSettings({ localSettings, setLocalSettings }: SearchTabProps) {
  return (
    <div className="rounded-lg border p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20">
      <h4 className="font-medium mb-2 text-sm sm:text-base">🔮 Exa Neural Search</h4>
      <p className="text-xs text-muted-foreground mb-3">
        Semantische Suche mit AI-Verständnis - optimal für RAG und Recherche
      </p>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm sm:text-base">
            Max Ergebnisse: {localSettings.exaSettings?.maxResults || 5}
          </Label>
          <Slider
            value={[localSettings.exaSettings?.maxResults || 5]}
            onValueChange={([value]) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, maxResults: value } as any,
              })
            }
            min={1}
            max={20}
            step={1}
            className="touch-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exa-search-type" className="text-sm sm:text-base">
            Suchmethode
          </Label>
          <select
            id="exa-search-type"
            value={localSettings.exaSettings?.searchType || "auto"}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, searchType: e.target.value as any } as any,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
          >
            <option value="auto">🤖 Auto - Kombination aus Neural & Keyword</option>
            <option value="neural">🧠 Neural - Semantische Suche (Embeddings)</option>
            <option value="keyword">🔤 Keyword - Traditionelle Stichwortsuche</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exa-category" className="text-sm sm:text-base">
            Kategorie-Filter (optional)
          </Label>
          <select
            id="exa-category"
            value={localSettings.exaSettings?.category || ""}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, category: e.target.value || undefined } as any,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
          >
            <option value="">Alle Kategorien</option>
            <option value="news">📰 News</option>
            <option value="research paper">📄 Research Papers</option>
            <option value="github">💻 GitHub</option>
            <option value="company">🏢 Unternehmen</option>
            <option value="pdf">📑 PDFs</option>
            <option value="tweet">🐦 Tweets</option>
            <option value="linkedin profile">💼 LinkedIn</option>
            <option value="personal site">🏠 Personal Sites</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 flex-1 pr-4">
            <Label htmlFor="exa-autoprompt" className="text-sm sm:text-base">
              Autoprompt
            </Label>
            <p className="text-xs text-muted-foreground">
              Exa optimiert deine Suchanfrage automatisch
            </p>
          </div>
          <Switch
            id="exa-autoprompt"
            checked={localSettings.exaSettings?.useAutoprompt !== false}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, useAutoprompt: checked } as any,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 flex-1 pr-4">
            <Label htmlFor="exa-fulltext" className="text-sm sm:text-base">
              Volltext einbeziehen
            </Label>
            <p className="text-xs text-muted-foreground">
              Kompletten Seiteninhalt für RAG laden
            </p>
          </div>
          <Switch
            id="exa-fulltext"
            checked={localSettings.exaSettings?.includeFullText !== false}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, includeFullText: checked } as any,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 flex-1 pr-4">
            <Label htmlFor="exa-highlights" className="text-sm sm:text-base">
              Highlights einbeziehen
            </Label>
            <p className="text-xs text-muted-foreground">
              Relevante Textausschnitte extrahieren
            </p>
          </div>
          <Switch
            id="exa-highlights"
            checked={localSettings.exaSettings?.includeHighlights !== false}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, includeHighlights: checked } as any,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5 flex-1 pr-4">
            <Label htmlFor="exa-summary" className="text-sm sm:text-base">
              AI-Zusammenfassung
            </Label>
            <p className="text-xs text-muted-foreground">
              Generierte Zusammenfassung pro Ergebnis (+$0.001)
            </p>
          </div>
          <Switch
            id="exa-summary"
            checked={localSettings.exaSettings?.includeSummary || false}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, includeSummary: checked } as any,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <Label htmlFor="exa-images" className="text-sm sm:text-base cursor-pointer">
              🖼️ Bilder einbeziehen
            </Label>
            <p className="text-xs text-muted-foreground">
              Bilder aus Suchergebnissen anzeigen
            </p>
          </div>
          <Switch
            id="exa-images"
            checked={localSettings.exaSettings?.includeImages || false}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, includeImages: checked } as any,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exa-livecrawl" className="text-sm sm:text-base">
            Livecrawl-Modus
          </Label>
          <select
            id="exa-livecrawl"
            value={localSettings.exaSettings?.livecrawl || "fallback"}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                exaSettings: { ...localSettings.exaSettings, livecrawl: e.target.value as any } as any,
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
          >
            <option value="never">⚡ Nie - Nur aus Cache</option>
            <option value="fallback">🔄 Fallback - Bei veraltetem Content</option>
            <option value="always">🌐 Immer - Stets frische Daten</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Steuert, ob Exa Seiten live crawlt für aktuelle Inhalte
          </p>
        </div>

        <div className="rounded-lg border p-3 bg-purple-100 dark:bg-purple-900/30">
          <h5 className="font-medium text-sm mb-1">💡 Exa Tipps</h5>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Neural-Suche versteht Bedeutung, nicht nur Stichwörter</li>
            <li>Kategorie-Filter für spezifische Quellen (GitHub, News, Papers)</li>
            <li>Highlights sind ideal für prägnante RAG-Kontexte</li>
            <li>Volltext für tiefgehende Analyse und längere Dokumente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function TavilySettings({ localSettings, setLocalSettings }: SearchTabProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium mb-3 text-sm sm:text-base">📡 Tavily Einstellungen</h4>

      <div className="space-y-2">
        <Label htmlFor="search-depth" className="text-sm sm:text-base">
          Suchtiefe
        </Label>
        <select
          id="search-depth"
          value={localSettings.tavilySettings?.searchDepth || "basic"}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              tavilySettings: {
                ...localSettings.tavilySettings,
                searchDepth: e.target.value as "basic" | "advanced",
              } as any,
            })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="basic">Basic - Schneller, weniger detailliert</option>
          <option value="advanced">Advanced - Langsamer, mehr Details</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Basic ist schneller und günstiger, Advanced liefert umfassendere Ergebnisse.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm sm:text-base">
          Maximale Ergebnisse: {localSettings.tavilySettings?.maxResults || 5}
        </Label>
        <Slider
          value={[localSettings.tavilySettings?.maxResults || 5]}
          onValueChange={([value]) =>
            setLocalSettings({
              ...localSettings,
              tavilySettings: { ...localSettings.tavilySettings, maxResults: value } as any,
            })
          }
          min={1}
          max={10}
          step={1}
          className="touch-none"
        />
        <p className="text-xs text-muted-foreground">
          Anzahl der Suchergebnisse, die in den Kontext einbezogen werden.
        </p>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5 flex-1 pr-4">
          <Label htmlFor="include-images" className="text-sm sm:text-base">
            Bilder einbeziehen
          </Label>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Relevante Bilder in Suchergebnissen anzeigen
          </p>
        </div>
        <Switch
          id="include-images"
          checked={localSettings.tavilySettings?.includeImages || false}
          onCheckedChange={(checked) =>
            setLocalSettings({
              ...localSettings,
              tavilySettings: { ...localSettings.tavilySettings, includeImages: checked } as any,
            })
          }
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5 flex-1 pr-4">
          <Label htmlFor="include-answer" className="text-sm sm:text-sm">
            KI-Antwort einbeziehen
          </Label>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Tavily's KI-generierte Zusammenfassung der Suchergebnisse verwenden
          </p>
        </div>
        <Switch
          id="include-answer"
          checked={localSettings.tavilySettings?.includeAnswer !== false}
          onCheckedChange={(checked) =>
            setLocalSettings({
              ...localSettings,
              tavilySettings: { ...localSettings.tavilySettings, includeAnswer: checked } as any,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tavily-topic" className="text-sm sm:text-base">
          Suchfokus
        </Label>
        <select
          id="tavily-topic"
          value={localSettings.tavilySettings?.topic || "general"}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              tavilySettings: { ...localSettings.tavilySettings, topic: e.target.value as any } as any,
            })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="general">🌐 Allgemein</option>
          <option value="news">📰 News</option>
        </select>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="space-y-0.5 flex-1 pr-4">
          <Label htmlFor="include-raw-content" className="text-sm sm:text-base">
            Vollständiger Content
          </Label>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Lädt kompletten HTML/Text-Inhalt (erhöht Token-Nutzung)
          </p>
        </div>
        <Switch
          id="include-raw-content"
          checked={localSettings.tavilySettings?.includeRawContent || false}
          onCheckedChange={(checked) =>
            setLocalSettings({
              ...localSettings,
              tavilySettings: { ...localSettings.tavilySettings, includeRawContent: checked } as any,
            })
          }
        />
      </div>

      <div className="rounded-lg border p-3 sm:p-4 bg-muted/50">
        <h4 className="font-medium mb-2 text-sm sm:text-base">💡 Tipps für bessere Suchergebnisse</h4>
        <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Verwenden Sie spezifische Suchbegriffe für genauere Ergebnisse</li>
          <li>Advanced-Modus für komplexe Recherchen und Faktenprüfung</li>
          <li>Mehr Ergebnisse = mehr Kontext, aber höhere Kosten</li>
          <li>KI-Antwort liefert eine prägnante Zusammenfassung der Ergebnisse</li>
        </ul>
      </div>
    </div>
  )
}
