import { describe, it, expect } from 'vitest'
import {
  sanitizeHtml,
  createSanitizedHtml,
  escapeHtml,
  unescapeHtml,
} from './sanitize-html'

describe('sanitizeHtml', () => {
  describe('XSS prevention', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<script')
      expect(result).not.toContain('alert')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)" />'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('alert')
    })

    it('should remove javascript: URLs in href', () => {
      const input = '<a href="javascript:alert(1)">Click me</a>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('javascript:')
    })

    it('should remove javascript: URLs in src', () => {
      const input = '<img src="javascript:alert(1)">'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('javascript:')
    })

    it('should sanitize CSS expression attacks', () => {
      const input = '<div style="background: expression(alert(1))">Test</div>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('expression')
    })
  })

  describe('Allowed tags', () => {
    it('should allow basic text formatting tags', () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em></p>'
      const result = sanitizeHtml(input, { context: 'text' })
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
      expect(result).toContain('<p>')
    })

    it('should allow rich content tags', () => {
      const input = '<h1>Title</h1><ul><li>Item 1</li></ul><blockquote>Quote</blockquote>'
      const result = sanitizeHtml(input, { context: 'rich' })
      expect(result).toContain('<h1>')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
      expect(result).toContain('<blockquote>')
    })

    it('should strip disallowed tags but keep content', () => {
      const input = '<custom-tag>Keep this text</custom-tag>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<custom-tag')
      expect(result).toContain('Keep this text')
    })
  })

  describe('Attributes', () => {
    it('should keep allowed attributes', () => {
      const input = '<a href="https://example.com" class="link">Link</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('class="link"')
    })

    it('should add rel="noopener noreferrer" to target="_blank" links', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('rel="noopener noreferrer"')
    })

    it('should allow data attributes', () => {
      const input = '<div data-testid="test" data-custom="value">Content</div>'
      const result = sanitizeHtml(input)
      expect(result).toContain('data-testid="test"')
      expect(result).toContain('data-custom="value"')
    })

    it('should allow aria attributes', () => {
      const input = '<button aria-label="Close" aria-hidden="true">X</button>'
      // Note: button is not in our allowed tags, so it gets removed
      // But we can test with a div
      const inputDiv = '<div aria-label="Close" aria-hidden="true" role="button">X</div>'
      const result = sanitizeHtml(inputDiv)
      expect(result).toContain('aria-label="Close"')
      expect(result).toContain('role="button"')
    })
  })

  describe('URL validation', () => {
    it('should allow http URLs', () => {
      const input = '<a href="http://example.com">Link</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('href="http://example.com"')
    })

    it('should allow https URLs', () => {
      const input = '<a href="https://example.com">Link</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('href="https://example.com"')
    })

    it('should allow mailto URLs', () => {
      const input = '<a href="mailto:test@example.com">Email</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('href="mailto:test@example.com"')
    })

    it('should allow relative URLs', () => {
      const input = '<a href="/page">Page</a>'
      const result = sanitizeHtml(input)
      expect(result).toContain('href="/page"')
    })

    it('should block data: URLs by default', () => {
      const input = '<img src="data:image/png;base64,abc">'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('data:')
    })

    it('should allow data: URLs when explicitly enabled', () => {
      const input = '<img src="data:image/png;base64,abc" alt="test">'
      const result = sanitizeHtml(input, { allowDataUrls: true })
      expect(result).toContain('data:image/png')
    })
  })

  describe('Strip tags option', () => {
    it('should strip all tags when stripTags is true', () => {
      const input = '<p>Hello <strong>World</strong>!</p>'
      const result = sanitizeHtml(input, { stripTags: true })
      expect(result).toBe('Hello World!')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })
  })

  describe('Custom allow lists', () => {
    it('should allow additional tags', () => {
      const input = '<custom-element>Content</custom-element>'
      const result = sanitizeHtml(input, { allowTags: ['custom-element'] })
      expect(result).toContain('<custom-element>')
    })

    it('should allow additional attributes', () => {
      const input = '<div custom-attr="value">Content</div>'
      const result = sanitizeHtml(input, {
        allowAttrs: { div: ['custom-attr'] }
      })
      expect(result).toContain('custom-attr="value"')
    })
  })
})

describe('createSanitizedHtml', () => {
  it('should return an object with __html property', () => {
    const result = createSanitizedHtml('<p>Test</p>')
    expect(result).toHaveProperty('__html')
    expect(result.__html).toContain('<p>')
  })

  it('should sanitize the content', () => {
    const result = createSanitizedHtml('<script>alert(1)</script><p>Safe</p>')
    expect(result.__html).not.toContain('<script')
    expect(result.__html).toContain('Safe')
  })
})

describe('escapeHtml', () => {
  it('should escape special HTML characters', () => {
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('>')).toBe('&gt;')
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect(escapeHtml("'")).toBe('&#39;')
  })

  it('should escape a complete HTML string', () => {
    const input = '<script>alert("xss")</script>'
    const result = escapeHtml(input)
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
  })

  it('should leave safe text unchanged', () => {
    const input = 'Hello World 123'
    expect(escapeHtml(input)).toBe(input)
  })
})

describe('unescapeHtml', () => {
  it('should unescape HTML entities', () => {
    expect(unescapeHtml('&lt;')).toBe('<')
    expect(unescapeHtml('&gt;')).toBe('>')
    expect(unescapeHtml('&amp;')).toBe('&')
    expect(unescapeHtml('&quot;')).toBe('"')
    expect(unescapeHtml('&#39;')).toBe("'")
    expect(unescapeHtml('&nbsp;')).toBe(' ')
  })

  it('should unescape a complete escaped string', () => {
    const input = '&lt;p&gt;Hello &amp; World&lt;/p&gt;'
    expect(unescapeHtml(input)).toBe('<p>Hello & World</p>')
  })
})
