"use client"

import { useEffect, useRef, useState } from "react"
import mermaid from "mermaid"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Maximize2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MermaidDiagramProps {
  chart: string
  className?: string
}

// Initialize mermaid only once
let mermaidInitialized = false

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
        securityLevel: "loose",
        fontFamily: "var(--font-sans)",
        suppressErrors: true, // Suppress error rendering
        logLevel: "error",
      })
      mermaidInitialized = true
    }

    const renderDiagram = async () => {
      try {
        // Clean and validate chart syntax
        const cleanChart = chart.trim()

        // Check if it's a valid mermaid diagram
        if (!cleanChart || cleanChart.length < 5) {
          setError("Invalid diagram syntax")
          return
        }

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart)
        setSvg(renderedSvg)
        setError("")
      } catch (err: any) {
        console.error("Mermaid rendering error:", err)
        setError(err?.message || "Failed to render diagram")

        // Remove any error elements that Mermaid might have created
        const errorDivs = document.querySelectorAll('[id^="d"]')
        errorDivs.forEach(div => {
          if (div.innerHTML.includes('Syntax error')) {
            div.remove()
          }
        })
      }
    }

    renderDiagram()

    // Cleanup function to remove any stray error divs
    return () => {
      const errorDivs = document.querySelectorAll('[id^="d"]')
      errorDivs.forEach(div => {
        if (div.innerHTML.includes('Syntax error') || div.innerHTML.includes('mermaid')) {
          div.remove()
        }
      })
    }
  }, [chart])

  const handleDownload = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "diagram.svg"
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Downloaded",
      description: "Diagram saved as SVG",
    })
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      containerRef.current.requestFullscreen()
    }
  }

  if (error) {
    return (
      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <p className="text-sm text-destructive">⚠️ {error}</p>
        <pre className="text-xs mt-2 text-muted-foreground overflow-x-auto">{chart}</pre>
      </Card>
    )
  }

  return (
    <Card className="relative group overflow-hidden my-4">
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 px-2"
          onClick={handleFullscreen}
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className={`p-4 flex items-center justify-center bg-muted/30 ${className || ""}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </Card>
  )
}
