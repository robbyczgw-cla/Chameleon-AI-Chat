# Changelog

All notable changes to Chameleon AI Chat are documented in this file.

This project is currently in **alpha stage** (v0.x). APIs and features may change.

---

## [0.8.0-alpha] - 2025-11-30

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

---

## [0.4.0-alpha] - 2025-11-15

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
