# Browser Extension Design Document

## Executive Summary

This document outlines the design, functionality, security considerations, and benefits of developing Chrome and Firefox browser extensions for Chameleon AI Chat.

---

## 1. Current State

The project already has an extension scaffold in `/extension/` with:
- **Chrome Manifest V3** and **Firefox Manifest V2** configurations
- Background service worker with context menu integration
- Content script for page overlays
- Basic popup UI with persona selection
- Shared storage and API utilities

---

## 2. What It Could Look Like

### 2.1 Visual Design Concepts

#### Popup Interface (400x600px)
```
┌─────────────────────────────────────┐
│ 🦎 Chameleon AI           [⚙️] [📌] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Cami 🦎 ▼] [Claude 3.5 ▼]     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│                                     │
│   💬 Recent Conversations           │
│   ├── "Fix React useEffect..."      │
│   ├── "Explain this SQL query..."   │
│   └── "Help me write an email..."   │
│                                     │
│   🔥 Quick Actions                  │
│   [📄 Summarize Page]               │
│   [✍️ Writing Assistant]            │
│   [🔍 Research Mode]                │
│                                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Ask anything...                 │ │
│ │                           [➤]  │ │
│ └─────────────────────────────────┘ │
│      [🎤] [📎] [Open Full App →]    │
└─────────────────────────────────────┘
```

#### Sidebar Panel (Chrome Only)
Full chat experience in 320px sidebar:
- All 31 personas available
- Complete message history
- Voice input/output
- Memory system integration
- Cost tracking display

#### Context Menu
```
Right-click on selected text:
┌─────────────────────────────┐
│ 🦎 Chameleon AI          → │
│   ├── 💡 Explain this       │
│   ├── 📝 Summarize          │
│   ├── ✍️ Improve writing    │
│   ├── 🌐 Translate          │
│   ├── 💻 Explain code       │
│   ├── 🔍 Research this      │
│   └── ✨ Custom prompt...   │
└─────────────────────────────┘
```

#### Floating Response Card (on-page overlay)
```
┌───────────────────────────────────────────────┐
│ 🦎 Cami                               [✕]     │
├───────────────────────────────────────────────┤
│                                               │
│ The selected text discusses React's           │
│ useEffect hook, which handles side effects    │
│ in functional components...                   │
│                                               │
│ **Key points:**                               │
│ • Runs after render                           │
│ • Cleanup via return function                 │
│ • Dependencies array controls when it runs    │
│                                               │
├───────────────────────────────────────────────┤
│ [📋 Copy] [💬 Continue Chat] [📌 Pin]         │
└───────────────────────────────────────────────┘
```

#### Writing Assistant (text field injection)
```
┌─────────────────────────────────────────────────┐
│ Compose email...                                │
│                                                 │
│ Dear team, I wanted to discuss...               │
│                                                 │
└─────────────────────────────────────────────────┘
     ┌────────────────────────────────────┐
     │ 🦎 [✨ Improve] [🔧 Fix] [↔️ Tone] │
     │    [⬆️ Expand] [⬇️ Shorten]        │
     └────────────────────────────────────┘
```

---

## 3. Functionality Breakdown

### 3.1 Core Features

| Feature | Description | Chrome | Firefox |
|---------|-------------|--------|---------|
| **Quick Chat Popup** | 400x600px popup for quick queries | ✅ | ✅ |
| **Sidebar Panel** | Full chat in sidebar | ✅ | ❌ (API not available) |
| **Highlight & Ask** | Right-click selected text | ✅ | ✅ |
| **Page Summarizer** | One-click page summary | ✅ | ✅ |
| **Writing Assistant** | Inject into text fields | ✅ | ✅ |
| **Voice Input** | Whisper speech-to-text | ✅ | ✅ |
| **Voice Output** | TTS for responses | ✅ | ✅ |

### 3.2 Advanced Features

#### Research Mode
- Select topic → Extension searches web + extracts page content
- Combines with AI analysis for comprehensive research
- Exports findings as markdown notes

#### Code Assistant
- Detect code blocks on pages (GitHub, StackOverflow)
- "Explain this code" / "Find bugs" / "Suggest improvements"
- Syntax highlighting in responses
- Copy with proper formatting

#### Form Filler Assistant
- Detect form fields on page
- AI-assisted form completion
- Draft cover letters, applications, reviews

#### Shopping Assistant
- Product comparison on any e-commerce site
- Price tracking, review summarization

#### Email/Document Helper
- Gmail, Outlook, Google Docs integration
- Smart compose suggestions
- Reply drafts with tone matching
- Translation support

### 3.3 Persona-Specific Features

```typescript
// Feature flags by persona category
const personaFeatures = {
  creative: ["writing-assistant", "brainstorm-mode"],
  professional: ["email-helper", "document-analysis"],
  learning: ["explain-mode", "quiz-generator", "flashcards"],
  philosophy: ["debate-mode", "thought-experiments"],
  developer: ["code-assistant", "docs-lookup", "error-explainer"],
}
```

### 3.4 Cross-Device Sync

