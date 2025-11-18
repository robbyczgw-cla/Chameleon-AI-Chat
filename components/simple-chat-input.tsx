"use client"

import type React from "react"
import { Send, Globe, Square } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Message } from "@/types"
import { streamChatMessage } from "@/lib/openrouter"
import { searchWeb, formatSearchResults as formatTavilyResults } from "@/lib/tavily"
import { searchWithSerper, formatSearchResults as formatSerperResults } from "@/lib/serper"
import { searchWithYoucom, formatSearchResults as formatYoucomResults } from "@/lib/youcom"
import type { SearchResponse } from "@/lib/serper"
import { useToast } from "@/hooks/use-toast"
import { generateUUID } from "@/lib/utils"
import { supabaseSync } from "@/lib/supabase/sync"
import { estimateTokens, calculateCost } from "@/lib/token-tracker"
import { languageService, getTranslation } from "@/lib/languages"
import { FileUpload } from "@/components/file-upload"
import { extractTextFromAttachments, type FileAttachment } from "@/lib/file-handler"
import type { Persona } from "@/lib/personas"
import { getRAGContext } from "@/lib/rag-service"
import { parseSlashCommand, getCommandSuggestions, buildCommandPrompt, type SlashCommand } from "@/lib/slash-commands"
import { memoryService } from "@/lib/memory-service"
import { hifiPromptService } from "@/lib/hifi-prompt-service"

interface SimpleChatInputProps {
  selectedPersona?: Persona
  profileContext?: string
  webSearchEnabled?: boolean
  overrideModel?: string // Override the model (e.g., for Perplexity Sonar in HiFi mode)
}

