import { useState, useEffect, useRef } from "react"
import { getSettings, getChats, addChat, type StoredChat } from "../shared/storage"
import { callOpenRouterStreaming, contentToText, type ChatMessage } from "../shared/api"
import { PERSONAS, getPersonaById, getDefaultPersona } from "../shared/personas"
import { MODELS, getModelById, getDefaultModel, MODEL_CATEGORIES } from "../shared/models"
import { getCurrentUser } from "../shared/supabase"
import { VoiceService } from "../shared/voice"

// Cross-browser API detection
const isFirefox = typeof browser !== "undefined"
const runtime = isFirefox ? browser.runtime : chrome.runtime
const tabs = isFirefox ? browser.tabs : chrome.tabs

// Global voice service instance
const voiceService = new VoiceService()

/**
 * Simple markdown to HTML renderer (matches main app's formatting)
 */
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code blocks with syntax highlighting class
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Headers
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3>$1</h3>")
    .replace(/^# (.+)$/gm, "<h2>$1</h2>")
    // Bullet lists
    .replace(/^[*-] (.+)$/gm, "<li>$1</li>")
    // Line breaks
    .replace(/\n/g, "<br>")
    // Wrap consecutive list items
    .replace(/(<li>.*<\/li>)(<br>)?(<li>)/g, "$1$3")
    .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>")
    .replace(/<\/ul><br><ul>/g, "")

  return html
}

export default function Popup() {
  const [user, setUser] = useState<any>(null)
  const [apiKey, setApiKey] = useState<string>("")
  const [openAIKey, setOpenAIKey] = useState<string>("")
  const [selectedPersona, setSelectedPersona] = useState(getDefaultPersona().id)
  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [recentChats, setRecentChats] = useState<StoredChat[]>([])
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState(false)
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
        setOpenAIKey(settings.openAIKey || "")
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
    setStreamingContent("")

    try {
      const persona = getPersonaById(selectedPersona) || getDefaultPersona()
      const allMessages: ChatMessage[] = [
        { role: "system", content: persona.personality },
        ...messages,
        userMessage,
      ]

      // Use streaming for better UX
      let fullResponse = ""
      const stream = callOpenRouterStreaming(apiKey, {
        model: selectedModel,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 4096,
      })

      for await (const chunk of stream) {
        fullResponse += chunk
        setStreamingContent(fullResponse)
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: fullResponse,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent("")

      // Save chat
      const chat: StoredChat = {
        id: Date.now().toString(),
        title: messageToSend.slice(0, 50) + (messageToSend.length > 50 ? "..." : ""),
        personaId: selectedPersona,
        messages: [...messages, userMessage, assistantMessage].map((m) => ({
          role: m.role as "user" | "assistant",
          content: contentToText(m.content),
          timestamp: Date.now(),
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await addChat(chat)
      await loadRecentChats()
    } catch (error) {
      console.error("[Popup] Error:", error)
      setStreamingContent("")
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

  // Voice input handlers using VoiceService with Whisper
  async function toggleRecording() {
    if (isRecording) {
      voiceService.stopWhisperListening()
      setIsRecording(false)
    } else {
      await startRecording()
    }
  }

  async function startRecording() {
    setVoiceError(null)

    // Need OpenAI key for Whisper
    if (!openAIKey) {
      setVoiceError("Add OpenAI API key in settings for voice input")
      return
    }

    await voiceService.startWhisperListening(
      openAIKey,
      (text) => {
        // On successful transcription
        setInput((prev) => (prev ? prev + " " + text : text))
        setIsRecording(false)
      },
      (error) => {
        // On error
        console.error("[Popup] Voice error:", error)
        setVoiceError(error)
        setIsRecording(false)
      },
      () => {
        // On start
        setIsRecording(true)
      }
    )
  }

  // Text-to-speech using OpenAI TTS
  async function speakResponse(text: string) {
    if (isPlaying) return

    if (!openAIKey) {
      // Fall back to browser native TTS
      voiceService.speak(text)
      return
    }

    setIsPlaying(true)
    await voiceService.speakWithOpenAI(
      text,
      openAIKey,
      { voice: "nova", speed: 1.0 },
      () => setIsPlaying(false),
      (error) => {
        console.error("[Popup] TTS error:", error)
        setIsPlaying(false)
        // Fall back to native TTS
        voiceService.speak(text)
      }
    )
  }

  function stopSpeaking() {
    voiceService.stopSpeaking()
    setIsPlaying(false)
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
          {messages.map((msg, i) => {
            const content = contentToText(msg.content)
            const isAssistant = msg.role === "assistant"
            return (
              <div key={i} className={`popup-message popup-message-${msg.role}`}>
                <div className="popup-message-icon">
                  {msg.role === "user" ? "👤" : persona.emoji}
                </div>
                <div className="popup-message-body">
                  {isAssistant ? (
                    <div
                      className="popup-message-content popup-markdown"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                    />
                  ) : (
                    <div className="popup-message-content">{content}</div>
                  )}
                  {isAssistant && (
                    <div className="popup-message-actions">
                      <button
                        className="popup-action-icon-btn"
                        onClick={() => navigator.clipboard.writeText(content)}
                        title="Copy"
                      >
                        📋
                      </button>
                      <button
                        className={`popup-action-icon-btn ${isPlaying ? "active" : ""}`}
                        onClick={() => isPlaying ? stopSpeaking() : speakResponse(content)}
                        title={isPlaying ? "Stop speaking" : "Read aloud"}
                      >
                        {isPlaying ? "⏹️" : "🔊"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {isLoading && (
            <div className="popup-message popup-message-assistant">
              <div className="popup-message-icon">{persona.emoji}</div>
              <div className="popup-message-body">
                {streamingContent ? (
                  <div
                    className="popup-message-content popup-markdown"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }}
                  />
                ) : (
                  <div className="popup-message-content popup-loading">
                    <div className="popup-spinner"></div>
                    Thinking...
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <footer className="popup-footer">
        {voiceError && (
          <div className="popup-voice-error">
            <span>⚠️ {voiceError}</span>
            <button onClick={() => setVoiceError(null)}>×</button>
          </div>
        )}
        <div className="popup-input-container">
          <button
            className={`popup-mic-btn ${isRecording ? "recording" : ""}`}
            onClick={toggleRecording}
            disabled={isLoading}
            title={isRecording ? "Stop recording (click to transcribe)" : "Voice input (Whisper)"}
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
