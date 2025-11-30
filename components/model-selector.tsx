"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Sparkles } from "lucide-react"
import { POPULAR_OPENROUTER_MODELS } from "@/lib/openrouter"
import { getUserSelectedModels } from "@/lib/model-preferences"

export function ModelSelector() {
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
      console.log("[ModelSelector] Model preferences changed, reloading...")
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
    if (!modelId) return "Unknown Model"
    const model = availableModels.find((m) => m.id === modelId)
    return model?.name || modelId
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Sparkles className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{getModelDisplay(currentModel)}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px] max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Cloud Models</span>
          <Sparkles className="h-4 w-4" />
        </DropdownMenuLabel>
        {availableModels.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleModelChange(model.id)}
            className={currentModel === model.id ? "bg-accent" : ""}
          >
            <div className="flex flex-col gap-1">
              <div className="font-medium">{model.name}</div>
              <div className="text-xs text-muted-foreground">{model.provider}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
