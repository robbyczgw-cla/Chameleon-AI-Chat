/**
 * Content script - Injected into every webpage
 * Shows AI responses, handles text selection
 */

console.log("[Chameleon Content] Script loaded")

/**
 * Create and show response overlay
 */
function showResponseOverlay(response: string, personaName: string) {
  // Remove existing overlay
  const existing = document.getElementById("chameleon-overlay")
  if (existing) {
    existing.remove()
  }

  // Create overlay
  const overlay = document.createElement("div")
  overlay.id = "chameleon-overlay"
  overlay.className = "chameleon-overlay"

  overlay.innerHTML = `
    <div class="chameleon-card">
      <div class="chameleon-header">
        <span class="chameleon-icon">🦎</span>
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
        <button class="chameleon-btn chameleon-btn-primary" id="chameleon-more">
          Open Full Chat
        </button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  // Add event listeners
  document.getElementById("chameleon-close")?.addEventListener("click", () => {
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

  document.getElementById("chameleon-more")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_SIDEPANEL" })
  })

  // Auto-close on escape
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      overlay.remove()
      document.removeEventListener("keydown", handleEscape)
    }
  }
  document.addEventListener("keydown", handleEscape)
}

/**
 * Show loading state
 */
function showLoading(text: string) {
  const existing = document.getElementById("chameleon-overlay")
  if (existing) {
    existing.remove()
  }

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
  const existing = document.getElementById("chameleon-overlay")
  if (existing) {
    existing.remove()
  }

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
        <p class="chameleon-hint">Check your API key in extension settings.</p>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  document.getElementById("chameleon-close")?.addEventListener("click", () => {
    overlay.remove()
  })
}

/**
 * Format response (basic markdown support)
 */
function formatResponse(text: string): string {
  // Convert markdown-style formatting
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
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Chameleon Content] Message received:", message.type)

  switch (message.type) {
    case "SHOW_LOADING":
      showLoading(message.text)
      break

    case "SHOW_RESPONSE":
      showResponseOverlay(message.response, message.persona)
      break

    case "SHOW_ERROR":
      showError(message.error)
      break

    case "GET_SELECTION":
      const selectedText = window.getSelection()?.toString() || ""
      sendResponse({ selectedText })
      break

    default:
      console.warn("[Chameleon Content] Unknown message type:", message.type)
  }

  return true
})
