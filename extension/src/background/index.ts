/**
 * Background script for Chameleon AI Extension
 * Works for both Chrome (Service Worker) and Firefox (Background Page)
 */

import type { Browser } from "webextension-polyfill"

// Declare browser global for Firefox
declare const browser: Browser | undefined

import { getSettings, setSettings, type ExtensionSettings } from "../shared/storage"
import { chat } from "../shared/api"
import { getPersonaById, getDefaultPersona } from "../shared/personas"
import { analyzeImage, captureVisibleTab, isVisionModel } from "../shared/vision"
import { searchForAI, searchDuckDuckGo, formatSearchResultsForAI } from "../shared/search"

// Detect browser API
const isFirefox = typeof browser !== "undefined"
const runtime = isFirefox ? browser.runtime : chrome.runtime
const contextMenus = isFirefox ? browser.contextMenus : chrome.contextMenus
const tabs = isFirefox ? browser.tabs : chrome.tabs

console.log("[Chameleon] Background script loaded")

/**
 * Context menu configuration
 */
const CONTEXT_MENU_ITEMS = [
  // Understand
  { id: "chameleon-explain", title: "💡 Explain this", category: "understand" },
  { id: "chameleon-explain-simple", title: "🎯 Explain like I'm 5", category: "understand" },
  { id: "chameleon-define", title: "📖 Define words", category: "understand" },

  // Separator
  { id: "sep1", type: "separator" },

  // Summarize & Analyze
  { id: "chameleon-summarize", title: "📝 Summarize", category: "analyze" },
  { id: "chameleon-key-points", title: "🔑 Extract key points", category: "analyze" },
  { id: "chameleon-pros-cons", title: "⚖️ List pros & cons", category: "analyze" },

  // Separator
  { id: "sep2", type: "separator" },

  // Writing
  { id: "chameleon-improve", title: "✨ Improve writing", category: "writing" },
  { id: "chameleon-fix-grammar", title: "🔧 Fix grammar & spelling", category: "writing" },
  { id: "chameleon-formal", title: "👔 Make formal", category: "writing" },
  { id: "chameleon-casual", title: "😊 Make casual", category: "writing" },
  { id: "chameleon-shorter", title: "✂️ Make shorter", category: "writing" },
  { id: "chameleon-longer", title: "📄 Expand / elaborate", category: "writing" },

  // Separator
  { id: "sep3", type: "separator" },

  // Code (for developers)
  { id: "chameleon-explain-code", title: "💻 Explain code", category: "code" },
  { id: "chameleon-find-bugs", title: "🐛 Find bugs", category: "code" },
  { id: "chameleon-optimize", title: "⚡ Optimize code", category: "code" },

  // Separator
  { id: "sep4", type: "separator" },

  // Translate
  { id: "chameleon-translate-en", title: "🇬🇧 Translate to English", category: "translate" },
  { id: "chameleon-translate-de", title: "🇩🇪 Translate to German", category: "translate" },
  { id: "chameleon-translate-es", title: "🇪🇸 Translate to Spanish", category: "translate" },
  { id: "chameleon-translate-fr", title: "🇫🇷 Translate to French", category: "translate" },

  // Separator
  { id: "sep5", type: "separator" },

  // Research & Search
  { id: "chameleon-research", title: "🔍 Research this topic", category: "research" },
  { id: "chameleon-search", title: "🌐 Web search", category: "research" },

  // Separator
  { id: "sep6", type: "separator" },

  // Custom
  { id: "chameleon-ask", title: "💬 Ask Chameleon...", category: "custom" },
]

// Page-level context menu items (no selection required)
const PAGE_CONTEXT_MENU_ITEMS = [
  { id: "chameleon-screenshot", title: "📸 Analyze screenshot", category: "vision" },
  { id: "chameleon-summarize-page", title: "📄 Summarize this page", category: "page" },
]

/**
 * Initialize context menus
 */
