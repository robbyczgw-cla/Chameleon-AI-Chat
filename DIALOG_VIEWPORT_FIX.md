# Dialog Viewport Cutoff Fix

## Problem
Dialogs (Dialog, AlertDialog) were being cut off at the top/bottom when content exceeded viewport height. The centering transform `translate-x-[-50%] translate-y-[-50%]` pushed content off-screen without any max-height constraints.

## Solution
Added viewport constraints and overflow handling to all dialog base components.

---

## Changes Required

### 1. `components/ui/dialog.tsx`

**Line 63** - Update the DialogContent className:

```tsx
// BEFORE:
'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-xl duration-200 sm:max-w-lg'

// AFTER:
'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border p-6 shadow-xl duration-200 sm:max-w-lg'
```

**Key changes:**
- `top-[50%] left-[50%]` → `left-[50%] top-[50%]` (reordered for consistency)
- `translate-x-[-50%] translate-y-[-50%]` → `-translate-x-1/2 -translate-y-1/2` (use Tailwind utilities)
- Added `max-h-[calc(100vh-2rem)]` (constrains height within viewport with 2rem padding)
- Added `overflow-auto` (enables scrolling when content exceeds max height)

---

### 2. `components/ui/alert-dialog.tsx`

**Line 57** - Update the AlertDialogContent className:

```tsx
// BEFORE:
'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg'

// AFTER:
'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg'
```

**Key changes:** (same as Dialog)
- `top-[50%] left-[50%]` → `left-[50%] top-[50%]`
- `translate-x-[-50%] translate-y-[-50%]` → `-translate-x-1/2 -translate-y-1/2`
- Added `max-h-[calc(100vh-2rem)]`
- Added `overflow-auto`

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

1. **max-h-[calc(100vh-2rem)]**: Ensures dialog never exceeds viewport height minus padding
2. **overflow-auto**: Automatically shows scrollbar when content is too tall
3. **-translate-x-1/2 -translate-y-1/2**: Proper Tailwind centering utilities
4. **!overflow-hidden + internal scroll**: For complex layouts, override base overflow and handle internally

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
fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border p-6 shadow-xl
```

### AlertDialog Base Class:
```
fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-lg border p-6 shadow-lg
```

---

*Last updated: 2025-12-01*
