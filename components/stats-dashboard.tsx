"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/contexts/app-context"
import { getCostTracker, type CostEntry, type CostStats, type GenerationData } from "@/lib/cost-tracker"
import { formatCost, formatTokens } from "@/lib/token-tracker"
import { streamChatMessage } from "@/lib/openrouter"
import { ArrowsClockwise, Brain, ChartBar, Chat, CircleNotch, Clock, CloudSun, Cpu, CurrencyDollar, Database, Download, FileArrowDown, FileArrowUp, FileText, Gauge, Globe, HardDrives, Image, Lightning, Link, MagnifyingGlass, Medal, Pulse, Robot, Sparkle, Target, Timer, Trash, TrendUp, Wrench, YoutubeLogo } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AIInsights {
  summary: string
  strengths: string[]
  suggestions: string[]
  timestamp: number
}

export function StatsDashboard() {
  const { chats, settings } = useApp()
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
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const tracker = getCostTracker()

  // Load data on mount and when time range changes
  useEffect(() => {
    loadStats()
    loadEntries()
    loadCredits()
    loadSavedInsights()
  }, [timeRange])

  const loadSavedInsights = () => {
    const saved = localStorage.getItem("chameleon-analytics-insights")
    if (saved) {
      try {
        setInsights(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load insights:", e)
      }
    }
  }

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

  // Generate AI insights about usage patterns
  const generateAIInsights = async () => {
    if (chats.length === 0) return

    setIsAnalyzing(true)
    try {
      const recentPrompts: string[] = []
      chats.slice(-5).forEach((chat) => {
        chat.messages
          .filter((m) => m.role === "user")
          .slice(-3)
          .forEach((m) => recentPrompts.push(m.content))
      })

      const analysisPrompt = `Analyze the following user prompts and create a brief analysis (max 150 words):

Prompts:
${recentPrompts.slice(0, 15).join("\n---\n")}

Provide analysis in this JSON format:
{
  "summary": "Brief summary of usage patterns",
  "strengths": ["Strength 1", "Strength 2"],
  "suggestions": ["Improvement suggestion 1", "Improvement suggestion 2"]
}`

      let result = ""
      await streamChatMessage(
        [{ role: "user", content: analysisPrompt }],
        settings.selectedModel,
        {
          temperature: 0.7,
          maxTokens: 500,
          apiKey: settings.apiKeys.openRouter,
          onChunk: (chunk: string) => {
            result += chunk
          }
        }
      )

      try {
        const jsonMatch = result.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || result.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1])
          const newInsights: AIInsights = {
            summary: parsed.summary || "No summary available",
            strengths: parsed.strengths || [],
            suggestions: parsed.suggestions || [],
            timestamp: Date.now()
          }
          setInsights(newInsights)
          localStorage.setItem("chameleon-analytics-insights", JSON.stringify(newInsights))
        }
      } catch (parseError) {
        console.error("Failed to parse AI insights:", parseError)
      }
    } catch (error) {
      console.error("Failed to generate insights:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Chat activity calculations
  const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0)
  const totalChats = chats.length
  const avgMessagesPerChat = totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : "0"

  // User vs AI message counts
  let userMessages = 0
  let assistantMessages = 0
  chats.forEach((chat) => {
    chat.messages.forEach((msg) => {
      if (msg.role === "user") userMessages++
      if (msg.role === "assistant") assistantMessages++
    })
  })

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

  // Provider usage from entries
  const providerUsage: Record<string, { count: number; cost: number }> = {}
  entries.forEach((entry) => {
    if (entry.provider) {
      if (!providerUsage[entry.provider]) {
        providerUsage[entry.provider] = { count: 0, cost: 0 }
      }
      providerUsage[entry.provider].count++
      providerUsage[entry.provider].cost += entry.actualCost || 0
    }
  })
  const topProviders = Object.entries(providerUsage)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .slice(0, 5)

  // Performance metrics
  const entriesWithPerformance = entries.filter((e) => e.generationTime && e.generationTime > 0)
  const avgGenerationTime = entriesWithPerformance.length > 0
    ? entriesWithPerformance.reduce((sum, e) => sum + (e.generationTime || 0), 0) / entriesWithPerformance.length
    : 0
  const avgTokensPerSecond = entriesWithPerformance.length > 0
    ? entriesWithPerformance.reduce((sum, e) => {
        const time = e.generationTime || 1
        const tokens = e.nativeTokensCompletion || e.totalTokens || 0
        return sum + (tokens / (time / 1000))
      }, 0) / entriesWithPerformance.length
    : 0

  // Search provider usage (estimate from settings)
  const searchProvider = settings.searchProvider || "tavily"

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

  // Cache savings calculation
  const totalCacheDiscount = entries.reduce((sum, e) => sum + (e.cacheDiscount || 0), 0)
  const cacheHitRate = entries.length > 0
    ? (entries.filter(e => e.cacheDiscount && e.cacheDiscount > 0).length / entries.length * 100).toFixed(1)
    : "0"

  // Tool Analytics - Extract from streaming history
  interface ToolUsageData {
    count: number
    lastUsed: number
    searchQueries: string[]
    providers: Record<string, number>
  }

  const toolUsage: Record<string, ToolUsageData> = {}
  const searchProviderUsage: Record<string, number> = {}
  let totalToolCalls = 0
  let messagesWithTools = 0
  let totalToolCallingCost = 0 // Sum of toolCallCost from all messages
  let totalToolCallTokens = 0 // Sum of tool call tokens

  chats.forEach((chat) => {
    chat.messages.forEach((msg) => {
      if (msg.streamingHistory && msg.streamingHistory.length > 0) {
        let hasToolUse = false
        msg.streamingHistory.forEach((entry) => {
          if (entry.phase === "tool_use" && entry.toolName) {
            hasToolUse = true
            totalToolCalls++
            const toolName = entry.toolName

            if (!toolUsage[toolName]) {
              toolUsage[toolName] = {
                count: 0,
                lastUsed: 0,
                searchQueries: [],
                providers: {}
              }
            }

            toolUsage[toolName].count++
            toolUsage[toolName].lastUsed = Math.max(toolUsage[toolName].lastUsed, entry.timestamp)

            // Track search queries
            if (entry.searchQuery) {
              toolUsage[toolName].searchQueries.push(entry.searchQuery)
            }

            // Track search providers
            if (entry.searchProvider) {
              toolUsage[toolName].providers[entry.searchProvider] =
                (toolUsage[toolName].providers[entry.searchProvider] || 0) + 1
              searchProviderUsage[entry.searchProvider] =
                (searchProviderUsage[entry.searchProvider] || 0) + 1
            }
          }
        })
        if (hasToolUse) messagesWithTools++
      }

      // Also check message stats for search info
      if (msg.stats?.searchProvider) {
        searchProviderUsage[msg.stats.searchProvider] =
          (searchProviderUsage[msg.stats.searchProvider] || 0) + 1
      }

      // Track tool calling costs from message stats
      if (msg.stats?.toolCallCost) {
        totalToolCallingCost += msg.stats.toolCallCost
      }
      if (msg.stats?.toolCallTokensPrompt) {
        totalToolCallTokens += msg.stats.toolCallTokensPrompt
      }
      if (msg.stats?.toolCallTokensCompletion) {
        totalToolCallTokens += msg.stats.toolCallTokensCompletion
      }
    })
  })

  // Sort tools by usage count
  const sortedToolUsage = Object.entries(toolUsage)
    .sort(([, a], [, b]) => b.count - a.count)

  // Get tool icon and color
  const getToolMeta = (toolName: string): { icon: React.ReactNode; color: string; label: string } => {
    const toolMap: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      web_search: { icon: <Globe className="h-4 w-4" />, color: "text-blue-600", label: "Web Search" },
      search: { icon: <MagnifyingGlass className="h-4 w-4" />, color: "text-blue-600", label: "Search" },
      url_fetch: { icon: <Link className="h-4 w-4" />, color: "text-green-600", label: "URL Fetch" },
      fetch_url: { icon: <Link className="h-4 w-4" />, color: "text-green-600", label: "URL Fetch" },
      youtube: { icon: <YoutubeLogo className="h-4 w-4" />, color: "text-red-600", label: "YouTube" },
      youtube_transcript: { icon: <YoutubeLogo className="h-4 w-4" />, color: "text-red-600", label: "YouTube Transcript" },
      weather: { icon: <CloudSun className="h-4 w-4" />, color: "text-yellow-600", label: "Weather" },
      get_weather: { icon: <CloudSun className="h-4 w-4" />, color: "text-yellow-600", label: "Weather" },
      read_file: { icon: <FileArrowDown className="h-4 w-4" />, color: "text-cyan-600", label: "Read File" },
      write_file: { icon: <FileArrowUp className="h-4 w-4" />, color: "text-violet-600", label: "Write File" },
      generate_image: { icon: <Image className="h-4 w-4" />, color: "text-pink-600", label: "Generate Image" },
      image_generation: { icon: <Image className="h-4 w-4" />, color: "text-pink-600", label: "Image Generation" },
    }
    return toolMap[toolName.toLowerCase()] || {
      icon: <Wrench className="h-4 w-4" />,
      color: "text-gray-600",
      label: toolName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    }
  }

  // Calculate tool usage rate
  const toolUsageRate = assistantMessages > 0
    ? ((messagesWithTools / assistantMessages) * 100).toFixed(1)
    : "0"

  // Get recent search queries (last 10)
  const recentSearchQueries: { query: string; tool: string; timestamp: number }[] = []
  Object.entries(toolUsage).forEach(([tool, data]) => {
    data.searchQueries.slice(-5).forEach((query, i) => {
      recentSearchQueries.push({
        query,
        tool,
        timestamp: data.lastUsed - (data.searchQueries.length - i - 1) * 60000
      })
    })
  })
  recentSearchQueries.sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ChartBar className="h-6 w-6 text-primary" />
              Statistics
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track your API costs, usage, performance & insights
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
          <TabsList className="flex w-full overflow-x-auto h-auto gap-1 p-1 scrollbar-hide">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-3 flex-shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="costs" className="text-xs sm:text-sm py-2 px-3 flex-shrink-0">Costs</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs sm:text-sm py-2 px-3 flex-shrink-0 flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm py-2 px-3 flex-shrink-0">Perf</TabsTrigger>
            <TabsTrigger value="providers" className="text-xs sm:text-sm py-2 px-3 flex-shrink-0">Providers</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm py-2 px-3 flex-shrink-0 flex items-center gap-1">
              <Sparkle className="h-3 w-3" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CurrencyDollar className="h-4 w-4 text-green-600" />
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
                    <Lightning className="h-4 w-4 text-blue-600" />
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
                    <Chat className="h-4 w-4 text-purple-600" />
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
                    <Database className="h-4 w-4 text-orange-600" />
                    Cache Savings
                  </div>
                  <div className="text-2xl font-bold">{formatCost(totalCacheDiscount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cacheHitRate}% hit rate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Projection & Credits */}
            <div className="grid md:grid-cols-2 gap-4">
              {stats && stats.costByDay.length > 0 && (
                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <TrendUp className="h-4 w-4" />
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

              {credits && (
                <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                  <CardContent className="pt-4">
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CurrencyDollar className="h-4 w-4 text-indigo-600" />
                      OpenRouter Credits
                    </div>
                    <div className="text-lg">
                      Used: <span className="font-bold">${credits.usage.toFixed(2)}</span>
                      {" / "}
                      <span className="text-muted-foreground">${credits.limit.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{ width: `${Math.min((credits.usage / credits.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={fetchExactCosts} disabled={refreshing} variant="outline" size="sm">
                <ArrowsClockwise className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
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
                <Trash className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            </div>

            {/* Message Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Chat className="h-5 w-5" />
                  Message Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-600 dark:text-blue-400">Your Messages</span>
                    <span className="font-medium">{userMessages}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalMessages > 0 ? (userMessages / totalMessages) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-purple-600 dark:text-purple-400">AI Responses</span>
                    <span className="font-medium">{assistantMessages}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                      style={{ width: `${totalMessages > 0 ? (assistantMessages / totalMessages) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t text-sm text-muted-foreground">
                  Average: {avgMessagesPerChat} messages per chat
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COSTS TAB */}
          <TabsContent value="costs" className="space-y-6">
            {/* Cost by Model */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CurrencyDollar className="h-5 w-5" />
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
                    <Pulse className="h-5 w-5" />
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

          {/* TOOLS TAB */}
          <TabsContent value="tools" className="space-y-6">
            {/* Tool Usage Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    Total Tool Calls
                  </div>
                  <div className="text-2xl font-bold">{totalToolCalls}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sortedToolUsage.length} tool types
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Robot className="h-4 w-4 text-green-600" />
                    Tool Usage Rate
                  </div>
                  <div className="text-2xl font-bold">{toolUsageRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of AI responses use tools
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MagnifyingGlass className="h-4 w-4 text-purple-600" />
                    Search Queries
                  </div>
                  <div className="text-2xl font-bold">
                    {Object.values(toolUsage).reduce((sum, t) => sum + t.searchQueries.length, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    total searches performed
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Globe className="h-4 w-4 text-orange-600" />
                    Search Providers
                  </div>
                  <div className="text-2xl font-bold">{Object.keys(searchProviderUsage).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Object.entries(searchProviderUsage)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 2)
                      .map(([p]) => p)
                      .join(", ") || "None used"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CurrencyDollar className="h-4 w-4 text-red-600" />
                    Tool Call Costs
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCost(totalToolCallingCost)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalToolCallTokens > 0 ? `${totalToolCallTokens.toLocaleString()} tokens` : "overhead from tools"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tool Usage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Tool Usage Breakdown
                </CardTitle>
                <CardDescription>Tools used by AI to enhance responses</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedToolUsage.length > 0 ? (
                  <div className="space-y-3">
                    {sortedToolUsage.map(([toolName, data]) => {
                      const meta = getToolMeta(toolName)
                      const maxCount = sortedToolUsage[0][1].count
                      return (
                        <div key={toolName} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={meta.color}>{meta.icon}</span>
                              <span className="font-medium">{meta.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{data.count} calls</Badge>
                              {data.searchQueries.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {data.searchQueries.length} searches
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                toolName.includes("search") || toolName.includes("web")
                                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                  : toolName.includes("youtube")
                                  ? "bg-gradient-to-r from-red-500 to-pink-500"
                                  : toolName.includes("weather")
                                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                  : "bg-gradient-to-r from-gray-500 to-gray-400"
                              )}
                              style={{ width: `${(data.count / maxCount) * 100}%` }}
                            />
                          </div>
                          {Object.keys(data.providers).length > 0 && (
                            <div className="mt-2 flex gap-1 flex-wrap">
                              {Object.entries(data.providers).map(([provider, count]) => (
                                <Badge key={provider} variant="outline" className="text-xs">
                                  {provider}: {count}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <Wrench className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No tool usage recorded yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tools are used when AI performs web searches, fetches URLs, etc.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Search Queries */}
            {recentSearchQueries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MagnifyingGlass className="h-5 w-5" />
                    Recent Search Queries
                  </CardTitle>
                  <CardDescription>Searches performed by AI tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentSearchQueries.slice(0, 10).map((item, i) => {
                      const meta = getToolMeta(item.tool)
                      return (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50">
                          <span className={cn("mt-0.5", meta.color)}>{meta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.query}</p>
                            <p className="text-xs text-muted-foreground">
                              via {meta.label}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Provider Usage */}
            {Object.keys(searchProviderUsage).length > 0 && (
              <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-indigo-600" />
                    Search Provider Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {Object.entries(searchProviderUsage)
                      .sort(([, a], [, b]) => b - a)
                      .map(([provider, count]) => {
                        const totalSearches = Object.values(searchProviderUsage).reduce((a, b) => a + b, 0)
                        const percentage = ((count / totalSearches) * 100).toFixed(1)
                        return (
                          <div key={provider} className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                            <div className="text-lg font-semibold capitalize">{provider}</div>
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                              {count}
                            </div>
                            <div className="text-sm text-muted-foreground">{percentage}%</div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PERFORMANCE TAB */}
          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Timer className="h-4 w-4 text-blue-600" />
                    Avg Response Time
                  </div>
                  <div className="text-2xl font-bold">
                    {avgGenerationTime > 0 ? `${(avgGenerationTime / 1000).toFixed(1)}s` : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {entriesWithPerformance.length} samples
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Gauge className="h-4 w-4 text-green-600" />
                    Tokens/Second
                  </div>
                  <div className="text-2xl font-bold">
                    {avgTokensPerSecond > 0 ? avgTokensPerSecond.toFixed(1) : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    avg generation speed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Cpu className="h-4 w-4 text-purple-600" />
                    Avg Cost/Request
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCost(stats?.avgCostPerMessage || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    per API call
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Most Active
                  </div>
                  <div className="text-2xl font-bold">{mostActiveTimeDisplay}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    peak usage hour
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Most Used Models */}
            {topModels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pulse className="h-5 w-5" />
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

            {/* Search Provider Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MagnifyingGlass className="h-5 w-5" />
                  Search Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={cn(
                    "p-4 rounded-lg border-2",
                    searchProvider === "tavily" ? "border-primary bg-primary/5" : "border-muted"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌐</span>
                      <span className="font-medium">Tavily</span>
                      {searchProvider === "tavily" && <Badge>Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">LLM-optimized search ~$0.01/query</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-lg border-2",
                    searchProvider === "serper" ? "border-primary bg-primary/5" : "border-muted"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔍</span>
                      <span className="font-medium">Serper</span>
                      {searchProvider === "serper" && <Badge>Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Google Search ~$0.001/query</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-lg border-2",
                    searchProvider === "exa" ? "border-primary bg-primary/5" : "border-muted"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔮</span>
                      <span className="font-medium">Exa</span>
                      {searchProvider === "exa" && <Badge>Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">Neural search ~$0.01/query</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROVIDERS TAB */}
          <TabsContent value="providers" className="space-y-6">
            {/* Provider Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HardDrives className="h-5 w-5" />
                  OpenRouter Provider Usage
                </CardTitle>
                <CardDescription>Which providers are serving your requests</CardDescription>
              </CardHeader>
              <CardContent>
                {topProviders.length > 0 ? (
                  <div className="space-y-3">
                    {topProviders.map(([provider, data]) => (
                      <div key={provider} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{provider}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{data.count} requests</Badge>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              {formatCost(data.cost)}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{
                              width: `${(data.cost / topProviders[0][1].cost) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-8 text-center border rounded-lg">
                    <HardDrives className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No provider data yet.</p>
                    <p className="text-xs mt-1">Provider info is collected from exact cost fetches.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cache Stats */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  Prompt Caching Stats
                </CardTitle>
                <CardDescription>Savings from OpenRouter prompt caching (0.25x input cost)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {formatCost(totalCacheDiscount)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Saved</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {cacheHitRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                  </div>
                  <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {entries.filter(e => e.cacheDiscount && e.cacheDiscount > 0).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Cached Requests</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-xs">
                  <p className="font-medium">💡 How caching works:</p>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside text-muted-foreground">
                    <li>Cached tokens cost 0.25x normal input price</li>
                    <li>Cache TTL is ~3-5 minutes on average</li>
                    <li>Works best with repeated system prompts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI INSIGHTS TAB */}
          <TabsContent value="insights" className="space-y-6">
            {!insights ? (
              <Card className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">AI Analysis of Your Prompts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Let AI analyze your prompt patterns and suggest improvements
                </p>
                <Button onClick={generateAIInsights} disabled={isAnalyzing || chats.length === 0}>
                  {isAnalyzing ? (
                    <>
                      <CircleNotch className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkle className="h-4 w-4 mr-2" />
                      Generate Insights
                    </>
                  )}
                </Button>
                {chats.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Start chatting to generate insights
                  </p>
                )}
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Summary
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateAIInsights}
                        disabled={isAnalyzing}
                      >
                        <Sparkle className="h-3 w-3 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{insights.summary}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      Last updated: {new Date(insights.timestamp).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                {insights.strengths.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                        <Medal className="h-5 w-5" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {insights.suggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
                        <Target className="h-5 w-5" />
                        Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-500 mt-0.5">→</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
