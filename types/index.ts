/**
 * Multimodal content types for vision-capable models
 */
export type MessageContent = string | MessageContentPart[]

export interface MessageContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: {
    url: string // data URL or HTTP URL
    detail?: "auto" | "low" | "high" // For GPT-4V
  }
}

/**
 * Streaming history entry for step-by-step visualization
 * Enhanced to show detailed, real-time information like Claude.ai
 */
export interface StreamingHistoryEntry {
  phase: "thinking" | "searching" | "tool_use" | "responding" | "done"
  timestamp: number
  detail?: string // e.g., search query, tool name (deprecated in favor of structured fields)
  description?: string // Human-readable description of what happened in this phase
  duration?: number // time spent in this phase (ms)

  // Enhanced detailed information (like Claude.ai/Claude Code)
  toolName?: string // Specific tool being used (e.g., "web_search", "read_file", "write_file")
  toolArguments?: Record<string, any> // Actual arguments passed to the tool
  action?: string // Specific action being performed (e.g., "Reading file: src/app.tsx")
  files?: string[] // File paths being accessed/modified
  searchQuery?: string // The actual search query being executed
  searchProvider?: string // Search provider (tavily, serper, exa)
  searchParameters?: Record<string, any> // Full search parameters
  resultCount?: number // Number of results returned
  searchResultsPreview?: string // Preview of actual search results content
  reasoningContent?: string // Real-time reasoning/thinking tokens (o1, DeepSeek R1, etc.)
  reasoningTokens?: number // Number of reasoning tokens used
}

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: MessageContent // Now supports both string and multimodal array
  timestamp: number
  imageUrl?: string // Generated image URL (for DALL-E, Stable Diffusion, etc.)
  reasoning?: string // Model's reasoning/thinking process when reasoning is enabled
  tokens?: {
    prompt: number
    completion: number
    total: number
  }
  attachments?: Attachment[] // File attachments (images, PDFs, etc.)
  stats?: {
    model?: string
    cost?: number // in USD (estimated, deprecated)
    actualCost?: number // Exact cost from OpenRouter API
    responseTime?: number // in seconds
    tokensPerSecond?: number
    firstTokenTime?: number // TTFT in seconds
    stopReason?: string
    searchTime?: number // web search time in seconds
    searchResults?: number
    searchProvider?: string
    // OpenRouter generation API data
    generationId?: string // For fetching exact costs (last generation ID, backwards compatible)
    allGenerationIds?: string[] // All generation IDs (for tool calling which creates multiple generations)
    toolCallCount?: number // Number of tool call iterations (0 = no tools, 1 = one tool call, etc.)
    provider?: string // Which provider served the request (e.g., "Together", "Anthropic")
    nativeTokensPrompt?: number // Native tokenizer count for input
    nativeTokensCompletion?: number // Native tokenizer count for output
    nativeTokensCompletionReasoning?: number // Reasoning/thinking tokens (o1, DeepSeek R1)
    cacheCreationTokens?: number // Prompt cache tokens created
    cacheReadTokens?: number // Prompt cache tokens read (savings!)
    // Actual performance from OpenRouter (not our estimate)
    actualTokensPerSecond?: number // Real TPS from OpenRouter for final response
    actualFirstTokenLatency?: number // Real TTFT from OpenRouter in seconds
    // Tool calling cost breakdown (sum of all generations)
    toolCallCost?: number // Total cost from tool call iterations
    toolCallTokensPrompt?: number // Total input tokens from tool calls
    toolCallTokensCompletion?: number // Total output tokens from tool calls
    toolCallTokensPerSecond?: number // Average TPS for tool call generations
  }
  streamingHistory?: StreamingHistoryEntry[] // History of streaming phases for verbose display
  branches?: ConversationBranch[] // Alternate conversation paths from this message
}

export interface ConversationBranch {
  id: string
  name: string
  messages: Message[]
  createdAt: number
  parentMessageId: string // The message this branch diverges from
}

export interface ConversationInsight {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  topics: string[]
  timestamp: number
  messageCount: number
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
  folderId?: string
  pinned?: boolean
  currentBranchPath?: string[] // Array of branch IDs representing the current branch path
  insights?: ConversationInsight // AI-generated conversation insights
  titleGeneratedAt?: number // Timestamp when AI generated the title (for animation)
}

export interface ChatFolder {
  id: string
  name: string
  createdAt: number
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  content?: string
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: string
  content: string
  variables?: string[]
  createdAt: number
}

export interface DocumentCollection {
  id: string
  name: string
  description: string
  documents: CollectionDocument[]
  createdAt: number
  updatedAt: number
}

export interface CollectionDocument {
  id: string
  name: string
  content: string
  type: string
  size: number
  addedAt: number
}

export interface ComparisonMode {
  enabled: boolean
  models: string[]
  layout: "2-column" | "3-column" | "4-column"
}

