/**
 * Cross-browser storage wrapper
 * Works with both chrome.storage (Chrome) and browser.storage (Firefox)
 */

// Detect browser API
const isBrowser = typeof browser !== "undefined"
const storageAPI = isBrowser ? browser.storage : chrome.storage

export interface ExtensionSettings {
  // API Keys
  apiKey: string
  openAIKey?: string // For voice features (Whisper & TTS)
  tavilyKey?: string
  serperKey?: string

  // AI Settings
  selectedPersona: string
  selectedModel: string

  // Appearance
  theme: "light" | "dark" | "system"
  fontSize: "small" | "medium" | "large"

  // Features
  autoSummarize: boolean
  voiceEnabled: boolean
  ttsVoice?: string
  ttsSpeed?: number

  // Context Menu
  enableContextMenu: boolean
  contextMenuActions?: string[]

  // Search
  searchProvider: "duckduckgo" | "tavily" | "serper"

  // Privacy
  saveHistory: boolean
}

export interface StoredChat {
  id: string
  title: string
  personaId: string
  messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: number
  }>
  createdAt: number
  updatedAt: number
}

/**
 * Get a value from storage
 */
export async function getStorage<T>(key: string): Promise<T | null> {
  try {
    const result = await storageAPI.sync.get(key)
    return result[key] ?? null
  } catch (error) {
    console.error(`[Storage] Error getting ${key}:`, error)
    return null
  }
}

/**
 * Set a value in storage
 */
export async function setStorage<T>(key: string, value: T): Promise<void> {
  try {
    await storageAPI.sync.set({ [key]: value })
  } catch (error) {
    console.error(`[Storage] Error setting ${key}:`, error)
    throw error
  }
}

/**
 * Remove a value from storage
 */
export async function removeStorage(key: string): Promise<void> {
  try {
    await storageAPI.sync.remove(key)
  } catch (error) {
    console.error(`[Storage] Error removing ${key}:`, error)
    throw error
  }
}

/**
 * Get all storage data
 */
export async function getAllStorage(): Promise<Record<string, any>> {
  try {
    return await storageAPI.sync.get(null)
  } catch (error) {
    console.error("[Storage] Error getting all data:", error)
    return {}
  }
}

/**
 * Clear all storage data
 */
export async function clearStorage(): Promise<void> {
  try {
    await storageAPI.sync.clear()
  } catch (error) {
    console.error("[Storage] Error clearing storage:", error)
    throw error
  }
}

// Specific getters/setters for common data

export async function getSettings(): Promise<ExtensionSettings | null> {
  return getStorage<ExtensionSettings>("settings")
}

export async function setSettings(settings: ExtensionSettings): Promise<void> {
  return setStorage("settings", settings)
}

export async function getChats(): Promise<StoredChat[]> {
  const chats = await getStorage<StoredChat[]>("chats")
  return chats ?? []
}

export async function setChats(chats: StoredChat[]): Promise<void> {
  return setStorage("chats", chats)
}

export async function addChat(chat: StoredChat): Promise<void> {
  const chats = await getChats()
  chats.unshift(chat) // Add to beginning
  await setChats(chats)
}

export async function updateChat(chatId: string, updates: Partial<StoredChat>): Promise<void> {
  const chats = await getChats()
  const index = chats.findIndex((c) => c.id === chatId)
  if (index !== -1) {
    chats[index] = { ...chats[index], ...updates, updatedAt: Date.now() }
    await setChats(chats)
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  const chats = await getChats()
  const filtered = chats.filter((c) => c.id !== chatId)
  await setChats(filtered)
}

/**
 * Listen to storage changes
 */
export function onStorageChanged(
  callback: (changes: Record<string, { oldValue: any; newValue: any }>) => void
): void {
  storageAPI.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync") {
      callback(changes)
    }
  })
}
