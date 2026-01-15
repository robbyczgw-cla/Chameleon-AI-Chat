# TypeScript Cleanup Documentation

This document describes the TypeScript stability improvements made to the Chameleon AI Chat codebase, focusing on type safety fixes and patterns established for future development.

---

## Overview

The codebase had `ignoreBuildErrors: true` in `next.config.ts` to allow the app to build despite TypeScript errors. This cleanup effort addresses those errors systematically while maintaining backward compatibility.

### Progress Summary

| Round | Branch | Errors Before | Errors After | Status |
|-------|--------|---------------|--------------|--------|
| Round 1 | `fix/typescript-strict-mode` | 215 | 180 | Merged |
| Round 2 | `fix/typescript-cleanup-round2` | 180 | ~46 (extension only) | In Progress |

**Main app:** 0 TypeScript errors
**Extension:** ~46 errors (separate build config)
**Tests:** 235/235 passing

---

## Key Type Patterns Established

### 1. MessageContent Handling

The app uses `MessageContent` for multimodal support (text + images):

```typescript
// types/index.ts
export type MessageContent = string | MessageContentPart[]

export interface MessageContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: { url: string; detail?: "auto" | "low" | "high" }
}
```

**Pattern: Use `getTextContent()` when string is needed**

```typescript
import { getTextContent } from "@/lib/utils"

// Convert MessageContent to string
const text = getTextContent(message.content)

// In array maps
const userMessages = messages
  .filter(m => m.role === "user")
  .map(m => getTextContent(m.content))
```

**Files using this pattern:**
- `components/chat-input.tsx`
- `components/context-compression-dialog.tsx`
- `components/context-window-meter.tsx`
- `components/export-training-data-dialog.tsx`
- `components/model-comparison.tsx`
- `components/stats-dashboard.tsx`

### 2. React 19 useRef Requirements

React 19's TypeScript definitions require `useRef` to have an initial value:

```typescript
// Before (error in React 19)
const ref = useRef<T>()

// After - provide initial value
const ref = useRef<T | undefined>(undefined)

// For DOM refs
const containerRef = useRef<HTMLDivElement>(null)
```

**Return type for hooks:**
```typescript
// Allow null in return type
function useVirtualScroll<T>(): {
  containerRef: React.RefObject<HTMLDivElement | null>  // Not HTMLDivElement
}
```

### 3. Type Assertions for Spread Operations

When spreading partial objects into complete types:

```typescript
// For settings with required fields
updateSettings({
  memorySettings: {
    ...settings.memorySettings,
    enabled,
  } as MemorySettings,  // Assert the complete type
})
```

### 4. Timeout Promise Typing

When using `Promise.race` with timeouts:

```typescript
// Type the rejection promise as never
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error("Timeout")), 5000)
)

await Promise.race([actualPromise, timeoutPromise])
```

### 5. Session Null Checks

Supabase auth sessions can be null:

```typescript
// Before (error: possibly null)
if (event === "SIGNED_IN" && session.user)

// After - use optional chaining
if (event === "SIGNED_IN" && session?.user)
```

### 6. Navigator Type Narrowing

The `'share' in navigator` check causes TypeScript to narrow types incorrectly:

```typescript
// Problem: After this check, navigator is narrowed
if ('share' in navigator) { ... }
// navigator.clipboard now errors

// Solution: Use globalThis to get fresh reference
const nav = globalThis.navigator
if (nav?.clipboard) {
  await nav.clipboard.writeText(content)
}
```

### 7. Global Type Declarations

For browser extension APIs not in standard types:

```typescript
// Add at top of file
import type { Browser } from "webextension-polyfill"
declare const browser: Browser | undefined

// Then use with check
if (typeof browser !== "undefined") {
  browser.runtime.sendMessage(...)
}
```

### 8. Ref Callback Return Types

React ref callbacks should return void, not the assignment result:

```typescript
// Before (returns HTMLElement | null)
ref={(el) => (scrollRef.current = el)}

// After (returns void)
ref={(el) => { scrollRef.current = el }}
```

---

## Files Modified (Round 2)

### Batch 9 - MessageContent & React 19

| File | Changes |
|------|---------|
| `lib/openrouter.ts` | `ChatMessage.content` now accepts `MessageContent` |
| `components/chat-input.tsx` | `getTextContent()` for persona services |
| `components/context-compression-dialog.tsx` | `getTextContent()` for token calc |
| `components/context-window-meter.tsx` | `getTextContent()` for token calc |
| `components/export-training-data-dialog.tsx` | `getTextContent()` for export |
| `components/model-comparison.tsx` | `getTextContent()` for rendering |
| `components/stats-dashboard.tsx` | `getTextContent()` for AI analysis |
| `hooks/use-performance.ts` | React 19 `useRef()` with initial values |
| `lib/capacitor/share.ts` | `globalThis.navigator` for clipboard |

### Earlier Batches (Summary)

- **Batch 1-3:** Type assertions for settings spreads
- **Batch 4-5:** Browser extension global declarations
- **Batch 6-7:** Regex escape patterns, i18n fixes
- **Batch 8:** Lib utility type fixes

---

## Remaining Work

### Extension Directory (~46 errors)

The `/extension/` directory has its own build configuration and TypeScript setup. Remaining issues:

1. **Browser API Types** - Firefox `browser` vs Chrome `chrome` namespace
2. **Missing Modules** - `@mozilla/readability`, `vite-plugin-static-copy`
3. **Environment Variables** - `import.meta.env` not recognized
4. **MessageContent in UI** - Sidepanel rendering

These should be addressed in a separate PR with extension-specific TypeScript configuration.

### Future: Enable Strict Mode

Once all errors are resolved:

```typescript
// next.config.ts
typescript: {
  ignoreBuildErrors: false,  // Enable strict checking
}
```

---

## Testing Guidelines

After TypeScript changes:

```bash
# Run type check
npx tsc --noEmit

# Run tests
npm run test:run

# Check main app only (exclude extension)
npx tsc --noEmit 2>&1 | grep -E "^(app|components|hooks|lib|contexts|types)/"
```

---

## Helper Functions Reference

### `getTextContent(content: MessageContent): string`

Location: `lib/utils.ts`

Extracts text from MessageContent, handling both string and multimodal formats:

```typescript
export function getTextContent(content: MessageContent): string {
  if (typeof content === "string") {
    return content
  }
  return content
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map(part => part.text)
    .join("\n")
}
```

### `contentToText(content: MessageContent | undefined | null): string`

Location: `lib/multimodal-utils.ts`

Like `getTextContent` but handles null/undefined and adds `[Image]` placeholders:

```typescript
contentToText(message.content)  // Returns "" for null/undefined
```

---

## Contributing

When adding new code:

1. **Avoid `any` types** - Use proper typing or `unknown` with type guards
2. **Use existing helpers** - `getTextContent()`, `contentToText()` for MessageContent
3. **Provide initial values** - For `useRef<T>()` use `useRef<T | undefined>(undefined)`
4. **Test type changes** - Run `npx tsc --noEmit` before committing
5. **Document patterns** - Add to this file if establishing new patterns

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Codebase structure
- [TESTING.md](./TESTING.md) - Testing guidelines
- [contributing.md](./contributing.md) - Contribution process
