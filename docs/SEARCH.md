# Web Search in Chameleon AI Chat

Chameleon AI Chat supports multiple web search providers to give AI models access to current, real-time information. This document covers setup, configuration, and usage for both end users and developers.

## Quick Start

**New users**: You can start using web search immediately with just your OpenRouter API key - no additional setup required! OpenRouter search is enabled by default.

## Search Providers

| Provider | API Key Required | Cost | Best For |
|----------|-----------------|------|----------|
| **OpenRouter** | No (uses OpenRouter key) | ~$0.02/search | Getting started, no extra setup |
| **Serper** | Yes (free tier: 2,500/month) | $0.001/search | Google search results |
| **Tavily** | Yes (free tier: 1,000/month) | $0.001/search | AI-optimized search with summaries |
| **Exa** | Yes (free tier: 1,000/month) | $0.0005/search | Neural/semantic search |

---

## OpenRouter Search (Default)

OpenRouter search uses OpenRouter's native web search plugin, which requires no additional API key.

### How It Works

1. **For OpenAI, Anthropic, Perplexity, xAI models**: Uses the provider's native search capabilities
2. **For other models (Google, DeepSeek, etc.)**: Uses Exa search via OpenRouter (~$0.02 per 5-result search)

### Configuration

In Settings > Search:
- Select "OpenRouter (No extra key needed)"
- Adjust max results (1-10)
- Toggle image inclusion
- Toggle citation inclusion

### Technical Details

OpenRouter search uses the `plugins` parameter:
```json
{
  "model": "google/gemini-2.0-flash-001",
  "plugins": [
    {
      "id": "web",
      "max_results": 5
    }
  ]
}
```

