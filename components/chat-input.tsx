"use client"

import type React from "react"
import { FolderOpen, Send, Mic, Globe, MicOff, Square, Zap, Image } from "lucide-react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Message, StreamingHistoryEntry } from "@/types"
import { streamChatMessage, REASONING_MODELS } from "@/lib/openrouter"
import { search, buildSearchContext } from "@/lib/search"
import { useToast } from "@/hooks/use-toast"
import { FileUpload } from "@/components/file-upload"
import { extractTextFromAttachments, type FileAttachment, getFileCategory } from "@/lib/file-handler"
import { voiceService } from "@/lib/voice"
import { buildMultimodalContent, hasImages, getImageCount, stripImageDataFromContent } from "@/lib/multimodal-utils"
import { supportsVision, getRecommendedVisionModel, validateImageForModel } from "@/lib/vision-models"
import { compressImages, getImageSizeKB } from "@/lib/image-utils"
import { haptics } from "@/lib/haptics"
import { documentCollectionService } from "@/lib/document-collections"
import { generateUUID } from "@/lib/utils"
import { supabaseSync } from "@/lib/supabase/sync"
import { estimateTokens } from "@/lib/token-tracker"
import { memoryService } from "@/lib/memory-service"
import { personaMemoryService } from "@/lib/persona-memory-service"
import { personaContextAwareness } from "@/lib/persona-context-awareness"
import { personaPreferencesService } from "@/lib/persona-preferences-service"
import { userProfileService } from "@/lib/user-profile"
import { TokenCounterPreview } from "@/components/token-counter-preview"
import { ContextWindowMeter } from "@/components/context-window-meter"
import { parseSlashCommand, getCommandSuggestions, buildCommandPrompt, SLASH_COMMANDS } from "@/lib/slash-commands"
import { QuickModelPicker } from "@/components/quick-model-picker"
import { QuickPersonaPicker } from "@/components/quick-persona-picker"
import type { Persona } from "@/lib/personas"
import { usePromptInspectorStore } from "@/lib/prompt-inspector-store"
import { useDraft } from "@/hooks/use-draft"

