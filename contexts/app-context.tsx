"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import type { Chat, AppSettings, Message, ChatFolder, ComparisonSession } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { supabaseSync } from "@/lib/supabase/sync"
import { generateUUID } from "@/lib/utils"
import { getUserSelectedModels } from "@/lib/model-preferences"
import { sanitizeChatsForStorage, safeSetLocalStorage, getLocalStorageUsage, forceCleanupLocalStorage } from "@/lib/storage-utils"

interface AppContextType {
  chats: Chat[]
  currentChatId: string | null
  settings: AppSettings
  folders: ChatFolder[]
  comparisonSessions: ComparisonSession[]
  user: any | null
  isLoading: boolean
  isChatLoading: boolean
  setIsChatLoading: (loading: boolean) => void
  createChat: (model?: string) => string
  deleteChat: (chatId: string) => void
  deleteAllChats: () => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  setCurrentChat: (chatId: string | null) => void
  addMessage: (chatId: string, message: Message) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  createFolder: (name: string) => string
  deleteFolder: (folderId: string) => void
  exportChat: (chatId: string) => string
  importChat: (data: string) => void
  exportAllChats: () => string
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>
  saveComparisonSession: (session: Omit<ComparisonSession, "id" | "timestamp">) => string
  deleteComparisonSession: (sessionId: string) => void
  deleteAllComparisonSessions: () => void
  updateComparisonSession: (sessionId: string, updates: Partial<ComparisonSession>) => void
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const DEFAULT_SETTINGS: AppSettings = {
  language: "en", // Default to English
  apiKeys: {
    openRouter: "",
    tavily: "",
    serper: "",
  },
  selectedModel: "x-ai/grok-4-fast",
  selectedModels: ["x-ai/grok-4-fast"],
  searchProvider: "tavily", // Default to Tavily, can switch to Serper
  modelParameters: {
    temperature: 0.7,
    maxTokens: 8192,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
  },
  systemPrompt:
    "You are a friendly, helpful assistant. Provide clear, precise, and helpful answers. At the end of each response: Write 1-3 engaging questions to continue the discussion when appropriate (phrase them slightly differently each time), then add clickable next possible user prompts in categorized format:\n\n[FOLLOWUP]\n{\n  \"quick\": [\"Short user prompts from user perspective\"],\n  \"deep\": [\"Detailed user prompts for deeper explanations\"],\n  \"related\": [\"User prompts on related topics\"]\n}\n[/FOLLOWUP]\n\nIMPORTANT: The prompts are from the USER's perspective - what might the user ask/say next! Not all categories need to be used.",
  tavilySettings: {
    searchDepth: "basic",
    maxResults: 5,
    includeImages: false,
    includeAnswer: true,
  },
  serperSettings: {
    maxResults: 5,
    includeImages: false,
    country: "at",
    language: "de", // German
  },
  showDetailedStats: false, // Disabled by default, enable for hardcore LLM nerds
  fontSize: "medium",
  messageDensity: "comfortable",
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [folders, setFolders] = useState<ChatFolder[]>([])
  const [comparisonSessions, setComparisonSessions] = useState<ComparisonSession[]>([])
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [hasMigrated, setHasMigrated] = useState(false)
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const isLoadingFromSupabaseRef = useRef(false)
  const settingsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSettingsSaveRef = useRef<string>("")
  const saveCountRef = useRef(0)
  const saveCountResetRef = useRef<NodeJS.Timeout | null>(null)

  const supabase = createClient()

  // Helper function to validate and clean corrupted localStorage data
  const validateLocalStorage = () => {
    const keysToValidate = ["settings", "chats", "folders", "comparisonSessions"]

    for (const key of keysToValidate) {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          JSON.parse(data) // Try to parse - will throw if corrupted
        }
      } catch (error) {
        console.warn(`[v0] Corrupted localStorage detected (${key}), clearing:`, error)
        try {
          localStorage.removeItem(key)
        } catch (e) {
          console.error(`[v0] Failed to remove corrupted key ${key}:`, e)
        }
      }
    }
  }

  // Validate and cleanup localStorage on app mount
  if (typeof window !== "undefined") {
    validateLocalStorage()
    forceCleanupLocalStorage() // Remove old image data and limit to 50 chats
  }

  // Helper function to deeply merge settings objects
  const deepMergeSettings = (defaults: AppSettings, parsed: Partial<AppSettings>): AppSettings => {
    // CRITICAL: When merging API keys, filter out undefined/null/empty values from parsed
    // This prevents database NULL values from overwriting valid localStorage keys
    const mergedApiKeys = { ...defaults.apiKeys }
    if (parsed.apiKeys) {
      Object.keys(parsed.apiKeys).forEach((key) => {
        const value = (parsed.apiKeys as any)[key]
        // Only overwrite if the new value is truthy (not null, undefined, or empty string)
        if (value) {
          (mergedApiKeys as any)[key] = value
        }
      })
    }

    return {
      ...defaults,
      ...parsed,
      modelParameters: {
        ...defaults.modelParameters,
        ...(parsed.modelParameters || {}),
      },
      tavilySettings: {
        ...defaults.tavilySettings,
        ...(parsed.tavilySettings || {}),
      },
      serperSettings: {
        ...defaults.serperSettings,
        ...(parsed.serperSettings || {}),
      },
      youcomSettings: {
        ...defaults.youcomSettings,
        ...(parsed.youcomSettings || {}),
      },
      apiKeys: mergedApiKeys,
      voiceSettings: {
        ...defaults.voiceSettings,
        ...(parsed.voiceSettings || {}),
      },
    }
  }


  useEffect(() => {
    let hasRun = false

    const initAuth = () => {
      if (hasRun) return
      hasRun = true

      // Check for guest mode
      const isGuestMode = typeof window !== "undefined" && localStorage.getItem("guest-mode") === "true"

      // ULTRA-FAST MODE: Load cached data SYNCHRONOUSLY, show UI instantly!
      console.log("[v0] ⚡ INSTANT MODE: Loading cached data synchronously...")
      loadFromLocalStorage()
      setIsLoading(false) // UI READY NOW!
      console.log("[v0] ✅ UI READY in < 50ms")

      // If in guest mode, skip Supabase auth and sync
      if (isGuestMode) {
        console.log("[v0] 🎭 GUEST MODE: Using localStorage only, no Supabase sync")
        setUser(null)
        setHasInitiallyLoaded(true)

        // Guest mode: API keys and settings are stored in localStorage only
        // No need to clear them - user's data persists across sessions
        console.log("[v0] 🔒 GUEST MODE: Using existing settings from localStorage")

        return
      }

      // Run background auth check immediately (not in setTimeout - that gets suspended!)
      // Using queueMicrotask for immediate non-blocking execution
      queueMicrotask(async () => {
        try {
          console.log("[v0] 🔄 Background: Checking auth...")
          const {
            data: { user },
          } = await supabase.auth.getUser()
          console.log("[v0] 🔄 Background: User:", user?.email || "Not logged in")
          setUser(user)

          if (user) {
            // CRITICAL: Run migration BEFORE sync to prevent race conditions
            console.log("[v0] 🔄 Background: Checking for migration...")
            try {
              await migrateToSupabase(user.id)
            } catch (error) {
              console.error("[v0] ⚠️ Migration failed (non-critical):", error)
            }

            console.log("[v0] 🔄 Background: Syncing with Supabase...")
            try {
              await loadFromSupabase(user.id)
              setHasInitiallyLoaded(true)
              console.log("[v0] ✅ Background sync complete")
            } catch (error) {
              console.error("[v0] ⚠️ Background sync failed (using cached data):", error)
            }
          }
        } catch (error) {
          console.error("[v0] ⚠️ Background auth check failed:", error)
        }
      })
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, session?.user?.email)

      if (event === "SIGNED_IN") {
        setUser(session?.user ?? null)

        // CRITICAL FIX: Do NOT block UI with setIsLoading(true)!
        // Background sync should happen silently without blocking the UI
        // Only load data if not already loaded
        if (!hasInitiallyLoaded && !isLoadingFromSupabaseRef.current) {
          console.log("[v0] 🔄 onAuthStateChange: SIGNED_IN - syncing in background...")
          // NO setIsLoading(true) - this was blocking the UI!

          // Run in background without blocking
          (async () => {
            try {
              await migrateToSupabase(session.user.id)
              await loadFromSupabase(session.user.id)
              setHasInitiallyLoaded(true)
              console.log("[v0] ✅ onAuthStateChange: Background sync complete")
            } catch (error) {
              console.error("[v0] ⚠️ onAuthStateChange: Background sync failed:", error)
              loadFromLocalStorage()
            }
          })()
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setChats([])
        setFolders([])
        setComparisonSessions([])
        setSettings(DEFAULT_SETTINGS)
        setCurrentChatId(null)
        setHasMigrated(false)
        setHasInitiallyLoaded(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])


  // Sync model preference changes back to app settings
  useEffect(() => {
    const handleModelPreferencesChanged = () => {
      const userSelectedModels = getUserSelectedModels()
      if (userSelectedModels.length > 0) {
        setSettings((prev) => ({
          ...prev,
          selectedModels: userSelectedModels,
        }))
      }
    }

    // Listen for custom event when model preferences change
    window.addEventListener("modelPreferencesChanged", handleModelPreferencesChanged)

    return () => {
      window.removeEventListener("modelPreferencesChanged", handleModelPreferencesChanged)
    }
  }, [])

  const loadFromLocalStorage = () => {
    const savedChats = localStorage.getItem("chats")
    const savedSettings = localStorage.getItem("settings")
    const savedFolders = localStorage.getItem("folders")
    const savedComparisonSessions = localStorage.getItem("comparisonSessions")

    // Load chats with error handling
    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats))
      } catch (error) {
        console.error("[v0] Failed to parse chats from localStorage, clearing corrupted data:", error)
        localStorage.removeItem("chats")
      }
    }

    // Load settings with comprehensive error handling
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        const OLD_GENERIC_PROMPTS = [
          "You are a helpful AI assistant.",
          "You are a helpful AI assistant",
          "You are an AI assistant.",
          "You are an AI assistant",
        ]

        // CRITICAL: Ensure system prompt always includes the FOLLOWUP format
        // If user has old prompt without FOLLOWUP, upgrade to new default
        if (!parsed.systemPrompt ||
            OLD_GENERIC_PROMPTS.includes(parsed.systemPrompt) ||
            !parsed.systemPrompt.includes("[FOLLOWUP]")) {
          console.log("[v0] Upgrading system prompt to include FOLLOWUP format")
          parsed.systemPrompt = DEFAULT_SETTINGS.systemPrompt
        }

        if (parsed.maxTokens && parsed.maxTokens < 4096) {
          parsed.maxTokens = 16000
        }

        if (parsed.modelParameters?.maxTokens && parsed.modelParameters.maxTokens < 4096) {
          parsed.modelParameters.maxTokens = 16000
        }

        // Load selected models from model-preferences (with safety fallback)
        try {
          const userSelectedModels = getUserSelectedModels()
          if (userSelectedModels && userSelectedModels.length > 0) {
            parsed.selectedModels = userSelectedModels
          }
        } catch (prefError) {
          console.warn("[v0] Failed to load model preferences, using defaults:", prefError)
          // Continue with defaults if model preferences fail
        }

        const mergedSettings = deepMergeSettings(DEFAULT_SETTINGS, parsed)
        setSettings(mergedSettings)
      } catch (error) {
        console.error("[v0] Failed to parse settings from localStorage, using defaults:", error)
        localStorage.removeItem("settings")
        // Use defaults by not setting anything
      }
    }

    // Load folders with error handling
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders))
      } catch (error) {
        console.error("[v0] Failed to parse folders from localStorage, clearing corrupted data:", error)
        localStorage.removeItem("folders")
      }
    }

    // Load comparison sessions with error handling
    if (savedComparisonSessions) {
      try {
        setComparisonSessions(JSON.parse(savedComparisonSessions))
      } catch (error) {
        console.error("[v0] Failed to parse comparison sessions from localStorage, clearing corrupted data:", error)
        localStorage.removeItem("comparisonSessions")
      }
    }
  }

  const loadFromSupabase = async (userId: string) => {
    if (isLoadingFromSupabaseRef.current) {
      console.log("[v0] Already loading from Supabase, skipping duplicate request")
      return
    }

    isLoadingFromSupabaseRef.current = true
    try {
      console.log("[v0] Loading data from Supabase...")
      const startTime = Date.now()

      // Increased timeout to 30 seconds (Supabase free tier can be slow)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase load timeout (30s) - using cached data")), 30000)
      )

      const [chatsData, foldersData, settingsData, sessionsData] = await Promise.race([
        Promise.all([
          supabaseSync.syncChats(userId).catch((err) => {
            console.error("[v0] Error syncing chats:", err)
            return []
          }),
          supabaseSync.syncFolders(userId).catch((err) => {
            console.error("[v0] Error syncing folders:", err)
            return []
          }),
          supabaseSync.syncSettings(userId).catch((err) => {
            console.error("[v0] Error syncing settings:", err)
            return null
          }),
          supabaseSync.syncComparisonSessions(userId).catch((err) => {
            console.error("[v0] Error syncing comparison sessions:", err)
            return []
          }),
        ]),
        timeoutPromise,
      ])

      // Load messages in parallel for better performance
      const chatsWithMessages = await Promise.all(
        chatsData.map(async (chat) => {
          const messages = await supabaseSync.syncMessages(chat.id).catch((err) => {
            console.error(`[v0] Error syncing messages for chat ${chat.id}:`, err)
            return []
          })
          return { ...chat, messages }
        }),
      )

      const loadTime = Date.now() - startTime
      console.log(`[v0] Data loaded in ${loadTime}ms`)

      setChats(chatsWithMessages)
      setFolders(foldersData)
      setComparisonSessions(sessionsData)

      if (!settingsData) {
        console.log("[v0] No settings found, using defaults...")
        // Load model preferences from localStorage as fallback
        const defaultsWithModels = { ...DEFAULT_SETTINGS }
        try {
          const userSelectedModels = getUserSelectedModels()
          if (userSelectedModels && userSelectedModels.length > 0) {
            defaultsWithModels.selectedModels = userSelectedModels
            defaultsWithModels.selectedModel = userSelectedModels[0] // Use first model as default
          }
        } catch (prefError) {
          console.warn("[v0] Failed to load model preferences, using defaults:", prefError)
        }
        setSettings(defaultsWithModels)

        // IMPORTANT: Save these defaults to Supabase to prevent gpt-4o from being used
        console.log("[v0] Saving initial settings to Supabase with model:", defaultsWithModels.selectedModel)
        supabaseSync.saveSettings(user.id, defaultsWithModels).catch((error) => {
          console.error("[v0] Failed to save initial settings:", error)
        })
      } else {
        // CRITICAL FIX: Load localStorage API keys FIRST to use as base
        // This ensures we never lose API keys during sync
        let baseSettings = { ...DEFAULT_SETTINGS }
        const localStorageSettings = localStorage.getItem("settings")
        if (localStorageSettings) {
          try {
            const localSettings = JSON.parse(localStorageSettings)
            if (localSettings.apiKeys) {
              console.log("[v0] Loading API keys from localStorage as base")
              baseSettings.apiKeys = {
                openRouter: localSettings.apiKeys.openRouter || "",
                openAI: localSettings.apiKeys.openAI || "",
                tavily: localSettings.apiKeys.tavily || "",
                serper: localSettings.apiKeys.serper || "",
              }
            }
          } catch (e) {
            console.error("[v0] Failed to parse localStorage settings:", e)
          }
        }

        // Now merge with database settings (database wins for everything EXCEPT empty API keys)
        let mergedSettings = deepMergeSettings(baseSettings, settingsData)

        // CRITICAL FIX: If selectedModel is gpt-4o (old default), replace with grok-4-fast
        if (mergedSettings.selectedModel === "openai/gpt-4o" || mergedSettings.selectedModel === "openai/gpt-4o-mini") {
          console.warn("[v0] Found old default model", mergedSettings.selectedModel, "- replacing with grok-4-fast")
          mergedSettings.selectedModel = "x-ai/grok-4-fast"

          // Save the corrected settings back to Supabase
          supabaseSync.saveSettings(user.id, mergedSettings).catch((error) => {
            console.error("[v0] Failed to save corrected settings:", error)
          })
        }

        // CRITICAL FIX: If selectedModel is an image generation model, replace with grok-4-fast
        const imageModels = ["google/gemini-2.5-flash-image", "openai/dall-e-2", "openai/dall-e-3"]
        if (imageModels.includes(mergedSettings.selectedModel)) {
          console.warn("[v0] Found image generation model as default", mergedSettings.selectedModel, "- replacing with grok-4-fast")
          mergedSettings.selectedModel = "x-ai/grok-4-fast"

          // Save the corrected settings back to Supabase
          supabaseSync.saveSettings(user.id, mergedSettings).catch((error) => {
            console.error("[v0] Failed to save corrected settings:", error)
          })
        }

        setSettings(mergedSettings)
        console.log("[v0] Loaded settings with model:", mergedSettings.selectedModel)
      }

      console.log("[v0] Loaded from Supabase:", {
        chats: chatsWithMessages.length,
        folders: foldersData.length,
        sessions: sessionsData.length,
      })
    } catch (error) {
      console.error("[v0] Error loading from Supabase:", error)
      throw error
    } finally {
      isLoadingFromSupabaseRef.current = false
    }
  }

  const migrateToSupabase = async (userId: string) => {
    if (hasMigrated) {
      console.log("[v0] Migration already completed, skipping")
      return
    }

    try {
      const savedChats = localStorage.getItem("chats")
      const savedFolders = localStorage.getItem("folders")

      if (!savedChats && !savedFolders) {
        console.log("[v0] No localStorage data to migrate")
        setHasMigrated(true)
        return
      }

      // CRITICAL: Check if data already exists in Supabase before migrating
      // This prevents duplicate key errors when migration runs multiple times
      console.log("[v0] Checking if data already exists in Supabase...")
      const existingChats = await supabaseSync.syncChats(userId).catch(() => [])

      if (existingChats.length > 0) {
        console.log(`[v0] Found ${existingChats.length} existing chats in Supabase - skipping migration`)
        setHasMigrated(true)
        localStorage.removeItem("chats")
        localStorage.removeItem("folders")
        return
      }

      console.log("[v0] No existing data found - proceeding with migration...")

      // Increased timeout to 60 seconds for large migrations
      const migrationPromise = (async () => {
        if (savedFolders) {
          const folders: ChatFolder[] = JSON.parse(savedFolders)
          await Promise.all(folders.map((folder) =>
            supabaseSync.createFolder(userId, folder).catch((err) => {
              // Ignore 409 conflicts - folder already exists
              if (err?.code !== '23505') throw err
              console.log(`[v0] Folder ${folder.id} already exists, skipping`)
            })
          ))
          console.log(`[v0] Migrated ${folders.length} folders`)
        }

        if (savedChats) {
          const chats: Chat[] = JSON.parse(savedChats)
          for (const chat of chats) {
            try {
              await supabaseSync.createChat(userId, chat)
              for (const message of chat.messages) {
                await supabaseSync.createMessage(message, chat.id).catch((err) => {
                  // Ignore duplicate key errors - message already exists
                  if (err?.code !== '23505') throw err
                  console.log(`[v0] Message ${message.id} already exists, skipping`)
                })
              }
            } catch (err: any) {
              // Ignore 409 conflicts - chat already exists
              if (err?.code !== '23505') throw err
              console.log(`[v0] Chat ${chat.id} already exists, skipping`)
            }
          }
          console.log(`[v0] Migrated ${chats.length} chats`)
        }
      })()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Migration timeout (60s)")), 60000)
      )

      await Promise.race([migrationPromise, timeoutPromise])

      localStorage.removeItem("chats")
      localStorage.removeItem("folders")

      setHasMigrated(true)
      console.log("[v0] Migration complete!")
    } catch (error) {
      console.error("[v0] Migration error:", error)
      // Mark as migrated anyway to prevent infinite retries
      setHasMigrated(true)
      // Don't throw - migration is non-blocking, app should continue
    }
  }

  useEffect(() => {
    if (isLoading || isLoadingFromSupabaseRef.current) return

    // ANTI-LOOP PROTECTION: Limit saves to 3 per 5 seconds
    if (saveCountRef.current >= 3) {
      console.error("[v0] LOOP PROTECTION: Too many settings saves, skipping to prevent infinite loop!")
      return
    }

    // Debounce settings saves to prevent rapid consecutive saves
    const settingsString = JSON.stringify(settings)

    // Skip if settings haven't actually changed
    if (settingsString === lastSettingsSaveRef.current) {
      return
    }

    // Clear any pending save
    if (settingsSaveTimeoutRef.current) {
      clearTimeout(settingsSaveTimeoutRef.current)
    }

    // Debounce the save by 500ms
    settingsSaveTimeoutRef.current = setTimeout(() => {
      lastSettingsSaveRef.current = settingsString

      // Increment save counter
      saveCountRef.current++

      // Reset counter after 5 seconds
      if (saveCountResetRef.current) {
        clearTimeout(saveCountResetRef.current)
      }
      saveCountResetRef.current = setTimeout(() => {
        saveCountRef.current = 0
      }, 5000)

      // CRITICAL: Always save to localStorage as backup FIRST, even for authenticated users
      // This ensures we never lose API keys even if Supabase sync fails
      try {
        localStorage.setItem("settings", JSON.stringify(settings))
        console.log("[v0] ✅ Settings saved to localStorage (including API keys)")
      } catch (error) {
        console.error("[v0] ❌ Failed to save settings to localStorage:", error)
      }

      if (user) {
        console.log(`[v0] Saving settings to Supabase... (${saveCountRef.current}/3 in last 5s)`)
        supabaseSync.saveSettings(user.id, settings).catch((error) => {
          console.error("[v0] Failed to save to Supabase, but data is backed up in localStorage:", error)
        })
      }
    }, 500)

    return () => {
      if (settingsSaveTimeoutRef.current) {
        clearTimeout(settingsSaveTimeoutRef.current)
      }
    }
  }, [settings, user, isLoading])

  // Save chats to localStorage as backup (sanitized to prevent quota issues)
  useEffect(() => {
    if (isLoading) return

    // Strip image data URLs to prevent localStorage quota exceeded errors
    const sanitizedChats = sanitizeChatsForStorage(chats)
    const success = safeSetLocalStorage("chats", sanitizedChats)

    if (!success) {
      const usage = getLocalStorageUsage()
      console.warn(`[AppContext] Failed to save chats. Storage: ${usage.used}MB / ${usage.available}MB`)
    }
  }, [chats, isLoading])

  // Save folders to localStorage as backup
  useEffect(() => {
    if (isLoading) return
    safeSetLocalStorage("folders", folders)
  }, [folders, isLoading])

  // Save comparison sessions to localStorage as backup
  useEffect(() => {
    if (isLoading) return
    safeSetLocalStorage("comparisonSessions", comparisonSessions)
  }, [comparisonSessions, isLoading])

  const createChat = (model?: string): string => {
    const chatId = generateUUID()

    const newChat: Chat = {
      id: chatId,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: model || settings.selectedModel, // Use provided model or default to settings
    }

    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChat.id)

    if (user) {
      console.log("[v0] Creating chat in Supabase:", newChat.id)
      supabaseSync
        .createChat(user.id, newChat)
        .then(() => {
          console.log("[v0] SUCCESS creating chat in Supabase!")
        })
        .catch((error) => {
          console.error("[v0] FAILED to create chat in Supabase!")
          console.error("[v0] Error:", error)
          console.error("[v0] Error code:", error?.code)
          console.error("[v0] Error message:", error?.message)
          console.error("[v0] Error details:", error?.details)
        })
    } else {
      console.log("[v0] User not logged in, chat only saved locally")
    }

    return newChat.id
  }

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }

    if (user) {
      supabaseSync.deleteChat(user.id, chatId).catch(console.error)
    }
  }

  const deleteAllChats = () => {
    setChats([])
    setCurrentChatId(null)

    if (user) {
      supabaseSync.deleteAllChats(user.id).catch(console.error)
    }
  }

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, ...updates, updatedAt: Date.now() } : chat)))

    if (user) {
      const chat = chats.find((c) => c.id === chatId)
      if (chat) {
        supabaseSync.updateChat(user.id, { ...chat, ...updates }).catch(console.error)
      }
    }
  }

  const setCurrentChat = (chatId: string | null) => {
    setCurrentChatId(chatId)
  }

  const addMessage = (chatId: string, message: Message) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, message]
          const title =
            chat.messages.length === 0 && message.role === "user"
              ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
              : chat.title

          if (user) {
            console.log("[v0] Saving message to Supabase:", message.id)
            supabaseSync
              .createMessage(message, chatId)
              .then(() => {
                console.log("[v0] SUCCESS saving message to Supabase!")
              })
              .catch((error) => {
                console.error("[v0] FAILED to save message to Supabase, but will retry from localStorage!")
                console.error("[v0] Error:", error)
              })

            supabaseSync.updateChat(user.id, { ...chat, title, messages: updatedMessages }).catch((error) => {
              console.error("[v0] Failed to update chat in Supabase, using localStorage backup:", error)
            })
          } else {
            console.log("[v0] User not logged in, message only saved locally")
          }

          return {
            ...chat,
            messages: updatedMessages,
            title,
            updatedAt: Date.now(),
          }
        }
        return chat
      }),
    )
  }

  const updateSettings = (updates: Partial<AppSettings>) => {
    const validatedUpdates = { ...updates }

    if (validatedUpdates.modelParameters?.maxTokens && validatedUpdates.modelParameters.maxTokens < 4096) {
      validatedUpdates.modelParameters.maxTokens = 4096
    }

    setSettings((prev) => {
      const merged = deepMergeSettings(prev, validatedUpdates)

      // BULLETPROOF API KEY PROTECTION: Never allow API keys to be cleared if they were previously set
      if (prev.apiKeys.openRouter && !merged.apiKeys.openRouter) {
        console.warn("[v0] 🛡️ PROTECTION: Prevented OpenRouter API key from being cleared!")
        merged.apiKeys.openRouter = prev.apiKeys.openRouter
      }
      if (prev.apiKeys.openAI && !merged.apiKeys.openAI) {
        console.warn("[v0] 🛡️ PROTECTION: Prevented OpenAI API key from being cleared!")
        merged.apiKeys.openAI = prev.apiKeys.openAI
      }
      if (prev.apiKeys.tavily && !merged.apiKeys.tavily) {
        console.warn("[v0] 🛡️ PROTECTION: Prevented Tavily API key from being cleared!")
        merged.apiKeys.tavily = prev.apiKeys.tavily
      }
      if (prev.apiKeys.serper && !merged.apiKeys.serper) {
        console.warn("[v0] 🛡️ PROTECTION: Prevented Serper API key from being cleared!")
        merged.apiKeys.serper = prev.apiKeys.serper
      }

      return merged
    })
  }

  const createFolder = (name: string): string => {
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setFolders((prev) => [...prev, newFolder])

    if (user) {
      supabaseSync.createFolder(user.id, newFolder).catch(console.error)
    }

    return newFolder.id
  }

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== folderId))
    setChats((prev) => prev.map((chat) => (chat.folderId === folderId ? { ...chat, folderId: undefined } : chat)))

    if (user) {
      supabaseSync.deleteFolder(user.id, folderId).catch(console.error)
    }
  }

  const exportChat = (chatId: string): string => {
    const chat = chats.find((c) => c.id === chatId)
    if (!chat) throw new Error("Chat not found")
    return JSON.stringify(chat, null, 2)
  }

  const importChat = (data: string) => {
    try {
      const chat = JSON.parse(data) as Chat
      chat.id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      chat.createdAt = Date.now()
      chat.updatedAt = Date.now()
      setChats((prev) => [chat, ...prev])

      if (user) {
        supabaseSync.createChat(user.id, chat).catch(console.error)
        chat.messages.forEach((msg) => {
          supabaseSync.createMessage(msg, chat.id).catch(console.error)
        })
      }
    } catch (error) {
      throw new Error("Invalid chat data")
    }
  }

  const exportAllChats = (): string => {
    return JSON.stringify({ chats, folders, settings, comparisonSessions }, null, 2)
  }

  const saveComparisonSession = (session: Omit<ComparisonSession, "id" | "timestamp">): string => {
    if (!session.models || session.models.length === 0) {
      console.error("[v0] Cannot save comparison session: models array is required")
      return ""
    }

    const newSession: ComparisonSession = {
      ...session,
      id: generateUUID(),
      timestamp: Date.now(),
    }
    setComparisonSessions((prev) => [newSession, ...prev])

    if (user) {
      supabaseSync.saveComparisonSession(user.id, newSession).catch(console.error)
    }

    return newSession.id
  }

  const deleteComparisonSession = (sessionId: string) => {
    setComparisonSessions((prev) => prev.filter((session) => session.id !== sessionId))

    if (user) {
      supabaseSync.deleteComparisonSession(user.id, sessionId).catch(console.error)
    }
  }

  const deleteAllComparisonSessions = () => {
    setComparisonSessions([])

    if (user) {
      supabaseSync.deleteAllComparisonSessions(user.id).catch(console.error)
    }
  }

  const updateComparisonSession = (sessionId: string, updates: Partial<ComparisonSession>) => {
    setComparisonSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, ...updates } : session)),
    )
  }

  const signOut = async () => {
    // Check if in guest mode
    const isGuestMode = typeof window !== "undefined" && localStorage.getItem("guest-mode") === "true"

    if (isGuestMode) {
      // Clear guest mode
      localStorage.removeItem("guest-mode")
      document.cookie = "guest-mode=; path=/; max-age=0"
      // Clear all data and redirect to login
      setChats([])
      setFolders([])
      setComparisonSessions([])
      setSettings(DEFAULT_SETTINGS)
      setCurrentChatId(null)
      setUser(null)
      window.location.href = "/auth/login"
    } else {
      // Normal Supabase sign out
      await supabase.auth.signOut()
    }
  }

  return (
    <AppContext.Provider
      value={{
        chats,
        currentChatId,
        settings,
        folders,
        comparisonSessions,
        user,
        isLoading,
        isChatLoading,
        setIsChatLoading,
        createChat,
        deleteChat,
        deleteAllChats,
        updateChat,
        setCurrentChat,
        addMessage,
        updateSettings,
        createFolder,
        deleteFolder,
        exportChat,
        importChat,
        exportAllChats,
        setChats,
        saveComparisonSession,
        deleteComparisonSession,
        deleteAllComparisonSessions,
        updateComparisonSession,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
