"use client"

import { memo } from "react"
import { Loader2, Search, Brain, MessageSquare, CheckCircle2, Sparkles, Globe, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

export type StreamingPhase = "idle" | "thinking" | "searching" | "tool_use" | "responding" | "done"

interface Step {
  id: string
  type: StreamingPhase
  label: string
  labelActive: string
  status: "active" | "completed" | "pending"
  icon: React.ReactNode
  detail?: string
}

export interface MessageStatusProps {
  currentPhase: StreamingPhase
  currentTool?: string
  searchQuery?: string
  reasoningVisible?: boolean
  language?: "en" | "de" | "es"
}

// Tool name translations
const toolLabels: Record<string, Record<string, string>> = {
  web_search: { en: "Web Search", de: "Websuche", es: "Búsqueda web" },
  calculator: { en: "Calculator", de: "Taschenrechner", es: "Calculadora" },
  code_interpreter: { en: "Code Interpreter", de: "Code-Interpreter", es: "Intérprete de código" },
  image_generation: { en: "Image Generation", de: "Bildgenerierung", es: "Generación de imágenes" },
}

function getToolLabel(toolName: string, language: string = "en"): string {
  return toolLabels[toolName]?.[language] || toolName.replace(/_/g, " ")
}

// Phase labels for different languages
const phaseLabels = {
  thinking: { en: "Thinking", de: "Denkt nach", es: "Pensando" },
  thinkingActive: { en: "Analyzing your request...", de: "Analysiere deine Anfrage...", es: "Analizando tu solicitud..." },
  searching: { en: "Searching", de: "Sucht", es: "Buscando" },
  searchingActive: { en: "Searching the web...", de: "Suche im Web...", es: "Buscando en la web..." },
  tool_use: { en: "Using Tool", de: "Verwendet Tool", es: "Usando herramienta" },
  tool_useActive: { en: "Processing...", de: "Verarbeite...", es: "Procesando..." },
  responding: { en: "Responding", de: "Antwortet", es: "Respondiendo" },
  respondingActive: { en: "Writing response...", de: "Schreibe Antwort...", es: "Escribiendo respuesta..." },
}

export const MessageStatus = memo(function MessageStatus({
  currentPhase,
  currentTool,
  searchQuery,
  reasoningVisible = false,
  language = "en",
}: MessageStatusProps) {
  // Don't render if idle or done
  if (currentPhase === "idle" || currentPhase === "done") {
    return null
  }

  const getStepStatus = (stepPhase: StreamingPhase): "active" | "completed" | "pending" => {
    const phaseOrder: StreamingPhase[] = ["thinking", "searching", "tool_use", "responding"]
    const currentIndex = phaseOrder.indexOf(currentPhase)
    const stepIndex = phaseOrder.indexOf(stepPhase)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "active"
    return "pending"
  }

  // Build dynamic steps based on what's happening
  const steps: Step[] = []

  // Always show thinking step
  steps.push({
    id: "thinking",
    type: "thinking",
    label: phaseLabels.thinking[language],
    labelActive: phaseLabels.thinkingActive[language],
    status: getStepStatus("thinking"),
    icon: <Brain className="w-4 h-4" />,
    detail: reasoningVisible ? (language === "de" ? "Extended Thinking aktiv" : "Extended thinking active") : undefined,
  })

  // Show searching step if we're searching or have searched
  if (currentPhase === "searching" || searchQuery) {
    steps.push({
      id: "searching",
      type: "searching",
      label: phaseLabels.searching[language],
      labelActive: phaseLabels.searchingActive[language],
      status: getStepStatus("searching"),
      icon: <Globe className="w-4 h-4" />,
      detail: searchQuery ? `"${searchQuery.slice(0, 40)}${searchQuery.length > 40 ? "..." : ""}"` : undefined,
    })
  }

  // Show tool use step if a tool is being used
  if (currentTool && currentTool !== "web_search") {
    steps.push({
      id: "tool_use",
      type: "tool_use",
      label: getToolLabel(currentTool, language),
      labelActive: phaseLabels.tool_useActive[language],
      status: getStepStatus("tool_use"),
      icon: <Wrench className="w-4 h-4" />,
    })
  }

  // Always show responding step
  steps.push({
    id: "responding",
    type: "responding",
    label: phaseLabels.responding[language],
    labelActive: phaseLabels.respondingActive[language],
    status: getStepStatus("responding"),
    icon: <MessageSquare className="w-4 h-4" />,
  })

  return (
    <div className="space-y-1.5 py-2">
      {steps.map((step, idx) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
            step.status === "active" && "bg-primary/10 border border-primary/20",
            step.status === "completed" && "opacity-60",
            step.status === "pending" && "opacity-40"
          )}
        >
          {/* Icon with status indicator */}
          <div className="relative flex-shrink-0">
            {step.status === "active" ? (
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                <div className="relative p-1.5 rounded-full bg-primary/20 text-primary">
                  {step.icon}
                </div>
              </div>
            ) : step.status === "completed" ? (
              <div className="p-1.5 rounded-full bg-green-500/20 text-green-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1.5 rounded-full bg-muted text-muted-foreground">
                {step.icon}
              </div>
            )}
          </div>

          {/* Label and detail */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium truncate",
                  step.status === "active" && "text-primary",
                  step.status === "completed" && "text-muted-foreground",
                  step.status === "pending" && "text-muted-foreground/60"
                )}
              >
                {step.status === "active" ? step.labelActive : step.label}
              </span>
              {step.status === "active" && (
                <Loader2 className="w-3 h-3 animate-spin text-primary flex-shrink-0" />
              )}
            </div>
            {step.detail && step.status === "active" && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {step.detail}
              </p>
            )}
          </div>

          {/* Step number / completion check */}
          <div className="flex-shrink-0 text-xs text-muted-foreground tabular-nums">
            {step.status === "completed" ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="opacity-50">{idx + 1}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})

/**
 * Compact inline status for showing in the chat bubble
 */
export const MessageStatusInline = memo(function MessageStatusInline({
  currentPhase,
  currentTool,
  searchQuery,
  language = "en",
}: Omit<MessageStatusProps, "reasoningVisible">) {
  if (currentPhase === "idle" || currentPhase === "done") {
    return null
  }

  const getPhaseInfo = () => {
    switch (currentPhase) {
      case "thinking":
        return {
          icon: <Brain className="w-3.5 h-3.5" />,
          label: phaseLabels.thinking[language],
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
        }
      case "searching":
        return {
          icon: <Globe className="w-3.5 h-3.5" />,
          label: searchQuery
            ? `${phaseLabels.searching[language]}: "${searchQuery.slice(0, 25)}${searchQuery.length > 25 ? "..." : ""}"`
            : phaseLabels.searchingActive[language],
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        }
      case "tool_use":
        return {
          icon: <Wrench className="w-3.5 h-3.5" />,
          label: currentTool ? getToolLabel(currentTool, language) : phaseLabels.tool_use[language],
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
        }
      case "responding":
        return {
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          label: phaseLabels.respondingActive[language],
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        }
      default:
        return null
    }
  }

  const info = getPhaseInfo()
  if (!info) return null

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
        info.bgColor,
        info.color
      )}
    >
      <span className="animate-pulse">{info.icon}</span>
      <span>{info.label}</span>
      <Loader2 className="w-3 h-3 animate-spin" />
    </div>
  )
})
