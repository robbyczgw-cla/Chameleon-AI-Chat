"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/contexts/app-context"
import { getCostTracker, type CostEntry, type CostStats, type GenerationData } from "@/lib/cost-tracker"
import { formatCost, formatTokens } from "@/lib/token-tracker"
import {
  BarChart3,
  MessageSquare,
  Clock,
  TrendingUp,
  DollarSign,
  Zap,
  Activity,
  Download,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function StatsDashboard() {
  const { chats } = useApp()
  const { toast } = useToast()
  const [stats, setStats] = useState<CostStats | null>(null)
  const [entries, setEntries] = useState<CostEntry[]>([])
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("7d")
  const [refreshing, setRefreshing] = useState(false)
  const [credits, setCredits] = useState<{
    limit: number
    usage: number
    label: string
  } | null>(null)

  const tracker = getCostTracker()

  // Load data on mount and when time range changes
  useEffect(() => {
    loadStats()
    loadEntries()
    loadCredits()
  }, [timeRange])

  const loadStats = () => {
    let range
    if (timeRange === "7d") {
      range = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }
    } else if (timeRange === "30d") {
      range = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }
    }

    const statsData = tracker.getStats(range)
    setStats(statsData)
  }

  const loadEntries = () => {
    const allEntries = tracker.getEntries()
    setEntries(allEntries)
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

  // Fetch exact costs from OpenRouter for entries that don't have them
  const fetchExactCosts = async () => {
    setRefreshing(true)
    const apiKey = localStorage.getItem("api-key")
    if (!apiKey) {
      toast({
        title: "No API Key",
        description: "Please add your OpenRouter API key to fetch exact costs",
        variant: "destructive",
      })
      setRefreshing(false)
      return
    }

    const entriesNeedingUpdate = entries.filter(
      (e) => e.generationId && e.actualCost === undefined
    )

    let updated = 0
    for (const entry of entriesNeedingUpdate.slice(0, 10)) {
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
          updated++
        }
      } catch (error) {
        console.error(`Failed to fetch exact cost for ${entry.generationId}:`, error)
      }
    }

    loadStats()
    loadEntries()
    setRefreshing(false)

    if (updated > 0) {
      toast({
        title: "Costs Updated",
        description: `Fetched exact costs for ${updated} request${updated > 1 ? "s" : ""}`,
      })
    } else if (entriesNeedingUpdate.length === 0) {
      toast({
        title: "All Up to Date",
        description: "All requests already have exact costs",
      })
    }
  }

  const handleExport = () => {
    const json = tracker.exportToJSON()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chameleon-stats-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Exported!",
      description: "Statistics data exported successfully",
    })
  }

  const handleClear = () => {
    if (!confirm("Are you sure you want to clear all cost tracking data? This cannot be undone.")) {
      return
    }

    tracker.clearAll()
    loadStats()
    loadEntries()

    toast({
      title: "Cleared",
      description: "All cost tracking data has been cleared",
      variant: "destructive",
    })
  }

  // Chat activity calculations
  const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
  const totalChats = chats.length
  const avgMessagesPerChat = totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : "0"

  // Most active time
  const chatsByHour: Record<number, number> = {}
  chats.forEach((chat) => {
    const hour = new Date(chat.createdAt).getHours()
    chatsByHour[hour] = (chatsByHour[hour] || 0) + 1
  })
  const mostActiveHour = Object.entries(chatsByHour).sort(([, a], [, b]) => b - a)[0]
  const mostActiveTimeDisplay = mostActiveHour ? `${mostActiveHour[0].padStart(2, "0")}:00` : "N/A"

  // Model usage from chats
  const modelUsage: Record<string, number> = {}
  chats.forEach((chat) => {
    const modelName = chat.model?.split("/").pop() || "Unknown"
    modelUsage[modelName] = (modelUsage[modelName] || 0) + 1
  })
  const topModels = Object.entries(modelUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Cost calculations
  const last7DaysCost = stats?.costByDay.slice(-7).reduce((sum, day) => sum + day.cost, 0) || 0
  const projectedMonthlyCost = last7DaysCost * 4.3

  const topCostModels = stats
    ? Object.entries(stats.costByModel)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : []

  // Count entries needing exact costs
  const entriesNeedingUpdate = entries.filter(
    (e) => e.generationId && e.actualCost === undefined
  ).length

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Statistics
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track your API costs, usage, and chat activity
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            <Button
              variant={timeRange === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("7d")}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("30d")}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("all")}
            >
              All Time
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Total Cost
                  </div>
                  <div className="text-2xl font-bold">{formatCost(stats?.totalCost || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.entriesWithActualCost || 0} tracked
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Zap className="h-4 w-4 text-blue-600" />
                    Total Tokens
                  </div>
                  <div className="text-2xl font-bold">{formatTokens(stats?.totalTokens || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entries.length} requests
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    Messages
                  </div>
                  <div className="text-2xl font-bold">{totalMessages}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalChats} chats
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    {credits ? "Credits Used" : "Avg/Message"}
                  </div>
                  <div className="text-2xl font-bold">
                    {credits
                      ? `$${credits.usage.toFixed(2)}`
                      : formatCost(stats?.avgCostPerMessage || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {credits ? `Limit: $${credits.limit.toFixed(2)}` : "per message"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Projection */}
            {stats && stats.costByDay.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <div className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Monthly Projection
                  </div>
                  <div className="text-lg">
                    Based on last 7 days:{" "}
                    <span className="font-bold text-primary">${projectedMonthlyCost.toFixed(2)}</span>{" "}
                    / month
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ~${(projectedMonthlyCost * 12).toFixed(2)} / year
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={fetchExactCosts} disabled={refreshing} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Fetch Exact Costs
                {entriesNeedingUpdate > 0 && (
                  <Badge variant="secondary" className="ml-2">{entriesNeedingUpdate}</Badge>
                )}
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button onClick={handleClear} variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </TabsContent>

          {/* COSTS TAB */}
          <TabsContent value="costs" className="space-y-6">
            {/* Cost by Model */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost by Model
                </CardTitle>
                <CardDescription>Top 5 models by spending</CardDescription>
              </CardHeader>
              <CardContent>
                {topCostModels.length > 0 ? (
                  <div className="space-y-3">
                    {topCostModels.map(([model, cost]) => (
                      <div key={model} className="flex items-center justify-between p-3 rounded-lg border">
                        <span className="text-sm font-mono truncate flex-1">{model}</span>
                        <span className="text-sm font-bold ml-2 text-green-600 dark:text-green-400">
                          {formatCost(cost)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 text-center border rounded-lg">
                    No cost data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Over Time */}
            {stats && stats.costByDay.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Cost Over Time
                  </CardTitle>
                  <CardDescription>Last 14 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {stats.costByDay.slice(-14).map((day) => (
                      <div key={day.date} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-24">{day.date}</span>
                        <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{
                              width: `${Math.max(2, (day.cost / Math.max(...stats.costByDay.map((d) => d.cost))) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold w-16 text-right">{formatCost(day.cost)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Usage with Exact Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Usage</CardTitle>
                <CardDescription>Exact costs from OpenRouter API (real billing data)</CardDescription>
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
                      {entries
                        .filter((e) => e.actualCost !== undefined)
                        .slice(0, 20)
                        .map((entry) => (
                          <tr key={entry.id} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs">
                              {entry.model.split("/").pop()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-xs">
                              {entry.nativeTokensPrompt && entry.nativeTokensCompletion
                                ? entry.nativeTokensPrompt + entry.nativeTokensCompletion
                                : entry.totalTokens}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-xs text-green-600 font-semibold">
                              {formatCost(entry.actualCost || 0)}
                              {entry.cacheDiscount && entry.cacheDiscount > 0 && (
                                <span className="ml-1 text-xs text-purple-600" title="Cache discount">
                                  (-{formatCost(entry.cacheDiscount)})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">
                              {entry.provider || "-"}
                            </td>
                          </tr>
                        ))}
                      {entries.filter((e) => e.actualCost !== undefined).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground">
                            No exact cost data yet. Click "Fetch Exact Costs" to retrieve billing data from OpenRouter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity" className="space-y-6">
            {/* Activity Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-3">
                      <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Messages</p>
                      <p className="text-2xl font-bold">{totalMessages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/10 p-3">
                      <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Chats</p>
                      <p className="text-2xl font-bold">{totalChats}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-orange-500/10 p-3">
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="text-2xl font-bold">{avgMessagesPerChat}</p>
                      <p className="text-xs text-muted-foreground">msg/chat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-3">
                      <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Most Active</p>
                      <p className="text-2xl font-bold">{mostActiveTimeDisplay}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Most Used Models */}
            {topModels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Most Used Models
                  </CardTitle>
                  <CardDescription>By number of chats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topModels.map(([model, count]) => (
                      <div key={model}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium">{model}</span>
                          <span className="text-muted-foreground">{count} chats</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70"
                            style={{ width: `${(count / totalChats) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cache Savings */}
            {stats && (stats.totalCacheDiscount || 0) > 0 && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    Cache Savings
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCost(stats.totalCacheDiscount || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Saved through prompt caching
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