- Chat history synced via `chrome.storage.sync` (100KB limit)
- Optional Supabase cloud sync for larger storage
- Seamless handoff between extension and main app
- Shared memory system

---

## 4. Security Risks & Mitigations

### 4.1 High-Risk Concerns

| Risk | Severity | Description | Mitigation |
|------|----------|-------------|------------|
| **API Key Exposure** | 🔴 Critical | OpenRouter key stored in browser | Encrypt at rest; require master password; use short-lived tokens |
| **Content Script Injection** | 🔴 Critical | Malicious sites could try to access extension | Strict CSP; sandbox content scripts; validate all messages |
| **XSS in Responses** | 🔴 Critical | AI responses displayed as HTML | Sanitize all AI output; use DOMPurify; no `innerHTML` with untrusted content |
| **Man-in-the-Middle** | 🟠 High | API calls intercepted | HTTPS only; certificate pinning; validate response origins |
| **Cross-Origin Attacks** | 🟠 High | Malicious pages accessing extension data | Strict origin checks; use `runtime.connect` for trusted comms |

### 4.2 Medium-Risk Concerns

| Risk | Severity | Description | Mitigation |
|------|----------|-------------|------------|
| **Page Content Leakage** | 🟠 High | Extension sends page content to AI | Clear consent prompts; local-only mode option; data minimization |
| **Prompt Injection** | 🟠 High | Malicious page content manipulates AI | Input sanitization; system prompt hardening; output validation |
| **Session Hijacking** | 🟡 Medium | Stolen auth tokens | Short TTL; secure cookie flags; device binding |
| **Supply Chain Attacks** | 🟡 Medium | Compromised dependencies | Lockfile pinning; SRI hashes; regular audits |
| **Privacy Fingerprinting** | 🟡 Medium | Extension behavior reveals identity | Minimal permission requests; randomize timing |

### 4.3 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │   Content Script │ ←─→ │ Background Worker │                  │
│  │   (Sandboxed)    │     │  (Trusted Zone)   │                  │
│  │                  │     │                   │                  │
│  │ • DOM Observer   │     │ • API Key Store   │                  │
│  │ • Selection      │     │ • Message Router  │                  │
│  │ • Overlay UI     │     │ • Rate Limiter    │                  │
│  └────────┬─────────┘     └────────┬──────────┘                  │
│           │                        │                             │
│           │ Validated Messages     │ Encrypted                   │
│           ▼                        ▼                             │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │   Popup/Panel    │     │  Storage Layer   │                  │
│  │   (Isolated)     │     │  (Encrypted)     │                  │
│  └──────────────────┘     └──────────────────┘                  │
│                                    │                             │
└────────────────────────────────────┼─────────────────────────────┘
                                     │ HTTPS Only
                                     ▼
                        ┌──────────────────────┐
                        │   OpenRouter API     │
                        │   (External)         │
                        └──────────────────────┘
```

### 4.4 Security Best Practices

```typescript
// 1. Message validation
function validateMessage(message: unknown): message is TrustedMessage {
  if (!message || typeof message !== 'object') return false;
  if (!('type' in message) || !ALLOWED_TYPES.includes(message.type)) return false;
  if (!('origin' in message) || message.origin !== chrome.runtime.id) return false;
  return true;
}

// 2. Content sanitization
import DOMPurify from 'dompurify';
function sanitizeAIResponse(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

// 3. API key encryption
async function encryptApiKey(key: string, masterPassword: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(masterPassword), 'PBKDF2', false, ['deriveKey']
  );
  const derivedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('chameleon-salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, derivedKey, enc.encode(key)
  );
  return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
}

// 4. Rate limiting
const rateLimiter = new Map<string, number[]>();
function checkRateLimit(action: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimiter.get(action) || [];
  const recent = timestamps.filter(t => t > now - windowMs);
  if (recent.length >= maxRequests) return false;
  rateLimiter.set(action, [...recent, now]);
  return true;
}
```

### 4.5 Permission Justifications

```json
{
  "permissions": [
    "storage",        // Save API keys, chat history, settings
    "activeTab",      // Read selected text, inject UI on current tab
    "contextMenus",   // Right-click menu integration
    "sidePanel",      // Chrome sidebar (Chrome only)
    "scripting"       // Dynamic content script injection
  ],
  "host_permissions": [
    "https://openrouter.ai/*",   // AI model API
    "https://api.openai.com/*"   // Voice/embeddings
  ]
}
```

**Note:** We avoid requesting `<all_urls>` host permissions where possible. Content scripts use `activeTab` which only grants access to the current tab when the user explicitly invokes the extension.

---

## 5. What You Could Gain

### 5.1 User Experience Benefits

| Benefit | Impact | Description |
|---------|--------|-------------|
| **Instant Access** | 🔥 High | AI assistance one click away on any website |
| **Contextual Help** | 🔥 High | AI understands page context automatically |
| **Reduced Friction** | 🔥 High | No need to copy/paste to separate app |
| **Cross-Platform** | 🟡 Medium | Works on any website (Gmail, GitHub, etc.) |
| **Offline Popup** | 🟡 Medium | Quick settings access even offline |

### 5.2 Business/Product Benefits

| Benefit | Description |
|---------|-------------|
| **User Acquisition** | Extension stores are discovery channels (Chrome: 3B+ users) |
| **Engagement** | Users interact more frequently with extension than web app |
| **Stickiness** | Extension becomes part of daily workflow |
| **Upsell Path** | Free tier in extension → Premium features in main app |
| **Data Insights** | Usage patterns inform product development |
| **Brand Presence** | Constant visibility in browser toolbar |

### 5.3 Competitive Advantages

```
Chameleon Extension vs. Competitors:

