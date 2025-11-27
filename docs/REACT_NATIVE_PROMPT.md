# 📱 React Native Android App - Entwicklungsplan

## 🎯 Projekt-Kontext

**Chameleon AI Chat** ist eine Next.js Web-App mit 18+ AI Personas, 100+ Modellen über OpenRouter, und umfangreichen Features. Wir entwickeln jetzt eine **React Native Mobile App** (Android first, iOS später).

## 🏗️ Was bereits erstellt wurde

### Monorepo-Struktur (im gleichen Git-Repo wie Web-App)

```
Chameleon-AI-Chat/
├── app/              # Next.js Web-App (existiert bereits, 100% intakt)
├── components/       # Web-Komponenten
├── lib/             # Web-Utilities
├── mobile/          # ✅ NEU: React Native App
│   ├── src/
│   │   ├── screens/         # 4 Haupt-Screens (Chats, Chat, Personas, Settings)
│   │   ├── navigation/      # Bottom-Tab Navigation
│   │   └── utils/          # Storage-Adapter für AsyncStorage
│   ├── App.tsx              # Entry Point
│   ├── package.json         # Dependencies
│   ├── metro.config.js      # Metro Bundler Config für Monorepo
│   └── tsconfig.json        # TypeScript Config mit Paths zu shared/
├── shared/          # ✅ NEU: Gemeinsamer Code (70%+ Wiederverwendung)
│   ├── types/              # Message, Chat, Persona, AppSettings
│   ├── api/                # OpenRouter API Client mit Streaming
│   ├── constants/          # Personas (Cami, Professor Stein, Luna, Dev, Flash)
│   └── utils/              # Platform-agnostic Storage Abstraction
└── pnpm-workspace.yaml     # ✅ NEU: Monorepo Config
```

### Features bereits implementiert

**Screens:**
- ✅ ChatsScreen - Liste aller Konversationen (wie chat-sidebar auf Web)
- ✅ ChatScreen - Haupt-Chat-Interface mit Message-Bubbles und Input
- ✅ PersonasScreen - Grid-View aller Personas zum Auswählen
- ✅ SettingsScreen - API Keys, Modell-Einstellungen, About

