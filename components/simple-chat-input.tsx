"use client"

import type React from "react"
import { Send, Globe, Square, Lightbulb, Mic, MicOff, Image } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Capacitor } from "@capacitor/core"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Message, StreamingHistoryEntry, UsedMemory, CategorizedFollowUp } from "@/types"
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
import { extractTextFromAttachments, type FileAttachment, getFileCategory } from "@/lib/file-handler"
import { buildMultimodalContent, stripImageDataFromContent } from "@/lib/multimodal-utils"
import { compressImages, getImageSizeKB } from "@/lib/image-utils"
import { validateImageForModel } from "@/lib/vision-models"
import type { Persona } from "@/lib/personas"
import { getRAGContext } from "@/lib/rag-service"
import { parseSlashCommand, getCommandSuggestions, buildCommandPrompt, type SlashCommand } from "@/lib/slash-commands"
import { memoryService } from "@/lib/memory-service"
import { ContextWindowMeter } from "@/components/context-window-meter"
import { contextWindowService } from "@/lib/context-window-service"
import { getBackgroundModel } from "@/components/experimental-settings"
import { useDraft } from "@/hooks/use-draft"
import { analyzeQueryForSearch } from "@/lib/search-heuristics"
import { supportsVision, getRecommendedVisionModel } from "@/lib/vision-models"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useIsIOSPWA } from "@/hooks/use-ios-pwa"
import { haptics } from "@/lib/haptics"
import { voiceService } from "@/lib/voice"
import { QuickPersonaPicker } from "@/components/quick-persona-picker"
import { buildSystemPrompt } from "@/lib/system-prompt-builder"
import { generateFollowUpsParallel, generateFallbackFollowUps } from "@/lib/follow-up-generator"
import { injectFollowUpsIntoMessage } from "@/hooks/use-dedicated-followups"

interface SimpleChatInputProps {
  selectedPersona?: Persona
  webSearchEnabled?: boolean
  overrideModel?: string // Override the model
}

