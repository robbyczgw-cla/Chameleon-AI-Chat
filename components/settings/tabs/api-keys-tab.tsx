"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ApiKeysTabProps } from "../types"

export function ApiKeysTab({ localSettings, setLocalSettings }: ApiKeysTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="openrouter-key" className="text-sm sm:text-base">
          OpenRouter API Key
        </Label>
        <Input
          id="openrouter-key"
          type="password"
          placeholder="sk-or-v1-..."
          value={localSettings.apiKeys?.openRouter || ""}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              apiKeys: { ...localSettings.apiKeys, openRouter: e.target.value },
            })
          }
          className="text-sm sm:text-base min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          Get your API key from{" "}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">
            openrouter.ai/keys
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="openai-key" className="text-sm sm:text-base">
          OpenAI API Key (für Whisper Voice Input)
        </Label>
        <Input
          id="openai-key"
          type="password"
          placeholder="sk-..."
          value={localSettings.apiKeys?.openAI || ""}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              apiKeys: { ...localSettings.apiKeys, openAI: e.target.value },
            })
          }
          className="text-sm sm:text-base min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          Für Spracheingabe via Whisper API. Key von{" "}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
            platform.openai.com/api-keys
          </a> ($0.006/Minute)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tavily-key" className="text-sm sm:text-base">
          Tavily API Key (for web search)
        </Label>
        <Input
          id="tavily-key"
          type="password"
          placeholder="tvly-..."
          value={localSettings.apiKeys?.tavily || ""}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              apiKeys: { ...localSettings.apiKeys, tavily: e.target.value },
            })
          }
          className="text-sm sm:text-base min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          Get your API key from{" "}
          <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="underline">
            tavily.com
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="serper-key" className="text-sm sm:text-base">
          Serper API Key (Google Search - optional)
        </Label>
        <Input
          id="serper-key"
          type="password"
          placeholder="..."
          value={localSettings.apiKeys?.serper || ""}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              apiKeys: { ...localSettings.apiKeys, serper: e.target.value },
            })
          }
          className="text-sm sm:text-base min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          Optional: Get your API key from{" "}
          <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="underline">
            serper.dev
          </a>{" "}
          (10x cheaper, better DACH results)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exa-key" className="text-sm sm:text-base">
          🔮 Exa API Key (Neural/Semantic Search)
        </Label>
        <Input
          id="exa-key"
          type="password"
          placeholder="exa-..."
          value={localSettings.apiKeys?.exa || ""}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              apiKeys: { ...localSettings.apiKeys, exa: e.target.value },
            })
          }
          className="text-sm sm:text-base min-h-[44px]"
        />
        <p className="text-xs text-muted-foreground">
          Optional: Get your API key from{" "}
          <a href="https://exa.ai" target="_blank" rel="noopener noreferrer" className="underline">
            exa.ai
          </a>{" "}
          - Best for RAG, semantic search & research (~$0.01/search)
        </p>
      </div>
    </div>
  )
}
