# Changelog

All notable changes to Chameleon AI Chat are documented in this file.

This project is currently in **alpha stage** (v0.x). APIs and features may change.

---

## [0.8.0-alpha] - 2025-11-30

### Simple Mode Polish (2025-11-30)
- **Blocks-Style Chat Input** - Modern welcome screen input
  - Inspired by [blocks.so](https://github.com/ephraimduncan/blocks) by Ephraim Duncan
  - Expandable textarea with inline action buttons
  - Quick prompt pills for conversation starters
  - Delegates streaming to SimpleChatInput to avoid component unmount issues
  - Files: `components/blocks-chat-input.tsx`
- **Settings UI Enhancement** - Blocks-style visual selectors
  - Theme cards with color previews (replaces dropdown)
  - Language pills with flag icons
  - Text size buttons with visual differentiation
  - Performance mode toggle in styled card
  - Files: `components/simple-settings-dialog.tsx`
- **Switch Component Fixes** - Fixed toggle animation bugs
  - Thumb now properly animates when toggled on
  - Uses static Tailwind classes + inline styles for reliable sizing
  - Removed problematic React state management
  - 32x16px track, 10x10px thumb dimensions
  - Files: `components/ui/switch.tsx`
- **Chat Input Positioning** - Better mobile layout
  - Reduced vertical padding for closer-to-bottom positioning
  - Uses `env(safe-area-inset-bottom)` for proper mobile safe areas

### AI-Driven Web Search (2025-11-30)
- **Tool Calling Auto-Search** - AI decides when to search the web
  - Uses OpenRouter function calling with Grok 4.1 Fast and other supported models
  - AI autonomously triggers web_search tool when it detects need for current info
  - User toasts show when AI starts/completes search
  - Manual web search toggle still works for explicit control
  - Heuristics-based fallback for models without tool calling support
  - Files: `components/simple-chat-input.tsx`, `lib/tools.ts`, `app/api/chat/route.ts`

### MCP Integration (2025-11-30)
- **MCP Settings UI** - Full MCP server management for Advanced Mode
  - Mobile-responsive layout with WCAG touch targets (44px)
  - Import/Export functionality for server configurations
  - 22 preset MCP server templates (up from 12)
  - Category filtering (Development, Data, Productivity, AI, Communication, Other)
  - Serverless deployment notes in documentation
  - Files: `components/mcp-settings.tsx`, `docs/MCP_GUIDE.md`

### Removed Features
- **LM Studio Support Removed** - Not compatible with serverless deployment
  - Vercel/serverless environments cannot connect to local LM Studio
  - Removed: `lib/lmstudio.ts`, LMStudio types, settings UI
  - Use OpenRouter for model access instead

### Mobile Design System
- **Design Tokens** - Centralized design system for consistent mobile UI
  - 8px grid-based spacing system
  - Touch target sizes (44px minimum for accessibility)
  - Toggle/switch dimensions standardized
  - Button, input, and typography scales
  - Files: `lib/mobile-design-tokens.ts`
- **Mobile Components** - Touch-optimized component library
  - MobileButton, MobileIconButton with proper touch targets
  - MobileNavItem, MobileChip, MobileListItem
  - MobileSafeArea for notch/home indicator handling
  - Files: `components/ui/mobile-components.tsx`
- **Toggle Redesign** - Cleaner, smaller pill-slider toggles
  - Replaced bulky round toggles with slim pill design
  - 32x16px track with 10px thumb
  - Inline styles to force dimensions (CSS specificity fix)
  - Files: `components/ui/switch.tsx`

### ChatInput Refactoring Foundation
- **State Management** - useReducer pattern for ChatInput
  - Centralized state with predictable transitions
  - 15+ action types for all input operations
  - Memoized action creators for performance
  - Files: `hooks/use-chat-input-state.ts`
- **Voice Input Hook** - Extracted voice recording logic
  - OpenAI Whisper integration
  - Haptic feedback on voice events
  - Files: `hooks/use-voice-input.ts`

### Feature Cleanup
- **Removed Background Agents** - Deleted unused Chameleon Agents system
  - Weather and price tracking agents removed
  - Updated documentation to reflect removal
  - Deleted: `lib/background-agents.ts`, `components/background-agents-dialog.tsx`
- **Removed MCP** - Deleted non-functional MCP integration
  - 6 TODOs indicated incomplete implementation
  - Deleted: `lib/mcp-client.ts`, `components/mcp-manager.tsx`, `app/api/mcp/route.ts`
  - Removed MCP settings tab

### Bug Fixes
- **Settings Sync Race Condition** - Fixed stale state overwrites
  - Only sync settings when dialog opens, not continuously
  - Prevents losing user settings on fast interactions
  - Files: `components/settings-dialog.tsx`
- **Server Icon Import** - Fixed crash after LM Studio settings access
  - Restored missing lucide-react Server icon import
- **Mobile UI Consistency** - Multiple fixes for mobile layout
  - Switch toggle sizing and centering
  - Header button sizes
  - Tab and nav bar consistency
  - Chat bubble overflow and text clipping
  - Sidebar chat bubble fixed widths

### Web Search Improvements
- **OpenRouter Tool Calling** - Automatic web search integration
  - Tool calling support for November 2025 models
  - Files: `lib/chat-service.ts`

### UI Modernization
- **Glassmorphism Layout** - 2024/2025 UI trends
  - Modern glass-effect styling
  - Improved visual hierarchy
  - Enhanced mobile aesthetics

### PWA Stability
- **Service Worker Fixes** - Improved caching and navigation
  - Network-first navigation with cache fallback
  - Proper handling of redirected responses
  - Skip root navigation in SW to avoid redirect issues
  - Fix 'page not available' after login
- **Aggressive Precaching** - Faster app loading
  - Fixed Android resume issue
- **Chat Action Buttons** - Always visible on touch devices
  - Removed hover-only logic for mobile accessibility

### Memory System Improvements
- **Database Sync** - Cloud sync for memories
  - Toggle to sync memories to Supabase database
  - Privacy controls for sensitive data
  - Files: `lib/memory-service.ts`

### Sidebar Improvements
- **Fixed Width Layout** - Consistent 300px sidebar
  - Prevents narrowing on medium screens
  - Proper right padding for hover buttons
- **Chat Preview** - Fixed text truncation issues
  - Rebuilt chat items component
  - Button positioning improvements
  - Delete dialog width fixes

### Performance Optimization
- **GPU Usage Reduction** - From 70% to ~20-30%
  - Disabled expensive visual effects
  - Optimized infinite CSS animations
  - Mermaid diagram rendering fixes (prevented 99% GPU usage)
  - Chat message rendering optimization
- **Ultra Performance Mode** - Toggle in experimental settings
  - Additional GPU optimizations for low-end devices
- **Simple Mode Optimization** - Reduced useEffect hooks from 9 to 4

### New Features (2025-11-27/28)
- **LM Studio Support** - Local model support for desktop
  - Connect to local LM Studio instance
  - Privacy-focused local inference
- **Verbalized Sampling** - VS slash commands /1 /2 /3 /4
  - Probability-based response generation
  - Updated persona prompts to probability templates
- **Rich Content Support** - Enhanced content rendering
  - Visual animations and effects
  - Improved layout and font handling
- **Font Family Choices** - Roboto and accessibility fonts
  - Better readability options
- **Memory Export/Import** - Backup and restore memories
  - Debug logging for memory system
  - Toast notifications for memory saves

### Dialog & UI Fixes
- **Dialog Backgrounds** - Force 100% opaque dialogs
  - Remove all transparency issues
  - Proper overlay darkness
  - Z-index fixes
- **Sidebar Transitions** - Improved visual quality
  - Better sidebar-to-main transitions
  - Chat title truncation fixes

### Commits (2025-11-30)
- `dbf9bbc` fix: Add Server icon back to imports (used in LM Studio settings)
- `e4940fa` feat: Add mobile design system and ChatInput refactoring foundation
- `ce0d700` fix: Remove broken MCP feature and fix settings sync race condition

### Commits (2025-11-29)
- `6db81f1` feat: Remove background agents feature and update documentation
- `62abc1e` fix: Force switch dimensions with inline styles
- `a1535f2` fix: Make toggle switches even smaller and more pill-shaped
- `b567492` feat: Redesign toggles as smaller, cleaner pill sliders
- `d3d4c01` Merge pull request #129 from robbyczgw-cla/claude/fix-mobile-ui-bugs
- `3135096` fix: Smaller, properly centered switch toggle
- `4497f87` Merge pull request #128 from robbyczgw-cla/claude/fix-mobile-ui-bugs
- `515692f` fix: Improve mobile UI consistency - switches, tabs, and nav bar
- `a4f5b8a` Merge pull request #127 from robbyczgw-cla/claude/optimize-pwa-performance
- `8958d50` fix: Adjust Switch toggle size and header button sizes
- `c962e92` Merge pull request #126 from robbyczgw-cla/claude/optimize-pwa-performance
- `52616c1` fix: Fix toggle button sizing and switch thumb clipping
- `96385f2` fix: Make mobile toggle buttons compact and consistent with nav bar
- `a2cf7ad` Merge pull request #125 from robbyczgw-cla/claude/optimize-pwa-performance
- `1f0c1c2` fix: Update tool calling support for November 2025 models
- `9c9d97d` feat: Add automatic web search with OpenRouter tool calling
- `d5d40e8` Merge pull request #124 from robbyczgw-cla/claude/optimize-pwa-performance
- `1722911` fix: Fix sidebar chat bubble overflow with fixed pixel widths
- `f167954` Merge pull request #123 from robbyczgw-cla/claude/optimize-pwa-performance
- `a84bd55` fix: Fix chat bubble overflow and text clipping issues
- `8c833d8` Merge pull request #122 from robbyczgw-cla/claude/optimize-pwa-performance
- `d9d921c` fix: Make chat action buttons always visible (removed hover-only logic)
- `e787400` Merge pull request #121 from robbyczgw-cla/claude/optimize-pwa-performance
- `ada72a5` fix: UI fixes for mobile bottom nav, sidebar buttons, and chat actions
- `731ad50` fix: Simplify to network-first navigation with cache fallback only
- `2067886` fix: Skip root navigation in SW to avoid redirect issues
- `4fa201e` fix: Properly handle redirected responses in service worker
- `1053fbe` fix: Fix 'page not available' after login by handling redirects properly
- `31a054a` feat: Modernize mobile layout with glassmorphism and 2024/2025 UI trends
- `fb55018` Merge pull request #120 from robbyczgw-cla/claude/optimize-pwa-performance
- `a7956f0` feat: Optimize PWA with aggressive precaching and fix Android resume issue

### Commits (2025-11-28)
- `8e6bac1` Merge pull request #119 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `63ef489` fix: Sidebar inline buttons and memory JSON parsing
- `b6d7d6a` Merge pull request #118 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `bac397d` feat: Implement database sync for memories
- `d7c056e` feat: Add database sync toggle for memories with privacy controls
- `63461aa` fix: Rebuild sidebar chat items from scratch
- `7a9430e` Merge pull request #117 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `7175954` fix: Sidebar inline buttons and memory JSON parsing
- `0629db4` Merge pull request #116 from robbyczgw-cla/fix/sidebar-chat-preview
- `4f3aa0e` fix: sidebar chat preview text cutoff
- `42bc30e` Merge pull request #115 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `b8a2fae` fix: Sidebar button positioning and delete dialog width
- `747a6a2` Merge pull request #114 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `4169381` fix: Set consistent sidebar width of 300px (was getting narrower on md screens)
- `a114f50` Merge pull request #113 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `4aa4265` fix: Add proper right padding to sidebar chat items for hover buttons
- `4f5c01c` fix: Comprehensive UI fixes for sidebar and dialogs
- `b22027a` fix: Use sm:max-w-4xl to properly override dialog base width
- `df426ab` fix: Use valid Tailwind classes and add z-index to dialogs
- `7a2cfbc` Merge pull request #112 from robbyczgw-cla/claude/fix-sidebar-text-truncation
- `1362b15` fix: Improve UI layout for sidebar, Document Collections and Background Agents dialogs
- `5dd9205` Merge pull request #111 from robbyczgw-cla/claude/fix-mobile-bubble-cutoff
- `a57c39d` feat: Add Background Agents button to Advanced Mode UI
- `c917b9a` feat: Add Background Agents System for autonomous tasks
- `7e8c237` feat: Add Chameleon Agent persona for advanced mode
- `d0a2616` Merge pull request #110 from robbyczgw-cla/claude/fix-mobile-bubble-cutoff
- `7a81d97` fix: Add comprehensive debug logging and import/export to memory system
- `aa2125a` feat: Add toast notifications for memory saves and adjust sidebar padding
- `70d335a` Merge pull request #109 from robbyczgw-cla/claude/fix-mobile-bubble-cutoff
- `3ed1dd9` fix: Sync memory service settings with app context
- `8c7ffd8` fix: Increase right padding on mobile chat items to prevent text cutoff
- `1e81d04` Merge pull request #108 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `301565a` feat: Add memory export/import functionality
- `a0dad6f` feat: Add automatic LLM-based memory extraction
- `35f033a` feat: Add LM Studio local model support (desktop only)

### Commits (2025-11-27)
- `c4c8df5` fix: Mobile message cutoff - remove overflow-hidden and increase max-width
- `2760f4a` Merge pull request #107 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `34d5908` feat: Add Verbalized Sampling (VS) slash commands /1 /2 /3 /4
- `6ec3a3f` feat: Update default persona prompts to probability templates
- `d7b56b4` Merge pull request #106 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `f2bb479` fix: Make sidebar chat bubbles more compact on mobile
- `5bdd397` Merge pull request #105 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `ef0dcc3` fix: Sidebar chat bubbles and persona prompts mobile grid
- `d4c08d4` Merge pull request #104 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `4bb7257` perf: Disable ALL remaining infinite CSS animations and GPU-forcing hints
- `8184388` Merge pull request #103 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `815e0f3` perf: Optimize chat message rendering to reduce GPU usage
- `4af6f05` perf: Disable infinite SVG animations and optimize MutationObserver
- `acfbe2f` Merge pull request #102 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `97fefd2` perf: Major GPU optimization - disable expensive visual effects
- `3ac83d4` Merge pull request #101 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `8410914` fix: Optimize Mermaid diagram rendering to prevent 99% GPU usage
- `8cef5e6` fix: Simplify sidebar styling to prevent chat bubble cutoff
- `2e17254` Merge pull request #100 from robbyczgw-cla/claude/fix-ui-transparency-bubbles
- `df79447` fix: Ensure dialogs have solid backgrounds and fix sidebar bubble cutoff
- `b69f004` Merge pull request #99 from robbyczgw-cla/claude/revert-react-changes
- `15d10f6` fix: Force dialogs to be 100% opaque - remove all transparency
- `34fa57f` fix: Reduce sidebar chat bubble padding to prevent cutoff
- `c1367bf` Merge pull request #98 from robbyczgw-cla/claude/revert-react-changes
- `b557fb9` fix: Fix dialog overlay darkness and sidebar chat bubble sizing
- `73fd259` Merge pull request #97 from robbyczgw-cla/claude/revert-react-changes
- `03a9c2f` feat: Add Ultra Performance Mode toggle in experimental settings
- `e63bb6e` fix: Fix dialog overlay darkness and sidebar chat bubble sizing
- `d84d60d` Merge pull request #96 from robbyczgw-cla/claude/revert-react-changes
- `4566b39` perf: Optimize simple-chat-input - reduce useEffect hooks from 9 to 4
- `8943781` fix: Improve sidebar-to-main transition visual quality
- `76151ea` Merge pull request #95 from robbyczgw-cla/claude/revert-react-changes
- `cdc923d` perf: Additional GPU optimization - disable non-essential infinite animations
- `e56d17b` fix: Fix sidebar-to-main transition and chat title truncation
- `f92627e` Merge pull request #94 from robbyczgw-cla/claude/revert-react-changes
- `0c5750b` perf: Optimize GPU usage - reduce from 70% to ~20-30%
- `29ecb55` fix: Fix user bubble text color and settings dialog loading issues
- `d9d937f` Merge pull request #93 from robbyczgw-cla/claude/revert-react-changes
- `7a5351c` fix: Suppress Mermaid error bombs and clean up error divs
- `2a60267` feat: Add stunning visual animations and effects
- `cc0dc6f` Merge pull request #92 from robbyczgw-cla/claude/revert-react-changes
- `50975ce` chore: Update pnpm-lock.yaml for new dependencies
- `e6356cb` feat: Add rich content support and fix layout/font issues
- `efdf01f` Merge pull request #91 from robbyczgw-cla/claude/revert-react-changes
- `ef86c04` chore: Remove React Native mobile app and shared package
- `2d8edd8` Merge pull request #90 from robbyczgw-cla/claude/brainstorm-features
- `9f2605f` docs: Add React Native Android development guide in German
- `ae33156` chore: Add .gitignore to shared package
- `d56b7ab` chore: Update pnpm-lock.yaml for monorepo workspaces
- `b9401fe` feat: Add React Native mobile app foundation with monorepo structure
- `5380827` feat: Add font family choices with Roboto and accessibility fonts
- `081a34b` docs: Add comprehensive features roadmap
- `ad03341` docs: Highlight intelligent categorized follow-up system as headline feature
- `ff01547` Merge pull request #89 from robbyczgw-cla/claude/enhance-tamagotchi-features

---

## [0.7.0-alpha] - 2025-11-26

### Message Editing & Content Management
- **Message Editing** - Edit your sent messages with inline editor
  - Click edit icon on any user message
  - AI automatically re-generates response after edit
  - Save/Cancel buttons for confirmation
- **Draft Auto-Save** - Never lose your work
  - Auto-saves to localStorage every 500ms
  - Per-chat drafts with 24-hour expiry
  - Automatic restoration when returning to chat
  - Files: `hooks/use-draft.ts`

### Search & Discovery
- **Full-Text Search** - Search all chat content, not just titles
  - Inverted index for O(1) lookups (1-5ms vs 50-200ms)
  - Real-time results as you type
  - Relevance scoring (titles rank higher)
  - Minimum 3 characters to trigger
  - Files: `lib/search-service.ts`, `components/chat-sidebar.tsx`

### AI-Powered Features
- **Smart Chat Titles** - AI generates concise titles from first message
  - Uses `openai/gpt-oss-20b` (privacy-focused open-source model)
  - 2-6 word titles, no quotes or trailing punctuation
  - Background generation (non-blocking)
  - Fallback to truncated message on failure
  - Files: `lib/title-generator.ts`
- **Title Animation** - Subtle slide-in effect when title appears
  - GPU-friendly CSS animation (no JS loops)
  - Primary color highlight that fades
  - Respects `prefers-reduced-motion`
  - 1.2s duration with smooth easing

### PWA Stability
- **Image Compression** - Auto-compress uploads to prevent crashes
  - Max 1920x1080, 80% quality
  - WebP format with JPEG fallback
  - ~90% size reduction for large images
  - Skip compression for small images (<100KB) and SVGs
  - Files: `lib/file-handler.ts`
- **Memory Optimization** - Strip historical images from API requests
  - Prevents memory accumulation in long conversations
  - Placeholder text: "[Previous image was shared here]"
  - Critical for PWA stability
  - Files: `lib/multimodal-utils.ts`
- **Touch Device Fix** - Action buttons visible on iPad/tablets
  - Uses `@media(hover:hover)` instead of screen width
  - Works on all touch-enabled devices

### Bug Fixes
- Fixed `[object Object]` bug for image conversation titles
- Fixed context compression model (now uses `grok-4.1-fast`)
- Removed missing UI component dependencies

### Commits (2025-11-26)
- `fcf1695` feat: Add persona starter prompts to Advanced Mode empty state
- `bcd20fe` Merge pull request #88 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `30d8ef6` docs: Rewrite CHANGELOG.md with proper versioning (0.1-0.7 alpha)
- `7851be0` docs: Add comprehensive documentation for v2.5 features
- `ff85944` fix: Prevent PWA crashes by stripping historical image data from API requests
- `265af1c` Merge pull request #87 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `4ac763d` feat: Add lightweight animation for AI-generated chat titles
- `c0782b8` fix: Switch title generator to openai/gpt-4.1-nano
- `70e0cf9` feat: AI-powered chat title generation
- `2a192cb` fix: Compress images to prevent PWA crashes
- `119eff2` fix: Show proper chat title for image conversations
- `4b7f546` Merge pull request #86 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `edf6362` fix: Show message action buttons on touch devices (iPad)
- `b4f65b7` Merge pull request #85 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `a9d1f90` feat: Add message editing, full-text search, and draft auto-save
- `27d6e98` Merge pull request #84 from robbyczgw-cla/claude/enhance-tamagotchi-features
- `9ea060c` fix: Use grok-4.1-fast instead of gpt-4o-mini for context compression
- `6447918` fix: Remove missing UI component dependencies from context-window-meter
- `60f81a8` feat: Add Context Window Meter, Auto-Compression, and fix pricing
- `f1aa4e0` feat: Add optional pet modes and LLM integration, persona prompts in advanced mode
- `0215d38` feat: Transform pet companion into full Tamagotchi experience
- `87dad36` Merge pull request #83 from robbyczgw-cla/claude/fix-simpl-feature
- `bdd2eec` feat: Add Performance Mode toggle for GPU optimization
- `6576c4e` fix: Add persona-specific questions and fix question click handler
- `ae8b71c` Merge pull request #82 from robbyczgw-cla/claude/fix-simpl-feature
- `a7aac78` fix: Simplify pet companion dialog to match working settings pattern
- `e80d4b1` Merge pull request #81 from robbyczgw-cla/claude/fix-simpl-feature
- `038ffe7` fix: Improve Simple Mode layout with proper flex constraints and wider dialogs
- `4fc1e34` Merge pull request #80 from robbyczgw-cla/claude/fix-simpl-feature
- `57d6f5d` fix: Remove duplicate reduced-motion CSS that was overriding main's version
- `2fbe008` Merge pull request #79 from robbyczgw-cla/claude/fix-simpl-feature
- `2b68fc7` Merge main: resolve dialog width conflicts
- `252ee81` fix: Dialog layouts and reduced-motion GPU fallback
- `8b10485` Merge pull request #76 from robbyczgw-cla/codex/fix-layout-issues-in-simple-chat-app
- `987cdfa` Fix simple mode layout and dialog sizing
- `461a446` Merge pull request #75 from robbyczgw-cla/claude/fix-simpl-feature
- `f651cd9` Revert "fix: Remove GPU-intensive CSS effects for performance"
- `d6cba4e` Merge pull request #74 from robbyczgw-cla/claude/fix-simpl-feature
- `32768b4` fix: Remove GPU-intensive CSS effects for performance
- `181ce3e` Merge pull request #73 from robbyczgw-cla/claude/fix-simpl-feature
- `19c7603` fix: Simple Mode sidebar - add shrink-0 and proper height handling
- `118a40a` Merge pull request #72 from robbyczgw-cla/claude/fix-simpl-feature
- `f68c6bd` fix: Reset inset values on desktop for proper flex layout
- `f52b189` fix: Move sidebar width to wrapper div for proper flex layout
- `d6a9e57` Revert: Restore CSS blur effects for visual design
- `c6bbbe4` Merge pull request #71 from robbyczgw-cla/claude/fix-simpl-feature
- `b26b7b8` fix: Remove all CSS blur filters for GPU performance
- `f70fa0b` fix: Match Simple Mode sidebar layout to Advanced Mode pattern
- `8a905b4` Merge pull request #70 from robbyczgw-cla/claude/fix-simpl-feature
- `e300135` fix: Simplify dialog styling to use default Radix dialog width
- `c1eadce` Merge pull request #69 from robbyczgw-cla/claude/fix-simpl-feature
- `77acac3` fix: Remove GPU-intensive effects and fix Simple Mode layout
- `ebad710` Merge pull request #68 from robbyczgw-cla/claude/fix-desktop-simple-mode-ui
- `ec89937` fix: Fix dialog width collapse by using inner wrapper for flex layout
- `b86908f` Merge pull request #67 from robbyczgw-cla/claude/fix-desktop-simple-mode-ui
- `2b904bb` fix: Fix desktop Simple Mode layout and significantly reduce GPU usage
- `d12e0e5` Merge pull request #66 from robbyczgw-cla/claude/fix-desktop-simple-mode-ui
- `b58cd5f` fix: Fix desktop Simple Mode layout and reduce CPU usage
- `584a2ee` Merge pull request #65 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `5b7e8f8` feat: Replace quick start with persona-based tips in Simple Mode
- `230d20c` fix: Remove streaks, improve desktop layout, add achievements to settings
- `d9a528b` Merge pull request #64 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `bc8fb5f` fix: Major UI fixes for Simple Mode on desktop and mobile
- `17f8ca6` Merge pull request #63 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `945dd82` fix: Skip Simple Mode onboarding for existing users switching modes
- `5be87a6` Merge pull request #62 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `0348423` fix: Hide mode selection dialog when existing user is detected later
- `24e89fe` Merge pull request #61 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `dee96a9` fix: Improve user detection and fix dialog rendering
- `7271ac6` Merge pull request #60 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `ef64f1b` fix: Fix mode selection for existing users and rendering issues
- `d1e04c2` Merge pull request #59 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `4f72eef` fix: Use sr-only class instead of @radix-ui/react-visually-hidden
- `6927bcc` fix: Fix mode selection dialog not rendering properly on desktop
- `8ee0ea4` Merge pull request #58 from robbyczgw-cla/claude/add-simple-mode-onboarding
- `e3cb654` feat: Add database schema for Simple Mode gamification
- `c49a0be` feat: Add Simple Mode gamification features
- `8f6556b` feat: Expand Simple Mode onboarding with rich profile options
- `a4642e0` feat: Add mode selection dialog for first-time users
- `8afda45` feat: Add Simple Mode onboarding wizard and icons to Advanced settings
- `c26009b` Merge pull request #57 from robbyczgw-cla/claude/pwa-features-performance
- `913a942` feat: Enhance Simple Mode with translations, chat deletion, and image creation
- `6bb1b2e` Merge pull request #56 from robbyczgw-cla/claude/pwa-features-performance
- `928419a` fix: Add Grok 4.1 and update vision model detection

---

## [0.6.0-alpha] - 2025-11-24

### Context Window Management
- **Context Window Meter** - Visual indicator of token usage
  - Shows current/max tokens for selected model
  - Color-coded warnings (green/yellow/red)
  - Compact mode for input area
  - Files: `components/context-window-meter.tsx`
- **Auto-Compression** - Automatic context summarization
  - Triggers at 80% context usage
  - Uses fast model for compression
  - Preserves conversation flow

### Pet Companion System
- **Tamagotchi Experience** - Interactive pet companion
  - Multiple pet types (Cat, Dog, Dragon, Robot, etc.)
  - Mood system based on chat activity
  - Stats: Happiness, Energy, Friendship
  - LLM integration for pet responses
  - Files: `components/pet-companion.tsx`, `lib/pet-system.ts`
- **Pet Modes** - Optional integration levels
  - Observer mode (watches silently)
  - Reactive mode (occasional comments)
  - Active mode (participates in chat)

### Performance
- **Performance Mode Toggle** - GPU optimization settings
  - Reduces animations for lower-end devices
  - Disables blur effects when enabled

---

## [0.5.0-alpha] - 2025-11-20

### Simple Mode
- **Simple Mode** - Cleaner, persona-focused experience
  - Simplified UI for casual users
  - Persona-based tips instead of feature overload
  - Streamlined settings dialog
  - Files: `components/simple-chat-app.tsx`, `components/simple-chat-input.tsx`
- **Mode Selection** - First-time user dialog
  - Choose between Simple and Advanced mode
  - Skip for existing users
  - Persistent preference

### Gamification (Simple Mode)
- **Achievements System** - Unlock badges for milestones
  - First chat, streak days, message counts
  - Visual achievement cards
- **Streaks** - Track daily chat activity
- **Quick Start Personas** - Curated persona suggestions

### Voice Features
- **OpenAI TTS** - High-quality text-to-speech
  - 6 premium voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
  - Speed and voice selection
  - Files: `lib/openai-tts.ts`
- **Browser TTS Fallback** - Free alternative
  - 30+ system voices
  - Voice testing in settings
- **Whisper Integration** - Voice input transcription
  - OpenAI Whisper API
  - Microphone permission handling
  - Files: `lib/voice.ts`

### PWA Enhancements
- **Native-Feel PWA** - Touch optimizations
  - Haptic feedback on interactions
  - GPU acceleration
  - Smooth animations
  - Files: `lib/haptics.ts`
- **Microphone Permissions** - Better handling
  - Permission tester in settings
  - CSP headers for audio

### Internationalization
- **Image Generation** - DALL-E integration in Simple Mode
- **Chat Deletion** - Per-chat delete in Simple Mode
- **Web Search Settings** - Configure in Simple Mode

### Commits (2025-11-25)
- `a90f63a` feat: Add web search settings to Simple Mode
- `026d158` feat: Add Simple Mode for cleaner, persona-focused experience
- `3abbcd6` fix: Add timeout handling to TTS to prevent 504 gateway errors
- `9287100` Merge pull request #55 from robbyczgw-cla/claude/pwa-features-performance
- `066396c` docs: Update documentation with new features and optimizations
- `f4fa20a` fix: Add media-src blob: to CSP for TTS audio playback
- `04bc2e8` fix: Add api.openai.com to CSP connect-src for TTS
- `f09f9c3` fix: Improve OpenAI TTS error handling and response validation
- `1a99801` feat: Add OpenAI TTS for high-quality voice output
- `3351f5d` feat: Improve voice selection with more voices and test button
- `f51f230` perf: Optimize React performance and improve mobile UX
- `ff6a996` Merge pull request #54 from robbyczgw-cla/claude/pwa-features-performance
- `60fca58` fix: Properly convert audio blob to File with correct MIME type for Whisper API
- `2c11f9c` fix: Show more detailed error messages for Whisper transcription failures
- `4f1569c` fix: Correct audio format handling for Whisper transcription
- `4132bbc` Merge pull request #53 from robbyczgw-cla/claude/pwa-features-performance
- `e66427d` fix: Allow microphone and camera in Permissions-Policy header
- `7eb19a6` Merge pull request #52 from robbyczgw-cla/claude/pwa-features-performance
- `1e2c4f1` fix: Always trigger getUserMedia to show permission prompt
- `fb86461` feat: Add microphone permission tester in Voice settings
- `16e3f8e` Merge pull request #51 from robbyczgw-cla/claude/pwa-features-performance
- `f629d26` feat: Add native-feel PWA performance optimizations
- `271464d` Merge pull request #50 from robbyczgw-cla/claude/integrate-exa-search
- `21f02cc` fix: Improve search image rendering in chat
- `0bec497` feat: Add split contexts and fix Exa images toggle
- `37b06d2` refactor: Add unified search service and organize lib folder structure
- `a9a4991` Merge pull request #49 from robbyczgw-cla/claude/integrate-exa-search
- `1aa767f` feat: Add direct Exa Search integration with full configuration
- `4ec8527` Merge pull request #48 from robbyczgw-cla/claude/fix-default-model-bug
- `a159873` fix: Prevent newly added models from becoming default for new chats

### Commits (2025-11-24)
- `841c9f6` Merge pull request #46 from robbyczgw-cla/claude/merge-architecture-files
- `da122b4` docs: Merge duplicate architecture files into single ARCHITECTURE.md

---

## [0.4.0-alpha] - 2025-11-21

### UI Refresh
- **Paper-Mint Theme** - New default theme
  - Soft, readable color palette
  - Improved contrast ratios
- **Neo Blueprint Theme** - Alternative dark theme
  - Technical aesthetic
  - High contrast
- **Modern Shell** - Updated chrome
  - Blended sidebar
  - Tighter spacing
  - Bridge elements

### Persona Expansion
- **5 New Personas**
  - Pixel (retro game dev)
  - Chef Marco (Italian cuisine)
  - Zen (meditation guide)
  - Startup Sam (entrepreneur)
  - Aria (songwriter)
- **Translations** - All personas in DE/EN/ES

### Model Updates
- **Grok 4.1 Support** - New default model
  - `grok-4.1-fast` as default
  - Vision model detection
  - Reasoning toggle support
- **Reasoning Display** - Collapsible thinking sections
  - Shows model's reasoning process
  - Toggle in chat input

### Bug Fixes
- Fixed reasoning format for OpenRouter
- Fixed cost tracker pricing (per 1M tokens)
- Reduced verbose console logging

### Commits (2025-11-23)
- `dded9fc` Merge pull request #45 from robbyczgw-cla/claude/fix-mobile-bottom-bar
- `569faa0` fix: Standardize mobile bottom bar colors and remove unused themes
- `f1c20d9` Merge pull request #44 from robbyczgw-cla/feature/cosmic-glass-theme
- `04f90c7` feat: Refine Cosmic Glass contrast and add Modern Light theme
- `5b44aef` fix: Resolve login screen layout issues on desktop
- `187fdeb` feat: Implement Cosmic Glass theme and UI polish
- `2b91aed` Merge pull request #43 from robbyczgw-cla/claude/fix-mobile-chat-ui
- `565fabc` fix: make modern-shell background adapt to dark mode
- `a9f65c5` fix: make mobile bottom nav respect theme colors
- `64d41a7` fix: slim down chat input and fix user bubble width
- `06a6296` fix: user bubbles now shrink to fit text, reduce bottom padding
- `48957ac` fix: reduce bottom bar gap and make user bubbles fit text
- `f081853` fix: improve mobile chat UI spacing and bottom bar sizing
- `ef0152b` Merge pull request #42 from robbyczgw-cla/claude/modernize-chat-ui
- `6aa823d` chore: simplify input placeholder
- `d80b352` Merge pull request #41 from robbyczgw-cla/claude/modernize-chat-ui
- `faed7ea` fix: mobile header toggles now show active state
- `dab6dbd` Merge pull request #40 from robbyczgw-cla/claude/modernize-chat-ui
- `be363fb` feat: move voice/image/reasoning toggles to mobile header
- `ca10395` Merge pull request #39 from robbyczgw-cla/claude/modernize-chat-ui
- `eeacb09` fix: sidebar chat history scrolling on mobile
- `856d512` fix: cleaner mobile input - toggles in toolbar, user bubble sizing
- `88577c3` Merge pull request #38 from robbyczgw-cla/claude/modernize-chat-ui
- `61a2967` feat: compact mobile UI with all toggles visible
- `dbd96e4` fix: hide raw FOLLOWUP JSON from chat while preserving follow-up bubbles

### Commits (2025-11-22)
- `0f9539b` Merge pull request #37 from robbyczgw-cla/claude/modernize-chat-ui
- `0a96159` feat: cleaner mobile input and bottom nav improvements
- `603c94b` Merge pull request #36 from robbyczgw-cla/claude/modernize-chat-ui
- `d6a5ebb` feat: UI cleanup and mobile input improvements
- `df88e63` Merge pull request #35 from robbyczgw-cla/claude/modernize-chat-ui
- `67c9a22` feat: improved bottom nav layout + Clean Slate theme
- `ba33e05` feat: comprehensive UI polish and design system improvements
- `386743e` feat: floating glass dock nav + Midnight Hologram theme
- `18edf30` feat: major UI/UX improvements for modern chat experience
- `678543e` Merge pull request #34 from robbyczgw-cla/claude/modernize-chat-ui
- `4d11b1c` feat: replace ugly theme with Aurora - northern lights theme
- `7db80fa` feat: add enhanced styling for Modern Minimal theme
- `047cc3b` feat: add Modern Minimal theme with clean dark UI
- `ba12bfd` Merge pull request #33 from robbyczgw-cla/claude/modern-loading-mobile-ui
- `14dedaf` feat: modern AI loading animation and mobile UI improvements
- `25f879e` Merge pull request #32 from robbyczgw-cla/codex/refactor-bottom-bar-and-settings-menu
- `0201786` Adjust mobile navigation actions

### Commits (2025-11-21)
- `1f4f2bc` Merge branch 'feat/modern-ui-refresh'
- `4e8eca1` feat: replace blueprint with paper-mint theme
- `0780d9a` style: improve blueprint readability
- `8554001` feat: add neo blueprint theme
- `bfd093e` Merge pull request #31 from robbyczgw-cla/feat/modern-ui-refresh
- `6e08cb3` style: remove sidebar spacing
- `ac9e13a` Merge pull request #30 from robbyczgw-cla/feat/modern-ui-refresh
- `434ca60` style: tighten gap and improve sidebar contrast
- `bd743fb` style: add stronger sidebar bridge
- `66dbe80` style: blend sidebar into main shell
- `2176e00` style: modernize shell visuals

### Commits (2025-11-20)
- `a95d4da` Merge pull request #29 from robbyczgw-cla/claude/fix-pwa-api-keys
- `04df93a` fix: Add translations for all persona descriptions (DE/EN/ES)
- `96bb52c` Merge pull request #28 from robbyczgw-cla/claude/fix-pwa-api-keys
- `4919ad3` feat: Add 5 new creative personas (Pixel, Chef Marco, Zen, Startup Sam, Aria)
- `5802366` Merge pull request #27 from robbyczgw-cla/claude/fix-pwa-api-keys
- `cce4110` chore: Reduce verbose logging in updateSettings to clean up console
- `ae981c2` chore: Remove debug logging from stream handler
- `be9f7b7` debug: Add logging to trace reasoning field in stream response
- `a1a8fe9` Merge pull request #26 from robbyczgw-cla/claude/fix-pwa-api-keys
- `f2a5301` fix: Handle reasoning_details array format from OpenRouter
- `5cef9b8` fix: Use medium effort for reasoning instead of high
- `a2da348` fix: Use correct OpenRouter reasoning format { effort: 'high' }
- `d05d045` fix: Check multiple field names for reasoning content in stream
- `f54b6fd` Merge pull request #25 from robbyczgw-cla/claude/fix-pwa-api-keys
- `3757a29` feat: Add collapsible reasoning display to chat messages
- `623c4d6` Merge pull request #24 from robbyczgw-cla/claude/fix-pwa-api-keys
- `806ac81` fix: Add reasoning toggle to main chat-input + remove 2M Context from name
- `0fb267f` Merge pull request #23 from robbyczgw-cla/claude/fix-pwa-api-keys
- `c8a0e3b` fix: Update cost-tracker pricing to per 1M tokens (OpenRouter standard)
- `0b23177` fix: Update all default model references to grok-4.1-fast
- `88f0cb5` fix: Update DEFAULT_MODEL to grok-4.1-fast in model-preferences
- `62885a9` Merge pull request #22 from robbyczgw-cla/claude/fix-pwa-api-keys
- `daafe70` fix: Add fallback default model and debug logging for reasoning toggle
- `79617f2` Merge pull request #21 from robbyczgw-cla/claude/fix-pwa-api-keys
- `6f82f8d` feat: Add Grok 4.1 Fast as default + reasoning toggle

### Commits (2025-11-19)
- `61be8e9` Merge pull request #20 from robbyczgw-cla/claude/fix-pwa-api-keys
- `622deb0` feat: Add mobile-friendly UI for Model Comparison mode
- `248bef5` Merge pull request #19 from robbyczgw-cla/claude/fix-pwa-api-keys
- `616a717` feat: Convert AI Memory Hub to i18n translation system
- `74af5dc` Merge pull request #18 from robbyczgw-cla/claude/fix-pwa-api-keys

---

## [0.3.0-alpha] - 2025-11-10

### Memory System
- **AI Memory** - Long-term context persistence
  - Store preferences, facts, skills, goals
  - Automatic extraction from conversations
  - Importance scoring (1-3)
  - Relevance-based retrieval
  - Files: `lib/memory-service.ts`
- **Memory Hub** - Management interface
  - View, edit, delete memories
  - Category filtering
  - i18n translations

### Discussion Mode
- **AI Discussion** - Multi-model debates (renamed from Debate)
  - Choose 2 models to discuss topics
  - 2-5 round conversations
  - Real-time streaming
  - Vote for winner
  - Mobile-friendly UI

### Model Comparison
- **Side-by-Side** - Compare model responses
  - Same prompt to multiple models
  - Visual comparison
  - Mobile navigation

### Security & Stability
- **API Key Protection** - Critical fixes
  - Prevent keys from being cleared
  - Bulletproof updateSettings
  - PWA mode protection
  - Files: `contexts/app-context.tsx`
- **Search Provider Visibility** - Show which API is used

---

## [0.2.0-alpha] - 2025-11-05

### PWA & Mobile
- **Mobile-First UI** - WhatsApp-style experience
  - Bottom navigation (5 buttons)
  - Settings in mobile nav
  - Compact layout
- **PWA Icons** - Chameleon logo branding
- **Glassmorphism UI** - Premium visual effects
  - Backdrop blur
  - Smooth animations
  - Modern aesthetics

### Security
- **Content Security Policy** - HTTP headers
  - Strict CSP rules
  - Rate limiting preparation
- **Supabase Integration** - NULL value handling
  - Prevent key overwrites
  - Proper merge logic

### Bug Fixes
- Fixed personas and default system prompt
- Fixed FOLLOWUP format parsing
- Translated German UI text to English
- Fixed login page layout
- Fixed footer link accessibility

---

## [0.1.0-alpha] - 2025-11-01

### Initial Release
- **Core Chat** - Basic chat functionality
  - Message streaming
  - OpenRouter integration
  - Multiple model support
- **Personas** - 18+ AI personalities
  - Cami, Nova, Dev, Professor, etc.
  - Unique system prompts
  - Communication styles
- **Cost Tracking** - LLM spending analytics
  - Per-model breakdown
  - Token counting
  - Monthly projections
- **Training Data Export** - JSONL/JSON export
  - Fine-tuning format
  - Conversation selection
- **Web Search** - Tavily & Serper integration
  - Real-time search
  - Citation support
- **File Upload** - Document handling
  - Text, image, PDF support
  - Drag & drop
- **Authentication** - Supabase auth
  - Email/password
  - Profile system
- **Themes** - Dark/Light mode
- **Languages** - DE/EN/ES support

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.8.0-alpha | 2025-11-30 | Mobile design system, toggle redesign, removed MCP/agents, ChatInput refactor |
| 0.7.0-alpha | 2025-11-26 | Message editing, full-text search, AI titles, PWA stability |
| 0.6.0-alpha | 2025-11-24 | Context window meter, pet companion, performance mode |
| 0.5.0-alpha | 2025-11-20 | Simple Mode, TTS, gamification, PWA enhancements |
| 0.4.0-alpha | 2025-11-15 | UI refresh, new personas, Grok 4.1, reasoning display |
| 0.3.0-alpha | 2025-11-10 | Memory system, discussion mode, model comparison |
| 0.2.0-alpha | 2025-11-05 | PWA, mobile UI, security fixes, glassmorphism |
| 0.1.0-alpha | 2025-11-01 | Initial release with core features |

---

## Upcoming (Roadmap)

### 0.8.0-alpha (Planned)
- [ ] Conversation branching UI improvements
- [ ] Artifact generation (code, diagrams)
- [ ] Voice conversations (real-time)
- [ ] Plugin system

### 1.0.0 (Stable)
- [ ] API stabilization
- [ ] Performance benchmarks
- [ ] Full test coverage
- [ ] Production deployment guide

---

## Contributing

See [CONTRIBUTING.md](docs/contributing.md) for how to contribute to this project.

## License

MIT License - see [LICENSE](LICENSE)