export function SimpleChatInput({ selectedPersona, webSearchEnabled: initialWebSearchEnabled, overrideModel }: SimpleChatInputProps = {}) {
  const { currentChatId, addMessage, createChat, settings, chats, setChats, user, isChatLoading, setIsChatLoading, chatAbortControllerRef, stopChatGeneration, setStreamingPhase, setCurrentTool, setSearchQuery, currentStreamingDetails, setCurrentStreamingDetails, addStreamingHistoryEntry, clearStreamingHistory, getStreamingHistory } = useApp()
  const { features, isAdvancedMode, isHifi } = useFeatureFlags()
  const isIOSPWA = useIsIOSPWA()

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

  // Detect Android Capacitor at runtime to adjust safe area padding
  const isAndroidCapacitor = useMemo(() => {
    try {
      return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
    } catch {
      return false
    }
  }, [])

  // Load web search state from settings context (PERSIST USER PREFERENCE!)
  // Default is FALSE - automatic tool use handles web search via AI tool calling
  // Manual toggle is only for forcing search when auto-detection doesn't trigger
  const [webSearchEnabled, setWebSearchEnabled] = useState(() => {
    if (typeof window === "undefined") return initialWebSearchEnabled ?? false

    // Fallback to localStorage for user preference
    const saved = localStorage.getItem("chameleon-web-search-enabled")
    if (saved !== null) {
      return saved === "true"
    }

    return initialWebSearchEnabled ?? false
  })

  // Check if current model supports reasoning
  const model = overrideModel || settings.selectedModel || "deepseek/deepseek-v3.2"
  const modelSupportsReasoning = REASONING_MODELS.has(model)

  // OPTIMIZED: Combined localStorage saves to reduce useEffect count
  // NOTE: Also sync to settings context for persistence
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chameleon-web-search-enabled", String(webSearchEnabled))

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
  }, [webSearchEnabled])

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
            title: `✓ ${  settings.language === "de" ? "Transkribiert" : "Transcribed"}`,
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

    // Compress images before sending to prevent 413 errors and PWA crashes
    let processedFiles: FileAttachment[] = attachedFiles
    const imageAttachments = attachedFiles.filter((f: FileAttachment) => getFileCategory(f.name) === "image")

    if (imageAttachments.length > 0) {
      toast({
        title: settings.language === "de" ? "🖼️ Bilder komprimieren..." : "🖼️ Compressing images...",
        description: `${imageAttachments.length} ${settings.language === "de" ? "Bild(er)" : "image(s)"}`,
      })

      try {
        // Compress all images to stay under payload limit (critical for mobile PWA)
        // iOS PWA has stricter memory limits - use more aggressive compression
        const maxImageSizeKB = isIOSPWA ? 300 : 500
        const imageDataUrls = imageAttachments.map((img: FileAttachment) => img.dataUrl || "").filter(Boolean)
        const compressedDataUrls = await compressImages(imageDataUrls, maxImageSizeKB)

        // Create new array with compressed images
        let compressedIndex = 0
        processedFiles = attachedFiles.map((file: FileAttachment) => {
          if (getFileCategory(file.name) === "image" && file.dataUrl) {
            const compressed = compressedDataUrls[compressedIndex++]
            const originalKB = getImageSizeKB(file.dataUrl)
            const compressedKB = getImageSizeKB(compressed)
            console.log(`[Simple Chat] Image ${file.name}: ${originalKB.toFixed(0)}KB → ${compressedKB.toFixed(0)}KB`)
            return { ...file, dataUrl: compressed }
          }
          return file
        })
      } catch (error) {
        console.error("[Simple Chat] Image compression failed:", error)
        toast({
          title: settings.language === "de" ? "⚠️ Bildkomprimierung fehlgeschlagen" : "⚠️ Image compression failed",
          description: settings.language === "de" ? "Verwende Originalbilder" : "Using original images",
          variant: "destructive",
        })
      }
    }

    // Build multimodal content (properly handles images for vision models)
    // This is CRITICAL for images to work - simple text extraction doesn't send image data!
    const multimodalContent = buildMultimodalContent(messageContent, processedFiles)

    // Also extract text context from non-image files (PDFs, etc.)
    const nonImageFiles = processedFiles.filter((f: FileAttachment) => getFileCategory(f.name) !== "image")
    if (nonImageFiles.length > 0) {
      const fileContext = extractTextFromAttachments(nonImageFiles)
      if (typeof multimodalContent === "string") {
        messageContent = `${multimodalContent}\n\n${fileContext}`
      }
    }

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: multimodalContent, // Use multimodal content for proper image handling
      timestamp: Date.now(),
      attachments: processedFiles.map((f: FileAttachment) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.dataUrl || "",
      })),
    }

    // Capture attached images BEFORE clearing (for image-to-image generation)
    // Use processedFiles (compressed) for better PWA performance
    // Note: API expects full data URL (data:image/...;base64,...) not just the base64 portion
    const inputImagesForGen = processedFiles
      .filter((f: FileAttachment) => f.type.startsWith('image/') && f.dataUrl)
      .map((f: FileAttachment) => f.dataUrl as string)

    // Validate image size/count for the model BEFORE adding message
    // iOS PWA: Limit to 3 images to prevent memory exhaustion
    const maxImagesForPlatform = isIOSPWA ? 3 : 10
    if (imageAttachments.length > maxImagesForPlatform) {
      toast({
        title: settings.language === "de" ? "Zu viele Bilder" : "Too many images",
        description: settings.language === "de"
          ? `Maximum ${maxImagesForPlatform} Bilder pro Nachricht${isIOSPWA ? " (iOS PWA Limit)" : ""}`
          : `Maximum ${maxImagesForPlatform} images per message${isIOSPWA ? " (iOS PWA limit)" : ""}`,
        variant: "destructive",
      })
      setIsChatLoading(false)
      return
    }

    if (imageAttachments.length > 0) {
      const currentModel = overrideModel || settings.selectedModel
      const visionModel = supportsVision(currentModel) ? currentModel : getRecommendedVisionModel(currentModel)

      // Calculate ACTUAL size from compressed dataUrls (not original f.size which is pre-compression)
      // Base64 encoding increases size by ~33%, so actual bytes = base64.length * 0.75
      const calculateDataUrlSizeMB = (dataUrl: string): number => {
        const base64 = dataUrl.split(',')[1] || ''
        return (base64.length * 0.75) / (1024 * 1024) // Convert to MB
      }

      // Check each image individually against the model's per-image limit
      for (const img of imageAttachments) {
        const imgSizeMB = img.dataUrl ? calculateDataUrlSizeMB(img.dataUrl) : (img.size / 1024 / 1024)
        const validation = validateImageForModel(visionModel, 1, imgSizeMB)

        if (!validation.valid) {
          console.log(`[Simple Chat] Image ${img.name} validation failed: ${imgSizeMB.toFixed(2)}MB`)
          toast({
            title: settings.language === "de" ? "Bildvalidierung fehlgeschlagen" : "Image validation failed",
            description: validation.error,
            variant: "destructive",
          })
          setIsChatLoading(false)
          return
        }
      }

      // Also validate total image count
      const countValidation = validateImageForModel(visionModel, imageAttachments.length, 0)
      if (!countValidation.valid) {
        toast({
          title: settings.language === "de" ? "Bildvalidierung fehlgeschlagen" : "Image validation failed",
          description: countValidation.error,
          variant: "destructive",
        })
        setIsChatLoading(false)
        return
      }
    }

    addMessage(chatId, userMessage)
    console.log("[Simple Chat] Added user message")
    setInput("")
    clearDraft() // Clear saved draft after successful send
    setAttachedFiles([])
    setIsChatLoading(true)
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
            : `${settings.language === "de" ? "Verwende" : "Using"  } Gemini 3 Pro`,
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
    // Note: imageAttachments was already defined above during compression
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

    // Build system prompt: Start with base settings + conditional follow-up instructions
    // Check if we should use dedicated follow-up model or inline mode
    const useDedicatedFollowUpModel = settings.experimental?.useDedicatedFollowUpModel ?? true

    // Build base prompt with conditional follow-up instructions
    let systemPrompt = buildSystemPrompt(useDedicatedFollowUpModel, settings.systemPrompt)

    if (selectedPersona) {
      if (selectedPersona.personality) {
        // Append persona personality to base prompt (preserves FOLLOWUP instructions)
        systemPrompt = `${systemPrompt}\n\n--- PERSONA PERSONALITY ---\n${selectedPersona.personality}`
        console.log("[Simple Chat] Using persona with personality:", selectedPersona.name)
      } else if (selectedPersona.prompt) {
        // Legacy format: Full prompt (backward compatibility)
        systemPrompt = selectedPersona.prompt
        console.log("[Simple Chat] Using persona with legacy prompt:", selectedPersona.name)
      }
    }

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

    // CRITICAL: Strip base64 image data from historical messages to prevent:
    // 1. Context window exhaustion (500KB image = ~166K tokens!)
    // 2. Payload too large errors (413)
    // 3. iOS PWA memory crashes
    // Only the CURRENT message keeps full image data for vision model processing
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...(currentChat?.messages || []).map((m) => ({
        role: m.role,
        content: stripImageDataFromContent(m.content), // Strip old images, keep text context
      })),
      { role: "user" as const, content: multimodalContent }, // Current message keeps full images
    ]

    // Auto-compress context when approaching limits (if enabled - default ON)
    // This seamlessly summarizes older messages so the user can keep chatting
    let messagesForApi = messages
    const contextUsage = contextWindowService.getContextUsage(
      messages.map(m => ({ role: m.role, content: typeof m.content === "string" ? m.content : "[multimodal]" })),
      model
    )

    const autoCompressionEnabled = settings.experimental?.enableAutoContextCompression !== false

    if (autoCompressionEnabled && contextWindowService.shouldCompress(contextUsage)) {
      console.log("[Simple Chat] 📦 Context getting full, auto-compressing...")

      // Show compression toast
      toast({
        title: settings.language === "de" ? "📦 Chat optimieren..." : "📦 Optimizing chat...",
        description: settings.language === "de"
          ? "Fasse ältere Nachrichten zusammen für optimale Leistung"
          : "Summarizing older messages for optimal performance",
      })

      // Convert messages to the format expected by autoCompress
      const messagesForCompression = messages.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: typeof m.content === "string" ? m.content : "[multimodal content]"
      }))

      // Get the compression model from settings or use default (Gemini 3 Flash)
      const compressionModel = getBackgroundModel("contextCompression", settings.experimental?.backgroundAIModels)

      const compressionResult = await contextWindowService.autoCompress(
        messagesForCompression,
        model,
        settings.apiKeys.openRouter,
        6, // Keep last 6 messages intact
        compressionModel
      )

      if (compressionResult.wasCompressed && compressionResult.stats) {
        console.log("[Simple Chat] ✅ Compression complete:", compressionResult.stats.summary)

        // Use compressed messages for API call
        // But we need to restore the multimodal content for the current message
        const compressedWithCurrentMessage = [
          ...compressionResult.messages.slice(0, -1), // All except the last user message
          { role: "user" as const, content: multimodalContent } // Current message with full images
        ]
        messagesForApi = compressedWithCurrentMessage

        toast({
          title: settings.language === "de" ? "✅ Chat optimiert" : "✅ Chat optimized",
          description: settings.language === "de"
            ? `${compressionResult.stats.savedTokens.toLocaleString()} Tokens gespart`
            : `Saved ${compressionResult.stats.savedTokens.toLocaleString()} tokens`,
        })

        // Add compression event to streaming history
        addStreamingHistoryEntry({
          phase: "thinking",
          description: `Auto-compressed: ${compressionResult.stats.summary}`
        })
      } else {
        // Compression failed or not needed, warn user
        console.warn("[Simple Chat] ⚠️ Compression failed, context may be full")
        toast({
          title: settings.language === "de" ? "⚠️ Chat sehr lang" : "⚠️ Chat very long",
          description: settings.language === "de"
            ? "Der Chat ist sehr lang. Antwortqualität könnte beeinträchtigt sein."
            : "This chat is very long. Response quality may be affected.",
          variant: "destructive",
        })
      }
    }

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
          addStreamingHistoryEntry({
            phase: "thinking",
            description: `Memory: ${decision.reason}`,
            memoryDecision: {
              action: "skipped",
              reason: decision.reason,
              confidence: decision.details.confidence
            }
          })
        } else if (decision.action === "retrieved" && relevantMemories.length > 0) {
          const memoryContext = memoryService.formatMemoriesForContext(relevantMemories)
          messages.splice(-1, 0, { role: "system" as const, content: memoryContext })
          console.log("[Simple Chat] ✅ Memory context added:", decision.reason,
            decision.details.topSimilarity ? `(top similarity: ${decision.details.topSimilarity.toFixed(3)})` : "")

          // Surface the used memories in streaming history
          const usedMemories: UsedMemory[] = relevantMemories.map(m => ({
            id: m.id,
            content: m.content,
            type: m.type,
            importance: m.importance,
            similarity: decision.details.topSimilarity
          }))
          addStreamingHistoryEntry({
            phase: "thinking",
            description: `Using ${relevantMemories.length} memories`,
            usedMemories,
            memoryDecision: {
              action: "retrieved",
              reason: decision.reason,
              searchMethod: decision.details.searchMethod as "semantic" | "keyword" | undefined,
              confidence: decision.details.confidence
            }
          })
        } else {
          console.log("[Simple Chat] 📭", decision.reason)
          addStreamingHistoryEntry({
            phase: "thinking",
            description: decision.reason,
            memoryDecision: {
              action: "empty",
              reason: decision.reason,
              searchMethod: decision.details.searchMethod as "semantic" | "keyword" | undefined
            }
          })
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
          // Toast removed - SearchSourcesBadge now provides search feedback

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

          // Add search results to streaming history for SearchSourcesBadge display
          console.log("[Simple Chat] 🐛 DEBUG - Adding searchResults to streaming history:", {
            searchQuery: input.trim(),
            searchProvider,
            resultsCount: searchResults.results.length,
            results: searchResults.results
          })
          addStreamingHistoryEntry({
            phase: "searching",
            searchQuery: input.trim(),
            searchProvider,
            searchResults: searchResults.results,
            resultCount: searchResults.results.length,
            description: `Found ${searchResults.results.length} results via ${searchProvider}`
          })
          console.log("[Simple Chat] 🐛 DEBUG - After addStreamingHistoryEntry, check if it was added")

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

          // Toast removed - SearchSourcesBadge provides feedback
          const imageCount = searchResults.images?.length || 0
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
      let capturedAllGenerationIds: string[] = [] // All generation IDs for tool calling
      let capturedToolCallCount = 0 // Number of tool call iterations

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

      // 🚀 TRUE PARALLEL: Start follow-up generation NOW, before streaming
      let followUpPromise: Promise<CategorizedFollowUp[]> | null = null
      if (useDedicatedFollowUpModel && settings.apiKeys.openRouter) {
        console.log("[Simple Chat] 🚀 Starting PARALLEL follow-up generation...")
        const followUpMessages: Message[] = messagesForApi.slice(1).map((m, i) => ({
          id: `ctx-${i}`,
          role: m.role as "user" | "assistant" | "system",
          content: typeof m.content === "string" ? m.content : "[multimodal]",
          timestamp: Date.now()
        }))
        followUpPromise = generateFollowUpsParallel(
          followUpMessages,
          settings.apiKeys.openRouter,
          undefined,
          settings.language || "en"
        )
      }

      await streamChatMessage(messagesForApi, model, onChunk, {
        temperature: settings.temperature || 0.7,
        maxTokens,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        apiKey: settings.apiKeys.openRouter,
        signal: chatAbortControllerRef.current?.signal,
        // Reasoning controlled by settings (depth selector in advanced mode)
        reasoning: !!settings.reasoningDepth && modelSupportsReasoning,
        reasoningDepth: settings.reasoningDepth || "medium",
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
          // Toast removed - SearchSourcesBadge provides feedback
        },
        onSearchComplete: () => {
          console.log("[Simple Chat] ✅ AI search complete")
          // Toast removed - SearchSourcesBadge provides feedback
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
        // Capture all generation IDs for tool calling cost tracking
        onAllGenerationIds: (generationIds, toolCallCount) => {
          console.log(`[Simple Chat] 💰 All generation IDs captured: ${generationIds.length} (${toolCallCount} tool calls)`)
          capturedAllGenerationIds = generationIds
          capturedToolCallCount = toolCallCount
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
              searchResults: details.searchResults, // Add full search results array
              description: details.resultSummary || details.action || (details.searchQuery ? `Searching: "${details.searchQuery}"` : undefined)
            })
          }
        },
      })

      console.log("[Simple Chat] Stream complete, final content length:", assistantContent.length)

      // Handle parallel follow-up generation if it was started
      if (followUpPromise && messageAdded && assistantContent && useDedicatedFollowUpModel) {
        followUpPromise
          .then((followUps) => {
            if (followUps && followUps.length > 0) {
              console.log(`[Simple Chat] ✅ Parallel follow-ups ready: ${followUps.length}`)
              setChats((prevChats) =>
                prevChats.map((chat) => {
                  if (chat.id !== chatId) return chat
                  const currentMessage = chat.messages.find(m => m.id === assistantMessageId)
                  const currentContent = typeof currentMessage?.content === 'string' ? currentMessage.content : assistantContent
                  const contentWithFollowUps = injectFollowUpsIntoMessage(currentContent, followUps)

                  // Update Supabase with follow-ups so they persist
                  if (user) {
                    supabaseSync.updateMessageContent(assistantMessageId, contentWithFollowUps).catch(err => {
                      console.warn("[Simple Chat] Failed to save follow-ups to Supabase:", err)
                    })
                  }

                  return {
                    ...chat,
                    messages: chat.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, content: contentWithFollowUps } : m
                    ),
                  }
                })
              )
            }
          })
          .catch((error) => {
            console.warn("[Simple Chat] ⚠️ Parallel follow-up failed, using fallback:", error)
            const fallbackFollowUps = generateFallbackFollowUps(
              [{ id: "last", role: "assistant" as const, content: assistantContent, timestamp: Date.now() }],
              messagesForApi.length,
              settings.language || "en"
            )
            if (fallbackFollowUps.length > 0) {
              setChats((prevChats) =>
                prevChats.map((chat) => {
                  if (chat.id !== chatId) return chat
                  const currentMessage = chat.messages.find(m => m.id === assistantMessageId)
                  const currentContent = typeof currentMessage?.content === 'string' ? currentMessage.content : assistantContent
                  const contentWithFollowUps = injectFollowUpsIntoMessage(currentContent, fallbackFollowUps)

                  // Update Supabase with fallback follow-ups so they persist
                  if (user) {
                    supabaseSync.updateMessageContent(assistantMessageId, contentWithFollowUps).catch(err => {
                      console.warn("[Simple Chat] Failed to save fallback follow-ups to Supabase:", err)
                    })
                  }

                  return {
                    ...chat,
                    messages: chat.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, content: contentWithFollowUps } : m
                    ),
                  }
                })
              )
              console.log("[Simple Chat] 📝 Using fallback follow-ups")
            }
          })
      }

      if (messageAdded && assistantContent) {
        const promptText = messagesForApi.map((m) => typeof m.content === "string" ? m.content : "[multimodal]").join("\n")
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
            ...(capturedAllGenerationIds.length > 0 && { allGenerationIds: capturedAllGenerationIds }),
            ...(capturedToolCallCount > 0 && { toolCallCount: capturedToolCallCount }),
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
              // DON'T overwrite content - it may have follow-ups from background generation
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
      } else if (!assistantContent || assistantContent.trim() === "") {
        // Handle empty response after tool calls (model exhausted tokens on reasoning)
        const streamingHistoryForMessage = getStreamingHistory()
        const hadToolCalls = streamingHistoryForMessage.some(
          (entry) => entry.phase === "tool_use" || entry.phase === "searching" || entry.toolName
        )

        console.warn("[Simple Chat] ⚠️ Empty response detected!", {
          hadToolCalls,
          streamingHistoryLength: streamingHistoryForMessage.length,
          reasoningLength: reasoningContent.length
        })

        if (hadToolCalls) {
          // Model made tool calls but failed to generate a response
          const errorContent = isHifi
            ? "Das Modell konnte leider keine Antwort generieren. Das kann bei komplexen Vergleichen passieren. Bitte versuch es nochmal oder stelle eine spezifischere Frage."
            : "The model could not generate a response. This can happen with complex comparisons. Please try again or ask a more specific question."

          const errorMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: errorContent,
            timestamp: Date.now(),
            streamingHistory: streamingHistoryForMessage,
          }

          addMessage(chatId, errorMessage)

          toast({
            title: isHifi ? "Keine Antwort" : "No Response",
            description: isHifi
              ? "Das Modell hat zu viele Ressourcen für die Suche verbraucht. Bitte nochmal versuchen."
              : "The model used too many resources on search. Please try again.",
            variant: "destructive",
          })
        } else {
          // Empty response without tool calls - generic error
          const errorMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: isHifi
              ? "Ups! Es wurde keine Antwort generiert. Bitte versuch es nochmal."
              : "Oops! No response was generated. Please try again.",
            timestamp: Date.now(),
          }

          addMessage(chatId, errorMessage)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[Simple Chat] Generation stopped by user")
        return
      }
      console.error("[Simple Chat] Chat error:", error)

      // Detect specific error types for better user feedback
      const errorStr = error instanceof Error ? error.message : String(error)
      const isContextError = errorStr.includes("context") || errorStr.includes("token") || errorStr.includes("length")
      const isPayloadError = errorStr.includes("413") || errorStr.includes("payload") || errorStr.includes("too large")
      const isMemoryError = errorStr.includes("memory") || errorStr.includes("allocation")

      let errorTitle = settings.language === "de" ? "Fehler" : "Error"
      let errorDescription = settings.language === "de" ? "Antwort konnte nicht abgerufen werden" : "Could not get response"
      let userMessage = settings.language === "de"
        ? "Ups! Da ist etwas schiefgelaufen. Versuch es nochmal! 😊"
        : "Oops! Something went wrong. Please try again! 😊"

      if (isContextError) {
        errorTitle = settings.language === "de" ? "Chat zu lang" : "Chat too long"
        errorDescription = settings.language === "de"
          ? "Starte einen neuen Chat, um Bilder hochzuladen"
          : "Start a new chat to upload images"
        userMessage = settings.language === "de"
          ? "Der Chat ist zu lang geworden. Bitte starte einen neuen Chat für weitere Bilder."
          : "This chat has gotten too long. Please start a new chat for more images."
      } else if (isPayloadError) {
        errorTitle = settings.language === "de" ? "Datei zu groß" : "File too large"
        errorDescription = settings.language === "de"
          ? "Bitte ein kleineres Bild verwenden"
          : "Please use a smaller image"
        userMessage = settings.language === "de"
          ? "Das Bild ist zu groß. Bitte verwende ein kleineres Bild."
          : "The image is too large. Please use a smaller image."
      } else if (isMemoryError && isIOSPWA) {
        errorTitle = settings.language === "de" ? "Speicherproblem" : "Memory issue"
        errorDescription = settings.language === "de"
          ? "Starte die App neu und versuche es mit weniger Bildern"
          : "Restart the app and try with fewer images"
        userMessage = settings.language === "de"
          ? "Speicherproblem auf iOS. Bitte starte die App neu und verwende weniger/kleinere Bilder."
          : "Memory issue on iOS. Please restart the app and use fewer/smaller images."
      }

      const errorMessage: Message = {
        id: generateUUID(),
        role: "assistant",
        content: userMessage,
        timestamp: Date.now(),
      }
      addMessage(chatId, errorMessage)

      toast({
        title: errorTitle,
        description: errorDescription,
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
        setInput(`${selected.command  } `)
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
    setInput(`${command.command  } `)
    setCommandSuggestions([])
  }

  // Determine if input has content for send button styling
  const hasContent = input.trim().length > 0 || attachedFiles.length > 0

  return (
    <div className={cn(
      "p-3 md:p-4 md:pb-4",
      // iOS/Web: use env() safe area. Android Capacitor: no extra bottom padding needed
      !isAndroidCapacitor && "pb-[env(safe-area-inset-bottom,8px)]",
      isAndroidCapacitor && "pb-1" // Minimal padding on Android
    )}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl w-full">
        {/* Unified Input Container - Clean dark rounded box */}
        <div className="bg-muted/50 dark:bg-muted/30 rounded-2xl border border-border/40 overflow-hidden">
          {/* Slash Command Suggestions */}
          {isAdvancedMode && features.showSlashCommands && commandSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
              <div className="p-2 border-b border-border bg-muted/50">
                <div className="text-xs font-medium text-muted-foreground">
                  Slash Commands ({commandSuggestions.length})
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
                    <div className="font-mono font-medium text-sm">{cmd.command}</div>
                    <div className="text-xs text-muted-foreground">{cmd.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Textarea with Send button inside */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              id="simple-chat-input"
              name="message"
              autoComplete="off"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                saveDraft(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder={getTranslation("inputPlaceholder", language)}
              className="min-h-[44px] max-h-[200px] resize-none text-base bg-transparent border-0 focus:ring-0 focus:outline-none pl-4 pr-12 py-3"
              disabled={isChatLoading}
            />
            {/* Send Button - Inside input field */}
            <Button
              type={isChatLoading ? "button" : "submit"}
              onClick={isChatLoading ? stopGeneration : undefined}
              disabled={!isChatLoading && !hasContent}
              className={cn(
                "absolute right-2 bottom-2 h-8 w-8 rounded-lg transition-all duration-200 flex-shrink-0",
                isChatLoading
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : hasContent
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted/80 text-muted-foreground",
                "active:scale-95"
              )}
              size="icon"
            >
              {isChatLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
            </Button>
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            {/* Left: File upload + Action buttons */}
            <div className="flex items-center gap-1">
              {/* File upload - leftmost */}
              <FileUpload files={attachedFiles} onFilesChange={setAttachedFiles} />

              {/* Settings/toggles button */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  "h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted",
                  (webSearchEnabled || settings.reasoningDepth || imageMode !== "off") && "text-primary"
                )}
                onClick={() => {
                  haptics.trigger('selection')
                  // Toggle web search as primary action
                  setWebSearchEnabled(!webSearchEnabled)
                }}
                title={webSearchEnabled ? "Web search ON" : "Web search OFF"}
              >
                <Globe className="h-4 w-4" />
              </Button>

              {/* Voice/Mic */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  "h-9 w-9 rounded-lg",
                  isListening
                    ? "bg-red-500 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={handleVoice}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {/* Image mode - always visible, cycles: off → normal → high → off */}
              <Button
                type="button"
                size="icon"
                variant={imageMode !== "off" ? "default" : "ghost"}
                className={cn(
                  "h-9 w-9 rounded-lg relative",
                  imageMode !== "off"
                    ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                  <span className="absolute -top-0.5 -right-0.5 text-[7px] font-bold bg-yellow-400 text-yellow-900 rounded-full w-3 h-3 flex items-center justify-center">+</span>
                )}
                {imageMode === "normal" && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white/50" />
                )}
              </Button>
            </div>

            {/* Right: Persona picker only */}
            <div className="flex items-center gap-1">
              {/* Persona picker - compact */}
              <QuickPersonaPicker />
            </div>
          </div>
        </div>

        {/* Context Window Meter - Only show in advanced mode */}
        {features.showContextMeter && (
          <div className="mt-2 flex justify-end">
            <ContextWindowMeter compact />
          </div>
        )}
      </form>
    </div>
  )
}
