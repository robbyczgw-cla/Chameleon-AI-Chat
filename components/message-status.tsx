"use client"

import { memo, useState, useEffect } from "react"
import {
  Loader2, Brain, MessageSquare, CheckCircle2, Globe, Wrench,
  Zap, Cpu, Network, FileSearch, Sparkles, Clock, ChevronDown, ChevronRight,
  Activity, BarChart3, Lightbulb
} from "lucide-react"
import { cn } from "@/lib/utils"

export type StreamingPhase = "idle" | "thinking" | "searching" | "tool_use" | "responding" | "done"

interface Step {
  id: string
  type: StreamingPhase
  label: string
  labelActive: string
  description?: string
  status: "active" | "completed" | "pending"
  icon: React.ReactNode
  detail?: string
  subSteps?: string[]
}

export interface MessageStatusProps {
  currentPhase: StreamingPhase
  currentTool?: string
  searchQuery?: string
  reasoningVisible?: boolean
  language?: "en" | "de" | "es"
  verbose?: boolean // Enable verbose mode for advanced users
  modelName?: string
}

// Tool name translations with descriptions
const toolLabels: Record<string, Record<string, { name: string; desc: string }>> = {
  web_search: {
    en: { name: "Web Search", desc: "Querying search engines for real-time information" },
    de: { name: "Websuche", desc: "Abfrage von Suchmaschinen für aktuelle Informationen" },
    es: { name: "Búsqueda web", desc: "Consultando motores de búsqueda para información en tiempo real" }
  },
  calculator: {
    en: { name: "Calculator", desc: "Performing mathematical calculations" },
    de: { name: "Taschenrechner", desc: "Mathematische Berechnungen durchführen" },
    es: { name: "Calculadora", desc: "Realizando cálculos matemáticos" }
  },
  code_interpreter: {
    en: { name: "Code Interpreter", desc: "Executing and analyzing code" },
    de: { name: "Code-Interpreter", desc: "Code ausführen und analysieren" },
    es: { name: "Intérprete de código", desc: "Ejecutando y analizando código" }
  },
}

function getToolInfo(toolName: string, language: string = "en"): { name: string; desc: string } {
  return toolLabels[toolName]?.[language] || {
    name: toolName.replace(/_/g, " "),
    desc: `Using ${toolName.replace(/_/g, " ")}`
  }
}

// Detailed phase information
const phaseInfo = {
  thinking: {
    en: {
      label: "Thinking",
      labelActive: "Processing request...",
      description: "Analyzing context and formulating response strategy",
      subSteps: ["Parsing input", "Analyzing context", "Planning response"]
    },
    de: {
      label: "Denkprozess",
      labelActive: "Verarbeite Anfrage...",
      description: "Analysiere Kontext und formuliere Antwortstrategie",
      subSteps: ["Eingabe parsen", "Kontext analysieren", "Antwort planen"]
    },
    es: {
      label: "Pensando",
      labelActive: "Procesando solicitud...",
      description: "Analizando contexto y formulando estrategia de respuesta",
      subSteps: ["Analizando entrada", "Analizando contexto", "Planificando respuesta"]
    }
  },
  searching: {
    en: {
      label: "Web Search",
      labelActive: "Searching the web...",
      description: "Retrieving real-time information from the internet",
      subSteps: ["Formulating query", "Searching sources", "Processing results"]
    },
    de: {
      label: "Websuche",
      labelActive: "Suche im Web...",
      description: "Abrufen von Echtzeitinformationen aus dem Internet",
      subSteps: ["Query formulieren", "Quellen durchsuchen", "Ergebnisse verarbeiten"]
    },
    es: {
      label: "Búsqueda web",
      labelActive: "Buscando en la web...",
      description: "Recuperando información en tiempo real de internet",
      subSteps: ["Formulando consulta", "Buscando fuentes", "Procesando resultados"]
    }
  },
  tool_use: {
    en: {
      label: "Tool Execution",
      labelActive: "Using tool...",
      description: "Executing external tool to enhance response",
      subSteps: ["Preparing parameters", "Executing tool", "Processing output"]
    },
    de: {
      label: "Tool-Ausführung",
      labelActive: "Verwende Tool...",
      description: "Externes Tool zur Antwortverbesserung ausführen",
      subSteps: ["Parameter vorbereiten", "Tool ausführen", "Ausgabe verarbeiten"]
    },
    es: {
      label: "Ejecución de herramienta",
      labelActive: "Usando herramienta...",
      description: "Ejecutando herramienta externa para mejorar respuesta",
      subSteps: ["Preparando parámetros", "Ejecutando herramienta", "Procesando salida"]
    }
  },
  responding: {
    en: {
      label: "Generating Response",
      labelActive: "Writing response...",
      description: "Generating and streaming the final response",
      subSteps: ["Structuring content", "Generating text", "Streaming output"]
    },
    de: {
      label: "Antwort generieren",
      labelActive: "Schreibe Antwort...",
      description: "Generiere und streame die finale Antwort",
      subSteps: ["Inhalt strukturieren", "Text generieren", "Ausgabe streamen"]
    },
    es: {
      label: "Generando respuesta",
      labelActive: "Escribiendo respuesta...",
      description: "Generando y transmitiendo la respuesta final",
      subSteps: ["Estructurando contenido", "Generando texto", "Transmitiendo salida"]
    }
  }
}

