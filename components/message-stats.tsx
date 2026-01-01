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
    <div className="pt-2 border-t border-border/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 text-left font-semibold text-muted-foreground mb-1 hover:text-foreground transition-colors min-w-0"
      >
        {isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        <span className="flex items-center gap-2 min-w-0 truncate">
          <span className="shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
          {badge !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
              {badge}
            </span>
          )}
        </span>
      </button>
      {isOpen && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5 animate-in fade-in-0 slide-in-from-top-1 duration-200 overflow-hidden">
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

  // IMPORTANT: Use native tokens as primary source (accurate totals including tool calls)
  // Fall back to message.tokens only if native tokens aren't available
  const hasNativeTokens = stats?.nativeTokensPrompt || stats?.nativeTokensCompletion

  // Actual token counts to use for display and calculations
  const actualInputTokens = stats?.nativeTokensPrompt || tokens?.prompt || 0
  const actualOutputTokens = stats?.nativeTokensCompletion || tokens?.completion || 0
  const actualTotalTokens = actualInputTokens + actualOutputTokens

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

  // Derived metrics - use ACTUAL token counts (native tokens when available)
  const costPerKToken = cost && actualTotalTokens > 0 ? ((cost / actualTotalTokens) * 1000) : null
  const reasoningPercentage = hasReasoningTokens && actualOutputTokens > 0
    ? ((stats.nativeTokensCompletionReasoning! / actualOutputTokens) * 100)
    : null
  const cacheSavingsPercent = cacheReadTokens > 0 && actualInputTokens > 0
    ? ((cacheReadTokens / actualInputTokens) * 100)
    : null

  return (
    <div className="mt-3 p-2 sm:p-3 rounded-lg border bg-muted/30 text-xs font-mono space-y-1 w-full max-w-full overflow-x-hidden box-border">
      <div className="font-semibold text-muted-foreground mb-2 flex items-center justify-between gap-2 min-w-0">
        <span className="truncate">📊 Detailed Stats</span>
        {cost && (
          <span className="text-green-600 dark:text-green-400 font-bold shrink-0 text-[11px]">
            ${cost.toFixed(6)}
          </span>
        )}
      </div>

      {/* Basic Token & Cost - Always visible */}
      {/* Uses native tokens (accurate totals) when available, falls back to message.tokens */}
      {(actualInputTokens > 0 || actualOutputTokens > 0) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 overflow-hidden">
          <StatRow label="Input" value={`${actualInputTokens.toLocaleString()} tokens`} />
          <StatRow label="Output" value={`${actualOutputTokens.toLocaleString()} tokens`} />
          <StatRow label="Total" value={`${actualTotalTokens.toLocaleString()} tokens`} />
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
            value={`${(actualOutputTokens - stats.nativeTokensCompletionReasoning!).toLocaleString()}`}
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

      {/* 📏 Final Response Tokens - Shows only final API call tokens when different from total */}
      {/* Helpful to understand tool call overhead: Total - Final = Tool call tokens */}
      {showNativeTokens && hasNativeTokens && tokens &&
       (tokens.prompt !== actualInputTokens || tokens.completion !== actualOutputTokens) && (
        <CollapsibleSection title="Final Response Only" icon="📏">
          <StatRow
            label="Final Input"
            value={`${tokens.prompt.toLocaleString()} tokens`}
            valueClass="opacity-75"
          />
          <StatRow
            label="Final Output"
            value={`${tokens.completion.toLocaleString()} tokens`}
            valueClass="opacity-75"
          />
          <StatRow
            label="Tool Overhead"
            value={`+${(actualInputTokens - tokens.prompt).toLocaleString()} in, +${(actualOutputTokens - tokens.completion).toLocaleString()} out`}
            valueClass="text-orange-600 dark:text-orange-400"
          />
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
          badge={`$${stats.toolCallCost!.toFixed(4)}`}
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
      {showEfficiency && actualTotalTokens > 0 && cost && (
        <CollapsibleSection title="Efficiency" icon="📈">
          <StatRow
            label="Cost/Input Token"
            value={`$${(cost / actualInputTokens * 1000000).toFixed(2)}/M`}
            valueClass="opacity-75"
          />
          <StatRow
            label="Cost/Output Token"
            value={`$${(cost / actualOutputTokens * 1000000).toFixed(2)}/M`}
            valueClass="opacity-75"
          />
          {stats?.responseTime && (
            <StatRow
              label="Cost/Second"
              value={`$${(cost / stats.responseTime).toFixed(6)}/s`}
              valueClass="opacity-75"
            />
          )}
          <StatRow
            label="Chars/Token (out)"
            value={actualOutputTokens > 0
              ? `${((message.content?.length || 0) / actualOutputTokens).toFixed(1)}`
              : "N/A"
            }
          />
        </CollapsibleSection>
      )}
    </div>
  )
}
