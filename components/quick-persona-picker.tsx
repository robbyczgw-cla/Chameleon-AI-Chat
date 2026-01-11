"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { CaretDown, Check, User } from "@phosphor-icons/react";
import { type Persona, type PersonaCategory, getVisiblePersonas, getPersonasByCategory, CATEGORY_LABELS } from "@/lib/personas"
import { PersonasStorageService } from "@/lib/personas-storage"
import { cn } from "@/lib/utils"
import { getPersonaDescription } from "@/lib/languages"

// Category colors for badges (matching persona-selector)
const CATEGORY_COLORS: Record<PersonaCategory, string> = {
  core: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  creative: "bg-orange-500/20 text-orange-700 dark:text-orange-300",
  professional: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  philosophy: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  lifestyle: "bg-pink-500/20 text-pink-700 dark:text-pink-300",
  learning: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  curator: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  special: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
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

interface QuickPersonaPickerProps {
  /** Use flat list instead of categories (for mobile) */
  flat?: boolean
}

export function QuickPersonaPicker({ flat = false }: QuickPersonaPickerProps) {
  const { settings, updateSettings } = useApp()
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const currentPersona = settings.selectedPersona
  const lang = (settings.language || "en") as "en" | "de" | "es"

  // Detect mobile for responsive rendering
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Load custom personas
  const loadCustomPersonas = () => {
    const custom = PersonasStorageService.loadCustomPersonas()
    setCustomPersonas(custom)
  }

  useEffect(() => {
    loadCustomPersonas()

    // Listen for persona changes
    const handlePersonasChanged = () => {
      console.log("[QuickPersonaPicker] Personas changed, reloading...")
      loadCustomPersonas()
    }

    window.addEventListener("personasChanged", handlePersonasChanged)

    return () => {
      window.removeEventListener("personasChanged", handlePersonasChanged)
    }
  }, [])

  const handlePersonaChange = (persona: Persona) => {
    updateSettings({ selectedPersona: persona })
  }

  const handleClearPersona = () => {
    updateSettings({ selectedPersona: undefined })
  }

  const getPersonaDisplay = () => {
    if (!currentPersona) return "Standard"
    return currentPersona.name
  }

  // Render a single persona item
  const renderPersonaItem = (persona: Persona, showCategory = false) => {
    const isSelected = currentPersona?.id === persona.id
    return (
      <DropdownMenuItem
        key={persona.id}
        onClick={() => handlePersonaChange(persona)}
        className={cn(
          "group flex flex-col items-start gap-0.5 py-2 cursor-pointer",
          isSelected && "bg-primary/10"
        )}
      >
        <div className="flex items-center gap-2 w-full">
          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          {persona.avatarUrl ? (
            <div className="h-5 w-5 rounded-full overflow-hidden border border-border shrink-0">
              <img src={persona.avatarUrl} alt={persona.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <span className="text-base shrink-0">{persona.emoji}</span>
          )}
          <span className={cn(
            "font-medium text-sm truncate group-hover:!text-accent-foreground",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {persona.name}
          </span>
          {showCategory && persona.category && (
            <span className={cn(
              "ml-auto px-1.5 py-0.5 text-[9px] rounded-full font-medium shrink-0",
              CATEGORY_COLORS[persona.category]
            )}>
              {CATEGORY_LABELS[persona.category]?.[lang] || persona.category}
            </span>
          )}
        </div>
        <span className="text-xs leading-tight pl-5 text-muted-foreground group-hover:!text-accent-foreground line-clamp-1">
          {getPersonaDescription(persona.id, settings.language)}
        </span>
      </DropdownMenuItem>
    )
  }

  // Use flat list for mobile or when explicitly requested
  const useFlatList = flat || isMobile

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 md:h-8 px-2 md:px-3 rounded-md border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs"
        >
          {currentPersona?.emoji ? (
            <span className="text-sm mr-1.5">{currentPersona.emoji}</span>
          ) : (
            <User className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1.5 text-primary" />
          )}
          <span className="font-medium max-w-[80px] md:max-w-[120px] truncate">
            {getPersonaDisplay()}
          </span>
          <CaretDown className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "max-h-[450px] overflow-y-auto",
          useFlatList ? "w-[300px]" : "w-[320px] md:w-[380px]"
        )}
      >
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Select Persona
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Default / No Persona option */}
        <DropdownMenuItem
          onClick={handleClearPersona}
          className={cn(
            "group flex items-center gap-2 py-2.5 cursor-pointer",
            !currentPersona && "bg-primary/10"
          )}
        >
          {!currentPersona && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          <User className="h-4 w-4 opacity-60 group-hover:opacity-100" />
          <span className={cn(
            "font-medium text-sm group-hover:!text-accent-foreground",
            !currentPersona ? "text-primary" : "text-foreground"
          )}>
            Standard (no persona)
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {useFlatList ? (
          // Mobile/Flat: Simple list with category badges on each item
          <>
            {CATEGORY_ORDER.map((category) => {
              const personas = getPersonasByCategory(category)
              if (personas.length === 0) return null

              return (
                <DropdownMenuGroup key={category}>
                  {personas.map(persona => renderPersonaItem(persona, true))}
                </DropdownMenuGroup>
              )
            })}
          </>
        ) : (
          // Desktop: Category-based sub-menus
          <>
            {CATEGORY_ORDER.map((category) => {
              const personas = getPersonasByCategory(category)
              if (personas.length === 0) return null

              const label = CATEGORY_LABELS[category]?.[lang] || category
              const hasSelectedInCategory = personas.some(p => p.id === currentPersona?.id)

              return (
                <DropdownMenuSub key={category}>
                  <DropdownMenuSubTrigger className={cn(
                    "flex items-center gap-2 py-2",
                    hasSelectedInCategory && "bg-primary/5"
                  )}>
                    <span className={cn(
                      "px-1.5 py-0.5 text-[10px] rounded-full font-medium",
                      CATEGORY_COLORS[category]
                    )}>
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {personas.length}
                    </span>
                    {hasSelectedInCategory && (
                      <Check className="h-3 w-3 text-primary ml-auto" />
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-[280px] max-h-[350px] overflow-y-auto">
                      {personas.map(persona => renderPersonaItem(persona))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )
            })}
          </>
        )}

        {/* Custom personas section */}
        {customPersonas.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
              Your Personas
            </DropdownMenuLabel>
            {customPersonas.map(persona => renderPersonaItem(persona))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
