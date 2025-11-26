"use client"

import { useApp } from "@/contexts/app-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bot, User, Copy, Check, RefreshCw, Trash2, Volume2, VolumeX, ChevronDown, ChevronRight, Lightbulb, Pencil, X, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, memo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import { voiceService } from "@/lib/voice"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
/* Removed remark-math and rehype-katex to fix module loading error */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { FollowUpSuggestions } from "@/components/follow-up-suggestions"
import { parseFollowUps } from "@/lib/follow-up-parser"
import { MessageStats } from "@/components/message-stats"
import { FilePreviewInline } from "@/components/file-preview-inline"
import { ResponseAnalysisPanel } from "@/components/response-analysis-panel"
import { ResponseAnalyzer } from "@/lib/response-analyzer"
import type { FileAttachment } from "@/lib/file-handler"
import type { Persona } from "@/lib/personas"
import type { MessageContent } from "@/types"
import { contentToText } from "@/lib/multimodal-utils"

interface ChatMessagesProps {
  currentPersona?: Persona
}

/**
 * Helper component to render multimodal message content
 * Handles both text-only and text+image messages
 */
const RenderMessageContent = memo(function RenderMessageContent({ content }: { content: MessageContent }) {
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

export const ChatMessages = memo(function ChatMessages({ currentPersona }: ChatMessagesProps = {}) {
  const { chats, currentChatId, addMessage, updateChat, settings, isChatLoading } = useApp()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set())
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const { toast } = useToast()

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

  const currentChat = chats.find((chat) => chat.id === currentChatId)

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

  const handleRegenerate = async (messageIndex: number) => {
    if (!currentChat) return

    const updatedMessages = currentChat.messages.slice(0, messageIndex)
    updateChat(currentChat.id, { messages: updatedMessages })

    toast({
      title: "Regenerating response",
      description: "This will be implemented with the chat input integration",
    })
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

  if (!currentChat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-6xl">💬</div>
          <h3 className="text-xl font-semibold">No chat selected</h3>
          <p className="text-sm text-muted-foreground">Create a new chat or select an existing one to get started</p>
        </div>
      </div>
    )
  }

  if (currentChat.messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Start typing to begin...</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full w-full native-scroll">
      <div className="w-full max-w-3xl mx-auto space-y-8 px-4 sm:px-6 py-8 gpu-layer">
        {currentChat.messages.map((message, index) => (
          <div
            key={message.id}
            className={cn("flex gap-2 sm:gap-6 group w-full animate-slide-in-up", message.role === "user" ? "justify-end" : "justify-start")}
          >
            {message.role === "assistant" && (
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary/20 shrink-0 glow-subtle hover-glow smooth-transition">
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
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
            )}

            <div className={cn(
              "flex flex-col gap-2",
              message.role === "user"
                ? "w-fit max-w-[70%] sm:max-w-[65%] md:max-w-[60%]"
                : "min-w-0 w-full max-w-[85%] sm:max-w-[85%] md:max-w-[90%] lg:max-w-[85%]"
            )}>
              {message.attachments && message.attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                  {message.attachments.map((attachment) => (
                    <FilePreviewInline
                      key={attachment.id}
                      file={attachment as FileAttachment}
                      showRemove={false}
                      compact={false}
                    />
                  ))}
                </div>
              )}

              <div
                className={cn(
                  "text-sm sm:text-base smooth-transition relative overflow-hidden",
                  message.role === "user"
                    ? "rounded-2xl rounded-br-md px-5 py-4 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-md w-fit"
                    : "rounded-2xl rounded-bl-md px-5 py-4 bg-card border border-border/30 shadow-sm max-w-full hover:bg-card/80 transition-colors",
                )}
              >
                {/* Glass shine effect for user messages */}
                {message.role === "user" && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                )}
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
                        <Save className="h-3 w-3 mr-1" />
                        Save & Regenerate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ctrl+Enter to save • Esc to cancel
                    </p>
                  </div>
                ) : message.role === "assistant" ? (
                  <div className="prose prose-sm sm:prose-base dark:prose-invert w-full break-words">
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
                    {/* Collapsible Reasoning Section */}
                    {message.reasoning && (
                      <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
                        <button
                          onClick={() => toggleReasoning(message.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          {expandedReasoning.has(message.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
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
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                      components={{
                        p: ({ children }) => <p className="mb-4 last:mb-0 leading-7">{children}</p>,
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0 scroll-m-20">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold mt-5 mb-3 first:mt-0 scroll-m-20">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0 scroll-m-20">{children}</h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h4>
                        ),
                        ul: ({ children }) => <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>,
                        li: ({ children }) => <li className="leading-7">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                            {children}
                          </blockquote>
                        ),
                        hr: () => <hr className="my-6 border-border" />,
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4 hover:text-primary/80"
                          >
                            {children}
                          </a>
                        ),
                        table: ({ children }) => (
                          <div className="my-4 overflow-x-auto rounded-lg border border-border">
                            <table className="w-full min-w-full border-collapse">{children}</table>
                          </div>
                        ),
                        thead: ({ children }) => <thead className="bg-muted/70">{children}</thead>,
                        tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                        tr: ({ children }) => (
                          <tr className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            {children}
                          </tr>
                        ),
                        th: ({ children }) => (
                          <th className="px-3 py-2.5 text-left font-semibold border-r border-border last:border-r-0 text-xs sm:text-sm whitespace-nowrap">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-2.5 border-r border-border last:border-r-0 text-xs sm:text-sm align-top">
                            {children}
                          </td>
                        ),
                        input: ({ checked, type, ...props }) => {
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
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "")
                          const language = match ? match[1] : ""
                          const codeString = String(children).replace(/\n$/, "")

                          return !inline && match ? (
                            <div className="relative group/code my-4 rounded-lg w-full max-w-full overflow-hidden">
                              <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded-t-lg w-full">
                                <span className="text-xs text-zinc-400 font-mono">{language}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs opacity-0 group-hover/code:opacity-100 transition-opacity"
                                  onClick={() => handleCopyCode(codeString)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                              </div>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={language}
                                PreTag="div"
                                wrapLines
                                wrapLongLines
                                customStyle={{
                                  margin: 0,
                                  borderTopLeftRadius: 0,
                                  borderTopRightRadius: 0,
                                  borderBottomLeftRadius: "0.5rem",
                                  borderBottomRightRadius: "0.5rem",
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
                                {...props}
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
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
                            alt={alt || "Product image"}
                            className="max-w-full sm:max-w-sm md:max-w-md h-auto rounded-lg my-4 border border-border"
                            loading="lazy"
                          />
                        ),
                      }}
                    >
                      {(() => {
                        const raw = typeof message.content === "string" ? message.content : contentToText(message.content)
                        return parseFollowUps(raw).content
                      })()}
                    </ReactMarkdown>
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

              {/* Suggested prompts and follow-up questions for assistant messages (last message only) */}
              {message.role === "assistant" && index === currentChat.messages.length - 1 && (() => {
                const parsed = parseFollowUps(contentToText(message.content))
                return (
                  <>
                    {/* Categorized follow-ups (new format) */}
                    {parsed.categorizedFollowUps.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">💬 Weiter geht's:</p>
                        <FollowUpSuggestions
                          categorizedSuggestions={parsed.categorizedFollowUps}
                          onSelect={handleFollowUpSelect}
                        />
                      </div>
                    )}
                    {/* Follow-up questions (AI asks user) - old format fallback */}
                    {parsed.followUps.length > 0 && parsed.categorizedFollowUps.length === 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">❓ Noch Fragen?</p>
                        <FollowUpSuggestions suggestions={parsed.followUps} onSelect={handleFollowUpSelect} />
                      </div>
                    )}
                    {/* Suggested prompts (user can ask AI) - shown last, most prominent */}
                    {parsed.suggestedPrompts.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">💡 Das könntest du als Nächstes fragen:</p>
                        <FollowUpSuggestions suggestions={parsed.suggestedPrompts} onSelect={handleFollowUpSelect} />
                      </div>
                    )}
                  </>
                )
              })()}

              {/* Detailed Stats for assistant messages (when enabled) */}
              {message.role === "assistant" && settings.showDetailedStats && (
                <MessageStats message={message} />
              )}

              {/* Response Analysis for assistant messages (when enabled in experimental settings) */}
              {message.role === "assistant" && settings.experimental?.enableResponseAnalysis && (() => {
                const textContent = contentToText(message.content)
                const analysis = ResponseAnalyzer.analyze(textContent)
                return <ResponseAnalysisPanel analysis={analysis} className="mt-3" />
              })()}

              {/* Message action buttons - always visible on mobile, hover on desktop */}
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                    {speakingId === message.id ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </Button>
                )}
                {message.role === "assistant" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    onClick={() => handleRegenerate(index)}
                    title="Regenerate response"
                  >
                    <RefreshCw className="h-3 w-3" />
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
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {message.role === "user" && (
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-border shrink-0 hover-scale smooth-transition">
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {/* Modern AI Loading Indicator */}
        {isChatLoading && (
          <div className="flex gap-2 sm:gap-4 animate-slide-in-up">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border-2 border-primary/30 shrink-0 relative">
              <div className="absolute inset-0 rounded-full gradient-border-animated opacity-60" />
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
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[90%] lg:max-w-[85%]">
              <div className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4 bg-card border border-primary/20 shadow-lg ai-thinking-container">
                {/* Thinking indicator with wave dots */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-1 items-end h-4">
                    <div className="w-1.5 h-3 bg-primary/80 rounded-full ai-thinking-dot" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-3 bg-primary/80 rounded-full ai-thinking-dot" style={{ animationDelay: "100ms" }} />
                    <div className="w-1.5 h-3 bg-primary/80 rounded-full ai-thinking-dot" style={{ animationDelay: "200ms" }} />
                    <div className="w-1.5 h-3 bg-primary/80 rounded-full ai-thinking-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-muted-foreground/70 font-medium">Thinking...</span>
                </div>
                {/* Skeleton content preview */}
                <div className="space-y-2">
                  <div className="ai-loading-bar w-full" style={{ animationDelay: "0ms" }} />
                  <div className="ai-loading-bar w-4/5" style={{ animationDelay: "150ms" }} />
                  <div className="ai-loading-bar w-3/5" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
})
