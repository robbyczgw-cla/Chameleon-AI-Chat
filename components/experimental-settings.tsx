"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp } from "@/contexts/app-context"
import { Brain, CaretDown, CaretUp, ChartBar, CloudSun, Code, Cpu, Flask, GitBranch, Heart, Lightning, Link, Monitor, Palette, Play, Robot, Sparkle, Warning, Wrench, YoutubeLogo } from "@phosphor-icons/react";
import { StreamingSettingsPanel } from "@/components/streaming-settings-panel"
import { Separator } from "@/components/ui/separator"
import { getUserSelectedModels } from "@/lib/model-preferences"
import { useEffect, useState } from "react"
import type { BackgroundAIModelsSettings } from "@/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslation } from "@/lib/i18n"

// Default models for background tasks
export const DEFAULT_BACKGROUND_MODELS: Required<BackgroundAIModelsSettings> = {
  titleGeneration: "openai/gpt-oss-20b",
  memoryExtraction: "openai/gpt-oss-20b",
  memoryConsolidation: "openai/gpt-oss-120b",
  queryClassification: "openai/gpt-oss-20b",
  promptHelper: "x-ai/grok-4.1-fast",
  personaGeneration: "x-ai/grok-4.1-fast",
  personalityAnalysis: "x-ai/grok-4.1-fast",
  conversationInsights: "x-ai/grok-4.1-fast",
  contextCompression: "google/gemini-3-flash-preview", // Fast + cheap for summarization
  followUpGeneration: "openai/gpt-oss-120b", // Primary model with fallback to x-ai/grok-4.1-fast
  followUpGenerationFallback: "x-ai/grok-4.1-fast", // Fallback for follow-up generation
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
  const currentLanguage = settings.language || "en"
  const { translations: tr } = useTranslation(currentLanguage)
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
        <Warning className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">{tr.labs.warningTitle}</h4>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            {tr.labs.warningDescription}
          </p>
        </div>
      </div>

      {/* Default Model Selection (Advanced Mode Only) */}
      {isAdvancedMode && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{tr.labs.defaultModel}</h3>
          </div>

          <div className="space-y-4 pl-7">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{tr.labs.defaultModelLabel}</Label>
<p className="text-xs text-muted-foreground">
                  {tr.labs.defaultModelDescription}
                </p>
              </div>
              <Select
                value={settings.defaultModel || "__system_default__"}
                onValueChange={(value) => updateSettings({ defaultModel: value === "__system_default__" ? undefined : value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Use system default (Gemini 3 Flash)" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] z-[9999]" position="popper" sideOffset={8} align="start">
                  <SelectItem value="__system_default__">Use system default (Gemini 3 Flash)</SelectItem>
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
                <strong>Tip:</strong> {tr.labs.defaultModelTip}
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
              <h3 className="text-lg font-semibold flex-1 text-left">{tr.labs.backgroundModels}</h3>
              {isBackgroundModelsOpen ? (
                <CaretUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <CaretDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                {tr.labs.backgroundModelsDescription}
              </p>

              {/* Text Generation Tasks */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkle className="h-4 w-4 text-purple-500" />
                  {tr.labs.textGenerationTasks}
                </h4>

                {/* Title Generation */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">{tr.labs.titleGeneration}</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">{tr.labs.titleGenerationDesc}</p>
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

                {/* Follow-Up Generation (Primary) */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Follow-Up Generation (Primary) ⚡ NEW</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Primary model for contextual follow-up questions</p>
                  <Select
                    value={backgroundModels.followUpGeneration || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("followUpGeneration", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.followUpGeneration})</SelectItem>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model} className="text-xs">{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Follow-Up Generation (Fallback) */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Follow-Up Generation (Fallback) ⚡ NEW</Label>
                  <p className="text-[10px] text-muted-foreground mb-1">Fallback model if primary fails</p>
                  <Select
                    value={backgroundModels.followUpGenerationFallback || "__default__"}
                    onValueChange={(v) => handleBackgroundModelChange("followUpGenerationFallback", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] z-[9999]">
                      <SelectItem value="__default__">Default ({DEFAULT_BACKGROUND_MODELS.followUpGenerationFallback})</SelectItem>
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
          <Flask className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{tr.labs.responseAnalysis}</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Response Analysis */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">{tr.labs.enableResponseAnalysis}</Label>
              <p className="text-xs text-muted-foreground">
                {tr.labs.enableResponseAnalysisDesc}
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

      {/* Emotion Detection Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">{tr.labs.emotionDetection}</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Emotion Detection */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-pink-500/30 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
            <div className="space-y-1 flex-1">
              <Label className="text-sm font-medium">{tr.labs.camiEmotionAwareness}</Label>
              <p className="text-xs text-muted-foreground">
                {tr.labs.emotionDetectionDesc}
                {settings.simpleMode ? ` ${tr.labs.emotionDetectionDescSimple}` : ` ${tr.labs.emotionDetectionDescAdvanced}`}
              </p>
            </div>
            <Switch
              checked={
                // If explicitly set by user, respect that choice
                experimental.enableEmotionDetection !== undefined
                  ? experimental.enableEmotionDetection
                  // Otherwise use defaults based on mode
                  : settings.simpleMode // Default ON in simple mode, OFF in advanced mode
              }
              onCheckedChange={(checked) => handleExperimentalChange({ enableEmotionDetection: checked })}
            />
          </div>

          {/* Info Box when enabled */}
          {(experimental.enableEmotionDetection !== undefined
            ? experimental.enableEmotionDetection
            : settings.simpleMode // Default ON in simple mode
          ) && (
            <div className="p-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg space-y-2">
              <p className="text-xs text-pink-800 dark:text-pink-200">
                <strong>{tr.labs.howItWorks}</strong> Cami detects emotional cues in your messages and adapts her response style:
              </p>
              <ul className="text-xs text-pink-800 dark:text-pink-200 space-y-1 list-disc list-inside">
                <li><strong>{tr.labs.emotionFrustrated.split(':')[0]}:</strong> {tr.labs.emotionFrustrated.split(':')[1]}</li>
                <li><strong>{tr.labs.emotionExcited.split(':')[0]}:</strong> {tr.labs.emotionExcited.split(':')[1]}</li>
                <li><strong>{tr.labs.emotionConfused.split(':')[0]}:</strong> {tr.labs.emotionConfused.split(':')[1]}</li>
                <li><strong>{tr.labs.emotionDiscouraged.split(':')[0]}:</strong> {tr.labs.emotionDiscouraged.split(':')[1]}</li>
                <li><strong>{tr.labs.emotionUrgent.split(':')[0]}:</strong> {tr.labs.emotionUrgent.split(':')[1]}</li>
              </ul>
            </div>
          )}

          {/* Example */}
          {(experimental.enableEmotionDetection !== undefined
            ? experimental.enableEmotionDetection
            : settings.simpleMode // Default ON in simple mode
          ) && (
            <div className="p-3 bg-muted/50 border rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Example:</p>
              <div className="space-y-1 text-xs">
                <p className="text-foreground"><strong>You:</strong> "Great, another error message. Just what I needed today."</p>
                <p className="text-muted-foreground"><strong>Cami:</strong> "Ugh, I feel you - error messages are the worst 😅 Let me help fix this..."</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Mode Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightning className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{tr.labs.performanceMode}</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Enable Animations */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">{tr.labs.enableAnimations}</Label>
              <p className="text-xs text-muted-foreground">
                {tr.labs.enableAnimationsDesc}
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
              <Label className="text-sm font-medium">{tr.labs.ultraPerformanceMode}</Label>
              <p className="text-xs text-muted-foreground">
                {tr.labs.ultraPerformanceModeDesc}
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
                {tr.labs.disabledEffects}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message Stats Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ChartBar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{tr.labs.messageStatistics}</h3>
        </div>

        <div className="space-y-4 pl-7">
          {/* Show Message Stats (Main Toggle) */}
          <div className="flex items-center justify-between p-4 border-2 border-primary/30 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="space-y-1">
              <Label className="text-sm font-medium">{tr.labs.showDetailedStats}</Label>
              <p className="text-xs text-muted-foreground">
                {tr.labs.showDetailedStatsDesc}
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
          <h3 className="text-lg font-semibold">{tr.labs.aiTools}</h3>
        </div>

        <div className="space-y-4 pl-7">
          <p className="text-xs text-muted-foreground">
            {tr.labs.aiToolsDescription}
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
                <YoutubeLogo className="h-4 w-4 text-red-600 dark:text-red-400" />
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

          {/* Auto Context Compression */}
          <div className="flex items-center justify-between p-4 border rounded-lg border-purple-500/30 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Lightning className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <Label className="text-sm font-medium">Auto Context Compression</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically summarize older messages when chat gets long. Allows unlimited conversation length without hitting context limits.
              </p>
            </div>
            <Switch
              checked={experimental.enableAutoContextCompression !== false}
              onCheckedChange={(checked) => handleExperimentalChange({ enableAutoContextCompression: checked })}
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

      {/* Agent Mode Section (Advanced Mode Only) */}
      {isAdvancedMode && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Robot className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{tr.labs.agentMode}</h3>
          </div>

          <div className="space-y-4 pl-7">
            <p className="text-xs text-muted-foreground">
              {tr.labs.agentModeDescription}
            </p>

            {/* Max Iterations Slider */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{tr.labs.maxToolCalls}</Label>
                  <p className="text-xs text-muted-foreground">
                    {tr.labs.maxToolCallsDesc}
                  </p>
                </div>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {experimental.agentMode?.maxIterations || 10}
                </span>
              </div>
              <Slider
                value={[experimental.agentMode?.maxIterations || 10]}
                onValueChange={([value]) =>
                  handleExperimentalChange({
                    agentMode: { ...experimental.agentMode, enabled: experimental.agentMode?.enabled || false, maxIterations: value, showTaskPlan: experimental.agentMode?.showTaskPlan ?? true, autoVerify: experimental.agentMode?.autoVerify || false },
                  })
                }
                min={3}
                max={15}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {tr.labs.maxToolCallsNote}
              </p>
            </div>

            {/* Show Task Plan */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{tr.labs.showTaskPlan}</Label>
                <p className="text-xs text-muted-foreground">
                  {tr.labs.showTaskPlanDesc}
                </p>
              </div>
              <Switch
                checked={experimental.agentMode?.showTaskPlan ?? true}
                onCheckedChange={(checked) =>
                  handleExperimentalChange({
                    agentMode: { ...experimental.agentMode, enabled: experimental.agentMode?.enabled || false, maxIterations: experimental.agentMode?.maxIterations || 10, showTaskPlan: checked, autoVerify: experimental.agentMode?.autoVerify || false },
                  })
                }
              />
            </div>

            {/* Tip */}
            <p className="text-xs text-muted-foreground italic">
              {tr.labs.agentModeTip}
            </p>
          </div>
        </div>
      )}

      {/* Rich Content Settings (Advanced Mode Only) */}
      {isAdvancedMode && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{tr.labs.richContent}</h3>
          </div>

          <div className="space-y-4 pl-7">
            <p className="text-xs text-muted-foreground">
              {tr.labs.richContentDescription}
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
                  <Code className="h-4 w-4 text-green-600 dark:text-green-400" />
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

            {/* Live Code Sandbox */}
            <div className="flex items-center justify-between p-4 border rounded-lg border-blue-500/30 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <Label className="text-sm font-medium">Live Code Sandbox ⚡ NEW</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Run React, HTML, and Vue code directly in chat. Adds &quot;Run&quot; button to code blocks. Auto-enables syntax highlighting. Loads ~300KB on first use, runs client-side.
                </p>
              </div>
              <Switch
                checked={experimental.enableLiveCodeSandbox || false}
                onCheckedChange={(checked) => {
                  // Auto-enable syntax highlighting when sandbox is enabled (required for Run button)
                  if (checked && !experimental.enableCodeBlockHighlighting) {
                    handleExperimentalChange({ enableLiveCodeSandbox: checked, enableCodeBlockHighlighting: true })
                  } else {
                    handleExperimentalChange({ enableLiveCodeSandbox: checked })
                  }
                }}
              />
            </div>

            {/* Dedicated Follow-Up Model */}
            <div className="flex items-center justify-between p-4 border rounded-lg border-emerald-500/30 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Lightning className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <Label className="text-sm font-medium">Dedicated Follow-Up Model ⚡ NEW</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use dedicated fast model for follow-up suggestions (parallel generation, 60% faster, 40x cheaper). Enabled by default.
                </p>
              </div>
              <Switch
                checked={experimental.useDedicatedFollowUpModel !== false}
                onCheckedChange={(checked) => handleExperimentalChange({ useDedicatedFollowUpModel: checked })}
              />
            </div>

            {/* Categorized Follow-up Suggestions */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
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
                <h3 className="text-lg font-semibold">{tr.labs.memoryIntelligence}</h3>
                <p className="text-xs text-muted-foreground">
                  {tr.labs.memoryIntelligenceDesc}
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
                      Skip memory retrieval when classifier confidence exceeds this threshold
                    </p>
                  </div>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {((memorySettings.classificationConfidence ?? 0.7) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[(memorySettings.classificationConfidence ?? 0.7) * 100]}
                  onValueChange={([value]) => handleMemorySettingChange({ classificationConfidence: value / 100 })}
                  min={50}
                  max={95}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = skip more queries (fewer memories injected). Higher = inject memories more often.
                  <br/>
                  <span className="text-amber-600 dark:text-amber-400">Tip: 70% is optimal. Above 85% causes over-retrieval.</span>
                </p>
              </div>

              {/* Similarity Threshold */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Similarity Threshold</Label>
                    <p className="text-xs text-muted-foreground">
                      Minimum semantic similarity to include a memory
                    </p>
                  </div>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {((memorySettings.similarityThreshold ?? 0.65) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[(memorySettings.similarityThreshold ?? 0.65) * 100]}
                  onValueChange={([value]) => handleMemorySettingChange({ similarityThreshold: value / 100 })}
                  min={40}
                  max={85}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more memories (may include less relevant). Higher = fewer but more relevant.
                  <br/>
                  <span className="text-amber-600 dark:text-amber-400">Tip: 65% provides good quality. Below 50% causes noise.</span>
                </p>
              </div>

              {/* Minimum Relevance Score */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Minimum Relevance Score</Label>
                    <p className="text-xs text-muted-foreground">
                      Skip ALL memories if best match is below this (safety net)
                    </p>
                  </div>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {((memorySettings.minRelevanceScore ?? 0.45) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[(memorySettings.minRelevanceScore ?? 0.45) * 100]}
                  onValueChange={([value]) => handleMemorySettingChange({ minRelevanceScore: value / 100 })}
                  min={20}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  This is your safety net - if no memory is relevant enough, inject nothing.
                  <br/>
                  <span className="text-amber-600 dark:text-amber-400">Tip: 45% is optimal. Below 30% lets irrelevant memories through.</span>
                </p>
              </div>

              {/* Info Box */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-2">
                <p className="text-xs text-purple-800 dark:text-purple-200">
                  <strong>How it works (Self-RAG inspired):</strong>
                </p>
                <ol className="text-xs text-purple-800 dark:text-purple-200 list-decimal list-inside space-y-1">
                  <li>AI classifies your query: factual (skip memory), personal (retrieve), or ambiguous (skip by default)</li>
                  <li>If retrieval needed: search memories by semantic similarity + recency + importance</li>
                  <li>Only memories above similarity threshold are considered</li>
                  <li>If best match is below min relevance, nothing is injected (safety net)</li>
                </ol>
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
                <h3 className="text-lg font-semibold">{tr.labs.streamingVisualization}</h3>
                <p className="text-xs text-muted-foreground">
                  {tr.labs.streamingVisualizationDesc}
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-7">
              {/* Detailed Streaming Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{tr.labs.detailedStreaming}</Label>
                  <p className="text-xs text-muted-foreground">
                    {tr.labs.detailedStreamingDesc}
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
