/**
 * URL Tools - Fetch content from URLs and YouTube transcripts
 * No external APIs required - uses free methods
 */

// Cache for URL fetch results (5 minute TTL)
const urlCache = new Map<string, { result: any; timestamp: number }>()
const URL_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Extract readable text content from HTML
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&mdash;/g, '—')
  text = text.replace(/&ndash;/g, '–')

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    return titleMatch[1].trim()
  }

  // Try og:title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  if (ogTitleMatch) {
    return ogTitleMatch[1].trim()
  }

  return null
}

/**
 * Extract meta description from HTML
 */
function extractDescription(html: string): string | null {
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (descMatch) {
    return descMatch[1].trim()
  }

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
  if (ogDescMatch) {
    return ogDescMatch[1].trim()
  }

  return null
}

/**
 * Fetch and extract content from a URL
 */
export async function fetchUrlContent(url: string): Promise<{
  success: boolean
  title?: string
  description?: string
  content?: string
  error?: string
  url: string
}> {
  try {
    // Check cache first
    const cached = urlCache.get(url)
    if (cached && Date.now() - cached.timestamp < URL_CACHE_TTL) {
      console.log(`[URL Fetch] ✅ Cache hit for: ${url}`)
      return cached.result
    }

    // Validate URL
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { success: false, error: 'Invalid URL protocol. Use HTTP or HTTPS.', url }
    }

    console.log(`[URL Fetch] Fetching: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChameleonBot/1.0; +https://chameleon-ai-chat.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10 second timeout (reduced from 15s)
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        url
      }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return {
        success: false,
        error: `Unsupported content type: ${contentType}. Only HTML and text pages are supported.`,
        url
      }
    }

    const html = await response.text()
    const title = extractTitle(html)
    const description = extractDescription(html)
    const content = extractTextFromHtml(html)

    // Limit content length
    const maxLength = 15000
    const truncatedContent = content.length > maxLength
      ? `${content.substring(0, maxLength)  }... [content truncated]`
      : content

    console.log(`[URL Fetch] Success: ${title || url} (${truncatedContent.length} chars)`)

    const result = {
      success: true,
      title: title || undefined,
      description: description || undefined,
      content: truncatedContent,
      url
    }

    // Cache the result
    urlCache.set(url, { result, timestamp: Date.now() })

    return result

  } catch (error) {
    console.error('[URL Fetch] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Failed to fetch URL: ${message}`, url }
  }
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

/**
 * Fetch YouTube transcript using the free youtube-transcript approach
 * This fetches the transcript directly from YouTube's timedtext API
 */
export async function fetchYouTubeTranscript(url: string): Promise<{
  success: boolean
  videoId?: string
  title?: string
  transcript?: string
  error?: string
  url: string
}> {
  try {
    const videoId = extractYouTubeVideoId(url)
    if (!videoId) {
      return {
        success: false,
        error: 'Invalid YouTube URL. Could not extract video ID.',
        url
      }
    }

    console.log(`[YouTube] Fetching transcript for video: ${videoId}`)

    // First, get the video page to extract title and transcript info
    const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!videoPageResponse.ok) {
      return {
        success: false,
        error: `Failed to access YouTube video: ${videoPageResponse.status}`,
        url
      }
    }

    const html = await videoPageResponse.text()

    // Extract video title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : undefined

    // Find caption track URL in the page data
    const captionMatch = html.match(/"captionTracks":\s*\[([^\]]+)\]/)
    if (!captionMatch) {
      return {
        success: false,
        error: 'No captions available for this video. The video might not have subtitles enabled.',
        url,
        videoId,
        title
      }
    }

    // Extract the base URL for captions
    const baseUrlMatch = captionMatch[1].match(/"baseUrl":\s*"([^"]+)"/)
    if (!baseUrlMatch) {
      return {
        success: false,
        error: 'Could not find caption URL.',
        url,
        videoId,
        title
      }
    }

    // Clean up the URL (it's escaped in the JSON)
    const captionUrl = baseUrlMatch[1].replace(/\\u0026/g, '&').replace(/\\/g, '')

    // Fetch the captions
    const captionResponse = await fetch(captionUrl, {
      signal: AbortSignal.timeout(10000),
    })

    if (!captionResponse.ok) {
      return {
        success: false,
        error: 'Failed to fetch captions.',
        url,
        videoId,
        title
      }
    }

    const captionXml = await captionResponse.text()

    // Parse the XML transcript
    const textMatches = captionXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)
    const transcriptParts: string[] = []

    for (const match of textMatches) {
      let text = match[1]
      // Decode HTML entities
      text = text.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
      transcriptParts.push(text)
    }

    if (transcriptParts.length === 0) {
      return {
        success: false,
        error: 'Transcript is empty.',
        url,
        videoId,
        title
      }
    }

    const transcript = transcriptParts.join(' ').replace(/\s+/g, ' ').trim()

    // Limit transcript length
    const maxLength = 15000
    const truncatedTranscript = transcript.length > maxLength
      ? `${transcript.substring(0, maxLength)  }... [transcript truncated]`
      : transcript

    console.log(`[YouTube] Success: ${title} (${truncatedTranscript.length} chars)`)

    return {
      success: true,
      videoId,
      title,
      transcript: truncatedTranscript,
      url
    }

  } catch (error) {
    console.error('[YouTube] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Failed to fetch transcript: ${message}`, url }
  }
}

/**
 * Format URL fetch result for AI context
 */
export function formatUrlFetchResult(result: Awaited<ReturnType<typeof fetchUrlContent>>): string {
  if (!result.success) {
    return `[URL Fetch Error]\nURL: ${result.url}\nError: ${result.error}`
  }

  let formatted = `[Web Page Content]\n`
  formatted += `URL: ${result.url}\n`
  if (result.title) formatted += `Title: ${result.title}\n`
  if (result.description) formatted += `Description: ${result.description}\n`
  formatted += `\nContent:\n${result.content}`

  return formatted
}

/**
 * Format YouTube transcript result for AI context
 */
export function formatYouTubeResult(result: Awaited<ReturnType<typeof fetchYouTubeTranscript>>): string {
  if (!result.success) {
    return `[YouTube Transcript Error]\nURL: ${result.url}\nError: ${result.error}`
  }

  let formatted = `[YouTube Video Transcript]\n`
  formatted += `URL: ${result.url}\n`
  if (result.title) formatted += `Title: ${result.title}\n`
  if (result.videoId) formatted += `Video ID: ${result.videoId}\n`
  formatted += `\nTranscript:\n${result.transcript}`

  return formatted
}
