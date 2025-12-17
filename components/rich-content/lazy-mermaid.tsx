"use client"

import dynamic from "next/dynamic"

// Lazy load the MermaidDiagram component - mermaid library is ~400KB
// Only loads when a diagram is actually rendered
const MermaidDiagram = dynamic(
  () => import("./mermaid-diagram").then(mod => ({ default: mod.MermaidDiagram })),
  {
    loading: () => (
      <div className="p-4 my-4 rounded-lg border bg-muted/30 animate-pulse">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Loading diagram renderer...</span>
        </div>
      </div>
    ),
    ssr: false // Mermaid uses DOM APIs, can't render on server
  }
)

interface LazyMermaidProps {
  chart: string
  className?: string
}

export function LazyMermaid({ chart, className }: LazyMermaidProps) {
  return <MermaidDiagram chart={chart} className={className} />
}