// Elapsed time hook
function useElapsedTime(isActive: boolean) {
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(() => isActive ? Date.now() : null)

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startTime || Date.now())) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, startTime])

  return elapsed
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

/**
 * Verbose MessageStatus component for advanced mode
 * Shows detailed step-by-step progress with sub-steps and timing
 */
export const MessageStatusVerbose = memo(function MessageStatusVerbose({
  currentPhase,
  currentTool,
  searchQuery,
  reasoningVisible = false,
  language = "en",
  modelName,
}: MessageStatusProps) {
  const elapsed = useElapsedTime(currentPhase !== "idle" && currentPhase !== "done")
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(["thinking"]))

  // Don't render if idle or done
  if (currentPhase === "idle" || currentPhase === "done") {
    return null
  }

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const getStepStatus = (stepPhase: StreamingPhase): "active" | "completed" | "pending" => {
    const phaseOrder: StreamingPhase[] = ["thinking", "searching", "tool_use", "responding"]
    const currentIndex = phaseOrder.indexOf(currentPhase)
    const stepIndex = phaseOrder.indexOf(stepPhase)

    if (stepIndex < currentIndex) return "completed"
    if (stepIndex === currentIndex) return "active"
    return "pending"
  }

  // Build steps
  const steps: Step[] = []
  const lang = language as "en" | "de" | "es"

  // Thinking step
  const thinkingInfo = phaseInfo.thinking[lang]
  steps.push({
    id: "thinking",
    type: "thinking",
    label: thinkingInfo.label,
    labelActive: thinkingInfo.labelActive,
    description: thinkingInfo.description,
    status: getStepStatus("thinking"),
    icon: <Brain className="w-4 h-4" />,
    detail: reasoningVisible
      ? (lang === "de" ? "Extended Thinking aktiviert" : lang === "es" ? "Pensamiento extendido activo" : "Extended thinking enabled")
      : undefined,
    subSteps: thinkingInfo.subSteps,
  })

  // Searching step (if applicable)
  if (currentPhase === "searching" || searchQuery) {
    const searchInfo = phaseInfo.searching[lang]
    steps.push({
      id: "searching",
      type: "searching",
      label: searchInfo.label,
      labelActive: searchInfo.labelActive,
      description: searchInfo.description,
      status: getStepStatus("searching"),
      icon: <Globe className="w-4 h-4" />,
      detail: searchQuery || undefined,
      subSteps: searchInfo.subSteps,
    })
  }

  // Tool use step (if applicable)
  if (currentTool && currentTool !== "web_search") {
    const toolInfo = getToolInfo(currentTool, lang)
    const toolPhaseInfo = phaseInfo.tool_use[lang]
    steps.push({
      id: "tool_use",
      type: "tool_use",
      label: toolInfo.name,
      labelActive: toolInfo.desc,
      description: toolPhaseInfo.description,
      status: getStepStatus("tool_use"),
      icon: <Wrench className="w-4 h-4" />,
      subSteps: toolPhaseInfo.subSteps,
    })
  }

  // Responding step
  const respondingInfo = phaseInfo.responding[lang]
  steps.push({
    id: "responding",
    type: "responding",
    label: respondingInfo.label,
    labelActive: respondingInfo.labelActive,
    description: respondingInfo.description,
    status: getStepStatus("responding"),
    icon: <MessageSquare className="w-4 h-4" />,
    subSteps: respondingInfo.subSteps,
  })

  return (
    <div className="space-y-3">
      {/* Header with model info and timer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/30 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-medium">{modelName || "AI Model"}</span>
          <span className="text-muted-foreground/60">•</span>
          <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
          <span className="text-green-500">Processing</span>
        </div>
        <div className="flex items-center gap-1.5 tabular-nums">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isExpanded = expandedSteps.has(step.id)
          const isActive = step.status === "active"
          const isCompleted = step.status === "completed"

          return (
            <div
              key={step.id}
              className={cn(
                "rounded-lg border transition-all duration-300",
                isActive && "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10",
                isCompleted && "border-green-500/20 bg-green-500/5",
                step.status === "pending" && "border-border/30 bg-muted/20 opacity-50"
              )}
            >
              {/* Step header */}
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                {/* Expand/collapse icon */}
                <div className="flex-shrink-0 text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>

                {/* Status icon */}
                <div className="relative flex-shrink-0">
                  {isActive ? (
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                      <div className="relative p-2 rounded-full bg-primary/20 text-primary">
                        {step.icon}
                      </div>
                    </div>
                  ) : isCompleted ? (
                    <div className="p-2 rounded-full bg-green-500/20 text-green-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-muted text-muted-foreground">
                      {step.icon}
                    </div>
                  )}
                </div>

                {/* Label and description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-green-600 dark:text-green-400",
                      step.status === "pending" && "text-muted-foreground"
                    )}>
                      {isActive ? step.labelActive : step.label}
                    </span>
                    {isActive && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>

                {/* Step number */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {isCompleted ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 ml-11 space-y-2">
                  {/* Search query display */}
                  {step.detail && step.type === "searching" && (
                    <div className="flex items-start gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <FileSearch className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {lang === "de" ? "Suchanfrage" : lang === "es" ? "Consulta de búsqueda" : "Search Query"}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                          "{step.detail}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Extended thinking indicator */}
                  {step.detail && step.type === "thinking" && reasoningVisible && (
                    <div className="flex items-start gap-2 p-2 rounded-md bg-purple-500/10 border border-purple-500/20">
                      <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400">
                          {lang === "de" ? "Erweitertes Denken" : lang === "es" ? "Pensamiento extendido" : "Extended Thinking"}
                        </p>
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-0.5">
                          {lang === "de"
                            ? "Das Modell verwendet erweitertes Reasoning für komplexe Aufgaben"
                            : lang === "es"
                            ? "El modelo utiliza razonamiento extendido para tareas complejas"
                            : "Model is using extended reasoning for complex tasks"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sub-steps */}
                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {step.subSteps.map((subStep, subIdx) => {
                        // Determine sub-step status based on main step status
                        let subStatus: "active" | "completed" | "pending" = "pending"
                        if (isCompleted) {
                          subStatus = "completed"
                        } else if (isActive) {
                          // Simulate progress through sub-steps
                          const progress = Math.floor((elapsed % 6) / 2) // Cycle through every 2 seconds
                          if (subIdx < progress) subStatus = "completed"
                          else if (subIdx === progress) subStatus = "active"
                        }

                        return (
                          <div
                            key={subIdx}
                            className={cn(
                              "flex items-center gap-2 text-xs py-1 px-2 rounded",
                              subStatus === "active" && "bg-primary/10 text-primary",
                              subStatus === "completed" && "text-green-600 dark:text-green-400",
                              subStatus === "pending" && "text-muted-foreground/60"
                            )}
                          >
                            {subStatus === "completed" ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : subStatus === "active" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-current" />
                            )}
                            <span>{subStep}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 pt-2 border-t border-border/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>{lang === "de" ? "Fortschritt" : lang === "es" ? "Progreso" : "Progress"}</span>
          <span>{Math.round((steps.filter(s => s.status === "completed").length / steps.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
            style={{
              width: `${(steps.filter(s => s.status === "completed").length / steps.length) * 100 +
                (steps.some(s => s.status === "active") ? (100 / steps.length) * 0.5 : 0)}%`
            }}
          />
        </div>
      </div>
    </div>
  )
})

/**
 * Simple MessageStatus component for basic mode
 */
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

  const lang = language as "en" | "de" | "es"
  const steps: Step[] = []

  // Thinking
  steps.push({
    id: "thinking",
    type: "thinking",
    label: phaseInfo.thinking[lang].label,
    labelActive: phaseInfo.thinking[lang].labelActive,
    status: getStepStatus("thinking"),
    icon: <Brain className="w-4 h-4" />,
  })

  // Searching (if applicable)
  if (currentPhase === "searching" || searchQuery) {
    steps.push({
      id: "searching",
      type: "searching",
      label: phaseInfo.searching[lang].label,
      labelActive: phaseInfo.searching[lang].labelActive,
      status: getStepStatus("searching"),
      icon: <Globe className="w-4 h-4" />,
      detail: searchQuery ? `"${searchQuery.slice(0, 30)}..."` : undefined,
    })
  }

  // Responding
  steps.push({
    id: "responding",
    type: "responding",
    label: phaseInfo.responding[lang].label,
    labelActive: phaseInfo.responding[lang].labelActive,
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium truncate",
                step.status === "active" && "text-primary",
                step.status === "completed" && "text-muted-foreground",
                step.status === "pending" && "text-muted-foreground/60"
              )}>
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
 * Streaming History Display for completed messages
 * Shows the history of phases the AI went through to generate the response
 */
import type { StreamingHistoryEntry } from "@/types"

export interface StreamingHistoryDisplayProps {
  history: StreamingHistoryEntry[]
  language?: "en" | "de" | "es"
  collapsed?: boolean
  onToggle?: () => void
}

export const StreamingHistoryDisplay = memo(function StreamingHistoryDisplay({
  history,
  language = "en",
  collapsed = true,
  onToggle,
}: StreamingHistoryDisplayProps) {
  if (!history || history.length === 0) return null

  const lang = language as "en" | "de" | "es"

  // Calculate total duration
  const totalDuration = history.reduce((sum, entry) => sum + (entry.duration || 0), 0)

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const seconds = ms / 1000
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const getPhaseIcon = (phase: StreamingHistoryEntry["phase"]) => {
    switch (phase) {
      case "thinking": return <Brain className="w-3 h-3" />
      case "searching": return <Globe className="w-3 h-3" />
      case "tool_use": return <Wrench className="w-3 h-3" />
      case "responding": return <MessageSquare className="w-3 h-3" />
      case "done": return <CheckCircle2 className="w-3 h-3" />
      default: return <Zap className="w-3 h-3" />
    }
  }

  const getPhaseLabel = (phase: StreamingHistoryEntry["phase"]) => {
    const labels: Record<StreamingHistoryEntry["phase"], Record<string, string>> = {
      thinking: { en: "Thinking", de: "Denken", es: "Pensando" },
      searching: { en: "Searching", de: "Suchen", es: "Buscando" },
      tool_use: { en: "Tool", de: "Tool", es: "Herramienta" },
      responding: { en: "Responding", de: "Antworten", es: "Respondiendo" },
      done: { en: "Done", de: "Fertig", es: "Listo" },
    }
    return labels[phase]?.[lang] || phase
  }

  const getPhaseColor = (phase: StreamingHistoryEntry["phase"]) => {
    switch (phase) {
      case "thinking": return "text-purple-500 bg-purple-500/10"
      case "searching": return "text-blue-500 bg-blue-500/10"
      case "tool_use": return "text-orange-500 bg-orange-500/10"
      case "responding": return "text-green-500 bg-green-500/10"
      case "done": return "text-emerald-500 bg-emerald-500/10"
      default: return "text-muted-foreground bg-muted/10"
    }
  }

  // Summary text
  const summaryText = {
    en: `Generated in ${formatDuration(totalDuration)} (${history.length} steps)`,
    de: `Generiert in ${formatDuration(totalDuration)} (${history.length} Schritte)`,
    es: `Generado en ${formatDuration(totalDuration)} (${history.length} pasos)`,
  }

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden text-xs bg-muted/20">
      {/* Collapsible header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <BarChart3 className="w-3.5 h-3.5" />
        </div>
        <span className="text-muted-foreground font-medium">
          {summaryText[lang]}
        </span>
        {/* Mini phase badges in collapsed view */}
        {collapsed && (
          <div className="flex items-center gap-1 ml-auto">
            {history.filter(h => h.phase !== "done").slice(0, 4).map((entry, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-1 rounded-full",
                  getPhaseColor(entry.phase)
                )}
                title={getPhaseLabel(entry.phase)}
              >
                {getPhaseIcon(entry.phase)}
              </div>
            ))}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {!collapsed && (
        <div className="border-t border-border/30 px-3 py-2 space-y-1.5">
          {history.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2"
            >
              {/* Phase icon */}
              <div className={cn(
                "p-1.5 rounded-full flex-shrink-0",
                getPhaseColor(entry.phase)
              )}>
                {getPhaseIcon(entry.phase)}
              </div>

              {/* Phase info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getPhaseLabel(entry.phase)}</span>
                  {entry.detail && (
                    <span className="text-muted-foreground truncate">
                      {entry.phase === "searching" ? `"${entry.detail}"` : entry.detail}
                    </span>
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="text-muted-foreground tabular-nums flex-shrink-0">
                {entry.duration ? formatDuration(entry.duration) : "—"}
              </div>
            </div>
          ))}

          {/* Total time bar */}
          <div className="pt-2 mt-2 border-t border-border/20">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span>{lang === "de" ? "Gesamtzeit" : lang === "es" ? "Tiempo total" : "Total time"}</span>
              <span className="font-medium">{formatDuration(totalDuration)}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
              {history.filter(h => h.duration && h.duration > 0).map((entry, idx) => {
                const widthPercent = ((entry.duration || 0) / totalDuration) * 100
                return (
                  <div
                    key={idx}
                    className={cn(
                      "h-full",
                      entry.phase === "thinking" && "bg-purple-500",
                      entry.phase === "searching" && "bg-blue-500",
                      entry.phase === "tool_use" && "bg-orange-500",
                      entry.phase === "responding" && "bg-green-500",
                      entry.phase === "done" && "bg-emerald-500",
                    )}
                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                    title={`${getPhaseLabel(entry.phase)}: ${formatDuration(entry.duration || 0)}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

/**
 * Compact inline status badge
 */
export const MessageStatusInline = memo(function MessageStatusInline({
  currentPhase,
  currentTool,
  searchQuery,
  language = "en",
}: Omit<MessageStatusProps, "reasoningVisible" | "verbose" | "modelName">) {
  if (currentPhase === "idle" || currentPhase === "done") {
    return null
  }

  const lang = language as "en" | "de" | "es"

  const getPhaseInfo = () => {
    switch (currentPhase) {
      case "thinking":
        return {
          icon: <Brain className="w-3.5 h-3.5" />,
          label: phaseInfo.thinking[lang].label,
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
        }
      case "searching":
        return {
          icon: <Globe className="w-3.5 h-3.5" />,
          label: searchQuery
            ? `${phaseInfo.searching[lang].label}: "${searchQuery.slice(0, 20)}..."`
            : phaseInfo.searching[lang].labelActive,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        }
      case "tool_use":
        return {
          icon: <Wrench className="w-3.5 h-3.5" />,
          label: currentTool ? getToolInfo(currentTool, lang).name : phaseInfo.tool_use[lang].label,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
        }
      case "responding":
        return {
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          label: phaseInfo.responding[lang].labelActive,
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
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
      info.bgColor,
      info.color
    )}>
      <span className="animate-pulse">{info.icon}</span>
      <span>{info.label}</span>
      <Loader2 className="w-3 h-3 animate-spin" />
    </div>
  )
})
