# Dialog sizing and viewport safety guide

## What we changed

Desktop dialogs in advanced mode were getting clipped (especially the **Add Model** and **Delete all chats** confirmations). We tightened up the shared dialog primitives so they always respect the viewport and added hard caps to the custom modals that had been overflowing.

## Checklist for future dialogs

- **Portal to `document.body`** – keeps the layer outside any parent that uses `overflow: hidden` or transforms.
- **High z-index** – overlays use `z-[9998]` for the scrim and `z-[9999]` for the content so they sit above the advanced shell.
- **Viewport-based height caps** – dialogs now clamp to `max-h-[min(90vh,calc(100dvh-2rem))]` (alerts reuse the same pattern) with an extra `md:max-h-[calc(100vh-3rem)]` guard for desktop chrome.
- **Scrollable internals** – keep `overflow-hidden` on the dialog shell when you manage scrolling inside (as in the Add Model dialog), or rely on the default `overflow-y-auto` when the whole dialog should scroll.
- **Width guards** – give custom dialogs an explicit `max-w` (e.g., `lg:max-w-4xl` for the Add Model form or `sm:max-w-md` for alerts) plus a `max-w-[calc(100vw-2rem)]` fallback so they never exceed the viewport.

## Applying the pattern

1. Use the shared primitives from `components/ui/dialog.tsx` or `components/ui/alert-dialog.tsx`; they already include the portal + z-index + height clamp defaults.
2. For tall, sectioned layouts (e.g., model management), add `!overflow-hidden flex flex-col` on the dialog and give the body area `flex-1 min-h-0 overflow-y-auto` so the list scrolls without pushing the footer off-screen.
3. For simple confirms (e.g., delete all chats), just pass a sensible `max-w` — the base alert dialog handles the rest.

## Quick reference classes

- Dialog content: `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[calc(100%-2rem)] max-h-[min(90vh,calc(100dvh-2rem))] md:max-h-[calc(100vh-3rem)] overflow-y-auto rounded-lg`
- Alert content: same as above with `shadow-lg` instead of `shadow-xl`
- Add Model dialog shell: `w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[min(85vh,calc(100dvh-3rem))] md:max-h-[calc(100vh-3rem)] !overflow-hidden flex flex-col`
