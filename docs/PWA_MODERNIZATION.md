# PWA Modernization Plan

Making Chameleon AI feel more native on mobile devices.

## Current Status ✅

Already implemented:
- Basic PWA manifest with icons and shortcuts
- Haptic feedback service (`lib/haptics.ts`)
- Service worker for caching
- Safe area handling for notched phones
- Touch-optimized button sizes (44px minimum)

## Priority 1: Quick Wins 🚀

### 1. Pull-to-Refresh
Native-like pull down to refresh chat list.

```tsx
// Use overscroll behavior + custom animation
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
```

### 2. Swipe Gestures
- Swipe left on chat to delete
- Swipe right to archive (future)
- Swipe between screens (mobile nav)

### 3. Bottom Sheet Dialogs
Replace modal dialogs with bottom sheets on mobile for:
- Settings (slide up from bottom)
- Persona picker
- Model selector

### 4. Loading Skeletons
Show skeleton loaders instead of spinners:
- Chat message skeletons
- Chat list item skeletons
- Profile loading skeleton

## Priority 2: Native Feel 📱

### 5. Smooth Page Transitions
```css
/* View transitions API */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.25s;
}
```

### 6. iOS Rubber-Band Effect
```css
/* Already using overscroll-behavior */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

### 7. Platform-Specific Styles
- iOS: San Francisco font, rounded corners
- Android: Material You colors, Roboto font

### 8. Active States
```css
button:active {
  transform: scale(0.97);
  transition: transform 50ms;
}
```

## Priority 3: Advanced Features ⚡

### 9. Offline Support
- Cache recent chats
- Queue messages when offline
- Sync when back online

### 10. Background Sync
```js
// Register sync event
navigator.serviceWorker.ready.then(sw => {
  sw.sync.register('sync-chats');
});
```

### 11. Push Notifications
- Notify when AI response ready (background)
- Daily tips/reminders (optional)

### 12. Share Target Improvements
- Better share intent handling
- Quick actions from share

## Implementation Priority

1. **This PR**: Swipe gestures for chat deletion
2. **Next**: Bottom sheet dialogs
3. **Future**: Pull-to-refresh, skeleton loaders
4. **Later**: Offline mode, push notifications

## CSS Variables for Native Feel

```css
:root {
  /* iOS-like timing */
  --animation-fast: 100ms;
  --animation-normal: 200ms;
  --animation-slow: 300ms;

  /* Touch feedback */
  --touch-scale: 0.97;
  --touch-opacity: 0.7;

  /* Safe areas */
  --safe-top: env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom);
  --safe-left: env(safe-area-inset-left);
  --safe-right: env(safe-area-inset-right);
}
```

## Testing Checklist

- [ ] iOS Safari (iPhone 12+)
- [ ] Android Chrome (Pixel, Samsung)
- [ ] PWA installed mode
- [ ] Standalone mode
- [ ] With keyboard open
- [ ] Landscape orientation
- [ ] Different screen sizes
