"use client"

import type { Message } from "@/types"

interface MessageStatsProps {
  message: Message
}

export function MessageStats({ message }: MessageStatsProps) {
  if (!message.stats && !message.tokens) return null

  const { stats, tokens } = message

  // Use exact cost from OpenRouter API (no more estimates!)
  const cost = stats?.actualCost || stats?.cost || null

  // Calculate cache savings if available
  const hasCacheStats = stats?.cacheReadTokens || stats?.cacheCreationTokens
  const cacheReadTokens = stats?.cacheReadTokens || 0
  const cacheCreationTokens = stats?.cacheCreationTokens || 0

  // Check if we have native token counts (more accurate than estimates)
  const hasNativeTokens = stats?.nativeTokensPrompt || stats?.nativeTokensCompletion

  return (
    <div className="mt-3 p-3 rounded-lg border bg-muted/30 text-xs font-mono space-y-2">
      <div className="font-semibold text-muted-foreground mb-2">📊 Detailed Stats</div>

      {/* Token Usage */}
      {tokens && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="text-muted-foreground">Input Tokens:</div>
          <div className="font-medium">
            {tokens.prompt.toLocaleString()}
            {hasNativeTokens && stats?.nativeTokensPrompt !== tokens.prompt && (
              <span className="text-muted-foreground ml-1">
                ({stats.nativeTokensPrompt?.toLocaleString()} native)
              </span>
            )}
          </div>

          <div className="text-muted-foreground">Output Tokens:</div>
          <div className="font-medium">
            {tokens.completion.toLocaleString()}
            {hasNativeTokens && stats?.nativeTokensCompletion !== tokens.completion && (
              <span className="text-muted-foreground ml-1">
                ({stats.nativeTokensCompletion?.toLocaleString()} native)
              </span>
            )}
          </div>

          {/* Reasoning tokens for o1/o3/DeepSeek R1 models */}
          {stats?.nativeTokensCompletionReasoning && stats.nativeTokensCompletionReasoning > 0 && (
            <>
              <div className="text-muted-foreground">Reasoning Tokens:</div>
              <div className="font-medium text-amber-600 dark:text-amber-400">
                {stats.nativeTokensCompletionReasoning.toLocaleString()} 🧠
              </div>
            </>
          )}

          <div className="text-muted-foreground">Total Tokens:</div>
          <div className="font-medium">{tokens.total.toLocaleString()}</div>
        </div>
      )}

      {/* Cost & Cache Savings */}
      {(cost || hasCacheStats) && (
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {cost && (
              <>
                <div className="text-muted-foreground">Cost:</div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  ${typeof cost === 'number' ? cost.toFixed(6) : cost}
                </div>
              </>
            )}

            {/* Cache statistics */}
            {cacheReadTokens > 0 && (
              <>
                <div className="text-muted-foreground">Cache Hits:</div>
                <div className="font-medium text-blue-600 dark:text-blue-400">
                  {cacheReadTokens.toLocaleString()} tokens 💾
                </div>
              </>
            )}

            {cacheCreationTokens > 0 && (
              <>
                <div className="text-muted-foreground">Cache Created:</div>
                <div className="font-medium text-purple-600 dark:text-purple-400">
                  {cacheCreationTokens.toLocaleString()} tokens
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {stats && (
        <>
          {(stats.responseTime || stats.tokensPerSecond || stats.firstTokenTime) && (
            <div className="pt-2 border-t">
              <div className="font-semibold text-muted-foreground mb-1">⚡ Performance</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {stats.responseTime && (
                  <>
                    <div className="text-muted-foreground">Response Time:</div>
                    <div className="font-medium">{stats.responseTime.toFixed(2)}s</div>
                  </>
                )}

                {stats.tokensPerSecond && (
                  <>
                    <div className="text-muted-foreground">Tokens/sec:</div>
                    <div className="font-medium">{Math.round(stats.tokensPerSecond)} t/s</div>
                  </>
                )}

                {stats.firstTokenTime && (
                  <>
                    <div className="text-muted-foreground">First Token (TTFT):</div>
                    <div className="font-medium">{stats.firstTokenTime.toFixed(2)}s</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Model & Provider Info */}
          {(stats.model || stats.provider || stats.stopReason) && (
            <div className="pt-2 border-t">
              <div className="font-semibold text-muted-foreground mb-1">🎛️ Generation</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {stats.model && (
                  <>
                    <div className="text-muted-foreground">Model:</div>
                    <div className="font-medium truncate">{stats.model}</div>
                  </>
                )}

                {stats.provider && (
                  <>
                    <div className="text-muted-foreground">Provider:</div>
                    <div className="font-medium">{stats.provider}</div>
                  </>
                )}

                {stats.stopReason && (
                  <>
                    <div className="text-muted-foreground">Stop Reason:</div>
                    <div className="font-medium">{stats.stopReason}</div>
                  </>
                )}

                {tokens && (
                  <>
                    <div className="text-muted-foreground">Token Efficiency:</div>
                    <div className="font-medium">
                      {((tokens.completion / tokens.total) * 100).toFixed(0)}% output
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Search Stats */}
          {(stats.searchProvider || stats.searchResults !== undefined) && (
            <div className="pt-2 border-t">
              <div className="font-semibold text-muted-foreground mb-1">🔍 Search</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {stats.searchProvider && (
                  <>
                    <div className="text-muted-foreground">Provider:</div>
                    <div className="font-medium">{stats.searchProvider}</div>
                  </>
                )}

                {stats.searchResults !== undefined && (
                  <>
                    <div className="text-muted-foreground">Results Found:</div>
                    <div className="font-medium">{stats.searchResults}</div>
                  </>
                )}

                {stats.searchTime && (
                  <>
                    <div className="text-muted-foreground">Search Time:</div>
                    <div className="font-medium">{stats.searchTime.toFixed(2)}s</div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
