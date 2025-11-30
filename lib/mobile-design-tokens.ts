/**
 * Mobile Design Tokens
 *
 * Centralized design tokens for consistent mobile UI across the app.
 * Based on 8px grid system with touch-friendly sizing.
 *
 * @see https://designsystem.digital.gov/design-tokens/spacing-units/
 */

// Base unit (8px grid)
const BASE_UNIT = 8

/**
 * Spacing tokens - multiples of 8px
 */
export const spacing = {
  /** 4px - Extra small spacing */
  xs: BASE_UNIT * 0.5,
  /** 8px - Small spacing */
  sm: BASE_UNIT,
  /** 12px - Medium-small spacing */
  md: BASE_UNIT * 1.5,
  /** 16px - Medium spacing */
  lg: BASE_UNIT * 2,
  /** 24px - Large spacing */
  xl: BASE_UNIT * 3,
  /** 32px - Extra large spacing */
  '2xl': BASE_UNIT * 4,
  /** 48px - 2x extra large spacing */
  '3xl': BASE_UNIT * 6,
} as const

/**
 * Touch target sizes - minimum 44px for accessibility
 * @see https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
 */
export const touchTarget = {
  /** 32px - Small touch target (icons in dense layouts) */
  sm: 32,
  /** 40px - Medium touch target (standard buttons) */
  md: 40,
  /** 44px - Minimum accessible touch target */
  min: 44,
  /** 48px - Large touch target (primary actions) */
  lg: 48,
  /** 56px - Extra large touch target (FAB, main CTAs) */
  xl: 56,
} as const

/**
 * Icon sizes
 */
export const iconSize = {
  /** 14px - Extra small icons */
  xs: 14,
  /** 16px - Small icons */
  sm: 16,
  /** 18px - Medium icons */
  md: 18,
  /** 20px - Default icons */
  default: 20,
  /** 24px - Large icons */
  lg: 24,
  /** 32px - Extra large icons */
  xl: 32,
} as const

/**
 * Toggle/Switch dimensions
 * Consistent pill-slider design
 */
export const toggle = {
  /** Track dimensions */
  track: {
    width: 32,
    height: 16,
  },
  /** Thumb (slider dot) dimensions */
  thumb: {
    size: 10,
    /** Offset from edge when unchecked */
    offsetUnchecked: 4,
    /** Offset from edge when checked */
    offsetChecked: 18,
  },
} as const

/**
 * Button sizes for mobile
 */
export const button = {
  /** Small button - for secondary actions */
  sm: {
    height: 32,
    paddingX: 12,
    fontSize: 13,
    iconSize: 14,
  },
  /** Medium button - standard size */
  md: {
    height: 40,
    paddingX: 16,
    fontSize: 14,
    iconSize: 16,
  },
  /** Large button - primary CTAs */
  lg: {
    height: 48,
    paddingX: 24,
    fontSize: 16,
    iconSize: 20,
  },
  /** Icon-only button */
  icon: {
    sm: 32,
    md: 40,
    lg: 48,
  },
} as const

/**
 * Input field dimensions
 */
export const input = {
  /** Standard input height */
  height: 44,
  /** Textarea minimum height */
  textareaMinHeight: 80,
  /** Border radius */
  borderRadius: 8,
  /** Horizontal padding */
  paddingX: 12,
  /** Font size */
  fontSize: 16, // Prevents iOS zoom on focus
} as const

/**
 * Bottom navigation dimensions
 */
export const bottomNav = {
  /** Total height including safe area */
  height: 56,
  /** Height of the actual nav content */
  contentHeight: 48,
  /** Individual nav item width (when 5 items) */
  itemWidth: 64,
  /** Icon size in nav */
  iconSize: 22,
  /** Label font size */
  labelSize: 10,
} as const

/**
 * Card/Container dimensions
 */
export const card = {
  /** Standard padding */
  padding: 16,
  /** Compact padding */
  paddingCompact: 12,
  /** Border radius */
  borderRadius: 12,
  /** Border radius for small cards */
  borderRadiusSm: 8,
} as const

/**
 * Modal/Dialog dimensions
 */