async function initializeContextMenus() {
  // Remove all existing menus first
  await contextMenus.removeAll()

  // Main parent menu
  contextMenus.create({
    id: "chameleon-main",
    title: "🦎 Chameleon AI",
    contexts: ["selection"],
  })

  // Add all menu items for text selection
  for (const item of CONTEXT_MENU_ITEMS) {
    if (item.type === "separator") {
      contextMenus.create({
        id: item.id,
        parentId: "chameleon-main",
        type: "separator",
        contexts: ["selection"],
      })
    } else {
      contextMenus.create({
        id: item.id,
        parentId: "chameleon-main",
        title: item.title,
        contexts: ["selection"],
      })
    }
  }

  // Page-level menu (right-click on page, no selection)
  contextMenus.create({
    id: "chameleon-page",
    title: "🦎 Chameleon AI",
    contexts: ["page"],
  })

  // Add page-level menu items
  for (const item of PAGE_CONTEXT_MENU_ITEMS) {
    contextMenus.create({
      id: item.id,
      parentId: "chameleon-page",
      title: item.title,
      contexts: ["page"],
    })
  }

  console.log("[Chameleon] Context menus initialized with", CONTEXT_MENU_ITEMS.length + PAGE_CONTEXT_MENU_ITEMS.length, "items")
}

/**
 * Get prompt for menu action
 */
function getPromptForAction(menuItemId: string, selectedText: string): string {
  const prompts: Record<string, string> = {
    // Understand
    "chameleon-explain": `Explain the following text clearly and concisely:\n\n"${selectedText}"`,
    "chameleon-explain-simple": `Explain this in very simple terms, as if explaining to a child:\n\n"${selectedText}"`,
    "chameleon-define": `Define any complex or technical words in this text:\n\n"${selectedText}"`,

    // Analyze
    "chameleon-summarize": `Summarize this text in 2-3 sentences:\n\n"${selectedText}"`,
    "chameleon-key-points": `Extract the key points from this text as a bullet list:\n\n"${selectedText}"`,
    "chameleon-pros-cons": `List the pros and cons discussed or implied in this text:\n\n"${selectedText}"`,

    // Writing
    "chameleon-improve": `Improve the writing of this text (clarity, flow, word choice):\n\n"${selectedText}"`,
    "chameleon-fix-grammar": `Fix any grammar, spelling, and punctuation errors in this text:\n\n"${selectedText}"`,
    "chameleon-formal": `Rewrite this text in a more formal, professional tone:\n\n"${selectedText}"`,
    "chameleon-casual": `Rewrite this text in a more casual, friendly tone:\n\n"${selectedText}"`,
    "chameleon-shorter": `Make this text shorter while keeping the main message:\n\n"${selectedText}"`,
    "chameleon-longer": `Expand on this text, adding more detail and explanation:\n\n"${selectedText}"`,

    // Code
    "chameleon-explain-code": `Explain what this code does, step by step:\n\n\`\`\`\n${selectedText}\n\`\`\``,
    "chameleon-find-bugs": `Analyze this code for potential bugs, issues, or improvements:\n\n\`\`\`\n${selectedText}\n\`\`\``,
    "chameleon-optimize": `Suggest optimizations for this code:\n\n\`\`\`\n${selectedText}\n\`\`\``,

    // Translate
    "chameleon-translate-en": `Translate this to English:\n\n"${selectedText}"`,
    "chameleon-translate-de": `Translate this to German:\n\n"${selectedText}"`,
    "chameleon-translate-es": `Translate this to Spanish:\n\n"${selectedText}"`,
    "chameleon-translate-fr": `Translate this to French:\n\n"${selectedText}"`,

    // Research
    "chameleon-research": `Research this topic and provide a comprehensive overview with key facts, context, and interesting details:\n\n"${selectedText}"`,
    "chameleon-search": `SEARCH_QUERY:${selectedText}`, // Special marker for web search
  }

  return prompts[menuItemId] || `Help me with this:\n\n"${selectedText}"`
}

/**
 * Handle context menu clicks
 */
