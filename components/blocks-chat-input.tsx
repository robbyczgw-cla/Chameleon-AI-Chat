"use client"

/**
 * BlocksChatInput - Modern chat input inspired by blocks.so
 * @see https://github.com/ephraimduncan/blocks - Original inspiration by Ephraim Duncan
 *
 * Features:
 * - Expandable textarea (compact → expanded on multiline)
 * - Inline action buttons (web search, reasoning toggle)
 * - Quick prompt pills for conversation starters
 * - Clean, minimal design with violet accent colors
 *
 * Note: This component does NOT handle streaming itself. It dispatches to
 * SimpleChatInput via the "sendQuickMessage" event to avoid component
 * unmount issues when the UI switches from welcome to chat view.
 */

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { REASONING_MODELS } from "@/lib/openrouter"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { languageService } from "@/lib/languages"
import type { FileAttachment } from "@/lib/file-handler"
import type { Persona } from "@/lib/personas"
import { useDraft } from "@/hooks/use-draft"
import {
  Send,
  Square,
  Globe,
  Lightbulb,
  ArrowUp,
  Sparkles,
  Paperclip,
  Image,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BlocksChatInputProps {
  selectedPersona?: Persona
  profileContext?: string
  webSearchEnabled?: boolean
  overrideModel?: string
  quickPrompts?: string[]
  onQuickPrompt?: (prompt: string) => void
}

export function BlocksChatInput({
  selectedPersona,
  profileContext,
  webSearchEnabled: initialWebSearchEnabled,
  overrideModel,
  quickPrompts = [],
  onQuickPrompt,
}: BlocksChatInputProps = {}) {
  const { currentChatId, createChat, settings, isChatLoading } = useApp()

  // Draft auto-save system
  const { draft, saveDraft, clearDraft, isRestored } = useDraft(currentChatId)
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Restore draft when hook is ready
  useEffect(() => {
    if (isRestored && draft && !input) {
      setInput(draft)
    }
  }, [isRestored, draft])

  const [language] = useState(languageService.getLanguage())
  const { toast } = useToast()

  // Load web search state from settings context (for UI toggle display)
  // Default is TRUE unless user explicitly disabled it
  const [webSearchEnabled, setWebSearchEnabled] = useState(() => {
    if (typeof window === "undefined") return initialWebSearchEnabled ?? true

    // Check settings context first (preferred - always enabled by default unless user disables)
    if (settings.enableAutoToolUse !== undefined) {
      return settings.enableAutoToolUse
    }

    // Fallback to old localStorage key for migration
    const saved = localStorage.getItem("chameleon-web-search-enabled")
    if (saved !== null) {
      return saved === "true"
    }

    return initialWebSearchEnabled ?? true
  })

  // Load reasoning state from localStorage (for UI toggle display)
  const [reasoningEnabled, setReasoningEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    const saved = localStorage.getItem("chameleon-reasoning-enabled")
    return saved === "true"
  })

  // Reasoning toggle is now available for ALL models
  // OpenRouter gracefully ignores the reasoning parameter if model doesn't support it
  const modelSupportsReasoning = true // Always true - let OpenRouter handle model compatibility

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Save settings to localStorage and settings context (SimpleChatInput will read these)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chameleon-web-search-enabled", String(webSearchEnabled))
      localStorage.setItem("chameleon-reasoning-enabled", String(reasoningEnabled))

      // Sync to settings context if value changed
      const settingsStr = localStorage.getItem("settings")
      if (settingsStr) {
        try {
          const currentSettings = JSON.parse(settingsStr)
          if (currentSettings.enableAutoToolUse !== webSearchEnabled) {
            currentSettings.enableAutoToolUse = webSearchEnabled
            localStorage.setItem("settings", JSON.stringify(currentSettings))
          }
        } catch (e) {
          console.warn("[BlocksChatInput] Failed to sync web search to settings:", e)
        }
      }
    }
  }, [webSearchEnabled, reasoningEnabled])

  // Determine if input is expanded (multiline or long)
  const isExpanded = input.length > 80 || input.includes("\n")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isChatLoading) return

    const userMessage = input.trim()
    setInput("")
    clearDraft()

    // Create chat if needed, then dispatch to SimpleChatInput to handle streaming
    // This prevents the component unmount from killing the stream
    if (!currentChatId) {
      createChat(model)
    }

    // Small delay to let the chat be created and UI switch to SimpleChatInput
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sendQuickMessage", { detail: userMessage }))
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    // Handle file attachments
    toast({
      title: language === "de" ? "Dateien angehängt" : "Files attached",
      description: language === "de"
        ? `${files.length} Datei(en) bereit zum Senden`
        : `${files.length} file(s) ready to send`,
    })
  }

  const handleQuickPromptClick = (prompt: string) => {
    if (onQuickPrompt) {
      onQuickPrompt(prompt)
    } else {
      setInput(prompt)
      setTimeout(() => formRef.current?.requestSubmit(), 50)
    }
  }

  // Stop generation by dispatching event to SimpleChatInput
  const stopGeneration = () => {
    window.dispatchEvent(new CustomEvent("stopGeneration"))
  }

  return (
    <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-2xl mx-auto">
        {/* Main Input Container - Blocks Style */}
        <form ref={formRef} onSubmit={handleSubmit}>
          <div
            className={cn(
              "relative rounded-2xl border bg-background shadow-lg transition-all duration-200",
              "border-border/60 hover:border-violet-300/60 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20",
              isExpanded && "rounded-3xl"
            )}
          >
            {/* Input Area */}
            <div className={cn(
              "grid gap-2 p-3",
              isExpanded ? "grid-rows-[1fr_auto]" : "grid-cols-[1fr_auto] items-center"
            )}>
              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  saveDraft(e.target.value)
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedPersona
                    ? language === "de"
                      ? `Frag ${selectedPersona.name}...`
                      : `Ask ${selectedPersona.name}...`
                    : language === "de"
                    ? "Wie kann ich dir helfen?"
                    : "How can I help you today?"
                }
                className={cn(
                  "resize-none border-0 bg-transparent focus-visible:ring-0 p-0 min-h-[24px] text-sm sm:text-base",
                  isExpanded ? "min-h-[80px]" : "min-h-[24px]"
                )}
                rows={1}
                disabled={isChatLoading}
              />

              {/* Action Buttons Row */}
              <div className={cn(
                "flex items-center gap-1",
                isExpanded ? "justify-between pt-2 border-t border-border/40" : "justify-end"
              )}>
                {/* Left Actions - Only show when expanded */}
                {isExpanded && (
                  <div className="flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                          <Image className="h-4 w-4 mr-2" />
                          Upload image
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                )}

                {/* Right Actions */}
                <div className="flex items-center gap-1">
                  {/* Reasoning Toggle - Only if model supports it */}
                  {modelSupportsReasoning && (
                    <Button
                      type="button"
                      variant={reasoningEnabled ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full",
                        reasoningEnabled && "bg-amber-500 hover:bg-amber-600 text-white"
                      )}
                      onClick={() => setReasoningEnabled(!reasoningEnabled)}
                      title={reasoningEnabled ? "Reasoning enabled" : "Enable reasoning"}
                    >
                      <Lightbulb className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Web Search Toggle */}
                  <Button
                    type="button"
                    variant={webSearchEnabled ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      webSearchEnabled && "bg-blue-500 hover:bg-blue-600 text-white"
                    )}
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    title={webSearchEnabled ? "Web search enabled" : "Enable web search"}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>

                  {/* Send/Stop Button */}
                  {isChatLoading ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full"
                      onClick={stopGeneration}
                    >
                      <Square className="h-3.5 w-3.5" />
                    </Button>
                  ) : input.trim() ? (
                    <Button
                      type="submit"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Quick Prompts - Blocks Style */}
        {quickPrompts.length > 0 && !isChatLoading && !input && (
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {quickPrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleQuickPromptClick(prompt)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm",
                  "border border-border/60 bg-background/50 backdrop-blur-sm",
                  "hover:border-violet-300 hover:bg-violet-500/5 transition-all",
                  "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="h-3 w-3 text-violet-500" />
                <span className="truncate max-w-[150px] sm:max-w-[200px]">{prompt}</span>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
