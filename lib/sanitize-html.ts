/**
 * HTML Sanitization Utility for Chameleon AI Chat
 *
 * Provides safe HTML sanitization for user-generated content
 * to prevent XSS attacks when using dangerouslySetInnerHTML.
 *
 * Uses a whitelist approach to only allow known safe tags and attributes.
 */

/**
 * Allowed HTML tags for different contexts
 */
const ALLOWED_TAGS = {
  // Basic text formatting
  text: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'span', 'small'],

  // Rich content (includes headings, lists, etc.)
  rich: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'span', 'small',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a',
    'div',
    'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'figure', 'figcaption',
    'details', 'summary',
    'sup', 'sub',
    'mark', 'del', 'ins',
  ],

  // SVG for diagrams (Mermaid, etc.)
  svg: [
    'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline',
    'text', 'tspan', 'textPath', 'defs', 'clipPath', 'mask', 'use', 'symbol',
    'marker', 'linearGradient', 'radialGradient', 'stop', 'pattern', 'filter',
    'feGaussianBlur', 'feOffset', 'feBlend', 'feColorMatrix', 'feFlood', 'feMerge', 'feMergeNode',
    'foreignObject', 'title', 'desc', 'animate', 'animateTransform',
  ],

  // Inline styles only (for CSS animations)
  style: ['style'],
}

/**
 * Allowed attributes for different tags
 */
const ALLOWED_ATTRS: Record<string, string[]> = {
  // Global attributes
  '*': ['class', 'id', 'style', 'title', 'lang', 'dir', 'role', 'aria-*', 'data-*'],

  // Links
  a: ['href', 'target', 'rel', 'download'],

  // Images
  img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],

  // Tables
  table: ['border', 'cellpadding', 'cellspacing'],
  th: ['colspan', 'rowspan', 'scope'],
  td: ['colspan', 'rowspan'],

  // SVG
  svg: ['viewBox', 'xmlns', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'preserveAspectRatio'],
  path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'transform'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'transform'],
  circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'transform'],
  ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'transform'],
  line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'transform'],
  polygon: ['points', 'fill', 'stroke', 'transform'],
  polyline: ['points', 'fill', 'stroke', 'transform'],
  text: ['x', 'y', 'dx', 'dy', 'text-anchor', 'dominant-baseline', 'fill', 'font-size', 'font-family', 'transform'],
  tspan: ['x', 'y', 'dx', 'dy', 'fill'],
  g: ['transform', 'fill', 'stroke', 'clip-path', 'mask'],
  use: ['href', 'xlink:href', 'x', 'y', 'width', 'height', 'transform'],
  defs: [],
  clipPath: ['id'],
  mask: ['id'],
  marker: ['id', 'viewBox', 'refX', 'refY', 'markerWidth', 'markerHeight', 'orient'],
  linearGradient: ['id', 'x1', 'y1', 'x2', 'y2', 'gradientUnits', 'gradientTransform'],
  radialGradient: ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientUnits', 'gradientTransform'],
  stop: ['offset', 'stop-color', 'stop-opacity'],
  filter: ['id', 'x', 'y', 'width', 'height', 'filterUnits'],
  feGaussianBlur: ['in', 'stdDeviation', 'result'],
  feOffset: ['in', 'dx', 'dy', 'result'],
  feBlend: ['in', 'in2', 'mode', 'result'],
  feFlood: ['flood-color', 'flood-opacity', 'result'],
  feMerge: ['result'],
  feMergeNode: ['in'],
  animate: ['attributeName', 'from', 'to', 'dur', 'repeatCount', 'fill', 'begin'],
  animateTransform: ['attributeName', 'type', 'from', 'to', 'dur', 'repeatCount', 'fill', 'begin'],
  foreignObject: ['x', 'y', 'width', 'height'],
}

/**
 * URL protocols allowed in href/src attributes
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'data:']

/**
 * Dangerous tags whose content should be completely removed
 * (not just the tags themselves)
 */
const DANGEROUS_TAGS = new Set([
  'script',
  'noscript',
  'style',
  'template',
  'iframe',
  'object',
  'embed',
  'applet',
  'frame',
  'frameset',
  'math',
  'xmp',
])

/**
 * Dangerous patterns to remove from CSS
 */
const DANGEROUS_CSS_PATTERNS = [
  /javascript:/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /binding\s*:/gi,
  /-moz-binding/gi,
  /url\s*\(\s*["']?\s*javascript:/gi,
]

export type SanitizeContext = 'text' | 'rich' | 'svg' | 'style'

export interface SanitizeOptions {
  /** Context determines which tags are allowed */
  context?: SanitizeContext
  /** Additional tags to allow */
  allowTags?: string[]
  /** Additional attributes to allow (tag -> attrs) */
  allowAttrs?: Record<string, string[]>
  /** Strip all tags (return plain text) */
  stripTags?: boolean
  /** Allow data: URLs (careful with this) */
  allowDataUrls?: boolean
}

/**
 * Check if a URL is safe
 */
function isSafeUrl(url: string, allowDataUrls: boolean): boolean {
  try {
    const parsed = new URL(url, 'https://example.com')
    const protocols = allowDataUrls ? ALLOWED_PROTOCOLS : ALLOWED_PROTOCOLS.filter(p => p !== 'data:')
    return protocols.includes(parsed.protocol)
  } catch {
    // Relative URLs are safe
    return !url.toLowerCase().includes('javascript:')
  }
}

/**
 * Sanitize CSS to remove dangerous patterns
 */
function sanitizeCss(css: string): string {
  let result = css

  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    result = result.replace(pattern, '')
  }

  return result
}

/**
 * Check if an attribute matches a pattern (supports wildcards like 'aria-*')
 */
function matchesAttrPattern(attr: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      if (attr.startsWith(prefix)) return true
    } else if (attr === pattern) {
      return true
    }
  }
  return false
}

