"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/contexts/app-context"
import { FlaskRound, AlertTriangle, Zap, Monitor, Brain, Link, Youtube, Wrench, CloudSun, BarChart2, Sparkles, Palette, Code2, GitBranch, Cpu, ChevronDown, ChevronUp } from "lucide-react"
import { StreamingSettingsPanel } from "@/components/streaming-settings-panel"
import { Separator } from "@/components/ui/separator"
import { getUserSelectedModels } from "@/lib/model-preferences"
import { useEffect, useState } from "react"
import type { BackgroundAIModelsSettings } from "@/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Default models for background tasks
export const DEFAULT_BACKGROUND_MODELS: Required<BackgroundAIModelsSettings> = {
  titleGeneration: "openai/gpt-oss-20b",
  memoryExtraction: "openai/gpt-oss-20b",
  queryClassification: "openai/gpt-oss-20b",
  promptHelper: "x-ai/grok-4.1-fast",
  personaGeneration: "x-ai/grok-4.1-fast",
  personalityAnalysis: "x-ai/grok-4.1-fast",
  conversationInsights: "x-ai/grok-4.1-fast",
  contextCompression: "x-ai/grok-4.1-fast:free",
  imageGenNormal: "google/gemini-2.5-flash-image",
  imageGenHigh: "google/gemini-3-pro-image-preview",
  embeddings: "openai/text-embedding-3-small",
}

// Helper to get the model with fallback to default
export function getBackgroundModel(
  key: keyof BackgroundAIModelsSettings,
  settings?: BackgroundAIModelsSettings
): string {
  return settings?.[key] || DEFAULT_BACKGROUND_MODELS[key]
}

