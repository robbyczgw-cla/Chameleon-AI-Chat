"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/contexts/app-context"
import type { ModelParameters } from "@/types"
import { ModelManagement } from "@/components/model-management"

interface AdvancedSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdvancedSettingsDialog({ open, onOpenChange }: AdvancedSettingsDialogProps) {
  const { settings, updateSettings } = useApp()

  const params: ModelParameters = settings.modelParameters || {
    temperature: 0.7,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
    maxTokens: 4096,
  }

  const updateParam = (key: keyof ModelParameters, value: number | string[] | undefined) => {
    updateSettings({
      modelParameters: {
        ...params,
        [key]: value,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Advanced Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="parameters" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters" className="flex-1 overflow-y-auto mt-3 space-y-3 pb-4">
            <div className="space-y-1.5">
              <Label className="text-sm sm:text-base">Temperature: {params.temperature}</Label>
              <Slider
                value={[params.temperature]}
                onValueChange={([v]) => updateParam("temperature", v)}
                min={0}
                max={2}
                step={0.1}
                className="touch-none"
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness. Lower values make output more focused and deterministic.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm sm:text-base">Top P: {params.topP}</Label>
              <Slider value={[params.topP]} onValueChange={([v]) => updateParam("topP", v)} min={0} max={1} step={0.05} className="touch-none" />
              <p className="text-xs text-muted-foreground">
                Controls diversity via nucleus sampling. Lower values make output more focused.
              </p>
            </div>

            {params.topK !== undefined && (
              <div className="space-y-1.5">
                <Label className="text-sm sm:text-base">Top K: {params.topK}</Label>
                <Slider
                  value={[params.topK]}
                  onValueChange={([v]) => updateParam("topK", v)}
                  min={1}
                  max={100}
                  step={1}
                  className="touch-none"
                />
                <p className="text-xs text-muted-foreground">Limits the number of tokens to consider at each step.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm sm:text-base">Frequency Penalty: {params.frequencyPenalty}</Label>
              <Slider
                value={[params.frequencyPenalty]}
                onValueChange={([v]) => updateParam("frequencyPenalty", v)}
                min={-2}
                max={2}
                step={0.1}
                className="touch-none"
              />
              <p className="text-xs text-muted-foreground">
                Reduces repetition. Positive values penalize tokens based on frequency.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm sm:text-base">Presence Penalty: {params.presencePenalty}</Label>
              <Slider
                value={[params.presencePenalty]}
                onValueChange={([v]) => updateParam("presencePenalty", v)}
                min={-2}
                max={2}
                step={0.1}
                className="touch-none"
              />
              <p className="text-xs text-muted-foreground">
                Encourages new topics. Positive values penalize tokens that have appeared.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm sm:text-base">Max Tokens: {params.maxTokens}</Label>
              <Slider
                value={[params.maxTokens]}
                onValueChange={([v]) => updateParam("maxTokens", v)}
                min={256}
                max={32000}
                step={256}
                className="touch-none"
              />
              <p className="text-xs text-muted-foreground">Maximum length of the generated response.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm sm:text-base">Stop Sequences</Label>
              <Textarea
                value={params.stopSequences?.join("\n") || ""}
                onChange={(e) =>
                  updateParam(
                    "stopSequences",
                    e.target.value.split("\n").filter((s) => s.trim()),
                  )
                }
                placeholder="Enter stop sequences (one per line)"
                rows={2}
                className="text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Sequences where the model will stop generating. One per line.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm sm:text-base">System Prompt</Label>
              <Textarea
                value={settings.systemPrompt}
                onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
                placeholder="You are a helpful AI assistant..."
                rows={4}
                className="font-mono text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Instructions that guide the model's behavior and personality.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="models" className="flex-1 overflow-y-auto mt-3">
            <ModelManagement />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
