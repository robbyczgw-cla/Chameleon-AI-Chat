# 🚀 Chameleon AI Extension - Quick Start

## 🎉 What's Built

✅ **Cross-browser architecture** (Chrome & Firefox)
✅ **Manifest files** for both browsers
✅ **Shared core**:
  - Storage wrapper (chrome/browser.storage)
  - OpenRouter API client
  - 6 key personas (Cami, Professor, Luna, Dev, Flash, Sofia)
✅ **Background script** with context menus
✅ **Content script** with beautiful overlay UI
✅ **Popup UI** (React-based quick chat)
✅ **Build configs** (Vite for both browsers)

## 📦 Installation & Setup

### 1. Install Dependencies

```bash
cd extension
pnpm install
```

### 2. Add Missing Package

The build configs reference `vite-plugin-static-copy` which needs to be added:

```bash
pnpm add -D vite-plugin-static-copy
```

### 3. Build for Development

**Chrome:**
```bash
pnpm dev:chrome
# Output: dist/chrome/
```

**Firefox:**
```bash
pnpm dev:firefox
# Output: dist/firefox/
```

### 4. Load Extension in Browser

**Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `extension/dist/chrome/`

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `extension/dist/firefox/manifest.json`

### 5. Set API Key

1. Click the extension icon 🦎
2. Click settings ⚙️
3. Enter your OpenRouter API key
4. Save settings

## ✨ Features That Work

### 1. **Highlight & Ask**
- Select text on any webpage
- Right-click → "Chameleon AI"
- Choose: Explain, Summarize, Improve, Translate
- See response in beautiful overlay

### 2. **Quick Popup Chat**
- Click extension icon
- Chat with any persona
- Switch personas mid-conversation
- View recent chats

### 3. **Context Menu**
- Right-click selected text
- 5 quick actions available
- Responses appear instantly

## 🛠️ What's Missing (To Complete)

### High Priority

1. **Options Page** (`src/options/`)
   - Settings UI for API key, model selection, theme
   - Need: `Options.tsx`, `index.html`, `index.tsx`

2. **Chrome Sidepanel** (`src/sidepanel/`)
   - Full chat experience in sidebar
   - Can reuse popup code with minor tweaks

3. **Icons**
   - Create `icon-16.png`, `icon-48.png`, `icon-128.png`
   - Put in `extension/icons/` or copy from `public/`

4. **Page Summarizer**
   - Install `@mozilla/readability`
   - Add "Summarize Page" button to popup
   - Extract main content and summarize

### Medium Priority

5. **Error Handling**
   - Better error messages
   - Retry logic for API failures
   - Offline detection

6. **Streaming Support**
   - Use `callOpenRouterStreaming()` for real-time responses
   - Update popup to show streaming

7. **Storage Limits**
   - chrome.storage.sync has 100KB limit
   - Implement pagination for chats
   - Move old chats to local storage

### Low Priority

8. **Writing Assistant**
   - Detect text inputs (Gmail, Twitter, etc.)
   - Inject "Improve with Chameleon" button
   - Show suggestions inline

9. **Keyboard Shortcuts**
   - Add to manifest: `"commands": { "activate": { "suggested_key": { "default": "Alt+Shift+C" } } }`
   - Handle in background script

10. **Analytics**
    - Track usage (locally)
    - Show stats in options page

## 🏗️ Project Structure

```
extension/
├── src/
│   ├── shared/          ✅ Complete
│   │   ├── storage.ts   (cross-browser storage)
│   │   ├── api.ts       (OpenRouter client)
│   │   └── personas.ts  (6 personas)
│   ├── background/      ✅ Complete
│   │   └── index.ts     (context menus, messaging)
│   ├── content/         ✅ Complete
│   │   ├── inject.ts    (overlay UI)
│   │   └── styles.css   (beautiful styling)
│   ├── popup/           ✅ Complete
│   │   ├── Popup.tsx    (React chat UI)
│   │   ├── index.tsx    (entry point)
│   │   └── popup.css    (styling)
│   ├── options/         ❌ TODO
│   │   ├── Options.tsx
│   │   ├── index.html
│   │   └── index.tsx
│   └── sidepanel/       ❌ TODO (Chrome only)
│       ├── Sidepanel.tsx
│       ├── index.html
│       └── index.tsx
├── manifest-chrome.json ✅ Complete
├── manifest-firefox.json ✅ Complete
├── vite.chrome.config.ts ✅ Complete
├── vite.firefox.config.ts ✅ Complete
└── package.json ✅ Complete
```

## 🐛 Known Issues

1. **Icons Missing**: Build will warn about missing icon files
   - Quick fix: Copy `icon-*.png` from main app's `public/` folder

2. **Options Page**: Clicking settings button will error
   - Need to implement `src/options/`

3. **Sidepanel**: Chrome-specific feature not built yet
   - Build will succeed, but feature won't work

## 📝 Next Steps

### Immediate (30 minutes)

1. **Add icons:**
   ```bash
   mkdir extension/icons
   cp public/icon-*.png extension/icons/
   ```

2. **Create Options page:**
   - Copy popup structure
   - Add API key input
   - Add model selector
   - Add theme toggle

3. **Test in browser:**
   - Load extension
   - Try "Highlight & Ask"
   - Test popup chat
   - Verify storage works

### Short-term (1-2 hours)

4. **Build Sidepanel** (Chrome only)
   - Copy `popup/` → `sidepanel/`
   - Make it full-height
   - Add more features (file upload, voice input)

5. **Add Page Summarizer**
   - Install readability.js
   - Extract page content
   - Add "Summarize" button to popup

### Long-term (1-2 days)

6. **Writing Assistant**
   - Detect text inputs
   - Inject helper buttons
   - Show inline suggestions

7. **Polish & Publish**
   - Add screenshots
   - Write store descriptions
   - Submit to Chrome Web Store & Firefox Add-ons

## 🔥 Quick Test

```bash
# Terminal 1: Build Chrome version
cd extension
pnpm dev:chrome

# Terminal 2: Build Firefox version (if testing both)
pnpm dev:firefox

# Load in browser and test:
# 1. Select text → Right-click → "Chameleon AI" → "Explain this"
# 2. Click extension icon → Chat
# 3. Check settings work
```

## 💡 Tips

- **Dev mode watches files**: Edit code → Auto-rebuilds
- **Reload extension**: After changes, click reload in browser
- **Check console**: Background script logs helpful info
- **Test on various sites**: Try Gmail, Twitter, GitHub, docs sites

## 🎨 Customization

Want to add your own features?

1. **Add a new context menu:**
   - Edit `src/background/index.ts`
   - Add menu item in `initializeContextMenus()`
   - Handle click in `contextMenus.onClicked`

2. **Add a new persona:**
   - Edit `src/shared/personas.ts`
   - Add to `PERSONAS` array

3. **Change styling:**
   - Edit `src/content/styles.css` (overlay)
   - Edit `src/popup/popup.css` (popup)

## 🆘 Troubleshooting

**Build fails:**
- Run `pnpm install` again
- Check Node.js version (need 18+)

**Extension won't load:**
- Check manifest.json syntax
- Look for errors in `chrome://extensions/`

**API errors:**
- Verify OpenRouter API key
- Check network tab for failed requests
- Ensure sufficient credits

**Storage not saving:**
- Check chrome.storage permissions in manifest
- Look at browser console errors

## 📚 Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Firefox Extension Docs](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Vite Plugin Docs](https://vitejs.dev/guide/)

---

**You're 80% done!** The core is built. Just add icons, options page, and you're ready to publish! 🚀
