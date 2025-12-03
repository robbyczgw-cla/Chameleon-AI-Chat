"use client"

import type React from "react"
import { Send, Globe, Square, Lightbulb } from "lucide-react"
import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Message, StreamingHistoryEntry } from "@/types"
import { streamChatMessage, REASONING_MODELS } from "@/lib/openrouter"
import { modelSupportsToolCalling } from "@/lib/tools"
import { searchWeb, formatSearchResults as formatTavilyResults } from "@/lib/tavily"
import { searchWithSerper, formatSearchResults as formatSerperResults } from "@/lib/serper"
import { searchWithYoucom, formatSearchResults as formatYoucomResults } from "@/lib/youcom"
import type { SearchResponse } from "@/lib/serper"
import { useToast } from "@/hooks/use-toast"
import { generateUUID, cn } from "@/lib/utils"
import { supabaseSync } from "@/lib/supabase/sync"
import { estimateTokens, calculateCost } from "@/lib/token-tracker"
import { languageService, getTranslation } from "@/lib/languages"
import { FileUpload } from "@/components/file-upload"
import { extractTextFromAttachments, type FileAttachment } from "@/lib/file-handler"
import type { Persona } from "@/lib/personas"
import { getRAGContext } from "@/lib/rag-service"
import { parseSlashCommand, getCommandSuggestions, buildCommandPrompt, type SlashCommand } from "@/lib/slash-commands"
import { memoryService } from "@/lib/memory-service"
import { ContextWindowMeter } from "@/components/context-window-meter"
import { useDraft } from "@/hooks/use-draft"
import { analyzeQueryForSearch } from "@/lib/search-heuristics"

interface SimpleChatInputProps {
  selectedPersona?: Persona
  profileContext?: string
  webSearchEnabled?: boolean
  overrideModel?: string // Override the model
}