export function SimpleChatInput({ selectedPersona, profileContext, webSearchEnabled: initialWebSearchEnabled, overrideModel }: SimpleChatInputProps = {}) {
  const { currentChatId, addMessage, createChat, settings, chats, setChats, user, isChatLoading, setIsChatLoading } = useApp()
  const [input, setInput] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const [language, setLanguage] = useState(languageService.getLanguage())
  const [commandSuggestions, setCommandSuggestions] = useState<SlashCommand[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Detect if we're in Advanced mode (from localStorage, not persona-based)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  // Load web search state from localStorage (PERSIST USER PREFERENCE!)
  const [webSearchEnabled, setWebSearchEnabled] = useState(() => {
    if (typeof window === "undefined") return initialWebSearchEnabled ?? true
    const saved = localStorage.getItem("marachat-web-search-enabled")
    if (saved !== null) {
      return saved === "true"
    }
    return initialWebSearchEnabled ?? true
  })

  // Save web search state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("marachat-web-search-enabled", String(webSearchEnabled))
      console.log("[SimpleChatInput] Web search state saved:", webSearchEnabled)
    }
  }, [webSearchEnabled])

  useEffect(() => {
    const mode = localStorage.getItem("app-mode")
    setIsAdvancedMode(mode === "advanced")
  }, [])

  // Update command suggestions when input changes (Advanced mode only)
  useEffect(() => {
    if (!isAdvancedMode) {
      setCommandSuggestions([])
      return
    }

    if (input.startsWith('/')) {
      const suggestions = getCommandSuggestions(input.split('\n')[0]) // Only first line
      setCommandSuggestions(suggestions)
      setSelectedSuggestionIndex(0)
    } else {
      setCommandSuggestions([])
    }
  }, [input, isAdvancedMode])

  useEffect(() => {
    const handleInsertPrompt = (e: CustomEvent) => {
      setInput(e.detail)
    }
    window.addEventListener("insertPrompt" as any, handleInsertPrompt)
    return () => {
      window.removeEventListener("insertPrompt" as any, handleInsertPrompt)
    }
  }, [])

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsChatLoading(false)
      toast({
        title: "Gestoppt",
        description: "Antwort wurde abgebrochen",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachedFiles.length === 0) || isChatLoading) return

    console.log("[Simple Chat] Starting chat submission")
    abortControllerRef.current = new AbortController()

    let chatId = currentChatId
    if (!chatId) {
      chatId = createChat()
      console.log("[Simple Chat] Created new chat:", chatId)
    }

    let messageContent = input.trim()

    // Parse slash commands in Advanced mode
    if (isAdvancedMode) {
      const commandParse = parseSlashCommand(messageContent)
      if (commandParse.isCommand && commandParse.command) {
        messageContent = buildCommandPrompt(commandParse.command, commandParse.remainingText)
        console.log("[Simple Chat] Slash command detected:", commandParse.command.command, "→", messageContent.substring(0, 50))
      }
    }

    if (attachedFiles.length > 0) {
      const fileContext = extractTextFromAttachments(attachedFiles)
      messageContent = `${messageContent}\n\n${fileContext}`
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: messageContent,
      timestamp: Date.now(),
      attachments: attachedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.dataUrl || "",
      })),
    }

    addMessage(chatId, userMessage)
    console.log("[Simple Chat] Added user message")
    setInput("")
    setAttachedFiles([])
    setIsChatLoading(true)

    const currentChat = chats.find((c) => c.id === chatId)

    // Apply Exa search if enabled in HiFi mode (appends :online to model)
    const isHiFiMode = selectedPersona?.id === "hifiteam"
    let model = overrideModel || settings.selectedModel
    if (isHiFiMode && settings.useExaSearch && !model.includes(':online')) {
      model = `${model}:online`
      console.log("[Simple Chat] 🔍 Exa search enabled - using model:", model)
    } else {
      console.log("[Simple Chat] Using model:", model, overrideModel ? "(override)" : "(default)")
    }

    // Build system prompt: Use persona prompt if provided, otherwise use settings
    // Special case: For HiFi Team persona, use custom prompt from localStorage
    let systemPrompt = selectedPersona?.prompt || settings.systemPrompt
    if (selectedPersona?.id === "hifiteam") {
      systemPrompt = hifiPromptService.getPrompt()
      console.log("[Simple Chat] Using custom HiFi prompt from localStorage")
    }

    // Add language instruction based on UI language setting
    const languageInstruction = settings.language === "en"
      ? "\n\nIMPORTANT: Always respond in English."
      : settings.language === "de"
      ? "\n\nWICHTIG: Antworte immer auf Deutsch."
      : settings.language === "es"
      ? "\n\nIMPORTANTE: Responde siempre en español."
      : "\n\nIMPORTANT: Always respond in English."

    systemPrompt = `${systemPrompt}${languageInstruction}`

    // Add profile context if provided
    if (profileContext) {
      systemPrompt = `${systemPrompt}\n\n${profileContext}`
    }

    console.log("[Simple Chat] Using persona:", selectedPersona?.name || "Default")
    console.log("[Simple Chat] Profile context:", profileContext || "None")
    console.log("[Simple Chat] 🔴 DEBUG - System Prompt (first 500 chars):", systemPrompt.substring(0, 500))

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(currentChat?.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: messageContent },
    ]

    try {
      // RAG: Retrieve knowledge base documents for HiFi mode
      const isHiFiMode = selectedPersona?.id === "hifiteam"
      if (isHiFiMode) {
        console.log("[Simple Chat] 📚 Retrieving RAG knowledge base for query:", input.trim())
        const ragContext = getRAGContext(input.trim(), 3) // Retrieve top 3 relevant documents

        if (ragContext) {
          messages.splice(-1, 0, { role: "system" as const, content: ragContext })
          console.log("[Simple Chat] ✅ RAG context added (length:", ragContext.length, "chars)")

          toast({
            title: "📚 Wissensdatenbank durchsucht",
            description: "Interne Produktinfos gefunden",
            duration: 2000,
          })
        } else {
          console.log("[Simple Chat] ℹ️ No relevant RAG documents found")
        }
      }

      // Memory: Add relevant memories (works for all personas when enabled)
      if (settings.memorySettings?.enabled) {
        console.log("[Simple Chat] 🧠 Retrieving relevant memories for query:", input.trim())
        const relevantMemories = memoryService.getRelevantMemories(input.trim())

        if (relevantMemories.length > 0) {
          const memoryContext = memoryService.formatMemoriesForContext(relevantMemories)
          messages.splice(-1, 0, { role: "system" as const, content: memoryContext })
          console.log("[Simple Chat] ✅ Memory context added:", relevantMemories.length, "memories")
        }
      }

      // Web search if enabled - server has fallback API key via env vars
      console.log("[Simple Chat] Web Search check - Enabled:", webSearchEnabled)
      console.log("[Simple Chat] Search Provider: tavily (Simple Mode always uses Tavily)")

      if (webSearchEnabled) {
        try {
          console.log("[Simple Chat] 🔍 Starting web search for query:", input.trim())
          toast({
            title: "🔍 Suche im Web...",
            description: "Sammle aktuelle Informationen",
          })

          // Enhance search query to always get DACH-specific results in HiFi mode
          let searchQuery = input.trim()
          if (isHiFiMode && !/(österreich|deutschland|austria|germany)/i.test(searchQuery)) {
            searchQuery += " österreich deutschland"
            console.log("[Simple Chat] 📍 Enhanced query for DACH market:", searchQuery)
          }

          let searchResults: SearchResponse

          // Simple Mode uses Tavily, Advanced/HiFi Mode respects settings.searchProvider
          const searchProvider = selectedPersona ? (settings.searchProvider || "tavily") : "tavily"

          if (searchProvider === "serper") {
            console.log("[Simple Chat] Using Serper (Google Search)")
            searchResults = await searchWithSerper(searchQuery, {
              maxResults: settings.serperSettings?.maxResults || 5,
              includeImages: settings.serperSettings?.includeImages ?? true,
              country: settings.serperSettings?.country || "at",
              language: settings.serperSettings?.language || "de",
              type: settings.serperSettings?.type || "search",
              timeRange: settings.serperSettings?.timeRange || "none",
              autocorrect: settings.serperSettings?.autocorrect ?? true,
              page: settings.serperSettings?.page || 1,
              apiKey: settings.apiKeys.serper,
            })
          } else if (searchProvider === "youcom") {
            console.log("[Simple Chat] Using You.com (with livecrawl)")
            const youcomResults = await searchWithYoucom(searchQuery, {
              maxResults: settings.youcomSettings?.maxResults || 5,
              country: settings.youcomSettings?.country || "at",
              livecrawl: settings.youcomSettings?.livecrawl ?? true,
              safeSearch: settings.youcomSettings?.safeSearch || "moderate",
              freshness: settings.youcomSettings?.freshness || "none",
              apiKey: settings.apiKeys.youcom,
            })
            // Convert You.com response to SearchResponse format
            searchResults = {
              results: youcomResults.results as any,
              images: youcomResults.images || [],
              answer: youcomResults.answer
            }
          } else {
            console.log("[Simple Chat] Using Tavily")
            searchResults = await searchWeb(searchQuery, {
              maxResults: settings.tavilySettings?.maxResults || 5,
              searchDepth: settings.tavilySettings?.searchDepth || "basic",
              includeImages: settings.tavilySettings?.includeImages ?? true,
              includeDomains: settings.tavilySettings?.includeDomains,
              excludeDomains: settings.tavilySettings?.excludeDomains,
              includeRawContent: settings.tavilySettings?.includeRawContent || false,
              topic: settings.tavilySettings?.topic || "general",
              apiKey: settings.apiKeys.tavily,
            })
          }

          console.log("[Simple Chat] ✅ Web search completed, results:", searchResults.results.length)
          console.log("[Simple Chat] 🔍 Full search response:", JSON.stringify(searchResults, null, 2))

          // Show original query to user, but searched with enhanced query
          let searchContext = `Websuchergebnisse für: "${input.trim()}"\n\n`

          if (searchResults.answer) {
            searchContext += `Zusammenfassung: ${searchResults.answer}\n\n`
          }

          // Use appropriate formatter
          const formatResults =
            searchProvider === "serper" ? formatSerperResults :
            searchProvider === "youcom" ? formatYoucomResults :
            formatTavilyResults

          // For HiFi Mode: Prioritize official manufacturer sources for technical specs
          if (isHiFiMode) {
            // Tier 1: Official manufacturer websites (Premium HiFi brands we actually sell)
            const tier1Domains = [
              // Premium Brands (HiFi Team Sortiment)
              'linn.co.uk', 'naimaudio.com', 'lab12.gr', 'doacoustics.com', 'guruaudio.de',
              'technics.com', 'bowerswilkins.com', 'triangle-fr.com', 'project-audio.com',
              'dali-speakers.com', 'focal.com', 'viennaacoustics.com',
              // Our Shops
              'shop.hifiteam.at', 'hifiteam.at',
              // High-End Brands
              'rega.co.uk', 'arcam.co.uk', 'monitoraudio.com', 'mbl.de', 'cambridge-audio.com',
              'cambridgeaudio.com', 'dynaudio.com', 'sennheiser.com', 'nadelectronics.com',
              'bluesound.com', 'ayon-audio.com', 'atoll-electronique.com', 'accuphase.com',
              'musicalfidelity.com', 'rotel.com', 'kef.com', 'klipsch.com', 'denon.com'
            ]

            // Tier 2: Trusted retailers & professional HiFi sources
            const tier2Domains = [
              'geizhals.de', 'geizhals.at', 'idealo.de', 'hifiakademie.de', 'hifi-regler.de',
              'hifi-studio.de', 'analogmusic.de', 'fairaudio.de', 'hifistatement.net',
              'stereoplay.de', 'hifitest.de', 'avguide.ch', 'audio.de', 'heimkinoraum.de'
            ]

            // Tier 3: Avoid - User forums, unreliable sources
            const tier3Patterns = [
              'hifi-forum.de', 'reddit.com', 'gutefrage.net', 'answers.yahoo',
              'facebook.com', 'quora.com'
            ]

            const tier1Results = searchResults.results.filter(r =>
              tier1Domains.some(domain => r.url.includes(domain))
            )
            const tier2Results = searchResults.results.filter(r =>
              !tier1Domains.some(d => r.url.includes(d)) &&
              tier2Domains.some(domain => r.url.includes(domain))
            )
            const tier3Results = searchResults.results.filter(r =>
              !tier1Domains.some(d => r.url.includes(d)) &&
              !tier2Domains.some(d => r.url.includes(d)) &&
              tier3Patterns.some(pattern => r.url.includes(pattern))
            )
            const otherResults = searchResults.results.filter(r =>
              !tier1Domains.some(d => r.url.includes(d)) &&
              !tier2Domains.some(d => r.url.includes(d)) &&
              !tier3Patterns.some(p => r.url.includes(p))
            )

            searchContext += `QUELLENPRIORISIERUNG für technische Daten:\n\n`

            if (tier1Results.length > 0) {
              searchContext += `🏆 BESTE QUELLEN (Offizielle Hersteller + shop.hifiteam.at):\n`
              searchContext += formatResults(tier1Results)
              searchContext += `\n\n`
            }

            if (tier2Results.length > 0) {
              searchContext += `✅ VERTRAUENSWÜRDIGE QUELLEN (Seriöse Händler & Fachmagazine):\n`
              searchContext += formatResults(tier2Results)
              searchContext += `\n\n`
            }

            if (otherResults.length > 0 || tier3Results.length > 0) {
              searchContext += `⚠️ WEITERE QUELLEN (nur für subjektive Infos nutzen):\n`
              searchContext += formatResults([...otherResults, ...tier3Results])
              searchContext += `\n\n`
            }

            searchContext += `📋 ANWEISUNG:\n`
            searchContext += `- Technische Specs: Nutze PRIMÄR 🏆 Beste Quellen\n`
            searchContext += `- Falls 🏆 nicht verfügbar: Nutze ✅ Vertrauenswürdige Quellen\n`
            searchContext += `- ⚠️ Weitere Quellen: NUR für subjektive Bewertungen/Erfahrungen, NIEMALS für technische Daten\n`
            searchContext += `- Schreibe KEINE Phrasen wie "ca." oder "nicht verfügbar" - nutze die besten verfügbaren Daten!`
          } else {
            searchContext += `Detaillierte Ergebnisse:\n${formatResults(searchResults.results)}`
          }

          // Add images if available
          if (searchResults.images && searchResults.images.length > 0) {
            searchContext += `\n\nProduktbilder:\n${searchResults.images.map((url, i) => `![Produktbild ${i + 1}](${url})`).join('\n')}`
            console.log("[Simple Chat] 📷 Added", searchResults.images.length, "product images")
          } else {
            console.log("[Simple Chat] ⚠️ No images in search results:", searchResults.images)
          }

          searchContext += `\n\nBitte verwende die obigen Websuchergebnisse für eine aktuelle Antwort.`

          messages.splice(-1, 0, { role: "system" as const, content: searchContext })

          console.log("[Simple Chat] Web search context added to messages (length:", searchContext.length, "chars)")

          const imageCount = searchResults.images?.length || 0
          toast({
            title: "✅ Suche abgeschlossen",
            description: `${searchResults.results.length} Ergebnisse${imageCount > 0 ? ` + ${imageCount} Bilder` : ''} (${searchProvider})`,
          })
        } catch (searchError) {
          console.error("[Simple Chat] ❌ Web search error:", searchError)
          toast({
            title: "⚠️ Web-Suche fehlgeschlagen",
            description: "Fahre ohne Web-Suche fort",
            variant: "destructive",
          })
          // Continue without search
        }
      } else {
        console.log("[Simple Chat] ⏭️ Web search disabled")
      }

      const assistantMessageId = generateUUID()
      let assistantContent = ""
      let messageAdded = false

      console.log("[Simple Chat] Creating assistant message:", assistantMessageId)

      const onChunk = (chunk: string) => {
        assistantContent += chunk

        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.id !== chatId) return chat

            const existingMsgIndex = chat.messages.findIndex((m) => m.id === assistantMessageId)

            if (existingMsgIndex >= 0) {
              const updatedMessages = [...chat.messages]
              updatedMessages[existingMsgIndex] = {
                ...updatedMessages[existingMsgIndex],
                content: assistantContent,
              }
              return { ...chat, messages: updatedMessages, updatedAt: Date.now() }
            } else {
              if (!messageAdded) {
                messageAdded = true
                return {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      id: assistantMessageId,
                      role: "assistant" as const,
                      content: assistantContent,
                      timestamp: Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                }
              }
              return chat
            }
          })
        })
      }

      // Use 8192 tokens for all modes (sufficient for detailed responses)
      const maxTokens = settings.maxTokens || 8192

      await streamChatMessage(messages, model, onChunk, {
        temperature: settings.temperature || 0.7,
        maxTokens,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        apiKey: settings.apiKeys.openRouter,
        signal: abortControllerRef.current?.signal,
      })

      console.log("[Simple Chat] Stream complete, final content length:", assistantContent.length)

      if (messageAdded && assistantContent) {
        const promptText = messages.map((m) => m.content).join("\n")
        const promptTokens = estimateTokens(promptText)
        const completionTokens = estimateTokens(assistantContent)
        const totalTokens = promptTokens + completionTokens
        const estimatedCost = calculateCost(promptTokens, completionTokens, model)

        const finalMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
          tokens: {
            prompt: promptTokens,
            completion: completionTokens,
            total: totalTokens,
          },
        }

        if (user) {
          console.log("[Simple Chat] Saving final message to Supabase")
          supabaseSync.createMessage(finalMessage, chatId).catch((error) => {
            console.error("[Simple Chat] Failed to save final message:", error)
          })

          supabaseSync
            .trackUsage(user.id, chatId, assistantMessageId, model, promptTokens, completionTokens, estimatedCost)
            .catch((error) => {
              console.error("[Simple Chat] Failed to track usage:", error)
            })
        }

        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.id !== chatId) return chat
            const updatedMessages = chat.messages.map((m) =>
              m.id === assistantMessageId ? { ...m, tokens: finalMessage.tokens } : m,
            )
            return { ...chat, messages: updatedMessages }
          })
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[Simple Chat] Generation stopped by user")
        return
      }
      console.error("[Simple Chat] Chat error:", error)

      const errorMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: `Ups! Da ist etwas schiefgelaufen. Versuch es nochmal! 😊`,
        timestamp: Date.now(),
      }
      addMessage(chatId, errorMessage)

      toast({
        title: "Fehler",
        description: "Antwort konnte nicht abgerufen werden",
        variant: "destructive",
      })
    } finally {
      setIsChatLoading(false)
      abortControllerRef.current = null
      console.log("[Simple Chat] Chat submission complete")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle command suggestions navigation (Advanced mode only)
    if (isAdvancedMode && commandSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev + 1) % commandSuggestions.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev - 1 + commandSuggestions.length) % commandSuggestions.length)
        return
      }
      if (e.key === "Tab" || (e.key === "Enter" && commandSuggestions.length > 0)) {
        e.preventDefault()
        const selected = commandSuggestions[selectedSuggestionIndex]
        setInput(selected.command + " ")
        setCommandSuggestions([])
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setCommandSuggestions([])
        return
      }
    }

    // Normal Enter submission (but not if suggestions are showing)
    if (e.key === "Enter" && !e.shiftKey && commandSuggestions.length === 0) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const selectCommand = (command: SlashCommand) => {
    setInput(command.command + " ")
    setCommandSuggestions([])
  }

  return (
    <div className="border-t border-border bg-background p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              id="simple-chat-input"
              name="message"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getTranslation("inputPlaceholder", language)}
              className="min-h-[60px] max-h-[200px] resize-none pr-20 text-base rounded-2xl"
              disabled={isChatLoading}
            />

            {/* Slash Command Suggestions (Advanced Mode Only) */}
            {isAdvancedMode && commandSuggestions.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-2 border-b border-border bg-muted/50">
                  <div className="text-xs font-medium text-muted-foreground">
                    Slash Commands ({commandSuggestions.length})
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Tab/Enter to select • Esc to dismiss
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {commandSuggestions.map((cmd, index) => (
                    <button
                      key={cmd.command}
                      type="button"
                      onClick={() => selectCommand(cmd)}
                      className={cn(
                        "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                        index === selectedSuggestionIndex && "bg-accent"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-medium text-sm">{cmd.command}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {cmd.description}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                          {cmd.category}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="absolute bottom-3 right-3 flex gap-1">
              <FileUpload files={attachedFiles} onFilesChange={setAttachedFiles} />
              <Button
                type="button"
                size="icon"
                variant={webSearchEnabled ? "default" : "ghost"}
                className="h-8 w-8 rounded-full"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                title={webSearchEnabled ? getTranslation("webSearchEnabled", language) : getTranslation("webSearchDisabled", language)}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            type={isChatLoading ? "button" : "submit"}
            onClick={isChatLoading ? stopGeneration : undefined}
            disabled={!isChatLoading && !input.trim() && attachedFiles.length === 0}
            className="h-[60px] w-[60px] rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            size="icon"
          >
            {isChatLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
