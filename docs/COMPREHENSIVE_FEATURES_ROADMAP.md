# 🚀 Comprehensive Features Roadmap

Complete implementation guide for: Mobile Apps, Browser Extensions, Rich Message Types, Font Choices, and Compact Mode.

---

## 📱 **1. Mobile Apps (Android & iOS)**

### **Option A: React Native (RECOMMENDED)**

**Pros:**
- ✅ Share 95% of code with web app
- ✅ One codebase for iOS + Android
- ✅ Your team already knows React
- ✅ Faster development (2-3 months vs 6+ months native)
- ✅ Can reuse existing components with react-native-web
- ✅ Hot reload during development

**Cons:**
- ❌ Slightly less performant than native
- ❌ Some native features require bridges
- ❌ App size ~15-20MB

**Implementation:**

```bash
# 1. Setup React Native project
npx react-native init ChameleonMobile --template react-native-template-typescript

# 2. Install shared dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-webview # For rich embeds
npm install @react-native-async-storage/async-storage # Replace localStorage
npm install react-native-voice # For voice input
npm install react-native-fs # For file handling
npm install react-native-share # For sharing chats
```

**Architecture:**
```
/mobile (new folder)
  /src
    /components (copy from web, adapt)
    /screens
      - ChatScreen.tsx
      - PersonasScreen.tsx
      - SettingsScreen.tsx
    /lib (shared logic from web)
    /navigation
      - MainNavigator.tsx (tab navigation)
/shared (move shared code here)
  /lib (API calls, utils, types)
  /contexts (AppContext, etc - adapt for mobile)
```

**Key Adaptations:**
- Replace `next/link` → `@react-navigation/native`
- Replace `localStorage` → `AsyncStorage`
- Replace `next/image` → `react-native-fast-image`
- Replace `shadcn/ui` → `react-native-paper` or `react-native-elements`
- Adapt touch gestures (already mobile-first!)

**Timeline:** 2-3 months with 1 dev

---

### **Option B: Native (Swift + Kotlin)**

**Only choose if:**
- You need 100% native performance
- You're building games/AR features
- You have native iOS/Android devs on team
- Budget for 2 separate codebases

**Timeline:** 6+ months with 2 devs (1 iOS, 1 Android)

---

### **Option C: Capacitor (Alternative to React Native)**

**Hybrid approach:**
- Wrap your existing Next.js app
- Add native plugins as needed
- Easier than React Native, but less performant

```bash
npm install @capacitor/core @capacitor/cli
npx cap init ChameleonAI com.chameleon.ai
npx cap add ios
npx cap add android
```

**Timeline:** 1 month (but limited native feel)

---

## 🔌 **2. Browser Extensions (Chrome & Firefox)**

### **Architecture: Shared Codebase with Platform-Specific Builds**

```
/extension
  /src
    /background
      - service-worker.ts (Chrome)
      - background.ts (Firefox)
    /content
      - inject.ts (runs on every page)
    /popup
      - Popup.tsx (quick chat UI)
    /sidepanel (Chrome only)
      - Sidepanel.tsx (full chat experience)
    /shared
      - api.ts (OpenRouter calls)
      - storage.ts (chrome.storage)
  /build
    - build-chrome.sh
    - build-firefox.sh
  manifest-v3.json (Chrome)
  manifest-v2.json (Firefox)
```

### **Features to Implement:**

**1. Highlight & Ask**
```typescript
// content/inject.ts
document.addEventListener('mouseup', () => {
  const selected = window.getSelection()?.toString()
  if (selected && selected.length > 3) {
    showContextMenu(selected)
  }
})

function showContextMenu(text: string) {
  // Show floating menu: "Ask Chameleon", "Explain", "Summarize"
}
```

**2. Page Summarizer**
```typescript
// Extract main content using Readability.js
import { Readability } from '@mozilla/readability'

function summarizePage() {
  const doc = new Readability(document.cloneNode(true)).parse()
  chrome.runtime.sendMessage({
    type: 'SUMMARIZE',
    content: doc.textContent
  })
}
```

