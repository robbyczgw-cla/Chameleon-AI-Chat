/**
 * Content script - Injected into every webpage
 * Shows AI responses, handles text selection, page summarization, and writing assistant
 */

import { Readability } from "@mozilla/readability"

// Cross-browser API detection
const isFirefox = typeof browser !== "undefined"
const runtime = isFirefox ? browser.runtime : chrome.runtime

console.log("[Chameleon Content] Script loaded")

/**
 * Extract page content using Readability
 */
function extractPageContent() {
  try {
    const documentClone = document.cloneNode(true) as Document
    const reader = new Readability(documentClone, {
      charThreshold: 100,
    })
    const article = reader.parse()

    if (!article) {
      return {
        title: document.title,
        content: document.body.innerText.slice(0, 15000),
        textContent: document.body.innerText.slice(0, 15000),
      }
    }

    return {
      title: article.title || document.title,
      content: article.content || "",
      textContent: article.textContent?.slice(0, 15000) || "",
    }
  } catch (error) {
    console.error("[Chameleon] Readability error:", error)
    return {
      title: document.title,
      content: document.body.innerText.slice(0, 15000),
      textContent: document.body.innerText.slice(0, 15000),
    }
  }
}

/**
 * Create and show response overlay
 */
function showResponseOverlay(response: string, personaName: string, personaEmoji?: string) {
  removeOverlay()

  const overlay = document.createElement("div")
  overlay.id = "chameleon-overlay"
  overlay.className = "chameleon-overlay"

  overlay.innerHTML = `
    <div class="chameleon-card">
      <div class="chameleon-header">
        <span class="chameleon-icon">${personaEmoji || "🦎"}</span>
        <span class="chameleon-title">${personaName}</span>
        <button class="chameleon-close" id="chameleon-close">×</button>
      </div>
      <div class="chameleon-content">
        ${formatResponse(response)}
      </div>
      <div class="chameleon-footer">
        <button class="chameleon-btn chameleon-btn-copy" id="chameleon-copy">
          📋 Copy
        </button>
        <button class="chameleon-btn" id="chameleon-speak">
          🔊 Read Aloud
        </button>
        <button class="chameleon-btn chameleon-btn-primary" id="chameleon-more">
          Open Full Chat →
        </button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  // Add event listeners
  document.getElementById("chameleon-close")?.addEventListener("click", () => {
    speechSynthesis.cancel() // Stop any ongoing speech
    overlay.remove()
  })

  document.getElementById("chameleon-copy")?.addEventListener("click", () => {
    navigator.clipboard.writeText(response)
    const btn = document.getElementById("chameleon-copy")
    if (btn) {
      btn.textContent = "✓ Copied!"
      setTimeout(() => {
        btn.textContent = "📋 Copy"
      }, 2000)
    }
  })

  // Read aloud button using browser TTS
  let isSpeaking = false
  document.getElementById("chameleon-speak")?.addEventListener("click", () => {
    const btn = document.getElementById("chameleon-speak")
    if (!btn) return

    if (isSpeaking) {
      speechSynthesis.cancel()
      btn.textContent = "🔊 Read Aloud"
      isSpeaking = false
    } else {
      const utterance = new SpeechSynthesisUtterance(response)
      utterance.rate = 1.0
      utterance.onend = () => {
        btn.textContent = "🔊 Read Aloud"
        isSpeaking = false
      }
      speechSynthesis.speak(utterance)
      btn.textContent = "⏹️ Stop"
      isSpeaking = true
    }
  })

  document.getElementById("chameleon-more")?.addEventListener("click", () => {
    runtime.sendMessage({ type: "OPEN_SIDEPANEL" })
  })

  // Auto-close on escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      speechSynthesis.cancel()
      overlay.remove()
      document.removeEventListener("keydown", handleEscape)
    }
  }
  document.addEventListener("keydown", handleEscape)

  // Close when clicking outside the card
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      speechSynthesis.cancel()
      overlay.remove()
    }
  })
}

/**
 * Show loading state
 */
function showLoading(text: string) {
  removeOverlay()

  const overlay = document.createElement("div")
  overlay.id = "chameleon-overlay"
  overlay.className = "chameleon-overlay"

  overlay.innerHTML = `
    <div class="chameleon-card">
      <div class="chameleon-header">
        <span class="chameleon-icon">🦎</span>
        <span class="chameleon-title">Chameleon AI</span>
      </div>
      <div class="chameleon-content">
        <div class="chameleon-loading">
          <div class="chameleon-spinner"></div>
          <p>${text}</p>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(overlay)
}

/**
 * Show error
 */