┌──────────────────┬────────┬─────────┬──────────┬───────────┐
│ Feature          │ ChatGPT│ Claude  │ Perplexity│ Chameleon │
├──────────────────┼────────┼─────────┼──────────┼───────────┤
│ Multiple Personas│   ❌   │   ❌    │    ❌    │    ✅ 31  │
│ Model Choice     │ GPT-4  │ Claude  │ Various  │   100+    │
│ Cost Tracking    │   ❌   │   ❌    │    ❌    │    ✅     │
│ Emotion Aware    │   ❌   │   ❌    │    ❌    │    ✅     │
│ Memory System    │   ✅   │   ❌    │    ❌    │    ✅     │
│ Voice I/O        │   ✅   │   ❌    │    ❌    │    ✅     │
│ Page Context     │   ❌   │   ❌    │    ✅    │    ✅     │
│ Open Source      │   ❌   │   ❌    │    ❌    │    ✅     │
└──────────────────┴────────┴─────────┴──────────┴───────────┘
```

### 5.4 Monetization Opportunities

1. **Freemium Model**
   - Free: 50 messages/day, basic personas
   - Pro: Unlimited, all personas, advanced features

2. **API Key BYOK**
   - Users bring their own OpenRouter key
   - No infrastructure cost for you
   - Power users prefer this model

3. **Enterprise Features**
   - Team workspaces
   - Admin controls
   - Audit logs
   - Custom personas

### 5.5 Technical Synergies

The extension complements the main app:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chameleon Ecosystem                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  Web App    │←──→│  Extension  │←──→│  Mobile PWA │        │
│   │  (Full)     │    │  (Quick)    │    │  (Touch)    │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             │                                   │
│                      ┌──────┴──────┐                           │
│                      │  Supabase   │                           │
│                      │  (Sync)     │                           │
│                      └─────────────┘                           │
│                                                                 │
│   Shared: Personas, Memories, Cost Tracking, Settings          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Roadmap

### Phase 1: Core Extension (MVP)
- [ ] Popup with chat functionality
- [ ] Context menu: Explain, Summarize, Translate
- [ ] Content script overlay for responses
- [ ] Settings page with API key management
- [ ] Chrome and Firefox builds

### Phase 2: Enhanced Features
- [ ] Sidebar panel (Chrome)
- [ ] Writing assistant injection
- [ ] Page summarization with Readability.js
- [ ] Voice input/output integration
- [ ] Chat history sync

### Phase 3: Advanced Integration
- [ ] Memory system integration
- [ ] All 31 personas
- [ ] Cost tracking
- [ ] Cross-device sync via Supabase
- [ ] Offline mode with cached responses

### Phase 4: Platform-Specific
- [ ] Safari extension (WebExtension + native)
- [ ] Edge extension (from Chrome build)
- [ ] Firefox Android support

---

## 7. Technical Specifications

### Build Pipeline

```bash
# Development
pnpm dev:chrome     # Hot-reload Chrome build
pnpm dev:firefox    # Hot-reload Firefox build

# Production
pnpm build:chrome   # → dist/chrome/
pnpm build:firefox  # → dist/firefox/

# Packaging
pnpm package:chrome  # → chameleon-chrome.zip
pnpm package:firefox # → chameleon-firefox.xpi
```

### Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@mozilla/readability": "^0.5.0",
    "dompurify": "^3.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "@crxjs/vite-plugin": "^2.0.0-beta"
  }
}
```

### Storage Schema

```typescript
interface ExtensionStorage {
  // Settings
  apiKey: string;              // Encrypted
  selectedPersona: string;
  selectedModel: string;
  theme: 'light' | 'dark' | 'system';

  // Chat history (recent only, full history in main app)
  recentChats: StoredChat[];   // Max 10

  // Sync flags
  lastSyncTimestamp: number;
  supabaseUserId?: string;
}
```

---

## 8. Conclusion

A browser extension for Chameleon AI Chat offers significant benefits:

**Pros:**
- Instant AI access across all websites
- Competitive differentiation with 31 personas + 100 models
- New user acquisition channel
- Enhanced engagement and retention
- Synergy with existing web app

**Cons/Risks:**
- Security surface area increases
- Maintenance burden (2 manifest versions)
- Store review processes can be slow
- API key management complexity

**Recommendation:** Proceed with development, prioritizing security from day one. The existing scaffold provides a solid foundation. Focus on the MVP features first, then iterate based on user feedback.

---

*Document created: 2024-12-28*
*Last updated: 2024-12-28*
