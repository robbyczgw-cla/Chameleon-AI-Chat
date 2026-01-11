"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ArrowSquareOut, BookOpen, Brain, CaretDown, CaretUp, Chat, Check, CheckSquare, CircleNotch, Clock, Cloud, Code, Database, Download, FileText, FolderOpen, GearSix, GitBranch, Globe, GridNine, Lightning, MagnifyingGlass, MusicNote, Play, Plus, PuzzlePiece, Sparkle, Terminal, Trash, Upload, VideoCamera, WarningCircle } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast"

// MCP HardDrives configuration type
export interface MCPServerConfig {
  id: string
  name: string
  command: string
  args?: string
  env?: Record<string, string>
  status?: "connected" | "disconnected" | "connecting"
  enabled?: boolean
  description?: string
  category?: string
}

// Extended preset MCP servers for one-click add
const PRESET_MCP_SERVERS: Omit<MCPServerConfig, "id" | "status">[] = [
  // Core & Essential
  {
    name: "Filesystem",
    command: "npx",
    args: "-y @modelcontextprotocol/server-filesystem /path/to/allowed/directory",
    description: "Secure file operations with configurable access controls",
    category: "Core",
    enabled: true,
  },
  {
    name: "Memory",
    command: "npx",
    args: "-y @modelcontextprotocol/server-memory",
    description: "Knowledge graph-based persistent memory system",
    category: "Core",
    enabled: true,
  },
  {
    name: "Sequential Thinking",
    command: "npx",
    args: "-y @modelcontextprotocol/server-sequential-thinking",
    description: "Dynamic problem-solving through thought sequences",
    category: "Core",
    enabled: true,
  },

  // Search & Web
  {
    name: "Brave Search",
    command: "npx",
    args: "-y @anthropic/mcp-server-brave-search",
    env: { BRAVE_API_KEY: "your-brave-api-key" },
    description: "Web & local search with privacy-focused Brave Search API",
    category: "Search",
    enabled: true,
  },
  {
    name: "Exa Search",
    command: "npx",
    args: "-y @anthropic/mcp-server-exa",
    env: { EXA_API_KEY: "your-exa-api-key" },
    description: "Neural semantic search for finding related content",
    category: "Search",
    enabled: true,
  },
  {
    name: "Fetch",
    command: "npx",
    args: "-y @modelcontextprotocol/server-fetch",
    description: "Web content fetching and conversion for LLM usage",
    category: "Web",
    enabled: true,
  },
  {
    name: "Puppeteer",
    command: "npx",
    args: "-y @modelcontextprotocol/server-puppeteer",
    description: "Browser automation and web scraping",
    category: "Web",
    enabled: true,
  },

  // Development & Code
  {
    name: "Git",
    command: "npx",
    args: "-y @modelcontextprotocol/server-git",
    description: "Read, search, and manipulate Git repositories",
    category: "Development",
    enabled: true,
  },
  {
    name: "GitHub",
    command: "npx",
    args: "-y @anthropic/mcp-server-github",
    env: { GITHUB_TOKEN: "your-github-token" },
    description: "GitHub repository management and search",
    category: "Development",
    enabled: true,
  },
  {
    name: "E2B Code Interpreter",
    command: "npx",
    args: "-y @anthropic/mcp-server-e2b",
    env: { E2B_API_KEY: "your-e2b-api-key" },
    description: "Execute Python code in secure sandboxed environment",
    category: "Development",
    enabled: true,
  },
  {
    name: "Linear",
    command: "npx",
    args: "-y @anthropic/mcp-server-linear",
    env: { LINEAR_API_KEY: "your-linear-api-key" },
    description: "Issue tracking and project management",
    category: "Development",
    enabled: true,
  },

  // Databases
  {
    name: "PostgreSQL",
    command: "npx",
    args: "-y @modelcontextprotocol/server-postgres postgres://<username>:<password>@localhost/<database>",
    description: "PostgreSQL database read-only access",
    category: "Database",
    enabled: true,
  },
  {
    name: "SQLite",
    command: "npx",
    args: "-y @modelcontextprotocol/server-sqlite /path/to/database.db",
    description: "SQLite database query and inspection",
    category: "Database",
    enabled: true,
  },

  // Productivity & Notes
  {
    name: "Notion",
    command: "npx",
    args: "-y @anthropic/mcp-server-notion",
    env: { NOTION_API_KEY: "your-notion-api-key" },
    description: "Access and search Notion pages and databases",
    category: "Productivity",
    enabled: true,
  },
  {
    name: "Obsidian",
    command: "npx",
    args: "-y @anthropic/mcp-server-obsidian /path/to/vault",
    description: "Read and search Obsidian vault notes",
    category: "Productivity",
    enabled: true,
  },
  {
    name: "Todoist",
    command: "npx",
    args: "-y @anthropic/mcp-server-todoist",
    env: { TODOIST_API_TOKEN: "your-todoist-token" },
    description: "Task management and to-do lists",
    category: "Productivity",
    enabled: true,
  },

  // Communication
  {
    name: "Slack",
    command: "npx",
    args: "-y @modelcontextprotocol/server-slack",
    env: { SLACK_TOKEN: "your-slack-token" },
    description: "Channel management and messaging",
    category: "Communication",
    enabled: true,
  },

  // Storage & Cloud
  {
    name: "Google Drive",
    command: "npx",
    args: "-y @anthropic/mcp-server-google-drive",
    description: "Search and read from Google Drive",
    category: "Storage",
    enabled: true,
  },
  {
    name: "AWS S3",
    command: "npx",
    args: "-y @anthropic/mcp-server-aws-s3",
    env: { AWS_ACCESS_KEY_ID: "your-key", AWS_SECRET_ACCESS_KEY: "your-secret" },
    description: "AWS S3 bucket access and file operations",
    category: "Storage",
    enabled: true,
  },

  // Media
  {
    name: "YouTube Transcript",
    command: "npx",
    args: "-y @anthropic/mcp-server-youtube",
    description: "Fetch transcripts and metadata from YouTube videos",
    category: "Media",
    enabled: true,
  },
  {
    name: "Spotify",
    command: "npx",
    args: "-y @anthropic/mcp-server-spotify",
    env: { SPOTIFY_CLIENT_ID: "your-client-id", SPOTIFY_CLIENT_SECRET: "your-secret" },
    description: "Search and control Spotify playback",
    category: "Media",
    enabled: true,
  },

  // Utilities
  {
    name: "Time",
    command: "npx",
    args: "-y @modelcontextprotocol/server-time",
    description: "Time and timezone conversion capabilities",
    category: "Utilities",
    enabled: true,
  },
  {
    name: "Weather",
    command: "npx",
    args: "-y @anthropic/mcp-server-weather",
    env: { OPENWEATHER_API_KEY: "your-api-key" },
    description: "Current weather and forecasts",
    category: "Utilities",
    enabled: true,
  },

]

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Core: <Lightning className="h-4 w-4" />,
  Search: <MagnifyingGlass className="h-4 w-4" />,
  Development: <Code className="h-4 w-4" />,
  Web: <Globe className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  Utilities: <GearSix className="h-4 w-4" />,
  Communication: <Chat className="h-4 w-4" />,
  Storage: <Cloud className="h-4 w-4" />,
  Productivity: <CheckSquare className="h-4 w-4" />,
  Media: <VideoCamera className="h-4 w-4" />,
}

