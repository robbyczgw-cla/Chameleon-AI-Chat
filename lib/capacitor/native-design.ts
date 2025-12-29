/**
 * Native Android Design System
 * Material You (Material Design 3) styling for native Android app
 * Provides a truly native feel distinct from PWA
 */

import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()
export const isAndroid = Capacitor.getPlatform() === 'android'

/**
 * Material You Color System
 * Dynamic colors based on Android 12+ system theming
 */
export const materialColors = {
  // Primary tonal palette (green theme to match Chameleon branding)
  primary: {
    0: '#000000',
    10: '#002106',
    20: '#00390f',
    25: '#004514',
    30: '#00531a',
    35: '#006120',
    40: '#006e26',
    50: '#008a31',
    60: '#21a644',
    70: '#46c25d',
    80: '#65df76',
    90: '#83fc8f',
    95: '#c3ffbf',
    99: '#f5fff0',
    100: '#ffffff',
  },
  // Surface colors for dark theme
  surface: {
    dim: '#0f1510',
    default: '#0f1510',
    bright: '#353a35',
    containerLowest: '#0a0f0b',
    containerLow: '#171d18',
    container: '#1b211c',
    containerHigh: '#252b26',
    containerHighest: '#303631',
  },
  // Outline colors
  outline: {
    default: '#8b938a',
    variant: '#414941',
  },
} as const

/**
 * Android-specific spacing (4dp grid system)
 */
export const androidSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const

/**
 * Material 3 elevation levels (Android shadow system)
 */
export const elevation = {
  level0: 0,
  level1: 1,  // Cards, sheets
  level2: 3,  // Raised buttons
  level3: 6,  // FABs, navigation
  level4: 8,  // Dialogs
  level5: 12, // Overlays
} as const

/**
 * Android animation specifications (Material 3 Expressive Motion - 2025)
 * M3 Expressive uses motion springs for natural, springy interactions
 */
export const androidMotion = {
  // Emphasized easing for Android (M3 Expressive uses spring physics)
  easing: {
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
    standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    // NEW: M3 Expressive spring-based easing
    expressive: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring overshoot
    expressiveSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy spring
    expressiveDecelerate: 'cubic-bezier(0, 0.55, 0.45, 1)', // Smooth spring settle
    legacy: 'cubic-bezier(0.4, 0, 0.2, 1)', // Old Material easing
  },
  // Duration tokens (M3 Expressive uses slightly longer durations for expressiveness)
  duration: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
    long3: 550,
    long4: 600,
    extraLong1: 700,
    extraLong2: 800,
    extraLong3: 900,
    extraLong4: 1000,
    // NEW: Expressive durations
    expressiveShort: 180,
    expressiveMedium: 350,
    expressiveLong: 550,
  },
  // NEW: Spring configurations for M3 Expressive
  spring: {
    snappy: { stiffness: 400, damping: 30 },
    responsive: { stiffness: 300, damping: 25 },
    gentle: { stiffness: 200, damping: 20 },
    bouncy: { stiffness: 250, damping: 15 },
  },
} as const

/**
 * Material 3 Typography (Roboto)
 */
export const materialTypography = {
  displayLarge: { size: 57, lineHeight: 64, weight: 400, tracking: -0.25 },
  displayMedium: { size: 45, lineHeight: 52, weight: 400, tracking: 0 },
  displaySmall: { size: 36, lineHeight: 44, weight: 400, tracking: 0 },
  headlineLarge: { size: 32, lineHeight: 40, weight: 400, tracking: 0 },
  headlineMedium: { size: 28, lineHeight: 36, weight: 400, tracking: 0 },
  headlineSmall: { size: 24, lineHeight: 32, weight: 400, tracking: 0 },
  titleLarge: { size: 22, lineHeight: 28, weight: 400, tracking: 0 },
  titleMedium: { size: 16, lineHeight: 24, weight: 500, tracking: 0.15 },
  titleSmall: { size: 14, lineHeight: 20, weight: 500, tracking: 0.1 },
  bodyLarge: { size: 16, lineHeight: 24, weight: 400, tracking: 0.5 },
  bodyMedium: { size: 14, lineHeight: 20, weight: 400, tracking: 0.25 },
  bodySmall: { size: 12, lineHeight: 16, weight: 400, tracking: 0.4 },
  labelLarge: { size: 14, lineHeight: 20, weight: 500, tracking: 0.1 },
  labelMedium: { size: 12, lineHeight: 16, weight: 500, tracking: 0.5 },
  labelSmall: { size: 11, lineHeight: 16, weight: 500, tracking: 0.5 },
} as const