export const modal = {
  /** Border radius */
  borderRadius: 16,
  /** Padding */
  padding: 20,
  /** Max width for mobile */
  maxWidth: 'calc(100vw - 32px)',
  /** Header height */
  headerHeight: 56,
} as const

/**
 * Typography scale for mobile
 */
export const typography = {
  /** Extra small - captions, badges */
  xs: { size: 11, lineHeight: 1.4 },
  /** Small - secondary text */
  sm: { size: 13, lineHeight: 1.5 },
  /** Base - body text */
  base: { size: 15, lineHeight: 1.6 },
  /** Medium - emphasized body */
  md: { size: 16, lineHeight: 1.5 },
  /** Large - subheadings */
  lg: { size: 18, lineHeight: 1.4 },
  /** Extra large - headings */
  xl: { size: 22, lineHeight: 1.3 },
  /** 2x large - page titles */
  '2xl': { size: 28, lineHeight: 1.2 },
} as const

/**
 * Animation durations
 */
export const animation = {
  /** Fast - micro interactions */
  fast: 150,
  /** Normal - standard transitions */
  normal: 200,
  /** Slow - emphasis animations */
  slow: 300,
  /** Very slow - page transitions */
  verySlow: 500,
} as const

/**
 * Z-index layers
 */
export const zIndex = {
  /** Behind content */
  behind: -1,
  /** Base level */
  base: 0,
  /** Floating elements (dropdowns) */
  dropdown: 10,
  /** Sticky elements */
  sticky: 20,
  /** Fixed navigation */
  fixed: 30,
  /** Overlays */
  overlay: 40,
  /** Modals */
  modal: 50,
  /** Toasts/Notifications */
  toast: 60,
  /** Tooltips */
  tooltip: 70,
} as const

/**
 * CSS custom properties for use in Tailwind/CSS
 */
export const cssVariables = `
  :root {
    /* Spacing */
    --spacing-xs: ${spacing.xs}px;
    --spacing-sm: ${spacing.sm}px;
    --spacing-md: ${spacing.md}px;
    --spacing-lg: ${spacing.lg}px;
    --spacing-xl: ${spacing.xl}px;
    --spacing-2xl: ${spacing['2xl']}px;
    --spacing-3xl: ${spacing['3xl']}px;

    /* Touch targets */
    --touch-sm: ${touchTarget.sm}px;
    --touch-md: ${touchTarget.md}px;
    --touch-min: ${touchTarget.min}px;
    --touch-lg: ${touchTarget.lg}px;
    --touch-xl: ${touchTarget.xl}px;

    /* Toggle */
    --toggle-track-width: ${toggle.track.width}px;
    --toggle-track-height: ${toggle.track.height}px;
    --toggle-thumb-size: ${toggle.thumb.size}px;

    /* Buttons */
    --button-sm-height: ${button.sm.height}px;
    --button-md-height: ${button.md.height}px;
    --button-lg-height: ${button.lg.height}px;

    /* Input */
    --input-height: ${input.height}px;
    --input-font-size: ${input.fontSize}px;

    /* Bottom nav */
    --bottom-nav-height: ${bottomNav.height}px;

    /* Animation */
    --animation-fast: ${animation.fast}ms;
    --animation-normal: ${animation.normal}ms;
    --animation-slow: ${animation.slow}ms;
  }
`

/**
 * Tailwind-compatible class generator
 */
export const mobileClasses = {
  /** Touch-friendly button base */
  touchButton: 'min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-transform',
  /** Icon button */
  iconButton: 'h-10 w-10 flex items-center justify-center rounded-full touch-manipulation',
  /** Card container */
  card: 'rounded-xl p-4 bg-card border border-border',
  /** Input field */
  input: 'h-11 text-base px-3 rounded-lg',
  /** Toggle switch track */
  toggleTrack: 'h-4 w-8 rounded-full',
  /** Toggle switch thumb */
  toggleThumb: 'h-2.5 w-2.5 rounded-full',
} as const

export default {
  spacing,
  touchTarget,
  iconSize,
  toggle,
  button,
  input,
  bottomNav,
  card,
  modal,
  typography,
  animation,
  zIndex,
  cssVariables,
  mobileClasses,
}
