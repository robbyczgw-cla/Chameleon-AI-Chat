"use client"

import type React from "react"
import { Send, Globe, Square, Lightbulb, Mic, MicOff, Image } from "lucide-react"
import { useState, useEffect, useRef } from "react"
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
import { estimateTokens } from "@/lib/token-tracker"
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
import { supportsVision, getRecommendedVisionModel } from "@/lib/vision-models"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { haptics } from "@/lib/haptics"
import { voiceService } from "@/lib/voice"
import { QuickPersonaPicker } from "@/components/quick-persona-picker"

interface SimpleChatInputProps {
  selectedPersona?: Persona
  webSearchEnabled?: boolean
  overrideModel?: string // Override the model
}

export function SimpleChatInput({ selectedPersona, webSearchEnabled: initialWebSearchEnabled, overrideModel }: SimpleChatInputProps = {}) {
  const { currentChatId, addMessage, createChat, settings, chats, setChats, user, isChatLoading, setIsChatLoading, chatAbortControllerRef, stopChatGeneration, setStreamingPhase, setCurrentTool, setSearchQuery, currentStreamingDetails, setCurrentStreamingDetails, addStreamingHistoryEntry, clearStreamingHistory, getStreamingHistory } = useApp()
  const { features, isAdvancedMode, isHifi } = useFeatureFlags()

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
  const [imageMode, setImageMode] = useState<"off" | "normal" | "high">("off")
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // NOTE: isAdvancedMode is now provided by useFeatureFlags() hook above

  // Load web search state from settings context (PERSIST USER PREFERENCE!)
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
  // NOTE: Also sync to settings context for persistence
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
          console.warn("[SimpleChatInput] Failed to sync web search to settings:", e)
        }
      }
    }
  }, [webSearchEnabled, reasoningEnabled])

  // NOTE: isAdvancedMode detection moved to useFeatureFlags() hook

  // HIFI: Auto-disable manual web search toggle (tool calling handles everything)
  useEffect(() => {
    if (isHifi && webSearchEnabled) {
      console.log("[SimpleChatInput] HiFi mode - disabling manual web search toggle (tool calling handles this)")
      setWebSearchEnabled(false)
    }
  }, [isHifi])

  // Update command suggestions when input changes (Advanced mode only with feature flag)
  useEffect(() => {
    if (!isAdvancedMode || !features.showSlashCommands) {
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
  }, [input, isAdvancedMode, features.showSlashCommands])

  // OPTIMIZED: Combined all window event listeners into single useEffect
  useEffect(() => {
    const handleInsertPrompt = (e: CustomEvent) => {
      setInput(e.detail)
    }

    const handleSetImageMode = (e: CustomEvent) => {
      // Support both boolean and string values for backwards compatibility
      const value = e.detail
      if (typeof value === "boolean") {
        setImageMode(value ? "normal" : "off")
      } else {
        setImageMode(value)
      }
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

    const handleFocusChatInput = () => {
      textareaRef.current?.focus()
    }

    window.addEventListener("insertPrompt" as any, handleInsertPrompt)
    window.addEventListener("setImageMode" as any, handleSetImageMode)
    window.addEventListener("sendQuickMessage" as any, handleSendQuickMessage)
    window.addEventListener("stopGeneration" as any, handleStopGeneration)
    window.addEventListener("focusChatInput", handleFocusChatInput)

    return () => {
      window.removeEventListener("insertPrompt" as any, handleInsertPrompt)
      window.removeEventListener("setImageMode" as any, handleSetImageMode)
      window.removeEventListener("sendQuickMessage" as any, handleSendQuickMessage)
      window.removeEventListener("stopGeneration" as any, handleStopGeneration)
      window.removeEventListener("focusChatInput", handleFocusChatInput)
    }
  }, [isChatLoading])

  const stopGeneration = () => {
    stopChatGeneration()
    toast({
      title: settings.language === "de" ? "Gestoppt" : "Stopped",
      description: settings.language === "de" ? "Antwort wurde abgebrochen" : "Response was cancelled",
    })
  }

  const handleVoice = async () => {
    const openAiKey = settings.apiKeys.openai
    if (!openAiKey) {
      toast({
        title: settings.language === "de" ? "API Key erforderlich" : "API key required",
        description: settings.language === "de"
          ? "Bitte OpenAI API Key in den Einstellungen hinterlegen"
          : "Please add OpenAI API key in settings",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      haptics.trigger('light')
      voiceService.stopWhisperListening()
      setIsListening(false)
    } else {
      haptics.trigger('medium')
      setIsListening(true)

      await voiceService.startWhisperListening(
        openAiKey,
        (text) => {
          haptics.trigger('success')
          setInput(text)
          setIsListening(false)
          toast({
            title: "✓ " + (settings.language === "de" ? "Transkribiert" : "Transcribed"),
            description: `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          })
        },
        (error) => {
          haptics.trigger('error')
          toast({
            title: settings.language === "de" ? "Sprachfehler" : "Voice error",
            description: error,
            variant: "destructive",
          })
          setIsListening(false)
        },
        () => {
          toast({
            title: settings.language === "de" ? "🎤 Aufnahme gestartet" : "🎤 Recording started",
            description: settings.language === "de"
              ? "Sprich jetzt... Klicke nochmal zum Stoppen"
              : "Speak now... Click again to stop",
          })
        }
      )
    }
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
    if (imageMode !== "off") {
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
        setImageMode("off")
        // Dispatch event to reset header button
        window.dispatchEvent(new CustomEvent("setImageMode", { detail: "off" }))
      }
      return
    }

    const currentChat = chats.find((c) => c.id === chatId)

    // Use override model or settings default
    let model = overrideModel || settings.selectedModel
    console.log("[Simple Chat] Using model:", model, overrideModel ? "(override)" : "(default)")

    // 🖼️ Vision Model Auto-Switching: Check if images are attached
    const imageAttachments = attachedFiles.filter(f => f.type.startsWith('image/'))
    if (imageAttachments.length > 0 && !supportsVision(model)) {
      const originalModel = model
      model = getRecommendedVisionModel(model)
      console.log("[Simple Chat] 🖼️ Images detected - temporarily switching to vision model:", model)
      toast({
        title: "🖼️ Vision mode activated",
        description: `Using ${model.split('/')[1]} for this image (will return to ${originalModel.split('/')[1]} for text-only messages)`,
        duration: 4000,
      })
    }

    /// Build system prompt: Use persona personality/prompt if provided, otherwise use settings
    // Note: `personality` is the preferred field, `prompt` is deprecated but supported for backwards compatibility
    let systemPrompt = selectedPersona?.personality || selectedPersona?.prompt || settings.systemPrompt

    // Add language instruction based on mode and settings
    // HIFI MODE = ALWAYS GERMAN - NO EXCEPTIONS
    if (isHifi) {
      // HiFi tier: FORCE GERMAN, always, no matter what
      systemPrompt = `${systemPrompt}\n\nWICHTIG: Antworte IMMER auf Deutsch (österreichisches Deutsch). NIEMALS auf Englisch antworten.`
      console.log("[Simple Chat] 🇦🇹 HiFi mode - FORCING GERMAN language")
    } else {
      // Non-HiFi: Use user's preferred language from settings
      const languageInstruction = settings.language === "en"
        ? "\n\nIMPORTANT: Always respond in English."
        : settings.language === "de"
        ? "\n\nWICHTIG: Antworte immer auf Deutsch."
        : settings.language === "es"
        ? "\n\nIMPORTANTE: Responde siempre en español."
        : "\n\nIMPORTANT: Always respond in English."

      systemPrompt = `${systemPrompt}${languageInstruction}`
    }

    // NOTE: User profile data is NOT injected directly into prompts
    // Profile data is stored in the memory system via memoryService.integrateProfile()
    // This ensures profile information is handled as retrievable memories, not hardcoded context

    console.log("[Simple Chat] Using persona:", selectedPersona?.name || "Default")
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
      //
      // HIFI MODE: Tool calling is ALWAYS enabled regardless of toggle (for Shopify, etc.)
      const supportsToolCalling = modelSupportsToolCalling(model)
      const searchHeuristics = analyzeQueryForSearch(input.trim())
      const shouldAutoSearchHeuristics = searchHeuristics.shouldSearch && searchHeuristics.confidence >= 0.4

      // Only do manual search if explicitly toggled OR (heuristics say yes AND no tool calling support)
      // HIFI: Never do manual search - let AI use tool calling for everything
      const performManualSearch = isHifi ? false : (webSearchEnabled || (!supportsToolCalling && shouldAutoSearchHeuristics))

      // Enable AI-driven search via tool calling when not doing manual search
      // HIFI: ALWAYS enable tool calling for Shopify and other tools
      const enableToolCallingSearch = isHifi ? supportsToolCalling : (!performManualSearch && supportsToolCalling)

      console.log("[Simple Chat] Web Search strategy:")
      console.log("[Simple Chat]   - HiFi mode:", isHifi)
      console.log("[Simple Chat]   - Manual toggle:", webSearchEnabled)
      console.log("[Simple Chat]   - Model supports tool calling:", supportsToolCalling)
      console.log("[Simple Chat]   - Heuristics auto-search:", shouldAutoSearchHeuristics)
      console.log("[Simple Chat]   - Perform manual search:", performManualSearch)
      console.log("[Simple Chat]   - Enable tool calling search:", enableToolCallingSearch, isHifi ? "(FORCED ON for HiFi)" : "")
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

          // HiFi defaults to Serper (better for products), Simple/Advanced respects settings
          // AUTO-FIX: If selected provider has no key, use an available one
          const manualDefaultProvider = isHifi ? "serper" : "tavily"
          let searchProvider = selectedPersona ? (settings.searchProvider || manualDefaultProvider) : manualDefaultProvider

          // Check if selected provider has a key, otherwise auto-switch
          const hasSelectedKey = searchProvider === "serper" ? settings.apiKeys.serper :
                                 searchProvider === "youcom" ? settings.apiKeys.youcom :
                                 settings.apiKeys.tavily

          if (!hasSelectedKey) {
            if (settings.apiKeys.serper) {
              console.log("[Simple Chat] ⚠️ Manual search: Auto-switching to Serper (selected provider has no key)")
              searchProvider = "serper"
            } else if (settings.apiKeys.tavily) {
              console.log("[Simple Chat] ⚠️ Manual search: Auto-switching to Tavily")
              searchProvider = "tavily"
            } else if (settings.apiKeys.youcom) {
              console.log("[Simple Chat] ⚠️ Manual search: Auto-switching to You.com")
              searchProvider = "youcom"
            }
          }

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
      let capturedGenerationId = "" // For exact cost tracking

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
      // HIFI: Default to Serper (better for product searches), others default to Tavily
      const defaultProvider = isHifi ? "serper" : "tavily"
      const rawSearchProvider = settings.searchProvider || defaultProvider
      let searchProviderForTools = rawSearchProvider === "youcom" ? "tavily" : rawSearchProvider
      let searchApiKeyForTools = searchProviderForTools === "serper"
        ? settings.apiKeys.serper
        : settings.apiKeys.tavily // exa would use tavily key as fallback

      // AUTO-FIX: If selected provider has no key, try to use another available key
      // This is critical for HiFi mode where tool calling MUST work
      if (!searchApiKeyForTools) {
        if (settings.apiKeys.serper) {
          console.log("[Simple Chat] ⚠️ Auto-switching to Serper (Tavily key missing)")
          searchProviderForTools = "serper"
          searchApiKeyForTools = settings.apiKeys.serper
        } else if (settings.apiKeys.tavily) {
          console.log("[Simple Chat] ⚠️ Auto-switching to Tavily (Serper key missing)")
          searchProviderForTools = "tavily"
          searchApiKeyForTools = settings.apiKeys.tavily
        } else {
          console.warn("[Simple Chat] ❌ NO SEARCH API KEY AVAILABLE - Tool calling will NOT work!")
        }
      }

      console.log("[Simple Chat] 🔧 Tool calling config:", {
        provider: searchProviderForTools,
        hasKey: !!searchApiKeyForTools,
        enableAutoToolUse: enableToolCallingSearch
      })

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
        // Tool calling for AI-driven tool use
        enableAutoToolUse: enableToolCallingSearch,
        searchProvider: searchProviderForTools as "tavily" | "serper" | "exa",
        searchApiKey: searchApiKeyForTools,
        searchSettings: searchProviderForTools === "serper" ? settings.serperSettings : settings.tavilySettings,
        // Experimental tool settings
        enableUrlFetchTool: settings.experimental?.enableUrlFetchTool !== false,
        enableYouTubeTool: settings.experimental?.enableYouTubeTool !== false,
        enableWeatherTool: settings.experimental?.enableWeatherTool !== false,
        // Shopify tool settings (HiFi mode)
        // DEBUG: Log Shopify settings status
        ...((() => {
          const hasStoreUrl = !!settings.shopifySettings?.storeUrl
          const hasToken = !!settings.shopifySettings?.accessToken
          console.log("[Simple Chat] 🛒 Shopify settings check:", {
            hasStoreUrl,
            hasToken,
            storeUrl: settings.shopifySettings?.storeUrl ? "***set***" : "EMPTY",
            enabled: hasStoreUrl && hasToken
          })
          return {}
        })()),
        enableShopifyTool: !!(settings.shopifySettings?.storeUrl && settings.shopifySettings?.accessToken),
        shopifyStoreUrl: settings.shopifySettings?.storeUrl,
        shopifyAccessToken: settings.shopifySettings?.accessToken,
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
            code_interpreter: "Executing and analyzing code",
            shopify_products: settings.language === "de" ? "Suche in Shopify Produkten..." : "Searching Shopify products..."
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
        // Capture generation ID for exact cost tracking
        onGenerationId: (generationId) => {
          console.log("[Simple Chat] 💰 Generation ID captured:", generationId)
          capturedGenerationId = generationId
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
        const estimatedCost = 0 // Now using exact costs from OpenRouter API

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
            ...(capturedGenerationId && { generationId: capturedGenerationId }),
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

  // Determine if input has content for send button styling
  const hasContent = input.trim().length > 0 || attachedFiles.length > 0

  return (
    <div className="bg-background p-2 md:p-4 border-t border-border/30 pb-[env(safe-area-inset-bottom,4px)] md:pb-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl w-full">
        {/* Main Input Container */}
        <div className="flex flex-col gap-1.5 md:gap-0">
          {/* Mobile: Action buttons row above textarea */}
          <div className="flex md:hidden items-center gap-1 px-0.5 pb-1">
            {/* Persona picker - hidden for HiFi (they have dedicated persona) */}
            {!isHifi && <QuickPersonaPicker />}
            {/* Action buttons */}
            <div className="flex items-center gap-0.5 ml-auto">
              {/* Web search - hidden for HiFi (tool calling handles this automatically) */}
              {!isHifi && (
                <Button
                  type="button"
                  size="icon"
                  variant={webSearchEnabled ? "default" : "ghost"}
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    webSearchEnabled
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                  onClick={() => {
                    haptics.trigger('selection')
                    setWebSearchEnabled(!webSearchEnabled)
                  }}
                >
                  <Globe className="h-3.5 w-3.5" />
                </Button>
              )}
              {/* File upload */}
              <FileUpload files={attachedFiles} onFilesChange={setAttachedFiles} />
              {/* Image mode */}
              <Button
                type="button"
                size="icon"
                variant={imageMode !== "off" ? "default" : "ghost"}
                className={cn(
                  "h-8 w-8 rounded-lg relative",
                  imageMode !== "off"
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                    : "text-muted-foreground"
                )}
                onClick={() => {
                  haptics.trigger('selection')
                  const nextState = imageMode === "off" ? "normal" : imageMode === "normal" ? "high" : "off"
                  setImageMode(nextState)
                }}
              >
                <Image className="h-3.5 w-3.5" />
                {imageMode === "high" && (
                  <span className="absolute -top-0.5 -right-0.5 text-[7px] font-bold bg-yellow-400 text-yellow-900 rounded-full w-3 h-3 flex items-center justify-center">+</span>
                )}
              </Button>
              {/* Reasoning (if supported) */}
              {modelSupportsReasoning && (
                <Button
                  type="button"
                  size="icon"
                  variant={reasoningEnabled ? "default" : "ghost"}
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    reasoningEnabled
                      ? "bg-amber-500 text-white"
                      : "text-muted-foreground"
                  )}
                  onClick={() => {
                    haptics.trigger('selection')
                    setReasoningEnabled(!reasoningEnabled)
                  }}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                </Button>
              )}
              {/* Voice input */}
              <Button
                type="button"
                size="icon"
                variant={isListening ? "default" : "ghost"}
                className={cn(
                  "h-8 w-8 rounded-lg",
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-muted-foreground"
                )}
                onClick={handleVoice}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Input row with send button */}
          <div className="flex items-end gap-2 md:gap-3">
            <div className="flex-1 min-w-0 relative">
              {/* Slash Command Suggestions (Advanced Mode Only with feature flag) */}
              {isAdvancedMode && features.showSlashCommands && commandSuggestions.length > 0 && (
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
              <Textarea
                ref={textareaRef}
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
                className={cn(
                  "min-h-[44px] md:min-h-[52px] max-h-[120px] md:max-h-[200px] resize-none text-sm sm:text-base rounded-xl",
                  "pr-3 md:pr-32",
                  "bg-muted/20 border border-border/40",
                  "focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                  "transition-all duration-200",
                  "py-2.5 pl-3 md:pt-3 md:pb-3 md:pl-4",
                  hasContent && "border-primary/30"
                )}
                disabled={isChatLoading}
              />
              {/* Desktop: Action Buttons inside textarea - hidden on mobile */}
              <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-3 items-center gap-2">
                <FileUpload files={attachedFiles} onFilesChange={setAttachedFiles} />
                {modelSupportsReasoning && (
                  <Button
                    type="button"
                    size="icon"
                    variant={reasoningEnabled ? "default" : "ghost"}
                    className={cn(
                      "h-8 w-8 rounded-lg transition-all",
                      reasoningEnabled ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setReasoningEnabled(!reasoningEnabled)}
                    title={reasoningEnabled ? "Reasoning enabled" : "Enable reasoning"}
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant={webSearchEnabled ? "default" : "ghost"}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all",
                    webSearchEnabled ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  title={webSearchEnabled ? getTranslation("webSearchEnabled", language) : getTranslation("webSearchDisabled", language)}
                >
                  <Globe className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant={imageMode !== "off" ? "default" : "ghost"}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all relative",
                    imageMode !== "off"
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    haptics.trigger('selection')
                    const nextState = imageMode === "off" ? "normal" : imageMode === "normal" ? "high" : "off"
                    setImageMode(nextState)
                  }}
                  title={imageMode === "off" ? "Enable image generation" : imageMode === "normal" ? "Click for high quality" : "Disable image mode"}
                >
                  <Image className="h-4 w-4" />
                  {imageMode === "high" && (
                    <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold bg-yellow-400 text-yellow-900 rounded-full w-3.5 h-3.5 flex items-center justify-center">+</span>
                  )}
                </Button>
              </div>
            </div>
            {/* Send Button */}
            <Button
              type={isChatLoading ? "button" : "submit"}
              onClick={isChatLoading ? stopGeneration : undefined}
              disabled={!isChatLoading && !hasContent}
              className={cn(
                "h-10 w-10 md:h-12 md:w-12 rounded-xl transition-all duration-200 flex-shrink-0",
                isChatLoading
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : hasContent
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                "active:scale-95"
              )}
              size="icon"
            >
              {isChatLoading ? <Square className="h-4 w-4 md:h-5 md:w-5" /> : <Send className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>
          </div>
        </div>
        {/* Context Window Meter - Only show in advanced mode */}
        {features.showContextMeter && (
          <div className="mt-1.5 flex justify-end">
            <ContextWindowMeter compact />
          </div>
        )}
      </form>
    </div>
  )
}
