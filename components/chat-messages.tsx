"use client"

import { useApp } from "@/contexts/app-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CaretDown, CaretRight, Check, Copy, FloppyDisk, Lightbulb, Pencil, Play, Robot, SpeakerHigh, SpeakerSlash, Stop, Trash, User, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils"
import { useState, memo, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import { voiceService } from "@/lib/voice"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeSanitize from "rehype-sanitize"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { FollowUpSuggestions } from "@/components/follow-up-suggestions"
import { parseFollowUps } from "@/lib/follow-up-parser"
import { MessageStats } from "@/components/message-stats"
import { FilePreviewInline } from "@/components/file-preview-inline"
import { ResponseAnalysisPanel } from "@/components/response-analysis-panel"
import { SearchSourcesBadge } from "@/components/search-sources-badge"
import { MemorySurfacingBadge } from "@/components/memory-surfacing-badge"
import { ResponseAnalyzer } from "@/lib/response-analyzer"
import type { FileAttachment } from "@/lib/file-handler"
import { type Persona, getPersonaExamplePrompts } from "@/lib/personas"
import type { MessageContent } from "@/types"
import { contentToText, hasImages } from "@/lib/multimodal-utils"
import { RichContentParser } from "@/lib/rich-content-parser"
// Lazy load Mermaid to avoid ~400KB in initial bundle
import { LazyMermaid } from "@/components/rich-content/lazy-mermaid"
// Lazy load Sandpack to avoid ~300KB in initial bundle
import { LazySandpack } from "@/components/rich-content/lazy-sandpack"
import { isSandpackSupported, detectSandpackTemplate } from "@/lib/sandpack-utils"
import { MessageStatus, MessageStatusVerbose, StreamingHistoryDisplay } from "@/components/message-status"
import { userProfileService } from "@/lib/user-profile"
import { useAutoFetchCosts } from "@/hooks/use-auto-fetch-costs"
import { ChameleonLogo } from "@/components/chameleon-logo"

// Lazy load heavy syntax highlighter with its style - reduces initial bundle by ~100KB
const SyntaxHighlighterWithStyle = dynamic(
  () => Promise.all([
    import("react-syntax-highlighter").then(mod => mod.Prism),
    import("react-syntax-highlighter/dist/cjs/styles/prism/vsc-dark-plus").then(mod => mod.default)
  ]).then(([Highlighter, style]) => {
    // Return a wrapper component that includes the style
    const HighlighterWithStyle = (props: any) => <Highlighter style={style} {...props} />
    return { default: HighlighterWithStyle }
  }),
  {
    loading: () => <div className="bg-zinc-800 rounded-lg p-4 animate-pulse h-20" />,
    ssr: false
  }
)

// Memoize markdown plugins to prevent recreation on every render
const remarkPlugins = [remarkGfm, remarkMath]
const rehypePlugins = [rehypeSanitize, rehypeKatex]

// Static markdown components that don't depend on props - extracted to module level
// This prevents recreation on every render (significant performance improvement)
const staticMarkdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0 scroll-m-20">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-semibold mt-5 mb-3 first:mt-0 scroll-m-20">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0 scroll-m-20">{children}</h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h4>
  ),
  ul: ({ children }: any) => <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>,
  li: ({ children }: any) => <li className="leading-7">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: any) => <em className="italic">{children}</em>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-border" />,
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-4 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  table: ({ children }: any) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-muted/70">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-border">{children}</tbody>,
  tr: ({ children }: any) => (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-3 py-2.5 text-left font-semibold border-r border-border last:border-r-0 text-xs sm:text-sm whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2.5 border-r border-border last:border-r-0 text-xs sm:text-sm align-top">
      {children}
    </td>
  ),
  input: ({ checked, type, ...props }: any) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled
          className="mr-2 align-middle"
          {...props}
        />
      )
    }
    return <input type={type} {...props} />
  },
}

// Normalize Unicode characters that look like markdown syntax but aren't
// This fixes AI models sometimes outputting Unicode asterisks instead of regular ones
const normalizeMarkdownChars = (text: string): string => {
  return text
    // Asterisks: U+2217 (∗), U+2731 (✱), U+FE61 (﹡), U+FF0A (＊) -> U+002A (*)
    .replace(/[\u2217\u2731\uFE61\uFF0A]/g, '*')
    // Underscores: U+FF3F (＿), U+FE4D (﹍) -> U+005F (_)
    .replace(/[\uFF3F\uFE4D]/g, '_')
    // Backticks: U+2018 ('), U+2019 ('), U+0060 is regular backtick -> U+0060 (`)
    .replace(/[\u2018\u2019]/g, '`')
    // Tildes: U+FF5E (～), U+223C (∼) -> U+007E (~)
    .replace(/[\uFF5E\u223C]/g, '~')
}

