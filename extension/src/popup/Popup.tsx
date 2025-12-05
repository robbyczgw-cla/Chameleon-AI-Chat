import { useState, useEffect, useRef } from "react"
import { getSettings, getChats, addChat, type StoredChat } from "../shared/storage"
import { chat as callAI } from "../shared/api"
import { PERSONAS, getPersonaById, getDefaultPersona } from "../shared/personas"
import type { ChatMessage } from "../shared/api"

export default function Popup() {
  const [apiKey, setApiKey] = useState<string>("")
  const [selectedPersona, setSelectedPersona] = useState(getDefaultPersona().id)
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-3.5-sonnet")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [recentChats, setRecentChats] = useState<StoredChat[]>([])
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
    const settings = await getSettings()
    if (settings) {
      setApiKey(settings.apiKey || "")
      setSelectedPersona(settings.selectedPersona || getDefaultPersona().id)
      setSelectedModel(settings.selectedModel || "anthropic/claude-3.5-sonnet")
    }
  }

  async function loadRecentChats() {
    const chats = await getChats()
    setRecentChats(chats.slice(0, 3)) // Show 3 most recent
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return

    if (!apiKey) {
      alert("Please set your OpenRouter API key in settings")
      chrome.runtime.openOptionsPage()
      return
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
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
        title: input.slice(0, 50) + (input.length > 50 ? "..." : ""),
        personaId: selectedPersona,
        messages: [...messages, userMessage, assistantMessage].map((m) => ({
          role: m.role,
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
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
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

  function openFullApp() {
    chrome.tabs.create({ url: "https://chameleonai.chat" })
  }

  function openSettings() {
    chrome.runtime.openOptionsPage()
  }

  const persona = getPersonaById(selectedPersona) || getDefaultPersona()

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
        <button className="popup-settings-btn" onClick={openSettings} title="Settings">
          ⚙️
        </button>
      </header>

      {messages.length === 0 ? (
        <div className="popup-welcome">
          <span className="popup-welcome-icon">{persona.emoji}</span>
          <h2>Hi! I'm {persona.name}</h2>
          <p>{persona.description}</p>

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
            onClick={handleSend}
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
