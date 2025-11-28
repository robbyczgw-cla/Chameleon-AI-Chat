/**
 * Background Agents System
 * Autonomous agents that run periodic tasks in the background
 */

export type AgentType = "tech-news" | "bitcoin-tracker" | "website-watcher" | "custom"

export type AgentStatus = "active" | "paused" | "error"

export type AgentFrequency = "hourly" | "daily" | "weekly" | "manual"

export interface BackgroundAgent {
  id: string
  name: string
  type: AgentType
  emoji: string
  description: string
  frequency: AgentFrequency
  status: AgentStatus
  config: Record<string, any> // Agent-specific configuration
  lastRun?: number // Timestamp of last execution
  nextRun?: number // Timestamp of next scheduled run
  results?: AgentResult[] // Recent results
  createdAt: number
}

export interface AgentResult {
  id: string
  timestamp: number
  success: boolean
  data?: any
  error?: string
  summary?: string // Human-readable summary
}

// Agent Templates
export const AGENT_TEMPLATES: Omit<BackgroundAgent, "id" | "createdAt" | "lastRun" | "nextRun" | "results">[] = [
  {
    name: "Daily Tech News",
    type: "tech-news",
    emoji: "📰",
    description: "Holt täglich die neuesten Tech-News von Hacker News, TechCrunch, etc.",
    frequency: "daily",
    status: "paused",
    config: {
      sources: ["hackernews", "techcrunch"],
      topics: ["AI", "Web Development", "Startups"],
      maxItems: 5,
    },
  },
  {
    name: "Bitcoin Tracker",
    type: "bitcoin-tracker",
    emoji: "₿",
    description: "Tracked Bitcoin-Preis und benachrichtigt bei großen Schwankungen",
    frequency: "hourly",
    status: "paused",
    config: {
      currency: "USD",
      alertThreshold: 5, // % change to alert
      trackCoins: ["BTC", "ETH"],
    },
  },
  {
    name: "Website Watcher",
    type: "website-watcher",
    emoji: "👁️",
    description: "Überwacht Websites auf Änderungen und benachrichtigt dich",
    frequency: "daily",
    status: "paused",
    config: {
      urls: [],
      checkInterval: 24, // hours
      notifyOnChange: true,
    },
  },
]

class BackgroundAgentsService {
  private agents: BackgroundAgent[] = []
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private readonly STORAGE_KEY = "chameleon-background-agents"

  constructor() {
    this.loadAgents()
  }

  private loadAgents() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.agents = JSON.parse(stored)
        console.log("[BackgroundAgents] Loaded", this.agents.length, "agents")

