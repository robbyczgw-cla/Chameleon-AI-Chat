import { useState, useEffect } from "react"
import {
  getSettings,
  setSettings,
  type ExtensionSettings,
  clearStorage,
} from "../shared/storage"
import { getModels } from "../shared/api"
import { PERSONAS, getDefaultPersona } from "../shared/personas"
import { getCurrentUser, signIn, signOut, getUserSettings, onAuthStateChange } from "../shared/supabase"

const DEFAULT_MODELS = [
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Vision)" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku (Fast)" },
  { id: "openai/gpt-4o", name: "GPT-4o (Vision)" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Fast)" },
  { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5" },
  { id: "google/gemini-2.0-flash-exp", name: "Gemini 2.0 Flash" },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3" },
]

type AuthMode = "login" | "manual" | "authenticated"

const DEFAULT_SETTINGS: ExtensionSettings = {
  apiKey: "",
  selectedPersona: getDefaultPersona().id,
  selectedModel: "anthropic/claude-3.5-sonnet",
  theme: "dark",
  fontSize: "medium",
  autoSummarize: false,
  voiceEnabled: true,
  ttsSpeed: 1.0,
  enableContextMenu: true,
  searchProvider: "duckduckgo",
  saveHistory: true,
}

export default function Options() {
  const [authMode, setAuthMode] = useState<AuthMode>("login")
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  const [settings, setLocalSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS)
  const [models, setModels] = useState(DEFAULT_MODELS)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showTavilyKey, setShowTavilyKey] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [])

  async function initializeAuth() {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        setAuthMode("authenticated")
        await loadUserSettings(currentUser.id)
      } else {
        const stored = await getSettings()
        if (stored?.apiKey) {
          setLocalSettings({ ...DEFAULT_SETTINGS, ...stored })
          setAuthMode("manual")
        }
      }
    } catch (err) {
      console.error("[Options] Auth init error:", err)
    } finally {
      setLoading(false)
    }

    onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setAuthMode("authenticated")
        await loadUserSettings(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setAuthMode("login")
      }
    })
  }

  async function loadUserSettings(userId: string) {
    try {
      const supabaseSettings = await getUserSettings(userId)
      if (supabaseSettings) {
        const mappedSettings: ExtensionSettings = {
          ...DEFAULT_SETTINGS,
          apiKey: supabaseSettings.openrouter_api_key || "",
          selectedPersona: supabaseSettings.selected_persona || getDefaultPersona().id,
          selectedModel: supabaseSettings.selected_model || "anthropic/claude-3.5-sonnet",
          theme: supabaseSettings.theme || "dark",
          voiceEnabled: supabaseSettings.voice_enabled ?? true,
        }
        setLocalSettings(mappedSettings)
        await setSettings(mappedSettings)

        if (mappedSettings.apiKey) {
          try {
            const fetchedModels = await getModels(mappedSettings.apiKey)
            if (fetchedModels.length > 0) {
              setModels(fetchedModels.slice(0, 20))
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error("[Options] Failed to load user settings:", err)
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      setAuthError("Please enter email and password")
      return
    }
    setAuthLoading(true)
    setAuthError("")
    try {
      const { user } = await signIn(email, password)
      setUser(user)
      setAuthMode("authenticated")
      await loadUserSettings(user.id)
    } catch (err: any) {
      setAuthError(err.message || "Login failed")
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await signOut()
      await clearStorage()
      setUser(null)
      setAuthMode("login")
      setLocalSettings(DEFAULT_SETTINGS)
    } catch (err) {
      console.error("[Options] Logout error:", err)
    }
  }

  async function handleSave() {
    try {
      setError("")
      await setSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      if (settings.apiKey) {
        try {
          const fetchedModels = await getModels(settings.apiKey)
          if (fetchedModels.length > 0) {
            setModels(fetchedModels.slice(0, 20))
          }
        } catch {}
      }
    } catch (err) {
      setError("Failed to save settings")
    }
  }

  async function handleClearData() {
    if (confirm("Clear all extension data including chat history?")) {
      try {
        await clearStorage()
        setLocalSettings(DEFAULT_SETTINGS)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        setError("Failed to clear data")
      }
    }
  }

  function updateSetting<K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return <div className="options-container"><div className="loading">Loading...</div></div>
  }

  // Login screen
  if (authMode === "login") {
    return (
      <div className="options-container">
        <header className="options-header">
          <div className="options-logo">
            <span className="options-icon">🦎</span>
            <h1>Chameleon AI</h1>
          </div>
          <p className="options-subtitle">Browser extension for AI assistance</p>
        </header>

        <main className="options-main">
          <section className="options-section">
            <h2>Sign In</h2>
            {authError && <div className="options-error">{authError}</div>}

            <div className="options-field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={authLoading}
              />
            </div>

            <div className="options-field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={authLoading}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <button
              className="options-btn options-btn-primary"
              onClick={handleLogin}
              disabled={authLoading}
              style={{ width: "100%", marginTop: 16 }}
            >
              {authLoading ? "Signing in..." : "Sign In"}
            </button>

            <p className="options-hint" style={{ textAlign: "center", marginTop: 16 }}>
              <a href="https://chameleonai.chat/auth/sign-up" target="_blank" rel="noreferrer">
                Create an account
              </a>
            </p>
          </section>

          <div className="options-divider">or</div>

          <section className="options-section">
            <h2>Use Your Own API Key</h2>
            <p className="options-hint">Use OpenRouter directly without an account</p>
            <button className="options-btn" onClick={() => setAuthMode("manual")} style={{ width: "100%" }}>
              Enter API Key
            </button>
          </section>
        </main>
      </div>
    )
  }

  // Settings
  return (
    <div className="options-container">
      <header className="options-header">
        <div className="options-logo">
          <span className="options-icon">🦎</span>
          <h1>Settings</h1>
        </div>
        {user ? (
          <p className="options-subtitle">Signed in as {user.email}</p>
        ) : (
          <p className="options-subtitle">Using API key</p>
        )}
      </header>

      {error && <div className="options-error">{error}</div>}
      {saved && <div className="options-success">Saved!</div>}

      <main className="options-main">
        {/* API Configuration */}
        <section className="options-section">
          <h2>🔑 API Configuration</h2>

          {user ? (
            <div className="options-info">
              <p>✅ Using API key from your Chameleon account</p>
              <button className="options-btn options-btn-small" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <div className="options-field">
                <label>OpenRouter API Key</label>
                <div className="options-input-group">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.apiKey}
                    onChange={(e) => updateSetting("apiKey", e.target.value)}
                    placeholder="sk-or-v1-..."
                  />
                  <button className="options-toggle-btn" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="options-hint">
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">Get API key</a>
                </p>
              </div>
              <button className="options-btn options-btn-small" onClick={() => setAuthMode("login")}>
                Or sign in to your account
              </button>
            </>
          )}
        </section>

        {/* AI Defaults */}
        <section className="options-section">
          <h2>🤖 AI Defaults</h2>

          <div className="options-field">
            <label>Default Persona</label>
            <select
              value={settings.selectedPersona}
              onChange={(e) => updateSetting("selectedPersona", e.target.value)}
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>

          <div className="options-field">
            <label>Default Model</label>
            <select
              value={settings.selectedModel}
              onChange={(e) => updateSetting("selectedModel", e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className="options-hint">Models with (Vision) support screenshot analysis</p>
          </div>
        </section>

        {/* Extension Features */}
        <section className="options-section">
          <h2>⚡ Extension Features</h2>

          <div className="options-feature">
            <div className="options-feature-header">
              <span>📋 Context Menu</span>
              <label className="options-switch">
                <input
                  type="checkbox"
                  checked={settings.enableContextMenu !== false}
                  onChange={(e) => updateSetting("enableContextMenu", e.target.checked)}
                />
                <span className="options-switch-slider"></span>
              </label>
            </div>
            <p className="options-hint">Right-click selected text to explain, summarize, translate, etc.</p>
          </div>

          <div className="options-feature">
            <div className="options-feature-header">
              <span>📸 Screenshot Analysis</span>
              <span className="options-badge">Vision models</span>
            </div>
            <p className="options-hint">Right-click page → "Analyze screenshot" to understand page content</p>
          </div>

          <div className="options-feature">
            <div className="options-feature-header">
              <span>📄 Page Summarizer</span>
              <span className="options-badge">Built-in</span>
            </div>
            <p className="options-hint">Right-click page → "Summarize this page" for quick summaries</p>
          </div>

          <div className="options-feature">
            <div className="options-feature-header">
              <span>🎤 Voice Input</span>
              <label className="options-switch">
                <input
                  type="checkbox"
                  checked={settings.voiceEnabled}
                  onChange={(e) => updateSetting("voiceEnabled", e.target.checked)}
                />
                <span className="options-switch-slider"></span>
              </label>
            </div>
            <p className="options-hint">Use microphone for voice-to-text in popup</p>
          </div>
        </section>

        {/* Web Search */}
        <section className="options-section">
          <h2>🔍 Web Search</h2>
          <p className="options-hint" style={{ marginBottom: 12 }}>
            Power the "Web search" context menu action with real-time search results
          </p>

          <div className="options-field">
            <label>Search Provider</label>
            <select
              value={settings.searchProvider || "duckduckgo"}
              onChange={(e) => updateSetting("searchProvider", e.target.value as any)}
            >
              <option value="duckduckgo">DuckDuckGo (Free)</option>
              <option value="tavily" disabled={!settings.tavilyKey}>
                Tavily {settings.tavilyKey ? "" : "(needs API key)"}
              </option>
            </select>
          </div>

          <div className="options-field">
            <label>Tavily API Key (Optional)</label>
            <div className="options-input-group">
              <input
                type={showTavilyKey ? "text" : "password"}
                value={settings.tavilyKey || ""}
                onChange={(e) => updateSetting("tavilyKey", e.target.value)}
                placeholder="tvly-..."
              />
              <button className="options-toggle-btn" onClick={() => setShowTavilyKey(!showTavilyKey)}>
                {showTavilyKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="options-hint">
              Better search results with AI answers.{" "}
              <a href="https://tavily.com" target="_blank" rel="noreferrer">Get free key</a> (1000/month)
            </p>
          </div>
        </section>

        {/* Privacy */}
        <section className="options-section">
          <h2>🔒 Privacy</h2>

          <div className="options-feature">
            <div className="options-feature-header">
              <span>Save Chat History</span>
              <label className="options-switch">
                <input
                  type="checkbox"
                  checked={settings.saveHistory !== false}
                  onChange={(e) => updateSetting("saveHistory", e.target.checked)}
                />
                <span className="options-switch-slider"></span>
              </label>
            </div>
            <p className="options-hint">Store conversations locally in browser</p>
          </div>

          <button className="options-btn options-btn-danger" onClick={handleClearData} style={{ marginTop: 12 }}>
            Clear All Data
          </button>
        </section>

        {/* Save */}
        <section className="options-actions">
          <button className="options-btn options-btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </section>

        {/* About */}
        <section className="options-section options-about">
          <p><strong>Chameleon AI</strong> v0.1.0</p>
          <div className="options-links">
            <a href="https://chameleonai.chat" target="_blank" rel="noreferrer">Web App</a>
            <a href="https://github.com/ChameleonAI/chameleon" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </section>
      </main>
    </div>
  )
}
