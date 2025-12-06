"use client"

import { useEffect, useState } from "react"
import { useApp } from "@/contexts/app-context"
import { estimateTokens, calculateCost } from "@/lib/token-tracker"
import { Coins, Type } from "lucide-react"
import { cn } from "@/lib/utils"

interface TokenCounterPreviewProps {
  input: string
}

export function TokenCounterPreview({ input }: TokenCounterPreviewProps) {
  const { settings } = useApp()
  const [estimatedTokens, setEstimatedTokens] = useState(0)
  const [estimatedCost, setEstimatedCost] = useState(0)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    setCharCount(input.length)

    if (!input.trim()) {
      setEstimatedTokens(0)
      setEstimatedCost(0)
      return
    }

    // Estimate input tokens
    const tokens = estimateTokens(input)
    setEstimatedTokens(tokens)

    // Estimate cost using current model
    const cost = calculateCost(tokens, 500, settings.selectedModel) // Assume ~500 output tokens
    setEstimatedCost(cost)
  }, [input, settings.selectedModel])

  // Always show character count, even when empty
  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Character counter - always visible */}
      <div
        className="flex items-center gap-1.5 text-muted-foreground"
        title="Characters typed"
      >
        <Type className="h-3.5 w-3.5" />
        <span className="font-medium tabular-nums">{charCount.toLocaleString()}</span>
      </div>

      {/* Token counter - shows when typing */}
      {estimatedTokens > 0 && (
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md",
            "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
          title={`Estimated tokens for this message. Cost includes ~500 estimated response tokens.`}
        >
          <Coins className="h-3.5 w-3.5" />
          <span className="font-medium tabular-nums">{estimatedTokens.toLocaleString()}</span>
          <span className="text-amber-600/70 dark:text-amber-400/70">tokens</span>
          {estimatedCost > 0 && (
            <>
              <span className="text-amber-600/50 dark:text-amber-400/50 mx-0.5">•</span>
              <span className="font-medium tabular-nums">~${estimatedCost.toFixed(4)}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
