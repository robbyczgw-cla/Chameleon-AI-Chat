# PWA Modernization Plan

Making Chameleon AI feel more native on mobile devices.

## Current Status ✅

Already implemented:
- Basic PWA manifest with icons and shortcuts
- Haptic feedback service (`lib/haptics.ts`)
- Service worker for caching
- Safe area handling for notched phones
- Touch-optimized button sizes (44px minimum)
- AI-driven web search via tool calling (v0.8.0)
- Blocks-style chat input UI
- Mobile header overflow fix
- Toggle switch animations

---

## Research Findings (2025-11-30)

### PWA Best Practices 2025

Based on research from [Netguru](https://www.netguru.com/blog/pwa-ux-techniques), [Equus Branding](https://equusbranding.com/progressive-web-app-pwa-2025/):

1. **Gestures**: 75% of users report haptic feedback enhances satisfaction
2. **Familiar Patterns**: Nielsen Norman Group found 50% accuracy with unfamiliar gestures
3. **Native Feel**: Use `display: standalone`, smooth transitions, avoid browser elements
4. **Performance**: Core Web Vitals (LCP, FID, CLS) are critical

### Competitive Analysis

From [Zapier](https://zapier.com/blog/claude-vs-chatgpt/), [Creator Economy](https://creatoreconomy.so/p/chatgpt-vs-claude-vs-gemini-the-best-ai-model-for-each-use-case-2025):

| Feature | ChatGPT | Claude | Chameleon |
|---------|---------|--------|-----------|
| Memory | ✅ Advanced | ❌ None | ✅ Basic |
| Image Gen | ✅ DALL-E | ❌ | ❌ |
| Voice Chat | ✅ Real-time | ❌ | ⚠️ TTS only |
| Tool Calling | ✅ | ✅ | ✅ v0.8.0 |
| Offline | ❌ | ❌ | ❌ |
| PWA | ❌ | ❌ | ✅ |

**Our Advantages**: PWA, multiple models, cost tracking, personas, open source

---

## Priority 1: Quick Wins 🚀

### 1. Pull-to-Refresh
Native-like pull down to refresh chat list.

```tsx
// Use overscroll behavior + custom animation
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
```

### 2. Swipe Gestures
- Swipe left on chat to delete
- Swipe right to archive
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

---

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

---

## Priority 3: Advanced Features ⚡

### 9. Offline Support
- Cache recent chats in IndexedDB
- Queue messages when offline
- Sync when back online
- Show offline indicator

### 10. Background Sync
```js
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

---

## Implementation Roadmap

| Phase | Features | Effort |
|-------|----------|--------|
| 1 | Swipe gestures, pull-to-refresh | 2-3 days |
| 2 | Bottom sheets, skeletons | 2-3 days |
| 3 | View transitions, active states | 1-2 days |
| 4 | Offline mode, background sync | 1 week |
| 5 | Push notifications | 3-4 days |

---

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

---

## Weaknesses to Address

### High Priority
1. **No offline mode** - Users expect PWAs to work offline
2. **No real-time voice** - ChatGPT has conversational voice
3. **Basic memory UI** - Need to show what AI remembers

### Medium Priority
4. **No image generation** - Consider integrating DALL-E/Stable Diffusion
5. **Limited file handling** - Better document preview/generation

### Low Priority
6. **No plugins/extensions** - Consider MCP as plugin system
7. **No collaborative features** - Share chats, team workspaces

---

## Testing Checklist

- [ ] iOS Safari (iPhone 12+)
- [ ] Android Chrome (Pixel, Samsung)
- [ ] PWA installed mode
- [ ] Standalone mode
- [ ] With keyboard open
- [ ] Landscape orientation
- [ ] Different screen sizes
- [ ] Offline behavior
- [ ] Background/foreground transitions

---

## Resources

- [PWA UX Techniques](https://www.netguru.com/blog/pwa-ux-techniques)
- [PWA Best Practices 2025](https://equusbranding.com/progressive-web-app-pwa-2025/)
- [Web.dev PWA Capabilities](https://web.dev/learn/pwa/capabilities)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://m3.material.io/)
