"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, ExternalLink, FileSearch, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchResult } from "@/lib/search/types"

interface SearchResultsCardProps {
  results: SearchResult[]
  provider?: string
  query?: string
  language?: "en" | "de" | "es"
  className?: string
  maxResults?: number // Limit number of results shown (for live streaming)
}

export function SearchResultsCard({
  results,
  provider,
  query,
  language = "en",
  className,
  maxResults
}: SearchResultsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showImages, setShowImages] = useState(false)

  if (!results || results.length === 0) {
    return null
  }

  // Limit results if maxResults is specified (for live streaming)
  const displayResults = maxResults ? results.slice(0, maxResults) : results
  const hasMore = maxResults && results.length > maxResults
  const hasImages = displayResults.some(r => r.image)

  const labels = {
    en: {
      title: "Search Results",
      from: "from",
      results: results.length === 1 ? "result" : "results",
      showImages: "Show images",
      hideImages: "Hide images",
      showingOf: "Showing {count} of {total}"
    },
    de: {
      title: "Suchergebnisse",
      from: "von",
      results: results.length === 1 ? "Ergebnis" : "Ergebnisse",
      showImages: "Bilder anzeigen",
      hideImages: "Bilder ausblenden",
      showingOf: "{count} von {total} angezeigt"
    },
    es: {
      title: "Resultados de búsqueda",
      from: "de",
      results: results.length === 1 ? "resultado" : "resultados",
      showImages: "Mostrar imágenes",
      hideImages: "Ocultar imágenes",
      showingOf: "Mostrando {count} de {total}"
    }
  }

  const l = labels[language]

  // Get unique source domains for favicon display
  const uniqueDomains = Array.from(new Set(displayResults.map(r => {
    try {
      return new URL(r.url).hostname.replace('www.', '')
    } catch {
      return r.url
    }
  }))).slice(0, 5) // Show max 5 unique domains

  return (
    <div className={cn(
      "rounded-lg border border-cyan-500/30 bg-cyan-500/10 overflow-hidden",
      "w-full max-w-full", // Prevent mobile overflow
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-2 sm:p-2.5 hover:bg-cyan-500/20 transition-colors overflow-hidden"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-cyan-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-cyan-500 flex-shrink-0" />
        )}
        <FileSearch className="w-4 h-4 text-cyan-500 flex-shrink-0" />
        <div className="flex-1 text-left">
          <span className="text-xs sm:text-sm font-medium text-cyan-600 dark:text-cyan-400">
            {l.title}
          </span>
          {query && (
            <span className="text-xs text-cyan-500/70 ml-2">
              "{query}"
            </span>
          )}
        </div>

        {/* Domain favicon badges */}
        <div className="flex items-center gap-1 mx-2">
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
            <span className="text-cyan-500/70 text-[10px]">
              +{uniqueDomains.length - 3}
            </span>
          )}
        </div>

        <span className="text-xs text-cyan-500/70">
          {hasMore
            ? l.showingOf.replace('{count}', displayResults.length.toString()).replace('{total}', results.length.toString())
            : `${results.length} ${l.results}`}
          {provider && ` ${l.from} ${provider}`}
        </span>
      </button>

      {/* Results List */}
      {isExpanded && (
        <div className="border-t border-cyan-500/20">
          {/* Image Toggle */}
          {hasImages && (
            <div className="px-2 sm:px-3 py-1.5 border-b border-cyan-500/20">
              <button
                onClick={() => setShowImages(!showImages)}
                className="flex items-center gap-2 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {showImages ? l.hideImages : l.showImages}
              </button>
            </div>
          )}

          {/* Results */}
          <div className="max-h-96 overflow-y-auto overflow-x-hidden">
            {displayResults.map((result, index) => (
              <div
                key={`${result.url}-${index}`}
                className="p-2 sm:p-2.5 md:p-3 border-b border-cyan-500/10 last:border-b-0 hover:bg-cyan-500/5 transition-colors overflow-hidden"
              >
                {/* Result Image */}
                {showImages && result.image && (
                  <div className="mb-2">
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-full h-32 object-cover rounded border border-cyan-500/20"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Result Title */}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-1.5 mb-0.5"
                >
                  <span className="text-sm font-medium text-foreground group-hover:underline line-clamp-2">
                    {result.title}
                  </span>
                  <ExternalLink className="w-3 h-3 text-cyan-500/50 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {/* Result URL */}
                <div className="text-xs text-muted-foreground mb-1 truncate">
                  {new URL(result.url).hostname}
                  {result.publishedDate && (
                    <span className="ml-2">• {new Date(result.publishedDate).toLocaleDateString(language)}</span>
                  )}
                </div>

                {/* Result Content/Summary */}
                {(result.summary || result.content) && (
                  <p className="text-xs text-foreground/80 line-clamp-3">
                    {result.summary || result.content}
                  </p>
                )}

                {/* Result Highlights */}
                {result.highlights && result.highlights.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.highlights.slice(0, 2).map((highlight, hIndex) => (
                      <div
                        key={hIndex}
                        className="text-xs text-foreground/70 pl-2 border-l-2 border-cyan-500/40 line-clamp-2"
                      >
                        {highlight}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
