"use client"

import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Brain, ChevronDown, Check, Zap, Gauge, Sparkles, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export type ReasoningDepth = "minimal" | "low" | "medium" | "high"

interface ReasoningDepthConfig {
  id: ReasoningDepth
  name: string
  shortName: string
  description: string
  icon: React.ReactNode
  color: string
}

const REASONING_DEPTHS: ReasoningDepthConfig[] = [
  {
    id: "minimal",
    name: "Minimal",
    shortName: "Min",
    description: "Fastest, simple tasks",
    icon: <Zap className="h-3.5 w-3.5" />,
    color: "text-gray-500",
  },
  {
    id: "low",
    name: "Low",
    shortName: "Low",
    description: "Quick responses, basic reasoning",
    icon: <Gauge className="h-3.5 w-3.5" />,
    color: "text-blue-500",
  },
  {
    id: "medium",
    name: "Medium",
    shortName: "Med",
    description: "Balanced quality & speed",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: "text-purple-500",
  },
  {
    id: "high",
    name: "High",
    shortName: "High",
    description: "Maximum reasoning depth",
    icon: <Flame className="h-3.5 w-3.5" />,
    color: "text-orange-500",
  },
]

// Models that support configurable reasoning depth
const REASONING_DEPTH_MODELS = [
  // Gemini 3 - uses thinking_level (minimal, low, medium, high)
  "gemini-3",
  // OpenAI o-series, GPT-5 - uses effort (low, medium, high)
  "o1", "o3", "gpt-5",
]

// Models that support reasoning but only on/off (no depth levels)
const REASONING_ONOFF_MODELS = [
  "grok-4", "grok-code",
  "deepseek-r1", "deepseek/deepseek-r1",
  "deepseek-v3", "deepseek/deepseek-v3",  // V3.2 also supports reasoning
]

interface ReasoningDepthSelectorProps {
  compact?: boolean // For mobile
}

export function ReasoningDepthSelector({ compact = false }: ReasoningDepthSelectorProps) {
  const { settings, updateSettings } = useApp()

  const currentDepth = settings.reasoningDepth || "medium"
  const currentConfig = REASONING_DEPTHS.find(d => d.id === currentDepth) || REASONING_DEPTHS[2]

  // Get the model, with fallback to prevent null issues
  const currentModel = settings.selectedModel?.toLowerCase() || ""

  // Check if current model supports reasoning depth (configurable)
  const modelSupportsDepth = REASONING_DEPTH_MODELS.some(pattern =>
    currentModel.includes(pattern)
  )

  // Check if current model supports reasoning on/off only
  const modelSupportsOnOff = REASONING_ONOFF_MODELS.some(pattern =>
    currentModel.includes(pattern)
  )

  const handleDepthChange = (depth: ReasoningDepth) => {
    updateSettings({ reasoningDepth: depth })
  }

  // Toggle for on/off models
  const handleToggleReasoning = () => {
    if (settings.reasoningDepth) {
      updateSettings({ reasoningDepth: undefined })
    } else {
      updateSettings({ reasoningDepth: "medium" })
    }
  }

  // Don't show if model doesn't support any reasoning
  if (!modelSupportsDepth && !modelSupportsOnOff) {
    return null
  }

  // Simple on/off toggle for Grok, DeepSeek R1, etc.
  if (modelSupportsOnOff && !modelSupportsDepth) {
    const isEnabled = !!settings.reasoningDepth
    return (
      <Button
        variant={isEnabled ? "default" : "outline"}
        size="sm"
        onClick={handleToggleReasoning}
        className={cn(
          "gap-1.5 h-8",
          isEnabled && "bg-amber-500 hover:bg-amber-600 text-white",
          compact && "px-2"
        )}
        title={isEnabled ? "Reasoning enabled (click to disable)" : "Click to enable reasoning"}
      >
        <Brain className={cn("h-3.5 w-3.5", isEnabled && "animate-pulse")} />
        {!compact && (
          <span className="text-xs font-medium">
            {isEnabled ? "Thinking" : "Think"}
          </span>
        )}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 md:h-8 px-2 md:px-3 rounded-md border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs",
            currentConfig.color
          )}
        >
          <Brain className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
          <span className="font-medium">
            {compact ? currentConfig.shortName : currentConfig.name}
          </span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[220px]"
      >
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Reasoning Depth
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {REASONING_DEPTHS.map((depth) => {
          const isSelected = depth.id === currentDepth

          return (
            <DropdownMenuItem
              key={depth.id}
              onClick={() => handleDepthChange(depth.id)}
              className={cn(
                "group flex items-center gap-3 py-2.5 cursor-pointer",
                isSelected && "bg-primary/10"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg",
                isSelected ? "bg-primary/20" : "bg-muted",
                depth.color
              )}>
                {depth.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {depth.name}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <span className="text-xs text-muted-foreground">
                  {depth.description}
                </span>
              </div>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Higher = better quality, slower
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
