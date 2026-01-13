"use client"

import { useState, useCallback, useMemo } from "react"
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview as SandpackPreviewPane,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react"
// Note: Sandpack v2+ uses CSS-in-JS, no external CSS import needed
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  generateSandpackFiles,
  extractDependencies,
  type SandpackTemplate,
} from "@/lib/sandpack-utils"
import { ArrowsOut, ArrowsIn, ArrowClockwise, Code, Eye, Terminal, X } from "@phosphor-icons/react"

export interface SandpackPreviewProps {
  code: string
  template?: SandpackTemplate
  language?: string
  className?: string
  defaultShowEditor?: boolean
  defaultShowConsole?: boolean
  title?: string
}

/**
 * Reset button that uses Sandpack context
 */
function ResetButton() {
  const { sandpack } = useSandpack()

  const handleReset = useCallback(() => {
    sandpack.resetAllFiles()
  }, [sandpack])

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReset}
      className="h-7 text-xs"
      title="Reset code"
    >
      <ArrowClockwise className="h-3.5 w-3.5" />
    </Button>
  )
}

/**
 * Live code sandbox preview using Sandpack
 */
export function SandpackPreview({
  code,
  template = "react",
  language,
  className,
  defaultShowEditor = false,
  defaultShowConsole = false,
  title,
}: SandpackPreviewProps) {
  const [showEditor, setShowEditor] = useState(defaultShowEditor)
  const [showConsole, setShowConsole] = useState(defaultShowConsole)
  const [isExpanded, setIsExpanded] = useState(false)

  // Generate files and dependencies
  const files = useMemo(() => generateSandpackFiles(code, template), [code, template])
  const dependencies = useMemo(() => extractDependencies(code), [code])

  // Determine theme based on document
  const theme = useMemo(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light"
    }
    return "dark"
  }, [])

  const toggleEditor = useCallback(() => setShowEditor(prev => !prev), [])
  const toggleConsole = useCallback(() => setShowConsole(prev => !prev), [])
  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), [])

  return (
    <Card
      className={cn(
        "overflow-hidden my-4 border-border/50",
        isExpanded && "fixed inset-4 z-50 m-0",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            {title || `Live Preview (${template})`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleEditor}
            className={cn("h-7 text-xs", showEditor && "bg-primary/10 text-primary")}
            title="Toggle code editor"
          >
            <Code className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleConsole}
            className={cn("h-7 text-xs", showConsole && "bg-primary/10 text-primary")}
            title="Toggle console"
          >
            <Terminal className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-7 text-xs"
            title={isExpanded ? "Exit fullscreen" : "Fullscreen"}
          >
            {isExpanded ? (
              <ArrowsIn className="h-3.5 w-3.5" />
            ) : (
              <ArrowsOut className="h-3.5 w-3.5" />
            )}
          </Button>
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="h-7 text-xs"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Sandpack Container */}
      <SandpackProvider
        template={template}
        files={files}
        customSetup={
          Object.keys(dependencies).length > 0
            ? { dependencies }
            : undefined
        }
        theme={theme}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com", // Include Tailwind for convenience
          ],
        }}
      >
        <div className="sandpack-wrapper">
          <SandpackLayout>
            {showEditor && (
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
                style={{
                  height: isExpanded ? "50vh" : "200px",
                  minHeight: "200px",
                }}
              />
            )}
            <div className="flex flex-col flex-1">
              <SandpackPreviewPane
                showOpenInCodeSandbox={false}
                showRefreshButton
                style={{
                  height: isExpanded
                    ? showConsole
                      ? "40vh"
                      : "70vh"
                    : showConsole
                    ? "150px"
                    : "250px",
                  minHeight: "150px",
                }}
              />
              {showConsole && (
                <SandpackConsole
                  style={{
                    height: isExpanded ? "20vh" : "100px",
                  }}
                />
              )}
            </div>
          </SandpackLayout>

          {/* Reset button inside provider context */}
          <div className="flex items-center justify-end px-3 py-2 border-t border-border/50 bg-muted/30">
            <ResetButton />
          </div>
        </div>
      </SandpackProvider>

      {/* Fullscreen overlay backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
          onClick={toggleExpanded}
        />
      )}
    </Card>
  )
}

/**
 * Error boundary wrapper for Sandpack
 */
export function SandpackPreviewWithErrorBoundary(props: SandpackPreviewProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  if (hasError) {
    return (
      <Card className="p-4 my-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <X className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Failed to load sandbox</p>
            <p className="text-xs text-muted-foreground mt-1">
              {errorMessage || "An error occurred while initializing the code sandbox."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setHasError(false)
                setErrorMessage("")
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  // Note: React error boundaries require class components for componentDidCatch
  // For now, we rely on Sandpack's built-in error handling
  return <SandpackPreview {...props} />
}
