import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchUrlContent,
  fetchYouTubeTranscript,
  formatUrlFetchResult,
  formatYouTubeResult
} from './url-tools'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Helper to create mock headers
const createMockHeaders = (contentType: string) => ({
  get: (key: string) => key.toLowerCase() === 'content-type' ? contentType : null
})

describe('fetchUrlContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  test('returns error for invalid protocol', async () => {
    const result = await fetchUrlContent('ftp://example.com')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid URL protocol')
  })

  test('returns error for non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })

    const result = await fetchUrlContent('https://notfound-test-unique.com/notfound')
    expect(result.success).toBe(false)
    expect(result.error).toContain('404')
  })

  test('returns error for unsupported content type', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: createMockHeaders('application/pdf'),
    })

    const result = await fetchUrlContent('https://pdf-test-unique.com/file.pdf')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Unsupported content type')
  })

  test('successfully fetches and extracts HTML content', async () => {
    const mockHtml = `
      <html>
        <head>
          <title>Test Page Title</title>
          <meta name="description" content="Test description">
        </head>
        <body>
          <p>Hello world content here</p>
        </body>
      </html>
    `

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: createMockHeaders('text/html'),
      text: () => Promise.resolve(mockHtml)
    })

    const result = await fetchUrlContent('https://html-content-test-unique.com')

    expect(result.success).toBe(true)
    expect(result.title).toBe('Test Page Title')
    expect(result.description).toBe('Test description')
    expect(result.content).toContain('Hello world content here')
  })

  test('extracts og:title when title tag is missing', async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:title" content="OG Title">
        </head>
        <body>Content</body>
      </html>
    `

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: createMockHeaders('text/html'),
      text: () => Promise.resolve(mockHtml)
    })

    const result = await fetchUrlContent('https://og-title-test-unique.com')
    expect(result.title).toBe('OG Title')
  })

  test('extracts og:description when meta description is missing', async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:description" content="OG Description">
        </head>
        <body>Content</body>
      </html>
    `

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: createMockHeaders('text/html'),
      text: () => Promise.resolve(mockHtml)
    })

    const result = await fetchUrlContent('https://og-desc-test-unique.com')
    expect(result.description).toBe('OG Description')
  })

  test('removes script and style tags from content', async () => {
    const mockHtml = `
      <html>
        <head><title>Test</title></head>
        <body>
          <script>alert('bad')</script>
          <style>.hidden{display:none}</style>
          <p>Good content</p>
        </body>
      </html>
    `

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: createMockHeaders('text/html'),
      text: () => Promise.resolve(mockHtml)
    })

    const result = await fetchUrlContent('https://script-style-test-unique.com')
    expect(result.content).not.toContain('alert')
    expect(result.content).not.toContain('display:none')
    expect(result.content).toContain('Good content')
  })

  test('decodes HTML entities', async () => {
    const mockHtml = `
      <html>
        <body>&amp; &lt;tag&gt; &quot;quoted&quot; &#39;apostrophe&#39;</body>
      </html>
    `

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: createMockHeaders('text/html'),
      text: () => Promise.resolve(mockHtml)
    })

    const result = await fetchUrlContent('https://entities-test-unique.com')
    expect(result.content).toContain('&')
    expect(result.content).toContain('<tag>')
    expect(result.content).toContain('"quoted"')
  })

  test('truncates very long content', async () => {
    const longContent = 'A'.repeat(20000)
    const mockHtml = `<html><body>${longContent}</body></html>`

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: createMockHeaders('text/html'),
      text: () => Promise.resolve(mockHtml)
    })

    const result = await fetchUrlContent('https://long-content-test-unique.com')
    expect(result.content?.length).toBeLessThanOrEqual(15030)
    expect(result.content).toContain('[content truncated]')
  })

  test('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const result = await fetchUrlContent('https://network-error-test-unique.com')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Network failure')
  })
})

