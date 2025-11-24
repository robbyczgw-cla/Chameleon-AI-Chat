"use client"

/**
 * MessageBubble Component
 * Renders a single chat message with all its features:
 * - User/Assistant styling
 * - Markdown rendering
 * - Code highlighting
 * - Attachments
 * - Actions (copy, speak, regenerate, delete)
 * - Reasoning display (for extended thinking models)
 */

import { memo, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronRight,
  Lightbulb,
} from "lucide-react"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { FilePreviewInline } from "@/components/file-preview-inline"
import { MessageStats } from "@/components/message-stats"
import { ResponseAnalysisPanel } from "@/components/response-analysis-panel"
import { ResponseAnalyzer } from "@/lib/response-analyzer"
import { contentToText } from "@/lib/multimodal-utils"
import type { Message, AppSettings } from "@/types"
import type { Persona } from "@/lib/personas"
import type { FileAttachment } from "@/lib/file-handler"
import type { MessageContent } from "@/types"

interface MessageBubbleProps {
  message: Message
  index: number
  persona?: Persona
  settings: AppSettings
  onCopy: (content: MessageContent, messageId: string) => void
  onSpeak: (content: MessageContent, messageId: string) => void
  onRegenerate: (messageIndex: number) => void
  onDelete: (messageIndex: number) => void
  copiedId: string | null
  speakingId: string | null
}

/**
 * Helper component to render multimodal message content
 */
function RenderMessageContent({ content }: { content: MessageContent }) {
  if (typeof content === "string") {
    return <>{content}</>
  }

  return (
    <>
      {content.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.text}</span>
        }
        if (part.type === "image_url" && part.image_url) {
          return (
            <div
              key={index}
              className="my-3 rounded-lg overflow-hidden border border-border/50 shadow-md"
            >
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
}

export const MessageBubble = memo(function MessageBubble({
  message,
  index,
  persona,
  settings,
  onCopy,
  onSpeak,
  onRegenerate,
  onDelete,
  copiedId,
  speakingId,
}: MessageBubbleProps) {
  const [expandedReasoning, setExpandedReasoning] = useState(false)

  const toggleReasoning = useCallback(() => {
    setExpandedReasoning((prev) => !prev)
  }, [])

  const textContent = contentToText(message.content)

  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-6 group w-full animate-slide-in-up",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for assistant */}
      {message.role === "assistant" && (
        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary/20 shrink-0 glow-subtle hover-glow smooth-transition">
          {persona?.avatarUrl ? (
            <>
              <AvatarImage
                src={persona.avatarUrl}
                alt={persona.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <span className="text-base sm:text-lg">{persona.emoji}</span>
              </AvatarFallback>
            </>
          ) : persona?.emoji ? (
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <span className="text-base sm:text-lg">{persona.emoji}</span>
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </AvatarFallback>
          )}
        </Avatar>
      )}

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col gap-2",
          message.role === "user"
            ? "w-fit max-w-[70%] sm:max-w-[65%] md:max-w-[60%]"
            : "min-w-0 w-full max-w-[85%] sm:max-w-[85%] md:max-w-[90%] lg:max-w-[85%]"
        )}
      >
        {/* Attachments */}
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

        {/* Message bubble */}
        <div
          className={cn(
            "text-sm sm:text-base smooth-transition relative overflow-hidden",
            message.role === "user"
              ? "rounded-2xl rounded-br-md px-5 py-4 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-md w-fit"
              : "rounded-2xl rounded-bl-md px-5 py-4 bg-card/40 backdrop-blur-md border border-border/30 shadow-sm max-w-full hover:bg-card/50 transition-colors"
          )}
        >
          {/* Glass shine effect for user messages */}
          {message.role === "user" && (
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          )}

          {message.role === "assistant" ? (
            <div className="prose prose-sm sm:prose-base dark:prose-invert w-full break-words">
              {/* Generated image */}
              {message.imageUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-border/50 shadow-md">
                  <img
                    src={message.imageUrl}
                    alt={textContent}
                    className="w-full h-auto object-contain max-h-[500px] bg-muted/30"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Collapsible Reasoning Section */}
              {message.reasoning && (
                <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
                  <button
                    onClick={toggleReasoning}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    {expandedReasoning ? (
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
                  {expandedReasoning && (
                    <div className="px-3 pb-3 pt-1 text-sm text-amber-900/80 dark:text-amber-100/80 whitespace-pre-wrap border-t border-amber-500/20">
                      {message.reasoning}
                    </div>
                  )}
                </div>
              )}

              {/* Markdown content */}
              <MarkdownRenderer content={textContent} />
            </div>
          ) : (
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap break-words"
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              <RenderMessageContent content={message.content} />
            </div>
          )}

          {/* Token count */}
          {message.tokens && (
            <div className="mt-2 text-xs opacity-70 flex items-center gap-2">
              <span>{message.tokens.total} tokens</span>
            </div>
          )}
        </div>

        {/* Detailed Stats */}
        {message.role === "assistant" && settings.showDetailedStats && (
          <MessageStats message={message} />
        )}

        {/* Response Analysis */}
        {message.role === "assistant" &&
          settings.experimental?.enableResponseAnalysis && (
            <ResponseAnalysisPanel
              analysis={ResponseAnalyzer.analyze(textContent)}
              className="mt-3"
            />
          )}

        {/* Action buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7"
            onClick={() => onCopy(message.content, message.id)}
          >
            {copiedId === message.id ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>

          {message.role === "assistant" &&
            settings.voiceSettings?.enabled !== false && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-7 sm:w-7"
                onClick={() => onSpeak(message.content, message.id)}
                title={
                  speakingId === message.id ? "Stop speaking" : "Read aloud"
                }
              >
                {speakingId === message.id ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            )}

          {message.role === "assistant" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7"
              onClick={() => onRegenerate(index)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7"
            onClick={() => onDelete(index)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Avatar for user */}
      {message.role === "user" && (
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-border shrink-0 hover-scale smooth-transition">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
})
