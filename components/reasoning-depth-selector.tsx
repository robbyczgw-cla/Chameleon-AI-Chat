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
import { Atom, Brain, CaretDown, Check, Feather, Lightning, Scales } from "@phosphor-icons/react";
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
    icon: <Lightning className="h-3.5 w-3.5" />,
    color: "text-gray-500",
  },
  {
    id: "low",
    name: "Low",
    shortName: "Low",
    description: "Quick responses, basic reasoning",
    icon: <Feather className="h-3.5 w-3.5" />,
    color: "text-blue-500",
  },
  {
    id: "medium",
    name: "Medium",
    shortName: "Med",
    description: "Balanced quality & speed",
    icon: <Scales className="h-3.5 w-3.5" />,
    color: "text-purple-500",
  },
  {
    id: "high",
    name: "High",
    shortName: "High",
    description: "Maximum reasoning depth",
    icon: <Atom className="h-3.5 w-3.5" />,
    color: "text-orange-500",
  },
]

// Models that support configurable reasoning depth (show dropdown)
// Use specific patterns to avoid false matches
const REASONING_DEPTH_MODELS = [
  // Gemini 3 - uses thinking_level (minimal, low, medium, high)
  "gemini-3",
  // OpenAI o-series - uses effort (low, medium, high)
  "openai/o1", "/o1-", "openai/o3", "/o3-",
  // GPT-5 - uses effort
  "gpt-5",
]

// Note: Grok 4.1, DeepSeek R1/V3 have reasoning ALWAYS enabled in the API route
// No toggle needed - they're fast and cheap enough to always use reasoning

interface ReasoningDepthSelectorProps {
  compact?: boolean // For mobile
}

export function ReasoningDepthSelector({ compact = false }: ReasoningDepthSelectorProps) {
  const { settings, updateSettings, currentChatId, chats } = useApp()

  // Get current chat to check for chat-specific model override
  const currentChat = chats.find((c) => c.id === currentChatId)

  // Use chat-specific model if set, otherwise fall back to settings
  // This fixes the issue where the toggle wouldn't update when model changes via QuickModelPicker
  const actualModel = currentChat?.model || settings?.selectedModel

  // Early return if no model available
  if (!actualModel) {
    return null
  }

  const currentDepth = settings.reasoningDepth || "medium"
  const currentConfig = REASONING_DEPTHS.find(d => d.id === currentDepth) || REASONING_DEPTHS[2]

  // Get the model in lowercase for pattern matching
  const currentModel = actualModel.toLowerCase()

  // Check if current model supports configurable reasoning depth
  const modelSupportsDepth = REASONING_DEPTH_MODELS.some(pattern =>
    currentModel.includes(pattern)
  )

  const handleDepthChange = (depth: ReasoningDepth) => {
    updateSettings({ reasoningDepth: depth })
  }

  // Only show dropdown for models with configurable depth (Gemini 3, o1/o3, GPT-5)
  // Grok and DeepSeek always have reasoning enabled in the API - no toggle needed
  if (!modelSupportsDepth) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          className={cn(
            "h-7 md:h-8 px-2 md:px-3 rounded-md border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs",
            currentConfig.color
          )}
        >
          <Brain className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
          <span className="font-medium">
            {compact ? currentConfig.shortName : currentConfig.name}
          </span>
          <CaretDown className="h-3 w-3 ml-1 opacity-60" />
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
