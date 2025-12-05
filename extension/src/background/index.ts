/**
 * Background script for Chameleon AI Extension
 * Works for both Chrome (Service Worker) and Firefox (Background Page)
 */

import { getSettings } from "../shared/storage"
import { chat } from "../shared/api"
import { getPersonaById, getDefaultPersona } from "../shared/personas"

// Detect browser API
const isBrowser = typeof browser !== "undefined"
const runtime = isBrowser ? browser.runtime : chrome.runtime
const contextMenus = isBrowser ? browser.contextMenus : chrome.contextMenus
const tabs = isBrowser ? browser.tabs : chrome.tabs

console.log("[Chameleon] Background script loaded")

/**
 * Initialize context menus
 */
async function initializeContextMenus() {
  // Remove all existing menus first
  await contextMenus.removeAll()

  // Main menu
  contextMenus.create({
    id: "chameleon-main",
    title: "Chameleon AI",
    contexts: ["selection"],
  })

  // Sub-menus
  contextMenus.create({
    id: "chameleon-explain",
    parentId: "chameleon-main",
    title: "Explain this",
    contexts: ["selection"],
  })

  contextMenus.create({
    id: "chameleon-summarize",
    parentId: "chameleon-main",
    title: "Summarize",
    contexts: ["selection"],
  })

  contextMenus.create({
    id: "chameleon-improve",
    parentId: "chameleon-main",
    title: "Improve writing",
    contexts: ["selection"],
  })

  contextMenus.create({
    id: "chameleon-translate",
    parentId: "chameleon-main",
    title: "Translate to English",
    contexts: ["selection"],
  })

  contextMenus.create({
    id: "chameleon-ask",
    parentId: "chameleon-main",
    title: "Ask Chameleon...",
    contexts: ["selection"],
  })

  console.log("[Chameleon] Context menus initialized")
}

/**
 * Handle context menu clicks
 */
contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText
  if (!selectedText || !tab?.id) return

  console.log("[Chameleon] Context menu clicked:", info.menuItemId)

  const settings = await getSettings()
  if (!settings?.apiKey) {
    // Show popup to set API key
    runtime.openOptionsPage()
    return
  }

  const persona = getPersonaById(settings.selectedPersona) || getDefaultPersona()

  let prompt = ""
  switch (info.menuItemId) {
    case "chameleon-explain":
      prompt = `Explain the following text in simple terms:\n\n"${selectedText}"`
      break
    case "chameleon-summarize":
      prompt = `Summarize this text concisely:\n\n"${selectedText}"`
      break
    case "chameleon-improve":
      prompt = `Improve the writing of this text (fix grammar, clarity, tone):\n\n"${selectedText}"`
      break
    case "chameleon-translate":
      prompt = `Translate this to English:\n\n"${selectedText}"`
      break
    case "chameleon-ask":
      // Open popup with selected text pre-filled
      chrome.action.openPopup()
      return
  }

  try {
    // Show loading notification
    sendMessageToContent(tab.id, {
      type: "SHOW_LOADING",
      text: "Chameleon is thinking...",
    })

    // Call AI
    const response = await chat(settings.apiKey, settings.selectedModel, [
      { role: "user", content: prompt },
    ], persona.personality)

    // Show response in content script
    sendMessageToContent(tab.id, {
      type: "SHOW_RESPONSE",
      response,
      persona: persona.name,
    })
  } catch (error) {
    console.error("[Chameleon] Error:", error)
    sendMessageToContent(tab.id, {
      type: "SHOW_ERROR",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

/**
 * Send message to content script
 */
function sendMessageToContent(tabId: number, message: any) {
  tabs.sendMessage(tabId, message).catch((error) => {
    console.error("[Chameleon] Error sending message to content script:", error)
  })
}

/**
 * Handle messages from popup/content/options
 */
runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Chameleon] Message received:", message.type)

  switch (message.type) {
    case "GET_SELECTED_TEXT":
      // Get selected text from active tab
      tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]?.id) {
          sendMessageToContent(tabs[0].id, { type: "GET_SELECTION" })
        }
      })
      break

    case "OPEN_SIDEPANEL":
      // Chrome only - open sidepanel
      if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: sender.tab?.windowId })
      }
      break

    default:
      console.warn("[Chameleon] Unknown message type:", message.type)
  }

  return false
})

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
