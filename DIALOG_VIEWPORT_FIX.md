# Dialog Viewport Cutoff Fix

## Problem
Dialogs (Dialog, AlertDialog) were being cut off at the top/bottom when content exceeded viewport height, especially on desktop. The issue was caused by:
1. Parent containers with `overflow-hidden` creating stacking contexts
2. Dialogs not explicitly rendering to `document.body`
3. Z-index conflicts with other UI elements
4. Viewport height calculation issues on desktop

## Solution
Force dialogs to render in `document.body` with explicit container, higher z-index, and proper overflow handling.

---

## Changes Required

### 1. `components/ui/dialog.tsx`

**Line 24** - Update the DialogPortal to force rendering to document.body:

```tsx
// BEFORE:
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

// AFTER:
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={typeof window !== 'undefined' ? document.body : undefined} {...props} />
}
```

**Line 41** - Update the DialogOverlay z-index:

```tsx
// BEFORE:
'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40'

// AFTER:
'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[9998] bg-black/40'
```

**Line 63** - Update the DialogContent className:

```tsx
// BEFORE:
'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-xl duration-200 sm:max-w-lg'

// AFTER:
'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-[9999] grid w-full max-w-[calc(100%-2rem)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border p-6 shadow-xl duration-200 sm:max-w-lg'
```

**Key changes:**
- `left-[50%] top-[50%]` → `left-1/2 top-1/2` (use Tailwind utilities)
- `translate-x-[-50%] translate-y-[-50%]` → `-translate-x-1/2 -translate-y-1/2` (use Tailwind utilities)
- `z-50` → `z-[9999]` (much higher z-index to escape all stacking contexts)
- Added `max-h-[90vh]` (constrains height to 90% of viewport)
- `overflow-auto` → `overflow-y-auto` (only vertical scroll, prevents horizontal)

---

### 2. `components/ui/alert-dialog.tsx`

**Line 27** - Update the AlertDialogPortal to force rendering to document.body:

```tsx
// BEFORE:
function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

// AFTER:
function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" container={typeof window !== 'undefined' ? document.body : undefined} {...props} />
  )
}
```

**Line 39** - Update the AlertDialogOverlay z-index:

```tsx
// BEFORE:
'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50'

// AFTER:
'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[9998] bg-black/50'
```

**Line 57** - Update the AlertDialogContent className:

```tsx
// BEFORE:
'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg'

// AFTER:
'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-[9999] grid w-full max-w-[calc(100%-2rem)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg'
```

**Key changes:** (same as Dialog)
- `left-[50%] top-[50%]` → `left-1/2 top-1/2`
- `translate-x-[-50%] translate-y-[-50%]` → `-translate-x-1/2 -translate-y-1/2`
- `z-50` → `z-[9999]`
- Added `max-h-[90vh]`
- `overflow-auto` → `overflow-y-auto`

---

### 3. Custom Dialog Implementations (if needed)

For dialogs with custom flex layouts and internal scroll areas (like model management dialogs):

**Example from `components/model-management.tsx` line 256:**

```tsx
<DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] !overflow-hidden flex flex-col bg-background">
  <DialogHeader>
    {/* Header content */}
  </DialogHeader>

  <div className="space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden">
    {/* Scrollable content area */}
    <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-background">
      {/* List items */}
    </div>
  </div>

  <DialogFooter className="flex-shrink-0 border-t pt-4">
    {/* Footer content */}
  </DialogFooter>
</DialogContent>
```

**Key patterns:**
- Use `!overflow-hidden` on DialogContent to override base `overflow-auto`
- Use `flex flex-col` layout with `flex-1 min-h-0` on content area
- Add `overflow-y-auto` to specific scrollable sections
- Use `flex-shrink-0` on header/footer to prevent squishing

---

## Why This Works

1. **container={document.body}**: Forces portal to render directly in document.body, escaping any parent containers with overflow-hidden or stacking contexts
2. **z-[9999]**: Much higher z-index ensures dialogs appear above all other content and escape nested stacking contexts
3. **max-h-[90vh]**: Constrains height to 90% of viewport, preventing cutoff on desktop with browser chrome
4. **overflow-y-auto**: Vertical scrolling only, prevents unwanted horizontal scrollbars
5. **-translate-x-1/2 -translate-y-1/2**: Proper Tailwind centering utilities
6. **!overflow-hidden + internal scroll**: For complex layouts, override base overflow and handle internally

## Testing Checklist

- [ ] Add model dialog opens without cutoff
- [ ] Delete all chats confirmation dialog is fully visible
- [ ] Other dialogs/alerts remain functional
- [ ] Dialogs with tall content show scrollbars
- [ ] Dialogs remain centered on all screen sizes
- [ ] Mobile viewport works correctly (< 640px)

## Affected Files

1. `components/ui/dialog.tsx` - Base Dialog component
2. `components/ui/alert-dialog.tsx` - Base AlertDialog component
3. `components/model-management.tsx` - Custom flex layout example

---

## Quick Copy-Paste Fix

### Dialog Base Class:
```
fixed left-1/2 top-1/2 z-[9999] grid w-full max-w-[calc(100%-2rem)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border p-6 shadow-xl
```

### Dialog Overlay Class:
```
fixed inset-0 z-[9998] bg-black/40
```

### AlertDialog Base Class:
```
fixed left-1/2 top-1/2 z-[9999] grid w-full max-w-[calc(100%-2rem)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border p-6 shadow-lg
```

### AlertDialog Overlay Class:
```
fixed inset-0 z-[9998] bg-black/50
```

### Portal Container:
```tsx
// For both Dialog and AlertDialog
container={typeof window !== 'undefined' ? document.body : undefined}
```

---

*Last updated: 2025-12-01*
