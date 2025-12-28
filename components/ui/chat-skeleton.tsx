"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ChatSkeletonProps {
  /** Number of message skeletons to show */
  messageCount?: number
  /** Show the input skeleton at the bottom */
  showInput?: boolean
  /** Additional class names */
  className?: string
}

/**
 * Chat loading skeleton for better perceived performance
 * Shows a placeholder while chat content is loading
 */
export function ChatSkeleton({
  messageCount = 3,
  showInput = true,
  className,
}: ChatSkeletonProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages area */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden">
        {Array.from({ length: messageCount }).map((_, i) => (
          <MessageSkeleton
            key={`msg-skeleton-${i}`}
            isUser={i % 2 === 0}
            delay={i * 100}
          />
        ))}
      </div>

      {/* Input area */}
      {showInput && <InputSkeleton />}
    </div>
  )
}

interface MessageSkeletonProps {
  isUser?: boolean
  delay?: number
}

/**
 * Single message loading skeleton
 */
export function MessageSkeleton({ isUser = false, delay = 0 }: MessageSkeletonProps) {
  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in-50",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Avatar skeleton */}
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />

      {/* Message content skeleton */}
      <div className={cn("space-y-2", isUser ? "items-end" : "items-start")}>
        <Skeleton className={cn("h-4", isUser ? "w-20" : "w-24")} />
        <div className="space-y-1.5">
          <Skeleton className={cn("h-4", isUser ? "w-48" : "w-64")} />
          <Skeleton className={cn("h-4", isUser ? "w-32" : "w-56")} />
          {!isUser && <Skeleton className="h-4 w-40" />}
        </div>
      </div>
    </div>
  )
}

/**
 * Chat input loading skeleton
 */
export function InputSkeleton() {
  return (
    <div className="p-4 border-t border-border/50">
      <div className="flex items-center gap-2">
        {/* Icon buttons */}
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-lg" />

        {/* Text input */}
        <Skeleton className="flex-1 h-10 rounded-xl" />

        {/* Send button */}
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Sidebar loading skeleton
 */
export function SidebarSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {/* New chat button */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Search bar */}
      <Skeleton className="h-9 w-full rounded-lg" />

      {/* Chat list */}
      <div className="space-y-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`sidebar-skeleton-${i}`}
            className="flex items-center gap-3 p-2 animate-in fade-in-50"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden md:block w-72 border-r border-border/50">
        <SidebarSkeleton />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-border/50 px-4 flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg md:hidden" />
          <Skeleton className="h-6 w-32" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Chat area */}
        <ChatSkeleton />
      </div>
    </div>
  )
}

/**
 * Inline loading indicator for streaming responses
 */
export function StreamingSkeleton() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={`dot-${i}`}
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="text-sm">Thinking...</span>
    </div>
  )
}

export default ChatSkeleton
