/**
 * Search Heuristics - Automatically detect when web search would be helpful
 *
 * This module analyzes user queries to determine if they would benefit from
 * real-time web search results. Works alongside manual toggle for hybrid approach.
 */

// Keywords that strongly indicate need for current/real-time information
const REALTIME_KEYWORDS = [
  // Time-sensitive
  'today', 'yesterday', 'this week', 'this month', 'this year',
  'latest', 'recent', 'current', 'now', 'currently',
  'new', 'newest', 'breaking', 'just', 'right now',
  'heute', 'gestern', 'diese woche', 'aktuell', 'neueste', // German

  // News & Events
  'news', 'update', 'updates', 'announcement', 'announced',
  'happened', 'happening', 'event', 'events',
  'nachrichten', 'neuigkeiten', // German

  // Prices & Markets
  'price', 'prices', 'cost', 'costs', 'stock', 'stocks',
  'market', 'trading', 'crypto', 'bitcoin', 'ethereum',
  'preis', 'kosten', 'aktie', 'aktien', // German

  // Weather
  'weather', 'forecast', 'temperature', 'rain', 'snow',
  'wetter', 'vorhersage', 'temperatur', // German

  // Sports
  'score', 'scores', 'game', 'match', 'won', 'lost',
  'championship', 'tournament', 'league', 'season',
  'spielstand', 'ergebnis', // German

  // Releases & Products
  'release', 'released', 'launch', 'launched', 'version',
  'update', 'available', 'coming out',

  // People & Companies
  'ceo', 'founder', 'acquired', 'merger', 'ipo',
  'valuation', 'funding', 'raised',
]

// Question patterns that often need current information
const REALTIME_PATTERNS = [
  /what('s| is) (the )?(latest|current|new)/i,
  /what happened/i,
  /who (won|is winning|leads)/i,
  /how much (is|does|did)/i,
  /when (is|was|did|does|will)/i,
  /where (is|can i|to)/i,
  /is .+ (open|closed|available)/i,
  /what time/i,
  /how (many|much|long)/i,

  // Specific queries
  /\b(202[4-9]|203[0-9])\b/i, // Years 2024-2039 (likely asking about future/recent)
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+202/i,

  // German patterns
  /was (ist|sind|war|waren)/i,
  /wer (hat|ist|war)/i,
  /wie viel/i,
  /wann (ist|war|wird)/i,
]

// Topics that typically benefit from search
const SEARCH_WORTHY_TOPICS = [
  // Tech
  'ai', 'artificial intelligence', 'chatgpt', 'openai', 'google', 'apple',
  'microsoft', 'meta', 'amazon', 'tesla', 'nvidia', 'spacex',

  // Politics & World
  'president', 'election', 'government', 'congress', 'parliament',
  'ukraine', 'russia', 'china', 'usa', 'eu', 'nato',

  // Science
  'research', 'study', 'discovery', 'nasa', 'space',

  // Entertainment
  'movie', 'film', 'series', 'album', 'concert', 'tour',
]

// Queries that should NOT trigger automatic search (internal/conceptual)
const NO_SEARCH_PATTERNS = [
  /^(hi|hello|hey|good morning|good evening|guten tag)/i,
  /^(thanks|thank you|danke)/i,
  /^(yes|no|ok|okay|ja|nein)/i,
  /explain (how|what|why)/i,
  /what does .+ mean/i,
  /how (do i|can i|to)/i, // Often asking for instructions, not facts
  /write (a|an|me|the)/i,
  /create (a|an|me|the)/i,
  /help me/i,
  /can you/i,
  /translate/i,
  /summarize/i,
  /^code/i,
  /^fix/i,
  /^debug/i,
]

export interface SearchHeuristicsResult {
  shouldSearch: boolean
  confidence: number // 0-1
  reason?: string
  detectedKeywords?: string[]
}

/**
 * Analyze a query to determine if it would benefit from web search
 */
export function analyzeQueryForSearch(query: string): SearchHeuristicsResult {
  const normalizedQuery = query.toLowerCase().trim()

  // Skip very short queries
  if (normalizedQuery.length < 10) {
    return { shouldSearch: false, confidence: 0.9, reason: 'Query too short' }
  }

  // Check for explicit no-search patterns first
  for (const pattern of NO_SEARCH_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return { shouldSearch: false, confidence: 0.8, reason: 'Conceptual/instructional query' }
    }
  }

  let score = 0
  const detectedKeywords: string[] = []

  // Check for realtime keywords (high weight)
  for (const keyword of REALTIME_KEYWORDS) {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      score += 0.3
      detectedKeywords.push(keyword)
    }
  }

  // Check for realtime patterns (high weight)
  for (const pattern of REALTIME_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      score += 0.35
    }
  }

  // Check for search-worthy topics (medium weight)
  for (const topic of SEARCH_WORTHY_TOPICS) {
    if (normalizedQuery.includes(topic.toLowerCase())) {
      score += 0.15
      detectedKeywords.push(topic)
    }
  }

  // Question words boost (low weight)
  const questionWords = ['what', 'who', 'when', 'where', 'why', 'how', 'which', 'was', 'wer', 'wann', 'wo', 'wie']
  for (const word of questionWords) {
    if (normalizedQuery.startsWith(word) || normalizedQuery.includes(` ${word} `)) {
      score += 0.1
      break
    }
  }

  // Cap score at 1.0
  score = Math.min(score, 1.0)

  // Threshold for automatic search
  const shouldSearch = score >= 0.4

  return {
    shouldSearch,
    confidence: score,
    reason: shouldSearch
      ? `Detected real-time information need (${Math.round(score * 100)}% confidence)`
      : `Low search relevance (${Math.round(score * 100)}% confidence)`,
    detectedKeywords: detectedKeywords.length > 0 ? detectedKeywords : undefined,
  }
}

/**
 * Quick check if query likely needs search (for performance)
 */
export function quickSearchCheck(query: string): boolean {
  const lower = query.toLowerCase()

  // Quick keyword scan
  const quickKeywords = ['latest', 'current', 'today', 'news', 'price', 'weather', '2024', '2025']
  for (const kw of quickKeywords) {
    if (lower.includes(kw)) return true
  }

  // Quick pattern check
  if (/what('s| is) (the )?(latest|current|new)/i.test(query)) return true
  if (/how much/i.test(query)) return true

  return false
}