export function SimpleChatInput({ selectedPersona, profileContext, webSearchEnabled: initialWebSearchEnabled, overrideModel }: SimpleChatInputProps = {}) {
  const { currentChatId, addMessage, createChat, settings, chats, setChats, user, isChatLoading, setIsChatLoading, chatAbortControllerRef, stopChatGeneration, setStreamingPhase, setCurrentTool, setSearchQuery, currentStreamingDetails, setCurrentStreamingDetails, addStreamingHistoryEntry, clearStreamingHistory, getStreamingHistory } = useApp()

  // Draft auto-save system
  const { draft, saveDraft, clearDraft, isRestored } = useDraft(currentChatId)
  const [input, setInput] = useState("")

  // Restore draft when hook is ready
  useEffect(() => {
    if (isRestored && draft && !input) {
      setInput(draft)
    }
  }, [isRestored, draft])
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const [language, setLanguage] = useState(languageService.getLanguage())
  const [commandSuggestions, setCommandSuggestions] = useState<SlashCommand[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [imageMode, setImageMode] = useState(false)
  const { toast } = useToast()

  // Detect if we're in Advanced mode (from localStorage, not persona-based)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)

  // Load web search state from localStorage (PERSIST USER PREFERENCE!)
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
  const model = overrideModel || settings.selectedModel || "deepseek/deepseek-v3.2"
  const modelSupportsReasoning = REASONING_MODELS.has(model)

  // OPTIMIZED: Combined localStorage saves to reduce useEffect count
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chameleon-web-search-enabled", String(webSearchEnabled))
      localStorage.setItem("chameleon-reasoning-enabled", String(reasoningEnabled))
    }
  }, [webSearchEnabled, reasoningEnabled])

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

  // OPTIMIZED: Combined all window event listeners into single useEffect
  useEffect(() => {
    const handleInsertPrompt = (e: CustomEvent) => {
      setInput(e.detail)
    }

    const handleSetImageMode = (e: CustomEvent) => {
      setImageMode(e.detail)
    }

    const handleSendQuickMessage = (e: CustomEvent) => {
      const prompt = e.detail
      if (prompt && !isChatLoading) {
        setInput(prompt)
        // Submit after a short delay to ensure state is updated
        setTimeout(() => {
          const form = document.querySelector('form[class*="max-w-3xl"]') as HTMLFormElement
          if (form) {
            form.requestSubmit()
          }
        }, 50)
      }
    }

    const handleStopGeneration = () => {
      stopChatGeneration()
    }

    window.addEventListener("insertPrompt" as any, handleInsertPrompt)
    window.addEventListener("setImageMode" as any, handleSetImageMode)
    window.addEventListener("sendQuickMessage" as any, handleSendQuickMessage)
    window.addEventListener("stopGeneration" as any, handleStopGeneration)

    return () => {
      window.removeEventListener("insertPrompt" as any, handleInsertPrompt)
      window.removeEventListener("setImageMode" as any, handleSetImageMode)
      window.removeEventListener("sendQuickMessage" as any, handleSendQuickMessage)
      window.removeEventListener("stopGeneration" as any, handleStopGeneration)
    }
  }, [isChatLoading])

  const stopGeneration = () => {
    stopChatGeneration()
    toast({
      title: settings.language === "de" ? "Gestoppt" : "Stopped",
      description: settings.language === "de" ? "Antwort wurde abgebrochen" : "Response was cancelled",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachedFiles.length === 0) || isChatLoading) return

    console.log("[Simple Chat] Starting chat submission")
    chatAbortControllerRef.current = new AbortController()

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

    // Capture attached images BEFORE clearing (for image-to-image generation)
    const inputImagesForGen = attachedFiles
      .filter(f => f.type.startsWith('image/'))
      .map(f => f.base64)

    addMessage(chatId, userMessage)
    console.log("[Simple Chat] Added user message")
    setInput("")
    clearDraft() // Clear saved draft after successful send
    setAttachedFiles([])
    setIsChatLoading(true)
    // Set initial streaming phase immediately for step-by-step visualization
    setStreamingPhase("thinking")
    // CRITICAL: Clear streaming details from previous chat to prevent stale reasoning
    setCurrentStreamingDetails(null)
    // Clear and start streaming history
    clearStreamingHistory()
    addStreamingHistoryEntry({
      phase: "thinking",
      description: "Analyzing your message and planning response"
    })

    // Handle image generation mode - always use Gemini 3 Pro Image Preview
    if (imageMode) {
      try {
        const imageModel = "google/gemini-3-pro-image-preview"
        const apiKey = settings.apiKeys.openRouter

        if (!apiKey) {
          throw new Error(
            settings.language === "de"
              ? 'OpenRouter API-Schlüssel erforderlich. Füge ihn unter Einstellungen → API hinzu'
              : 'OpenRouter API key required. Add it in Settings → API'
          )
        }

        toast({
          title: settings.language === "de" ? "🎨 Generiere Bild..." : "🎨 Generating image...",
          description: inputImagesForGen.length > 0
            ? (settings.language === "de" ? "Bearbeite hochgeladenes Bild..." : "Editing uploaded image...")
            : (settings.language === "de" ? "Verwende" : "Using") + " Gemini 3 Pro",
        })

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: messageContent,
            model: imageModel,
            apiKey,
            inputImages: inputImagesForGen, // Send attached images for image-to-image
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to generate image')
        }

        const data = await response.json()

        const imageMessage: Message = {
          id: generateUUID(),
          role: "assistant",
          content: `${settings.language === "de" ? "Generiertes Bild" : "Generated image"}: ${messageContent}`,
          imageUrl: data.url,
          timestamp: Date.now(),
          stats: {
            model: data.model,
            responseTime: 0,
          },
        }

        addMessage(chatId, imageMessage)
        toast({
          title: settings.language === "de" ? "🎨 Bild generiert!" : "🎨 Image generated!",
          description: settings.language === "de" ? "Das Bild wurde erfolgreich erstellt" : "Image created successfully",
        })
      } catch (error) {
        console.error('[Simple Chat] Image generation error:', error)
        toast({
          title: settings.language === "de" ? "Fehler bei Bildgenerierung" : "Image generation failed",
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive",
        })
      } finally {
        setIsChatLoading(false)
        setImageMode(false)
        // Dispatch event to reset header button
        window.dispatchEvent(new CustomEvent("setImageMode", { detail: false }))
      }
      return
    }

    const currentChat = chats.find((c) => c.id === chatId)

    // Use override model or settings default
    const model = overrideModel || settings.selectedModel
    console.log("[Simple Chat] Using model:", model, overrideModel ? "(override)" : "(default)")

    // Build system prompt: Use persona prompt if provided, otherwise use settings
    let systemPrompt = selectedPersona?.prompt || settings.systemPrompt

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
      // Memory: Phase 3 intelligent memory retrieval with classification + semantic search
      if (settings.memorySettings?.enabled) {
        console.log("[Simple Chat] 🧠 Intelligent memory retrieval for query:", input.trim().substring(0, 50))

        const { memories: relevantMemories, decision } =
          await memoryService.getRelevantMemoriesWithClassification(
            input.trim(),
            settings.apiKeys.openRouter,
            settings.memorySettings.maxMemoriesInContext,
            false // Simple mode doesn't have personas
          )

        if (decision.action === "skipped") {
          console.log("[Simple Chat] ⏭️ Memory skipped:", decision.reason,
            `(type: ${decision.details.queryType}, confidence: ${decision.details.confidence?.toFixed(2)})`)
        } else if (decision.action === "retrieved" && relevantMemories.length > 0) {
          const memoryContext = memoryService.formatMemoriesForContext(relevantMemories)
          messages.splice(-1, 0, { role: "system" as const, content: memoryContext })
          console.log("[Simple Chat] ✅ Memory context added:", decision.reason,
            decision.details.topSimilarity ? `(top similarity: ${decision.details.topSimilarity.toFixed(3)})` : "")
        } else {
          console.log("[Simple Chat] 📭", decision.reason)
        }
      }

      // Web search strategy:
      // 1. Manual toggle ON → do manual search before streaming (explicit user request)
      // 2. Manual toggle OFF + model supports tool calling → let AI decide via tool calling
      // 3. Manual toggle OFF + no tool calling support → use heuristics fallback
      const supportsToolCalling = modelSupportsToolCalling(model)
      const searchHeuristics = analyzeQueryForSearch(input.trim())
      const shouldAutoSearchHeuristics = searchHeuristics.shouldSearch && searchHeuristics.confidence >= 0.4

      // Only do manual search if explicitly toggled OR (heuristics say yes AND no tool calling support)
      const performManualSearch = webSearchEnabled || (!supportsToolCalling && shouldAutoSearchHeuristics)

      // Enable AI-driven search via tool calling when not doing manual search
      const enableToolCallingSearch = !performManualSearch && supportsToolCalling

      console.log("[Simple Chat] Web Search strategy:")
      console.log("[Simple Chat]   - Manual toggle:", webSearchEnabled)
      console.log("[Simple Chat]   - Model supports tool calling:", supportsToolCalling)
      console.log("[Simple Chat]   - Heuristics auto-search:", shouldAutoSearchHeuristics)
      console.log("[Simple Chat]   - Perform manual search:", performManualSearch)
      console.log("[Simple Chat]   - Enable tool calling search:", enableToolCallingSearch)
      console.log("[Simple Chat]   - Search Provider:", settings.searchProvider || "tavily")

      // Track search stats
      let searchStats: { provider: string; results: number; time: number } | null = null

      if (performManualSearch) {
        try {
          const searchStartTime = performance.now()
          console.log("[Simple Chat] 🔍 Starting manual web search for query:", input.trim())
          toast({
            title: settings.language === "de" ? "🔍 Suche im Web..." : "🔍 Searching the web...",
            description: shouldAutoSearchHeuristics && !webSearchEnabled
              ? (settings.language === "de"
                ? `Automatisch erkannt: ${searchHeuristics.detectedKeywords?.join(", ") || "Echtzeit-Info benötigt"}`
                : `Auto-detected: ${searchHeuristics.detectedKeywords?.join(", ") || "real-time info needed"}`)
              : (settings.language === "de" ? "Sammle aktuelle Informationen" : "Gathering current information"),
          })

          const searchQuery = input.trim()
          let searchResults: SearchResponse

          // Simple Mode uses Tavily, Advanced Mode respects settings.searchProvider
          const searchProvider = selectedPersona ? (settings.searchProvider || "tavily") : "tavily"

          console.log(`[Simple Chat] 🔍 Using search provider: ${searchProvider.toUpperCase()}`)

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

          const searchEndTime = performance.now()
          const searchTimeSeconds = (searchEndTime - searchStartTime) / 1000

          // Store search stats
          searchStats = {
            provider: searchProvider,
            results: searchResults.results.length,
            time: searchTimeSeconds
          }

          console.log("[Simple Chat] ✅ Web search completed:", {
            provider: searchProvider.toUpperCase(),
            results: searchResults.results.length,
            time: `${searchTimeSeconds.toFixed(2)}s`
          })
          console.log("[Simple Chat] 🔍 Full search response:", JSON.stringify(searchResults, null, 2))

          let searchContext = `Websuchergebnisse für: "${input.trim()}"\n\n`

          if (searchResults.answer) {
            searchContext += `Zusammenfassung: ${searchResults.answer}\n\n`
          }

          // Use appropriate formatter
          const formatResults =
            searchProvider === "serper" ? formatSerperResults :
            searchProvider === "youcom" ? formatYoucomResults :
            formatTavilyResults

          searchContext += `Detaillierte Ergebnisse:\n${formatResults(searchResults.results)}`

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
            description: `${searchResults.results.length} Ergebnisse${imageCount > 0 ? ` + ${imageCount} Bilder` : ''} via ${searchProvider.charAt(0).toUpperCase() + searchProvider.slice(1)}`,
          })
        } catch (searchError) {
          console.error("[Simple Chat] ❌ Web search error:", searchError)
          toast({
            title: "⚠️ Web-Suche fehlgeschlagen",
            description: "Fahre ohne Web-Suche fort",
            variant: "destructive",
          })
          // Continue without search
          searchStats = null
        }
      } else {
        if (enableToolCallingSearch) {
          console.log("[Simple Chat] 🤖 Tool calling enabled - AI will decide when to search")
        } else {
          console.log("[Simple Chat] ⏭️ Web search disabled (no manual toggle, no tool calling)")
        }
      }

      const assistantMessageId = generateUUID()
      let assistantContent = ""
      let reasoningContent = ""
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

      const onReasoning = (chunk: string) => {
        reasoningContent += chunk
      }

      // Get the appropriate search API key for tool calling
      // Note: API route supports tavily, serper, exa - fallback to tavily if youcom is selected
      const rawSearchProvider = settings.searchProvider || "tavily"
      const searchProviderForTools = rawSearchProvider === "youcom" ? "tavily" : rawSearchProvider
      const searchApiKeyForTools = searchProviderForTools === "serper"
        ? settings.apiKeys.serper
        : settings.apiKeys.tavily // exa would use tavily key as fallback

      await streamChatMessage(messages, model, onChunk, {
        temperature: settings.temperature || 0.7,
        maxTokens,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        apiKey: settings.apiKeys.openRouter,
        signal: chatAbortControllerRef.current?.signal,
        reasoning: reasoningEnabled && modelSupportsReasoning,
        onReasoning,
        // Tool calling for AI-driven search
        enableAutoSearch: enableToolCallingSearch,
        searchProvider: searchProviderForTools as "tavily" | "serper" | "exa",
        searchApiKey: searchApiKeyForTools,
        searchSettings: searchProviderForTools === "serper" ? settings.serperSettings : settings.tavilySettings,
        // Experimental tool settings
        enableUrlFetchTool: settings.experimental?.enableUrlFetchTool !== false,
        enableYouTubeTool: settings.experimental?.enableYouTubeTool !== false,
        onSearchStart: (query) => {
          console.log("[Simple Chat] 🤖 AI triggered search:", query)
          toast({
            title: settings.language === "de" ? "🤖 AI sucht im Web..." : "🤖 AI is searching the web...",
            description: query || (settings.language === "de" ? "Sammle aktuelle Informationen" : "Gathering current information"),
          })
        },
        onSearchComplete: () => {
          console.log("[Simple Chat] ✅ AI search complete")
          toast({
            title: settings.language === "de" ? "✅ Suche abgeschlossen" : "✅ Search complete",
            description: settings.language === "de" ? "AI hat Informationen gefunden" : "AI found relevant information",
          })
        },
        // Phase tracking for step-by-step visualization
        onPhaseChange: (phase) => {
          console.log("[Simple Chat] 📍 Phase change:", phase)
          setStreamingPhase(phase)
          const descriptions: Record<string, string> = {
            thinking: "Processing context and formulating response",
            responding: "Generating and streaming the response",
            done: "Response completed"
          }
          addStreamingHistoryEntry({
            phase,
            description: descriptions[phase] || `Phase: ${phase}`
          })
        },
        onToolUse: (toolName) => {
          console.log("[Simple Chat] 🔧 Tool use:", toolName)
          const toolDescriptions: Record<string, string> = {
            web_search: "Searching the internet for information",
            calculator: "Performing mathematical calculations",
            code_interpreter: "Executing and analyzing code"
          }
          addStreamingHistoryEntry({
            phase: "tool_use",
            detail: toolName,
            description: toolDescriptions[toolName] || `Using ${toolName.replace(/_/g, " ")}`
          })
          setCurrentTool(toolName)
        },
        onSearchQuery: (query) => {
          console.log("[Simple Chat] 🔍 Search query:", query)
          setSearchQuery(query)
          addStreamingHistoryEntry({
            phase: "searching",
            detail: query,
            description: `Searching web for: "${query}"`
          })
        },
        // Enhanced streaming details for advanced mode
        onStreamingDetails: (details) => {
          // Accumulate reasoning content instead of replacing it
          setCurrentStreamingDetails((prev): Partial<StreamingHistoryEntry> | null => {
            // If we have new reasoning content, accumulate it
            if (details.reasoningContent) {
              return {
                ...prev,
                ...details,
                reasoningContent: (prev?.reasoningContent || '') + details.reasoningContent
              }
            }
            // For other details (search query, action, etc.), merge with previous
            return {
              ...prev,
              ...details
            }
          })
          // Only add to streaming history for significant events (NOT every reasoning chunk)
          // Reasoning content updates the live display but doesn't spam history
          if (details.phase || details.searchQuery || details.toolName) {
            addStreamingHistoryEntry({
              phase: details.phase as any || "searching",
              toolName: details.toolName,
              toolArguments: details.toolArguments,
              searchQuery: details.searchQuery,
              searchProvider: details.searchProvider,
              searchParameters: details.searchParameters,
              action: details.action,
              resultCount: details.resultCount,
              searchResultsPreview: details.searchResultsPreview,
              description: details.resultSummary || details.action || (details.searchQuery ? `Searching: "${details.searchQuery}"` : undefined)
            })
          }
        },
      })

      console.log("[Simple Chat] Stream complete, final content length:", assistantContent.length)

      if (messageAdded && assistantContent) {
        const promptText = messages.map((m) => m.content).join("\n")
        const promptTokens = estimateTokens(promptText)
        const completionTokens = estimateTokens(assistantContent)
        const totalTokens = promptTokens + completionTokens
        const estimatedCost = calculateCost(promptTokens, completionTokens, model)

        // Get streaming history for verbose display
        const streamingHistoryForMessage = getStreamingHistory()

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
          stats: {
            model,
            cost: estimatedCost,
            ...(searchStats && {
              searchProvider: searchStats.provider,
              searchResults: searchStats.results,
              searchTime: searchStats.time,
            }),
          },
          ...(reasoningContent ? { reasoning: reasoningContent } : {}),
          ...(streamingHistoryForMessage.length > 0 ? { streamingHistory: streamingHistoryForMessage } : {}),
        }

        if (user) {
          console.log("[Simple Chat] Saving final message to Supabase")
          // CRITICAL: Save message FIRST, then track usage (to avoid FK violation)
          supabaseSync
            .createMessage(finalMessage, chatId)
            .then(() => {
              // Only track usage after message is saved to avoid foreign key violation
              return supabaseSync.trackUsage(
                user.id,
                chatId,
                assistantMessageId,
                model,
                promptTokens,
                completionTokens,
                estimatedCost,
              )
            })
            .catch((error) => {
              console.error("[Simple Chat] Failed to save message or track usage:", error)
            })
        }

        setChats((prevChats) => {
          return prevChats.map((chat) => {
            if (chat.id !== chatId) return chat
            const updatedMessages = chat.messages.map((m) =>
              m.id === assistantMessageId ? { ...m, tokens: finalMessage.tokens, stats: finalMessage.stats, reasoning: finalMessage.reasoning } : m,
            )
            return { ...chat, messages: updatedMessages }
          })
        })

        // Auto-extract memories using LLM (background, silent)
        // Only for conversations with 4+ messages to avoid test/short chats
        const currentChatForMemory = chats.find((c) => c.id === chatId)
        const messageCount = (currentChatForMemory?.messages.length || 0) + 2 // +2 for current exchange

        if (memoryService.shouldExtractMemories(messageCount)) {
          console.log("[Simple Chat] 🧠 Running automatic memory extraction...")
          memoryService.extractMemoriesWithLLM(
            messageContent,
            assistantContent,
            settings.apiKeys?.openRouter
          ).then((memories) => {
            if (memories.length > 0) {
              console.log("[Simple Chat] 💾 Auto-saved", memories.length, "new memories")
              toast({
                title: "🧠 Memory saved",
                description: `Saved ${memories.length} new ${memories.length === 1 ? 'memory' : 'memories'}`,
                duration: 2000,
              })
            }
          }).catch((err) => {
            console.error("[Simple Chat] Memory extraction failed:", err)
          })
        }
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
      // Reset streaming state completely (including streaming details to prevent stale content)
      setStreamingPhase("idle")
      setCurrentTool(null)
      setSearchQuery(null)
      setCurrentStreamingDetails(null)
      chatAbortControllerRef.current = null
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
    <div className="border-t border-border bg-background px-3 sm:px-4 py-2 sm:py-3 w-full">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl w-full">
        <div className="flex items-end gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <Textarea
              id="simple-chat-input"
              name="message"
              autoComplete="off"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                saveDraft(e.target.value) // Auto-save draft
              }}
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
              {modelSupportsReasoning && (
                <Button
                  type="button"
                  size="icon"
                  variant={reasoningEnabled ? "default" : "ghost"}
                  className={`h-8 w-8 rounded-full ${reasoningEnabled ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  onClick={() => setReasoningEnabled(!reasoningEnabled)}
                  title={reasoningEnabled ? "Reasoning enabled - model will think step by step" : "Enable reasoning for deeper analysis"}
                >
                  <Lightbulb className={`h-4 w-4 ${reasoningEnabled ? "text-white" : ""}`} />
                </Button>
              )}
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
        {/* Context Window Meter */}
        <div className="mt-1.5 flex justify-end">
          <ContextWindowMeter compact />
        </div>
      </form>
    </div>
  )
}