/**
 * Material 3 Shape System
 */
export const materialShape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
} as const

/**
 * Android-specific touch targets
 */
export const androidTouchTarget = {
  minimum: 48, // Minimum touch target (48dp)
  standard: 56, // Standard touch target
  large: 64,   // Large touch target (FAB, primary CTAs)
} as const

/**
 * Generate CSS variables for native Android styling
 * Material 3 Expressive (Android 16 - 2025)
 */
export function generateNativeCSS(): string {
  if (!isAndroid) return ''

  return `
    /* ====================================================
       Material 3 Expressive - Android 16 (2025)
       Springy animations, expressive typography, blur effects
       ==================================================== */

    :root {
      /* Surface colors */
      --native-surface-dim: ${materialColors.surface.dim};
      --native-surface: ${materialColors.surface.default};
      --native-surface-bright: ${materialColors.surface.bright};
      --native-surface-container-lowest: ${materialColors.surface.containerLowest};
      --native-surface-container-low: ${materialColors.surface.containerLow};
      --native-surface-container: ${materialColors.surface.container};
      --native-surface-container-high: ${materialColors.surface.containerHigh};
      --native-surface-container-highest: ${materialColors.surface.containerHighest};

      /* Primary colors */
      --native-primary: ${materialColors.primary[80]};
      --native-on-primary: ${materialColors.primary[20]};
      --native-primary-container: ${materialColors.primary[30]};
      --native-on-primary-container: ${materialColors.primary[90]};

      /* Outline */
      --native-outline: ${materialColors.outline.default};
      --native-outline-variant: ${materialColors.outline.variant};

      /* M3 Expressive Motion (Springy) */
      --native-easing-emphasized: ${androidMotion.easing.emphasized};
      --native-easing-expressive: ${androidMotion.easing.expressive};
      --native-easing-spring: ${androidMotion.easing.expressiveSpring};
      --native-easing-standard: ${androidMotion.easing.standard};
      --native-duration-short: ${androidMotion.duration.expressiveShort}ms;
      --native-duration-medium: ${androidMotion.duration.expressiveMedium}ms;
      --native-duration-long: ${androidMotion.duration.expressiveLong}ms;

      /* Shape */
      --native-radius-small: ${materialShape.small}px;
      --native-radius-medium: ${materialShape.medium}px;
      --native-radius-large: ${materialShape.large}px;
      --native-radius-extra-large: ${materialShape.extraLarge}px;

      /* Touch */
      --native-touch-target: ${androidTouchTarget.minimum}px;
      --native-touch-large: ${androidTouchTarget.large}px;

      /* Android-specific font (Roboto) */
      --font-sans: 'Roboto', 'Google Sans', system-ui, sans-serif;
    }

    /* ====================================================
       Body Styling - M3 Expressive
       ==================================================== */
    body.native-android {
      font-family: 'Roboto', 'Google Sans', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      -webkit-tap-highlight-color: transparent;
      overscroll-behavior: none;
      /* M3 Expressive uses bolder typography */
      font-weight: 400;
      letter-spacing: 0.01em;
    }

    /* ====================================================
       CRITICAL: Status Bar Safe Area Fix for Vivo/Xiaomi/etc
       The --safe-area-top variable is set by:
       1. MainActivity.java (native injection)
       2. capacitor-init.tsx (fallback: 28px)

       IMPORTANT: Body padding doesn't work with h-[100dvh] children!
       We must apply padding directly to viewport-height containers.
       ==================================================== */

    /* Body setup - no padding here since children use viewport units */
    body.native-android {
      margin: 0 !important;
      padding: 0 !important;
      min-height: 100vh !important;
      min-height: 100dvh !important;
      overflow: hidden !important;
    }

    /* CRITICAL FIX: Apply safe area to viewport-height containers directly.
       These containers use 100dvh which ignores body padding.
       We add top padding and reduce height to account for status bar. */
    body.native-android .h-\\[100dvh\\] {
      height: calc(100dvh - var(--safe-area-top, 28px)) !important;
      padding-top: var(--safe-area-top, 28px) !important;
      box-sizing: content-box !important;
    }

    body.native-android .h-screen {
      height: calc(100vh - var(--safe-area-top, 28px)) !important;
      padding-top: var(--safe-area-top, 28px) !important;
      box-sizing: content-box !important;
    }

    /* Remove iOS env() safe-area padding - we handle it via --safe-area-top */
    body.native-android .pt-\\[env\\(safe-area-inset-top\\,0px\\)\\] {
      padding-top: 0 !important;
    }

    /* Sticky headers stay at top:0 (now correctly positioned) */
    body.native-android header,
    body.native-android header.sticky,
    body.native-android .sticky.top-0 {
      top: 0 !important;
      margin-top: 0 !important;
    }

    /* Fixed top elements need explicit offset */
    body.native-android .fixed.top-0 {
      top: var(--safe-area-top, 28px) !important;
    }

    /* Bottom: Remove iOS safe-area padding that causes wasted space on Android.
       Android handles navigation bar differently - we use --safe-area-bottom from MainActivity */
    body.native-android .pb-safe,
    body.native-android [class*="pb-[env(safe-area-inset-bottom"] {
      padding-bottom: var(--safe-area-bottom, 0px) !important;
    }

    /* Fixed bottom elements - minimal safe area */
    body.native-android .fixed.bottom-0 {
      bottom: 0 !important;
      padding-bottom: var(--safe-area-bottom, 0px) !important;
    }

    /* ====================================================
       M3 Expressive Ripple Effect (Springy)
       ==================================================== */
    .native-ripple {
      position: relative;
      overflow: hidden;
      transform: translateZ(0); /* GPU acceleration */
    }

    .native-ripple::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at var(--ripple-x, 50%) var(--ripple-y, 50%),
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0.1) 40%,
        transparent 70%);
      transform: scale(0);
      opacity: 0;
      transition: transform 0.4s var(--native-easing-spring), opacity 0.3s ease-out;
      pointer-events: none;
    }

    .native-ripple:active::after {
      transform: scale(2.5);
      opacity: 1;
      transition: transform 0.15s var(--native-easing-expressive), opacity 0s;
    }

    /* Springy press effect */
    .native-ripple:active {
      transform: scale(0.97);
      transition: transform 0.1s var(--native-easing-spring);
    }

    .native-ripple:not(:active) {
      transition: transform 0.35s var(--native-easing-spring);
    }

    /* ====================================================
       M3 Expressive Cards
       ==================================================== */
    .native-card {
      background: var(--native-surface-container);
      border-radius: var(--native-radius-large);
      border: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
      transition: transform 0.3s var(--native-easing-spring),
                  box-shadow 0.2s ease-out;
    }

    .native-card:active {
      transform: scale(0.98);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .native-card-elevated {
      background: var(--native-surface-container-high);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15),
                  0 4px 12px rgba(0, 0, 0, 0.1),
                  0 8px 24px rgba(0, 0, 0, 0.05);
    }

    /* ====================================================
       M3 Expressive Buttons (Bigger, Bolder)
       ==================================================== */
    .native-button {
      min-height: 56px; /* Larger in M3E */
      padding: 0 28px;
      border-radius: 28px; /* Full pill shape */
      font-weight: 600; /* Bolder */
      font-size: 16px;
      letter-spacing: 0.02em;
      transition: all var(--native-duration-short) var(--native-easing-spring);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .native-button:active {
      transform: scale(0.95);
    }

    .native-button-filled {
      background: linear-gradient(135deg, var(--native-primary) 0%, ${materialColors.primary[70]} 100%);
      color: var(--native-on-primary);
      box-shadow: 0 2px 8px rgba(101, 223, 118, 0.3);
    }

    .native-button-filled:active {
      box-shadow: 0 1px 4px rgba(101, 223, 118, 0.2);
    }

    .native-button-tonal {
      background: var(--native-primary-container);
      color: var(--native-on-primary-container);
    }

    .native-button-outlined {
      background: transparent;
      border: 2px solid var(--native-outline);
      color: var(--native-primary);
    }

    .native-button-text {
      background: transparent;
      color: var(--native-primary);
      min-height: 48px;
      padding: 0 16px;
    }

    /* ====================================================
       M3 Expressive FAB (New Squircle Shape)
       ==================================================== */
    .native-fab {
      width: 64px; /* Larger in M3E */
      height: 64px;
      border-radius: 20px; /* Squircle */
      background: linear-gradient(135deg, var(--native-primary-container) 0%, ${materialColors.primary[40]} 100%);
      color: var(--native-on-primary-container);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2),
                  0 8px 16px rgba(0, 0, 0, 0.1),
                  0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--native-duration-medium) var(--native-easing-spring);
    }

    .native-fab:active {
      transform: scale(0.9);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .native-fab-extended {
      width: auto;
      height: 56px;
      padding: 0 24px;
      gap: 12px;
      border-radius: 28px;
    }

    /* ====================================================
       M3 Expressive Bottom Sheet (Blur + Spring)
       ==================================================== */
    .native-bottom-sheet {
      background: rgba(23, 29, 24, 0.85);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-radius: 32px 32px 0 0;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3),
                  0 0 0 1px rgba(255, 255, 255, 0.05) inset;
    }

    .native-bottom-sheet-handle {
      width: 40px;
      height: 5px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 3px;
      margin: 14px auto;
    }

    /* ====================================================
       M3 Expressive Navigation Bar
       ==================================================== */
    .native-navbar {
      background: rgba(15, 21, 16, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: none;
      height: 80px;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }

    .native-navbar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-width: 72px;
      padding: 12px 0 16px;
      position: relative;
      transition: transform 0.2s var(--native-easing-spring);
    }

    .native-navbar-item:active {
      transform: scale(0.9);
    }

    .native-navbar-item-active {
      color: var(--native-on-primary-container);
    }

    /* M3E pill indicator with spring animation */
    .native-navbar-item-active::before {
      content: '';
      position: absolute;
      width: 64px;
      height: 32px;
      background: var(--native-primary-container);
      border-radius: 16px;
      z-index: -1;
      animation: nav-pill-appear 0.35s var(--native-easing-spring) forwards;
    }

    @keyframes nav-pill-appear {
      from { transform: scaleX(0.5); opacity: 0; }
      to { transform: scaleX(1); opacity: 1; }
    }

    /* ====================================================
       M3 Expressive Top App Bar
       ==================================================== */
    .native-appbar {
      height: 64px;
      background: var(--native-surface);
      display: flex;
      align-items: center;
      padding: 0 4px;
    }

    .native-appbar-title {
      font-size: 22px;
      font-weight: 400;
      margin-left: 16px;
    }

    /* Android Input Fields */
    .native-input {
      min-height: 56px;
      background: var(--native-surface-container-highest);
      border: none;
      border-bottom: 1px solid var(--native-outline-variant);
      border-radius: var(--native-radius-small) var(--native-radius-small) 0 0;
      padding: 16px;
      font-size: 16px;
      transition: border-color var(--native-duration-short) var(--native-easing-standard);
    }

    .native-input:focus {
      border-bottom-color: var(--native-primary);
      border-bottom-width: 2px;
    }

    /* Android List Item */
    .native-list-item {
      min-height: 56px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .native-list-item-three-line {
      min-height: 88px;
      align-items: flex-start;
      padding: 12px 16px;
    }

    /* Android Dialog */
    .native-dialog {
      background: var(--native-surface-container-high);
      border-radius: var(--native-radius-extra-large);
      padding: 24px;
      min-width: 280px;
      max-width: calc(100vw - 48px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15), 0 4px 4px rgba(0, 0, 0, 0.3);
    }

    .native-dialog-title {
      font-size: 24px;
      font-weight: 400;
      margin-bottom: 16px;
    }

    .native-dialog-content {
      color: var(--native-outline);
      margin-bottom: 24px;
    }

    .native-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    /* Android Snackbar */
    .native-snackbar {
      background: var(--native-surface-container-highest);
      color: var(--native-on-primary-container);
      border-radius: var(--native-radius-small);
      padding: 14px 16px;
      margin: 16px;
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
    }

    /* Android Chip */
    .native-chip {
      height: 32px;
      border-radius: 8px;
      padding: 0 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      background: var(--native-surface-container-high);
      border: 1px solid var(--native-outline-variant);
    }

    .native-chip-selected {
      background: var(--native-primary-container);
      border-color: transparent;
    }

    /* Android Switch */
    .native-switch-track {
      width: 52px;
      height: 32px;
      border-radius: 16px;
      background: var(--native-surface-container-highest);
      border: 2px solid var(--native-outline);
      transition: all var(--native-duration-short) var(--native-easing-standard);
    }

    .native-switch-track-checked {
      background: var(--native-primary);
      border-color: var(--native-primary);
    }

    .native-switch-thumb {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background: var(--native-outline);
      transition: all var(--native-duration-short) var(--native-easing-standard);
    }

    .native-switch-thumb-checked {
      background: var(--native-on-primary);
      transform: translateX(20px);
    }

    /* Android Progress Indicator */
    .native-progress-linear {
      height: 4px;
      background: var(--native-surface-container-highest);
      border-radius: 2px;
      overflow: hidden;
    }

    .native-progress-linear-indicator {
      height: 100%;
      background: var(--native-primary);
      border-radius: 2px;
    }

    /* Android Divider */
    .native-divider {
      height: 1px;
      background: var(--native-outline-variant);
    }

    /* Animation: Predictive Back Gesture */
    @keyframes native-back-gesture {
      from {
        transform: scale(1) translateX(0);
        opacity: 1;
      }
      to {
        transform: scale(0.9) translateX(10%);
        opacity: 0;
      }
    }

    .native-back-animating {
      animation: native-back-gesture 0.3s var(--native-easing-emphasized) forwards;
    }

    /* Animation: Page Enter */
    @keyframes native-page-enter {
      from {
        opacity: 0;
        transform: translateY(24px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .native-page-enter {
      animation: native-page-enter 0.3s var(--native-easing-emphasized) forwards;
    }

    /* Animation: FAB Appear */
    @keyframes native-fab-appear {
      from {
        opacity: 0;
        transform: scale(0.4);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .native-fab-appear {
      animation: native-fab-appear 0.25s var(--native-easing-emphasized) forwards;
    }

    /* Animation: Bottom Sheet Enter */
    @keyframes native-sheet-enter {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .native-sheet-enter {
      animation: native-sheet-enter 0.4s var(--native-easing-emphasized) forwards;
    }
  `
}

