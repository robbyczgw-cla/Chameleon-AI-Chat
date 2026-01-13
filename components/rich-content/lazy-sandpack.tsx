"use client"

import dynamic from "next/dynamic"
import type { SandpackPreviewProps } from "./sandpack-preview"

// Lazy load the SandpackPreview component - Sandpack library is ~200-300KB
// Only loads when a sandbox is actually rendered
const SandpackPreview = dynamic(
  () => import("./sandpack-preview").then(mod => ({ default: mod.SandpackPreviewWithErrorBoundary })),
  {
    loading: () => (
      <div className="p-4 my-4 rounded-lg border bg-muted/30 animate-pulse">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">Loading code sandbox...</span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </div>
    ),
    ssr: false // Sandpack uses browser APIs, can't render on server
  }
)

export function LazySandpack(props: SandpackPreviewProps) {
  return <SandpackPreview {...props} />
}

export type { SandpackPreviewProps }
