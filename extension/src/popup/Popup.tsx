import { useState, useEffect, useRef } from "react"
import { getSettings, getChats, addChat, type StoredChat } from "../shared/storage"
import { chat as callAI } from "../shared/api"
import { PERSONAS, getPersonaById, getDefaultPersona } from "../shared/personas"
import type { ChatMessage } from "../shared/api"

// Cross-browser API detection
const isFirefox = typeof browser !== "undefined"
const runtime = isFirefox ? browser.runtime : chrome.runtime
const tabs = isFirefox ? browser.tabs : chrome.tabs

export default function Popup() {
  const [apiKey, setApiKey] = useState<string>("")
  const [selectedPersona, setSelectedPersona] = useState(getDefaultPersona().id)
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-3.5-sonnet")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [recentChats, setRecentChats] = useState<StoredChat[]>([])
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleQuickAction(action: string) {
    try {
      const tabList = await tabs.query({ active: true, currentWindow: true })
      const tab = tabList[0]
      const pageTitle = tab?.title || "this page"
      const pageUrl = tab?.url || ""

      let prompt = ""
      switch (action) {
        case "summarize":
          prompt = `Please summarize the content of the page titled "${pageTitle}" (${pageUrl}). Focus on the key points and main ideas.`
          break
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
          <span className="popup-no-api-key-icon">🔑</span>
          <h2>API Key Required</h2>
          <p>
            To use Chameleon AI, you need an OpenRouter API key.
            It's free to get started!
          </p>
          <button className="popup-setup-btn" onClick={openSettings}>
            Set Up API Key
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
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
          <textarea
            className="popup-input"
            placeholder={`Ask ${persona.name} anything...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isLoading}
          />
          <button
            className="popup-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            ➤
          </button>
        </div>
        <button className="popup-full-app-btn" onClick={openFullApp}>
          Open Full App →
        </button>
      </footer>
    </div>
  )
}
