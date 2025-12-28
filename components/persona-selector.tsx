"use client"

import { useState } from "react"
import { type Persona, type PersonaCategory, getVisiblePersonas, getPersonasByCategory, CATEGORY_LABELS } from "@/lib/personas"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"

// Category colors for badges
const CATEGORY_COLORS: Record<PersonaCategory, string> = {
  core: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  creative: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
  professional: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  philosophy: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
  lifestyle: "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30",
  learning: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  curator: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  special: "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30",
}

// Category order for display
const CATEGORY_ORDER: PersonaCategory[] = [
  "core",
  "creative",
  "professional",
  "philosophy",
  "lifestyle",
  "learning",
  "curator",
]

interface PersonaSelectorProps {
  selectedPersona: Persona
  onSelectPersona: (persona: Persona) => void
  showCategories?: boolean // New prop to show category-based layout
}

export function PersonaSelector({ selectedPersona, onSelectPersona, showCategories = false }: PersonaSelectorProps) {
  const { settings } = useApp()
  const lang = (settings.language || "en") as "en" | "de" | "es"
  const visiblePersonas = getVisiblePersonas()
  const [expandedCategory, setExpandedCategory] = useState<PersonaCategory | null>(null)

  // Simple grid layout (original behavior)
  if (!showCategories) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {visiblePersonas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => onSelectPersona(persona)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-105",
              "border-2",
              selectedPersona.id === persona.id
                ? `border-violet-500 bg-gradient-to-br ${persona.color} bg-opacity-10 shadow-lg shadow-violet-500/20`
                : "border-transparent bg-card hover:border-violet-300 hover:bg-accent"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all",
                selectedPersona.id === persona.id
                  ? `bg-gradient-to-br ${persona.color} shadow-md`
                  : "bg-muted"
              )}
            >
              {persona.emoji}
            </div>
            <div className="text-center">
              <p className="text-xs font-medium line-clamp-1">{persona.name}</p>
              {persona.category && (
                <span className={cn(
                  "inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded-full border",
                  CATEGORY_COLORS[persona.category]
                )}>
                  {CATEGORY_LABELS[persona.category]?.[lang] || persona.category}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    )
  }

  // Category-based layout for Simple Mode
  return (
    <div className="space-y-4">
      {CATEGORY_ORDER.map((category) => {
        const personas = getPersonasByCategory(category)
        if (personas.length === 0) return null

        const isExpanded = expandedCategory === category
        const label = CATEGORY_LABELS[category]?.[lang] || category

        return (
          <div key={category} className="space-y-2">
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : category)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                "text-sm font-medium",
                isExpanded ? "bg-accent" : "hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full border",
                  CATEGORY_COLORS[category]
                )}>
                  {label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {personas.length} personas
                </span>
              </div>
              <span className="text-muted-foreground">
                {isExpanded ? "▼" : "▶"}
              </span>
            </button>

            {isExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-2">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => onSelectPersona(persona)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl p-2 transition-all hover:scale-[1.02]",
                      "border-2",
                      selectedPersona.id === persona.id
                        ? `border-violet-500 bg-gradient-to-br ${persona.color} bg-opacity-10 shadow-lg`
                        : "border-transparent bg-card hover:border-violet-300 hover:bg-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all flex-shrink-0",
                        selectedPersona.id === persona.id
                          ? `bg-gradient-to-br ${persona.color} shadow-md`
                          : "bg-muted"
                      )}
                    >
                      {persona.emoji}
                    </div>
                    <p className="text-xs font-medium text-left line-clamp-2">{persona.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Export category colors for use in other components
export { CATEGORY_COLORS, CATEGORY_ORDER }
