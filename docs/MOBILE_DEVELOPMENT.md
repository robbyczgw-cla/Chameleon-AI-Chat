# 📱 Mobile Development Guide

Complete guide for developing the Chameleon AI Chat mobile app.

---

## 🏗️ Monorepo Architecture

### **Why Monorepo?**

We chose a monorepo structure to maximize code reuse between web and mobile:

```
Chameleon-AI-Chat/
├── app/              # Next.js web app
├── components/       # Web components
├── lib/             # Web utilities
├── mobile/          # ⭐ React Native app
├── shared/          # ⭐ Shared code (70%+ reused)
└── pnpm-workspace.yaml
```

**Code Reuse:**
- ✅ **Types** - Message, Chat, Persona, Settings (100%)
- ✅ **API Clients** - OpenRouter, Tavily, Serper (100%)
- ✅ **Business Logic** - Personas, models, constants (100%)
- ✅ **Utilities** - Storage abstraction, formatting (80%)
- ❌ **UI Components** - Different (React vs React Native)

---

## 📦 Shared Package (`@chameleon/shared`)

### **Structure:**

```
shared/
├── types/           # TypeScript interfaces
│   └── index.ts
├── api/            # API clients
│   └── openrouter.ts
├── constants/      # Personas, models, etc.
│   └── personas.ts
├── utils/          # Utilities
│   └── storage.ts
└── services/       # Business logic
```

### **Usage in Mobile:**

```typescript
// Import types
import { Chat, Message } from '@chameleon/shared/types'

// Use API
import { streamChatMessage } from '@chameleon/shared/api/openrouter'

await streamChatMessage({
  apiKey: 'sk-or-...',
  model: 'x-ai/grok-4.1-fast',
  messages: [...],
  onChunk: (chunk) => console.log(chunk),
})

// Get personas
import { PERSONAS } from '@chameleon/shared/constants/personas'
```

---

## 🔄 Storage Abstraction

The shared package uses a **platform-agnostic storage interface**:

**Web Implementation:**
```typescript
// Uses localStorage
const adapter = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
}
```

**Mobile Implementation:**
```typescript
// Uses AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage'

const adapter = {
  getItem: async (key) => await AsyncStorage.getItem(key),
  setItem: async (key, value) => await AsyncStorage.setItem(key, value),
}
```

Both implement the same `StorageAdapter` interface!

---

## 🎨 UI Differences: Web vs Mobile

### **Web (shadcn/ui + Radix):**
```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

<Button variant="outline">Click me</Button>
```

### **Mobile (React Native Paper):**
```tsx
import { Button, Card } from 'react-native-paper'

<Button mode="outlined">Click me</Button>
```

**Strategy:** Keep business logic in shared package, implement UI separately.

---

## 🧭 Navigation

### **Web:**
- Next.js App Router
- Server components
- File-based routing

### **Mobile:**
- React Navigation
- Bottom tabs (like web's mobile-bottom-nav)
- Stack navigation for screens

**Screens Mapping:**
| Web Route | Mobile Screen |
|-----------|---------------|
| `/` | ChatsScreen |
| `/chat/[id]` | ChatScreen |
| `/personas` | PersonasScreen |
| `/settings` | SettingsScreen |

---

## 🔧 Development Workflow

### **1. Add Feature to Shared Package**

Example: Add cost calculation utility

```typescript
// shared/utils/cost.ts
export function calculateCost(tokens: number, model: string): number {
  const pricing = {
    'x-ai/grok-4.1-fast': 0.0001, // per 1K tokens
    // ...
  }
  return (tokens / 1000) * (pricing[model] || 0.0001)
}
```

### **2. Use in Web**

```typescript
// app/page.tsx
import { calculateCost } from '@chameleon/shared/utils/cost'

const cost = calculateCost(1500, 'x-ai/grok-4.1-fast')
```

### **3. Use in Mobile**

```typescript
// mobile/src/screens/ChatScreen.tsx
import { calculateCost } from '@chameleon/shared/utils/cost'

const cost = calculateCost(1500, 'x-ai/grok-4.1-fast')
```

**Same code, both platforms! 🎉**

---

## 🚀 Building & Testing

### **Development:**
```bash
# Terminal 1: Metro bundler
cd mobile
pnpm start

# Terminal 2: Run on Android
cd mobile
pnpm android
```

### **Testing on Physical Device:**
```bash
# List devices
adb devices

# Run on specific device
pnpm android --deviceId=<device-id>
```

### **Release Build:**
```bash
cd mobile/android
./gradlew assembleRelease

# APK location:
# mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎯 Implementation Roadmap

### **Phase 1: Foundation (Week 1-2) ✅**
- [x] Monorepo structure
- [x] Shared package
- [x] Basic navigation
- [x] Screen scaffolding

### **Phase 2: Core Features (Week 3-4)**
- [ ] OpenRouter API integration
- [ ] Message streaming UI
- [ ] Chat persistence (AsyncStorage)
- [ ] Settings management
- [ ] Persona switching

### **Phase 3: Advanced Features (Week 5-6)**
- [ ] Voice input (react-native-voice)
- [ ] File uploads (images, PDFs)
- [ ] Copy/paste functionality
- [ ] Search chats
- [ ] Export conversations

### **Phase 4: Polish (Week 7-8)**
- [ ] Animations
- [ ] Haptic feedback
- [ ] Dark mode
- [ ] Font choices (matching web)
- [ ] Performance optimization

### **Phase 5: iOS (Week 9-10)**
- [ ] iOS-specific setup
- [ ] Test on iOS devices
- [ ] App Store preparation

---

## 📚 Key Dependencies

### **Mobile-Specific:**
- `react-native` - Core framework
- `@react-navigation/native` - Navigation
- `react-native-paper` - UI components
- `@react-native-async-storage/async-storage` - Storage
- `react-native-vector-icons` - Icons

### **Shared:**
- `zod` - Runtime validation
- All business logic from `@chameleon/shared`

---

## 🐛 Common Issues

### **"Unable to resolve module"**
```bash
# Clear Metro cache
cd mobile
pnpm start --reset-cache
```

### **Android build fails**
```bash
cd mobile/android
./gradlew clean
cd ..
pnpm android
```

### **TypeScript can't find @chameleon/shared**
Check `mobile/tsconfig.json` has correct paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@chameleon/shared": ["../shared"],
      "@chameleon/shared/*": ["../shared/*"]
    }
  }
}
```

---

## 🎨 Design Guidelines

**Match Web App:**
- Use same color scheme (#6366f1 primary)
- Same font families (Roboto, Inter, etc.)
- Same persona colors and emojis
- Consistent spacing (8px grid)

**Mobile-Specific:**
- Larger touch targets (44x44px minimum)
- Bottom navigation (thumb-friendly)
- Swipe gestures where appropriate
- Pull-to-refresh on lists

---

## 📖 Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Metro Bundler](https://metrobundler.dev/)

---

**Happy coding! 🚀**
