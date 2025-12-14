"use client"

import { memo, useState, useEffect } from "react"
import {
  Loader2, Brain, MessageSquare, CheckCircle2, Globe, Wrench,
  Zap, Cpu, Network, FileSearch, Sparkles, Clock, ChevronDown, ChevronRight,
  Activity, BarChart3, Lightbulb, Link, Youtube
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { SearchResultsCard } from "./search-results-card"

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
  // Enhanced streaming details (for advanced mode)
  streamingDetails?: {
    phase?: string
    toolName?: string
    toolArguments?: Record<string, any>
    searchProvider?: string
    searchParameters?: Record<string, any>
    searchQuery?: string  // The actual search query being executed
    action?: string
    resultCount?: number
    resultSummary?: string
    searchResultsPreview?: string
    searchResults?: any[] // Full search results array (SearchResult[] from search/types.ts)
    reasoningContent?: string
    reasoningTokens?: number
  }
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
 * By default: Shows only current action + reasoning tokens
 * With showDetailedStreaming: Shows full step-by-step progress
 */
export const MessageStatusVerbose = memo(({
  currentPhase,
  currentTool,
  searchQuery,
  reasoningVisible = false,
  language = "en",
  modelName,
  streamingDetails,
}: MessageStatusProps) => {
  const { settings } = useApp()
  const elapsed = useElapsedTime(currentPhase !== "idle" && currentPhase !== "done")
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(["thinking"]))

  // Check if detailed streaming mode is enabled
  const showDetailedStreaming = settings?.experimental?.showDetailedStreaming ?? false
  const enableAnimations = settings?.experimental?.enableAnimations !== false
  const lang = language as "en" | "de" | "es"

  // Auto-expand the current active step (only in detailed mode)
  useEffect(() => {
    if (showDetailedStreaming && currentPhase && currentPhase !== "idle" && currentPhase !== "done") {
      setExpandedSteps(prev => {
        const next = new Set(prev)
        next.add(currentPhase)
        return next
      })
    }
  }, [currentPhase, showDetailedStreaming])

  // Don't render if idle or done
  if (currentPhase === "idle" || currentPhase === "done") {
    return null
  }

  // ============================================
  // SIMPLE MODE (Default): Only action + reasoning
  // ============================================
  if (!showDetailedStreaming) {
    const toolName = streamingDetails?.toolName
    const toolArgs = streamingDetails?.toolArguments || {}
    const hasContent = searchQuery || streamingDetails?.searchQuery || streamingDetails?.action ||
                       streamingDetails?.reasoningContent || toolName

    if (!hasContent) {
      // IMPROVED: Show phase-based message instead of generic "Processing..."
      // This makes the UI more informative and less static-looking
      const phaseMessages = {
        thinking: {
          en: "Analyzing your message...",
          de: "Analysiere Nachricht...",
          es: "Analizando mensaje..."
        },
        searching: {
          en: "Preparing search...",
          de: "Suche wird vorbereitet...",
          es: "Preparando búsqueda..."
        },
        tool_use: {
          en: "Using tools...",
          de: "Werkzeuge werden verwendet...",
          es: "Usando herramientas..."
        },
        responding: {
          en: "Generating response...",
          de: "Antwort wird generiert...",
          es: "Generando respuesta..."
        }
      }
      const phaseText = phaseMessages[currentPhase]?.[lang] || phaseMessages.thinking[lang]

      // SIMPLE: Just a visually distinct box - NO animation, just solid colors
      // The colored background and border clearly show the AI is working
      return (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/20 border-2 border-amber-500/50 shadow-lg">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-foreground font-semibold">
            {phaseText}
          </span>
          <div className="flex gap-1.5 ml-auto">
            <div className="w-2 h-2 rounded-full bg-amber-500/80" />
            <div className="w-2 h-2 rounded-full bg-amber-500/60" />
            <div className="w-2 h-2 rounded-full bg-amber-500/40" />
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-1.5 sm:space-y-2">
        {/* Current Action Banner - What the AI is doing right now */}
        {(() => {
          // Web Search
          if (toolName === "web_search" || searchQuery || streamingDetails?.searchQuery) {
            const query = searchQuery || streamingDetails?.searchQuery || toolArgs.query
            if (query) {
              return (
                <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-blue-500/15 border border-blue-500/30">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 mr-1 sm:mr-2">
                      {lang === "de" ? "Suche:" : lang === "es" ? "Buscando:" : "Searching:"}
                    </span>
                    <span className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 break-words">"{query}"</span>
                  </div>
                </div>
              )
            }
          }

          // URL Fetch
          if (toolName === "url_fetch" && toolArgs.url) {
            return (
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-green-500/15 border border-green-500/30">
                <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] sm:text-xs font-medium text-green-600 dark:text-green-400 mr-1 sm:mr-2">
                    {lang === "de" ? "Lade URL:" : lang === "es" ? "Cargando:" : "Fetching:"}
                  </span>
                  <span className="text-xs sm:text-sm text-green-700 dark:text-green-300 break-all">{toolArgs.url}</span>
                </div>
              </div>
            )
          }

          // YouTube Transcript
          if (toolName === "youtube_transcript" && toolArgs.url) {
            return (
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-red-500/15 border border-red-500/30">
                <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] sm:text-xs font-medium text-red-600 dark:text-red-400 mr-1 sm:mr-2">YouTube:</span>
                  <span className="text-xs sm:text-sm text-red-700 dark:text-red-300 break-all">{toolArgs.url}</span>
                </div>
              </div>
            )
          }

          // Generic action
          if (streamingDetails?.action) {
            return (
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-primary/15 border border-primary/30">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0 animate-pulse" />
                <span className="text-xs sm:text-sm text-foreground break-words">{streamingDetails.action}</span>
              </div>
            )
          }

          return null
        })()}

        {/* Reasoning Content - Streaming thinking tokens */}
        {streamingDetails?.reasoningContent && (
          <div className="p-2 sm:p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-medium text-amber-600 dark:text-amber-400">
                {lang === "de" ? "Denkt nach..." : lang === "es" ? "Pensando..." : "Thinking..."}
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-foreground/80 font-mono max-h-28 sm:max-h-40 overflow-y-auto break-words whitespace-pre-wrap pl-4 sm:pl-6">
              {streamingDetails.reasoningContent}
            </div>
          </div>
        )}

        {/* Tool Result Preview - Show rich search results as they arrive (limited to 3 during streaming) */}
        {streamingDetails?.searchResults && streamingDetails.searchResults.length > 0 && (
          <SearchResultsCard
            results={streamingDetails.searchResults}
            provider={streamingDetails.searchProvider}
            query={streamingDetails.searchQuery}
            language={lang}
            maxResults={3}
            className="mt-2"
          />
        )}
      </div>
    )
  }

  // ============================================
  // DETAILED MODE: Full step-by-step visualization
  // ============================================
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

      {/* Current Activity Banner - Always visible summary */}
      {(searchQuery || streamingDetails?.searchQuery || streamingDetails?.action || streamingDetails?.reasoningContent || streamingDetails?.toolName) && (
        <div className="mb-3 space-y-2">
          {/* Tool-specific banners */}
          {(() => {
            const toolName = streamingDetails?.toolName
            const toolArgs = streamingDetails?.toolArguments || {}

            if (toolName === "web_search" || searchQuery || streamingDetails?.searchQuery) {
              const query = searchQuery || streamingDetails?.searchQuery || toolArgs.query
              if (query) {
                return (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/15 border border-blue-500/30">
                    <Globe className="w-4 h-4 text-blue-500 flex-shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mr-2">Web Search:</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300 break-words">"{query}"</span>
                    </div>
                    {streamingDetails?.searchProvider && (
                      <span className="text-xs text-blue-500/70 capitalize flex-shrink-0">via {streamingDetails.searchProvider}</span>
                    )}
                  </div>
                )
              }
            }

            if (toolName === "url_fetch" && toolArgs.url) {
              return (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/15 border border-green-500/30">
                  <Link className="w-4 h-4 text-green-500 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 mr-2">Fetching URL:</span>
                    <span className="text-sm text-green-700 dark:text-green-300 break-all">{toolArgs.url}</span>
                  </div>
                </div>
              )
            }

            if (toolName === "youtube_transcript" && toolArgs.url) {
              return (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30">
                  <Youtube className="w-4 h-4 text-red-500 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 mr-2">YouTube Transcript:</span>
                    <span className="text-sm text-red-700 dark:text-red-300 break-all">{toolArgs.url}</span>
                  </div>
                </div>
              )
            }

            return null
          })()}

          {/* Generic action */}
          {streamingDetails?.action && !searchQuery && !streamingDetails?.toolName && !streamingDetails.searchQuery && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/15 border border-primary/30">
              <Zap className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />
              <span className="text-sm text-foreground break-words">{streamingDetails.action}</span>
            </div>
          )}

          {/* Reasoning Content */}
          {streamingDetails?.reasoningContent && (
            <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Thinking...</span>
              </div>
              <div className="text-xs text-foreground/80 font-mono max-h-32 overflow-y-auto break-words whitespace-pre-wrap pl-6">
                {streamingDetails.reasoningContent}
              </div>
            </div>
          )}

          {/* Tool Result Preview - Show search results as they arrive (Detailed Mode) */}
          {streamingDetails?.searchResultsPreview && (
            <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <FileSearch className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs font-medium text-cyan-600 dark:text-cyan-400">
                  {lang === "de" ? "Suchergebnisse" : lang === "es" ? "Resultados" : "Results Preview"}
                </span>
                {streamingDetails.resultCount !== undefined && (
                  <span className="text-[10px] sm:text-xs text-cyan-500/70 ml-auto">
                    {streamingDetails.resultCount} {streamingDetails.resultCount === 1 ?
                      (lang === "de" ? "Ergebnis" : lang === "es" ? "resultado" : "result") :
                      (lang === "de" ? "Ergebnisse" : lang === "es" ? "resultados" : "results")}
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-foreground/80 max-h-28 sm:max-h-40 overflow-y-auto break-words whitespace-pre-wrap pl-4 sm:pl-6 font-mono bg-cyan-500/5 rounded p-1.5 sm:p-2">
                {streamingDetails.searchResultsPreview}
              </div>
            </div>
          )}
        </div>
      )}

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
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div className="flex-shrink-0 text-muted-foreground">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>

                <div className="relative flex-shrink-0">
                  {isActive ? (
                    <div className="relative">
                      {/* GPU-OPTIMIZED: Replaced animate-ping with subtle ring glow */}
                      <div className="absolute -inset-0.5 rounded-full bg-primary/20 ring-2 ring-primary/40" />
                      <div className="relative p-2 rounded-full bg-primary/20 text-primary">{step.icon}</div>
                    </div>
                  ) : isCompleted ? (
                    <div className="p-2 rounded-full bg-green-500/20 text-green-500"><CheckCircle2 className="w-4 h-4" /></div>
                  ) : (
                    <div className="p-2 rounded-full bg-muted text-muted-foreground">{step.icon}</div>
                  )}
                </div>

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
                    {isActive && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>

                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  {isCompleted ? <span className="text-green-500">✓</span> : <span className="text-muted-foreground">{idx + 1}</span>}
                </div>
              </button>

              {isExpanded && step.subSteps && (
                <div className="px-3 pb-3 pt-0 ml-11 space-y-1.5">
                  {step.subSteps.map((subStep, subIdx) => {
                    let subStatus: "active" | "completed" | "pending" = "pending"
                    if (isCompleted) subStatus = "completed"
                    else if (isActive) {
                      const progress = Math.floor((elapsed % 6) / 2)
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
export const MessageStatus = memo(({
  currentPhase,
  currentTool,
  searchQuery,
  reasoningVisible = false,
  language = "en",
}: MessageStatusProps) => {
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
                {/* GPU-OPTIMIZED: Replaced animate-ping with subtle ring glow */}
                <div className="absolute -inset-0.5 rounded-full bg-primary/20 ring-2 ring-primary/30" />
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

export const StreamingHistoryDisplay = memo(({
  history,
  language = "en",
  collapsed = true,
  onToggle,
}: StreamingHistoryDisplayProps) => {
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
    <div className="border border-border/30 rounded-lg overflow-hidden text-xs bg-muted/20 w-full max-w-full">
      {/* Collapsible header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 sm:px-3 py-2 hover:bg-muted/40 transition-colors overflow-hidden"
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
        <div className="border-t border-border/30 px-2 sm:px-3 py-2 space-y-1.5 overflow-hidden">
          {history.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 overflow-hidden"
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
                  {entry.toolName && (
                    <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                      {entry.toolName}
                    </span>
                  )}
                  {entry.searchProvider && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded capitalize">
                      {entry.searchProvider}
                    </span>
                  )}
                </div>
                {/* Enhanced action/description */}
                {(entry.action || entry.description) && (
                  <p className="text-muted-foreground text-[10px] mt-0.5 truncate">
                    {entry.action || entry.description}
                  </p>
                )}
                {/* Tool arguments summary */}
                {entry.toolArguments && Object.keys(entry.toolArguments).length > 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 truncate">
                    {Object.keys(entry.toolArguments).length} parameter{Object.keys(entry.toolArguments).length !== 1 ? 's' : ''}
                  </p>
                )}
                {/* Result count */}
                {entry.resultCount !== undefined && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    {entry.resultCount} result{entry.resultCount !== 1 ? 's' : ''}
                  </p>
                )}
                {/* Search Results - Rich Display */}
                {entry.searchResults && entry.searchResults.length > 0 && (
                  <div className="mt-2">
                    <SearchResultsCard
                      results={entry.searchResults}
                      provider={entry.searchProvider}
                      query={entry.searchQuery}
                      language={lang}
                    />
                  </div>
                )}
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
export const MessageStatusInline = memo(({
  currentPhase,
  currentTool,
  searchQuery,
  language = "en",
}: Omit<MessageStatusProps, "reasoningVisible" | "verbose" | "modelName">) => {
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
