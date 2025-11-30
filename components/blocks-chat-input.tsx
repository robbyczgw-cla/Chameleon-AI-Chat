"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Message } from "@/types"
import { streamChatMessage, REASONING_MODELS } from "@/lib/openrouter"
import { searchWeb, formatSearchResults as formatTavilyResults } from "@/lib/tavily"
import { searchWithSerper, formatSearchResults as formatSerperResults } from "@/lib/serper"
import type { SearchResponse } from "@/lib/serper"
import { useToast } from "@/hooks/use-toast"
import { generateUUID, cn } from "@/lib/utils"
import { supabaseSync } from "@/lib/supabase/sync"
import { estimateTokens, calculateCost } from "@/lib/token-tracker"
import { languageService, getTranslation } from "@/lib/languages"
import { extractTextFromAttachments, type FileAttachment } from "@/lib/file-handler"
import type { Persona } from "@/lib/personas"
import { getRAGContext } from "@/lib/rag-service"
import { memoryService } from "@/lib/memory-service"
import { useDraft } from "@/hooks/use-draft"
import {
  Send,
  Square,
  Globe,
  Lightbulb,
  Mic,
  Paperclip,
  Image,
  Sparkles,
  Zap,
  ArrowUp,
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
  const { currentChatId, addMessage, createChat, settings, chats, setChats, user, isChatLoading, setIsChatLoading } = useApp()

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

  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const [language, setLanguage] = useState(languageService.getLanguage())
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Load web search state from localStorage
  const [webSearchEnabled, setWebSearchEnabled] = useState(() => {
    if (typeof window === "undefined") return initialWebSearchEnabled ?? true
    const saved = localStorage.getItem("chameleon-web-search-enabled")
    if (saved !== null) {
      return saved === "true"
    }
    return initialWebSearchEnabled ?? true
  })

  // Load reasoning state from localStorage
  const [reasoningEnabled, setReasoningEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    const saved = localStorage.getItem("chameleon-reasoning-enabled")
    return saved === "true"
  })

  // Check if current model supports reasoning
  const model = overrideModel || settings.selectedModel || "x-ai/grok-4.1-fast"
  const modelSupportsReasoning = REASONING_MODELS.has(model)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chameleon-web-search-enabled", String(webSearchEnabled))
      localStorage.setItem("chameleon-reasoning-enabled", String(reasoningEnabled))
    }
  }, [webSearchEnabled, reasoningEnabled])

  // Determine if input is expanded (multiline or long)
  const isExpanded = input.length > 80 || input.includes("\n")

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsChatLoading(false)
      toast({
        title: language === "de" ? "Generierung gestoppt" : "Generation stopped",
        duration: 2000,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachedFiles.length === 0) || isChatLoading) return

    const userMessage = input.trim()
    setInput("")
    clearDraft()
    setIsChatLoading(true)

    // Create abort controller
    abortControllerRef.current = new AbortController()

    try {
      // Get or create chat
      let chatId = currentChatId
      if (!chatId) {
        chatId = createChat(model)
      }

      // Add user message
      const userMsgId = generateUUID()
      const userMsg: Message = {
        id: userMsgId,
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      }
      addMessage(chatId, userMsg)

      // Build system prompt
      let systemPrompt = settings.systemPrompt || ""
      if (selectedPersona) {
        systemPrompt = selectedPersona.systemPrompt
      }
      if (profileContext) {
        systemPrompt = `${profileContext}\n\n${systemPrompt}`
      }

      // Get memory context
      const memories = memoryService.getRelevantMemories(userMessage, 5)
      if (memories.length > 0) {
        const memoryContext = memories.map(m => `- ${m.content}`).join("\n")
        systemPrompt = `${systemPrompt}\n\nUser's relevant memories:\n${memoryContext}`
      }

      // Web search if enabled
      let searchContext = ""
      if (webSearchEnabled && settings.apiKeys.tavily) {
        try {
          const results = await searchWeb(userMessage, settings.apiKeys.tavily)
          searchContext = formatTavilyResults(results)
        } catch (err) {
          console.warn("[BlocksChatInput] Search failed:", err)
        }
      }

      if (searchContext) {
        systemPrompt = `${systemPrompt}\n\nRecent web search results:\n${searchContext}`
      }

      // RAG context
      const ragContext = await getRAGContext(userMessage, 3)
      if (ragContext) {
        systemPrompt = `${systemPrompt}\n\nRelevant context from knowledge base:\n${ragContext}`
      }

      // Build messages array
      const currentChat = chats.find(c => c.id === chatId)
      const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = []

      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt })
      }

      // Add chat history
      if (currentChat?.messages) {
        for (const msg of currentChat.messages) {
          if (msg.role === "user" || msg.role === "assistant") {
            messages.push({ role: msg.role, content: msg.content })
          }
        }
      }

      // Add current message
      messages.push({ role: "user", content: userMessage })

      // Create assistant message placeholder
      const assistantMsgId = generateUUID()
      let assistantContent = ""
      let messageAdded = false

      const onReasoning = (reasoning: string) => {
        // Could display reasoning in UI
        console.log("[Reasoning]", reasoning)
      }

      // Stream response
      await streamChatMessage(
        messages,
        model,
        (chunk) => {
          assistantContent += chunk

          if (!messageAdded) {
            const assistantMsg: Message = {
              id: assistantMsgId,
              role: "assistant",
              content: assistantContent,
              timestamp: Date.now(),
              model,
            }
            addMessage(chatId!, assistantMsg)
            messageAdded = true
          } else {
            // Update existing message
            const chat = chats.find(c => c.id === chatId)
            if (chat) {
              const updatedMessages = chat.messages.map(m =>
                m.id === assistantMsgId ? { ...m, content: assistantContent } : m
              )
              setChats(chats.map(c =>
                c.id === chatId ? { ...c, messages: updatedMessages } : c
              ))
            }
          }
        },
        {
          temperature: settings.modelParameters?.temperature || 0.7,
          maxTokens: settings.modelParameters?.maxTokens || 4096,
          topP: 0.9,
          frequencyPenalty: 0,
          presencePenalty: 0,
          apiKey: settings.apiKeys.openRouter,
          signal: abortControllerRef.current?.signal,
          reasoning: reasoningEnabled && modelSupportsReasoning,
          onReasoning,
        }
      )

      // Extract memories from conversation
      if (settings.memorySettings?.autoExtract) {
        memoryService.extractMemoriesFromConversation(userMessage, assistantContent)
      }

    } catch (error: any) {
      if (error.name === "AbortError") {
        return
      }
      console.error("[BlocksChatInput] Error:", error)
      toast({
        title: language === "de" ? "Fehler" : "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsChatLoading(false)
      abortControllerRef.current = null
    }
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
      title: "Files attached",
      description: `${files.length} file(s) ready to send`,
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

  return (
    <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
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

        {/* Keyboard Hint */}
        <div className="mt-2 text-center">
          <span className="text-[10px] text-muted-foreground/60">
            {language === "de" ? "Enter zum Senden • Shift+Enter für neue Zeile" : "Enter to send • Shift+Enter for new line"}
          </span>
        </div>
      </div>
    </div>
  )
}