/**
 * Get allowed attributes for a tag
 */
function getAllowedAttrsForTag(
  tagName: string,
  allowAttrs?: Record<string, string[]>
): string[] {
  const globalAttrs = ALLOWED_ATTRS['*'] || []
  const tagAttrs = ALLOWED_ATTRS[tagName] || []
  const customGlobalAttrs = allowAttrs?.['*'] || []
  const customTagAttrs = allowAttrs?.[tagName] || []

  return [...globalAttrs, ...tagAttrs, ...customGlobalAttrs, ...customTagAttrs]
}

/**
 * Sanitize HTML string to prevent XSS attacks
 *
 * @param html - The HTML string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  const {
    context = 'rich',
    allowTags = [],
    allowAttrs = {},
    stripTags = false,
    allowDataUrls = false,
  } = options

  // If we just want plain text, strip all tags
  if (stripTags) {
    return html.replace(/<[^>]*>/g, '')
  }

  // Build list of allowed tags for this context
  const baseTags = ALLOWED_TAGS[context] || ALLOWED_TAGS.rich
  const allAllowedTags = new Set([...baseTags, ...allowTags])

  // Use DOMParser if available (browser)
  if (typeof window !== 'undefined' && window.DOMParser) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
    const container = doc.body.firstChild as HTMLElement

    if (!container) return ''

    function sanitizeNode(node: Node, isContainer = false): void {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const tagName = element.tagName.toLowerCase()

        // Completely remove dangerous tags including their content
        if (DANGEROUS_TAGS.has(tagName)) {
          element.parentNode?.removeChild(element)
          return
        }

        // Remove other disallowed tags (but keep their content)
        // Skip this check for the container wrapper (it's always a div we created)
        if (!isContainer && !allAllowedTags.has(tagName)) {
          const parent = element.parentNode
          if (parent) {
            while (element.firstChild) {
              parent.insertBefore(element.firstChild, element)
            }
            parent.removeChild(element)
          }
          return
        }

        // Sanitize attributes
        const allowedAttrsForTag = getAllowedAttrsForTag(tagName, allowAttrs)
        const attrsToRemove: string[] = []

        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i]
          const attrName = attr.name.toLowerCase()

          // Check if attribute is allowed
          if (!matchesAttrPattern(attrName, allowedAttrsForTag)) {
            attrsToRemove.push(attr.name)
            continue
          }

          // Sanitize URL attributes
          if (attrName === 'href' || attrName === 'src' || attrName === 'xlink:href') {
            if (!isSafeUrl(attr.value, allowDataUrls)) {
              attrsToRemove.push(attr.name)
              continue
            }

            // Add rel="noopener noreferrer" to external links
            if (attrName === 'href' && element.getAttribute('target') === '_blank') {
              element.setAttribute('rel', 'noopener noreferrer')
            }
          }

          // Sanitize style attribute
          if (attrName === 'style') {
            const sanitizedStyle = sanitizeCss(attr.value)
            element.setAttribute('style', sanitizedStyle)
          }
        }

        // Remove unsafe attributes
        for (const attrName of attrsToRemove) {
          element.removeAttribute(attrName)
        }

        // Recursively sanitize children
        const children = Array.from(element.childNodes)
        for (const child of children) {
          sanitizeNode(child, false)
        }
      }
    }

    sanitizeNode(container, true)
    return container.innerHTML
  }

  // Server-side fallback: use regex-based sanitization
  // This is less robust but works without DOM
  return sanitizeHtmlRegex(html, allAllowedTags)
}

/**
 * Regex-based HTML sanitization (for SSR)
 * Less robust than DOM-based, but works server-side
 */
function sanitizeHtmlRegex(html: string, allowedTags: Set<string>): string {
  let result = html

  // Remove dangerous tags entirely (including content)
  for (const tag of DANGEROUS_TAGS) {
    // Match opening tag, content, and closing tag
    const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
    result = result.replace(pattern, '')
    // Also match self-closing variants
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi')
    result = result.replace(selfClosing, '')
  }

  // Remove event handlers (onclick, onerror, etc.)
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')

  // Remove javascript: URLs
  result = result.replace(/\bhref\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'href="#"')
  result = result.replace(/\bsrc\s*=\s*["']?\s*javascript:[^"'>]*/gi, 'src=""')

  // Remove disallowed tags (keep content)
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
  result = result.replace(tagPattern, (match, tagName) => {
    if (allowedTags.has(tagName.toLowerCase())) {
      return match
    }
    return ''
  })

  return result
}

/**
 * Create sanitized HTML props for React's dangerouslySetInnerHTML
 */
export function createSanitizedHtml(
  html: string,
  options?: SanitizeOptions
): { __html: string } {
  return { __html: sanitizeHtml(html, options) }
}

/**
 * Escape HTML entities (for displaying HTML as text)
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char])
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  }

  return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => htmlEntities[entity] || entity)
}