export function ExperimentalSettings() {
  const { settings, updateSettings } = useApp()
  const experimental = settings.experimental || {}
  const memorySettings = settings.memorySettings || {}
  const backgroundModels = experimental.backgroundAIModels || {}
  const isAdvancedMode = !settings.simpleMode
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [isBackgroundModelsOpen, setIsBackgroundModelsOpen] = useState(false)

  // Load available models from user preferences
  useEffect(() => {
    const models = getUserSelectedModels()
    setAvailableModels(models)

    // Listen for model preference changes
    const handleModelChange = () => {
      setAvailableModels(getUserSelectedModels())
    }
    window.addEventListener("modelPreferencesChanged", handleModelChange)
    return () => window.removeEventListener("modelPreferencesChanged", handleModelChange)
  }, [])

  const handleExperimentalChange = (updates: Partial<typeof experimental>) => {
    updateSettings({
      experimental: {
        ...experimental,
        ...updates,
      },
    })
  }

  const handleMemorySettingChange = (updates: Partial<typeof memorySettings>) => {
    updateSettings({
      memorySettings: {
        ...memorySettings,
        ...updates,
      },
    })
  }

  const handleBackgroundModelChange = (key: keyof BackgroundAIModelsSettings, value: string) => {
    handleExperimentalChange({
      backgroundAIModels: {
        ...backgroundModels,
        [key]: value === "__default__" ? undefined : value,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Experimental Features</h4>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            These features are experimental and may change or be removed in future updates. Use at your own
            discretion.
          </p>
        </div>
      </div>

      {/* Default Model Selection (Advanced Mode Only) */}
      {isAdvancedMode && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Default Model</h3>
          </div>

          <div className="space-y-4 pl-7">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Default Model for New Chats</Label>
<p className="text-xs text-muted-foreground">
                  Choose your preferred model for new conversations. System default: openai/gpt-5.1-codex-mini
                </p>
              </div>
              <Select
                value={settings.defaultModel || "__system_default__"}
                onValueChange={(value) => updateSettings({ defaultModel: value === "__system_default__" ? undefined : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Use system default (GPT-5.1 Codex Mini)" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] z-[9999]" position="popper" sideOffset={8} align="start">
                  <SelectItem value="__system_default__">Use system default (GPT-5.1 Codex Mini)</SelectItem>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Add more models to this list from the Model Management dialog (model icon in chat header). Your custom default is saved and synced across sessions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Background AI Models Section (Advanced Mode Only) */}
      {isAdvancedMode && (
        <div className="space-y-4">
          <Collapsible open={isBackgroundModelsOpen} onOpenChange={setIsBackgroundModelsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full hover:text-primary transition-colors">
              <Cpu className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold flex-1 text-left">Background AI Models</h3>
              {isBackgroundModelsOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                Configure which models are used for background tasks. These run automatically without user interaction.
                Select from your available models or keep the defaults.
              </p>

              {/* Text Generation Tasks */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Text Generation Tasks
                </h4>

                {/* Title Generation */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Chat Title Generation</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Generates titles for new conversations</p>
                  <Select
                    value={backgroundModels.titleGeneration || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("titleGeneration", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.titleGeneration})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Memory Extraction */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Memory Extraction</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Extracts memories from conversations</p>
                  <Select
                    value={backgroundModels.memoryExtraction || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("memoryExtraction", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.memoryExtraction})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Query Classification */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Query Classification</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Classifies if queries need memory context</p>
                  <Select
                    value={backgroundModels.queryClassification || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("queryClassification", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.queryClassification})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prompt Helper */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Prompt Helper / Improvement</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Improves user prompts using AI</p>
                  <Select
                    value={backgroundModels.promptHelper || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("promptHelper", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.promptHelper})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Persona Generation */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Persona Personality Generation</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Generates AI persona personalities</p>
                  <Select
                    value={backgroundModels.personaGeneration || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("personaGeneration", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.personaGeneration})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Personality Analysis */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Personality Analysis</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Analyzes user communication patterns</p>
                  <Select
                    value={backgroundModels.personalityAnalysis || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("personalityAnalysis", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.personalityAnalysis})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conversation Insights */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Conversation Insights</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Extracts summaries and key points</p>
                  <Select
                    value={backgroundModels.conversationInsights || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("conversationInsights", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.conversationInsights})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Context Compression */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Context Compression</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Summarizes conversation history</p>
                  <Select
                    value={backgroundModels.contextCompression || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("contextCompression", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.contextCompression})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image Generation Tasks */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-pink-500" />
                  Image Generation Tasks
                </h4>

                {/* Normal Quality */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Image Generation (Normal Quality)</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Fast image generation for avatars</p>
                  <Select
                    value={backgroundModels.imageGenNormal || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("imageGenNormal", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.imageGenNormal})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* High Quality */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Image Generation (High Quality)</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">High-quality image generation</p>
                  <Select
                    value={backgroundModels.imageGenHigh || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("imageGenHigh", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.imageGenHigh})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Embedding Tasks */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-500" />
                  Embedding Tasks
                </h4>

                {/* Embeddings */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Memory Embeddings</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Generates vector embeddings for semantic search</p>
                  <Select
                    value={backgroundModels.embeddings || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("embeddings", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.embeddings})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Background models run automatically for various tasks. Default models are optimized for cost and speed.
                  Only change if you need specific capabilities. Models must support the task type (e.g., embeddings need embedding models).
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Response Analysis Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FlaskRound className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Response Analysis</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Response Analysis */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Response Analysis</Label>
              <p className="text-xs text-muted-foreground">
                Analyze AI responses for sentiment, confidence, complexity, and more
              </p>
            </div>
            <Switch
              checked={experimental.enableResponseAnalysis || false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableResponseAnalysis: checked })}
            />
          </div>

          {/* Info Box */}
          {experimental.enableResponseAnalysis && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Response analysis shows sentiment, confidence level, hedging phrases,
                complexity, reading time, and tone for each AI response.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Mode Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Performance Mode</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Animations */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Animations</Label>
              <p className="text-xs text-muted-foreground">
                Show animated loading indicators (e.g. "Analyzing your message" blinking icon)
              </p>
            </div>
            <Switch
              checked={experimental.enableAnimations !== false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableAnimations: checked })}
            />
          </div>

          {/* Enable Performance Mode */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Ultra Performance Mode</Label>
              <p className="text-xs text-muted-foreground">
                Disable GPU-intensive visual effects for maximum performance
              </p>
            </div>
            <Switch
              checked={experimental.performanceMode || false}
              onCheckedChange={(checked) => handleExperimentalChange({ performanceMode: checked })}
            />
          </div>

          {/* Info Box */}
          {experimental.performanceMode && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-200">
                <strong>Disabled effects:</strong> Chameleon logo color-shift, memory icon pulse, avatar glows,
                background animations, and other GPU-intensive visual effects. GPU usage should be minimal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Message Statistics</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Show Message Stats (Main Toggle) */}
          <div className="flex items-center justify-between p-4 border-2 border-primary/30 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="space-y-1">
              <Label className="text-sm font-medium">💰 Show Detailed Message Stats</Label>
              <p className="text-xs text-muted-foreground">
                Display stats after each AI message: exact costs, tokens, performance metrics (desktop only, Advanced Mode)
              </p>
            </div>
            <Switch
              checked={experimental.streamingVisualization?.showDetailedStats !== false}
              onCheckedChange={(checked) =>
                handleExperimentalChange({
                  streamingVisualization: {
                    ...experimental.streamingVisualization,
                    showDetailedStats: checked
                  }
                })
              }
            />
          </div>

          {/* Stats Sections Toggles - Only show when stats are enabled */}
          {experimental.streamingVisualization?.showDetailedStats !== false && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-sm font-medium text-muted-foreground">Stats Sections to Show:</Label>
              <div className="grid grid-cols-2 gap-2">
                {/* Reasoning */}
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <span className="text-xs">🧠 Reasoning</span>
                  <Switch
                    checked={experimental.statsDisplay?.showReasoning !== false}
                    onCheckedChange={(checked) =>
                      handleExperimentalChange({
                        statsDisplay: { ...experimental.statsDisplay, showReasoning: checked }
                      })
                    }
                  />
                </div>
                {/* Cache */}
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <span className="text-xs">💾 Cache</span>
                  <Switch
                    checked={experimental.statsDisplay?.showCache !== false}
                    onCheckedChange={(checked) =>
                      handleExperimentalChange({
                        statsDisplay: { ...experimental.statsDisplay, showCache: checked }
                      })
                    }
                  />
                </div>
                {/* Native Tokens */}
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <span className="text-xs">📏 Native Tokens</span>
                  <Switch
                    checked={experimental.statsDisplay?.showNativeTokens !== false}
                    onCheckedChange={(checked) =>
                      handleExperimentalChange({
                        statsDisplay: { ...experimental.statsDisplay, showNativeTokens: checked }
                      })
                    }
                  />
                </div>
                {/* Performance */}
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <span className="text-xs">⚡ Performance</span>
                  <Switch
                    checked={experimental.statsDisplay?.showPerformance !== false}
                    onCheckedChange={(checked) =>
                      handleExperimentalChange({
                        statsDisplay: { ...experimental.statsDisplay, showPerformance: checked }
                      })
                    }
                  />
                </div>
                {/* Generation */}
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <span className="text-xs">🎛️ Generation</span>
                  <Switch
                    checked={experimental.statsDisplay?.showGeneration !== false}
                    onCheckedChange={(checked) =>
                      handleExperimentalChange({
                        statsDisplay: { ...experimental.statsDisplay, showGeneration: checked }
                      })
                    }
                  />
                </div>
                {/* Search */}
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <span className="text-xs">🔍 Search</span>
                  <Switch
                    checked={experimental.statsDisplay?.showSearch !== false}
                    onCheckedChange={(checked) =>
                      handleExperimentalChange({
                        statsDisplay: { ...experimental.statsDisplay, showSearch: checked }
                      })
                    }
                  />
                </div>
                {/* Efficiency */}
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <span className="text-xs">📈 Efficiency</span>
                  <Switch
                    checked={experimental.statsDisplay?.showEfficiency !== false}
                    onCheckedChange={(checked) =>
                      handleExperimentalChange({
                        statsDisplay: { ...experimental.statsDisplay, showEfficiency: checked }
                      })
                    }
                  />
                </div>
              </div>

              {/* Default Expand Options */}
              <div className="pt-2 border-t">
                <Label className="text-xs font-medium text-muted-foreground">Auto-expand sections:</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={experimental.statsDisplay?.defaultExpandReasoning !== false}
                      onChange={(e) =>
                        handleExperimentalChange({
                          statsDisplay: { ...experimental.statsDisplay, defaultExpandReasoning: e.target.checked }
                        })
                      }
                      className="rounded border-border"
                    />
                    🧠 Reasoning
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={experimental.statsDisplay?.defaultExpandCache || false}
                      onChange={(e) =>
                        handleExperimentalChange({
                          statsDisplay: { ...experimental.statsDisplay, defaultExpandCache: e.target.checked }
                        })
                      }
                      className="rounded border-border"
                    />
                    💾 Cache
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          {experimental.streamingVisualization?.showDetailedStats !== false && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Click section headers in stats to expand/collapse. Sections are hidden if they have no data. Toggle sections here to completely hide them.
              </p>
            </div>
          )}

          {/* Show Input Stats */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show Input Stats (Before Sending)</Label>
              <p className="text-xs text-muted-foreground">
                Display token count and estimated cost below the chat input before sending (desktop only)
              </p>
            </div>
            <Switch
              checked={experimental.showInputStats || false}
              onCheckedChange={(checked) => handleExperimentalChange({ showInputStats: checked })}
            />
          </div>

          {/* Info Box for Input Stats */}
          {experimental.showInputStats && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Shows:</strong> Character count, estimated tokens, estimated cost per message, and context window usage meter below chat input.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Tools Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Tools</h3>
        </div>

        <div className="space-y-4 pl-7">
          <p className="text-xs text-muted-foreground">
            Enable additional tools that the AI can use when Auto Tool Use is enabled. The AI will decide when to use these tools based on your questions.
          </p>

          {/* URL Fetch Tool */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-green-500/30 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-green-600 dark:text-green-400" />
                <Label className="text-sm font-medium">URL Fetch Tool</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Allow AI to fetch and read content from specific URLs you mention. Useful for analyzing articles, documentation, or web pages.
              </p>
            </div>
            <Switch
              checked={experimental.enableUrlFetchTool !== false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableUrlFetchTool: checked })}
            />
          </div>

          {/* YouTube Transcript Tool */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-500/30 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-600 dark:text-red-400" />
                <Label className="text-sm font-medium">YouTube Transcript Tool</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Allow AI to extract and read transcripts from YouTube videos. Great for summarizing videos or answering questions about video content.
              </p>
            </div>
            <Switch
              checked={experimental.enableYouTubeTool !== false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableYouTubeTool: checked })}
            />
          </div>

          {/* Weather Tool */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-blue-500/30 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label className="text-sm font-medium">Weather Tool</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Allow AI to get current weather conditions, forecasts, and air quality. Requires WEATHER_API_KEY environment variable.
              </p>
            </div>
            <Switch
              checked={experimental.enableWeatherTool !== false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableWeatherTool: checked })}
            />
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> These tools require Auto Tool Use to be enabled in Search settings. The AI will automatically decide when to use them based on your questions. Weather tool requires WEATHER_API_KEY environment variable; other tools need no additional API keys.
            </p>
          </div>
        </div>
      </div>

      {/* Rich Content Settings (Advanced Mode Only) */}
      {isAdvancedMode && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Rich Content Rendering</h3>
          </div>

          <div className="space-y-4 pl-7">
            <p className="text-xs text-muted-foreground">
              Control how AI responses display special content. Polls, timelines, tables, and math are always enabled. These features can be performance-intensive.
            </p>

            {/* Mermaid Diagrams */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <Label className="text-sm font-medium">Mermaid Diagrams</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Render flowcharts, sequence diagrams, and other Mermaid diagrams. Uses GPU for rendering.
                </p>
              </div>
              <Switch
                checked={experimental.enableMermaidDiagrams || false}
                onCheckedChange={(checked) => handleExperimentalChange({ enableMermaidDiagrams: checked })}
              />
            </div>

            {/* Code Block Syntax Highlighting */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <Label className="text-sm font-medium">Code Syntax Highlighting</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Show code blocks with syntax highlighting and copy button. Loads ~100KB extra bundle.
                </p>
              </div>
              <Switch
                checked={experimental.enableCodeBlockHighlighting || false}
                onCheckedChange={(checked) => handleExperimentalChange({ enableCodeBlockHighlighting: checked })}
              />
            </div>

            {/* Categorized Follow-up Suggestions */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <Label className="text-sm font-medium">Categorized Follow-up Suggestions</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Show category labels (Quick/Deep Dive/Related) for follow-up suggestions. Default: minimalistic view.
                </p>
              </div>
              <Switch
                checked={experimental.showCategorizedFollowUps || false}
                onCheckedChange={(checked) => handleExperimentalChange({ showCategorizedFollowUps: checked })}
              />
            </div>

            {/* Info Box */}
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-xs text-purple-800 dark:text-purple-200">
                <strong>Always enabled:</strong> Polls, timelines, progress bars, comparison cards, sortable tables, and LaTeX math rendering. Toggle the above for performance-heavy features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Memory Intelligence Settings (Only show if memory is enabled) */}
      {memorySettings.enabled && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Memory Intelligence</h3>
                <p className="text-xs text-muted-foreground">
                  Fine-tune how the AI decides when and what memories to retrieve
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-7">
              {/* Use Semantic Search */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Semantic Search</Label>
                  <p className="text-xs text-muted-foreground">
                    Use AI embeddings to find memories by meaning (recommended)
                  </p>
                </div>
                <Switch
                  checked={memorySettings.useSemanticSearch !== false}
                  onCheckedChange={(checked) => handleMemorySettingChange({ useSemanticSearch: checked })}
                />
              </div>

              {/* Always Retrieve for Personas */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Always Retrieve for Personas</Label>
                  <p className="text-xs text-muted-foreground">
                    Bypass query classification when chatting with personas
                  </p>
                </div>
                <Switch
                  checked={memorySettings.alwaysRetrieveForPersonas !== false}
                  onCheckedChange={(checked) => handleMemorySettingChange({ alwaysRetrieveForPersonas: checked })}
                />
              </div>

              {/* Classification Confidence Threshold */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Classification Confidence</Label>
                    <p className="text-xs text-muted-foreground">
                      Only skip memory if classifier is this confident it's factual
                    </p>
                  </div>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {((memorySettings.classificationConfidence ?? 0.8) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[(memorySettings.classificationConfidence ?? 0.8) * 100]}
                  onValueChange={([value]) => handleMemorySettingChange({ classificationConfidence: value / 100 })}
                  min={50}
                  max={99}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = retrieve more often (safer). Higher = skip more factual queries (saves tokens).
                </p>
              </div>

              {/* Similarity Threshold */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Similarity Threshold</Label>
                    <p className="text-xs text-muted-foreground">
                      Minimum similarity score to include a memory in results
                    </p>
                  </div>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {((memorySettings.similarityThreshold ?? 0.5) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[(memorySettings.similarityThreshold ?? 0.5) * 100]}
                  onValueChange={([value]) => handleMemorySettingChange({ similarityThreshold: value / 100 })}
                  min={20}
                  max={80}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more memories (may include less relevant). Higher = fewer but more relevant.
                </p>
              </div>

              {/* Minimum Relevance Score */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Minimum Relevance Score</Label>
                    <p className="text-xs text-muted-foreground">
                      Skip ALL memories if best match is below this score
                    </p>
                  </div>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {((memorySettings.minRelevanceScore ?? 0.3) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[(memorySettings.minRelevanceScore ?? 0.3) * 100]}
                  onValueChange={([value]) => handleMemorySettingChange({ minRelevanceScore: value / 100 })}
                  min={10}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Prevents irrelevant memories from being injected. Lower = allow more, higher = stricter filter.
                </p>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-xs text-purple-800 dark:text-purple-200">
                  <strong>How it works:</strong> When you send a message, the AI first classifies if it needs personal context.
                  If yes, it searches memories using semantic similarity. Only memories above the threshold are included.
                  If even the best match is too low, nothing is injected.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Streaming Visualization Settings (Advanced Mode Only) */}
      {isAdvancedMode && (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Streaming Visualization</h3>
                <p className="text-xs text-muted-foreground">
                  Advanced Mode only - Control what you see during AI responses
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-7">
              {/* Detailed Streaming Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Detailed Streaming Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Show full step-by-step progress with phases, sub-steps, timer, and progress bar.
                    When off, only shows current action and reasoning tokens.
                  </p>
                </div>
                <Switch
                  checked={experimental.showDetailedStreaming || false}
                  onCheckedChange={(checked) => handleExperimentalChange({ showDetailedStreaming: checked })}
                />
              </div>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Default:</strong> Shows only the current action (search, URL fetch, etc.) and reasoning tokens as they stream in.
                  Enable detailed mode to see the full visualization with all phases and timing information.
                </p>
              </div>

              {/* Extended Settings - Only visible when detailed mode is enabled */}
              {experimental.showDetailedStreaming && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-3">Fine-tune detailed streaming visualization:</p>
                  <StreamingSettingsPanel
                    settings={experimental.streamingVisualization || {}}
                    onSettingsChange={(streamingVisualization) =>
                      handleExperimentalChange({ streamingVisualization })
                    }
                    language={settings.language as "en" | "de" | "es"}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
