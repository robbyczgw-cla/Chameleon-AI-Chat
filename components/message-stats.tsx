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

  // Tool call tokens for calculating final response
  const toolInputTokens = stats?.toolCallTokensPrompt || 0
  const toolOutputTokens = stats?.toolCallTokensCompletion || 0
  const hasToolCalls = hasToolCallCosts && toolInputTokens > 0

  // Final response = what the user actually sees (total - tool overhead)
  const finalInputTokens = hasToolCalls ? actualInputTokens - toolInputTokens : actualInputTokens
  const finalOutputTokens = hasToolCalls ? actualOutputTokens - toolOutputTokens : actualOutputTokens
  const finalTotalTokens = finalInputTokens + finalOutputTokens

  // Reasoning percentage based on FINAL output (visible content), not total
  const reasoningPercentage = hasReasoningTokens && finalOutputTokens > 0
    ? ((stats.nativeTokensCompletionReasoning! / finalOutputTokens) * 100)
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

      {/* Primary Token Display - Shows FINAL response (what user sees) */}
      {/* If tool calls exist, shows final response; otherwise shows total */}
      {(finalInputTokens > 0 || finalOutputTokens > 0) && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 overflow-hidden">
          <StatRow label="Input" value={`${finalInputTokens.toLocaleString()} tokens`} />
          <StatRow label="Output" value={`${finalOutputTokens.toLocaleString()} tokens`} />
          <StatRow label="Total" value={`${finalTotalTokens.toLocaleString()} tokens`} />
        </div>
      )}

      {/* 🧠 Reasoning breakdown - inline, not collapsible for quick view */}
      {showReasoning && hasReasoningTokens && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-border/50 overflow-hidden">
          <StatRow
            label="🧠 Reasoning"
            value={`${stats.nativeTokensCompletionReasoning!.toLocaleString()} tokens (${reasoningPercentage?.toFixed(0)}%)`}
            valueClass="text-amber-600 dark:text-amber-400"
          />
          <StatRow
            label="Visible Output"
            value={`${(finalOutputTokens - stats.nativeTokensCompletionReasoning!).toLocaleString()} tokens`}
          />
        </div>
      )}

      {/* 🔧 Tool Overhead breakdown - inline when present */}
      {hasToolCalls && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t border-border/50 overflow-hidden">
          <StatRow
            label="🔧 Tool Overhead"
            value={`+${toolInputTokens.toLocaleString()} in, +${toolOutputTokens.toLocaleString()} out`}
            valueClass="text-orange-600 dark:text-orange-400"
          />
          <StatRow
            label="Total (incl. tools)"
            value={`${actualTotalTokens.toLocaleString()} tokens`}
            valueClass="opacity-75"
          />
        </div>
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

      {/* 🔧 Tool Calling Details - only show cost details in collapsible */}
      {hasToolCallCosts && (
        <CollapsibleSection
          title="Tool Details"
          icon="🔧"
          badge={`$${stats.toolCallCost!.toFixed(4)} (${toolCallCostPercent?.toFixed(0)}%)`}
          badgeColor="bg-orange-500/20 text-orange-600 dark:text-orange-400"
        >
          <StatRow
            label="Tool Cost"
            value={`$${stats.toolCallCost!.toFixed(6)}`}
            valueClass="text-orange-600 dark:text-orange-400"
          />
          <StatRow
            label="Response Cost"
            value={`$${(cost! - stats.toolCallCost!).toFixed(6)}`}
          />
          {stats?.toolCallCount && (
            <StatRow
              label="Iterations"
              value={stats.toolCallCount}
            />
          )}
          {stats?.allGenerationIds && stats.allGenerationIds.length > 1 && (
            <StatRow
              label="API Calls"
              value={`${stats.allGenerationIds.length} generations`}
            />
          )}
        </CollapsibleSection>
      )}

      {/* 📈 Efficiency Metrics */}
      {showEfficiency && actualTotalTokens > 0 && stats?.responseTime && (
        <CollapsibleSection title="Efficiency" icon="📈">
          {cost && (
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