// Convert <agent-plan> tags to markdown-friendly blockquote format
// This prevents rehypeSanitize from stripping them (it removes unknown HTML tags)
const processAgentPlanTags = (text: string): string => {
  return text.replace(
    /<agent-plan>([\s\S]*?)<\/agent-plan>/gi,
    (match, content) => {
      const lines = content.trim().split('\n')
      const formattedLines = lines
        .map((line: string) => `> ${line.trim()}`)
        .join('\n')
      return `\n> **🤖 Agent Plan**\n${formattedLines}\n`
    }
  )
}

// Time-of-day greetings in different languages
const getTimeGreeting = (lang: string): string => {
  const hour = new Date().getHours()

  const greetings: Record<string, { morning: string; afternoon: string; evening: string; night: string }> = {
    en: {
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
      night: "Good night"
    },
    de: {
      morning: "Guten Morgen",
      afternoon: "Guten Tag",
      evening: "Guten Abend",
      night: "Gute Nacht"
    },
    es: {
      morning: "Buenos días",
      afternoon: "Buenas tardes",
      evening: "Buenas tardes",
      night: "Buenas noches"
    },
    fr: {
      morning: "Bonjour",
      afternoon: "Bon après-midi",
      evening: "Bonsoir",
      night: "Bonne nuit"
    }
  }

  const langGreetings = greetings[lang] || greetings.en

  if (hour >= 5 && hour < 12) return langGreetings.morning
  if (hour >= 12 && hour < 17) return langGreetings.afternoon
  if (hour >= 17 && hour < 21) return langGreetings.evening
  return langGreetings.night
}

const getSubGreeting = (lang: string): string => {
  const subGreetings: Record<string, string[]> = {
    en: [
      "What can I help you with today?",
      "How can I assist you?",
      "Ready to help you out!",
      "What's on your mind?"
    ],
    de: [
      "Wie kann ich dir heute helfen?",
      "Was kann ich für dich tun?",
      "Ich bin bereit dir zu helfen!",
      "Was hast du auf dem Herzen?"
    ],
    es: [
      "¿En qué puedo ayudarte hoy?",
      "¿Cómo puedo asistirte?",
      "¡Listo para ayudarte!",
      "¿Qué tienes en mente?"
    ],
    fr: [
      "Comment puis-je vous aider aujourd'hui?",
      "Comment puis-je vous assister?",
      "Prêt à vous aider!",
      "Qu'avez-vous en tête?"
    ]
  }

  const langSubs = subGreetings[lang] || subGreetings.en
  return langSubs[Math.floor(Math.random() * langSubs.length)]
}

interface ChatMessagesProps {
  currentPersona?: Persona
}

/**
 * Helper component to render multimodal message content
 * Handles both text-only and text+image messages
 */
const RenderMessageContent = memo(({ content }: { content: MessageContent }) => {
  // If it's a string, return it directly
  if (typeof content === "string") {
    return <>{content}</>
  }

  // If it's an array (multimodal), render each part
  return (
    <>
      {content.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.text}</span>
        }
        if (part.type === "image_url" && part.image_url) {
          return (
            <div key={index} className="my-3 rounded-lg overflow-hidden border border-border/50 shadow-md">
              <img
                src={part.image_url.url}
                alt="Uploaded image"
                className="w-full h-auto object-contain max-h-[400px] bg-muted/30"
                loading="lazy"
              />
            </div>
          )
        }
        return null
      })}
    </>
  )
})

/**
 * Memoized code block component to prevent re-rendering SyntaxHighlighter
 * when parent component updates
 */
interface CodeBlockProps {
  language: string
  code: string
  onCopy: (code: string) => void
  enableSandbox?: boolean
}

