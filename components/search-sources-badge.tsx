"use client"

import { useState } from "react"
import { ArrowSquareOut, Globe, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils"
import { SearchResultsCard } from "./search-results-card"
import type { SearchResult } from "@/lib/search/types"

interface SearchSourcesBadgeProps {
  results: SearchResult[]
  provider?: string
  query?: string
  language?: "en" | "de" | "es"
}

// Provider icons mapping
const providerIcons: Record<string, string> = {
  tavily: "🔍",
  serper: "🌐",
  exa: "🔮"
}

export function SearchSourcesBadge({
  results,
  provider,
  query,
  language = "en"
}: SearchSourcesBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!results || results.length === 0) {
    return null
  }

  const labels = {
    en: { sources: "Sources" },
    de: { sources: "Quellen" },
    es: { sources: "Fuentes" }
  }

  const l = labels[language]
  const providerIcon = provider ? providerIcons[provider] || "🌐" : "🌐"

  // Get unique source domains
  const uniqueDomains = Array.from(new Set(results.map(r => {
    try {
      return new URL(r.url).hostname.replace('www.', '')
    } catch {
      return r.url
    }
  }))).slice(0, 5) // Show max 5 unique domains

  return (
    <div className="mt-3 w-full max-w-full overflow-hidden">
      {/* Compact badge - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs",
          "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30",
          "text-cyan-700 dark:text-cyan-300 transition-colors",
          "active:scale-95",
          "max-w-full overflow-hidden"
        )}
      >
        <MagnifyingGlass className="w-3.5 h-3.5" />
        <span className="font-medium">{l.sources}</span>

        {/* Result count */}
        <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold">
          {results.length}
        </span>

        {/* Domain favicon badges */}
        <div className="flex items-center gap-1 ml-1">
          {uniqueDomains.slice(0, 3).map((domain, i) => (
            <div
              key={i}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-cyan-500/20 overflow-hidden"
              title={domain}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt={domain}
                className="w-4 h-4 object-contain"
                loading="lazy"
                onError={(e) => {
                  // Fallback to first letter if favicon fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.classList.add('bg-cyan-500/20', 'text-[10px]', 'font-medium')
                    parent.textContent = domain.charAt(0).toUpperCase()
                  }
                }}
              />
            </div>
          ))}
          {uniqueDomains.length > 3 && (
            <span className="text-cyan-500/70 text-[10px] ml-0.5">
              +{uniqueDomains.length - 3}
            </span>
          )}
        </div>

        {/* Expand/collapse indicator */}
        <ArrowSquareOut className={cn(
          "w-3 h-3 transition-transform",
          isExpanded && "rotate-90"
        )} />
      </button>

      {/* Expanded results */}
      {isExpanded && (
        <div className="mt-2">
          <SearchResultsCard
            results={results}
            provider={provider}
            query={query}
            language={language}
          />
        </div>
      )}
    </div>
  )
}
