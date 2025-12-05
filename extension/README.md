# 🦎 Chameleon AI - Browser Extension

**One codebase, two browsers**: Chrome & Firefox support

## Architecture

```
extension/
├── src/
│   ├── background/          # Service worker (Chrome) / Background script (Firefox)
│   │   ├── index.ts        # Main background logic
│   │   └── message-handler.ts
│   ├── content/            # Content scripts (inject into web pages)
│   │   ├── inject.ts       # Highlight & Ask, Page context
│   │   └── styles.css      # Injected styles
│   ├── popup/              # Quick chat popup (400x600px)
│   │   ├── Popup.tsx       # Main popup UI
│   │   ├── index.html
│   │   └── index.tsx
│   ├── sidepanel/          # Chrome-only: Full chat experience
│   │   ├── Sidepanel.tsx
│   │   ├── index.html
│   │   └── index.tsx
│   ├── shared/             # Shared utilities
│   │   ├── api.ts          # OpenRouter API calls
│   │   ├── storage.ts      # chrome.storage wrapper
│   │   ├── types.ts        # Shared types
│   │   └── personas.ts     # From main app
│   └── options/            # Settings page
│       ├── Options.tsx
│       ├── index.html
│       └── index.tsx
├── build/                  # Build scripts
│   ├── build-chrome.sh
│   └── build-firefox.sh
├── manifest-chrome.json    # Chrome Manifest V3
├── manifest-firefox.json   # Firefox Manifest V2
├── package.json
└── tsconfig.json
```

## Features

### 1. **Highlight & Ask**
Select any text on a webpage → Right-click → "Ask Chameleon"
- Explain
- Summarize
- Translate
- Custom prompt

### 2. **Page Summarizer**
Click extension icon → "Summarize Page"
- Uses Readability.js to extract main content
- Sends to selected persona
- Shows summary in popup

### 3. **Writing Assistant**
Inject into text inputs (Gmail, Twitter, LinkedIn, etc.)
- Improve writing
- Fix grammar
- Change tone (formal/casual)
- Expand/shorten

### 4. **Sidebar Chat** (Chrome only)
Full Chameleon chat experience in sidebar
- All 18+ personas
- Model switching
- Voice input/output
- Memory system

### 5. **Quick Popup**
400x600px popup with:
- Recent chats
- Quick message input
- Persona selector
- "Open full app" button

## Technology Stack

- **Build**: Vite + TypeScript + React
- **Manifest**: Separate for Chrome V3 & Firefox V2
- **Storage**: chrome.storage.sync (cross-device sync)
- **API**: OpenRouter (shared with main app)
- **Content Extraction**: @mozilla/readability
- **Bundling**: Platform-specific builds

## Development

```bash
# Install dependencies
pnpm install

# Dev mode (Chrome)
pnpm dev:chrome

# Dev mode (Firefox)
pnpm dev:firefox

# Build for Chrome
pnpm build:chrome
# Output: dist/chrome/

# Build for Firefox
pnpm build:firefox
# Output: dist/firefox/

# Package for stores
pnpm package:chrome  # → chameleon-chrome.zip
pnpm package:firefox # → chameleon-firefox.xpi
```

## Installation (Dev)

### Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/chrome/`

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `dist/firefox/manifest.json`

## Key Differences: Chrome vs Firefox

| Feature | Chrome (Manifest V3) | Firefox (Manifest V2) |
|---------|---------------------|---------------------|
| Background | Service Worker | Background Page |
| Sidepanel | ✅ Supported | ❌ Not supported (use popup) |
| Persistent storage | chrome.storage | browser.storage |
| Content Security Policy | Strict (no eval) | More permissive |
| WebExtension API | `chrome.*` | `browser.*` (Promises) |

## Build Strategy

**Shared code** (~95%):
- All UI components (React)
- API layer (OpenRouter)
- Storage abstraction
- Personas & types

**Platform-specific** (~5%):
- manifest.json
- Background script initialization
- Storage API wrapper (chrome/browser)
- Sidepanel (Chrome only)

## Publishing

### Chrome Web Store
1. Create developer account ($5 fee)
2. Upload `chameleon-chrome.zip`
3. Fill store listing (screenshots, description)
4. Review: 1-3 days

### Firefox Add-ons
1. Create developer account (free)
2. Upload `chameleon-firefox.xpi`
3. Fill store listing
4. Review: 1-7 days

## Permissions Needed

```json
{
  "permissions": [
    "storage",           // Save settings & chats
    "activeTab",         // Access current tab content
    "contextMenus",      // Right-click "Ask Chameleon"
    "sidePanel"          // Chrome sidebar (Chrome only)
  ],
  "host_permissions": [
    "https://openrouter.ai/*",  // API calls
    "https://api.openai.com/*"  // Voice/embeddings
  ]
}
```

## Privacy

- ✅ No data collection
- ✅ No tracking
- ✅ API keys stored locally (chrome.storage.sync)
- ✅ All processing client-side
- ✅ Open source

## Future Features

- [ ] Offline mode (local models)
- [ ] Custom personas
- [ ] Team collaboration
- [ ] Chrome <-> Firefox sync via Chameleon account
- [ ] Mobile browser support (Firefox Android)