contextMenus.onClicked.addListener(async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
  const menuItemId = info.menuItemId as string
  console.log("[Chameleon] Context menu clicked:", menuItemId)

  if (!tab?.id) return

  // Handle page-level actions (no selection required)
  if (menuItemId === "chameleon-screenshot") {
    await handleScreenshotAnalysis(tab.id)
    return
  }

  if (menuItemId === "chameleon-summarize-page") {
    await handleSummarizePage(tab.id)
    return
  }

  // For selection-based actions, require selected text
  const selectedText = info.selectionText
  if (!selectedText) return

  // Handle "Ask Chameleon..." - open popup
  if (menuItemId === "chameleon-ask") {
    // Store selected text for popup to use
    await setSettings({
      ...(await getSettings()) || {} as ExtensionSettings,
      pendingText: selectedText,
    } as any)

    // Try to open popup (Firefox doesn't support this well)
    try {
      if (chrome.action?.openPopup) {
        chrome.action.openPopup()
      }
    } catch {
      // Fallback: show notification
      sendMessageToContent(tab.id, {
        type: "SHOW_RESPONSE",
        response: "Open the Chameleon popup to continue chatting with the selected text.",
        persona: "Chameleon",
      })
    }
    return
  }

  const settings = await getSettings()
  if (!settings?.apiKey) {
    // No API key - prompt to login or set up
    sendMessageToContent(tab.id, {
      type: "SHOW_ERROR",
      error: "Please open the Chameleon extension and log in to your account.",
    })
    runtime.openOptionsPage()
    return
  }

  const persona = getPersonaById(settings.selectedPersona) || getDefaultPersona()

  // Handle web search action
  if (menuItemId === "chameleon-search") {
    await handleWebSearch(tab.id, selectedText, settings, persona)
    return
  }

  const prompt = getPromptForAction(menuItemId, selectedText)

  try {
    // Show loading
    sendMessageToContent(tab.id, {
      type: "SHOW_LOADING",
      text: `${persona.emoji} ${persona.name} is thinking...`,
    })

    // Call AI
    const response = await chat(
      settings.apiKey,
      settings.selectedModel || "anthropic/claude-3.5-sonnet",
      [{ role: "user", content: prompt }],
      persona.personality
    )

    // Show response
    sendMessageToContent(tab.id, {
      type: "SHOW_RESPONSE",
      response,
      persona: persona.name,
      personaEmoji: persona.emoji,
      action: menuItemId.replace("chameleon-", ""),
    })
  } catch (error) {
    console.error("[Chameleon] Error:", error)
    sendMessageToContent(tab.id, {
      type: "SHOW_ERROR",
      error: error instanceof Error ? error.message : "Something went wrong. Check your API key.",
    })
  }
})

/**
 * Send message to content script
 */
function sendMessageToContent(tabId: number, message: unknown) {
  tabs.sendMessage(tabId, message).catch((error: unknown) => {
    console.error("[Chameleon] Error sending message to content script:", error)
  })
}

/**
 * Handle messages from popup/content/options
 */
runtime.onMessage.addListener((message: { type: string; [key: string]: unknown }, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
  console.log("[Chameleon] Message received:", message.type)

  switch (message.type) {
    case "GET_SELECTED_TEXT":
      tabs.query({ active: true, currentWindow: true }).then((tabList) => {
        if (tabList[0]?.id) {
          sendMessageToContent(tabList[0].id, { type: "GET_SELECTION" })
        }
      })
      break

    case "OPEN_SIDEPANEL":
      // Chrome only
      if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: sender.tab?.windowId })
      }
      break

    case "CHECK_AUTH":
      // Check if user is authenticated
      getSettings().then((settings) => {
        sendResponse({ authenticated: !!settings?.apiKey })
      })
      return true // Keep channel open for async response

    case "SUMMARIZE_PAGE":
      // Get the active tab since this comes from popup
      tabs.query({ active: true, currentWindow: true }).then((tabList) => {
        if (tabList[0]?.id) {
          handleSummarizePage(tabList[0].id)
        }
      })
      break

    case "WRITING_ASSIST":
      handleWritingAssist(message.action, message.text, sender.tab?.id)
      break

    default:
      console.warn("[Chameleon] Unknown message type:", message.type)
  }

  return false
})