export interface ModelParameters {
  temperature: number
  topP: number
  topK?: number
  frequencyPenalty: number
  presencePenalty: number
  maxTokens: number
  stopSequences?: string[]
}

export interface VoiceSettings {
  enabled: boolean
  autoPlay: boolean
  voice: string
  rate: number
  pitch: number
  ttsProvider?: "browser" | "openai"
  openaiVoice?: string
}

export interface TavilySettings {
  searchDepth: "basic" | "advanced"
  maxResults: number
  includeImages: boolean
  includeAnswer: boolean
  includeDomains?: string[] // Filter to specific domains
  excludeDomains?: string[] // Block specific domains
  includeRawContent?: boolean // Get full HTML/text content
  topic?: "general" | "news" // Search focus
}

export interface SerperSettings {
  maxResults: number
  includeImages: boolean
  country: string // "at", "de", etc.
  language: string // "de", "en", etc.
  type?: "search" | "images" | "news" | "videos" | "places" | "shopping" // Search type
  timeRange?: "none" | "hour" | "day" | "week" | "month" | "year" // Time-based filtering (tbs parameter)
  autocorrect?: boolean // Enable/disable autocorrect
  page?: number // Pagination
}

export interface ExaSettings {
  maxResults: number // 1-100
  searchType: "neural" | "keyword" | "auto" // Search method
  useAutoprompt: boolean // Let Exa optimize query
  category?: "company" | "research paper" | "news" | "pdf" | "github" | "tweet" | "personal site" | "linkedin profile" | "financial report"
  includeFullText: boolean // Get full page content
  includeHighlights: boolean // Get relevant snippets
  includeSummary: boolean // Get AI-generated summary
  includeImages: boolean // Include images from results in response
  highlightsPerResult: number // Number of highlight sentences
  maxTextCharacters: number // Limit text length
  livecrawl: "never" | "fallback" | "always" // Fresh content crawling
  includeDomains?: string[] // Only search these domains
  excludeDomains?: string[] // Exclude these domains
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: string
  description: string
}

export interface UsageStats {
  totalTokens: number
  totalCost: number
  messageCount: number
  modelUsage: Record<string, number>
  lastUpdated: number
}

/**
 * Streaming Visualization Settings
 * Fine-grained control over what streaming details to display (Advanced Mode only)
 */
export interface StreamingVisualizationSettings {
  // Core Information
  showCurrentAction?: boolean // Show what the AI is currently doing
  showToolParameters?: boolean // Show exact tool arguments
  showSearchProvider?: boolean // Show search provider and parameters

  // Search & Results
  showSearchResults?: boolean // Show preview of actual search results content
  showResultSummary?: boolean // Show result counts and summaries

  // Reasoning & Thinking
  showReasoningTokens?: boolean // Show reasoning/thinking process (o1, DeepSeek R1)
  showExtendedThinking?: boolean // Show extended thinking indicators

  // Performance Metrics (Real-time & Post-completion)
  showDetailedStats?: boolean // Show detailed stats at end of message (tokens, cost, performance, search)
  showTokenUsage?: boolean // Show real-time token counts during streaming
  showLatencyMetrics?: boolean // Show time to first token (TTFT)
  showStreamingSpeed?: boolean // Show tokens/second and characters/second
  showCostEstimates?: boolean // Show real-time cost tracking during streaming

  // Context & Progress
  showContextUsage?: boolean // Show percentage of context window used
  showProgressIndicators?: boolean // Show progress bars and estimates
  showEstimatedTime?: boolean // Show estimated time remaining

  // Advanced Details
  showModelInfo?: boolean // Show model name and provider
  showGenerationId?: boolean // Show generation ID for tracking
  showCacheStatus?: boolean // Show prompt cache hits
  showRetryAttempts?: boolean // Show retry attempts on failures
  showToolChains?: boolean // Show sequence of multiple tool calls

  // Warnings & Errors
  showRateLimitWarnings?: boolean // Show when approaching rate limits
  showErrorDetails?: boolean // Show detailed error information

  // Timing & Duration
  showPhaseDurations?: boolean // Show how long each phase took
  showTimestamps?: boolean // Show timestamps for each event
}

export interface StatsDisplaySettings {
  // Which stats sections to show (all default to true)
  showReasoning?: boolean // 🧠 Reasoning tokens (for o1/DeepSeek R1)
  showCache?: boolean // 💾 Prompt cache stats
  showNativeTokens?: boolean // 📏 Native tokenizer counts
  showPerformance?: boolean // ⚡ Response time, TTFT, tokens/sec
  showGeneration?: boolean // 🎛️ Model, provider, stop reason
  showSearch?: boolean // 🔍 Web search stats
  showEfficiency?: boolean // 📈 Cost per token, chars/token
  // Default expand state
  defaultExpandReasoning?: boolean // Auto-expand reasoning section
  defaultExpandCache?: boolean // Auto-expand cache section
}