function showError(error: string) {
  removeOverlay()

  const overlay = document.createElement("div")
  overlay.id = "chameleon-overlay"
  overlay.className = "chameleon-overlay"

  overlay.innerHTML = `
    <div class="chameleon-card chameleon-error">
      <div class="chameleon-header">
        <span class="chameleon-icon">⚠️</span>
        <span class="chameleon-title">Error</span>
        <button class="chameleon-close" id="chameleon-close">×</button>
      </div>
      <div class="chameleon-content">
        <p>${error}</p>
        <p class="chameleon-hint">Open extension settings to sign in.</p>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  document.getElementById("chameleon-close")?.addEventListener("click", () => {
    overlay.remove()
  })
}

/**
 * Remove existing overlay
 */
function removeOverlay() {
  const existing = document.getElementById("chameleon-overlay")
  if (existing) {
    existing.remove()
  }
}

/**
 * Format response (basic markdown support)
 */
function formatResponse(text: string): string {
  let formatted = text
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Line breaks
    .replace(/\n/g, "<br>")

  return formatted
}

/**
 * Writing Assistant - Show inline helper for text fields
 */
let currentTextArea: HTMLTextAreaElement | HTMLInputElement | null = null
let writingAssistantEl: HTMLElement | null = null

function showWritingAssistant(element: HTMLTextAreaElement | HTMLInputElement) {
  hideWritingAssistant()
  currentTextArea = element

  const rect = element.getBoundingClientRect()

  writingAssistantEl = document.createElement("div")
  writingAssistantEl.id = "chameleon-writing-assistant"
  writingAssistantEl.className = "chameleon-writing-assistant"
  writingAssistantEl.innerHTML = `
    <div class="chameleon-wa-header">
      <span>🦎 Writing Assistant</span>
    </div>
    <div class="chameleon-wa-buttons">
      <button data-action="improve" title="Improve writing">✨ Improve</button>
      <button data-action="fix" title="Fix grammar">🔧 Fix</button>
      <button data-action="shorter" title="Make shorter">✂️ Shorter</button>
      <button data-action="formal" title="Make formal">👔 Formal</button>
      <button data-action="casual" title="Make casual">😊 Casual</button>
    </div>
  `

  writingAssistantEl.style.position = "fixed"
  writingAssistantEl.style.top = `${rect.bottom + window.scrollY + 5}px`
  writingAssistantEl.style.left = `${rect.left}px`
  writingAssistantEl.style.zIndex = "999999"

  document.body.appendChild(writingAssistantEl)

  // Add click handlers
  writingAssistantEl.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const action = (e.target as HTMLElement).dataset.action
      if (action && currentTextArea) {
        handleWritingAction(action, currentTextArea.value)
      }
    })
  })
}

function hideWritingAssistant() {
  if (writingAssistantEl) {
    writingAssistantEl.remove()
    writingAssistantEl = null
  }
  currentTextArea = null
}

function handleWritingAction(action: string, text: string) {
  if (!text.trim()) return

  runtime.sendMessage({
    type: "WRITING_ASSIST",
    action,
    text,
  })
}

/**
 * Apply improved text to the current text area
 */
function applyWritingResult(improvedText: string) {
  if (currentTextArea) {
    currentTextArea.value = improvedText
    currentTextArea.dispatchEvent(new Event("input", { bubbles: true }))
    hideWritingAssistant()
  }
}

/**
 * Listen for focus on text areas/inputs to show writing assistant
 */
document.addEventListener("focusin", (e) => {
  const target = e.target as HTMLElement
  if (
    target.tagName === "TEXTAREA" ||
    (target.tagName === "INPUT" &&
      (target as HTMLInputElement).type === "text" &&
      target.getAttribute("contenteditable") !== "false")
  ) {
    // Only show if has some text
    const el = target as HTMLTextAreaElement | HTMLInputElement
    if (el.value && el.value.length > 20) {
      showWritingAssistant(el)
    }
  }
})

document.addEventListener("focusout", (e) => {
  // Delay to allow button clicks
  setTimeout(() => {
    const active = document.activeElement
    if (!writingAssistantEl?.contains(active as Node)) {
      hideWritingAssistant()
    }
  }, 200)
})

// Also show on input changes
document.addEventListener("input", (e) => {
  const target = e.target as HTMLElement
  if (
    target.tagName === "TEXTAREA" ||
    (target.tagName === "INPUT" && (target as HTMLInputElement).type === "text")
  ) {
    const el = target as HTMLTextAreaElement | HTMLInputElement
    if (el.value && el.value.length > 20) {
      if (!writingAssistantEl) {
        showWritingAssistant(el)
      }
    } else {
      hideWritingAssistant()
    }
  }
})

/**
 * Listen for messages from background script
 */
runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response?: any) => void) => {
  console.log("[Chameleon Content] Message received:", message.type)

  switch (message.type) {
    case "SHOW_LOADING":
      showLoading(message.text)
      break

    case "SHOW_RESPONSE":
      showResponseOverlay(message.response, message.persona, message.personaEmoji)
      break

    case "SHOW_ERROR":
      showError(message.error)
      break

    case "GET_SELECTION":
      const selectedText = window.getSelection()?.toString() || ""
      sendResponse({ selectedText })
      break

    case "GET_PAGE_CONTENT":
      const content = extractPageContent()
      sendResponse(content)
      break

    case "APPLY_WRITING_RESULT":
      applyWritingResult(message.text)
      break

    case "HIDE_OVERLAY":
      removeOverlay()
      break

    default:
      console.warn("[Chameleon Content] Unknown message type:", message.type)
  }

  return true
})
