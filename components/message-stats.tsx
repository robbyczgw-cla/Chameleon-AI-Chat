"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { Message, StatsDisplaySettings } from "@/types"

interface MessageStatsProps {
  message: Message
  statsSettings?: StatsDisplaySettings
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

export function MessageStats({ message, statsSettings }: MessageStatsProps) {
  if (!message.stats && !message.tokens) return null

  const { stats, tokens } = message

  // Settings with defaults (all true by default)
  const showReasoning = statsSettings?.showReasoning !== false
  const showCache = statsSettings?.showCache !== false
  const showNativeTokens = statsSettings?.showNativeTokens !== false
  const showPerformance = statsSettings?.showPerformance !== false
  const showGeneration = statsSettings?.showGeneration !== false
  const showSearch = statsSettings?.showSearch !== false
  const showEfficiency = statsSettings?.showEfficiency !== false
  const defaultExpandReasoning = statsSettings?.defaultExpandReasoning !== false
  const defaultExpandCache = statsSettings?.defaultExpandCache || false

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
  const hasPerformance = stats?.responseTime || stats?.actualTokensPerSecond || stats?.actualFirstTokenLatency

  // Search stats
  const hasSearch = stats?.searchProvider || stats?.searchResults !== undefined

  // Tool calling stats
  const hasToolCallCosts = stats?.toolCallCost !== undefined && stats.toolCallCost > 0
  const toolCallCostPercent = hasToolCallCosts && cost
    ? ((stats.toolCallCost! / cost) * 100)
    : null

  // Derived metrics
  const costPerKToken = cost && tokens?.total ? ((cost / tokens.total) * 1000) : null
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
              value={`$${(costPerKToken * 1000).toFixed(2)}/M`}
              valueClass="opacity-75"
            />
          )}
        </div>
      )}

      {/* 🧠 Reasoning Tokens - For thinking models */}
      {showReasoning && hasReasoningTokens && (
        <CollapsibleSection
          title="Reasoning"
          icon="🧠"
          defaultOpen={defaultExpandReasoning}
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
      {showCache && hasCacheStats && (
        <CollapsibleSection
          title="Prompt Cache"
          icon="💾"
          defaultOpen={defaultExpandCache}
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
      {showNativeTokens && hasNativeTokens && (
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
        </CollapsibleSection>
      )}

      {/* ⚡ Performance */}
      {showPerformance && hasPerformance && (
        <CollapsibleSection
          title="Performance"
          icon="⚡"
          badge={stats?.actualTokensPerSecond
            ? `${Math.round(stats.actualTokensPerSecond)} t/s`
            : undefined}
        >
          {/* TTFT from OpenRouter */}
          {stats?.actualFirstTokenLatency && (
            <StatRow
              label="Time to First Token"
              value={`${stats.actualFirstTokenLatency.toFixed(2)}s`}
              valueClass="text-blue-600 dark:text-blue-400"
            />
          )}
          {stats?.responseTime && (
            <StatRow
              label="Total Response Time"
              value={`${stats.responseTime.toFixed(2)}s`}
            />
          )}
          {/* TPS from OpenRouter */}
          {stats?.actualTokensPerSecond && (
            <StatRow
              label="Generation Speed"
              value={`${stats.actualTokensPerSecond.toFixed(1)} t/s`}
              valueClass="text-green-600 dark:text-green-400"
            />
          )}
          {/* Tool call TPS if different from final response */}
          {stats?.toolCallTokensPerSecond && stats.actualTokensPerSecond &&
           Math.abs(stats.toolCallTokensPerSecond - stats.actualTokensPerSecond) > 5 && (
            <StatRow
              label="Tool Call Speed"
              value={`${stats.toolCallTokensPerSecond.toFixed(1)} t/s`}
              valueClass="text-orange-600 dark:text-orange-400"
            />
          )}
        </CollapsibleSection>
      )}

      {/* 🎛️ Generation Info */}
      {showGeneration && (stats?.model || stats?.provider || stats?.stopReason) && (
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
        </CollapsibleSection>
      )}

      {/* 🔍 Search Stats */}
      {showSearch && hasSearch && (
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

      {/* 🔧 Tool Calling Costs */}
      {hasToolCallCosts && (
        <CollapsibleSection
          title="Tool Calling"
          icon="🔧"
          badge={`$${stats.toolCallCost!.toFixed(6)}`}
          badgeColor="bg-orange-500/20 text-orange-600 dark:text-orange-400"
        >
          <StatRow
            label="Tool Call Cost"
            value={`$${stats.toolCallCost!.toFixed(6)}`}
            valueClass="text-orange-600 dark:text-orange-400"
          />
          {toolCallCostPercent && (
            <StatRow
              label="% of Total Cost"
              value={`${toolCallCostPercent.toFixed(1)}%`}
            />
          )}
          {stats?.toolCallTokensPrompt && (
            <StatRow
              label="Tool Input Tokens"
              value={stats.toolCallTokensPrompt.toLocaleString()}
            />
          )}
          {stats?.toolCallTokensCompletion && (
            <StatRow
              label="Tool Output Tokens"
              value={stats.toolCallTokensCompletion.toLocaleString()}
            />
          )}
          {stats?.toolCallCount && (
            <StatRow
              label="Tool Iterations"
              value={stats.toolCallCount}
            />
          )}
          {stats?.allGenerationIds && stats.allGenerationIds.length > 1 && (
            <StatRow
              label="API Calls"
              value={`${stats.allGenerationIds.length} generations`}
              valueClass="opacity-75"
            />
          )}
        </CollapsibleSection>
      )}

      {/* 📈 Efficiency Metrics */}
      {showEfficiency && tokens && cost && (
        <CollapsibleSection title="Efficiency" icon="📈">
          <StatRow
            label="Cost/Input Token"
            value={`$${(cost / tokens.prompt * 1000000).toFixed(2)}/M`}
            valueClass="opacity-75"
          />
          <StatRow
            label="Cost/Output Token"
            value={`$${(cost / tokens.completion * 1000000).toFixed(2)}/M`}
            valueClass="opacity-75"
          />
          {stats?.tokensPerSecond && stats?.responseTime && (
            <StatRow
              label="Cost/Second"
              value={`$${(cost / stats.responseTime).toFixed(6)}/s`}
              valueClass="opacity-75"
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
