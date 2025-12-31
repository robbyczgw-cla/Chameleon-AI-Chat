"use client"

import { useState, useEffect } from "react"
import { Bot, User, Copy, Check, Eye, ExternalLink, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeSanitize from "rehype-sanitize"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { ChameleonLogoSimple } from "@/components/chameleon-logo"

interface SharedMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  model?: string | null
  createdAt: string
}

interface SharedChatData {
  shareId: string
  chatId: string
  shareTitle?: string | null
  chatTitle: string
  viewCount: number
  createdAt: string
  messages: SharedMessage[]
}

interface SharedChatViewProps {
  chat: SharedChatData
  shareToken: string
}

const remarkPlugins = [remarkGfm, remarkMath]
const rehypePlugins = [rehypeSanitize, rehypeKatex]

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

export function SharedChatView({ chat, shareToken }: SharedChatViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const copyToClipboard = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyShareLink = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setCopiedId("share-link")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const title = chat.shareTitle || chat.chatTitle
  const createdDate = new Date(chat.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Filter out system messages for display
  const visibleMessages = chat.messages.filter(m => m.role !== "system")

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/92">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 border border-primary/10">
              <ChameleonLogoSimple className="text-green-600" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground line-clamp-1">{title}</h1>
              <p className="text-xs text-muted-foreground">
                Shared on {createdDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-lg">
              <Eye className="h-3.5 w-3.5" />
              <span>{chat.viewCount} views</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyShareLink}
              className="gap-1.5"
            >
              {copiedId === "share-link" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Copy Link</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              asChild
              className="gap-1.5"
            >
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Try Chameleon</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Info Banner */}
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground">
              This is a read-only view of a shared conversation.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {visibleMessages.length} messages in this conversation
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-6">
          {visibleMessages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "group relative flex gap-4 p-4 rounded-2xl transition-all",
                message.role === "user"
                  ? "bg-primary/5 border border-primary/10"
                  : "bg-muted/30 border border-border/40"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                  message.role === "user"
                    ? "bg-primary/10 text-primary"
                    : "bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5 text-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {message.role === "user" ? "User" : "Assistant"}
                  </span>
                  {message.model && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {message.model.split("/").pop()}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {mounted && new Date(message.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap text-foreground">{message.content}</p>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={remarkPlugins}
                      rehypePlugins={rehypePlugins}
                      components={{
                        pre: ({ children }) => (
                          <pre className="bg-zinc-900 rounded-lg p-4 overflow-x-auto text-sm">
                            {children}
                          </pre>
                        ),
                        code: ({ className, children, ...props }) => {
                          const isInline = !className
                          return isInline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        },
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {normalizeMarkdownChars(message.content)}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Copy Button */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedId === message.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border/40 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Want to have your own AI conversations?
          </p>
          <Button asChild size="lg" className="gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <ChameleonLogoSimple className="text-primary-foreground" size={20} />
              Start chatting with Chameleon AI
            </a>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            100+ AI models, 31 personas, memory system, and more
          </p>
        </div>
      </main>
    </div>
  )
}
