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
} from "@/components/ui/dropdown-menu"
import { Bot, ChevronDown, Check } from "lucide-react"
import { POPULAR_OPENROUTER_MODELS } from "@/lib/openrouter"
import { getUserSelectedModels } from "@/lib/model-preferences"
import { getModelDescription, getModelCategory } from "@/lib/model-descriptions"
import { cn } from "@/lib/utils"

export function QuickModelPicker() {
  const { settings, updateSettings, currentChatId, chats, updateChat } = useApp()
  const [availableModels, setAvailableModels] = useState(POPULAR_OPENROUTER_MODELS)

  const currentChat = chats.find((c) => c.id === currentChatId)
  const currentModel = currentChat?.model || settings.selectedModel

  // Load user's selected models from localStorage
  const loadModels = () => {
    const userModels = getUserSelectedModels()

    if (userModels.length > 0) {
      // Map IDs to model objects
      const modelObjects = userModels.map((id) => {
        // Try to find in POPULAR_OPENROUTER_MODELS first (has nice names)
        const popular = POPULAR_OPENROUTER_MODELS.find((m) => m.id === id)
        if (popular) return popular

        // Fallback to basic object
        return {
          id,
          name: id.split("/")[1] || id,
          provider: id.split("/")[0] || "Unknown",
          category: "custom",
        }
      })

      setAvailableModels(modelObjects)
    } else {
      // Fallback to POPULAR_OPENROUTER_MODELS
      setAvailableModels(POPULAR_OPENROUTER_MODELS)
    }
  }

  useEffect(() => {
    loadModels()

    // Listen for changes
    const handleModelPreferencesChanged = () => {
      console.log("[QuickModelPicker] Model preferences changed, reloading...")
      loadModels()
    }

    window.addEventListener("modelPreferencesChanged", handleModelPreferencesChanged)

    return () => {
      window.removeEventListener("modelPreferencesChanged", handleModelPreferencesChanged)
    }
  }, [])

  const handleModelChange = (modelId: string) => {
    if (currentChatId) {
      updateChat(currentChatId, { model: modelId })
    } else {
      updateSettings({ selectedModel: modelId })
    }
  }

  const getModelDisplay = (modelId: string) => {
    if (!modelId) return "Modell wählen"
    const model = availableModels.find((m) => m.id === modelId)
    return model?.name || modelId.split("/")[1] || modelId
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 md:h-9 px-3 md:px-4 rounded-lg border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all hover:shadow-md"
        >
          <Bot className="h-4 w-4 mr-2 text-primary" />
          <span className="font-medium max-w-[120px] md:max-w-[160px] truncate">
            {getModelDisplay(currentModel)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 ml-1.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[320px] md:w-[380px] max-h-[400px] overflow-y-auto"
      >
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Schnellauswahl Modell
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableModels.slice(0, 15).map((model) => {
          const isSelected = model.id === currentModel
          const description = getModelDescription(model.id)
          const category = getModelCategory(model.id)

          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              className={cn(
                "flex flex-col items-start gap-1 py-2.5 cursor-pointer transition-colors",
                isSelected && "bg-primary/10"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  <span className={cn(
                    "font-medium text-sm truncate",
                    isSelected && "text-primary"
                  )}>
                    {model.name}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium shrink-0">
                  {category}
                </span>
              </div>
              <span className="text-xs text-muted-foreground/80 leading-tight pl-5">
                {description}
              </span>
            </DropdownMenuItem>
          )
        })}
        {availableModels.length > 15 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-xs text-muted-foreground/60 justify-center">
              +{availableModels.length - 15} weitere Modelle in Einstellungen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
