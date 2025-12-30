import { useState, useEffect, useRef } from "react"
import { getSettings, type ExtensionSettings } from "../shared/storage"
import { chat as callAI } from "../shared/api"
import { PERSONAS, getPersonaById, getDefaultPersona } from "../shared/personas"
import { MODELS, getModelById, getDefaultModel, MODEL_CATEGORIES } from "../shared/models"
import type { ChatMessage } from "../shared/api"

export default function Sidepanel() {
  const [apiKey, setApiKey] = useState<string>("")
  const [selectedPersona, setSelectedPersona] = useState(getDefaultPersona().id)
  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadSettings() {
    try {
      const settings = await getSettings()
      if (settings) {
        setApiKey(settings.apiKey || "")
        setSelectedPersona(settings.selectedPersona || getDefaultPersona().id)
        setSelectedModel(settings.selectedModel || getDefaultModel().id)
      }
    } finally {
      setSettingsLoaded(true)
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading || !apiKey) return

    const userMessage: ChatMessage = { role: "user", content: input.trim() }
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

      setMessages((prev) => [...prev, { role: "assistant", content: response }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` },
      ])
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

  const persona = getPersonaById(selectedPersona) || getDefaultPersona()

  if (!settingsLoaded) {
    return (
      <div className="sidepanel">
        <div className="sidepanel-loading">Loading...</div>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="sidepanel">
        <div className="sidepanel-setup">
          <span className="sidepanel-setup-icon">🔐</span>
          <h2>Setup Required</h2>
          <p>Open the extension settings to set up your API key.</p>
          <button onClick={() => chrome.runtime.openOptionsPage()}>Open Settings</button>
        </div>
      </div>
    )
  }

  return (
    <div className="sidepanel">
      <header className="sidepanel-header">
        <div className="sidepanel-header-left">
          <span className="sidepanel-icon">🦎</span>
          <h1>Chameleon AI</h1>
        </div>
        <select
          className="sidepanel-persona-select"
          value={selectedPersona}
          onChange={(e) => setSelectedPersona(e.target.value)}
        >
          {PERSONAS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.emoji} {p.name}
            </option>
          ))}
        </select>
      </header>

      <div className="sidepanel-messages">
        {messages.length === 0 ? (
          <div className="sidepanel-welcome">
            <span className="sidepanel-welcome-icon">{persona.emoji}</span>
            <h2>Hi! I'm {persona.name}</h2>
            <p>{persona.description}</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`sidepanel-message sidepanel-message-${msg.role}`}>
              <div className="sidepanel-message-icon">
                {msg.role === "user" ? "👤" : persona.emoji}
              </div>
              <div className="sidepanel-message-content">{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="sidepanel-message sidepanel-message-assistant">
            <div className="sidepanel-message-icon">{persona.emoji}</div>
            <div className="sidepanel-message-content sidepanel-loading">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="sidepanel-footer">
        <textarea
          className="sidepanel-input"
          placeholder={`Message ${persona.name}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={isLoading}
        />
        <button
          className="sidepanel-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          Send
        </button>
      </footer>
    </div>
  )
}