describe('fetchYouTubeTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns error for invalid YouTube URL', async () => {
    const result = await fetchYouTubeTranscript('https://notoutube.com/watch?v=123')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid YouTube URL')
  })

  test('extracts video ID from standard watch URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const result = await fetchYouTubeTranscript('https://youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result.url).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ')
  })

  test('extracts video ID from short URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    await fetchYouTubeTranscript('https://youtu.be/dQw4w9WgXcQ')
    expect(mockFetch).toHaveBeenCalled()
  })

  test('extracts video ID from embed URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    await fetchYouTubeTranscript('https://youtube.com/embed/dQw4w9WgXcQ')
    expect(mockFetch).toHaveBeenCalled()
  })

  test('extracts video ID from shorts URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    await fetchYouTubeTranscript('https://youtube.com/shorts/dQw4w9WgXcQ')
    expect(mockFetch).toHaveBeenCalled()
  })

  test('returns error when video page fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403
    })

    const result = await fetchYouTubeTranscript('https://youtube.com/watch?v=abc123defgh')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to access YouTube video')
  })

  test('returns error when no captions available', async () => {
    const mockHtml = `
      <html>
        <head><title>Video Title - YouTube</title></head>
        <body>No captions here</body>
      </html>
    `

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml)
    })

    const result = await fetchYouTubeTranscript('https://youtube.com/watch?v=nocaptions123')
    expect(result.success).toBe(false)
    expect(result.error).toContain('No captions available')
    expect(result.title).toBe('Video Title')
  })

  test('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchYouTubeTranscript('https://youtube.com/watch?v=neterror123')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })
})

describe('formatUrlFetchResult', () => {
  test('formats error result', () => {
    const result = {
      success: false,
      error: 'Failed to fetch',
      url: 'https://example.com'
    }

    const formatted = formatUrlFetchResult(result)
    expect(formatted).toContain('[URL Fetch Error]')
    expect(formatted).toContain('https://example.com')
    expect(formatted).toContain('Failed to fetch')
  })

  test('formats successful result with all fields', () => {
    const result = {
      success: true,
      title: 'Page Title',
      description: 'Page description',
      content: 'Page content here',
      url: 'https://example.com'
    }

    const formatted = formatUrlFetchResult(result)
    expect(formatted).toContain('[Web Page Content]')
    expect(formatted).toContain('URL: https://example.com')
    expect(formatted).toContain('Title: Page Title')
    expect(formatted).toContain('Description: Page description')
    expect(formatted).toContain('Content:')
    expect(formatted).toContain('Page content here')
  })

  test('formats successful result without optional fields', () => {
    const result = {
      success: true,
      content: 'Just content',
      url: 'https://example.com'
    }

    const formatted = formatUrlFetchResult(result)
    expect(formatted).toContain('[Web Page Content]')
    expect(formatted).not.toContain('Title:')
    expect(formatted).not.toContain('Description:')
    expect(formatted).toContain('Just content')
  })
})

describe('formatYouTubeResult', () => {
  test('formats error result', () => {
    const result = {
      success: false,
      error: 'No captions available',
      url: 'https://youtube.com/watch?v=test'
    }

    const formatted = formatYouTubeResult(result)
    expect(formatted).toContain('[YouTube Transcript Error]')
    expect(formatted).toContain('No captions available')
  })

  test('formats successful result with all fields', () => {
    const result = {
      success: true,
      videoId: 'abc123',
      title: 'Video Title',
      transcript: 'Hello this is the transcript',
      url: 'https://youtube.com/watch?v=abc123'
    }

    const formatted = formatYouTubeResult(result)
    expect(formatted).toContain('[YouTube Video Transcript]')
    expect(formatted).toContain('Title: Video Title')
    expect(formatted).toContain('Video ID: abc123')
    expect(formatted).toContain('Transcript:')
    expect(formatted).toContain('Hello this is the transcript')
  })

  test('formats result without optional fields', () => {
    const result = {
      success: true,
      transcript: 'Just transcript',
      url: 'https://youtube.com/watch?v=test'
    }

    const formatted = formatYouTubeResult(result)
    expect(formatted).toContain('[YouTube Video Transcript]')
    expect(formatted).not.toContain('Title:')
    expect(formatted).not.toContain('Video ID:')
    expect(formatted).toContain('Just transcript')
  })
})
