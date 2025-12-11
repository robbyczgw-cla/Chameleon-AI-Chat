"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useApp } from "@/contexts/app-context"
import type { ModelParameters } from "@/types"
import { ModelManagement } from "@/components/model-management"
import { ShareDialog } from "@/components/share-dialog"
import { Share2 } from "lucide-react"

interface AdvancedSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdvancedSettingsDialog({ open, onOpenChange }: AdvancedSettingsDialogProps) {
  const { settings, updateSettings, chats, currentChatId } = useApp()
  const [isShareOpen, setIsShareOpen] = useState(false)

  const currentChat = chats.find((chat) => chat.id === currentChatId)

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
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

          <TabsContent value="share" className="flex-1 overflow-y-auto mt-3">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Share2 className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Share This Chat</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Create a public link to share this conversation with others
                </p>
              </div>
              {currentChat && currentChat.messages && currentChat.messages.length > 0 ? (
                <Button
                  onClick={() => setIsShareOpen(true)}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share Chat
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start a conversation first to share it
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Share Dialog */}
        {currentChat && (
          <ShareDialog
            open={isShareOpen}
            onOpenChange={setIsShareOpen}
            chatId={currentChat.id}
            chatTitle={currentChat.title}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
