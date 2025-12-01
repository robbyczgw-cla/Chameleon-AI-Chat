"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Zap, Search, Brain, TrendingUp, Clock, AlertTriangle, Info } from "lucide-react"
import type { StreamingVisualizationSettings } from "@/types"

interface StreamingSettingsPanelProps {
  settings: StreamingVisualizationSettings
  onSettingsChange: (settings: StreamingVisualizationSettings) => void
  language?: "en" | "de" | "es"
}

export function StreamingSettingsPanel({ settings, onSettingsChange, language = "en" }: StreamingSettingsPanelProps) {
  const updateSetting = (key: keyof StreamingVisualizationSettings, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const t = {
    title: {
      en: "Streaming Visualization Settings",
      de: "Streaming-Visualisierungseinstellungen",
      es: "Configuración de visualización de streaming"
    },
    subtitle: {
      en: "Fine-tune what streaming details are displayed in Advanced Mode",
      de: "Passen Sie an, welche Streaming-Details im erweiterten Modus angezeigt werden",
      es: "Ajusta qué detalles de streaming se muestran en el modo avanzado"
    },
    coreInfo: {
      en: "Core Information",
      de: "Kerninformationen",
      es: "Información principal"
    },
    searchResults: {
      en: "Search & Results",
      de: "Suche & Ergebnisse",
      es: "Búsqueda y resultados"
    },
    reasoning: {
      en: "Reasoning & Thinking",
      de: "Reasoning & Denken",
      es: "Razonamiento y pensamiento"
    },
    performance: {
      en: "Performance Metrics",
      de: "Leistungsmetriken",
      es: "Métricas de rendimiento"
    },
    context: {
      en: "Context & Progress",
      de: "Kontext & Fortschritt",
      es: "Contexto y progreso"
    },
    advanced: {
      en: "Advanced Details",
      de: "Erweiterte Details",
      es: "Detalles avanzados"
    },
    warnings: {
      en: "Warnings & Errors",
      de: "Warnungen & Fehler",
      es: "Advertencias y errores"
    },
    timing: {
      en: "Timing & Duration",
      de: "Zeitmessung & Dauer",
      es: "Tiempo y duración"
    },
    presets: {
      en: "Quick Presets",
      de: "Schnellvorlagen",
      es: "Presets rápidos"
    }
  }

  const SettingItem = ({
    label,
    description,
    checked,
    onCheckedChange,
    icon: Icon
  }: {
    label: string
    description: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    icon?: any
  }) => (
    <div className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-muted/50">
      <div className="flex-1 min-w-0 pr-4">
        <Label htmlFor={label} className="text-sm font-medium cursor-pointer block">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">
          {description}
        </p>
      </div>
      <Switch
        id={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="flex-shrink-0"
      />
    </div>
  )

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      {children}
    </div>
  )

  // Quick preset buttons
  const applyPreset = (preset: "minimal" | "balanced" | "maximum") => {
    const presets: Record<string, Partial<StreamingVisualizationSettings>> = {
      minimal: {
        showCurrentAction: true,
        showToolParameters: false,
        showSearchProvider: true,
        showSearchResults: false,
        showResultSummary: true,
        showReasoningTokens: true,
        showExtendedThinking: false,
        showDetailedStats: false,
        showTokenUsage: false,
        showLatencyMetrics: false,
        showStreamingSpeed: false,
        showCostEstimates: false,
        showContextUsage: false,
        showProgressIndicators: true,
        showEstimatedTime: false,
        showModelInfo: true,
        showGenerationId: false,
        showCacheStatus: false,
        showRetryAttempts: false,
        showToolChains: false,
        showRateLimitWarnings: true,
        showErrorDetails: true,
        showPhaseDurations: false,
        showTimestamps: false,
      },
      balanced: {
        showCurrentAction: true,
        showToolParameters: true,
        showSearchProvider: true,
        showSearchResults: true,
        showResultSummary: true,
        showReasoningTokens: true,
        showExtendedThinking: true,
        showDetailedStats: true,
        showTokenUsage: true,
        showLatencyMetrics: true,
        showStreamingSpeed: true,
        showCostEstimates: true,
        showContextUsage: false,
        showProgressIndicators: true,
        showEstimatedTime: true,
        showModelInfo: true,
        showGenerationId: false,
        showCacheStatus: false,
        showRetryAttempts: true,
        showToolChains: true,
        showRateLimitWarnings: true,
        showErrorDetails: true,
        showPhaseDurations: true,
        showTimestamps: false,
      },
      maximum: {
        showCurrentAction: true,
        showToolParameters: true,
        showSearchProvider: true,
        showSearchResults: true,
        showResultSummary: true,
        showReasoningTokens: true,
        showExtendedThinking: true,
        showDetailedStats: true,
        showTokenUsage: true,
        showLatencyMetrics: true,
        showStreamingSpeed: true,
        showCostEstimates: true,
        showContextUsage: true,
        showProgressIndicators: true,
        showEstimatedTime: true,
        showModelInfo: true,
        showGenerationId: true,
        showCacheStatus: true,
        showRetryAttempts: true,
        showToolChains: true,
        showRateLimitWarnings: true,
        showErrorDetails: true,
        showPhaseDurations: true,
        showTimestamps: true,
      }
    }

    onSettingsChange({ ...settings, ...presets[preset] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t.title[language]}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle[language]}</p>
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{t.presets[language]}</h4>
        <div className="flex gap-2">
          <button
            onClick={() => applyPreset("minimal")}
            className="px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {language === "de" ? "Minimal" : language === "es" ? "Mínimo" : "Minimal"}
          </button>
          <button
            onClick={() => applyPreset("balanced")}
            className="px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {language === "de" ? "Ausgewogen" : language === "es" ? "Equilibrado" : "Balanced"}
          </button>
          <button
            onClick={() => applyPreset("maximum")}
            className="px-3 py-1.5 text-xs rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {language === "de" ? "Maximum" : language === "es" ? "Máximo" : "Maximum"}
          </button>
        </div>
      </div>

      <Separator />

      {/* Core Information */}
      <Section title={t.coreInfo[language]} icon={Zap}>
        <SettingItem
          label={language === "de" ? "Aktuelle Aktion" : language === "es" ? "Acción actual" : "Current Action"}
          description="Show what the AI is currently doing in real-time"
          checked={settings.showCurrentAction ?? true}
          onCheckedChange={(v) => updateSetting("showCurrentAction", v)}
        />
        <SettingItem
          label={language === "de" ? "Tool-Parameter" : language === "es" ? "Parámetros de herramienta" : "Tool Parameters"}
          description="Show exact arguments passed to tools"
          checked={settings.showToolParameters ?? true}
          onCheckedChange={(v) => updateSetting("showToolParameters", v)}
        />
        <SettingItem
          label={language === "de" ? "Suchprovider" : language === "es" ? "Proveedor de búsqueda" : "Search Provider"}
          description="Show which search provider is being used"
          checked={settings.showSearchProvider ?? true}
          onCheckedChange={(v) => updateSetting("showSearchProvider", v)}
        />
      </Section>

      <Separator />

      {/* Search & Results */}
      <Section title={t.searchResults[language]} icon={Search}>
        <SettingItem
          label={language === "de" ? "Suchergebnisse" : language === "es" ? "Resultados de búsqueda" : "Search Results"}
          description="Show preview of actual search results content"
          checked={settings.showSearchResults ?? true}
          onCheckedChange={(v) => updateSetting("showSearchResults", v)}
        />
        <SettingItem
          label={language === "de" ? "Ergebniszusammenfassung" : language === "es" ? "Resumen de resultados" : "Result Summary"}
          description="Show result counts and summaries"
          checked={settings.showResultSummary ?? true}
          onCheckedChange={(v) => updateSetting("showResultSummary", v)}
        />
      </Section>

      <Separator />

      {/* Reasoning & Thinking */}
      <Section title={t.reasoning[language]} icon={Brain}>
        <SettingItem
          label={language === "de" ? "Reasoning-Tokens" : language === "es" ? "Tokens de razonamiento" : "Reasoning Tokens"}
          description="Show reasoning/thinking process (o1, DeepSeek R1, etc.)"
          checked={settings.showReasoningTokens ?? true}
          onCheckedChange={(v) => updateSetting("showReasoningTokens", v)}
        />
        <SettingItem
          label={language === "de" ? "Erweitertes Denken" : language === "es" ? "Pensamiento extendido" : "Extended Thinking"}
          description="Show extended thinking indicators"
          checked={settings.showExtendedThinking ?? true}
          onCheckedChange={(v) => updateSetting("showExtendedThinking", v)}
        />
      </Section>

      <Separator />

      {/* Performance Metrics */}
      <Section title={t.performance[language]} icon={TrendingUp}>
        <SettingItem
          label={language === "de" ? "Detaillierte Stats" : language === "es" ? "Estadísticas detalladas" : "Detailed Stats"}
          description="Show detailed stats at end of message: tokens, cost, performance, search info"
          checked={settings.showDetailedStats ?? true}
          onCheckedChange={(v) => updateSetting("showDetailedStats", v)}
        />
        <SettingItem
          label={language === "de" ? "Token-Nutzung (Live)" : language === "es" ? "Uso de tokens (en vivo)" : "Token Usage (Live)"}
          description="Show real-time token counts during streaming (prompt, completion, total)"
          checked={settings.showTokenUsage ?? false}
          onCheckedChange={(v) => updateSetting("showTokenUsage", v)}
        />
        <SettingItem
          label={language === "de" ? "Latenzmetriken" : language === "es" ? "Métricas de latencia" : "Latency Metrics"}
          description="Show time to first token (TTFT)"
          checked={settings.showLatencyMetrics ?? true}
          onCheckedChange={(v) => updateSetting("showLatencyMetrics", v)}
        />
        <SettingItem
          label={language === "de" ? "Streaming-Geschwindigkeit" : language === "es" ? "Velocidad de streaming" : "Streaming Speed"}
          description="Show tokens/second and characters/second"
          checked={settings.showStreamingSpeed ?? true}
          onCheckedChange={(v) => updateSetting("showStreamingSpeed", v)}
        />
        <SettingItem
          label={language === "de" ? "Kostenschätzungen" : language === "es" ? "Estimaciones de costos" : "Cost Estimates"}
          description="Show real-time cost tracking"
          checked={settings.showCostEstimates ?? true}
          onCheckedChange={(v) => updateSetting("showCostEstimates", v)}
        />
      </Section>

      <Separator />

      {/* Context & Progress */}
      <Section title={t.context[language]} icon={Clock}>
        <SettingItem
          label={language === "de" ? "Kontextnutzung" : language === "es" ? "Uso de contexto" : "Context Usage"}
          description="Show percentage of context window used"
          checked={settings.showContextUsage ?? false}
          onCheckedChange={(v) => updateSetting("showContextUsage", v)}
        />
        <SettingItem
          label={language === "de" ? "Fortschrittsindikatoren" : language === "es" ? "Indicadores de progreso" : "Progress Indicators"}
          description="Show progress bars and estimates"
          checked={settings.showProgressIndicators ?? true}
          onCheckedChange={(v) => updateSetting("showProgressIndicators", v)}
        />
        <SettingItem
          label={language === "de" ? "Geschätzte Zeit" : language === "es" ? "Tiempo estimado" : "Estimated Time"}
          description="Show estimated time remaining"
          checked={settings.showEstimatedTime ?? true}
          onCheckedChange={(v) => updateSetting("showEstimatedTime", v)}
        />
      </Section>

      <Separator />

      {/* Advanced Details */}
      <Section title={t.advanced[language]} icon={Info}>
        <SettingItem
          label={language === "de" ? "Modellinformationen" : language === "es" ? "Información del modelo" : "Model Info"}
          description="Show model name and provider"
          checked={settings.showModelInfo ?? true}
          onCheckedChange={(v) => updateSetting("showModelInfo", v)}
        />
        <SettingItem
          label={language === "de" ? "Generierungs-ID" : language === "es" ? "ID de generación" : "Generation ID"}
          description="Show generation ID for tracking"
          checked={settings.showGenerationId ?? false}
          onCheckedChange={(v) => updateSetting("showGenerationId", v)}
        />
        <SettingItem
          label={language === "de" ? "Cache-Status" : language === "es" ? "Estado de caché" : "Cache Status"}
          description="Show prompt cache hits"
          checked={settings.showCacheStatus ?? false}
          onCheckedChange={(v) => updateSetting("showCacheStatus", v)}
        />
        <SettingItem
          label={language === "de" ? "Wiederholungsversuche" : language === "es" ? "Intentos de reintento" : "Retry Attempts"}
          description="Show retry attempts on failures"
          checked={settings.showRetryAttempts ?? true}
          onCheckedChange={(v) => updateSetting("showRetryAttempts", v)}
        />
        <SettingItem
          label={language === "de" ? "Tool-Ketten" : language === "es" ? "Cadenas de herramientas" : "Tool Chains"}
          description="Show sequence of multiple tool calls"
          checked={settings.showToolChains ?? true}
          onCheckedChange={(v) => updateSetting("showToolChains", v)}
        />
      </Section>

      <Separator />

      {/* Warnings & Errors */}
      <Section title={t.warnings[language]} icon={AlertTriangle}>
        <SettingItem
          label={language === "de" ? "Rate-Limit-Warnungen" : language === "es" ? "Advertencias de límite de velocidad" : "Rate Limit Warnings"}
          description="Show when approaching rate limits"
          checked={settings.showRateLimitWarnings ?? true}
          onCheckedChange={(v) => updateSetting("showRateLimitWarnings", v)}
        />
        <SettingItem
          label={language === "de" ? "Fehlerdetails" : language === "es" ? "Detalles de error" : "Error Details"}
          description="Show detailed error information"
          checked={settings.showErrorDetails ?? true}
          onCheckedChange={(v) => updateSetting("showErrorDetails", v)}
        />
      </Section>

      <Separator />

      {/* Timing & Duration */}
      <Section title={t.timing[language]} icon={Clock}>
        <SettingItem
          label={language === "de" ? "Phasendauer" : language === "es" ? "Duración de fase" : "Phase Durations"}
          description="Show how long each phase took"
          checked={settings.showPhaseDurations ?? true}
          onCheckedChange={(v) => updateSetting("showPhaseDurations", v)}
        />
        <SettingItem
          label={language === "de" ? "Zeitstempel" : language === "es" ? "Marcas de tiempo" : "Timestamps"}
          description="Show timestamps for each event"
          checked={settings.showTimestamps ?? false}
          onCheckedChange={(v) => updateSetting("showTimestamps", v)}
        />
      </Section>
    </div>
  )
}
