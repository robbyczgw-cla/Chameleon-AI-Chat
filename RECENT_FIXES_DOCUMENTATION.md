# Recent Fixes & Enhancements - Complete Guide

Complete documentation of recent commits for rebuilding in other projects.

**Date Range**: 2025-12-01 to 2025-12-13
**Branch**: claude/update-roadmap-docs-0166jyPXFcNrRb911zQCmGN8

---

## Table of Contents
1. [SearchSourcesBadge Implementation](#1-searchsourcesbadge-implementation)
2. [Mobile Overflow Fixes](#2-mobile-overflow-fixes)
3. [Search Toast Removal](#3-search-toast-removal)
4. [Favicon Integration](#4-favicon-integration)
5. [Dialog Viewport Cutoff Fix](#5-dialog-viewport-cutoff-fix)
6. [User Profile Context in System Prompt](#6-user-profile-context-in-system-prompt)
7. [Stop Phase Change Spam During Reasoning](#7-stop-phase-change-spam-during-reasoning)
8. [Chat Input Bottom Position on Desktop](#8-chat-input-bottom-position-on-desktop)

---

## 1. SearchSourcesBadge Implementation

**Commits**:
- `faa6223` - Make favicons visible in SearchResultsCard and remove last search toast
- `9ad324d` - Add domain favicons to SearchResultsCard header
- `a83a5cf` - Add favicon next to each individual search result title
- `ab3d951` - Ensure favicons always display in SearchResultsCard header

**Problem**: No visual indicator when AI uses web search, search results hard to distinguish, unclear which sources were used.

**Solution**: Created SearchSourcesBadge component that displays as a compact badge in chat messages and expands to show detailed search results.

### Files Created

#### `components/search-sources-badge.tsx`

**Purpose**: Compact badge showing search source count with click-to-expand functionality

**Key Features**:
- Shows source count (e.g., "5 sources")
- Displays up to 3 domain favicon previews
- Click to expand SearchResultsCard
- Mobile-optimized padding (`p-2 sm:p-3`)
- Cyan accent colors matching app theme

**Implementation**:
```tsx
'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchResultsCard } from './search-results-card'

interface SearchResult {
  title: string
  url: string
  content: string
}

interface SearchSourcesBadgeProps {
  results: SearchResult[]
  className?: string
}

export function SearchSourcesBadge({ results, className }: SearchSourcesBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!results || results.length === 0) return null

  // Extract unique domains for favicon preview
  const uniqueDomains = Array.from(
    new Set(
      results.map(r => {
        try {
          return new URL(r.url).hostname.replace('www.', '')
        } catch {
          return null
        }
      }).filter(Boolean)
    )
  ).slice(0, 3)

  return (
    <div className={cn("inline-block w-full max-w-full", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs",
          "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30",
          "text-cyan-700 dark:text-cyan-300 transition-colors",
          "active:scale-95",
          "max-w-full overflow-hidden"
        )}
      >
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium whitespace-nowrap">{results.length} sources</span>
        {uniqueDomains.length > 0 && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {uniqueDomains.map((domain, idx) => (
              <img
                key={idx}
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                alt=""
                className="w-3.5 h-3.5 rounded-sm"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 w-full max-w-full overflow-hidden">
          <SearchResultsCard results={results} />
        </div>
      )}
    </div>
  )
}
```

### Files Modified

#### `components/search-results-card.tsx`

**Changes**:
1. **Added individual favicons** - Each result now shows favicon next to title
2. **Improved text colors** - Changed to semantic colors for better contrast
3. **Reduced spacing** - Tighter layout for mobile
4. **Mobile padding** - Reduced from `p-3` to `p-2 sm:p-2.5`

**Before**:
```tsx
<a href={result.url} className="...">
  <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
    {result.title}
  </span>
</a>
<p className="text-xs text-cyan-600/60 dark:text-cyan-400/60 mb-1">
  {new URL(result.url).hostname}
</p>
```

**After**:
```tsx
{/* Result Title with Favicon */}
<a
  href={result.url}
  target="_blank"
  rel="noopener noreferrer"
  className="group flex items-start gap-1.5 mb-0.5"
>
  {/* Favicon */}
  <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5 overflow-hidden bg-white dark:bg-zinc-800 border border-cyan-500/10 flex items-center justify-center">
    <img
      src={`https://www.google.com/s2/favicons?domain=${(() => {
        try {
          return new URL(result.url).hostname.replace('www.', '')
        } catch {
          return result.url
        }
      })()}&sz=16`}
      alt=""
      className="w-3.5 h-3.5"
      loading="lazy"
      onError={(e) => {
        const target = e.target as HTMLImageElement
        target.style.display = 'none'
      }}
    />
  </div>
  <span className="text-sm font-medium text-foreground group-hover:underline line-clamp-2 flex-1">
    {result.title}
  </span>
  <ExternalLink className="w-3 h-3 text-cyan-500/50 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
</a>
<p className="text-xs text-muted-foreground mb-0.5">
  {new URL(result.url).hostname}
</p>
```

**Key changes**:
- Favicon extracted inline with proper error handling
- Uses semantic colors: `text-foreground`, `text-muted-foreground`
- Reduced spacing: `mb-1` → `mb-0.5`
- Added external link icon on hover
- `flex-shrink-0` prevents favicon from being hidden

### Integration

#### Usage in chat messages:

```tsx
// In chat-messages.tsx or similar
{message.searchResults && (
  <SearchSourcesBadge
    results={message.searchResults}
    className="mt-2"
  />
)}
```

---

## 2. Mobile Overflow Fixes

**Problem**: All bubble components (search results, streaming history, follow-ups, stats) were overflowing ~5% on the right side on mobile.

**Root Cause**: Components using `p-3` padding on mobile with no overflow constraints.

**Solution**: Reduced mobile padding and added overflow constraints.

### Files Changed

#### `components/search-results-card.tsx`
```tsx
// Header padding
className="p-2 sm:p-2.5 border-b border-border/20"  // Was: p-2.5 sm:p-3
```

#### `components/search-sources-badge.tsx`
```tsx
className="px-2 sm:px-3 py-1.5"  // Responsive padding
```

#### `components/message-status.tsx`
```tsx
// Line item
className="w-full flex items-center gap-2 px-2 sm:px-3 py-2"

// Expanded content
<div className="border-t border-border/30 px-2 sm:px-3 py-2 space-y-1.5 overflow-hidden">
```

#### `components/follow-up-suggestions.tsx`
```tsx
className={cn(
  "rounded-xl p-2 sm:p-3 border border-transparent",
  "w-full max-w-full overflow-hidden"
)}
```

#### `components/message-stats.tsx`
```tsx
<div className="mt-3 p-2 sm:p-3 rounded-lg border bg-muted/30 w-full max-w-full overflow-hidden">
```

### Pattern

**Consistent mobile-first approach**:
```tsx
// Mobile: p-2 (8px)
// Desktop: p-3 (12px)
className="p-2 sm:p-3"

// Always add overflow constraints
className="w-full max-w-full overflow-hidden"
```

---

## 3. Search Toast Removal

**Problem**: Multiple redundant search toast notifications appearing alongside SearchSourcesBadge.

**Solution**: Removed all 5 search-related toast notifications across 2 files.

### Files Changed

#### `components/simple-chat-input.tsx`

**Removed 4 toasts**:

**Line 590** - Manual search start toast:
```tsx
// REMOVED
toast({
  title: "Searching the web...",
  description: "Finding relevant information",
})
```

**Line 726** - Manual search complete toast:
```tsx
// REMOVED
toast({
  title: "Search complete",
  description: `Found ${searchResults.results?.length || 0} results`,
})
```

**Line 870** - AI search start toast:
```tsx
// REMOVED
toast({
  title: "AI is searching the web...",
  description: "The AI decided this query needs current information",
})
```

**Line 877** - AI search complete toast:
```tsx
// REMOVED
toast({
  title: "Search complete",
  description: `AI found ${searchResults.results?.length || 0} sources`,
})
```

#### `components/chat-input.tsx`

**Line 568** - Provider-specific search toast:
```tsx
// REMOVED
toast({
  title: `Searching with ${searchProvider}...`,
  description: "Finding relevant sources",
})
```

### Replacement

All search feedback now provided by SearchSourcesBadge:
- Badge appears in message when search used
- Shows source count
- Click to expand for details
- No disruptive toast notifications

---

## 4. Favicon Integration

**Technology**: Google's favicon service API

**Implementation pattern**:

```tsx
// Inline domain extraction with error handling
const faviconUrl = `https://www.google.com/s2/favicons?domain=${(() => {
  try {
    return new URL(result.url).hostname.replace('www.', '')
  } catch {
    return result.url
  }
})()}&sz=16`

// With fallback
<img
  src={faviconUrl}
  alt=""
  className="w-3.5 h-3.5"
  loading="lazy"
  onError={(e) => {
    const target = e.target as HTMLImageElement
    target.style.display = 'none'
  }}
/>
```

**Key features**:
- Extracts domain from URL at render time
- Handles malformed URLs gracefully
- Uses 16x16 favicon size
- Falls back silently on error (hides image)
- Lazy loading for performance

**Where used**:
- SearchSourcesBadge (up to 3 previews)
- SearchResultsCard (next to each individual result)

---

## 5. Dialog Viewport Cutoff Fix

**Commits**:
- `1a9bd3a` - Initial fix for add model dialog
- `3dd01f4` - Complete fix for all dialogs
- `e03d6cb` - Documentation

**Problem**: Dialogs were being cut off at top/bottom when content exceeded viewport height.

**Solution**: Added viewport-safe height caps to dialogs.

### Files Changed

#### `components/ui/dialog.tsx` (Line 63)

```tsx
// BEFORE:
className={cn(
  'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-xl duration-200 sm:max-w-lg',
  className,
)}

// AFTER:
className={cn(
  'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border p-6 shadow-xl duration-200 sm:max-w-lg',
  className,
)}
```

**Key changes**:
- Added `max-h-[calc(100vh-2rem)]`
- Added `overflow-auto`
- Changed translate utilities to Tailwind standard

#### `components/ui/alert-dialog.tsx` (Line 57)

```tsx
// BEFORE:
className={cn(
  'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
  className,
)}

// AFTER:
className={cn(
  'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
  className,
)}
```

#### `components/model-management.tsx` (Line 256)

```tsx
<DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] !overflow-hidden flex flex-col bg-background">
```

**Important**: For dialogs with custom flex layouts, use `!overflow-hidden` to override base `overflow-auto`.

### Quick Reference

**Base Dialog Class**:
```
fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border p-6 shadow-xl
```

**Base AlertDialog Class**:
```
fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border p-6 shadow-lg
```

---

## 6. User Profile Context in System Prompt

**Commit**: `5372d9f`

**Problem**: User profile information (name, age, occupation, interests, etc.) was saved but never passed to AI models.

**Solution**: Inject profile context into system prompt before sending to model.

### Files Changed

#### `components/chat-input.tsx` (Lines 29 & 481-487)

**Add import at top**:
```tsx
import { userProfileService } from "@/lib/user-profile"
```

**Add before message construction** (around line 481, after systemPrompt is built):
```tsx
// Add user profile context if available
const userProfile = userProfileService.getProfile()
const profileContext = userProfileService.getProfileContext(userProfile)
if (profileContext) {
  systemPrompt = `${systemPrompt}${profileContext}`
  console.log("[v0] User profile context added to system prompt")
}
```

### Context

Place this code **after** all other system prompt modifications (persona context, memory, etc.) but **before** constructing the messages array.

The `userProfileService.getProfileContext()` method generates a formatted string like:
```
\n\nUser Profile Information:
- Name: John
- Age: 30
- Occupation: Software Engineer
...
```

### Dependencies

Requires `lib/user-profile.ts` with:
- `getProfile()` - Retrieves user profile from storage
- `getProfileContext(profile)` - Formats profile into prompt-friendly string

---

## 7. Stop Phase Change Spam During Reasoning

**Commit**: `e784dd6`

**Problem**: When reasoning was active, phase "thinking" was sent with EVERY token, causing 1000+ console logs and unnecessary updates.

**Example spam**:
```
[v0] 📍 Phase change: thinking
[Advanced Chat] 📊 Streaming details: { phase: "thinking", reasoningContent: "H" }
[Advanced Chat] 📊 Streaming details: { phase: "thinking", reasoningContent: "mm" }
[Advanced Chat] 📊 Streaming details: { phase: "thinking", reasoningContent: "," }
... (repeated 1000+ times)
```

**Solution**: Send phase "thinking" ONCE when reasoning starts, then send only reasoning content chunks.

### Files Changed

#### `app/api/chat/route.ts` (Lines 423 & 513-539)

**Add state tracking variable** (around line 423):
```tsx
let hasStartedReasoning = false // Track if we've sent the initial reasoning phase
```

**Replace reasoning content handling** (around line 513):
```tsx
const reasoningContent = delta?.reasoning_content || delta?.reasoning || delta?.thinking
if (reasoningContent && !hasToolCalls) {
  // Only send phase change ONCE when reasoning starts (not for every token!)
  if (!hasStartedReasoning) {
    hasStartedReasoning = true
    await writer.write(
      encoder.encode(
        `data: ${JSON.stringify({
          choices: [{
            delta: {
              phase: "thinking"
            }
          }]
        })}\n\n`
      )
    )
  }

  // Send reasoning content WITHOUT phase spam
  await writer.write(
    encoder.encode(
      `data: ${JSON.stringify({
        choices: [{
          delta: {
            reasoning_content: reasoningContent
          }
        }]
      })}\n\n`
    )
  )
  continue
}
```

**Key changes**:
- Added `hasStartedReasoning` flag
- Send `{ phase: "thinking" }` ONCE when flag is false
- Set flag to true after first send
- Send subsequent chunks WITHOUT phase field

#### `lib/openrouter.ts` (Lines 462-471)

**Remove phase from streaming details**:
```tsx
if (reasoningContent) {
  // Call legacy onReasoning callback (accumulates on client)
  if (onReasoning) {
    onReasoning(reasoningContent)
  }

  // Send reasoning via enhanced streaming details WITHOUT redundant phase
  // (phase change is already sent separately once)
  if (onStreamingDetails) {
    onStreamingDetails({
      // REMOVED: phase: "thinking",  ← DELETE THIS LINE
      reasoningContent: reasoningContent,
      action: "Extended reasoning in progress..."
    })
  }
}
```

**Before**:
```tsx
onStreamingDetails({
  phase: "thinking",  // ← Causing spam!
  reasoningContent: reasoningContent,
  action: "Extended reasoning in progress..."
})
```

**After**:
```tsx
onStreamingDetails({
  reasoningContent: reasoningContent,
  action: "Extended reasoning in progress..."
})
```

### Result

- Console logs reduced by 99%
- Phase changes: 1000+ → 1 per reasoning session
- Reasoning still displays correctly in UI
- Accumulation still works properly

---

## 8. Chat Input Bottom Position on Desktop

**Commit**: `ecd2190`

**Problem**: Chat input was "floating" with padding at bottom on desktop, wasting vertical space.

**Solution**: Remove bottom padding on desktop and ensure input sits directly at bottom.

### Files Changed

#### `app/page.tsx` (Lines 178 & 220)

**Main container** (Line 178):
```tsx
// BEFORE:
<div className="relative z-10 flex h-[100dvh] overflow-hidden px-0 md:px-0 pb-[44px] md:pb-6 gap-0">

// AFTER:
<div className="relative z-10 flex h-[100dvh] overflow-hidden px-0 md:px-0 pb-[44px] md:pb-0 gap-0">
```

**Chat input container** (Line 220):
```tsx
// BEFORE:
<div className="flex-shrink-0 pb-4 md:pb-0">

// AFTER:
<div className="flex-shrink-0 pb-4 md:pb-0 md:mt-0">
```

### Changes Summary

1. **Line 178**: `md:pb-6` → `md:pb-0` (remove desktop padding)
2. **Line 220**: Added `md:mt-0` (ensure no top margin on desktop)

**Mobile unchanged**: Maintains `pb-[44px]` for bottom navigation spacing

### Benefits

- More vertical space for chat messages on desktop
- Chat input directly at bottom (not floating)
- Better use of screen real estate in advanced mode
- Mobile layout remains intact

---

## Testing Checklist

### Dialog Fixes
- [ ] Add model dialog opens without cutoff
- [ ] Delete all chats confirmation visible
- [ ] Dialogs scroll when content too tall
- [ ] Dialogs centered on all screen sizes
- [ ] Mobile dialogs work correctly

### User Profile
- [ ] Profile info saved in settings
- [ ] AI uses profile name in responses
- [ ] Profile context appears in system prompt
- [ ] Works with all persona types

### Reasoning Spam Fix
- [ ] Enable reasoning toggle
- [ ] Ask complex question requiring reasoning
- [ ] Console shows only ONE "phase: thinking" log
- [ ] Reasoning content accumulates in UI
- [ ] Amber reasoning card displays properly

### Chat Input Position
- [ ] Desktop: Input at bottom (no gap)
- [ ] Desktop: More space for messages
- [ ] Mobile: Bottom nav still works
- [ ] Mobile: Input has proper spacing

---

## File Locations Summary

```
components/
├── ui/
│   ├── dialog.tsx                    # Base Dialog component
│   └── alert-dialog.tsx              # Base AlertDialog component
├── chat-input.tsx                    # User profile context injection
└── model-management.tsx              # Custom dialog with flex layout

app/
├── page.tsx                          # Chat input positioning
└── api/
    └── chat/
        └── route.ts                  # Reasoning phase spam fix

lib/
├── openrouter.ts                     # Streaming details (remove phase)
└── user-profile.ts                   # Profile service (dependency)
```

---

## Quick Implementation Guide

### For New Projects

1. **Start with base components** (`dialog.tsx`, `alert-dialog.tsx`)
   - Add `max-h-[calc(100vh-2rem)]` and `overflow-auto` to content
   - Use Tailwind translate utilities

2. **Add user profile context** (if applicable)
   - Import `userProfileService` in chat input
   - Call `getProfileContext()` and append to system prompt

3. **Fix reasoning spam** (if using reasoning/thinking features)
   - Add `hasStartedReasoning` flag in API route
   - Send phase ONCE, then only content chunks
   - Remove phase from client streaming details

4. **Adjust chat layout** (optional)
   - Remove desktop bottom padding: `md:pb-6` → `md:pb-0`
   - Add `md:mt-0` to input container

---

## Dependencies & Assumptions

### Required Services

- `userProfileService` - Must have `getProfile()` and `getProfileContext()` methods
- `memoryService` - For persona memory (existing)
- OpenRouter or compatible API - For streaming responses

### UI Framework

- **Radix UI**: For Dialog and AlertDialog primitives
- **Tailwind CSS**: For utility classes
- **Next.js**: API routes for streaming

### Browser Support

- Modern browsers supporting `calc()` in Tailwind
- CSS Grid and Flexbox
- `dvh` viewport units for mobile

---

## Related Documentation

- `DIALOG_VIEWPORT_FIX.md` - Detailed dialog fix guide with examples
- `lib/user-profile.ts` - User profile service implementation
- `lib/openrouter.ts` - Streaming implementation details

---

*Last updated: 2025-12-01*
*Commits: ecd2190, e784dd6, 5372d9f, 1a9bd3a, 3dd01f4, e03d6cb*
