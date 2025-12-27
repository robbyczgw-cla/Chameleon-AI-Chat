"use client"

import React, { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Show a minimal error UI instead of the full card */
  minimal?: boolean
  /** Custom error message to display */
  errorMessage?: string
  /** Module name for better error reporting */
  moduleName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * React Error Boundary for graceful error handling
 *
 * Features:
 * - Catches JavaScript errors in child components
 * - Displays user-friendly error UI
 * - Provides recovery actions (retry, home, report)
 * - Logs errors for debugging
 * - Supports minimal mode for inline errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo })

    // Log error details in development
    if (process.env.NODE_ENV === "development") {
      console.group("🔴 Error Boundary Caught Error")
      console.error("Error:", error)
      console.error("Component Stack:", errorInfo.componentStack)
      if (this.props.moduleName) {
        console.error("Module:", this.props.moduleName)
      }
      console.groupEnd()
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo)
    }
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo): void {
    // Can be extended to report to Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      moduleName: this.props.moduleName,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    }

    // Store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem("app-errors") || "[]")
      errors.push(errorReport)
      // Keep only last 10 errors
      if (errors.length > 10) errors.shift()
      localStorage.setItem("app-errors", JSON.stringify(errors))
    } catch {
      // Ignore storage errors
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleGoHome = (): void => {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  private handleReportBug = (): void => {
    const { error } = this.state
    const { moduleName } = this.props

    const issueTitle = encodeURIComponent(
      `[Bug] ${moduleName ? `[${moduleName}] ` : ""}${error?.message || "Unknown error"}`
    )
    const issueBody = encodeURIComponent(
      `## Error Description\n\n${error?.message || "Unknown error"}\n\n## Steps to Reproduce\n\n1. \n2. \n3. \n\n## Environment\n\n- URL: ${typeof window !== "undefined" ? window.location.href : "N/A"}\n- User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}\n- Timestamp: ${new Date().toISOString()}\n\n## Stack Trace\n\n\`\`\`\n${error?.stack || "No stack trace available"}\n\`\`\``
    )

    window.open(
      `https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues/new?title=${issueTitle}&body=${issueBody}`,
      "_blank"
    )
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    // Use custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback
    }

    const { error } = this.state
    const { minimal, errorMessage, moduleName } = this.props

    // Minimal error UI for inline components
    if (minimal) {
      return (
        <div
          className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{errorMessage || "Something went wrong"}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={this.handleRetry}
            className="ml-auto h-7 px-2"
            aria-label="Try again"
          >
            <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )
    }

    // Full error UI card
    return (
      <div
        className="flex items-center justify-center min-h-[200px] p-4"
        role="alert"
        aria-live="assertive"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>
              {moduleName && <span className="font-medium">[{moduleName}] </span>}
              {errorMessage || error?.message || "An unexpected error occurred"}
            </CardDescription>
          </CardHeader>

          {process.env.NODE_ENV === "development" && error?.stack && (
            <CardContent>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  View error details
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto max-h-40 text-[10px]">
                  {error.stack}
                </pre>
              </details>
            </CardContent>
          )}

          <CardFooter className="flex gap-2 flex-wrap">
            <Button onClick={this.handleRetry} variant="default" aria-label="Try loading again">
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Try Again
            </Button>
            <Button onClick={this.handleGoHome} variant="outline" aria-label="Go to home page">
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Go Home
            </Button>
            <Button onClick={this.handleReportBug} variant="ghost" aria-label="Report this bug">
              <Bug className="h-4 w-4 mr-2" aria-hidden="true" />
              Report
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
}

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, "children">
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component"

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary moduleName={displayName} {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}

/**
 * Specialized error boundary for chat messages
 */
export function ChatMessageErrorBoundary({ children }: { children: ReactNode }): ReactNode {
  return (
    <ErrorBoundary
      moduleName="ChatMessage"
      minimal
      errorMessage="Failed to render message"
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Specialized error boundary for rich content (Mermaid, code blocks, etc.)
 */
export function RichContentErrorBoundary({
  children,
  contentType,
}: {
  children: ReactNode
  contentType?: string
}): ReactNode {
  return (
    <ErrorBoundary
      moduleName={contentType ? `RichContent:${contentType}` : "RichContent"}
      minimal
      errorMessage={`Failed to render ${contentType || "content"}`}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
