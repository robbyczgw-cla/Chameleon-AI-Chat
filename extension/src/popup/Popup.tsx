import { useState, useEffect, useRef, useCallback } from "react"
import { getSettings, getChats, addChat, setSettings, type StoredChat, type ExtensionSettings } from "../shared/storage"
import { chat as callAI } from "../shared/api"
import { PERSONAS, getPersonaById, getDefaultPersona, PERSONA_CATEGORIES } from "../shared/personas"
import { MODELS, getModelById, getDefaultModel, MODEL_CATEGORIES } from "../shared/models"
import { getCurrentUser } from "../shared/supabase"
import { AudioRecorder, transcribeAudio, textToSpeech, playAudio, speakNative } from "../shared/voice"
import type { ChatMessage } from "../shared/api"

// Cross-browser API detection
const isFirefox = typeof browser !== "undefined"
const runtime = isFirefox ? browser.runtime : chrome.runtime
const tabs = isFirefox ? browser.tabs : chrome.tabs

// Global audio recorder instance
let audioRecorder: AudioRecorder | null = null

export default function Popup() {
  const [user, setUser] = useState<any>(null)
  const [apiKey, setApiKey] = useState<string>("")
  const [openAIKey, setOpenAIKey] = useState<string>("") // For voice features
  const [selectedPersona, setSelectedPersona] = useState(getDefaultPersona().id)
  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recentChats, setRecentChats] = useState<StoredChat[]>([])
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load settings on mount
  useEffect(() => {
    loadSettings()
    loadRecentChats()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadSettings() {
    try {
      // Check if user is logged in
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }

      const settings = await getSettings()
      if (settings) {
        setApiKey(settings.apiKey || "")
        setSelectedPersona(settings.selectedPersona || getDefaultPersona().id)
        setSelectedModel(settings.selectedModel || "anthropic/claude-3.5-sonnet")
      }
    } finally {
      setSettingsLoaded(true)
    }
  }

  async function loadRecentChats() {
    const chats = await getChats()
    setRecentChats(chats.slice(0, 3)) // Show 3 most recent
  }

  async function handleSend(customPrompt?: string) {
    const messageToSend = customPrompt || input.trim()
    if (!messageToSend || isLoading) return

    if (!apiKey) {
      openSettings()
      return
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: messageToSend,
    }

    setMessages((prev) => [...prev, userMessage])
    if (!customPrompt) setInput("")
    setIsLoading(true)

    try {
      const persona = getPersonaById(selectedPersona) || getDefaultPersona()
      const response = await callAI(
        apiKey,
        selectedModel,
        [...messages, userMessage],
        persona.personality
      )

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Save chat
      const chat: StoredChat = {
        id: Date.now().toString(),
        title: messageToSend.slice(0, 50) + (messageToSend.length > 50 ? "..." : ""),
        personaId: selectedPersona,
        messages: [...messages, userMessage, assistantMessage].map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: Date.now(),
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await addChat(chat)
      await loadRecentChats()
    } catch (error) {
      console.error("[Popup] Error:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}. Check your API key in settings.`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Cmd/Ctrl + Enter to send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Cmd/Ctrl + K to clear chat
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      clearChat()
    }
    // Escape to close model picker
    if (e.key === "Escape" && showModelPicker) {
      setShowModelPicker(false)
    }
  }

  // Voice input handlers
  async function toggleRecording() {
    if (isRecording) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  async function startRecording() {
    try {
      audioRecorder = new AudioRecorder()
      await audioRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("[Popup] Recording error:", error)
      alert("Microphone access denied. Please allow microphone access.")
    }
  }

  async function stopRecording() {
    if (!audioRecorder) return

    try {
      const audioBlob = await audioRecorder.stop()
      setIsRecording(false)

      // For now, use native speech recognition as fallback since Whisper needs OpenAI key
      // In the future, we can use Whisper with user's OpenAI key
      try {
        // Try to transcribe with browser's native speech recognition
        speakNative("Processing...") // Just a placeholder
        setInput((prev) => prev + " [Voice input - use native speech recognition]")
      } catch {
        // Fallback: just add a placeholder
        setInput((prev) => prev + " ")
      }
    } catch (error) {
      console.error("[Popup] Stop recording error:", error)
      setIsRecording(false)
    }
  }

  // Text-to-speech for responses
  async function speakResponse(text: string) {
    if (isPlaying) return
    setIsPlaying(true)
    try {
      // Use browser native TTS for now
      speakNative(text)
    } finally {
      setIsPlaying(false)
    }
  }

  async function handleQuickAction(action: string) {
    try {
      const tabList = await tabs.query({ active: true, currentWindow: true })
      const tab = tabList[0]
      const pageTitle = tab?.title || "this page"
      const pageUrl = tab?.url || ""

      // For summarize, use the dedicated page summarizer
      if (action === "summarize" && tab?.id) {
        // Close popup and trigger summarization on the page
        runtime.sendMessage({ type: "SUMMARIZE_PAGE" })
        window.close()
        return
      }

      let prompt = ""
      switch (action) {
        case "explain":
          prompt = `Please explain what "${pageTitle}" is about in simple terms. I'm looking at: ${pageUrl}`
          break
        case "translate":
          prompt = `Help me understand the page "${pageTitle}" - translate any non-English content to English.`
          break
        case "research":
          prompt = `Help me research more about the topic of "${pageTitle}". What are the key things I should know?`
          break
      }

      if (prompt) {
        handleSend(prompt)
      }
    } catch (error) {
      console.error("[Popup] Error getting tab:", error)
    }
  }

  function openFullApp() {
    tabs.create({ url: "https://chameleonai.chat" })
  }

  function openSettings() {
    runtime.openOptionsPage()
  }

  function clearChat() {
    setMessages([])
  }

  const persona = getPersonaById(selectedPersona) || getDefaultPersona()

  // Show loading while settings are being fetched
  if (!settingsLoaded) {
    return (
      <div className="popup">
        <div className="popup-welcome">
          <div className="popup-spinner" style={{ width: 32, height: 32 }}></div>
        </div>
      </div>
    )
  }

  // Show API key setup screen if no key
  if (!apiKey) {
    return (
      <div className="popup">
        <header className="popup-header">
          <div className="popup-header-left">
            <span className="popup-icon">🦎</span>
            <div>
              <h1 className="popup-title">Chameleon AI</h1>
            </div>
          </div>
        </header>

        <div className="popup-no-api-key">
          <span className="popup-no-api-key-icon">🔐</span>
          <h2>Sign In Required</h2>
          <p>
            Sign in with your Chameleon account to sync settings,
            or add your OpenRouter API key manually.
          </p>
          <button className="popup-setup-btn" onClick={openSettings}>
            Sign In / Set Up
          </button>
        </div>

        <footer className="popup-footer">
          <button className="popup-full-app-btn" onClick={openFullApp}>
            Open Full App →
          </button>
        </footer>
      </div>
    )
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <div className="popup-header-left">
          <span className="popup-icon">🦎</span>
          <div>
            <h1 className="popup-title">Chameleon AI</h1>
            <div className="popup-selectors">
              <select
                className="popup-persona-select"
                value={selectedPersona}
                onChange={(e) => setSelectedPersona(e.target.value)}
              >
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.name}
                  </option>
                ))}
              </select>
              <button
                className="popup-model-btn"
                onClick={() => setShowModelPicker(!showModelPicker)}
                title={getModelById(selectedModel)?.name || "Select Model"}
              >
                {getModelById(selectedModel)?.name.split(" ")[0] || "Model"}
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user && (
            <span className="popup-user-badge" title={user.email}>
              👤
            </span>
          )}
          {messages.length > 0 && (
            <button
              className="popup-settings-btn"
              onClick={clearChat}
              title="New Chat"
              style={{ fontSize: 16 }}
            >
              🗑️
            </button>
          )}
          <button className="popup-settings-btn" onClick={openSettings} title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      {/* Model Picker Dropdown */}
      {showModelPicker && (
        <div className="popup-model-picker">
          <div className="popup-model-picker-header">
            <span>Select Model</span>
            <button onClick={() => setShowModelPicker(false)}>×</button>
          </div>
          <div className="popup-model-list">
            {MODEL_CATEGORIES.map((cat) => (
              <div key={cat.id} className="popup-model-category">
                <div className="popup-model-category-title">{cat.emoji} {cat.name}</div>
                {MODELS.filter((m) => m.category === cat.id).map((model) => (
                  <button
                    key={model.id}
                    className={`popup-model-item ${selectedModel === model.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedModel(model.id)
                      setShowModelPicker(false)
                    }}
                  >
                    <span className="popup-model-name">{model.name}</span>
                    <span className="popup-model-provider">{model.provider}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="popup-welcome">
          <span className="popup-welcome-icon">{persona.emoji}</span>
          <h2>Hi! I'm {persona.name}</h2>
          <p>{persona.description}</p>

          {/* Quick Actions */}
          <div className="popup-actions">
            <button
              className="popup-action-btn"
              onClick={() => handleQuickAction("summarize")}
            >
              <span className="popup-action-icon">📄</span>
              Summarize
            </button>
            <button
              className="popup-action-btn"
              onClick={() => handleQuickAction("explain")}
            >
              <span className="popup-action-icon">💡</span>
              Explain
            </button>
            <button
              className="popup-action-btn"
              onClick={() => handleQuickAction("translate")}
            >
              <span className="popup-action-icon">🌐</span>
              Translate
            </button>
            <button
              className="popup-action-btn"
              onClick={() => handleQuickAction("research")}
            >
              <span className="popup-action-icon">🔍</span>
              Research
            </button>
          </div>

          {recentChats.length > 0 && (
            <div className="popup-recent">
              <h3>Recent Chats</h3>
              {recentChats.map((chat) => (
                <div key={chat.id} className="popup-recent-item">
                  <span className="popup-recent-icon">
                    {getPersonaById(chat.personaId)?.emoji || "💬"}
                  </span>
                  <span className="popup-recent-title">{chat.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="popup-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`popup-message popup-message-${msg.role}`}>
              <div className="popup-message-icon">
                {msg.role === "user" ? "👤" : persona.emoji}
              </div>
              <div className="popup-message-content">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="popup-message popup-message-assistant">
              <div className="popup-message-icon">{persona.emoji}</div>
              <div className="popup-message-content popup-loading">
                <div className="popup-spinner"></div>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <footer className="popup-footer">
        <div className="popup-input-container">
          <button
            className={`popup-mic-btn ${isRecording ? "recording" : ""}`}
            onClick={toggleRecording}
            disabled={isLoading}
            title={isRecording ? "Stop recording" : "Voice input"}
          >
            {isRecording ? "⏹️" : "🎤"}
          </button>
          <textarea
            ref={inputRef}
            className="popup-input"
            placeholder={`Ask ${persona.name} anything... (Enter to send)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isLoading || isRecording}
          />
          <button
            className="popup-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            ➤
          </button>
        </div>
        <div className="popup-footer-row">
          <span className="popup-shortcuts">⌘K clear • Enter send</span>
          <button className="popup-full-app-btn" onClick={openFullApp}>
            Open Full App →
          </button>
        </div>
      </footer>
    </div>
  )
}
