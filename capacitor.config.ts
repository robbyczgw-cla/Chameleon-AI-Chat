import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.chameleon.ai.chat',
  appName: 'Chameleon AI',
  webDir: 'out',

  // Server configuration - loads from deployed web app for full API support
  server: {
    // Production: Load from deployed URL (comment out for local development)
    url: process.env.CAPACITOR_SERVER_URL || 'https://chameleon-ai-chat.vercel.app',
    // For local development, use:
    // url: 'http://10.0.2.2:3000', // Android emulator
    // url: 'http://localhost:3000', // Web
    cleartext: true,
    androidScheme: 'https',
    // Enable navigation to external URLs
    allowNavigation: [
      'https://*.supabase.co',
      'https://openrouter.ai',
      'https://*.vercel.app',
      'https://*.google.com', // OAuth
      'https://*.github.com', // OAuth
    ],
  },

  // Android-specific configuration - Optimized for Android 13-15
  android: {
    allowMixedContent: true,
    // IMPORTANT: captureInput false allows native keyboard predictions to work
    captureInput: false,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
    backgroundColor: '#0a0a0a',
    // Minimum SDK 33 (Android 13), Target SDK 35 (Android 15)
    minWebViewVersion: 100,
    appendUserAgent: 'ChameleonAI/1.0.0',
    // Enable hardware acceleration
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      signingType: 'apksigner',
    },
    // Enable edge-to-edge display for Android 15+
    overrideUserAgent: undefined,
    useLegacyBridge: false,
  },

  plugins: {
    // Splash Screen Configuration
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#22c55e',
      splashFullScreen: true,
      splashImmersive: true,
    },

    // Status Bar Configuration
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },

    // Keyboard Configuration
    Keyboard: {
      // CRITICAL: Set to 'none' to let native adjustResize handle keyboard
      // Other modes cause black bar between content and keyboard
      resize: 'none',
      resizeOnFullScreen: false,
      scrollPadding: false,
    },

    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#22c55e',
      sound: 'default',
    },
  },
}

export default config
