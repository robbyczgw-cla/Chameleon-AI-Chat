"use client"

import dynamic from "next/dynamic"

// Lazy load the MathRenderer component - KaTeX is ~180KB (lib + CSS)
// Only loads when math expressions are actually rendered
const MathRenderer = dynamic(
  () => import("./math-renderer").then(mod => ({ default: mod.MathRenderer })),
  {
    loading: () => (
      <span className="inline-block px-2 py-0.5 bg-muted rounded animate-pulse text-sm">
        Loading math...
      </span>
    ),
    ssr: false // KaTeX uses DOM APIs
  }
)

interface LazyMathProps {
  math: string
  displayMode?: boolean
  className?: string
}

export function LazyMath({ math, displayMode = false, className }: LazyMathProps) {
  return <MathRenderer math={math} displayMode={displayMode} className={className} />
}
