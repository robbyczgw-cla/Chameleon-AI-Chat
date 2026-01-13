"use client"

import { memo } from "react"
import {
  CheckCircle,
  Circle,
  CircleNotch,
  Globe,
  Link,
  YoutubeLogo,
  CloudSun,
  XCircle,
  Lightning,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { AgentTask } from "@/types"

interface AgentTaskItemProps {
  task: AgentTask
  isActive: boolean
  index: number
  language?: "en" | "de" | "es"
}

/**
 * Get the appropriate icon for a tool
 */
function getToolIcon(toolUsed?: string) {
  switch (toolUsed) {
    case "web_search":
      return <Globe className="h-3 w-3" />
    case "url_fetch":
      return <Link className="h-3 w-3" />
    case "youtube_transcript":
      return <YoutubeLogo className="h-3 w-3" />
    case "get_weather":
      return <CloudSun className="h-3 w-3" />
    default:
      return <Lightning className="h-3 w-3" />
  }
}

/**
 * Get status-appropriate styling
 */
function getStatusStyles(status: AgentTask["status"], isActive: boolean) {
  if (status === "completed") {
    return {
      icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
      containerClass: "bg-emerald-500/10 border-emerald-500/30",
      textClass: "text-emerald-700 dark:text-emerald-400",
    }
  }

  if (status === "failed") {
    return {
      icon: <XCircle className="h-3.5 w-3.5 text-red-500" />,
      containerClass: "bg-red-500/10 border-red-500/30",
      textClass: "text-red-700 dark:text-red-400",
    }
  }

  if (status === "active" || isActive) {
    return {
      icon: <CircleNotch className="h-3.5 w-3.5 text-primary animate-spin" />,
      containerClass: "bg-primary/10 border-primary/40",
      textClass: "text-primary font-medium",
    }
  }

  // Pending
  return {
    icon: <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />,
    containerClass: "bg-muted/30 border-muted-foreground/20",
    textClass: "text-muted-foreground",
  }
}

/**
 * Format duration in a human-readable way
 */
function formatDuration(ms?: number): string {
  if (!ms) return ""
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Individual task item in Agent Mode's task plan
 * Shows task description, status, tool being used, and duration
 */
export const AgentTaskItem = memo(({
  task,
  isActive,
  index,
  language = "en",
}: AgentTaskItemProps) => {
  const styles = getStatusStyles(task.status, isActive)
  const toolIcon = getToolIcon(task.toolUsed)

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-all duration-200",
        styles.containerClass
      )}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {styles.icon}
      </div>

      {/* Task number */}
      <span className="flex-shrink-0 text-xs font-mono text-muted-foreground w-4">
        {index + 1}.
      </span>

      {/* Task description */}
      <span className={cn("flex-1 text-xs truncate", styles.textClass)}>
        {task.description}
      </span>

      {/* Tool badge (if applicable) */}
      {task.toolUsed && task.toolUsed !== "none" && (
        <div
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
            task.status === "active" || isActive
              ? "bg-primary/20 text-primary"
              : task.status === "completed"
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
          )}
        >
          {toolIcon}
          <span className="hidden sm:inline">{task.toolUsed.replace(/_/g, " ")}</span>
        </div>
      )}

      {/* Duration (if completed) */}
      {task.duration && task.duration > 0 && (
        <span className="flex-shrink-0 text-[10px] text-muted-foreground tabular-nums">
          {formatDuration(task.duration)}
        </span>
      )}
    </div>
  )
})

AgentTaskItem.displayName = "AgentTaskItem"

/**
 * Agent Task Plan Container
 * Displays the full task plan with progress indicator
 */
interface AgentTaskPlanProps {
  tasks: AgentTask[]
  currentTaskIndex?: number
  isAgentMode?: boolean
  language?: "en" | "de" | "es"
  collapsed?: boolean
  onToggle?: () => void
}

export const AgentTaskPlan = memo(({
  tasks,
  currentTaskIndex = 0,
  isAgentMode = true,
  language = "en",
  collapsed = false,
  onToggle,
}: AgentTaskPlanProps) => {
  if (!tasks || tasks.length === 0) return null

  const completedCount = tasks.filter((t) => t.status === "completed").length
  const progressPercent = (completedCount / tasks.length) * 100

  const labels = {
    en: { title: "Agent Plan", progress: "Progress", tasks: "tasks" },
    de: { title: "Agent-Plan", progress: "Fortschritt", tasks: "Aufgaben" },
    es: { title: "Plan del Agente", progress: "Progreso", tasks: "tareas" },
  }

  const lang = labels[language] || labels.en

  return (
    <div className="space-y-2 p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/30">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Lightning className="w-3.5 h-3.5 text-violet-500" weight="fill" />
          </div>
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
            {lang.title}
          </span>
        </div>
        <span className="text-[10px] text-violet-600 dark:text-violet-400">
          {completedCount}/{tasks.length} {lang.tasks}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 bg-violet-500/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {tasks.map((task, idx) => (
          <AgentTaskItem
            key={task.id}
            task={task}
            isActive={idx === currentTaskIndex && task.status !== "completed" && task.status !== "failed"}
            index={idx}
            language={language}
          />
        ))}
      </div>
    </div>
  )
})

AgentTaskPlan.displayName = "AgentTaskPlan"

export default AgentTaskItem