export function ChatInput() {
  const { currentChatId, addMessage, createChat, settings, chats, setChats, user, updateSettings, setIsChatLoading, setStreamingPhase, setCurrentTool, setSearchQuery, currentStreamingDetails, setCurrentStreamingDetails, addStreamingHistoryEntry, clearStreamingHistory, getStreamingHistory } = useApp()
  const currentChat = chats.find((c) => c.id === currentChatId)
  const isEmpty = !currentChat || currentChat.messages.length === 0

  // Draft auto-save system
  const { draft, saveDraft, clearDraft, isRestored } = useDraft(currentChatId)
  const [input, setInput] = useState("")

  // Restore draft when hook is ready
  useEffect(() => {
    if (isRestored && draft && !input) {
      setInput(draft)
    }
  }, [isRestored, draft])
  const [isLoading, setIsLoading] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  // Image mode: "off" | "normal" | "high"
  const [imageMode, setImageMode] = useState<"off" | "normal" | "high">("off")
  const [reasoningEnabled, setReasoningEnabled] = useState(() => {
    if (typeof window === "undefined") return false
    const saved = localStorage.getItem("chameleon-reasoning-enabled")
    return saved === "true"
  })

  // Save reasoning state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chameleon-reasoning-enabled", String(reasoningEnabled))
    }
  }, [reasoningEnabled])
  const [attachedCollectionId, setAttachedCollectionId] = useState<string | null>(null)
  const [commandSuggestions, setCommandSuggestions] = useState<typeof SLASH_COMMANDS>([])
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { setInspectorData } = usePromptInspectorStore()

  useEffect(() => {
    const handleInsertPrompt = (e: CustomEvent) => {
      setInput(e.detail)
    }
    const handleAttachCollection = (e: CustomEvent) => {
      setAttachedCollectionId(e.detail)
      const collection = documentCollectionService.getCollection(e.detail)
      if (collection) {
        toast({
          title: "Collection attached",
          description: `${collection.name} (${collection.documents.length} documents)`,
        })
      }
    }
    const handleFocusChatInput = () => {
      // Focus the textarea and open keyboard on mobile
      textareaRef.current?.focus()
    }
    window.addEventListener("insertPrompt" as any, handleInsertPrompt)
    window.addEventListener("attachCollection" as any, handleAttachCollection)
    window.addEventListener("focusChatInput", handleFocusChatInput)
    return () => {
      window.removeEventListener("insertPrompt" as any, handleInsertPrompt)
      window.removeEventListener("attachCollection" as any, handleAttachCollection)
      window.removeEventListener("focusChatInput", handleFocusChatInput)
    }
  }, [toast])

  const toggleVoiceInput = async () => {
    // Check if OpenAI API key is available for Whisper
    const openAiKey = settings.apiKeys.openAI
    if (!openAiKey) {
      haptics.trigger('error')
      toast({
        title: "API key erforderlich",
        description: "Bitte OpenAI API Key in den Einstellungen hinterlegen (Einstellungen → API Keys → OpenAI)",
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

      // Use Whisper API (works in all browsers including Firefox and mobile)
      await voiceService.startWhisperListening(
        openAiKey,
        (text) => {
          haptics.trigger('success')
          setInput(text)
          setIsListening(false)
          toast({
            title: "✓ Transkribiert",
            description: `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          })
        },
        (error) => {
          haptics.trigger('error')
          toast({
            title: "Sprachfehler",
            description: error,
            variant: "destructive",
          })
          setIsListening(false)
        },
        () => {
          toast({
            title: "🎤 Aufnahme gestartet",
            description: "Sprich jetzt... Klicke nochmal zum Stoppen",
          })
        }
      )
    }
  }

  const toggleSpeech = (text: string) => {
    if (!voiceService.isSupported()) {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      })
      return
    }

    if (isSpeaking) {
      voiceService.stopSpeaking()
      setIsSpeaking(false)
    } else {
      setIsSpeaking(true)
      voiceService.speak(text, {
        rate: settings.voiceSettings?.rate || 1,
        pitch: settings.voiceSettings?.pitch || 1,
        voice: settings.voiceSettings?.voice,
      })
      setTimeout(() => setIsSpeaking(false), 100)
    }
  }

  // Listen for toggle events from header
  useEffect(() => {
    const handleToggleVoice = () => toggleVoiceInput()
    const handleSetImageMode = (e: CustomEvent<"off" | "normal" | "high">) => {
      haptics.trigger('selection')
      setImageMode(e.detail)
    }
    const handleToggleReasoning = () => setReasoningEnabled(prev => !prev)

    window.addEventListener("toggleVoice", handleToggleVoice)
    window.addEventListener("setImageMode", handleSetImageMode as EventListener)
    window.addEventListener("toggleReasoning", handleToggleReasoning)
    return () => {
      window.removeEventListener("toggleVoice", handleToggleVoice)
      window.removeEventListener("setImageMode", handleSetImageMode as EventListener)
      window.removeEventListener("toggleReasoning", handleToggleReasoning)
    }
  })

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      setIsChatLoading(false)
      toast({
        title: "Generation stopped",
        description: "Response generation has been cancelled",
      })
    }
  }, [toast, setIsChatLoading])

  // Handle input change and slash command suggestions
  const handleInputChange = useCallback((value: string) => {
    setInput(value)
    saveDraft(value) // Auto-save draft

    // Check for slash commands
    if (value.trim().startsWith('/')) {
      const suggestions = getCommandSuggestions(value.trim())
      setCommandSuggestions(suggestions)
      setShowCommandMenu(suggestions.length > 0)
    } else {
      setShowCommandMenu(false)
      setCommandSuggestions([])
    }
  }, [saveDraft])

  // Select a slash command from suggestions
  const selectCommand = useCallback((command: typeof SLASH_COMMANDS[0]) => {
    setInput(command.command + ' ')
    setShowCommandMenu(false)
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return

    haptics.trigger('medium')
    console.log("[v0] Starting chat submission")
    abortControllerRef.current = new AbortController()

    let chatId = currentChatId
    if (!chatId) {
      chatId = createChat()
      console.log("[v0] Created new chat:", chatId)
    }

    let messageContent = input.trim()

    // Parse slash commands
    const { isCommand, command, remainingText } = parseSlashCommand(messageContent)
    if (isCommand && command) {
      // Handle action commands (toggle settings)
      if (command.action) {
        if (command.action === 'toggle-reasoning') {
          const newState = !reasoningEnabled
          setReasoningEnabled(newState)
          toast({
            title: newState ? "🧠 Reasoning enabled" : "Reasoning disabled",
            description: newState ? "AI will show its thinking process" : "Standard response mode",
          })
        } else if (command.action === 'toggle-web-search') {
          const newState = !webSearchEnabled
          setWebSearchEnabled(newState)
          toast({
            title: newState ? "🌐 Web search enabled" : "Web search disabled",
            description: newState ? "AI will search the web for answers" : "Using knowledge only",
          })
        }
        setInput('')
        clearDraft()
        return // Don't send a message for action commands
      }

      messageContent = buildCommandPrompt(command, remainingText)
      toast({
        title: `Slash Command: ${command.command}`,
        description: command.description,
      })
    }

    // Compress images before sending to prevent 413 errors
    let processedFiles = attachedFiles
    const imageAttachments = attachedFiles.filter(f => getFileCategory(f.name) === "image")

    if (imageAttachments.length > 0) {
      toast({
        title: "🖼️ Compressing images...",
        description: `Processing ${imageAttachments.length} image(s)`,
      })

      try {
        // Compress all images to stay under payload limit
        const imageDataUrls = imageAttachments.map(img => img.dataUrl || "").filter(Boolean)
        const compressedDataUrls = await compressImages(imageDataUrls, 500) // 500KB max per image

        // Create new array with compressed images
        let compressedIndex = 0
        processedFiles = attachedFiles.map(file => {
          if (getFileCategory(file.name) === "image" && file.dataUrl) {
            const compressed = compressedDataUrls[compressedIndex++]
            const originalKB = getImageSizeKB(file.dataUrl)
            const compressedKB = getImageSizeKB(compressed)
            console.log(`[Image] ${file.name}: ${originalKB.toFixed(0)}KB → ${compressedKB.toFixed(0)}KB`)
            return { ...file, dataUrl: compressed }
          }
          return file
        })
      } catch (error) {
        console.error("[Image] Compression failed:", error)
        toast({
          title: "⚠️ Image compression failed",
          description: "Using original images",
          variant: "destructive",
        })
      }
    }

    // Build multimodal content (properly handles images for vision models)
    const multimodalContent = buildMultimodalContent(messageContent, processedFiles)
    let currentModel = chats.find((c) => c.id === chatId)?.model || settings.selectedModel
    const modelSupportsVision = supportsVision(currentModel)

    // Warn or auto-switch if images are attached but model doesn't support vision
    if (imageAttachments.length > 0 && !modelSupportsVision) {
      const recommendedModel = getRecommendedVisionModel(currentModel)

      // Update the model variable IMMEDIATELY for this message (React state update is async)
      currentModel = recommendedModel

      toast({
        title: "🖼️ Vision mode activated",
        description: `Using ${recommendedModel.split('/')[1]} for this image (will return to ${(chats.find((c) => c.id === chatId)?.model || settings.selectedModel).split('/')[1]} for text messages)`,
        duration: 4000,
      })

      // Also update chat state for persistence (async)
      if (chatId) {
        const currentChat = chats.find((c) => c.id === chatId)
        if (currentChat) {
          setChats(chats.map(c =>
            c.id === chatId ? { ...c, model: recommendedModel } : c
          ))
        }
      }
    }

    // Validate image size/count for the model
    if (imageAttachments.length > 0) {
      const totalSizeMB = imageAttachments.reduce((sum, f) => sum + (f.size / 1024 / 1024), 0)
      const validation = validateImageForModel(
        modelSupportsVision ? currentModel : getRecommendedVisionModel(currentModel),
        imageAttachments.length,
        totalSizeMB
      )

      if (!validation.valid) {
        haptics.trigger('error')
        toast({
          title: "Image validation failed",
          description: validation.error,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: multimodalContent, // Now supports both string and multimodal array
      timestamp: Date.now(),
      attachments: processedFiles.map((f) => ({
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
    console.log("[v0] Added user message")
    setInput("")
    clearDraft() // Clear saved draft after successful send
    setAttachedFiles([])
    setIsLoading(true)
    setIsChatLoading(true) // Triggers loading animation in ChatMessages
    // Set initial streaming phase immediately for step-by-step visualization
    setStreamingPhase("thinking")
    // CRITICAL FIX: Set initial streaming details with action text instead of null
    // This prevents the static "Processing..." state that looks buggy
    setCurrentStreamingDetails({
      phase: "thinking",
      action: settings.language === "de" ? "Analysiere Nachricht..." :
              settings.language === "es" ? "Analizando mensaje..." :
              "Analyzing your message..."
    })
    // Clear and start streaming history for verbose display
    clearStreamingHistory()
    addStreamingHistoryEntry({
      phase: "thinking",
      description: "Analyzing your message and planning response"
    })

    // Handle image generation mode - "normal" or "high" quality
    if (imageMode !== "off") {
      try {
        const apiKey = settings.apiKeys.openRouter
        const isHighQuality = imageMode === "high"

        if (!apiKey) {
          throw new Error('OpenRouter API key required. Add it in Settings → API Keys')
        }

        toast({
          title: "🎨 Generating image...",
          description: inputImagesForGen.length > 0
            ? "Editing uploaded image..."
            : isHighQuality ? "Using Gemini 3 Pro (high quality)" : "Using Gemini 2.5 Flash",
        })

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: messageContent,
            apiKey,
            quality: isHighQuality ? "high" : "normal",
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
          content: `Generated image: ${messageContent}`,
          imageUrl: data.url,
          timestamp: Date.now(),
          stats: {
            model: data.model,
            responseTime: 0,
          },
        }

        addMessage(chatId, imageMessage)
        haptics.trigger('success')
        toast({
          title: "🎨 Bild generiert!",
          description: "Das Bild wurde erfolgreich erstellt",
        })
      } catch (error) {
        console.error('Image generation error:', error)
        haptics.trigger('error')
        toast({
          title: "Fehler bei Bildgenerierung",
          description: error instanceof Error ? error.message : 'Unbekannter Fehler',
          variant: "destructive",
          duration: 5000,
        })
      } finally {
        setIsLoading(false)
        setIsChatLoading(false)
        setImageMode(false) // Reset image mode after generation
      }
      return
    }

    const currentChat = chats.find ((c) => c.id === chatId)
    // Use the currentModel variable which may have been updated for vision support
    const model = currentModel || settings.selectedModel
    console.log("[v0] Using model:", model)

    // Build system prompt: Base + Language instruction + Persona personality
    let systemPrompt = settings.systemPrompt // Start with base

    // Add language instruction based on UI language setting
    const languageInstruction = settings.language === "en"
      ? "\n\nIMPORTANT: Always respond in English."
      : settings.language === "de"
      ? "\n\nWICHTIG: Antworte immer auf Deutsch."
      : settings.language === "es"
      ? "\n\nIMPORTANTE: Responde siempre en español."
      : "\n\nIMPORTANT: Always respond in English."

    systemPrompt = `${systemPrompt}${languageInstruction}`

    if (settings.selectedPersona) {
      if (settings.selectedPersona.personality) {
        // New format: Base prompt + language + persona personality
        systemPrompt = `${systemPrompt}\n\n--- PERSONA PERSONALITY ---\n${settings.selectedPersona.personality}`
        console.log("[v0] Using persona with personality:", settings.selectedPersona.name)
      } else if (settings.selectedPersona.prompt) {
        // Old format: Full prompt (backward compatibility)
        systemPrompt = `${settings.selectedPersona.prompt}${languageInstruction}`
        console.log("[v0] Using persona with legacy prompt:", settings.selectedPersona.name)
      }
    }

    // NOTE: User profile data is NOT injected directly into prompts
    // Profile data is stored in the memory system via memoryService.integrateProfile()
    // This ensures profile information is handled as retrievable memories, not hardcoded context

    const messages = [
      { role: "system" as const, content: systemPrompt },
      // CRITICAL: Strip image data from historical messages to prevent PWA crashes
      // Vision models only look at images in the current message anyway
      ...(currentChat?.messages || []).map((m) => ({
        role: m.role,
        content: stripImageDataFromContent(m.content), // Remove old image data for memory efficiency
      })),
      { role: "user" as const, content: multimodalContent }, // Current message keeps full image data
    ]

    try {
      if (attachedCollectionId) {
        const collectionContext = documentCollectionService.getCollectionContext(
          attachedCollectionId,
          input.trim(),
          4000,
        )
        if (collectionContext) {
          messages.splice(1, 0, {
            role: "system" as const,
            content: `Relevant documents from knowledge base:\n\n${collectionContext}`,
          })
        }
      }

      // Web search with unified provider selection
      const searchProvider = settings.searchProvider || "tavily"
      const hasSearchKey =
        (searchProvider === "tavily" && settings.apiKeys.tavily) ||
        (searchProvider === "serper" && settings.apiKeys.serper) ||
        (searchProvider === "exa" && settings.apiKeys.exa)

      if (webSearchEnabled && hasSearchKey) {
        try {
          // Set streaming phase to searching and show the query
          setStreamingPhase("searching")
          setSearchQuery(input.trim())
          setCurrentStreamingDetails({
            phase: "searching",
            searchQuery: input.trim(),
            searchProvider: searchProvider,
            action: `Searching ${searchProvider}: "${input.trim()}"`,
          })

          // Toast removed - SearchSourcesBadge provides feedback

          // Build provider-specific options
          const searchOptions = searchProvider === "exa" ? {
            maxResults: settings.exaSettings?.maxResults || 5,
            type: settings.exaSettings?.searchType || "auto",
            useAutoprompt: settings.exaSettings?.useAutoprompt ?? true,
            includeFullText: settings.exaSettings?.includeFullText ?? true,
            includeHighlights: settings.exaSettings?.includeHighlights ?? true,
            includeSummary: settings.exaSettings?.includeSummary ?? false,
            includeImages: settings.exaSettings?.includeImages ?? false,
            highlightsPerResult: settings.exaSettings?.highlightsPerResult || 3,
            maxTextCharacters: settings.exaSettings?.maxTextCharacters || 3000,
            livecrawl: settings.exaSettings?.livecrawl || "fallback",
            category: settings.exaSettings?.category,
            includeDomains: settings.exaSettings?.includeDomains,
            excludeDomains: settings.exaSettings?.excludeDomains,
            apiKey: settings.apiKeys.exa,
          } : searchProvider === "serper" ? {
            maxResults: settings.serperSettings?.maxResults || 5,
            includeImages: settings.serperSettings?.includeImages ?? false,
            country: settings.serperSettings?.country || "at",
            language: settings.serperSettings?.language || "de",
            type: settings.serperSettings?.type || "search",
            timeRange: settings.serperSettings?.timeRange || "none",
            autocorrect: settings.serperSettings?.autocorrect ?? true,
            apiKey: settings.apiKeys.serper,
          } : {
            maxResults: settings.tavilySettings?.maxResults || 5,
            searchDepth: settings.tavilySettings?.searchDepth || "basic",
            includeImages: settings.tavilySettings?.includeImages ?? false,
            includeDomains: settings.tavilySettings?.includeDomains,
            excludeDomains: settings.tavilySettings?.excludeDomains,
            includeRawContent: settings.tavilySettings?.includeRawContent ?? false,
            topic: settings.tavilySettings?.topic || "general",
            apiKey: settings.apiKeys.tavily,
          }

          // Use unified search function
          const searchResponse = await search(searchProvider, input.trim(), searchOptions)

          // Build context using unified formatter
          const searchContext = buildSearchContext(searchResponse, {
            includeImages: settings.tavilySettings?.includeImages || settings.serperSettings?.includeImages || settings.exaSettings?.includeImages,
          })

          messages.splice(-1, 0, { role: "system" as const, content: searchContext })

          // Update streaming details with results
          const imageCount = searchResponse.images?.length || 0
          setCurrentStreamingDetails(prev => ({
            ...prev,
            resultCount: searchResponse.results.length,
            resultSummary: `${searchResponse.results.length} results${imageCount > 0 ? ` + ${imageCount} images` : ''} found`,
            searchResultsPreview: searchResponse.results.slice(0, 3).map(r => r.title || r.url).join(", "),
            searchResults: searchResponse.results, // Full search results array for rich display
          }))

          // Add to streaming history
          addStreamingHistoryEntry({
            phase: "searching",
            searchQuery: input.trim(),
            searchProvider: searchProvider,
            resultCount: searchResponse.results.length,
            searchResults: searchResponse.results, // Store full results for history display
            action: `Searched ${searchProvider}: "${input.trim()}"`,
            description: `Found ${searchResponse.results.length} results`,
          })

          // Toast removed - SearchSourcesBadge provides visual feedback

        } catch (searchError) {
          console.error("[v0] Search error:", searchError)
          toast({
            title: "Suche fehlgeschlagen",
            description: `${searchProvider === "exa" ? "Exa" : searchProvider === "serper" ? "Serper" : "Tavily"} Suche fehlgeschlagen - fahre ohne Websuche fort`,
            variant: "destructive",
          })
        }
      }

      // Memory: Phase 3 intelligent memory retrieval with classification + semantic search
      // Wrapped in try-catch to prevent memory issues from blocking chat
      if (settings.memorySettings?.enabled) {
        try {
          const isPersonaChat = !!settings.selectedPersona
          console.log("[ChatInput] 🧠 Intelligent memory retrieval for query:", input.trim().substring(0, 50),
            isPersonaChat ? "(persona chat)" : "")

          const { memories: relevantMemories, decision, searchMethod } =
            await memoryService.getRelevantMemoriesWithClassification(
              input.trim(),
              settings.apiKeys.openRouter,
              settings.memorySettings.maxMemoriesInContext,
              isPersonaChat
            )

          // Log the decision with full details
          if (decision.action === "skipped") {
            console.log("[ChatInput] ⏭️ Memory skipped:", decision.reason,
              `(type: ${decision.details.queryType}, confidence: ${decision.details.confidence?.toFixed(2)})`)
          } else if (decision.action === "retrieved" && relevantMemories.length > 0) {
            const memoryContext = memoryService.formatMemoriesForContext(relevantMemories)
            messages.splice(-1, 0, { role: "system" as const, content: memoryContext })
            console.log("[ChatInput] ✅ Memory context added:", decision.reason,
              decision.details.topSimilarity ? `(top similarity: ${decision.details.topSimilarity.toFixed(3)})` : "")
          } else {
            console.log("[ChatInput] 📭", decision.reason,
              decision.details.topSimilarity ? `(top similarity: ${decision.details.topSimilarity.toFixed(3)})` : "")
          }
        } catch (memoryError) {
          console.error("[ChatInput] ⚠️ Memory retrieval failed, continuing without memory:", memoryError)
          // Continue without memory - don't block the chat
        }
      }

      // Persona Memory: Add persona-specific memories if enabled
      if (settings.selectedPersona?.memorySettings?.enabled) {
        console.log("[ChatInput] 👤 Retrieving persona memories for:", settings.selectedPersona.name)
        const relevantConversations = personaMemoryService.getRelevantConversations(
          settings.selectedPersona.id,
          input.trim(),
          3
        )

        if (relevantConversations.length > 0) {
          const personaMemoryContext = personaMemoryService.formatConversationsForContext(relevantConversations)
          messages.splice(-1, 0, { role: "system" as const, content: personaMemoryContext })
          console.log("[ChatInput] ✅ Persona memory context added:", relevantConversations.length, "conversations")
        }
      }

      // Context Awareness: Add time, mood, and topic awareness if enabled
      if (settings.selectedPersona?.contextSettings?.enabled) {
        console.log("[ChatInput] 🎯 Adding context awareness for:", settings.selectedPersona.name)

        const currentChatMessages = currentChat?.messages || []
        const userMessages = currentChatMessages.filter((m) => m.role === "user").map((m) => m.content)
        userMessages.push(input.trim()) // Add current message

        const contextData = personaContextAwareness.generateContextData(userMessages)
        const contextPrompt = personaContextAwareness.formatContextForPrompt(
          contextData,
          settings.selectedPersona.name,
          {
            useTimeBasedGreetings: settings.selectedPersona.contextSettings.useTimeBasedGreetings,
            detectMood: settings.selectedPersona.contextSettings.detectMood,
            trackTopics: settings.selectedPersona.contextSettings.trackTopics,
          }
        )

        if (contextPrompt) {
          messages.splice(-1, 0, { role: "system" as const, content: contextPrompt })
          console.log("[ChatInput] ✅ Context awareness added:", contextData)
        }
      }

      // Learned Preferences: Add user's learned preferences if persona has any
      if (settings.selectedPersona) {
        const preferencesContext = personaPreferencesService.formatPreferencesForContext(
          settings.selectedPersona.id,
          settings.selectedPersona.name
        )

        if (preferencesContext) {
          messages.splice(-1, 0, { role: "system" as const, content: preferencesContext })
          console.log("[ChatInput] 🎓 Learned preferences added for", settings.selectedPersona.name)
        }
      }

      const assistantMessageId = generateUUID()
      let assistantContent = ""
      let reasoningContent = ""
      let messageAdded = false
      let capturedGenerationId = "" // For exact cost tracking
      let capturedAllGenerationIds: string[] = [] // All generation IDs for tool calling
      let capturedToolCallCount = 0 // Number of tool call iterations
      let capturedStopReason = "" // For stop reason stats

      console.log("[v0] Creating assistant message:", assistantMessageId)

      const modelParams = settings.modelParameters || {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
      }

      const enforcedMaxTokens = Math.max(
        modelParams.maxTokens || 4096,
        settings.maxTokens || 4096,
        settings.modelParameters?.maxTokens || 4096,
        4096,
      )

      modelParams.maxTokens = enforcedMaxTokens

      console.log("[v0] Starting stream with model:", model)

      const promptText = messages.map((m) => m.content).join("\n")
      const promptTokens = estimateTokens(promptText)

      // Capture data for Prompt Inspector
      setInspectorData({
        systemPrompt: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        modelParams: {
          model: model,
          temperature: modelParams.temperature,
          maxTokens: modelParams.maxTokens,
          topP: modelParams.topP,
          frequencyPenalty: modelParams.frequencyPenalty,
          presencePenalty: modelParams.presencePenalty,
        },
        timestamp: Date.now(),
      })
      console.log("[v0] Inspector data captured")

      // Performance tracking
      const streamStartTime = Date.now()
      let firstTokenTime: number | null = null

      // CRITICAL FIX: Throttle state updates to prevent crashes
      // Previous code updated state on every token (50-100+ times/sec) causing GPU overload
      let lastUpdateTime = 0
      let pendingUpdate = false
      const UPDATE_INTERVAL = 50 // Only update UI every 50ms

      const flushUpdate = () => {
        pendingUpdate = false
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

      const onChunk = (chunk: string) => {
        // Track time to first token
        if (!firstTokenTime) {
          firstTokenTime = Date.now() - streamStartTime
        }
        assistantContent += chunk

        // Throttle state updates - only update every UPDATE_INTERVAL ms
        const now = Date.now()
        if (now - lastUpdateTime >= UPDATE_INTERVAL) {
          lastUpdateTime = now
          flushUpdate()
        } else if (!pendingUpdate) {
          // Schedule an update for the end of the interval
          pendingUpdate = true
          setTimeout(() => {
            if (pendingUpdate) {
              lastUpdateTime = Date.now()
              flushUpdate()
            }
          }, UPDATE_INTERVAL - (now - lastUpdateTime))
        }
      }

      const onReasoning = (chunk: string) => {
        reasoningContent += chunk
      }

      // Determine which search API key to use based on provider
      const autoSearchProvider = settings.searchProvider || "tavily"
      const autoSearchApiKey =
        autoSearchProvider === "tavily"
          ? settings.apiKeys.tavily
          : autoSearchProvider === "serper"
          ? settings.apiKeys.serper
          : settings.apiKeys.exa

      // Build search settings based on provider
      const autoSearchSettings =
        autoSearchProvider === "tavily"
          ? settings.tavilySettings || {}
          : autoSearchProvider === "serper"
          ? settings.serperSettings || {}
          : settings.exaSettings || {}

      await streamChatMessage(messages, model, onChunk, {
        temperature: modelParams.temperature,
        maxTokens: modelParams.maxTokens,
        topP: modelParams.topP,
        frequencyPenalty: modelParams.frequencyPenalty,
        presencePenalty: modelParams.presencePenalty,
        apiKey: settings.apiKeys.openRouter,
        signal: abortControllerRef.current?.signal,
        reasoning: reasoningEnabled, // Always pass if enabled - OpenRouter handles compatibility
        onReasoning,
        // Auto tool use (tool calling) - AI decides when to use tools
        enableAutoToolUse: settings.enableAutoToolUse ?? true,
        searchProvider: autoSearchProvider,
        searchApiKey: autoSearchApiKey,
        searchSettings: autoSearchSettings,
        // Experimental tool settings
        enableUrlFetchTool: settings.experimental?.enableUrlFetchTool !== false,
        enableYouTubeTool: settings.experimental?.enableYouTubeTool !== false,
        enableWeatherTool: settings.experimental?.enableWeatherTool !== false,
        onSearchStart: (query) => {
          // Toast removed - MessageStatus provides real-time feedback
          console.log("[Advanced Chat] 🔍 AI search started:", query)
        },
        onSearchComplete: () => {
          // Toast removed - SearchSourcesBadge shows results visually
          console.log("[Advanced Chat] ✅ AI search complete")
        },
        // Phase tracking for step-by-step visualization
        onPhaseChange: (phase) => {
          console.log("[Advanced Chat] 📍 Phase change:", phase)
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
          console.log("[Advanced Chat] 🔧 Tool use:", toolName)
          setCurrentTool(toolName)
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
        },
        onSearchQuery: (query) => {
          console.log("[Advanced Chat] 🔍 Search query:", query)
          setSearchQuery(query)
          addStreamingHistoryEntry({
            phase: "searching",
            detail: query,
            description: `Searching web for: "${query}"`
          })
        },
        // Capture generation ID for exact cost tracking
        onGenerationId: (generationId) => {
          console.log("[Advanced Chat] 💰 Generation ID captured:", generationId)
          capturedGenerationId = generationId
        },
        // Capture all generation IDs for tool calling cost tracking
        onAllGenerationIds: (generationIds, toolCallCount) => {
          console.log(`[Advanced Chat] 💰 All generation IDs captured: ${generationIds.length} (${toolCallCount} tool calls)`)
          capturedAllGenerationIds = generationIds
          capturedToolCallCount = toolCallCount
        },
        // Capture stop reason for stats
        onStopReason: (reason) => {
          console.log("[Advanced Chat] 🛑 Stop reason:", reason)
          capturedStopReason = reason
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
            // For other details (search query, action, searchResults, etc.), merge with previous
            return {
              ...prev,
              ...details
            }
          })
          // Only add to streaming history for significant events (NOT every reasoning chunk)
          // Reasoning content updates the live display but doesn't spam history
          // CRITICAL: Also check for searchResults to capture the final search results data
          if (details.phase || details.searchQuery || details.toolName || details.searchResults) {
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
              searchResults: details.searchResults, // Add full results for history display
              description: details.resultSummary || details.action || (details.searchQuery ? `Searching: "${details.searchQuery}"` : undefined)
            })
          }
        },
      })

      console.log("[v0] Stream complete, final content length:", assistantContent.length)
      // CRASH DEBUG: Save checkpoint to localStorage before potentially crashing operations
      try {
        localStorage.setItem('_crash_debug_checkpoint', JSON.stringify({
          time: Date.now(),
          step: 'stream_complete',
          contentLength: assistantContent.length
        }))
      } catch (e) { /* ignore */ }

      // Flush any pending throttled update to ensure final content is displayed
      if (pendingUpdate) {
        pendingUpdate = false
        flushUpdate()
      }

      // Calculate performance stats
      const responseTime = (Date.now() - streamStartTime) / 1000 // in seconds

      if (messageAdded && assistantContent) {
        const completionTokens = estimateTokens(assistantContent)
        const totalTokens = promptTokens + completionTokens
        // Simple fallback cost estimate (exact costs fetched async via useAutoFetchCosts)
        // Use rough pricing: ~$0.50/1M input, ~$1.50/1M output (cheap model average)
        const inputCost = (promptTokens / 1_000_000) * 0.50
        const outputCost = (completionTokens / 1_000_000) * 1.50
        const estimatedCost = inputCost + outputCost

        // Calculate tokens per second
        const tokensPerSecond = responseTime > 0 ? completionTokens / responseTime : 0

        // CRASH DEBUG: Save checkpoint
        try {
          localStorage.setItem('_crash_debug_checkpoint', JSON.stringify({
            time: Date.now(),
            step: 'before_streaming_history',
            tokens: totalTokens
          }))
        } catch (e) { /* ignore */ }

        // Get streaming history for verbose display on completed messages
        // SAFETY: Limit to 50 entries max to prevent memory issues
        const rawHistory = getStreamingHistory()
        const streamingHistoryForMessage = rawHistory.slice(-50)

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
            responseTime,
            tokensPerSecond,
            ...(firstTokenTime !== null && { firstTokenTime: firstTokenTime / 1000 }), // Convert to seconds
            ...(capturedGenerationId && { generationId: capturedGenerationId }),
            ...(capturedAllGenerationIds.length > 0 && { allGenerationIds: capturedAllGenerationIds }),
            ...(capturedToolCallCount > 0 && { toolCallCount: capturedToolCallCount }),
            ...(capturedStopReason && { stopReason: capturedStopReason }),
          },
          ...(reasoningContent ? { reasoning: reasoningContent } : {}),
          ...(streamingHistoryForMessage.length > 0 ? { streamingHistory: streamingHistoryForMessage } : {}),
        }

        if (user) {
          // OPTIMIZED: Removed JSON.stringify(finalMessage.stats) - was causing memory pressure
          console.log("[v0] Saving final message to Supabase with tokens:", totalTokens)
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
              console.error("[v0] Failed to save message or track usage:", error)
            })
        }

        // CRASH DEBUG: Checkpoint before state update (most likely crash point)
        try {
          localStorage.setItem('_crash_debug_checkpoint', JSON.stringify({
            time: Date.now(),
            step: 'before_setChats',
            historyLength: finalMessage.streamingHistory?.length || 0
          }))
        } catch (e) { /* ignore */ }

        // SAFETY: Avoid JSON.stringify on stats (can fail with large objects)
        console.log("[v0] Updating chat state with stats - tokens:", finalMessage.tokens?.total)
        setChats((prevChats) => {
          try {
            return prevChats.map((chat) => {
              if (chat.id !== chatId) return chat
              const updatedMessages = chat.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, tokens: finalMessage.tokens, stats: finalMessage.stats, reasoning: finalMessage.reasoning, streamingHistory: finalMessage.streamingHistory } : m,
              )
              return { ...chat, messages: updatedMessages }
            })
          } catch (e) {
            console.error("[v0] CRASH in setChats:", e)
            localStorage.setItem('_crash_debug_error', String(e))
            return prevChats // Return unchanged to prevent crash
          }
        })

        // Save conversation to persona memory and learn preferences if enabled
        if (settings.selectedPersona) {
          const currentChatMessages = chats.find((c) => c.id === chatId)?.messages || []
          const userMessages = currentChatMessages.filter((m) => m.role === "user").map((m) => m.content)
          const assistantMessages = currentChatMessages
            .filter((m) => m.role === "assistant")
            .map((m) => m.content)

          // Add the new messages
          userMessages.push(messageContent)
          assistantMessages.push(assistantContent)

          // Save to memory if enabled
          if (settings.selectedPersona.memorySettings?.enabled) {
            const summary = personaMemoryService.generateSummary(userMessages, assistantMessages)
            const topics = personaMemoryService.extractTopics(userMessages, assistantMessages)

            personaMemoryService.addConversation(
              settings.selectedPersona.id,
              summary,
              topics,
              userMessages,
              assistantMessages,
              settings.selectedPersona.memorySettings.maxConversations || 10
            )

            console.log("[ChatInput] 💾 Saved conversation to persona memory:", settings.selectedPersona.name)
          }

          // Record interaction for relationship depth (always, even if memory disabled)
          const hasCodeBlocks = /```/.test(assistantContent)
          const topicDepth = assistantContent.length > 500 ? "deep" : assistantContent.length > 200 ? "medium" : "shallow"

          personaPreferencesService.recordInteraction(
            settings.selectedPersona.id,
            assistantContent.length,
            hasCodeBlocks,
            topicDepth as "shallow" | "medium" | "deep"
          )

          // Extract preferences from conversation
          personaPreferencesService.extractPreferencesFromConversation(
            settings.selectedPersona.id,
            userMessages,
            assistantMessages
          )

          console.log("[ChatInput] 🎓 Interaction recorded and preferences extracted for", settings.selectedPersona.name)
        }

        // Auto-extract memories using LLM (background, silent)
        // Only for conversations with 4+ messages to avoid test/short chats
        const currentChatForMemory = chats.find((c) => c.id === chatId)
        const messageCount = (currentChatForMemory?.messages.length || 0) + 2 // +2 for current exchange

        if (memoryService.shouldExtractMemories(messageCount)) {
          console.log("[ChatInput] 🧠 Running automatic memory extraction...")
          // Run in background - don't await, don't block UI
          memoryService.extractMemoriesWithLLM(
            messageContent,
            assistantContent,
            settings.apiKeys?.openRouter
          ).then((memories) => {
            if (memories.length > 0) {
              console.log("[ChatInput] 💾 Auto-saved", memories.length, "new memories")
              toast({
                title: "🧠 Memory saved",
                description: `Saved ${memories.length} new ${memories.length === 1 ? 'memory' : 'memories'}`,
                duration: 2000,
              })
            }
          }).catch((err) => {
            console.error("[ChatInput] Memory extraction failed:", err)
          })
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[v0] Generation stopped by user")
        return
      }
      console.error("[v0] Chat error:", error)

      const errorMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        timestamp: Date.now(),
      }
      addMessage(chatId, errorMessage)

      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Antwort konnte nicht abgerufen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsChatLoading(false)
      // Reset streaming state completely (including streaming details to prevent stale content)
      setStreamingPhase("idle")
      setCurrentTool(null)
      setSearchQuery(null)
      setCurrentStreamingDetails(null)
      setAttachedCollectionId(null)
      abortControllerRef.current = null
      console.log("[v0] Chat submission complete")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Determine if input has content for send button styling
  const hasContent = input.trim().length > 0 || attachedFiles.length > 0

  return (
    <div
      className={cn(
        "bg-background/80 backdrop-blur-sm p-2 md:p-4 border-t border-border/20 smooth-transition pb-[env(safe-area-inset-bottom,4px)] md:pb-4",
        isEmpty ? "shadow-apple-2" : "shadow-apple-1"
      )}
    >
      {attachedCollectionId && (
        <div className="mx-auto max-w-4xl mb-3 md:mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-muted/70 to-muted/50 border border-border/40 px-4 py-2.5 text-xs sm:text-sm shadow-sm">
          <FolderOpen className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
          <span className="font-medium">Collection attached: {documentCollectionService.getCollection(attachedCollectionId)?.name}</span>
          <Button variant="ghost" size="sm" className="ml-auto h-7 px-3 hover:bg-background/80 rounded-lg transition-all" onClick={() => setAttachedCollectionId(null)}>
            Remove
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        {/* Compact Toolbar - hidden on mobile, visible on desktop */}
        <div className="hidden md:flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <QuickModelPicker />
            <QuickPersonaPicker />
          </div>
        </div>

        {/* Main Input Container */}
        <div className="flex flex-col gap-1.5 md:gap-0">
          {/* Mobile: Model & Persona pickers above textarea */}
          <div className="flex md:hidden items-center gap-2 px-0.5 pb-1">
            <QuickModelPicker />
            <QuickPersonaPicker />
          </div>

          {/* Input row with send button */}
          <div className="flex items-end gap-2 md:gap-4">
            <div className="flex-1 min-w-0 relative group">
              {/* Slash Command Autocomplete Menu */}
              {showCommandMenu && commandSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-3 md:mb-4 bg-background border-2 border-border/50 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[300px] md:max-h-[350px] overflow-y-auto animate-slide-in-down">
                  <div className="p-3 md:p-3.5 border-b border-border/40 gradient-glass">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-semibold">
                      <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary glow-subtle" />
                      <span>Slash Commands</span>
                    </div>
                  </div>
                  {commandSuggestions.map((cmd) => (
                    <button
                      key={cmd.command}
                      type="button"
                      onClick={() => selectCommand(cmd)}
                      className="w-full text-left px-3 md:px-4 py-2.5 md:py-3 hover:bg-accent/70 smooth-transition hover-lift flex items-start gap-2 md:gap-3 border-b border-border/20 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm md:text-base">{cmd.command}</div>
                        <div className="text-xs md:text-sm text-muted-foreground/90 mt-0.5">{cmd.description}</div>
                      </div>
                      <span className="text-xs bg-primary/15 text-primary px-2.5 py-1 rounded-md font-medium">{cmd.category}</span>
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className={cn(
                  "min-h-[44px] md:min-h-[52px] max-h-[120px] md:max-h-[200px] resize-none text-sm sm:text-base rounded-xl",
                  "pr-3 md:pr-44", // Minimal padding on mobile, desktop keeps inline buttons
                  "bg-background border border-border/30",
                  "focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                  "transition-all duration-200",
                  "py-2.5 pl-3 md:pt-3 md:pb-3 md:pl-4",
                  hasContent && "border-primary/40"
                )}
                disabled={isLoading}
              />
              {/* Desktop: Action Buttons inside textarea - hidden on mobile */}
              <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 right-3 items-center">
                {/* Left group: Search + Voice + File (utilities) */}
                <div className="flex items-center gap-2 pr-3 border-r border-border/30">
                  {/* Web search */}
                  <Button
                    type="button"
                    size="icon"
                    variant={webSearchEnabled ? "default" : "ghost"}
                    className={cn(
                      "h-9 w-9 rounded-lg transition-all duration-200",
                      webSearchEnabled ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted/80"
                    )}
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    title="Web search - Search the internet for current information"
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  {/* Voice input */}
                  <Button
                    type="button"
                    size="icon"
                    variant={isListening ? "default" : "ghost"}
                    className={cn(
                      "h-9 w-9 rounded-lg transition-all duration-200",
                      isListening ? "bg-red-500 text-white animate-pulse shadow-md" : "hover:bg-muted/80"
                    )}
                    onClick={toggleVoiceInput}
                    title="Voice input - Click to start speaking"
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  {/* File upload */}
                  <FileUpload files={attachedFiles} onFilesChange={setAttachedFiles} />
                </div>

                {/* Right group: Image mode */}
                <div className="flex items-center gap-2 pl-3">
                  <Button
                    type="button"
                    size="icon"
                    variant={imageMode !== "off" ? "default" : "ghost"}
                    className={cn(
                      "h-9 w-9 rounded-lg transition-all duration-200 relative",
                      imageMode !== "off"
                        ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md hover:shadow-lg"
                        : "hover:bg-muted/80"
                    )}
                    onClick={() => {
                      haptics.trigger('selection')
                      const nextState = imageMode === "off" ? "normal" : imageMode === "normal" ? "high" : "off"
                      setImageMode(nextState)
                    }}
                    title={imageMode === "off" ? "Image generation - Click to enable" : imageMode === "normal" ? "Normal quality - Click for high quality" : "High quality mode - Click to disable"}
                  >
                    <Image className="h-4 w-4" />
                    {imageMode === "high" && (
                      <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-yellow-400 text-yellow-900 rounded-full w-4 h-4 flex items-center justify-center shadow-sm">+</span>
                    )}
                    {imageMode === "normal" && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full shadow-sm border border-white/50" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            {/* Send Button - compact on mobile */}
            <Button
              type={isLoading ? "button" : "submit"}
              onClick={isLoading ? stopGeneration : undefined}
              disabled={!isLoading && !hasContent}
              className={cn(
                "h-10 w-10 md:h-14 md:w-14 rounded-xl transition-all duration-200 flex-shrink-0",
                isLoading
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-md animate-pulse"
                  : hasContent
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground",
                "active:scale-95"
              )}
              title={isLoading ? "Stop generation" : hasContent ? "Send message (Enter)" : "Type a message to send"}
            >
              {isLoading ? (
                <Square className="h-4 w-4 md:h-6 md:w-6" />
              ) : (
                <Send className="h-4 w-4 md:h-6 md:w-6" />
              )}
            </Button>
          </div>

          {/* Mobile: Action buttons row below textarea */}
          <div className="flex md:hidden items-center gap-1 px-0.5">
            <div className="flex items-center gap-0.5">
              {/* Web search */}
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
                onClick={toggleVoiceInput}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </Button>
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
            </div>
          </div>
        </div>
        {/* Token & Context Info Bar - desktop only (experimental) */}
        {settings.experimental?.showInputStats && (
          <div className="mt-3 hidden md:flex md:items-center md:justify-between md:gap-6 px-1">
            <div className="flex items-center gap-4">
              <TokenCounterPreview input={input} />
            </div>
            <div className="flex items-center gap-3">
              <ContextWindowMeter compact />
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
