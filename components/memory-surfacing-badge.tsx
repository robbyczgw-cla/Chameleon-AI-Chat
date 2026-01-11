"use client"

import { useState } from "react"
import { Brain, CaretDown, CaretRight, Lightbulb, Stack, Star, Target, Wrench } from "@phosphor-icons/react";
import { cn } from "@/lib/utils"
import type { UsedMemory } from "@/types"

interface MemorySurfacingBadgeProps {
  memories: UsedMemory[]
  decision?: {
    action: "skipped" | "retrieved" | "empty"
    reason: string
    searchMethod?: "semantic" | "keyword"
    confidence?: number
  }
  language?: "en" | "de" | "es"
}

// Memory type icons and colors
const memoryTypeConfig: Record<string, { icon: React.ElementType; color: string; label: Record<string, string> }> = {
  preference: {
    icon: Star,
    color: "text-amber-500",
    label: { en: "Preference", de: "Vorliebe", es: "Preferencia" }
  },
  fact: {
    icon: Lightbulb,
    color: "text-blue-500",
    label: { en: "Fact", de: "Fakt", es: "Hecho" }
  },
  context: {
    icon: Stack,
    color: "text-purple-500",
    label: { en: "Context", de: "Kontext", es: "Contexto" }
  },
  skill: {
    icon: Wrench,
    color: "text-green-500",
    label: { en: "Skill", de: "Fähigkeit", es: "Habilidad" }
  },
  goal: {
    icon: Target,
    color: "text-red-500",
    label: { en: "Goal", de: "Ziel", es: "Objetivo" }
  }
}

// Importance level display
const importanceLabels: Record<number, Record<string, string>> = {
  1: { en: "Low", de: "Niedrig", es: "Bajo" },
  2: { en: "Medium", de: "Mittel", es: "Medio" },
  3: { en: "High", de: "Hoch", es: "Alto" }
}

export function MemorySurfacingBadge({
  memories,
  decision,
  language = "en"
}: MemorySurfacingBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Don't show if no memories used
  if (!memories || memories.length === 0) {
    return null
  }

  const labels = {
    en: {
      memoriesUsed: "Memories used",
      memory: "memory",
      memories: "memories",
      semanticSearch: "Semantic search",
      keywordSearch: "Keyword search",
      confidence: "Confidence",
      importance: "Importance",
      similarity: "Similarity"
    },
    de: {
      memoriesUsed: "Erinnerungen verwendet",
      memory: "Erinnerung",
      memories: "Erinnerungen",
      semanticSearch: "Semantische Suche",
      keywordSearch: "Stichwortsuche",
      confidence: "Konfidenz",
      importance: "Wichtigkeit",
      similarity: "Ähnlichkeit"
    },
    es: {
      memoriesUsed: "Memorias usadas",
      memory: "memoria",
      memories: "memorias",
      semanticSearch: "Búsqueda semántica",
      keywordSearch: "Búsqueda por palabras",
      confidence: "Confianza",
      importance: "Importancia",
      similarity: "Similitud"
    }
  }

  const l = labels[language]

  // Group memories by type for summary
  const typeGroups = memories.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="mt-3 w-full max-w-full overflow-hidden">
      {/* Compact badge - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs",
          "bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30",
          "text-violet-700 dark:text-violet-300 transition-colors",
          "active:scale-95",
          "max-w-full overflow-hidden"
        )}
      >
        <Brain className="w-3.5 h-3.5" />
        <span className="font-medium">{l.memoriesUsed}</span>

        {/* Memory count */}
        <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold">
          {memories.length}
        </span>

        {/* Type icons preview */}
        <div className="flex items-center gap-0.5 ml-1">
          {Object.entries(typeGroups).slice(0, 4).map(([type, count]) => {
            const config = memoryTypeConfig[type]
            if (!config) return null
            const Icon = config.icon
            return (
              <div
                key={type}
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-violet-500/20",
                  config.color
                )}
                title={`${count} ${config.label[language] || config.label.en}`}
              >
                <Icon className="w-3 h-3" />
              </div>
            )
          })}
        </div>

        {/* Search method indicator */}
        {decision?.searchMethod && (
          <span className="text-violet-500/70 text-[10px] ml-0.5">
            {decision.searchMethod === "semantic" ? "🧠" : "🔤"}
          </span>
        )}

        {/* Expand/collapse indicator */}
        {isExpanded ? (
          <CaretDown className="w-3 h-3" />
        ) : (
          <CaretRight className="w-3 h-3" />
        )}
      </button>

      {/* Expanded memory details */}
      {isExpanded && (
        <div className="mt-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
          {/* Decision info */}
          {decision && (
            <div className="flex flex-wrap gap-2 mb-3 text-xs text-violet-600 dark:text-violet-400">
              {decision.searchMethod && (
                <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50">
                  {decision.searchMethod === "semantic" ? l.semanticSearch : l.keywordSearch}
                </span>
              )}
              {decision.confidence !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50">
                  {l.confidence}: {(decision.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>
          )}

          {/* Memory list */}
          <div className="space-y-2">
            {memories.map((memory, idx) => {
              const config = memoryTypeConfig[memory.type] || memoryTypeConfig.fact
              const Icon = config.icon

              return (
                <div
                  key={memory.id || idx}
                  className="flex items-start gap-2 p-2 rounded-md bg-white dark:bg-zinc-800/50 border border-violet-100 dark:border-violet-800/50"
                >
                  {/* Type icon */}
                  <div className={cn("mt-0.5 flex-shrink-0", config.color)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Memory content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/90 break-words">
                      {memory.content}
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        config.color,
                        "bg-current/10"
                      )}>
                        {config.label[language] || config.label.en}
                      </span>

                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        memory.importance === 3 ? "text-red-500 bg-red-500/10" :
                        memory.importance === 2 ? "text-amber-500 bg-amber-500/10" :
                        "text-gray-500 bg-gray-500/10"
                      )}>
                        {importanceLabels[memory.importance]?.[language] || importanceLabels[memory.importance]?.en}
                      </span>

                      {memory.similarity !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded text-violet-500 bg-violet-500/10">
                          {l.similarity}: {(memory.similarity * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
