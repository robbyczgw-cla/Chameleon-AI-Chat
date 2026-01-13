# Live Code Sandbox

Run React, HTML, Vue, and JavaScript code directly in chat messages. Powered by [Sandpack](https://sandpack.codesandbox.io/) from CodeSandbox.

## Overview

The Live Code Sandbox feature allows AI-generated code to be executed and previewed in real-time within the chat interface. This brings an "artifact-like" experience similar to Claude Artifacts, but running entirely in the user's browser with zero server cost.

## How to Enable

1. **Requirement:** Advanced Mode must be enabled (Simple Mode hides this setting)
2. Open **Settings** → **Labs** tab
3. Toggle **"Live Code Sandbox"** ON
4. This will also auto-enable **Syntax Highlighting** (required for the Run button)

## How to Use

### Method 1: Run Button on Code Blocks

When the feature is enabled, hovering over any supported code block reveals a **"Run"** button:

1. Ask the AI to write React/HTML/Vue/JavaScript code
2. Hover over the code block
3. Click **"Run"** → A live preview appears below the code
4. Click **"Stop"** to close the preview

**Supported Languages:**
| Language | Template |
|----------|----------|
| `jsx`, `tsx` | React |
| `html` | Static HTML |
| `javascript`, `js` | Vanilla JS |
| `vue` | Vue 3 |
| `svelte` | Svelte |

### Method 2: AI [SANDBOX] Tag

The AI can explicitly create a sandbox using the `[SANDBOX]` tag:

```markdown
[SANDBOX template="react" title="My Counter"]
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Clicked {count} times
    </button>
  )
}
[/SANDBOX]
```

**Attributes:**
- `template` - One of: `react`, `vanilla`, `static`, `vue`, `svelte` (default: `react`)
- `title` - Optional display title for the sandbox

## Sandbox Controls

When a sandbox is active, you have access to:

| Button | Function |
|--------|----------|
| **Code** (</>) | Toggle the code editor view |
| **Terminal** | Toggle the console output |
| **Expand** | Fullscreen mode |
| **Reset** | Reset code to original |

## Features

- **Tailwind CSS included** - The CDN version of Tailwind is automatically loaded
- **Auto-dependency detection** - npm imports are automatically detected and installed
- **Theme sync** - Sandbox matches your light/dark theme
- **Editable code** - Toggle the editor to modify and re-run code
- **Console output** - View logs and errors

## Technical Details

### Bundle Size
- ~300KB loaded on first "Run" click
- Lazy-loaded via Next.js dynamic imports
- Only loads when feature is used

### Security
- All code runs in a sandboxed iframe
- Cannot access parent window, cookies, or localStorage
- Network requests are isolated
- Same security model as CodeSandbox embeds

### Performance
- Code execution is client-side only
- Zero server resources used
- Each sandbox is isolated

## Files Changed

This feature added/modified the following files:

### New Files
| File | Purpose |
|------|---------|
| `/lib/sandpack-utils.ts` | Template detection, file generation utilities |
| `/components/rich-content/sandpack-preview.tsx` | Main sandbox component with UI controls |
| `/components/rich-content/lazy-sandpack.tsx` | Lazy loading wrapper (~300KB deferred) |

### Modified Files
| File | Changes |
|------|---------|
| `/types/index.ts` | Added `enableLiveCodeSandbox` to ExperimentalSettings |
| `/components/experimental-settings.tsx` | Added toggle UI in Labs section |
| `/components/chat-messages.tsx` | Added "Run" button to CodeBlock component |
| `/lib/rich-content-parser.tsx` | Added `[SANDBOX]` tag parser |
| `/package.json` | Added `@codesandbox/sandpack-react` dependency |

## Example Prompts

Try asking the AI:

- "Create a React counter component"
- "Build a simple HTML form with validation"
- "Make a Vue 3 todo list"
- "Write a JavaScript function that animates a box"

## Limitations

- **No Python/other languages** - Only JavaScript-based languages are supported
- **No Node.js APIs** - Browser-only JavaScript (no `fs`, `path`, etc.)
- **No persistent storage** - Code resets when you close the sandbox
- **Memory usage** - Each sandbox uses browser memory; avoid running many simultaneously

## Troubleshooting

**Run button not appearing?**
- Ensure "Live Code Sandbox" is enabled in Settings → Labs
- Ensure you're in Advanced Mode (not Simple Mode)
- Check that the code block has a supported language tag (jsx, html, vue, etc.)

**Sandbox not loading?**
- Check browser console for errors
- Try refreshing the page
- Ensure you have a stable internet connection (Sandpack fetches npm packages)

**Code not running correctly?**
- Toggle the console view to see error messages
- Ensure imports are correct
- Check that you're exporting a default component for React