        // Restart active agents
        this.agents.forEach(agent => {
          if (agent.status === "active") {
            this.scheduleAgent(agent)
          }
        })
      }
    } catch (error) {
      console.error("[BackgroundAgents] Failed to load agents:", error)
    }
  }

  private saveAgents() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.agents))
    } catch (error) {
      console.error("[BackgroundAgents] Failed to save agents:", error)
    }
  }

  getAllAgents(): BackgroundAgent[] {
    return [...this.agents]
  }

  getAgent(id: string): BackgroundAgent | undefined {
    return this.agents.find(a => a.id === id)
  }

  createAgent(template: typeof AGENT_TEMPLATES[0]): BackgroundAgent {
    const agent: BackgroundAgent = {
      ...template,
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      results: [],
    }

    this.agents.push(agent)
    this.saveAgents()

    console.log("[BackgroundAgents] Created agent:", agent.name)
    return agent
  }

  updateAgent(id: string, updates: Partial<BackgroundAgent>) {
    const index = this.agents.findIndex(a => a.id === id)
    if (index === -1) return

    this.agents[index] = { ...this.agents[index], ...updates }
    this.saveAgents()

    // Reschedule if needed
    if (updates.status === "active" && this.agents[index].status === "active") {
      this.scheduleAgent(this.agents[index])
    } else if (updates.status === "paused") {
      this.unscheduleAgent(id)
    }
  }

  deleteAgent(id: string) {
    this.unscheduleAgent(id)
    this.agents = this.agents.filter(a => a.id !== id)
    this.saveAgents()
    console.log("[BackgroundAgents] Deleted agent:", id)
  }

  startAgent(id: string) {
    this.updateAgent(id, { status: "active" })
  }

  pauseAgent(id: string) {
    this.updateAgent(id, { status: "paused" })
  }

  async runAgentNow(id: string): Promise<AgentResult> {
    const agent = this.getAgent(id)
    if (!agent) {
      throw new Error("Agent not found")
    }

    console.log("[BackgroundAgents] Running agent manually:", agent.name)
    return await this.executeAgent(agent)
  }

  private scheduleAgent(agent: BackgroundAgent) {
    // Clear existing schedule
    this.unscheduleAgent(agent.id)

    const intervalMs = this.getIntervalMs(agent.frequency)
    if (intervalMs === 0) return // Manual execution only

    console.log("[BackgroundAgents] Scheduling agent:", agent.name, "every", agent.frequency)

    const interval = setInterval(async () => {
      await this.executeAgent(agent)
    }, intervalMs)

    this.intervals.set(agent.id, interval)

    // Update next run time
    this.updateAgent(agent.id, {
      nextRun: Date.now() + intervalMs
    })
  }

  private unscheduleAgent(id: string) {
    const interval = this.intervals.get(id)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(id)
      console.log("[BackgroundAgents] Unscheduled agent:", id)
    }
  }

  private getIntervalMs(frequency: AgentFrequency): number {
    switch (frequency) {
      case "hourly": return 60 * 60 * 1000
      case "daily": return 24 * 60 * 60 * 1000
      case "weekly": return 7 * 24 * 60 * 60 * 1000
      case "manual": return 0
      default: return 0
    }
  }

  private async executeAgent(agent: BackgroundAgent): Promise<AgentResult> {
    const result: AgentResult = {
      id: `result_${Date.now()}`,
      timestamp: Date.now(),
      success: false,
    }

    try {
      console.log("[BackgroundAgents] Executing agent:", agent.name)

      // Execute based on agent type
      switch (agent.type) {
        case "tech-news":
          result.data = await this.fetchTechNews(agent.config)
          result.summary = `Found ${result.data.length} tech news articles`
          break

        case "bitcoin-tracker":
          result.data = await this.trackBitcoin(agent.config)
          result.summary = `BTC: $${result.data.price.toLocaleString()} (${result.data.change > 0 ? '+' : ''}${result.data.change.toFixed(2)}%)`
          break

        case "website-watcher":
          result.data = await this.watchWebsites(agent.config)
          result.summary = `Checked ${result.data.checked} websites, ${result.data.changed} changed`
          break

        default:
          throw new Error(`Unknown agent type: ${agent.type}`)
      }

      result.success = true
      console.log("[BackgroundAgents] Agent completed successfully:", agent.name)
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error"
      result.summary = `Error: ${result.error}`
      console.error("[BackgroundAgents] Agent failed:", agent.name, error)

      // Update agent status to error
      this.updateAgent(agent.id, { status: "error" })
    }

    // Store result
    const updatedAgent = this.getAgent(agent.id)
    if (updatedAgent) {
      const results = updatedAgent.results || []
      results.unshift(result)

      // Keep only last 10 results
      if (results.length > 10) {
        results.length = 10
      }

      this.updateAgent(agent.id, {
        results,
        lastRun: Date.now(),
      })
    }

    return result
  }

  private async fetchTechNews(config: any): Promise<any[]> {
    // Placeholder - in production, fetch from actual APIs
    // For now, return mock data
    const mockNews = [
      { title: "New AI Breakthrough in Language Models", source: "TechCrunch", url: "#" },
      { title: "Startup Raises $50M for Developer Tools", source: "Hacker News", url: "#" },
      { title: "React 19 Released with New Features", source: "Dev.to", url: "#" },
    ]

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return mockNews.slice(0, config.maxItems || 5)
  }

  private async trackBitcoin(config: any): Promise<any> {
    // Placeholder - in production, fetch from CoinGecko or similar
    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 500))

    const mockPrice = 42000 + Math.random() * 5000
    const mockChange = (Math.random() - 0.5) * 10

    return {
      price: mockPrice,
      change: mockChange,
      currency: config.currency || "USD",
    }
  }

  private async watchWebsites(config: any): Promise<any> {
    // Placeholder - in production, fetch and compare website content
    await new Promise(resolve => setTimeout(resolve, 800))

    const urls = config.urls || []
    const changed = Math.floor(Math.random() * urls.length)

    return {
      checked: urls.length,
      changed,
      changes: changed > 0 ? [{ url: urls[0], diff: "Content updated" }] : [],
    }
  }
}

// Export singleton
export const backgroundAgentsService = new BackgroundAgentsService()