export interface ExperimentalSettings {
  // Response Analysis
  enableResponseAnalysis?: boolean
  // Performance Mode: Disable GPU-intensive effects (chameleon color-shift, memory blink, etc.)
  performanceMode?: boolean
  // Streaming Visualization (Advanced Mode only)
  streamingVisualization?: StreamingVisualizationSettings
  // Detailed Streaming: Show all steps, progress bar, sub-steps (default: false - only show action + reasoning)
  showDetailedStreaming?: boolean
  // Tool Settings (for AI tool calling)
  enableUrlFetchTool?: boolean // Allow AI to fetch and read URL content
  enableYouTubeTool?: boolean // Allow AI to extract YouTube video transcripts
  enableWeatherTool?: boolean // Allow AI to get weather information and forecasts
  // Stats Display Settings
  statsDisplay?: StatsDisplaySettings
  // Rich Content Settings (Advanced Mode only)
  enableMermaidDiagrams?: boolean // Render Mermaid diagrams in code blocks (default: false)
  enableCodeBlockHighlighting?: boolean // Syntax highlighting for code blocks (default: false)
  showInputStats?: boolean // Show token/cost estimate below chat input
}

// Access tier determines user privileges and UI restrictions
export type AccessTier = "standard" | "hifi"

export interface AppSettings {
  theme?: "light" | "dark"
  language?: "en" | "de" | "es" // UI language: English, German, or Spanish
  simpleMode?: boolean // Simple Mode: Clean UI focused on personas & profile
  accessTier?: AccessTier // Access tier: standard (default) or hifi (team-only)
  enableAutoToolUse?: boolean // Enable automatic tool use (web search, weather, etc.) via tool calling (AI decides when to use tools)
  apiKeys: {
    openRouter?: string
    openAI?: string
    tavily?: string
    serper?: string
    exa?: string
  }
  selectedModel: string
  defaultModel?: string // User's custom default model for new chats (Advanced Mode setting)
  selectedModels?: string[] // Array of user's selected OpenRouter models (persisted to database)
  selectedPersona?: import("@/lib/personas").Persona // Currently selected persona
  customPersonas?: import("@/lib/personas").Persona[] // User-created custom personas (persisted to database)
  temperature?: number
  maxTokens?: number
  systemPrompt: string
  searchProvider?: "tavily" | "serper" | "exa" // Which search API to use
  modelParameters?: ModelParameters
  voiceSettings?: VoiceSettings
  tavilySettings?: TavilySettings
  serperSettings?: SerperSettings
  exaSettings?: ExaSettings
  comparisonMode?: ComparisonMode
  memorySettings?: MemorySettings
  shopifySettings?: ShopifySettings // HiFi mode: Shopify store connection
  fontSize?: "small" | "medium" | "large"
  fontFamily?: "inter" | "roboto" | "atkinson" | "opendyslexic" | "jetbrains" | "system"
  messageDensity?: "compact" | "comfortable" | "spacious"
  sidebarPosition?: "left" | "right"
  codeTheme?: "github-dark" | "github-light" | "monokai" | "dracula"
  enableKeyboardShortcuts?: boolean
  showDetailedStats?: boolean // Show detailed LLM stats (tokens, cost, performance)
  useExaSearch?: boolean // Use Exa semantic search via OpenRouter :online
  experimental?: ExperimentalSettings // Experimental features
}

export interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface SystemPrompt {
  id: string
  name: string
  description: string
  prompt: string
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

export interface ComparisonSession {
  id: string
  models: string[]
  messages: any[]
  timestamp: number
}

export interface ComparisonPanel {
  model: string
  messages: Message[]
}

export interface Memory {
  id: string
  type: "preference" | "fact" | "context" | "skill" | "goal"
  content: string
  category?: string
  importance: 1 | 2 | 3 // 1=low, 2=medium, 3=high
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  source?: string // Which chat it came from
  metadata?: Record<string, any>
  embedding?: number[] // Vector embedding for semantic search (1536 dimensions)
}

export interface MemorySettings {
  enabled: boolean
  autoExtract: boolean // Automatically extract memories from conversations
  maxMemoriesInContext: number // How many memories to include in prompts (default 5)
  importanceThreshold: 1 | 2 | 3 // Minimum importance to include (default 2)
  syncToDatabase: boolean // Save memories to Supabase for cross-device sync (less private)
  // Semantic search settings
  useSemanticSearch?: boolean // Use embedding-based retrieval (default true when syncToDatabase)
  similarityThreshold?: number // 0.0-1.0, default 0.5 - minimum similarity to include memory
  // Phase 3: Intelligent retrieval settings
  classificationConfidence?: number // 0.0-1.0, default 0.8 - minimum confidence to trust classification
  minRelevanceScore?: number // 0.0-1.0, default 0.3 - if best match below this, skip all memories
  alwaysRetrieveForPersonas?: boolean // Override classification for persona chats (default true)
}

export interface ShopifySettings {
  storeUrl?: string // e.g., "my-store.myshopify.com"
  accessToken?: string // Shopify Admin API access token
}