**3. Writing Assistant**
```typescript
// Inject into text inputs (Gmail, Twitter, etc.)
const inputs = document.querySelectorAll('textarea, [contenteditable]')
inputs.forEach(input => {
  addAssistantButton(input)
})
```

**4. Sidebar Chat (Chrome)**
```typescript
// manifest-v3.json
{
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

**5. Quick Popup**
- Small 400x600px window
- Recent chats
- Quick message input
- Opens full app in new tab

### **Storage:**
```typescript
// Use chrome.storage.sync (syncs across devices)
chrome.storage.sync.set({
  apiKey: 'xxx',
  chats: [...],
  settings: {...}
})
```

### **Permissions Needed:**
```json
{
  "permissions": [
    "storage",
    "activeTab",
    "contextMenus",
    "sidePanel"
  ],
  "host_permissions": [
    "https://openrouter.ai/*"
  ]
}
```

### **Build Process:**
```bash
# Chrome
npm run build:chrome
# Output: extension-chrome.zip

# Firefox
npm run build:firefox
# Output: extension-firefox.zip
```

**Timeline:** 1-2 months for full-featured extension

---

## 🎨 **3. Rich Message Types - Missing Features**

### **What to Add:**

#### **A. Interactive Polls**
```typescript
// Poll format
[POLL]
{
  "question": "Which feature should we build next?",
  "options": ["Mobile App", "API", "Desktop App"],
  "multiSelect": false,
  "expiresAt": "2025-01-01"
}
[/POLL]
```

**Render:**
```tsx
<Card>
  <h3>{poll.question}</h3>
  {poll.options.map(opt => (
    <Button
      onClick={() => vote(opt)}
      variant={voted === opt ? 'default' : 'outline'}
    >
      {opt} ({getVoteCount(opt)})
    </Button>
  ))}
</Card>
```

#### **B. Interactive Tables**
```markdown
[TABLE sortable searchable]
| Name | Price | Change |
|------|-------|--------|
| BTC  | $95k  | +2.3%  |
| ETH  | $3.2k | +5.1%  |
[/TABLE]
```

**Render with shadcn/ui DataTable:**
```tsx
<DataTable
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Price', accessor: 'price', sortable: true },
  ]}
  data={parseTable(markdown)}
  searchable
  pagination
/>
```

#### **C. Timelines**
```markdown
[TIMELINE]
- 2020: Founded
- 2021: Series A ($10M)
- 2022: Launched MVP
- 2023: 10k users
- 2024: Series B ($50M)
[/TIMELINE]
```

**Render with vertical timeline UI**

#### **D. Mermaid Diagrams**
```bash
npm install mermaid
```

```tsx
import mermaid from 'mermaid'

// Detect mermaid blocks
if (code.startsWith('mermaid')) {
  return <MermaidDiagram code={code} />
}

function MermaidDiagram({ code }) {
  useEffect(() => {
    mermaid.init(undefined, '.mermaid')
  }, [])

  return <div className="mermaid">{code}</div>
}
```

**Supports:**
- Flowcharts
- Sequence diagrams
- Gantt charts
- Class diagrams
- State diagrams

#### **E. Math Equations (LaTeX)**
```bash
npm install katex react-katex
```

```tsx
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

// Inline: $E = mc^2$
<InlineMath math="E = mc^2" />

// Block:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
<BlockMath math="\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}" />
```

#### **F. Interactive Code Sandboxes**
```tsx
// For code blocks, add "Run" button
<div>
  <SyntaxHighlighter>{code}</SyntaxHighlighter>
  <Button onClick={() => runInSandbox(code)}>
    ▶️ Run Code
  </Button>
</div>

function runInSandbox(code: string) {
  // Open CodeSandbox/StackBlitz with code
  const sandbox = createSandbox({
    files: {
      'index.js': { content: code }
    }
  })
  window.open(sandbox.url)
}
```

#### **G. Collapsible Sections**
```markdown
<details>
<summary>Click to expand</summary>

Hidden content here...