**Navigation:**
- ✅ Bottom-Tab Navigation (ähnlich wie web's mobile-bottom-nav)
- ✅ React Navigation eingerichtet

**Shared Code Package (`@chameleon/shared`):**
- ✅ Types: Alle Core-Interfaces (Message, Chat, Persona, AppSettings)
- ✅ API: OpenRouter Client mit Streaming-Support
- ✅ Constants: 5 Personas (Cami, Professor Stein, Luna, Dev, Flash)
- ✅ Utils: Storage Abstraction (funktioniert auf Web + Mobile)

**Storage:**
- ✅ AsyncStorage Adapter implementiert
- ✅ Storage-Interface aus shared package

**UI Library:**
- ✅ React Native Paper (Material Design Components)
- ✅ React Native Vector Icons

## 🚧 Was noch zu tun ist

### Phase 1: Core Features (Priorität)

1. **OpenRouter API Integration vollständig**
   - [ ] Streaming-Messages in ChatScreen implementieren
   - [ ] Loading-States während API-Calls
   - [ ] Error-Handling
   - [ ] Token-Counting und Cost-Tracking

2. **Storage & Persistence**
   - [ ] Chats in AsyncStorage speichern/laden
   - [ ] Settings in AsyncStorage speichern/laden
   - [ ] Ausgewählte Persona speichern
   - [ ] Chat-History beim App-Start laden

3. **Persona System**
   - [ ] Persona-Auswahl in Settings speichern
   - [ ] Persona-spezifische System-Prompts anwenden
   - [ ] Persona-Farben im UI verwenden

4. **Message Features**
   - [ ] Markdown-Rendering in Messages
   - [ ] Code-Highlighting (react-native-syntax-highlighter)
   - [ ] Copy-to-Clipboard für Messages
   - [ ] Message-Timestamps

### Phase 2: Advanced Features

5. **Voice Features**
   - [ ] Voice Input (react-native-voice)
   - [ ] TTS (Text-to-Speech)

6. **File Handling**
   - [ ] Image Upload (react-native-image-picker)
   - [ ] PDF Upload (react-native-document-picker)
   - [ ] Image Preview

7. **UI Polish**
   - [ ] Pull-to-Refresh auf ChatsScreen
   - [ ] Swipe-Gesten (Delete, Pin)
   - [ ] Haptic Feedback
   - [ ] Animationen
   - [ ] Dark Mode

8. **Follow-Up Suggestions**
   - [ ] Kategorisierte Follow-Ups (⚡ Quick / 🧠 Deep / 🔗 Related) vom Web übernehmen
   - [ ] Clickable Chips unterhalb von AI-Messages

### Phase 3: Finish & Polish

9. **Search & Filter**
   - [ ] Chat-Suche
   - [ ] Filter nach Persona/Model

10. **Export**
    - [ ] Chat-Export (JSONL, Markdown)
    - [ ] Share-Funktion

## 🛠️ Technischer Stack

**Mobile:**
- React Native 0.76.5
- React 19.2.0
- TypeScript 5
- React Navigation (Bottom Tabs + Stack)
- React Native Paper (UI Components)
- AsyncStorage (Persistence)
- React Native Vector Icons

**Shared:**
- TypeScript
- Zod (Runtime Validation)

**APIs:**
- OpenRouter (100+ AI Models)
- Tavily/Serper (Web Search - später)

## 📋 Entwicklungs-Setup Anleitung

### Voraussetzungen

1. **Node.js 18+** und **pnpm**
2. **Java Development Kit (JDK) 17**
3. **Android Studio** mit:
   - Android SDK (API 34+)
   - Android SDK Build-Tools
   - Android Emulator

4. **Umgebungsvariablen:**
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Installation & Start

```bash
# 1. Repo pullen
git checkout claude/brainstorm-features-01NyLKiC6Q6JygMMN6VC3Hin

# 2. Dependencies installieren (von Root)
pnpm install

# 3. Android App starten
cd mobile

# Terminal 1: Metro Bundler
pnpm start

# Terminal 2: Android Build & Install
pnpm android
```

## 🎯 Nächste Schritte für Desktop-Entwicklung

**Erste Aufgaben:**

1. **OpenRouter Streaming implementieren**
   - In `mobile/src/screens/ChatScreen.tsx`
   - Import von `@chameleon/shared/api/openrouter`
   - `streamChatMessage()` verwenden
   - UI mit Streaming-Chunks aktualisieren

2. **Chat Persistence**
   - Chats in AsyncStorage speichern
   - Import von `@chameleon/shared/utils/storage`
   - `getJSON()` und `setJSON()` verwenden

3. **Settings Management**
   - API Key von User in SettingsScreen eingeben lassen
   - In AsyncStorage speichern
   - Beim App-Start laden

## 💡 Wichtige Code-Patterns

**Shared Code importieren:**
```typescript
// Types
import { Chat, Message, Persona } from '@chameleon/shared/types'

// API
import { streamChatMessage } from '@chameleon/shared/api/openrouter'

// Personas
import { PERSONAS, getPersonaById } from '@chameleon/shared/constants/personas'

// Storage
import { getJSON, setJSON } from '@chameleon/shared/utils/storage'
```

**Storage verwenden:**
```typescript
// Speichern
await setJSON('chameleon-chats', chats)

// Laden
const chats = await getJSON<Chat[]>('chameleon-chats')
```

**OpenRouter Streaming:**
```typescript
await streamChatMessage({
  apiKey: settings.apiKeys.openRouter,
  model: 'x-ai/grok-4.1-fast',
  messages: [...],
  onChunk: (chunk) => {
    // UI mit neuem Chunk aktualisieren
  },
  onComplete: (fullText) => {
    // Message in Storage speichern
  },
})
```

## 📚 Dokumentation

- **mobile/README.md** - Setup-Guide für Android
- **docs/MOBILE_DEVELOPMENT.md** - Kompletter Development-Guide
- **docs/COMPREHENSIVE_FEATURES_ROADMAP.md** - Feature-Roadmap (Mobile + Browser Extension + Agents)

## 🔗 Git Status

**Branch:** `claude/brainstorm-features-01NyLKiC6Q6JygMMN6VC3Hin`
**Letzter Commit:** `ae33156` (Add .gitignore to shared package)

**Alle Dateien sind committed und gepushed** ✅

---

## 🎬 Zusammenfassung für ersten Prompt

**Wenn du mit Claude CLI auf Desktop startest, sage:**

"Ich arbeite an der React Native Android App für Chameleon AI Chat. Das Monorepo mit /mobile und /shared ist bereits eingerichtet (Branch: claude/brainstorm-features-01NyLKiC6Q6JygMMN6VC3Hin).

Die Screens sind scaffolded, aber noch nicht funktional. Ich möchte jetzt anfangen mit:

1. OpenRouter Streaming in ChatScreen implementieren
2. Chats in AsyncStorage persistieren
3. Settings-Management mit API Key Eingabe

Das Projekt verwendet React Native 0.76.5, TypeScript, React Native Paper für UI, und einen shared/ Package für Code-Sharing mit der Web-App. Der OpenRouter API Client existiert bereits in shared/api/openrouter.ts mit streamChatMessage() Funktion.

Lass uns mit Punkt 1 anfangen."