const MCP_STORAGE_KEY = "chameleon-mcp-servers"

export function MCPSettings() {
  const [mcpServers, setMcpServers] = useState<MCPServerConfig[]>([])
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [showPresets, setShowPresets] = useState(true)
  const [newServerName, setNewServerName] = useState("")
  const [newServerCommand, setNewServerCommand] = useState("")
  const [newServerArgs, setNewServerArgs] = useState("")
  const [mcpEnabled, setMcpEnabled] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Load MCP servers from localStorage
  useEffect(() => {
    const savedServers = localStorage.getItem(MCP_STORAGE_KEY)
    if (savedServers) {
      try {
        const parsed = JSON.parse(savedServers)
        setMcpServers(parsed.servers || [])
        setMcpEnabled(parsed.enabled ?? false)
      } catch (e) {
        console.error("[MCP] Failed to load servers:", e)
      }
    }
  }, [])

  // Save MCP servers to localStorage
  const saveMcpServers = (servers: MCPServerConfig[], enabled?: boolean) => {
    setMcpServers(servers)
    const enabledValue = enabled !== undefined ? enabled : mcpEnabled
    localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify({ servers, enabled: enabledValue }))
  }

  const handleAddCustomServer = () => {
    if (!newServerName.trim() || !newServerCommand.trim()) return

    const newServer: MCPServerConfig = {
      id: `mcp-custom-${Date.now()}`,
      name: newServerName.trim(),
      command: newServerCommand.trim(),
      args: newServerArgs.trim() || undefined,
      status: "disconnected",
      enabled: true,
    }

    saveMcpServers([...mcpServers, newServer])
    setNewServerName("")
    setNewServerCommand("")
    setNewServerArgs("")
    setShowAddCustom(false)

    toast({
      title: "HardDrives Added",
      description: `${newServer.name} has been added to your MCP servers.`,
    })
  }

  const handleAddPreset = (preset: Omit<MCPServerConfig, "id" | "status">) => {
    // Check if already added
    const existing = mcpServers.find(s => s.name === preset.name)
    if (existing) {
      toast({
        title: "Already Added",
        description: `${preset.name} is already in your server list.`,
        variant: "destructive",
      })
      return
    }

    const newServer: MCPServerConfig = {
      ...preset,
      id: `mcp-preset-${Date.now()}`,
      status: "disconnected",
    }

    saveMcpServers([...mcpServers, newServer])

    toast({
      title: "HardDrives Added",
      description: `${preset.name} has been added. Configure any required API keys.`,
    })
  }

  const handleRemoveServer = (serverId: string) => {
    const server = mcpServers.find(s => s.id === serverId)
    saveMcpServers(mcpServers.filter(s => s.id !== serverId))
    toast({
      title: "HardDrives Removed",
      description: server?.name || "HardDrives removed",
    })
  }

  const handleToggleServer = (serverId: string) => {
    saveMcpServers(mcpServers.map(s =>
      s.id === serverId ? { ...s, enabled: !s.enabled } : s
    ))
  }

  const handleTestServer = async (serverId: string) => {
    // Update status to connecting
    saveMcpServers(mcpServers.map(s =>
      s.id === serverId ? { ...s, status: "connecting" as const } : s
    ))

    // Simulate connection test (in production, this would actually spawn the process and test)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // For demo purposes, mark as connected
    saveMcpServers(mcpServers.map(s =>
      s.id === serverId ? { ...s, status: "connected" as const } : s
    ))

    const server = mcpServers.find(s => s.id === serverId)
    toast({
      title: "Connection Test",
      description: `${server?.name || "HardDrives"} connection simulated (full implementation requires backend).`,
    })
  }

  const handleMcpToggle = (enabled: boolean) => {
    setMcpEnabled(enabled)
    localStorage.setItem(MCP_STORAGE_KEY, JSON.stringify({ servers: mcpServers, enabled }))
    toast({
      title: enabled ? "MCP Enabled" : "MCP Disabled",
      description: enabled
        ? "Model Context Protocol is now active."
        : "MCP servers will not be used.",
    })
  }

  // Export config as JSON
  const handleExport = () => {
    const config = {
      version: 1,
      enabled: mcpEnabled,
      servers: mcpServers.map(({ id, status, ...rest }) => rest), // Remove runtime fields
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chameleon-mcp-config-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Config Exported",
      description: "MCP configuration has been downloaded.",
    })
  }

  // Import config from JSON
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)

        if (!config.servers || !Array.isArray(config.servers)) {
          throw new Error("Invalid config format")
        }

        // Merge imported servers (avoid duplicates by name)
        const existingNames = new Set(mcpServers.map(s => s.name))
        const newServers = config.servers
          .filter((s: MCPServerConfig) => !existingNames.has(s.name))
          .map((s: Omit<MCPServerConfig, "id" | "status">) => ({
            ...s,
            id: `mcp-imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            status: "disconnected" as const,
          }))

        if (newServers.length === 0) {
          toast({
            title: "No New Servers",
            description: "All servers in the config already exist.",
          })
          return
        }

        saveMcpServers([...mcpServers, ...newServers], config.enabled ?? mcpEnabled)
        setMcpEnabled(config.enabled ?? mcpEnabled)

        toast({
          title: "Config Imported",
          description: `Added ${newServers.length} new MCP server(s).`,
        })
      } catch (error) {
        console.error("[MCP] Import error:", error)
        toast({
          title: "Import Failed",
          description: "Invalid config file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // Reset file input
    event.target.value = ""
  }

  const addedServerNames = new Set(mcpServers.map(s => s.name))

  // Get unique categories
  const categories = Array.from(new Set(PRESET_MCP_SERVERS.map(s => s.category || "Other")))

  // Filter presets by category
  const filteredPresets = categoryFilter
    ? PRESET_MCP_SERVERS.filter(s => s.category === categoryFilter)
    : PRESET_MCP_SERVERS

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* MCP Info & Enable Toggle */}
      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <PuzzlePiece className="h-5 w-5 text-violet-500 flex-shrink-0" />
              <h3 className="font-semibold text-sm sm:text-base">Model Context Protocol</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Connect AI to external tools and services.
            </p>
          </div>
          <Switch
            checked={mcpEnabled}
            onCheckedChange={handleMcpToggle}
            className="flex-shrink-0"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
          <a
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
          >
            Learn more <ArrowSquareOut className="h-3 w-3" />
          </a>
          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
          <a
            href="https://github.com/modelcontextprotocol/servers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
          >
            Official Servers <ArrowSquareOut className="h-3 w-3" />
          </a>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
          Web deployment uses remote MCP servers or proxy services. Local npx servers require self-hosted deployment.
        </p>
      </div>

      {/* Import/Export Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10"
          onClick={handleExport}
          disabled={mcpServers.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {/* Active Servers */}
      {mcpServers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Active Servers ({mcpServers.length})</h4>
          </div>
          <div className="space-y-2">
            {mcpServers.map((server) => (
              <div
                key={server.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all",
                  server.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    server.enabled
                      ? "bg-gradient-to-br from-violet-500/20 to-purple-500/20"
                      : "bg-muted"
                  )}>
                    {CATEGORY_ICONS[server.category || "Core"] || <PuzzlePiece className="h-5 w-5 text-violet-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{server.name}</p>
                      {server.category && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {server.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-mono">
                      {server.command} {server.args}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 pl-13 sm:pl-0">
                  {/* Status indicator */}
                  <div className="flex items-center gap-1.5">
                    {server.status === "connecting" ? (
                      <CircleNotch className="h-3.5 w-3.5 text-yellow-500 animate-spin" />
                    ) : server.status === "connected" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <WarningCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  {/* Toggle */}
                  <Switch
                    checked={server.enabled}
                    onCheckedChange={() => handleToggleServer(server.id)}
                    className="scale-75"
                  />
                  {/* Test button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-8 sm:w-8"
                    onClick={() => handleTestServer(server.id)}
                    disabled={server.status === "connecting" || !server.enabled}
                    title="Test connection"
                  >
                    <Play className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveServer(server.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom HardDrives */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-11"
          onClick={() => setShowAddCustom(!showAddCustom)}
        >
          {showAddCustom ? <CaretUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Add Custom HardDrives
        </Button>

        {showAddCustom && (
          <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <Label htmlFor="server-name" className="text-sm">HardDrives Name</Label>
              <Input
                id="server-name"
                placeholder="My Custom HardDrives"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="server-command" className="text-sm">Command</Label>
              <Input
                id="server-command"
                placeholder="npx -y @modelcontextprotocol/server-xxx"
                value={newServerCommand}
                onChange={(e) => setNewServerCommand(e.target.value)}
                className="h-11 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="server-args" className="text-sm">Arguments (optional)</Label>
              <Input
                id="server-args"
                placeholder="/path/to/directory or connection-string"
                value={newServerArgs}
                onChange={(e) => setNewServerArgs(e.target.value)}
                className="h-11 font-mono text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="default"
                className="flex-1 h-11"
                onClick={() => {
                  setShowAddCustom(false)
                  setNewServerName("")
                  setNewServerCommand("")
                  setNewServerArgs("")
                }}
              >
                Cancel
              </Button>
              <Button
                size="default"
                className="flex-1 h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                onClick={handleAddCustomServer}
                disabled={!newServerName.trim() || !newServerCommand.trim()}
              >
                Add HardDrives
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Servers */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-11"
          onClick={() => setShowPresets(!showPresets)}
        >
          {showPresets ? <CaretUp className="h-4 w-4" /> : <CaretDown className="h-4 w-4" />}
          Browse Popular Servers ({PRESET_MCP_SERVERS.length})
        </Button>

        {showPresets && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            {/* Category Filter */}
            <div className="flex gap-1.5 flex-wrap">
              <Button
                variant={categoryFilter === null ? "default" : "outline"}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setCategoryFilter(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs gap-1"
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                >
                  {CATEGORY_ICONS[cat]}
                  <span className="hidden sm:inline">{cat}</span>
                </Button>
              ))}
            </div>

            {/* Preset Grid */}
            <div className="grid gap-2">
              {filteredPresets.map((preset, index) => {
                const isAdded = addedServerNames.has(preset.name)
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all",
                      isAdded ? "bg-green-500/5 border-green-500/30" : "bg-card hover:border-violet-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 flex items-center justify-center flex-shrink-0">
                        {CATEGORY_ICONS[preset.category || "Core"] || <PuzzlePiece className="h-5 w-5 text-violet-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{preset.name}</p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {preset.category}
                          </Badge>
                          {preset.env && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-yellow-600">
                              API Key
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={isAdded ? "ghost" : "secondary"}
                      size="sm"
                      className={cn(
                        "flex-shrink-0 h-10 sm:h-8 w-full sm:w-auto",
                        isAdded && "text-green-600"
                      )}
                      onClick={() => !isAdded && handleAddPreset(preset)}
                      disabled={isAdded}
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {mcpServers.length === 0 && !showPresets && (
        <div className="text-center py-8 text-muted-foreground">
          <PuzzlePiece className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No MCP servers configured</p>
          <p className="text-xs mt-1">Add a server from the presets or create a custom one</p>
        </div>
      )}
    </div>
  )
}