const CodeBlock = memo(({ language, code, onCopy, enableSandbox = false }: CodeBlockProps) => {
  const [showSandbox, setShowSandbox] = useState(false)

  // Check if this language supports sandbox execution
  const canRunSandbox = enableSandbox && isSandpackSupported(language)
  const sandpackTemplate = canRunSandbox ? detectSandpackTemplate(code, language) : null

  const toggleSandbox = useCallback(() => {
    setShowSandbox(prev => !prev)
  }, [])

  return (
    <div className="relative group/code my-4 rounded-lg w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded-t-lg w-full">
        <span className="text-xs text-zinc-400 font-mono">{language}</span>
        <div className="flex items-center gap-1">
          {canRunSandbox && sandpackTemplate && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs transition-opacity text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700",
                showSandbox
                  ? "opacity-100 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
                  : "opacity-0 group-hover/code:opacity-100"
              )}
              onClick={toggleSandbox}
            >
              {showSandbox ? (
                <>
                  <Stop className="h-3 w-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs opacity-0 group-hover/code:opacity-100 transition-opacity text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700"
            onClick={() => onCopy(code)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>
      </div>
      <SyntaxHighlighterWithStyle
        language={language}
        PreTag="div"
        wrapLines
        wrapLongLines
        customStyle={{
          margin: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: showSandbox ? 0 : "0.5rem",
          borderBottomRightRadius: showSandbox ? 0 : "0.5rem",
          width: "100%",
          maxWidth: "100%",
          overflow: "auto",
        }}
        codeTagProps={{
          style: {
            fontSize: "0.875rem",
            lineHeight: "1.5",
          },
        }}
      >
        {code}
      </SyntaxHighlighterWithStyle>

      {/* Live Sandbox Preview */}
      {showSandbox && sandpackTemplate && (
        <div className="border-t border-zinc-700">
          <LazySandpack
            code={code}
            template={sandpackTemplate}
            language={language}
            className="my-0 rounded-t-none border-0"
          />
        </div>
      )}
    </div>
  )
})

/**
 * Message wrapper component that handles animation cleanup
 * Removes animation class after animation completes to free GPU compositor
 */
interface MessageWrapperProps {
  children: React.ReactNode
  className: string
  messageId: string
}

const MessageWrapper = memo(({ children, className, messageId }: MessageWrapperProps) => {
  const [hasAnimated, setHasAnimated] = useState(false)

  const handleAnimationEnd = useCallback(() => {
    setHasAnimated(true)
  }, [])

  return (
    <div
      key={messageId}
      className={hasAnimated ? className.replace('animate-slide-in-up', '') : className}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  )
})

export const ChatMessages = memo(({ currentPersona }: ChatMessagesProps = {}) => {
  const { chats, currentChatId, addMessage, updateChat, setChats, settings, isChatLoading, streamingPhase, currentTool, searchQuery, currentStreamingDetails } = useApp()

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set())
  const [expandedStreamingHistory, setExpandedStreamingHistory] = useState<Set<string>>(new Set())
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const { toast } = useToast()

  // Memoize the sub-greeting to prevent it from changing on every render
  // This fixes the rapid cycling bug when streaming in background
  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const lang = useMemo(() => settings.language || "en", [settings.language])
  const memoizedSubGreeting = useMemo(() => getSubGreeting(lang), [lang, currentChatId])

  // Advanced mode = NOT simple mode (from settings)
  const isAdvancedMode = !settings.simpleMode

  // Automatically fetch exact costs for new messages (runs in background, no slowdown!)

  useAutoFetchCosts(
    currentChat?.messages || [],
    useCallback((messageId: string, costData: any) => {
      // IMPORTANT: Use setChats with functional update to avoid stale closure issues
      // The previous implementation used updateChat with a snapshot of messages,
      // which would overwrite follow-ups that were added after the snapshot was taken
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id !== currentChatId) return chat
        return {
          ...chat,
          updatedAt: Date.now(),
          messages: chat.messages.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  stats: {
                    ...msg.stats,
                    ...costData,
                  }
                }
              : msg
          )
        }
      }))
    }, [currentChatId, setChats]),
    settings.apiKeys?.openRouter // Pass API key for exact cost fetching
  )

  const toggleReasoning = useCallback((messageId: string) => {
    setExpandedReasoning(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }, [])

  const toggleStreamingHistory = useCallback((messageId: string) => {
    setExpandedStreamingHistory(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }, [])

  // Get current model name for display
  const currentModelName = currentChat?.model || settings.selectedModel || "AI Model"

  const handleCopy = useCallback(async (content: MessageContent, messageId: string) => {
    const textContent = contentToText(content)
    await navigator.clipboard.writeText(textContent)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: "Copied to clipboard",
      description: "Message content copied successfully",
    })
  }, [toast])

  const handleCopyCode = useCallback(async (code: string) => {
    await navigator.clipboard.writeText(code)
    toast({
      title: "Code copied",
      description: "Code block copied to clipboard",
    })
  }, [toast])

  const handleSpeak = async (content: MessageContent, messageId: string) => {
    // Check if already speaking this message - stop if so
    if (speakingId === messageId) {
      voiceService.stopSpeaking()
      setSpeakingId(null)
      return
    }

    const textContent = contentToText(content)
    const cleanText = textContent.replace(/[#*`[\]]/g, "").replace(/\n+/g, ". ")
    const ttsProvider = settings.voiceSettings?.ttsProvider || 'browser'

    setSpeakingId(messageId)

    // Use OpenAI TTS if selected
    if (ttsProvider === 'openai') {
      const openAiKey = settings.apiKeys?.openAI
      if (!openAiKey) {
        toast({
          title: "API Key Required",
          description: "Please add your OpenAI API key in Settings → API Keys",
          variant: "destructive",
        })
        setSpeakingId(null)
        return
      }

      console.log('[ChatMessages] 🔊 Speaking with OpenAI TTS')
      await voiceService.speakWithOpenAI(
        cleanText,
        openAiKey,
        {
          voice: (settings.voiceSettings?.openaiVoice as any) || 'nova',
          speed: settings.voiceSettings?.rate || 1,
        },
        () => setSpeakingId(null), // onEnd
        (error) => {
          toast({
            title: "TTS Error",
            description: error,
            variant: "destructive",
          })
          setSpeakingId(null)
        }
      )
      return
    }

    // Browser TTS fallback
    if (!voiceService.isSupported()) {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      })
      setSpeakingId(null)
      return
    }

    // Use persona-specific voice settings if available and enabled
    const usePersonaVoice = currentPersona?.voiceSettings?.enabled
    const voiceOptions = usePersonaVoice
      ? {
        rate: currentPersona.voiceSettings?.rate || settings.voiceSettings?.rate || 1,
        pitch: currentPersona.voiceSettings?.pitch || settings.voiceSettings?.pitch || 1,
        voice: currentPersona.voiceSettings?.voiceName || settings.voiceSettings?.voice,
      }
      : {
        rate: settings.voiceSettings?.rate || 1,
        pitch: settings.voiceSettings?.pitch || 1,
        voice: settings.voiceSettings?.voice,
      }

    console.log(
      `[ChatMessages] 🔊 Speaking with ${usePersonaVoice ? `${currentPersona?.name}'s voice` : "browser voice"}`,
      voiceOptions
    )

    voiceService.speak(cleanText, voiceOptions)
    const estimatedDuration = (cleanText.length / 10) * 1000
    setTimeout(() => setSpeakingId(null), estimatedDuration)
  }

  const handleDelete = (messageIndex: number) => {
    if (!currentChat) return

    const updatedMessages = currentChat.messages.filter((_, index) => index !== messageIndex)
    updateChat(currentChat.id, { messages: updatedMessages })

    toast({
      title: "Message deleted",
      description: "Message removed from chat history",
    })
  }

  const handleEditStart = useCallback((message: any) => {
    const textContent = contentToText(message.content)
    setEditingMessageId(message.id)
    setEditContent(textContent)
  }, [])

  const handleEditCancel = useCallback(() => {
    setEditingMessageId(null)
    setEditContent("")
  }, [])

  const handleEditSave = useCallback((messageIndex: number) => {
    if (!currentChat || !editContent.trim()) return

    const message = currentChat.messages[messageIndex]
    if (!message) return

    // Update the message content
    const updatedMessages = [...currentChat.messages]
    updatedMessages[messageIndex] = {
      ...message,
      content: editContent.trim(),
    }

    // If editing a user message, remove all subsequent messages to allow regeneration
    if (message.role === "user") {
      const messagesUpToEdit = updatedMessages.slice(0, messageIndex + 1)
      updateChat(currentChat.id, { messages: messagesUpToEdit })
      toast({
        title: "Message updated",
        description: "Send your message again to get a new response",
      })
    } else {
      // For assistant messages, just update in place
      updateChat(currentChat.id, { messages: updatedMessages })
      toast({
        title: "Message updated",
        description: "Message content has been saved",
      })
    }

    setEditingMessageId(null)
    setEditContent("")
  }, [currentChat, editContent, updateChat, toast])

  const handleFollowUpSelect = (suggestion: string) => {
    // Dispatch custom event to insert prompt into input
    window.dispatchEvent(new CustomEvent("insertPrompt", { detail: suggestion }))
  }

  // Show greeting when no chat selected OR chat is empty
  if (!currentChat || currentChat.messages.length === 0) {
    // Get user profile for personalized greeting
    const userProfile = userProfileService.getProfile()
    const userName = userProfile.name?.trim()
    const timeGreeting = getTimeGreeting(lang)
    const subGreeting = memoizedSubGreeting

    // Get persona-specific prompts (6 prompts)
    const personaId = currentPersona?.id || "default"
    const starterPrompts = getPersonaExamplePrompts(personaId, lang)

    const handleStarterClick = (prompt: string) => {
      window.dispatchEvent(new CustomEvent("insertPrompt", { detail: prompt }))
    }

    // Truncate very long names to prevent cutoffs
    const displayName = userName && userName.length > 20
      ? `${userName.substring(0, 20)  }…`
      : userName

    return (
      <div className="flex h-full items-center justify-center p-3 sm:p-4 overflow-hidden">
        <div className="w-full max-w-4xl mx-auto px-1 sm:px-2">
          {/* Personalized greeting */}
          <div className="text-center mb-6 sm:mb-8">
            {/* Main greeting with time of day */}
            <div className="mb-4 sm:mb-6">
              <h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-fade-in break-words"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  hyphens: "auto"
                }}
              >
                {displayName ? `${timeGreeting}, ${displayName}` : timeGreeting}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2 sm:mt-3 animate-fade-in px-2" style={{ animationDelay: "150ms" }}>
                {subGreeting}
              </p>
            </div>

            {/* Persona info if selected */}
            {currentPersona && (
              <div className="flex flex-col items-center gap-2 mt-3 sm:mt-4 animate-fade-in w-full" style={{ animationDelay: "300ms" }}>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{currentPersona.emoji}</span>
                  <span className="text-xs sm:text-sm font-medium text-primary">{currentPersona.name}</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground text-center px-4 max-w-prose">{currentPersona.description}</p>
              </div>
            )}
          </div>

          {/* Persona starter prompts grid - responsive for all screen sizes */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
            {starterPrompts.slice(0, 6).map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleStarterClick(prompt)}
                className={cn(
                  "flex items-center justify-center text-center p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl",
                  "border border-border/60 bg-card/50 hover:bg-primary/5 active:scale-[0.98]",
                  "hover:border-primary/40 transition-all duration-200",
                  "text-[11px] sm:text-xs md:text-sm font-medium text-foreground/80 hover:text-foreground",
                  "min-h-[60px] sm:min-h-[70px] md:min-h-[90px]"
                )}
              >
                <span className="line-clamp-3 leading-snug break-words" style={{ wordBreak: "break-word" }}>{prompt}</span>
              </button>
            ))}
          </div>

          {/* Tip text */}
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground mt-3 sm:mt-4 animate-fade-in px-2" style={{ animationDelay: "450ms" }}>
            {lang === "de"
              ? "Tippe auf eine Frage oder schreib deine eigene"
              : lang === "es"
              ? "Toca una sugerencia o escribe la tuya"
              : "Tap a prompt or type your own"
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full w-full native-scroll">
      <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentChat.messages.map((message, index) => (
          <MessageWrapper
            key={message.id}
            messageId={message.id}
            className={cn(
              "group w-full animate-slide-in-up",
              message.role === "user" ? "flex gap-2 sm:gap-4 justify-end" : "flex flex-col gap-2"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary/20 shrink-0 shadow-md smooth-transition ring-2 ring-background">
                  {currentPersona?.avatarUrl ? (
                    <>
                      <AvatarImage src={currentPersona.avatarUrl} alt={currentPersona.name} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        <span className="text-base sm:text-lg">{currentPersona.emoji}</span>
                      </AvatarFallback>
                    </>
                  ) : currentPersona?.emoji ? (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <span className="text-base sm:text-lg">{currentPersona.emoji}</span>
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <Robot className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm font-medium text-muted-foreground">{currentPersona?.name || "AI Assistant"}</span>
              </div>
            )}

            <div className={cn(
              "flex flex-col gap-2 min-w-0",
              message.role === "user"
                ? "w-fit max-w-[80%] sm:max-w-[70%] md:max-w-[60%]"
                : "w-full"
            )}>
              {message.attachments && message.attachments.length > 0 && (() => {
                // Filter out image attachments if images are already displayed in content
                // This prevents duplicate display (image shown both as attachment card AND inline)
                const contentHasImages = hasImages(message.content)
                const attachmentsToShow = contentHasImages
                  ? message.attachments.filter(a => !a.type.startsWith('image/'))
                  : message.attachments

                if (attachmentsToShow.length === 0) return null

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                    {attachmentsToShow.map((attachment) => (
                      <FilePreviewInline
                        key={attachment.id}
                        file={attachment as FileAttachment}
                        showRemove={false}
                        compact={false}
                      />
                    ))}
                  </div>
                )
              })()}

              <div
                className={cn(
                  "text-sm sm:text-base smooth-transition relative overflow-hidden",
                  message.role === "user"
                    ? "message-bubble-user rounded-[20px] rounded-br-lg px-4 py-3 sm:px-5 sm:py-3.5 w-fit"
                    : "message-bubble-ai rounded-[20px] rounded-tl-lg px-4 py-3 sm:px-5 sm:py-3.5 w-full",
                )}
              >
                {/* Edit mode for user messages */}
                {editingMessageId === message.id && message.role === "user" ? (
                  <div className="space-y-2 w-full">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") handleEditCancel()
                        if (e.key === "Enter" && e.ctrlKey) handleEditSave(index)
                      }}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditCancel}
                        className="h-7 px-2"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditSave(index)}
                        className="h-7 px-2"
                      >
                        <FloppyDisk className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ctrl+Enter to save • Esc to cancel
                    </p>
                  </div>
                ) : message.role === "assistant" ? (
                  <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none w-full break-words overflow-hidden">
                    {/* Display generated image if present */}
                    {message.imageUrl && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-border/50 shadow-md">
                        <img
                          src={message.imageUrl}
                          alt={contentToText(message.content)}
                          className="w-full h-auto object-contain max-h-[500px] bg-muted/30"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {/* Streaming History Display (Advanced mode only) */}
                    {isAdvancedMode && message.streamingHistory && message.streamingHistory.length > 0 && (
                      <div className="mb-3">
                        <StreamingHistoryDisplay
                          history={message.streamingHistory}
                          language={settings.language as "en" | "de" | "es"}
                          collapsed={!expandedStreamingHistory.has(message.id)}
                          onToggle={() => toggleStreamingHistory(message.id)}
                        />
                      </div>
                    )}
                    {/* Collapsible Reasoning Section */}
                    {message.reasoning && (
                      <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
                        <button
                          onClick={() => toggleReasoning(message.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          {expandedReasoning.has(message.id) ? (
                            <CaretDown className="h-4 w-4" />
                          ) : (
                            <CaretRight className="h-4 w-4" />
                          )}
                          <Lightbulb className="h-4 w-4" />
                          <span>Reasoning</span>
                          <span className="text-xs text-amber-600/70 dark:text-amber-500/70 ml-auto">
                            {message.reasoning.length} chars
                          </span>
                        </button>
                        {expandedReasoning.has(message.id) && (
                          <div className="px-3 pb-3 pt-1 text-sm text-amber-900/80 dark:text-amber-100/80 whitespace-pre-wrap border-t border-amber-500/20">
                            {message.reasoning}
                          </div>
                        )}
                      </div>
                    )}
                    {(() => {
                      const raw = typeof message.content === "string" ? message.content : contentToText(message.content)
                      const normalized = normalizeMarkdownChars(raw)
                      const agentPlanProcessed = processAgentPlanTags(normalized)
                      const followUpsParsed = parseFollowUps(agentPlanProcessed)
                      const richContentParsed = RichContentParser.parseAll(followUpsParsed.content)

                      return (
                        <>
                          <ReactMarkdown
                            remarkPlugins={remarkPlugins}
                            rehypePlugins={rehypePlugins}
                            components={{
                              // Use static components (extracted to module level for performance)
                              ...staticMarkdownComponents,
                              // Dynamic components that depend on this message's parsed content
                              p: ({ children }) => {
                                // Check if paragraph contains placeholders
                                const text = String(children)
                                if (text.match(/__\w+_[\w-]+__/)) {
                                  const parts = text.split(/(__\w+_[\w-]+__)/g)
                                  return (
                                    <div className="my-4">
                                      {parts.map((part, idx) => {
                                        if (part.startsWith("__") && part.endsWith("__")) {
                                          return RichContentParser.renderComponent(part, richContentParsed.richContent)
                                        }
                                        return part
                                      })}
                                    </div>
                                  )
                                }
                                return <p className="mb-4 last:mb-0 leading-7">{children}</p>
                              },
                              code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "")
                          const language = match ? match[1] : ""
                          const codeString = String(children).replace(/\n$/, "")

                          // Render Mermaid diagrams (if enabled in experimental settings)
                          if (!inline && language === "mermaid") {
                            if (settings.experimental?.enableMermaidDiagrams) {
                              return <LazyMermaid chart={codeString} />
                            }
                            // Show raw mermaid code as plain code block when disabled
                            return (
                              <pre className="bg-muted rounded-lg p-4 overflow-x-auto my-4 text-sm">
                                <code className="text-muted-foreground">{codeString}</code>
                              </pre>
                            )
                          }

                          // Use memoized CodeBlock for syntax highlighting (if enabled in experimental settings)
                          const useHighlighting = settings.experimental?.enableCodeBlockHighlighting
                          const useSandbox = settings.experimental?.enableLiveCodeSandbox
                          return !inline && match ? (
                            useHighlighting ? (
                              <CodeBlock
                                language={language}
                                code={codeString}
                                onCopy={handleCopyCode}
                                enableSandbox={useSandbox}
                              />
                            ) : (
                              // Plain code block without syntax highlighting
                              <pre className="bg-zinc-800 dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto my-4 text-sm">
                                <code className="text-zinc-100 font-mono whitespace-pre">{codeString}</code>
                              </pre>
                            )
                          ) : (
                            <code
                              className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border break-all inline-block max-w-full"
                              {...props}
                            >
                              {children}
                            </code>
                          )
                        },
                        img: ({ src, alt }) => (
                          <img
                            src={src}
                            alt={alt || "Image"}
                            className="max-w-full sm:max-w-sm md:max-w-md h-auto rounded-lg border border-border my-4"
                            loading="lazy"
                          />
                        ),
                              }}
                            >
                              {richContentParsed.content}
                            </ReactMarkdown>
                          </>
                        )
                      })()}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    <RenderMessageContent content={message.content} />
                  </div>
                )}
                {message.tokens && (
                  <div className="mt-2 text-xs opacity-70 flex items-center gap-2">
                    <span>{message.tokens.total} tokens</span>
                  </div>
                )}
              </div>

              {/* Search Sources Badge - Shows after message content with animation */}
              {message.role === "assistant" && (() => {
                // Only show if experimental setting is enabled (defaults to true)
                const showSearchResults = settings.experimental?.statsDisplay?.showSearchResults ?? true

                if (!showSearchResults) {
                  return null
                }

                // Extract search results from streaming history
                const searchEntry = message.streamingHistory?.find(entry =>
                  entry.searchResults && entry.searchResults.length > 0
                )

                if (searchEntry?.searchResults) {
                  return (
                    <div className="animate-slide-in-up">
                      <SearchSourcesBadge
                        results={searchEntry.searchResults}
                        provider={searchEntry.searchProvider}
                        query={searchEntry.searchQuery}
                        language={settings.language as "en" | "de" | "es"}
                      />
                    </div>
                  )
                }
                return null
              })()}

              {/* Memory Surfacing Badge - Shows which memories influenced the response */}
              {message.role === "assistant" && (() => {
                // Extract memory data from streaming history
                const memoryEntry = message.streamingHistory?.find(entry =>
                  entry.usedMemories && entry.usedMemories.length > 0
                )

                if (memoryEntry?.usedMemories) {
                  return (
                    <div className="animate-slide-in-up">
                      <MemorySurfacingBadge
                        memories={memoryEntry.usedMemories}
                        decision={memoryEntry.memoryDecision}
                        language={settings.language as "en" | "de" | "es"}
                      />
                    </div>
                  )
                }
                return null
              })()}

              {/* Suggested prompts and follow-up questions for assistant messages (last message only) */}
              {message.role === "assistant" && index === currentChat.messages.length - 1 && (() => {
                const parsed = parseFollowUps(contentToText(message.content))
                return (
                  <>
                    {/* Categorized follow-ups (new format) */}
                    {parsed.categorizedFollowUps.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">💬 Continue with:</p>
                        <FollowUpSuggestions
                          categorizedSuggestions={parsed.categorizedFollowUps}
                          onSelect={handleFollowUpSelect}
                          showCategorized={settings.experimental?.showCategorizedFollowUps ?? false}
                        />
                      </div>
                    )}
                    {/* Follow-up questions (AI asks user) - old format fallback */}
                    {parsed.followUps.length > 0 && parsed.categorizedFollowUps.length === 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">❓ Follow-up questions:</p>
                        <FollowUpSuggestions suggestions={parsed.followUps} onSelect={handleFollowUpSelect} />
                      </div>
                    )}
                    {/* Suggested prompts (user can ask AI) - shown last, most prominent */}
                    {parsed.suggestedPrompts.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">💡 You could ask:</p>
                        <FollowUpSuggestions suggestions={parsed.suggestedPrompts} onSelect={handleFollowUpSelect} />
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Detailed Stats for assistant messages (when enabled in experimental streaming settings) */}
              {/* Shows on ALL platforms (mobile, desktop, PWA, Android) in Advanced Mode when toggle is ON */}
              {message.role === "assistant" &&
               isAdvancedMode &&
               settings.experimental?.streamingVisualization?.showDetailedStats !== false && (
                <MessageStats message={message} statsSettings={settings.experimental?.statsDisplay} />
              )}

              {/* Response Analysis for assistant messages (when enabled in experimental settings) */}
              {message.role === "assistant" && settings.experimental?.enableResponseAnalysis && (() => {
                const textContent = contentToText(message.content)
                const analysis = ResponseAnalyzer.analyze(textContent)
                return <ResponseAnalysisPanel analysis={analysis} className="mt-3" />
              })()}

              {/* Message action buttons - visible on touch devices, hover on pointer devices */}
              <div className="flex gap-1 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  onClick={() => handleCopy(message.content, message.id)}
                  title="Copy message"
                >
                  {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                {settings.voiceSettings?.enabled !== false && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={() => handleSpeak(message.content, message.id)}
                    title={speakingId === message.id ? "Stop speaking" : "Read aloud"}
                  >
                    {speakingId === message.id ? <SpeakerSlash className="h-3 w-3" /> : <SpeakerHigh className="h-3 w-3" />}
                  </Button>
                )}
                {message.role === "user" && editingMessageId !== message.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={() => handleEditStart(message)}
                    title="Edit message"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7"
                  onClick={() => handleDelete(index)}
                  title="Delete message"
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {message.role === "user" && (
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary/10 shrink-0 shadow-md smooth-transition ring-2 ring-background">
                <AvatarFallback className="bg-gradient-to-br from-secondary to-muted text-secondary-foreground">
                  <User className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </AvatarFallback>
              </Avatar>
            )}
          </MessageWrapper>
        ))}

        {/* Modern AI Loading Indicator with Step-by-Step Visualization */}
        {isChatLoading && (
          <div className="flex flex-col gap-2 animate-slide-in-up">
            <div className="flex items-center gap-2">
              {/* GPU-OPTIMIZED: Removed animate-spin-slow - uses static gradient ring */}
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary/30 shrink-0 relative shadow-md ring-2 ring-primary/20">
                {currentPersona?.avatarUrl ? (
                  <>
                    <AvatarImage src={currentPersona.avatarUrl} alt={currentPersona.name} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <span className="text-base sm:text-lg">{currentPersona.emoji}</span>
                    </AvatarFallback>
                  </>
                ) : currentPersona?.emoji ? (
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <span className="text-base sm:text-lg">{currentPersona.emoji}</span>
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <Robot className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="text-sm font-medium text-muted-foreground">{currentPersona?.name || "AI Assistant"}</span>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className={cn(
                "message-bubble-ai rounded-[20px] rounded-tl-lg px-3 py-2.5 sm:px-5 sm:py-4 thinking-container",
                isAdvancedMode ? "min-w-[260px] sm:min-w-[360px] md:min-w-[420px]" : "min-w-[240px] sm:min-w-[280px]"
              )}>
                {/* Step-by-step status visualization - clean default for both modes */}
                <MessageStatusVerbose
                  currentPhase={streamingPhase}
                  currentTool={currentTool || undefined}
                  searchQuery={searchQuery || undefined}
                  language={settings.language as "en" | "de" | "es"}
                  modelName={currentModelName}
                  streamingDetails={currentStreamingDetails || undefined}
                />
                {/* Skeleton content preview when responding (simple mode only) */}
                {/* GPU-OPTIMIZED: Removed animate-pulse - uses static opacity instead */}
                {!isAdvancedMode && streamingPhase === "responding" && (
                  <div className="space-y-2.5 mt-3 pt-3 border-t border-border/20">
                    <div className="h-3 rounded-full bg-muted/60 w-full opacity-80" />
                    <div className="h-3 rounded-full bg-muted/40 w-4/5 opacity-70" />
                    <div className="h-3 rounded-full bg-muted/30 w-3/5 opacity-60" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
})