</details>
```

Already supported by GitHub Flavored Markdown!

#### **H. Progress Bars**
```typescript
[PROGRESS value=75 max=100 label="Loading..."]
```

```tsx
<Card>
  <p className="text-sm mb-2">{label}</p>
  <Progress value={value} max={max} />
  <p className="text-xs text-muted-foreground mt-1">
    {value}/{max} ({Math.round(value/max*100)}%)
  </p>
</Card>
```

#### **I. Comparison Cards**
```markdown
[COMPARE]
## Option A
- Pro 1
- Pro 2
- Con 1

## Option B
- Pro 1
- Pro 2
- Con 1
[/COMPARE]
```

**Render as side-by-side cards with visual styling**

---

## 🔤 **4. Font Choices Implementation**

### **Fonts to Offer:**

**1. Sans-Serif (Readability)**
- Inter (default) ← already using?
- **Atkinson Hyperlegible** (dyslexia-friendly)
- **Open Dyslexic** (specifically for dyslexia)
- System Font (native OS font)

**2. Serif (Traditional)**
- **Literata** (Google Fonts, reader-friendly)
- **Lora** (elegant, professional)

**3. Monospace (Coding)**
- **JetBrains Mono** (ligatures, powerline)
- **Fira Code** (popular, ligatures)
- **Consolas** (Windows system font)

**4. Fun (Optional)**
- **Comic Neue** (improved Comic Sans)
- **Lexend** (research-backed readability)

### **Implementation:**

**1. Add Fonts to Globals**
```css
/* app/globals.css */

/* Atkinson Hyperlegible */
@font-face {
  font-family: 'Atkinson Hyperlegible';
  src: url('/fonts/atkinson-hyperlegible.woff2') format('woff2');
  font-weight: 400 700;
  font-display: swap;
}

/* JetBrains Mono */
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/jetbrains-mono.woff2') format('woff2');
  font-weight: 400 700;
  font-display: swap;
}

/* CSS Variables for easy switching */
:root {
  --font-body: 'Inter', sans-serif;
  --font-code: 'JetBrains Mono', monospace;
}

[data-font='atkinson'] {
  --font-body: 'Atkinson Hyperlegible', sans-serif;
}

[data-font='jetbrains'] {
  --font-body: 'JetBrains Mono', monospace;
}

/* Apply */
body {
  font-family: var(--font-body);
}

code, pre {
  font-family: var(--font-code);
}
```

**2. Settings UI**
```tsx
// components/font-selector.tsx
const FONTS = [
  { id: 'inter', name: 'Inter', category: 'sans-serif', preview: 'Aa' },
  { id: 'atkinson', name: 'Atkinson Hyperlegible', category: 'dyslexia', preview: 'Aa' },
  { id: 'opendyslexic', name: 'OpenDyslexic', category: 'dyslexia', preview: 'Aa' },
  { id: 'jetbrains', name: 'JetBrains Mono', category: 'monospace', preview: 'Aa' },
  { id: 'firacode', name: 'Fira Code', category: 'monospace', preview: 'Aa' },
  { id: 'system', name: 'System Font', category: 'system', preview: 'Aa' },
]

