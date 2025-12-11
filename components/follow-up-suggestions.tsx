"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Brain, Link2, Sparkles } from "lucide-react"
import type { CategorizedFollowUp } from "@/lib/follow-up-parser"
import { cn } from "@/lib/utils"

interface FollowUpSuggestionsProps {
  suggestions?: string[]
  categorizedSuggestions?: CategorizedFollowUp[]
  onSelect: (suggestion: string) => void
}

// Category-specific styling configuration
const categoryStyles = {
  quick: {
    icon: Zap,
    label: "Quick",
    containerBg: "bg-gradient-to-r from-emerald-50/80 to-green-50/50 dark:from-emerald-950/30 dark:to-green-950/20",
    labelBg: "bg-emerald-100 dark:bg-emerald-900/50",
    labelText: "text-emerald-700 dark:text-emerald-300",
    buttonBorder: "border-emerald-200/60 dark:border-emerald-700/40",
    buttonHover: "hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
    buttonText: "text-emerald-700 dark:text-emerald-300",
    iconColor: "text-emerald-500",
    gradient: "from-emerald-500 to-green-500",
  },
  deep: {
    icon: Brain,
    label: "Deep Dive",
    containerBg: "bg-gradient-to-r from-violet-50/80 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20",
    labelBg: "bg-violet-100 dark:bg-violet-900/50",
    labelText: "text-violet-700 dark:text-violet-300",
    buttonBorder: "border-violet-200/60 dark:border-violet-700/40",
    buttonHover: "hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30",
    buttonText: "text-violet-700 dark:text-violet-300",
    iconColor: "text-violet-500",
    gradient: "from-violet-500 to-purple-500",
  },
  related: {
    icon: Link2,
    label: "Related",
    containerBg: "bg-gradient-to-r from-cyan-50/80 to-blue-50/50 dark:from-cyan-950/30 dark:to-blue-950/20",
    labelBg: "bg-cyan-100 dark:bg-cyan-900/50",
    labelText: "text-cyan-700 dark:text-cyan-300",
    buttonBorder: "border-cyan-200/60 dark:border-cyan-700/40",
    buttonHover: "hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30",
    buttonText: "text-cyan-700 dark:text-cyan-300",
    iconColor: "text-cyan-500",
    gradient: "from-cyan-500 to-blue-500",
  },
}

export function FollowUpSuggestions({ suggestions, categorizedSuggestions, onSelect }: FollowUpSuggestionsProps) {
  // Mobile detection for limiting suggestions (6 on mobile, 9 on desktop)
  // Default to desktop (3 per category) to avoid flash of limited content
  const [itemsPerCategory, setItemsPerCategory] = useState(3)

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768
      setItemsPerCategory(isMobile ? 2 : 3)
    }

    // Initial check
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // If we have categorized suggestions, use enhanced layout
  if (categorizedSuggestions && categorizedSuggestions.length > 0) {
    // Group by category
    const grouped = categorizedSuggestions.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, CategorizedFollowUp[]>)

    const categoryOrder: Array<'quick' | 'deep' | 'related'> = ['quick', 'deep', 'related']

    return (
      <div className="mt-4 space-y-3">
        {categoryOrder.map((category, categoryIndex) => {
          const items = grouped[category]
          if (!items || items.length === 0) return null

          const styles = categoryStyles[category]
          const Icon = styles.icon

          return (
            <div
              key={category}
              className={cn(
                "rounded-xl p-3 border border-transparent",
                styles.containerBg,
                "animate-in fade-in-50 slide-in-from-bottom-2"
              )}
              style={{ animationDelay: `${categoryIndex * 100}ms` }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
                  styles.labelBg,
                  styles.labelText
                )}>
                  <Icon className={cn("h-3.5 w-3.5", styles.iconColor)} />
                  <span>{styles.label}</span>
                </div>
                <div className={cn(
                  "h-px flex-1 bg-gradient-to-r opacity-30",
                  styles.gradient
                )} />
              </div>

              {/* Suggestion Buttons */}
              <div className="flex flex-wrap gap-2">
                {items.slice(0, itemsPerCategory).map((item, index) => (
                  <Button
                    key={`${category}-${index}`}
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(item.text)}
                    className={cn(
                      "group h-auto py-2 px-3.5 rounded-xl bg-white/80 dark:bg-black/20",
                      "transition-all duration-200 ease-out",
                      "hover:scale-[1.02] hover:shadow-md",
                      "animate-in fade-in-50 slide-in-from-left-3",
                      styles.buttonBorder,
                      styles.buttonHover
                    )}
                    style={{ animationDelay: `${(categoryIndex * 100) + (index * 60)}ms` }}
                  >
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      "text-muted-foreground group-hover:text-foreground",
                      `group-hover:${styles.buttonText}`
                    )}>
                      {item.text}
                    </span>
                    <ArrowRight className={cn(
                      "ml-1.5 h-3.5 w-3.5 transition-all duration-200",
                      "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
                      styles.iconColor
                    )} />
                  </Button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Enhanced fallback for uncategorized suggestions
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="mt-4">
      <div className="rounded-xl p-3 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Suggestions</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
        </div>

        {/* Buttons - limit based on device */}
        <div className="flex flex-wrap gap-2">
          {suggestions.slice(0, itemsPerCategory * 3).map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSelect(suggestion)}
              className={cn(
                "group h-auto py-2 px-3.5 rounded-xl",
                "bg-white/80 dark:bg-black/20",
                "border-primary/20 hover:border-primary/50",
                "hover:bg-primary/5 hover:scale-[1.02] hover:shadow-md",
                "transition-all duration-200 ease-out",
                "animate-in fade-in-50 slide-in-from-left-3"
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {suggestion}
              </span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
