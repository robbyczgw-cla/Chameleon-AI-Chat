"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useApp } from "@/contexts/app-context"
import { FlaskRound, AlertTriangle, Zap, Monitor, Brain } from "lucide-react"
import { StreamingSettingsPanel } from "@/components/streaming-settings-panel"
import { Separator } from "@/components/ui/separator"

export function ExperimentalSettings() {
  const { settings, updateSettings } = useApp()
  const experimental = settings.experimental || {}
  const memorySettings = settings.memorySettings || {}
  const isAdvancedMode = !settings.simpleMode

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
                  Advanced Mode only - Fine-tune what streaming details are displayed
                </p>
              </div>
            </div>

            <div className="pl-7">
              <StreamingSettingsPanel
                settings={experimental.streamingVisualization || {}}
                onSettingsChange={(streamingVisualization) =>
                  handleExperimentalChange({ streamingVisualization })
                }
                language={settings.language as "en" | "de" | "es"}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
