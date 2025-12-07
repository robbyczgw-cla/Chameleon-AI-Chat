"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { Message } from "@/types"

interface MessageStatsProps {
  message: Message
}

interface CollapsibleSectionProps {
  title: string
  icon: string
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string | number
  badgeColor?: string
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  badgeColor = "bg-muted"
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="pt-2 border-t border-border/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 text-left font-semibold text-muted-foreground mb-1 hover:text-foreground transition-colors"
      >
        {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        <span className="flex items-center gap-2">
          {icon} {title}
          {badge !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </span>
      </button>
      {isOpen && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value, valueClass = "" }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <>
      <div className="text-muted-foreground">{label}:</div>
      <div className={`font-medium ${valueClass}`}>{value}</div>
    </>
  )
}

export function MessageStats({ message }: MessageStatsProps) {
  if (!message.stats && !message.tokens) return null

  const { stats, tokens } = message

  // Use exact cost from OpenRouter API (no more estimates!)
  const cost = stats?.actualCost || stats?.cost || null

  // Cache stats
  const cacheReadTokens = stats?.cacheReadTokens || 0
  const cacheCreationTokens = stats?.cacheCreationTokens || 0
  const hasCacheStats = cacheReadTokens > 0 || cacheCreationTokens > 0

  // Native tokens
  const hasNativeTokens = stats?.nativeTokensPrompt || stats?.nativeTokensCompletion

  // Reasoning stats
  const hasReasoningTokens = stats?.nativeTokensCompletionReasoning && stats.nativeTokensCompletionReasoning > 0

  // Performance stats
  const hasPerformance = stats?.responseTime || stats?.tokensPerSecond || stats?.firstTokenTime

  // Search stats
  const hasSearch = stats?.searchProvider || stats?.searchResults !== undefined

  // Derived metrics
  const costPerKToken = cost && tokens?.total ? ((cost / tokens.total) * 1000) : null
  const inputOutputRatio = tokens && tokens.completion > 0 ? (tokens.prompt / tokens.completion) : null
  const reasoningPercentage = hasReasoningTokens && tokens?.completion
    ? ((stats.nativeTokensCompletionReasoning! / tokens.completion) * 100)
    : null
  const cacheSavingsPercent = cacheReadTokens > 0 && tokens?.prompt
    ? ((cacheReadTokens / tokens.prompt) * 100)
    : null

  return (
    <div className="mt-3 p-3 rounded-lg border bg-muted/30 text-xs font-mono space-y-1">
      <div className="font-semibold text-muted-foreground mb-2 flex items-center justify-between">
        <span>📊 Detailed Stats</span>
        {cost && (
          <span className="text-green-600 dark:text-green-400 font-bold">
            ${cost.toFixed(6)}
          </span>
        )}
      </div>

      {/* Basic Token & Cost - Always visible */}
      {tokens && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <StatRow label="Input" value={`${tokens.prompt.toLocaleString()} tokens`} />
          <StatRow label="Output" value={`${tokens.completion.toLocaleString()} tokens`} />
          <StatRow label="Total" value={`${tokens.total.toLocaleString()} tokens`} />
          {costPerKToken && (
            <StatRow
              label="Rate"
              value={`$${costPerKToken.toFixed(4)}/1K`}
              valueClass="text-muted-foreground"
            />
          )}
        </div>
      )}

      {/* 🧠 Reasoning Tokens - For thinking models */}
      {hasReasoningTokens && (
        <CollapsibleSection
          title="Reasoning"
          icon="🧠"
          defaultOpen={true}
          badge={`${reasoningPercentage?.toFixed(0)}%`}
          badgeColor="bg-amber-500/20 text-amber-600 dark:text-amber-400"
        >
          <StatRow
            label="Thinking Tokens"
            value={stats.nativeTokensCompletionReasoning!.toLocaleString()}
            valueClass="text-amber-600 dark:text-amber-400"
          />
          <StatRow
            label="% of Output"
            value={`${reasoningPercentage?.toFixed(1)}%`}
          />
          <StatRow
            label="Visible Output"
            value={`${(tokens!.completion - stats.nativeTokensCompletionReasoning!).toLocaleString()}`}
          />
        </CollapsibleSection>
      )}

      {/* 💾 Cache Stats - Prompt caching */}
      {hasCacheStats && (
        <CollapsibleSection
          title="Prompt Cache"
          icon="💾"
          badge={cacheSavingsPercent ? `${cacheSavingsPercent.toFixed(0)}% saved` : undefined}
          badgeColor="bg-blue-500/20 text-blue-600 dark:text-blue-400"
        >
          {cacheReadTokens > 0 && (
            <StatRow
              label="Cache Hits"
              value={`${cacheReadTokens.toLocaleString()} tokens`}
              valueClass="text-blue-600 dark:text-blue-400"
            />
          )}
          {cacheCreationTokens > 0 && (
            <StatRow
              label="Cache Created"
              value={`${cacheCreationTokens.toLocaleString()} tokens`}
              valueClass="text-purple-600 dark:text-purple-400"
            />
          )}
          {cacheSavingsPercent && (
            <StatRow
              label="Input Cached"
              value={`${cacheSavingsPercent.toFixed(1)}%`}
            />
          )}
        </CollapsibleSection>
      )}

      {/* 📏 Native Tokens - Accurate tokenizer */}
      {hasNativeTokens && (
        <CollapsibleSection title="Native Tokenizer" icon="📏">
          {stats?.nativeTokensPrompt && (
            <StatRow
              label="Native Input"
              value={stats.nativeTokensPrompt.toLocaleString()}
            />
          )}
          {stats?.nativeTokensCompletion && (
            <StatRow
              label="Native Output"
              value={stats.nativeTokensCompletion.toLocaleString()}
            />
          )}
          {stats?.nativeTokensPrompt && tokens?.prompt && stats.nativeTokensPrompt !== tokens.prompt && (
            <StatRow
              label="Estimate Diff"
              value={`${((stats.nativeTokensPrompt - tokens.prompt) / tokens.prompt * 100).toFixed(1)}%`}
              valueClass="text-muted-foreground"
            />
          )}
        </CollapsibleSection>
      )}

      {/* ⚡ Performance */}
      {hasPerformance && (
        <CollapsibleSection
          title="Performance"
          icon="⚡"
          badge={stats?.tokensPerSecond ? `${Math.round(stats.tokensPerSecond)} t/s` : undefined}
        >
          {stats?.firstTokenTime && (
            <StatRow
              label="Time to First Token"
              value={`${stats.firstTokenTime.toFixed(2)}s`}
            />
          )}
          {stats?.responseTime && (
            <StatRow
              label="Total Response Time"
              value={`${stats.responseTime.toFixed(2)}s`}
            />
          )}
          {stats?.tokensPerSecond && (
            <StatRow
              label="Generation Speed"
              value={`${Math.round(stats.tokensPerSecond)} tokens/sec`}
            />
          )}
          {stats?.responseTime && stats?.firstTokenTime && (
            <StatRow
              label="Generation Time"
              value={`${(stats.responseTime - stats.firstTokenTime).toFixed(2)}s`}
              valueClass="text-muted-foreground"
            />
          )}
        </CollapsibleSection>
      )}

      {/* 🎛️ Generation Info */}
      {(stats?.model || stats?.provider || stats?.stopReason || stats?.generationId) && (
        <CollapsibleSection title="Generation" icon="🎛️">
          {stats?.model && (
            <StatRow
              label="Model"
              value={<span className="truncate block max-w-[150px]" title={stats.model}>{stats.model}</span>}
            />
          )}
          {stats?.provider && (
            <StatRow label="Provider" value={stats.provider} />
          )}
          {stats?.stopReason && (
            <StatRow label="Stop Reason" value={stats.stopReason} />
          )}
          {tokens && (
            <StatRow
              label="Output Ratio"
              value={`${((tokens.completion / tokens.total) * 100).toFixed(0)}%`}
            />
          )}
          {inputOutputRatio && (
            <StatRow
              label="Input:Output"
              value={`${inputOutputRatio.toFixed(2)}:1`}
              valueClass="text-muted-foreground"
            />
          )}
          {stats?.generationId && (
            <StatRow
              label="Generation ID"
              value={
                <span className="truncate block max-w-[120px] text-muted-foreground" title={stats.generationId}>
                  {stats.generationId.slice(0, 16)}...
                </span>
              }
            />
          )}
        </CollapsibleSection>
      )}

      {/* 🔍 Search Stats */}
      {hasSearch && (
        <CollapsibleSection
          title="Web Search"
          icon="🔍"
          badge={stats?.searchResults !== undefined ? `${stats.searchResults} results` : undefined}
        >
          {stats?.searchProvider && (
            <StatRow label="Provider" value={stats.searchProvider} />
          )}
          {stats?.searchResults !== undefined && (
            <StatRow label="Results Found" value={stats.searchResults} />
          )}
          {stats?.searchTime && (
            <StatRow label="Search Time" value={`${stats.searchTime.toFixed(2)}s`} />
          )}
        </CollapsibleSection>
      )}

      {/* 📈 Efficiency Metrics */}
      {tokens && cost && (
        <CollapsibleSection title="Efficiency" icon="📈">
          <StatRow
            label="Cost/Input Token"
            value={`$${(cost / tokens.prompt * 1000000).toFixed(2)}/M`}
            valueClass="text-muted-foreground"
          />
          <StatRow
            label="Cost/Output Token"
            value={`$${(cost / tokens.completion * 1000000).toFixed(2)}/M`}
            valueClass="text-muted-foreground"
          />
          {stats?.tokensPerSecond && stats?.responseTime && (
            <StatRow
              label="Cost/Second"
              value={`$${(cost / stats.responseTime).toFixed(6)}/s`}
              valueClass="text-muted-foreground"
            />
          )}
          <StatRow
            label="Chars/Token (out)"
            value={(message.content?.length || 0) / tokens.completion > 0
              ? `${((message.content?.length || 0) / tokens.completion).toFixed(1)}`
              : "N/A"
            }
          />
        </CollapsibleSection>
      )}
    </div>
  )
}
