# Chameleon AI - Capacitor Android Implementation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Build Configuration](#build-configuration)
3. [Capacitor Modules](#capacitor-modules)
4. [Android Manifest & Permissions](#android-manifest--permissions)
5. [Native Design System](#native-design-system)
6. [GitHub Actions CI/CD](#github-actions-cicd)
7. [Local Development](#local-development)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### WebView Loading Strategy

The Chameleon AI Android app uses a **remote URL loading strategy** rather than bundling static assets. The WebView loads the app directly from the deployed Vercel URL:

```
https://chameleon-ai-chat.vercel.app
```

**Why Remote Loading?**

1. **Full API Support**: Next.js API routes, Server Actions, and SSR require a server environment
2. **Real-time Updates**: App updates are instant without requiring APK updates
3. **Supabase Integration**: Auth callbacks and real-time subscriptions work natively
4. **Smaller APK Size**: No bundled web assets (only ~5MB vs ~50MB+)

**Configuration** (`capacitor.config.ts`):
```typescript
server: {
  url: 'https://chameleon-ai-chat.vercel.app',
  cleartext: true,
  androidScheme: 'https',
  allowNavigation: [
    'https://*.supabase.co',
    'https://openrouter.ai',
    'https://*.vercel.app',
    'https://*.google.com',
    'https://*.github.com',
  ],
}
```

### Initialization Flow

```
App Launch
    ↓
Splash Screen (2s)
    ↓
CapacitorInit Component
    ↓
├── Status Bar Configuration
├── Keyboard Handling Setup
├── Network Monitoring
├── Notification Channels
├── Biometric Availability Check
├── Native Haptics Init
├── TTS Initialization
├── Theme System Setup
├── localStorage → Native Storage Migration
└── Back Button Handler
    ↓
Hide Splash Screen
    ↓
App Ready
```

---

## Build Configuration

### Version Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| Node.js | 22.x | Required by Capacitor 8 |
| Java | 21 | Required by AGP 8.9.1 |
| Gradle | 8.11.1 | Compatible with AGP 8.9.1 |
| Android Gradle Plugin | 8.9.1 | Required for AndroidX 1.17.0 |
| Compile SDK | 36 | Android 16 (API 36) |
| Target SDK | 36 | Android 16 |
| Min SDK | 33 | Android 13 |

### File Locations

| File | Purpose |
|------|---------|
| `android/build.gradle` | AGP version, Google Services plugin |
| `android/variables.gradle` | SDK versions, AndroidX library versions |
| `android/gradle/wrapper/gradle-wrapper.properties` | Gradle distribution URL |
| `android/app/build.gradle` | App configuration, dependencies |
| `capacitor.config.ts` | Capacitor settings, plugin configs |

### variables.gradle
```gradle
ext {
    minSdkVersion = 33
    compileSdkVersion = 36
    targetSdkVersion = 36
    androidxActivityVersion = '1.11.0'
    androidxAppCompatVersion = '1.7.1'
    androidxCoordinatorLayoutVersion = '1.3.0'
    androidxCoreVersion = '1.17.0'
    androidxFragmentVersion = '1.8.9'
    coreSplashScreenVersion = '1.2.0'
    androidxWebkitVersion = '1.14.0'
    cordovaAndroidVersion = '14.0.1'
}
```

### Capacitor Plugins (package.json)

All plugins are version `^8.0.0` for Capacitor 8 compatibility:

```json
{
  "@capacitor/android": "^8.0.0",
  "@capacitor/app": "^8.0.0",
  "@capacitor/browser": "^8.0.0",
  "@capacitor/camera": "^8.0.0",
  "@capacitor/clipboard": "^8.0.0",
  "@capacitor/core": "^8.0.0",
  "@capacitor/device": "^8.0.0",
  "@capacitor/dialog": "^8.0.0",
  "@capacitor/filesystem": "^8.0.0",
  "@capacitor/haptics": "^8.0.0",
  "@capacitor/keyboard": "^8.0.0",
  "@capacitor/local-notifications": "^8.0.0",
  "@capacitor/network": "^8.0.0",
  "@capacitor/preferences": "^8.0.0",
  "@capacitor/push-notifications": "^8.0.0",
  "@capacitor/share": "^8.0.0",
  "@capacitor/splash-screen": "^8.0.0",
  "@capacitor/status-bar": "^8.0.0",
  "@capacitor/toast": "^8.0.0",
  "@capacitor/action-sheet": "^8.0.0",
  "capacitor-native-biometric": "^4.2.2"
}
```

---

## Capacitor Modules

### Module Overview

| Module | File | Purpose |
|--------|------|---------|
| Core | `lib/capacitor/index.ts` | Platform detection, initialization |
| Storage | `lib/capacitor/storage.ts` | Native preferences, secure storage |
| Haptics | `lib/capacitor/haptics.ts` | Vibration feedback patterns |
| Biometric | `lib/capacitor/biometric.ts` | Fingerprint/Face authentication |
| Camera | `lib/capacitor/camera.ts` | Photo capture, gallery picker |
| Voice | `lib/capacitor/voice.ts` | Audio recording for Whisper |
| TTS | `lib/capacitor/tts.ts` | Text-to-Speech synthesis |
| Notifications | `lib/capacitor/notifications.ts` | Local notifications |
| Share | `lib/capacitor/share.ts` | Native share sheet |
| Clipboard | `lib/capacitor/clipboard.ts` | Copy/paste operations |
| Network | `lib/capacitor/network.ts` | Connectivity monitoring |
| Keyboard | `lib/capacitor/keyboard.ts` | Soft keyboard handling |
| Files | `lib/capacitor/files.ts` | File system operations |
| Theme | `lib/capacitor/theme.ts` | System theme detection |
| Auth | `lib/capacitor/auth.ts` | Deep link auth handling |
| Permissions | `lib/capacitor/permissions.ts` | Permission management |
| Native Design | `lib/capacitor/native-design.ts` | Material 3 styling |

### 1. Core Module (`index.ts`)

**Platform Detection:**
```typescript
export const isNative = Capacitor.isNativePlatform()
export const isAndroid = Capacitor.getPlatform() === 'android'
export const isIOS = Capacitor.getPlatform() === 'ios'
export const isWeb = Capacitor.getPlatform() === 'web'
```

**Plugin Availability:**
```typescript
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName)
}
```

**Initialization Functions:**
- `initializeCapacitor()` - Main initialization
- `initializeStatusBar()` - Configure status bar appearance
- `initializeSplashScreen()` - Handle splash screen hide
- `initializeKeyboard()` - Setup keyboard listeners
- `initializeApp()` - App lifecycle, back button, deep links
- `initializeNetwork()` - Network status monitoring

### 2. Storage Module (`storage.ts`)

**nativeStorage Service:**
```typescript
// Get value (auto-parses JSON)
await nativeStorage.get<User>('user')

// Set value (auto-stringifies)
await nativeStorage.set('settings', { theme: 'dark' })

// Remove value
await nativeStorage.remove('key')

// Get all keys
const keys = await nativeStorage.keys()

// Clear all
await nativeStorage.clear()

// Migrate localStorage to native
await nativeStorage.migrate()
```

**secureStorage Service:**
```typescript
// Store credentials
await secureStorage.setCredential('key', 'secret')

// Get credentials
const secret = await secureStorage.getCredential('key')

// API key storage
await secureStorage.setApiKey('openrouter', 'sk-...')
const apiKey = await secureStorage.getApiKey('openrouter')

// Auth token
await secureStorage.setAuthToken('jwt-token')
const token = await secureStorage.getAuthToken()
```

### 3. Haptics Module (`haptics.ts`)

**Haptic Patterns:**
```typescript
type HapticPattern =
  | 'light' | 'medium' | 'heavy'
  | 'success' | 'warning' | 'error'
  | 'selection' | 'notification'
  | 'send' | 'receive' | 'typing'
  | 'delete' | 'swipe' | 'longPress'
  | 'doubleTap' | 'toggle' | 'refresh'
  | 'achievement'
```

**Usage:**
```typescript
import { nativeHaptics } from '@/lib/capacitor'

// Trigger pattern
await nativeHaptics.trigger('success')

// Contextual helpers
nativeHaptics.onSendMessage()
nativeHaptics.onError()
nativeHaptics.onToggle()

// Direct methods
await nativeHaptics.impact('medium')
await nativeHaptics.notification('success')
await nativeHaptics.vibrate(200) // Custom duration

// Intensity control
nativeHaptics.setIntensity('strong') // 'off' | 'light' | 'normal' | 'strong'
```

### 4. Biometric Module (`biometric.ts`)

**Availability Check:**
```typescript
const { available, biometryType } = await nativeBiometric.isAvailable()
// biometryType: 'fingerprint' | 'face' | 'iris' | 'multiple' | 'none'
```

**Authentication:**
```typescript
const verified = await nativeBiometric.verify({
  reason: 'Authenticate to access API keys',
  title: 'Biometric Login',
  subtitle: 'Use fingerprint or face',
  negativeButtonText: 'Cancel',
  maxAttempts: 3,
})
```

**Credential Storage:**
```typescript
// Store with biometric protection
await nativeBiometric.setCredentials('server-id', {
  username: 'user@email.com',
  password: 'token',
})

// Retrieve (triggers biometric prompt)
const creds = await nativeBiometric.getCredentials('server-id')

// Convenience methods
await nativeBiometric.storeApiKey('openrouter', 'sk-...')
await nativeBiometric.storeAuthSession('user-id', 'jwt-token')
```

### 5. Camera Module (`camera.ts`)

**Photo Capture:**
```typescript
const photo = await nativeCamera.getPhoto('camera')   // Camera only
const photo = await nativeCamera.getPhoto('gallery')  // Gallery only
const photo = await nativeCamera.getPhoto('prompt')   // User choice

// Result
interface PhotoResult {
  dataUrl: string    // Base64 data URL
  format: string     // 'jpeg', 'png', etc.
  width?: number
  height?: number
}
```

**Multiple Images:**
```typescript
const photos = await nativeCamera.pickImages(5) // Max 5 images
```

**Permissions:**
```typescript
const status = await nativeCamera.checkPermissions()
// 'granted' | 'denied' | 'prompt'

await nativeCamera.requestPermissions()
```

### 6. Voice Recording Module (`voice.ts`)

**Recording API:**
```typescript
// Check availability
const available = await nativeVoice.isAvailable()

// Request permission
const granted = await nativeVoice.requestPermission()

// Start recording with amplitude visualization
await nativeVoice.startRecording((state) => {
  console.log('Recording:', state.isRecording)
  console.log('Duration:', state.duration)
  console.log('Amplitude:', state.amplitude) // 0-1
})

// Stop and get result
const result = await nativeVoice.stopRecording()
// { blob: Blob, duration: number, format: string }

// Cancel without saving
await nativeVoice.cancelRecording()

// Convert for API
const base64 = await nativeVoice.blobToBase64(result.blob)
const file = nativeVoice.blobToFile(result.blob, 'audio.webm')
```

**Recording Settings:**
- Sample rate: 16kHz (optimal for Whisper)
- Channels: Mono
- Echo cancellation: Enabled
- Noise suppression: Enabled
- Auto gain control: Enabled

### 7. TTS Module (`tts.ts`)

**Speech Synthesis:**
```typescript
await nativeTTS.initialize()

// Speak text
await nativeTTS.speak({
  text: 'Hello, world!',
  lang: 'en-US',
  rate: 1.0,    // 0.1 - 10
  pitch: 1.0,   // 0 - 2
  volume: 1.0,  // 0 - 1
})

// Control
nativeTTS.pause()
nativeTTS.resume()
nativeTTS.stop()

// Status
nativeTTS.isSpeaking() // boolean
nativeTTS.isPaused()   // boolean

// Long text with chunking
await nativeTTS.speakLong({ text: longDocument })

// Available voices
const voices = nativeTTS.getVoices()
```

### 8. Notifications Module (`notifications.ts`)

**Notification Channels (Android):**
- `chat_messages` - AI responses (high priority, vibration)
- `background_tasks` - Ongoing operations (low priority)
- `reminders` - Follow-up reminders (default priority)

**Usage:**
```typescript
await nativeNotifications.initialize()

// Check/request permissions
const status = await nativeNotifications.checkPermissions()
await nativeNotifications.requestPermissions()

// Show notification
const id = await nativeNotifications.show({
  title: 'New Message',
  body: 'Claude responded to your question',
  channelId: 'chat_messages',
  iconColor: '#22c55e',
  extra: { chatId: '123' },
})

// Cancel
await nativeNotifications.cancel(id)
await nativeNotifications.cancelAll()

// Convenience methods
await nativeNotifications.notifyAIResponse('Claude', 'Here is my response...')
await nativeNotifications.notifyStreamingComplete('GPT-4')
await nativeNotifications.showBackgroundTask('Generating...', 'Please wait')
```

### 9. Share Module (`share.ts`)

**Share Content:**
```typescript
const result = await nativeShare.share({
  title: 'Chameleon AI Chat',
  text: 'Check out this conversation',
  url: 'https://chameleon-ai-chat.vercel.app',
})
// result: { shared: boolean, platform: 'native' | 'web' | 'clipboard' }

// Convenience methods
await nativeShare.shareChat('My Chat', content, url)
await nativeShare.shareResponse(aiResponse)
```

**Clipboard:**
```typescript
await nativeShare.copyToClipboard('Text to copy')
const text = await nativeShare.readFromClipboard()
```

### 10. Network Module (`network.ts`)

**Connectivity Monitoring:**
```typescript
// Get current status
const status = await nativeNetwork.getStatus()
// { connected: boolean, connectionType: string }

// Listen for changes
nativeNetwork.addListener((status) => {
  if (!status.connected) {
    showOfflineMessage()
  }
})

// Body class updates automatically
// <body class="offline"> when disconnected
```

### 11. Keyboard Module (`keyboard.ts`)

**Keyboard Handling:**
```typescript
// CSS variable updated automatically
// --keyboard-height: 350px (when visible)
// --keyboard-height: 0px (when hidden)

// Body class
// <body class="keyboard-visible">

// Manual control
await nativeKeyboard.hide()
await nativeKeyboard.show()
```

---

## Android Manifest & Permissions

### Permissions Summary

| Permission | Purpose |
|------------|---------|
| INTERNET | API calls to OpenRouter, Supabase |
| ACCESS_NETWORK_STATE | Network connectivity detection |
| CAMERA | Photo capture for image uploads |
| READ_MEDIA_IMAGES/VIDEO/AUDIO | Media picker access |
| RECORD_AUDIO | Voice input for Whisper transcription |
| VIBRATE | Haptic feedback |
| POST_NOTIFICATIONS | Local notifications |
| USE_BIOMETRIC | Fingerprint/face authentication |
| FOREGROUND_SERVICE | Background AI response processing |
| WAKE_LOCK | Keep device awake during long operations |

### Intent Filters

**Deep Links:**
```xml
<!-- Auth callback -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="https"
        android:host="chameleon-ai-chat.vercel.app"
        android:pathPrefix="/auth/callback" />
</intent-filter>

<!-- Custom URL scheme -->
<intent-filter>
    <data android:scheme="chameleon-ai" />
</intent-filter>

<!-- Web+chameleon protocol -->
<intent-filter>
    <data android:scheme="web+chameleon" />
</intent-filter>
```

**Share Targets:**
- `text/plain` - Receive shared text
- `image/*` - Receive shared images
- `application/pdf` - Receive shared PDFs
- Multiple images (`SEND_MULTIPLE`)

### App Shortcuts

Defined in `android/app/src/main/res/xml/shortcuts.xml`:
- New Chat
- Simple Mode
- Debate Mode

### Home Screen Widget

A native Android widget for quick access to Chameleon AI features.

**Location:** `android/app/src/main/java/com/chameleon/ai/chat/ChameleonWidget.java`

**Features:**
- "New Chat" button - Instantly starts a new conversation
- "Voice Input" button - Opens app with voice recording active
- Dark themed with app branding
- Resizable (default 3x2 cells)

**Files:**
| File | Purpose |
|------|---------|
| `ChameleonWidget.java` | Widget provider class |
| `res/layout/widget_chameleon.xml` | Widget layout |
| `res/xml/widget_info.xml` | Widget metadata |
| `res/drawable/widget_background.xml` | Rounded dark background |
| `res/drawable/widget_button_background.xml` | Button styling |

**How to Add Widget:**
1. Long-press on home screen
2. Select "Widgets"
3. Find "Chameleon AI"
4. Drag to home screen

### Text Selection Integration ("Ask Chameleon")

Allows users to select text anywhere on Android and query Chameleon AI.

**Location:** `android/app/src/main/java/com/chameleon/ai/chat/ProcessTextActivity.java`

**How it works:**
1. User selects text in any app (browser, notes, etc.)
2. Tap "Ask Chameleon" in the text selection menu
3. App opens with selected text pre-filled as a question
4. AI responds to the query

**Technical Implementation:**
```xml
<!-- AndroidManifest.xml -->
<activity
    android:name=".ProcessTextActivity"
    android:label="@string/ask_chameleon"
    android:theme="@android:style/Theme.Translucent.NoTitleBar"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.PROCESS_TEXT" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
    </intent-filter>
</activity>
```

**Event Flow:**
```
User selects text → "Ask Chameleon" → ProcessTextActivity
    ↓
MainActivity receives intent with action="process_text"
    ↓
dispatchEventWithRetry() waits for web app ready
    ↓
window.__chameleonReady === true
    ↓
Dispatch 'chameleon:ask' event with selected text
    ↓
capacitor-init.tsx creates new chat and inserts text
```

### Keyboard Predictions

Full keyboard autocomplete/prediction support in WebView.

**Configuration:**
```typescript
// capacitor.config.ts
android: {
  captureInput: false,  // Let native keyboard handle input
}
```

**HTML Attributes:**
```tsx
<Textarea
  autoComplete="on"
  autoCorrect="on"
  autoCapitalize="sentences"
  spellCheck={true}
  inputMode="text"
  enterKeyHint="send"
/>
```

**WebView Settings (MainActivity.java):**
```java
settings.setSaveFormData(true);
webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_YES);
```

---

## Native Design System

### Material 3 Expressive (2025)

The native Android app uses Material 3 Expressive design language with:

**Features:**
- Spring-based animations (bouncy, expressive motion)
- Blur effects for bottom sheets and navigation
- Larger touch targets (56dp buttons)
- Pill-shaped navigation indicators
- Squircle FABs

**Color System:**
```typescript
materialColors.primary[80]  // #65df76 (main green)
materialColors.surface.container  // #1b211c (cards)
materialColors.outline.default    // #8b938a (borders)
```

**Animation Timing:**
```typescript
androidMotion.easing.expressive       // Spring overshoot
androidMotion.easing.expressiveSpring // Bouncy spring
androidMotion.duration.expressiveMedium // 350ms
```

**CSS Classes:**
```typescript
nativeClasses.button        // 'native-button native-ripple'
nativeClasses.buttonFilled  // 'native-button native-button-filled native-ripple'
nativeClasses.card          // 'native-card native-ripple'
nativeClasses.fab           // 'native-fab native-ripple native-fab-appear'
nativeClasses.bottomSheet   // 'native-bottom-sheet native-sheet-enter'
```

**Safe Area Handling:**
```css
body.native-android {
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
```

---

## GitHub Actions CI/CD

### Workflow: `.github/workflows/build-android.yml`

**Triggers:**
- Push to `main` or `claude/*` branches (when android files change)
- Pull requests to `main`
- Manual dispatch (debug or release)

**Build Matrix:**

| Input | Options |
|-------|---------|
| `build_type` | `debug` (default), `release` |

**Steps:**
1. Checkout repository
2. Setup Node.js 22
3. Setup Java 21 (Temurin)
4. Setup Android SDK 36
5. Cache node_modules and Gradle
6. Install npm dependencies
7. Create placeholder `out/` folder
8. Run `npx cap sync android`
9. Fix generated Capacitor files (AGP version)
10. Build APK (`assembleDebug` or `assembleRelease`)
11. Upload artifact

**Artifacts:**
- Debug: `chameleon-ai-debug-v{version}-{run_number}.apk`
- Release: `chameleon-ai-release-v{version}-{run_number}.apk`

**Note:** The `out/` folder is gitignored. The workflow creates a minimal placeholder since the app loads from a remote URL, not bundled assets.

---

## Local Development

### Prerequisites

```bash
# Install Android Studio with SDK 36
# Set ANDROID_HOME environment variable

# Install Java 21
brew install openjdk@21  # macOS
# or download from adoptium.net

# Install Node 22
nvm install 22
nvm use 22
```

### Build Commands

```bash
# Install dependencies
npm ci

# Sync Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Build debug APK
npm run cap:android:build

# Build release APK
npm run cap:android:release

# Run on connected device/emulator
npx cap run android
```

### Local Development Server

For development with hot reload:

1. Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'http://10.0.2.2:3000',  // Android emulator
  // url: 'http://YOUR_LOCAL_IP:3000',  // Physical device
}
```

2. Start dev server:
```bash
npm run dev
```

3. Rebuild and run:
```bash
npx cap sync android
npx cap run android
```

---

## Troubleshooting

### Common Issues

**1. AGP Version Mismatch**
```
Could not find com.android.tools.build:gradle:8.13.0
```
Solution: Ensure `android/build.gradle` uses `gradle:8.9.1`

**2. Gradle Version Incompatible**
```
Minimum supported Gradle version is 8.11
```
Solution: Update `gradle-wrapper.properties` to `gradle-8.11.1-all.zip`

**3. SDK 36 Not Found**
```
Installed Build Tools revision 36.0.0 is corrupted
```
Solution: Run in Android Studio: SDK Manager > SDK Tools > Show Package Details > Install 36.0.0

**4. Node Version Error**
```
Capacitor 8 requires Node 22 or higher
```
Solution: `nvm use 22` or update workflow to `NODE_VERSION: '22'`

**5. cap sync Fails Without `out/` Folder**
```
Unable to find index.html
```
Solution: Create placeholder:
```bash
mkdir -p out
echo '<!DOCTYPE html><html><head></head><body></body></html>' > out/index.html
```

**6. Status Bar Overlaps Content**
Solution: Ensure `StatusBar.setOverlaysWebView({ overlay: false })` is called and safe-area-inset CSS is applied.

### Debug Tips

1. **Enable WebView debugging:**
   - Set `webContentsDebuggingEnabled: true` in capacitor.config.ts
   - Open Chrome DevTools: `chrome://inspect`

2. **Check Capacitor logs:**
   ```bash
   adb logcat | grep -i capacitor
   ```

3. **View network requests:**
   ```bash
   adb logcat | grep -E "(OkHttp|Network)"
   ```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2024-12 | Status bar fix, safe area insets |
| 1.0.0 | 2024-12 | Initial Capacitor 8 implementation |

---

## Related Files

- `capacitor.config.ts` - Main Capacitor configuration
- `components/capacitor-init.tsx` - Initialization component
- `lib/capacitor/` - All native modules
- `android/` - Android project files
- `.github/workflows/build-android.yml` - CI/CD workflow