/**
 * Handle page summarization request
 */
async function handleSummarizePage(tabId?: number) {
  if (!tabId) return

  const settings = await getSettings()
  if (!settings?.apiKey) {
    sendMessageToContent(tabId, {
      type: "SHOW_ERROR",
      error: "Please sign in to use this feature.",
    })
    return
  }

  const persona = getPersonaById(settings.selectedPersona) || getDefaultPersona()

  // Show loading
  sendMessageToContent(tabId, {
    type: "SHOW_LOADING",
    text: `${persona.emoji} Reading page content...`,
  })

  try {
    // Get page content from content script
    const response = await tabs.sendMessage(tabId, { type: "GET_PAGE_CONTENT" })

    if (!response || !response.textContent) {
      sendMessageToContent(tabId, {
        type: "SHOW_ERROR",
        error: "Could not extract page content.",
      })
      return
    }

    // Update loading message
    sendMessageToContent(tabId, {
      type: "SHOW_LOADING",
      text: `${persona.emoji} Summarizing "${response.title}"...`,
    })

    // Call AI to summarize
    const summary = await chat(
      settings.apiKey,
      settings.selectedModel || "anthropic/claude-3.5-sonnet",
      [
        {
          role: "user",
          content: `Please summarize the following article in a clear, concise way. Include the key points and main takeaways.\n\nTitle: ${response.title}\n\nContent:\n${response.textContent}`,
        },
      ],
      persona.personality
    )

    // Show summary
    sendMessageToContent(tabId, {
      type: "SHOW_RESPONSE",
      response: summary,
      persona: persona.name,
      personaEmoji: persona.emoji,
      action: "summarize",
    })
  } catch (error) {
    console.error("[Chameleon] Summarize error:", error)
    sendMessageToContent(tabId, {
      type: "SHOW_ERROR",
      error: error instanceof Error ? error.message : "Failed to summarize page.",
    })
  }
}

/**
 * Handle writing assistant request
 */
async function handleWritingAssist(action: string, text: string, tabId?: number) {
  if (!tabId || !text) return

  const settings = await getSettings()
  if (!settings?.apiKey) {
    sendMessageToContent(tabId, {
      type: "SHOW_ERROR",
      error: "Please sign in to use this feature.",
    })
    return
  }

  const prompts: Record<string, string> = {
    improve: `Improve the following text. Make it clearer, more engaging, and well-written. Return ONLY the improved text, no explanations:\n\n${text}`,
    fix: `Fix any grammar, spelling, and punctuation errors in the following text. Return ONLY the corrected text, no explanations:\n\n${text}`,
    shorter: `Make the following text shorter and more concise while keeping the main message. Return ONLY the shortened text, no explanations:\n\n${text}`,
    formal: `Rewrite the following text in a more formal, professional tone. Return ONLY the formal version, no explanations:\n\n${text}`,
    casual: `Rewrite the following text in a more casual, friendly tone. Return ONLY the casual version, no explanations:\n\n${text}`,
  }

  const prompt = prompts[action] || prompts.improve

  // Show loading
  sendMessageToContent(tabId, {
    type: "SHOW_LOADING",
    text: "Improving your text...",
  })

  try {
    const result = await chat(
      settings.apiKey,
      settings.selectedModel || "anthropic/claude-3.5-sonnet",
      [{ role: "user", content: prompt }],
      "You are a helpful writing assistant. Be concise and direct."
    )

    // Apply the result to the text field
    sendMessageToContent(tabId, {
      type: "APPLY_WRITING_RESULT",
      text: result,
    })

    // Also show a small confirmation
    sendMessageToContent(tabId, {
      type: "SHOW_RESPONSE",
      response: `Text ${action === "fix" ? "corrected" : action === "improve" ? "improved" : action === "shorter" ? "shortened" : `made ${action}`}!\n\n${result}`,
      persona: "Writing Assistant",
      personaEmoji: "✍️",
    })
  } catch (error) {
    console.error("[Chameleon] Writing assist error:", error)
    sendMessageToContent(tabId, {
      type: "SHOW_ERROR",
      error: error instanceof Error ? error.message : "Failed to process text.",
    })
  }
}

