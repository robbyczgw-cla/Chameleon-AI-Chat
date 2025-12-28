import { useState, useEffect } from "react"
import {
  getSettings,
  setSettings,
  type ExtensionSettings,
  clearStorage,
} from "../shared/storage"
import { getModels } from "../shared/api"
import { PERSONAS, getDefaultPersona } from "../shared/personas"

const DEFAULT_MODELS = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku (Fast)" },
  { id: "openai/gpt-4o", name: "GPT-4o" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Fast)" },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
]

export default function Options() {
  const [settings, setLocalSettings] = useState<ExtensionSettings>({
    apiKey: "",
    selectedPersona: getDefaultPersona().id,
    selectedModel: "anthropic/claude-3.5-sonnet",
    theme: "system",
    fontSize: "medium",
    autoSummarize: false,
    voiceEnabled: false,
  })
  const [models, setModels] = useState(DEFAULT_MODELS)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const stored = await getSettings()
      if (stored) {
        setLocalSettings(stored)
        // Try to load models if API key exists
        if (stored.apiKey) {
          try {
            const fetchedModels = await getModels(stored.apiKey)
            if (fetchedModels.length > 0) {
              setModels(fetchedModels.slice(0, 20)) // Top 20 models
            }
          } catch {
            // Use default models if fetch fails
          }
        }
      }
    } catch (err) {
      setError("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setError("")
      await setSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      // Reload models if API key changed
      if (settings.apiKey) {
        try {
          const fetchedModels = await getModels(settings.apiKey)
          if (fetchedModels.length > 0) {
            setModels(fetchedModels.slice(0, 20))
          }
        } catch {
          // Keep default models
        }
      }
    } catch (err) {
      setError("Failed to save settings")
    }
  }

  async function handleClearData() {
    if (confirm("This will clear all extension data including chat history. Continue?")) {
      try {
        await clearStorage()
        setLocalSettings({
          apiKey: "",
          selectedPersona: getDefaultPersona().id,
          selectedModel: "anthropic/claude-3.5-sonnet",
          theme: "system",
          fontSize: "medium",
          autoSummarize: false,
          voiceEnabled: false,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        setError("Failed to clear data")
      }
    }
  }

  function updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ) {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="options-container">
        <div className="loading">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="options-container">
      <header className="options-header">
        <div className="options-logo">
          <span className="options-icon">🦎</span>
          <h1>Chameleon AI Settings</h1>
        </div>
        <p className="options-subtitle">Configure your AI assistant</p>
      </header>

      {error && <div className="options-error">{error}</div>}
      {saved && <div className="options-success">Settings saved!</div>}

      <main className="options-main">
        {/* API Key Section */}
        <section className="options-section">
          <h2>API Configuration</h2>
          <div className="options-field">
            <label htmlFor="apiKey">OpenRouter API Key</label>
            <div className="options-input-group">
              <input
                type={showApiKey ? "text" : "password"}
                id="apiKey"
                value={settings.apiKey}
                onChange={(e) => updateSetting("apiKey", e.target.value)}
                placeholder="sk-or-v1-..."
              />
              <button
                type="button"
                className="options-toggle-btn"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="options-hint">
              Get your API key from{" "}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
                openrouter.ai/keys
              </a>
            </p>
          </div>
        </section>

        {/* AI Settings */}
        <section className="options-section">
          <h2>AI Settings</h2>

          <div className="options-field">
            <label htmlFor="persona">Default Persona</label>
            <select
              id="persona"
              value={settings.selectedPersona}
              onChange={(e) => updateSetting("selectedPersona", e.target.value)}
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name} - {p.description}
                </option>
              ))}
            </select>
          </div>

          <div className="options-field">
            <label htmlFor="model">Default Model</label>
            <select
              id="model"
              value={settings.selectedModel}
              onChange={(e) => updateSetting("selectedModel", e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Appearance */}
        <section className="options-section">
          <h2>Appearance</h2>

          <div className="options-field">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) =>
                updateSetting("theme", e.target.value as ExtensionSettings["theme"])
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="options-field">
            <label htmlFor="fontSize">Font Size</label>
            <select
              id="fontSize"
              value={settings.fontSize}
              onChange={(e) =>
                updateSetting("fontSize", e.target.value as ExtensionSettings["fontSize"])
              }
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </section>

        {/* Features */}
        <section className="options-section">
          <h2>Features</h2>

          <div className="options-checkbox">
            <input
              type="checkbox"
              id="autoSummarize"
              checked={settings.autoSummarize}
              onChange={(e) => updateSetting("autoSummarize", e.target.checked)}
            />
            <label htmlFor="autoSummarize">
              Auto-summarize long pages
              <span className="options-hint-inline">
                Automatically show summary for pages with lots of text
              </span>
            </label>
          </div>

          <div className="options-checkbox">
            <input
              type="checkbox"
              id="voiceEnabled"
              checked={settings.voiceEnabled}
              onChange={(e) => updateSetting("voiceEnabled", e.target.checked)}
            />
            <label htmlFor="voiceEnabled">
              Enable voice features
              <span className="options-hint-inline">
                Voice input and text-to-speech output
              </span>
            </label>
          </div>
        </section>

        {/* Actions */}
        <section className="options-actions">
          <button className="options-btn options-btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          <button className="options-btn options-btn-danger" onClick={handleClearData}>
            Clear All Data
          </button>
        </section>

        {/* About */}
        <section className="options-section options-about">
          <h2>About</h2>
          <p>
            <strong>Chameleon AI Extension</strong> v0.1.0
          </p>
          <p>
            Open source AI assistant with multiple personas and 100+ models.
          </p>
          <div className="options-links">
            <a href="https://chameleonai.chat" target="_blank" rel="noreferrer">
              Open Full App
            </a>
            <a
              href="https://github.com/ChameleonAI/chameleon"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer">
              OpenRouter
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