export function FontSelector() {
  return (
    <div className="space-y-4">
      <Label>Font Family</Label>
      <div className="grid grid-cols-2 gap-2">
        {FONTS.map(font => (
          <button
            key={font.id}
            onClick={() => setFont(font.id)}
            className={cn(
              'p-4 border rounded-lg text-left',
              selectedFont === font.id && 'border-primary bg-primary/5'
            )}
          >
            <div
              className="text-3xl mb-1"
              style={{ fontFamily: font.name }}
            >
              {font.preview}
            </div>
            <div className="text-sm font-medium">{font.name}</div>
            <div className="text-xs text-muted-foreground">{font.category}</div>
          </button>
        ))}
      </div>

      {/* Font Size Slider */}
      <div>
        <Label>Font Size</Label>
        <Slider
          value={[fontSize]}
          onValueChange={([v]) => setFontSize(v)}
          min={12}
          max={20}
          step={1}
        />
        <p className="text-sm text-muted-foreground mt-1">{fontSize}px</p>
      </div>

      {/* Line Height */}
      <div>
        <Label>Line Height</Label>
        <Slider
          value={[lineHeight]}
          onValueChange={([v]) => setLineHeight(v)}
          min={1.3}
          max={2.0}
          step={0.1}
        />
        <p className="text-sm text-muted-foreground mt-1">{lineHeight}</p>
      </div>
    </div>
  )
}
```

**3. Apply Font**
```typescript
// Apply to document root
useEffect(() => {
  document.documentElement.setAttribute('data-font', selectedFont)
  document.documentElement.style.setProperty('--font-size', `${fontSize}px`)
  document.documentElement.style.setProperty('--line-height', `${lineHeight}`)
}, [selectedFont, fontSize, lineHeight])
```

**Timeline:** 1 week

---

## 📐 **5. Compact Mode for Desktop**

### **Current UI:**
- Message padding: `p-4` (16px)
- Avatar size: 40x40px
- Line height: 1.6
- Sidebar width: 280px
- Header height: 64px

### **Compact Mode Changes:**

```css
/* Add to globals.css */
[data-compact='true'] {
  /* Reduce padding */
  --message-padding: 8px;
  --card-padding: 12px;

  /* Smaller avatars */
  --avatar-size: 28px;

  /* Tighter line height */
  --line-height: 1.4;

  /* Narrower sidebar */
  --sidebar-width: 220px;

  /* Shorter header */
  --header-height: 48px;

  /* Smaller font */
  --font-size: 13px;
}
```

**Apply to Components:**
```tsx
// chat-messages.tsx
<div className={cn(
  'p-4', // Default
  settings.compactMode && 'p-2' // Compact
)}>
```

**Settings Toggle:**
```tsx
<div className="flex items-center justify-between">
  <div>
    <Label>Compact Mode</Label>
    <p className="text-sm text-muted-foreground">
      Denser UI with smaller spacing (desktop only)
    </p>
  </div>
  <Switch
    checked={settings.compactMode}
    onCheckedChange={(checked) =>
      updateSettings({ compactMode: checked })
    }
  />
</div>
```

**Visual Comparison:**

```
Normal Mode:
┌────────────────────────────────┐
│                                │  ← 16px padding
│  👤  Hey, how are you?        │  ← 40px avatar
│      [16px spacing]            │
│                                │
│  🤖  I'm doing great!          │
│      [16px spacing]            │
│                                │
└────────────────────────────────┘

Compact Mode:
┌────────────────────────────────┐
│                                │  ← 8px padding
│ 👤 Hey, how are you?           │  ← 28px avatar
│   [8px spacing]                │
│ 🤖 I'm doing great!            │
│   [8px spacing]                │
└────────────────────────────────┘
                ↑
         33% more density
```

**Auto-Enable for Large Monitors:**
```typescript
useEffect(() => {
  // Auto-suggest compact mode for screens > 1920px width
  if (window.innerWidth > 1920 && !settings.compactMode) {
    toast({
      title: "Enable Compact Mode?",
      description: "Your large screen can benefit from denser UI",
      action: <Button onClick={() => updateSettings({ compactMode: true })}>
        Enable
      </Button>
    })
  }
}, [])
```

**Timeline:** 3-4 days

---

## 🎯 **Priority Ranking**

Based on impact and effort:

1. **✅ Font Choices** (1 week, high satisfaction)
2. **✅ Compact Mode** (3 days, power users love it)
3. **📊 Rich Message Types** (1-2 weeks, stagger implementation)
4. **🔌 Browser Extension** (1-2 months, huge reach)
5. **📱 React Native App** (2-3 months, major undertaking)

---

## 📊 **Development Timeline (with 1 full-time dev)**

**Month 1:**
- Week 1: Font choices + Compact mode ✅
- Week 2-4: Rich message types (polls, tables, mermaid)

**Month 2:**
- Week 1-2: Browser extension (Chrome)
- Week 3-4: Firefox adaptation + polish

**Month 3-4:**
- React Native app setup + core features

**Month 5:**
- Polish, testing, beta launch

---

**Want me to start implementing any of these? Pick a priority and I'll dive in! 🚀**