/**
 * Handle screenshot analysis
 */
async function handleScreenshotAnalysis(tabId: number) {
  const settings = await getSettings()
  if (!settings?.apiKey) {
    sendMessageToContent(tabId, {
      type: "SHOW_ERROR",
      error: "Please sign in to use this feature.",
    })
    return
  }

  const persona = getPersonaById(settings.selectedPersona) || getDefaultPersona()

  // Show loading
  sendMessageToContent(tabId, {
    type: "SHOW_LOADING",
    text: `${persona.emoji} Capturing screenshot...`,
  })

  try {
    // Capture the visible tab
    const imageDataUrl = await captureVisibleTab()

    // Update loading message
    sendMessageToContent(tabId, {
      type: "SHOW_LOADING",
      text: `${persona.emoji} Analyzing image...`,
    })

    // Use a vision-capable model if available, otherwise fallback
    let modelToUse = settings.selectedModel || "anthropic/claude-3.5-sonnet"
    if (!isVisionModel(modelToUse)) {
      modelToUse = "anthropic/claude-3.5-sonnet" // Claude 3.5 Sonnet supports vision
    }

    // Analyze the screenshot
    const analysis = await analyzeImage(
      imageDataUrl,
      settings.apiKey,
      "Describe what you see in this screenshot. Identify the main content, any text, images, and the overall context of the page. Be concise but informative.",
      modelToUse
    )

    // Show the analysis
    sendMessageToContent(tabId, {
      type: "SHOW_RESPONSE",
      response: analysis,
      persona: persona.name,
      personaEmoji: persona.emoji,
      action: "screenshot",
    })
  } catch (error) {
    console.error("[Chameleon] Screenshot analysis error:", error)
    sendMessageToContent(tabId, {
      type: "SHOW_ERROR",
      error: error instanceof Error ? error.message : "Failed to analyze screenshot.",
    })
  }
}

/**
 * Handle web search request
 */
async function handleWebSearch(
  tabId: number,
  query: string,
  settings: ExtensionSettings,
  persona: { name: string; emoji: string; personality: string }
) {
  // Show loading
  sendMessageToContent(tabId, {
    type: "SHOW_LOADING",
    text: `${persona.emoji} Searching the web for "${query}"...`,
  })

  try {
    // Perform web search (uses DuckDuckGo by default, Tavily if key provided)
    const searchResults = await searchForAI(query, (settings as any).tavilyKey)

    // Update loading
    sendMessageToContent(tabId, {
      type: "SHOW_LOADING",
      text: `${persona.emoji} Analyzing search results...`,
    })

    // Have AI summarize and respond based on search results
    const response = await chat(
      settings.apiKey,
      settings.selectedModel || "anthropic/claude-3.5-sonnet",
      [
        {
          role: "user",
          content: `Based on the following web search results, provide a helpful answer to the query: "${query}"\n\n${searchResults}\n\nProvide a clear, informative response. Include relevant facts and cite sources when possible.`,
        },
      ],
      persona.personality
    )

    // Show response
    sendMessageToContent(tabId, {
      type: "SHOW_RESPONSE",
      response,
      persona: persona.name,
      personaEmoji: persona.emoji,
      action: "search",
    })
  } catch (error) {
    console.error("[Chameleon] Web search error:", error)
    sendMessageToContent(tabId, {
      type: "SHOW_ERROR",
      error: error instanceof Error ? error.message : "Failed to search the web.",
    })
  }
}

/**
 * Handle extension installation
 */
runtime.onInstalled.addListener(async (details) => {
  console.log("[Chameleon] Extension installed:", details.reason)

  if (details.reason === "install") {
    // First install - open options page
    runtime.openOptionsPage()
  }

  // Initialize context menus
  await initializeContextMenus()
})

// Initialize on startup
initializeContextMenus()
