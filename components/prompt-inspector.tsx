"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Chat, Copy, FileCode, Graph } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export interface InspectorData {
  systemPrompt: string
  messages: Array<{ role: string; content: string }>
  modelParams: {
    model: string
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
    // Reasoning parameters
    reasoning?: boolean
    reasoningDepth?: "minimal" | "low" | "medium" | "high"
  }
  // Tool settings
  toolSettings?: {
    enableAutoToolUse: boolean
    searchProvider?: string
    enableUrlFetchTool?: boolean
    enableYouTubeTool?: boolean
    enableWeatherTool?: boolean
  }
  rawRequest?: string
  rawResponse?: string
  timestamp: number
}

interface PromptInspectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: InspectorData | null
}

export function PromptInspector({ open, onOpenChange, data }: PromptInspectorProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("system-prompt")

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Kopiert!",
      description: `${label} wurde in die Zwischenablage kopiert`,
    })
  }

  if (!data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              Prompt Inspector
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>Keine Daten verfügbar. Sende eine Nachricht, um die Details zu sehen.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Prompt Inspector
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Analysiere den finalen System-Prompt, Nachrichten-Historie und API-Anfragen
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="system-prompt" className="text-xs sm:text-sm">
              <Chat className="h-4 w-4 mr-1.5" />
              System Prompt
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs sm:text-sm">
              <Chat className="h-4 w-4 mr-1.5" />
              Nachrichten
            </TabsTrigger>
            <TabsTrigger value="parameters" className="text-xs sm:text-sm">
              <Graph className="h-4 w-4 mr-1.5" />
              Parameter
            </TabsTrigger>
            <TabsTrigger value="raw" className="text-xs sm:text-sm">
              <FileCode className="h-4 w-4 mr-1.5" />
              Raw API
            </TabsTrigger>
          </TabsList>

          {/* System Prompt Tab */}
          <TabsContent value="system-prompt" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Finaler System Prompt</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(data.systemPrompt, "System Prompt")}
                className="gap-2"
              >
                <Copy className="h-3.5 w-3.5" />
                Kopieren
              </Button>
            </div>
            <ScrollArea className="h-[400px] w-full rounded-lg border bg-muted/30 p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {data.systemPrompt}
              </pre>
            </ScrollArea>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Nachrichten-Historie ({data.messages.length} Nachrichten)
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(data.messages, null, 2),
                    "Nachrichten-Historie"
                  )
                }
                className="gap-2"
              >
                <Copy className="h-3.5 w-3.5" />
                Kopieren
              </Button>
            </div>
            <ScrollArea className="h-[400px] w-full rounded-lg border bg-muted/30 p-4">
              <div className="space-y-4">
                {data.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg p-3 border",
                      msg.role === "system" && "bg-purple-500/10 border-purple-500/30",
                      msg.role === "user" && "bg-blue-500/10 border-blue-500/30",
                      msg.role === "assistant" && "bg-green-500/10 border-green-500/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={cn(
                          "text-xs font-bold uppercase px-2 py-0.5 rounded",
                          msg.role === "system" && "bg-purple-500 text-white",
                          msg.role === "user" && "bg-blue-500 text-white",
                          msg.role === "assistant" && "bg-green-500 text-white"
                        )}
                      >
                        {msg.role}
                      </span>
                      <span className="text-xs text-muted-foreground">Nachricht {idx + 1}</span>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                      {msg.content}
                    </pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Modell-Parameter</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(JSON.stringify(data.modelParams, null, 2), "Parameter")
                }
                className="gap-2"
              >
                <Copy className="h-3.5 w-3.5" />
                Kopieren
              </Button>
            </div>
            <ScrollArea className="h-[400px] w-full rounded-lg border bg-muted/30 p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Modell</p>
                    <p className="text-sm font-mono bg-background/50 p-2 rounded border">
                      {data.modelParams.model}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Temperature</p>
                    <p className="text-sm font-mono bg-background/50 p-2 rounded border">
                      {data.modelParams.temperature}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Max Tokens</p>
                    <p className="text-sm font-mono bg-background/50 p-2 rounded border">
                      {data.modelParams.maxTokens}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Top P</p>
                    <p className="text-sm font-mono bg-background/50 p-2 rounded border">
                      {data.modelParams.topP}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Frequency Penalty</p>
                    <p className="text-sm font-mono bg-background/50 p-2 rounded border">
                      {data.modelParams.frequencyPenalty}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Presence Penalty</p>
                    <p className="text-sm font-mono bg-background/50 p-2 rounded border">
                      {data.modelParams.presencePenalty}
                    </p>
                  </div>
                </div>

                {/* Reasoning Section */}
                <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <h4 className="text-xs font-semibold mb-3 text-amber-600 dark:text-amber-400">Reasoning / Thinking</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Reasoning Enabled</p>
                      <p className={cn(
                        "text-sm font-mono bg-background/50 p-2 rounded border",
                        data.modelParams.reasoning ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {data.modelParams.reasoning ? "✓ Yes" : "✗ No"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Reasoning Depth</p>
                      <p className="text-sm font-mono bg-background/50 p-2 rounded border">
                        {data.modelParams.reasoningDepth || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tools Section */}
                {data.toolSettings && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <h4 className="text-xs font-semibold mb-3 text-blue-600 dark:text-blue-400">Tools / Auto Tool Use</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Auto Tool Use</p>
                        <p className={cn(
                          "text-sm font-mono bg-background/50 p-2 rounded border",
                          data.toolSettings.enableAutoToolUse ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {data.toolSettings.enableAutoToolUse ? "✓ Enabled" : "✗ Disabled"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Search Provider</p>
                        <p className="text-sm font-mono bg-background/50 p-2 rounded border capitalize">
                          {data.toolSettings.searchProvider || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">URL Fetch</p>
                        <p className={cn(
                          "text-sm font-mono bg-background/50 p-2 rounded border",
                          data.toolSettings.enableUrlFetchTool ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        )}>
                          {data.toolSettings.enableUrlFetchTool ? "✓" : "✗"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">YouTube</p>
                        <p className={cn(
                          "text-sm font-mono bg-background/50 p-2 rounded border",
                          data.toolSettings.enableYouTubeTool ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        )}>
                          {data.toolSettings.enableYouTubeTool ? "✓" : "✗"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Weather</p>
                        <p className={cn(
                          "text-sm font-mono bg-background/50 p-2 rounded border",
                          data.toolSettings.enableWeatherTool ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                        )}>
                          {data.toolSettings.enableWeatherTool ? "✓" : "✗"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-3 bg-background/50 rounded-lg border">
                  <h4 className="text-xs font-semibold mb-2">Vollständiger Parameter-Dump</h4>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify({ ...data.modelParams, toolSettings: data.toolSettings }, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Raw API Tab */}
          <TabsContent value="raw" className="space-y-3">
            <div className="space-y-4">
              {/* Raw Request */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">API Request</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const requestData: Record<string, unknown> = {
                        model: data.modelParams.model,
                        messages: data.messages,
                        temperature: data.modelParams.temperature,
                        max_tokens: data.modelParams.maxTokens,
                        top_p: data.modelParams.topP,
                        frequency_penalty: data.modelParams.frequencyPenalty,
                        presence_penalty: data.modelParams.presencePenalty,
                      }
                      if (data.modelParams.reasoning) {
                        requestData.reasoning = true
                        requestData.reasoningDepth = data.modelParams.reasoningDepth
                      }
                      if (data.toolSettings) {
                        requestData.enableAutoToolUse = data.toolSettings.enableAutoToolUse
                        requestData.searchProvider = data.toolSettings.searchProvider
                        requestData.enableUrlFetchTool = data.toolSettings.enableUrlFetchTool
                        requestData.enableYouTubeTool = data.toolSettings.enableYouTubeTool
                        requestData.enableWeatherTool = data.toolSettings.enableWeatherTool
                      }
                      copyToClipboard(JSON.stringify(requestData, null, 2), "API Request")
                    }}
                    className="gap-2"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Kopieren
                  </Button>
                </div>
                <ScrollArea className="h-[220px] w-full rounded-lg border bg-muted/30 p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {JSON.stringify(
                      {
                        model: data.modelParams.model,
                        messages: data.messages,
                        temperature: data.modelParams.temperature,
                        max_tokens: data.modelParams.maxTokens,
                        top_p: data.modelParams.topP,
                        frequency_penalty: data.modelParams.frequencyPenalty,
                        presence_penalty: data.modelParams.presencePenalty,
                        ...(data.modelParams.reasoning && {
                          reasoning: true,
                          reasoningDepth: data.modelParams.reasoningDepth,
                        }),
                        ...(data.toolSettings && {
                          enableAutoToolUse: data.toolSettings.enableAutoToolUse,
                          searchProvider: data.toolSettings.searchProvider,
                          enableUrlFetchTool: data.toolSettings.enableUrlFetchTool,
                          enableYouTubeTool: data.toolSettings.enableYouTubeTool,
                          enableWeatherTool: data.toolSettings.enableWeatherTool,
                        }),
                      },
                      null,
                      2
                    )}
                  </pre>
                </ScrollArea>
              </div>

              {/* Raw Response */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">API Response</h3>
                  {data.rawResponse && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(data.rawResponse || "", "API Response")}
                      className="gap-2"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Kopieren
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[180px] w-full rounded-lg border bg-muted/30 p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {data.rawResponse || "Noch keine Antwort empfangen..."}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Aufgezeichnet:{" "}
            {new Date(data.timestamp).toLocaleString("de-DE", {
              dateStyle: "short",
              timeStyle: "medium",
            })}
          </p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