/**
 * Apply native Android styling to the document
 */
export function applyNativeStyling(): void {
  if (!isAndroid) return

  // Add native-android class to body
  document.body.classList.add('native-android')

  // Inject native CSS
  const styleId = 'native-android-styles'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = generateNativeCSS()
    document.head.appendChild(style)
  }

  console.log('[NativeDesign] Applied Android Material You styling')
}

/**
 * Get native class names for components
 */
export const nativeClasses = {
  card: isAndroid ? 'native-card native-ripple' : '',
  cardElevated: isAndroid ? 'native-card-elevated native-ripple' : '',
  button: isAndroid ? 'native-button native-ripple' : '',
  buttonFilled: isAndroid ? 'native-button native-button-filled native-ripple' : '',
  buttonTonal: isAndroid ? 'native-button native-button-tonal native-ripple' : '',
  buttonOutlined: isAndroid ? 'native-button native-button-outlined native-ripple' : '',
  fab: isAndroid ? 'native-fab native-ripple native-fab-appear' : '',
  fabExtended: isAndroid ? 'native-fab native-fab-extended native-ripple' : '',
  bottomSheet: isAndroid ? 'native-bottom-sheet native-sheet-enter' : '',
  input: isAndroid ? 'native-input' : '',
  listItem: isAndroid ? 'native-list-item native-ripple' : '',
  dialog: isAndroid ? 'native-dialog' : '',
  chip: isAndroid ? 'native-chip native-ripple' : '',
  chipSelected: isAndroid ? 'native-chip native-chip-selected native-ripple' : '',
  appbar: isAndroid ? 'native-appbar' : '',
  navbar: isAndroid ? 'native-navbar' : '',
  navbarItem: isAndroid ? 'native-navbar-item native-ripple' : '',
  snackbar: isAndroid ? 'native-snackbar' : '',
  divider: isAndroid ? 'native-divider' : '',
  pageEnter: isAndroid ? 'native-page-enter' : '',
} as const

export default {
  materialColors,
  androidSpacing,
  elevation,
  androidMotion,
  materialTypography,
  materialShape,
  androidTouchTarget,
  generateNativeCSS,
  applyNativeStyling,
  nativeClasses,
  isNative,
  isAndroid,
}
