# 📱 Chameleon AI Chat - Mobile App

React Native mobile application for Chameleon AI Chat (Android first, iOS coming soon).

---

## 🏗️ Architecture

This is part of a **monorepo** structure:

```
/                     # Root (web app)
/mobile              # React Native app (this folder)
/shared              # Shared code (types, API, utils)
```

**Shared Code Benefits:**
- ✅ 70%+ code reuse between web and mobile
- ✅ Single source of truth for types, personas, API calls
- ✅ Easier to keep features in sync

---

## 🚀 Setup (Android)

### **Prerequisites:**

1. **Node.js** 18+ and **pnpm**
   ```bash
   node --version  # Should be 18+
   pnpm --version  # Should be 8+
   ```

2. **Java Development Kit (JDK) 17**
   ```bash
   java --version  # Should be 17
   ```

3. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API 34+)
   - Install Android SDK Build-Tools
   - Install Android Emulator or connect physical device

4. **Environment Variables**
   Add to `~/.bashrc` or `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

---

## 📦 Installation

From the **root directory** of the monorepo:

```bash
# Install all dependencies (root + mobile + shared)
pnpm install

# Navigate to mobile directory
cd mobile

# Install Android-specific dependencies
pnpm install
```

---

## 🏃 Running the App

### **Start Metro Bundler:**
```bash
cd mobile
pnpm start
```

### **Run on Android (in another terminal):**
```bash
cd mobile
pnpm android
```

This will:
1. Build the Android app
2. Install it on your emulator/device
3. Launch the app

---

## 📁 Project Structure

```
mobile/
├── android/              # Android native code (auto-generated)
├── src/
│   ├── screens/          # Main app screens
│   │   ├── ChatsScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── PersonasScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/       # Reusable components
│   ├── navigation/       # Navigation setup
│   │   └── MainNavigator.tsx
│   ├── hooks/           # Custom hooks
│   └── utils/           # Mobile-specific utilities
├── App.tsx              # Entry point
├── package.json
├── metro.config.js      # Metro bundler config
└── tsconfig.json        # TypeScript config
```

---

## 🔗 Using Shared Code

Import from `@chameleon/shared`:

```typescript
// Types
import { Chat, Message, Persona } from '@chameleon/shared/types'

// API
import { streamChatMessage } from '@chameleon/shared/api/openrouter'

// Personas
import { PERSONAS, getPersonaById } from '@chameleon/shared/constants/personas'

// Storage (platform-agnostic)
import { getJSON, setJSON } from '@chameleon/shared/utils/storage'
```

---

## 🛠️ Development

### **Hot Reload**
- Press `r` in Metro terminal to reload
- Shake device (or Cmd+M / Ctrl+M) → "Reload"

### **Developer Menu**
- Shake device or Cmd+D (iOS) / Cmd+M (Android)
- Enable "Fast Refresh" for automatic reloading

### **Debugging**
```bash
# Chrome DevTools
# In app: Shake → "Debug" → Opens Chrome

# React Native Debugger (better)
brew install react-native-debugger
```

---

## 🚧 Current Status

**✅ Completed:**
- Monorepo structure
- Shared code packages (types, API, constants)
- Basic navigation (bottom tabs)
- 4 main screens (Chats, Chat, Personas, Settings)
- AsyncStorage adapter for shared storage utils

**🚧 In Progress:**
- OpenRouter API integration
- Message streaming
- Local storage persistence
- Persona switching

**📋 TODO:**
- Voice input (react-native-voice)
- File uploads (react-native-document-picker)
- Push notifications
- Offline mode
- iOS support

---

## 🐛 Troubleshooting

### **Metro bundler issues:**
```bash
cd mobile
pnpm start --reset-cache
```

### **Build errors:**
```bash
cd mobile/android
./gradlew clean
cd ..
pnpm android
```

### **Package not found:**
```bash
# From root
pnpm install

# Clear Metro cache
cd mobile
pnpm start --reset-cache
```

---

## 📱 Testing on Device

### **Android:**
1. Enable Developer Options on your phone
2. Enable USB Debugging
3. Connect via USB
4. Run `pnpm android`

### **Build APK:**
```bash
cd mobile/android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## 🎯 Next Steps

1. **Complete OpenRouter integration** - Stream chat messages
2. **Add storage** - Persist chats and settings
3. **Voice features** - Input and TTS
4. **File handling** - Upload images and PDFs
5. **Polish UI** - Match web app design
6. **iOS support** - Once Android is stable

---

**Questions? Check the main README or open an issue!**