See: [OpenRouter Web Search Documentation](https://openrouter.ai/docs/guides/features/plugins/web-search)

---

## Serper (Google Search)

Serper provides Google search results through a simple API.

### Setup

1. Get a free API key at [serper.dev](https://serper.dev)
2. In Settings > Search, select "Google via Serper"
3. Enter your API key

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| Max Results | Number of results (1-10) | 5 |
| Country | Search region (e.g., "us", "de", "at") | "at" |
| Language | Result language (e.g., "en", "de") | "de" |
| Time Range | Filter by recency (hour/day/week/month/year) | none |
| Include Images | Return image results | false |

### Features

- Google search results with snippets
- Knowledge graph information
- Answer boxes when available
- Image search support

---

## Tavily (AI-Optimized Search)

Tavily is designed specifically for AI applications with built-in answer extraction.

### Setup

1. Get a free API key at [tavily.com](https://tavily.com)
2. In Settings > Search, select "Tavily (AI-optimized search)"
3. Enter your API key

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| Max Results | Number of results (1-20) | 5 |
| Search Depth | "basic" (fast) or "advanced" (thorough) | "basic" |
| Include Answer | AI-generated summary | true |
| Include Images | Return relevant images | false |
| Topic | "general" or "news" | "general" |

### Features

- AI-generated answer summaries
- Relevance scoring
- Domain filtering (include/exclude)
- News-specific search mode

---

## Exa (Neural Search)

Exa uses neural networks for semantic understanding of queries.

### Setup

1. Get an API key at [exa.ai](https://exa.ai)
2. In Settings > Search, select "Exa (Neural search)"
3. Enter your API key

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| Max Results | Number of results (1-100) | 5 |
| Search Type | "neural", "keyword", or "auto" | "auto" |
| Use Autoprompt | Let Exa optimize query | true |
| Include Full Text | Get full page content | true |
| Include Highlights | Get relevant snippets | true |
| Livecrawl | Fresh content: "never"/"fallback"/"always" | "fallback" |

### Features

- Semantic search understanding
- Full text extraction
- Highlight extraction
- Live crawling for fresh content
- Category filtering (news, research papers, GitHub, etc.)

---

## Provider Comparison: Advantages & Disadvantages

### OpenRouter Search

| Advantages | Disadvantages |
|------------|---------------|
| ✅ **No extra API key** - works with your existing OpenRouter key | ❌ **Higher cost** - ~$0.02/search vs $0.001 for others |
| ✅ **Zero setup** - enabled by default, ready immediately | ❌ **Less control** - fewer configuration options |
| ✅ **Unified billing** - all costs on one OpenRouter invoice | ❌ **Indirect search** - results come via LLM, not raw API |
| ✅ **Model flexibility** - uses native search for supported providers | ❌ **Variable quality** - depends on model used for search |
| ✅ **Fallback support** - automatic retry with different models | ❌ **Slower** - requires full LLM inference for each search |

**Best for**: New users, quick setup, users who don't want multiple API accounts

### Serper (Google Search)

| Advantages | Disadvantages |
|------------|---------------|
| ✅ **Google results** - same quality as Google Search | ❌ **Requires API key** - separate account needed |
| ✅ **Generous free tier** - 2,500 searches/month free | ❌ **No AI summaries** - raw results only |
| ✅ **Very cheap** - $0.001/search after free tier | ❌ **Less semantic** - keyword-based matching |
| ✅ **Knowledge graph** - rich structured data | ❌ **US-centric** - best results for English queries |
| ✅ **Fast** - direct API, no LLM overhead | |
| ✅ **Regional search** - country and language options | |

**Best for**: Users who want Google-quality results, high-volume searchers, news and current events

### Tavily (AI-Optimized)

| Advantages | Disadvantages |
|------------|---------------|
| ✅ **AI-generated summaries** - pre-processed answers | ❌ **Smaller free tier** - 1,000 searches/month |
| ✅ **Built for AI** - optimized for LLM consumption | ❌ **Requires API key** - separate account needed |
| ✅ **Relevance scoring** - ranked by actual relevance | ❌ **Limited regions** - less international coverage |
| ✅ **Domain filtering** - include/exclude specific sites | ❌ **Advanced mode slower** - thorough search takes time |
| ✅ **News mode** - specialized for news queries | |
| ✅ **Clean content** - extracts main content, removes ads | |

**Best for**: Research tasks, users who want pre-summarized results, AI agent workflows

### Exa (Neural Search)

| Advantages | Disadvantages |
|------------|---------------|
| ✅ **Semantic understanding** - finds conceptually similar content | ❌ **Smaller free tier** - 1,000 searches/month |
| ✅ **Full text extraction** - complete page content | ❌ **Requires API key** - separate account needed |
| ✅ **Live crawling** - freshest content available | ❌ **Can be slow** - especially with livecrawl enabled |
| ✅ **Highlights** - extracts most relevant passages | ❌ **Less predictable** - neural search can miss obvious matches |
| ✅ **High result limit** - up to 100 results | ❌ **Overkill for simple queries** - best for complex searches |
| ✅ **Category filtering** - papers, GitHub, news, etc. | |
| ✅ **Cheapest** - $0.0005/search | |

**Best for**: Research, finding similar content, technical documentation, academic papers

### Quick Decision Guide

| Use Case | Recommended Provider |
|----------|---------------------|
| **Just getting started** | OpenRouter |
| **Highest volume (>1000/month)** | Serper |
| **Research and summaries** | Tavily |
| **Technical/academic content** | Exa |
| **News and current events** | Serper or Tavily (news mode) |
| **Finding similar content** | Exa |
| **Minimal setup** | OpenRouter |
| **Lowest cost per search** | Exa ($0.0005) or Serper ($0.001) |
| **Best Google results** | Serper |

---

## How Search Works

### Auto Tool Use (Recommended)

When "Auto Search" is enabled in Settings:

1. You send a message to the AI
2. The AI decides if web search would help answer your question
3. If yes, it automatically searches and incorporates results
4. You see the response with cited sources

**Example**: "What's the latest news about SpaceX?"
- AI triggers search automatically
- Results are incorporated into the response
- Sources are cited

### Manual Search

Click the search icon in the chat input to manually trigger a search before sending your message.

---

## Developer Documentation

### API Endpoints

#### POST `/api/chat`

The main chat endpoint supports web search via tool calling.

**Request body for search-enabled chat:**
```typescript
{
  messages: Message[],
  model: string,
  enableAutoToolUse: true,
  searchProvider: "openrouter" | "tavily" | "serper" | "exa",
  searchApiKey?: string, // Not needed for OpenRouter
  searchSettings?: {
    maxResults?: number,
    // Provider-specific settings...
  },
  openRouterSearchSettings?: {
    maxResults?: number,
    searchModel?: string,
    includeImages?: boolean,
    includeCitations?: boolean
  }
}
```

#### POST `/api/openrouter-search`

Direct search endpoint using OpenRouter's web plugin.

**Request:**
```typescript
{
  query: string,
  maxResults?: number,       // Default: 5
  searchModel?: string,      // Default: "google/gemini-2.0-flash-001"
  includeCitations?: boolean // Default: true
}
```

**Response:**
```typescript
{
  results: Array<{
    title: string,
    url: string,
    content: string,
    score: number
  }>,
  answer: string,
  provider: "openrouter",
  model: string
}
```

#### POST `/api/search` (Tavily)

Direct Tavily search endpoint.

#### POST `/api/serper` (Serper)

Direct Serper/Google search endpoint.

#### POST `/api/exa` (Exa)

Direct Exa neural search endpoint.

### Search Types

```typescript
// lib/search/types.ts

type SearchProvider = "openrouter" | "tavily" | "serper" | "exa"

interface SearchResponse {
  query: string
  answer?: string
  results: SearchResult[]
  images?: string[]
  responseTime: number
  provider: SearchProvider
}

interface SearchResult {
  title: string
  url: string
  content: string
  score?: number
  publishedDate?: string
  highlights?: string[]
}
```

### Settings Types

```typescript
// types/index.ts

interface OpenRouterSearchSettings {
  maxResults: number        // 1-10
  searchModel: string       // e.g., "perplexity/sonar"
  includeImages: boolean
  includeCitations: boolean
}

interface TavilySettings {
  searchDepth: "basic" | "advanced"
  maxResults: number        // 1-20
  includeImages: boolean
  includeAnswer: boolean
  topic: "general" | "news"
}

interface SerperSettings {
  maxResults: number        // 1-10
  includeImages: boolean
  country: string           // e.g., "us", "de"
  language: string          // e.g., "en", "de"
  timeRange: "none" | "hour" | "day" | "week" | "month" | "year"
}

interface ExaSettings {
  maxResults: number        // 1-100
  searchType: "neural" | "keyword" | "auto"
  useAutoprompt: boolean
  includeFullText: boolean
  includeHighlights: boolean
  livecrawl: "never" | "fallback" | "always"
}
```

### Adding a New Search Provider

1. Add the provider to `SearchProvider` type in `lib/search/types.ts`
2. Create settings interface in `types/index.ts`
3. Add default settings in `contexts/app-context.tsx` and `contexts/settings-context.tsx`
4. Implement the search function in `app/api/chat/route.ts`
5. Add UI in `components/simple-settings-dialog.tsx`
6. Update `components/simple-chat-input.tsx` to handle the new provider

### Caching

Search results are cached for 5 minutes to reduce duplicate API calls:

```typescript
const searchCache = new Map<string, { result: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
```

### Cost Tracking

Search costs are tracked in the cost tracker:

```typescript
// lib/cost-tracker.ts
interface CostEntry {
  searchProvider?: string
  searchCost?: number
}
```

Estimated costs per search:
- OpenRouter (Exa): ~$0.02/search
- Tavily: ~$0.001/search
- Serper: ~$0.0002/search
- Exa: ~$0.0005/search

---

## Troubleshooting

### "No search API key configured"

- **OpenRouter**: Make sure you have a valid OpenRouter API key in Settings > API
- **Other providers**: Add the specific provider's API key in Settings > Search

### Search not triggering

1. Check that "Auto Search" is enabled in Settings > Search
2. Verify the selected model supports tool calling
3. Try a query that clearly needs current information (e.g., "What's the weather today?")

### Slow search results

- Exa's livecrawl can be slow - set to "never" or "fallback"
- Tavily's "advanced" depth takes longer - use "basic" for faster results
- OpenRouter search depends on the selected model's speed

### Rate limiting

Each provider has rate limits:
- OpenRouter: Based on your OpenRouter plan
- Serper: 2,500 free searches/month
- Tavily: 1,000 free searches/month
- Exa: 1,000 free searches/month

---

## Security Considerations

- API keys are stored securely (in Supabase for logged-in users, localStorage for guests)
- Search queries are sent to third-party APIs
- Consider privacy implications when searching sensitive topics
- Use private chat mode for sensitive queries (not synced to database)
