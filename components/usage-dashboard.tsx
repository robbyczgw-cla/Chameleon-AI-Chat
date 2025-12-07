"use client"

import { useState, useEffect } from "react"
import { getCostTracker, type CostEntry, type GenerationData } from "@/lib/cost-tracker"
import { formatCost } from "@/lib/token-tracker"
import { DollarSign, TrendingUp, Clock, Zap, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function UsageDashboard() {
  const [entries, setEntries] = useState<CostEntry[]>([])
  const [credits, setCredits] = useState<{
    limit: number
    usage: number
    label: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const tracker = getCostTracker()

  // Load entries on mount
  useEffect(() => {
    loadEntries()
    loadCredits()
  }, [])

  const loadEntries = () => {
    const allEntries = tracker.getEntries()
    setEntries(allEntries)
    setLoading(false)
  }

  const loadCredits = async () => {
    try {
      const response = await fetch("/api/credits", {
        headers: {
          "x-api-key": localStorage.getItem("api-key") || "",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCredits(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error)
    }
  }

  // Fetch exact costs for entries that don't have them yet
  const fetchExactCosts = async () => {
    setRefreshing(true)
    const apiKey = localStorage.getItem("api-key")
    if (!apiKey) {
      setRefreshing(false)
      return
    }

    const entriesNeedingUpdate = entries.filter(
      (e) => e.generationId && e.actualCost === undefined
    )

    for (const entry of entriesNeedingUpdate.slice(0, 10)) {
      // Limit to 10 at a time
      try {
        const response = await fetch(`/api/generation?id=${entry.generationId}`, {
          headers: {
            "x-api-key": apiKey,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const genData: GenerationData = data.data

          tracker.updateWithExactCost(entry.id, genData)
        }
      } catch (error) {
        console.error(`Failed to fetch exact cost for ${entry.generationId}:`, error)
      }
    }

    loadEntries()
    setRefreshing(false)
  }

  const exportData = () => {
    const json = tracker.exportToJSON()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `openrouter-usage-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = tracker.getStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(stats.totalCost)}</div>
            {stats.totalActualCost !== undefined && stats.totalActualCost > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Exact: {formatCost(stats.totalActualCost)} ({stats.entriesWithActualCost}/{entries.length})
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              Total Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalTokens / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {entries.length} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Avg per Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCost(stats.avgCostPerMessage)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalChats} chats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              {credits ? "Credits" : "Cache Savings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {credits ? (
              <>
                <div className="text-2xl font-bold">${credits.usage.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Limit: ${credits.limit.toFixed(2)}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCost(stats.totalCacheDiscount || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Prompt caching</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={fetchExactCosts} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Fetch Exact Costs
        </Button>
        <Button onClick={exportData} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
      </div>

      {/* Recent Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Usage</CardTitle>
          <CardDescription>Last 20 API requests with exact costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Model</th>
                  <th className="text-right py-2 px-3">Tokens</th>
                  <th className="text-right py-2 px-3">Cost</th>
                  <th className="text-left py-2 px-3">Provider</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 20).map((entry) => {
                  const cost = entry.actualCost !== undefined ? entry.actualCost : entry.cost
                  const isExact = entry.actualCost !== undefined

                  return (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">
                        {entry.model.split("/").pop()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-xs">
                        {isExact && entry.nativeTokensPrompt ? (
                          <span title="Native tokens (exact)">
                            {entry.nativeTokensPrompt + (entry.nativeTokensCompletion || 0)}
                          </span>
                        ) : (
                          entry.totalTokens
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-xs">
                        <span className={isExact ? "text-green-600 font-semibold" : ""}>
                          {formatCost(cost)}
                        </span>
                        {isExact && entry.cacheDiscount && entry.cacheDiscount > 0 && (
                          <span className="ml-1 text-xs text-purple-600" title="Cache discount">
                            (-{formatCost(entry.cacheDiscount)})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs">
                        {entry.provider || "-"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
