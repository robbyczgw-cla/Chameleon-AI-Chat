"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { supabaseSync } from "@/lib/supabase/sync"
import { createClient } from "@/lib/supabase/client"
import { formatCost, formatTokens } from "@/lib/token-tracker"
import { Activity, DollarSign, MessageSquare, Zap } from "lucide-react"

export function UsageStatsWidget() {
  const [stats, setStats] = useState<{
    totalTokens: number
    totalCost: number
    messageCount: number
    modelUsage: Record<string, { tokens: number; cost: number; count: number }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("week")

  useEffect(() => {
    loadStats()
  }, [timeRange])

  const loadStats = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let startDate: Date | undefined
      const now = new Date()

      switch (timeRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "all":
          startDate = undefined
          break
      }

      const loadedStats = await supabaseSync.getUserUsageStats(user.id, startDate)
      setStats(loadedStats)
    } catch (error) {
      console.error("Error loading usage stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  const topModels = Object.entries(stats.modelUsage)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Usage Statistics</CardTitle>
            <CardDescription>Track your API usage and costs</CardDescription>
          </div>
          <div className="flex gap-1">
            {(["today", "week", "month", "all"] as const).map((range) => (
              <Badge
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setTimeRange(range)}
              >
                {range === "today" ? "Today" : range === "week" ? "Week" : range === "month" ? "Month" : "All"}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatTokens(stats.totalTokens)}</p>
              <p className="text-xs text-muted-foreground">Tokens</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="rounded-full bg-green-500/10 p-2">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCost(stats.totalCost)}</p>
              <p className="text-xs text-muted-foreground">Cost</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <div className="rounded-full bg-blue-500/10 p-2">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold">{stats.messageCount}</p>
            <p className="text-xs text-muted-foreground">Messages generated</p>
          </div>
        </div>

        {topModels.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" />
              <span>Top Models</span>
            </div>
            {topModels.map(([model, usage]) => (
              <div key={model} className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-xs">
                <span className="font-medium truncate max-w-[60%]">{model.split("/").pop()}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {formatTokens(usage.tokens)}
                  </Badge>
                  <span className="font-semibold text-green-600 dark:text-green-400">{formatCost(usage.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
