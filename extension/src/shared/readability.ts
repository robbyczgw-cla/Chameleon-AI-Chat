/**
 * Page content extraction using Readability.js
 */

import { Readability } from "@mozilla/readability"

export interface PageContent {
  title: string
  content: string
  textContent: string
  excerpt: string
  byline: string | null
  siteName: string | null
  length: number
}

/**
 * Extract readable content from a document
 */
export function extractPageContent(doc: Document): PageContent | null {
  try {
    // Clone the document to avoid modifying the original
    const documentClone = doc.cloneNode(true) as Document

    // Create Readability instance and parse
    const reader = new Readability(documentClone, {
      charThreshold: 100,
    })

    const article = reader.parse()

    if (!article) {
      return null
    }

    return {
      title: article.title || doc.title || "Untitled",
      content: article.content || "",
      textContent: article.textContent || "",
      excerpt: article.excerpt || "",
      byline: article.byline,
      siteName: article.siteName,
      length: article.length || 0,
    }
  } catch (error) {
    console.error("[Readability] Error extracting content:", error)
    return null
  }
}

/**
 * Get a summary-ready version of page content
 * Truncates if too long for API calls
 */
export function getContentForSummary(content: PageContent, maxLength = 15000): string {
  let text = content.textContent

  // Remove excessive whitespace
  text = text.replace(/\s+/g, " ").trim()

  // Truncate if too long
  if (text.length > maxLength) {
    text = text.slice(0, maxLength) + "...[truncated]"
  }

  return text
}

/**
 * Check if the current page has enough content to summarize
 */
export function isPageSummarizable(content: PageContent): boolean {
  return content.length > 200 // At least 200 characters
}
