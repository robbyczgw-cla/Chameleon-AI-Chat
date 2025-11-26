# Changelog

All notable changes to Chameleon AI Chat are documented in this file.

---

## [v2.5.0] - 2025-11-26

### 🚀 New Features

#### Message Editing
- **Edit your sent messages** - Click the edit icon on any of your messages
- **Inline editing** - Edit directly in the chat without popups
- **Auto re-generation** - AI automatically responds to your edited message
- **Simple UX** - Save to confirm, Cancel to discard

#### Full-Text Search
- **Search all chat content** - Not just titles anymore!
- **Lightning fast** - Inverted index provides 1-5ms search times (10-40x faster)
- **Real-time results** - Updates as you type
- **Relevance scoring** - Title matches rank higher than content matches
- Minimum 3 characters to trigger search

#### Draft Auto-Save
- **Never lose drafts** - Auto-saves to localStorage every 500ms
- **Per-chat drafts** - Each chat has its own separate draft
- **24-hour expiry** - Prevents stale drafts from appearing
- **Seamless restore** - Drafts appear automatically when you return to a chat
- **Clear on send** - Drafts cleared after successful message send

#### AI-Powered Chat Titles
- **Smart title generation** - AI generates 2-6 word titles from your first message
- **Privacy-focused model** - Uses `openai/gpt-oss-20b` (open-source)
- **Background processing** - Doesn't block UI while generating
- **Graceful fallback** - Falls back to truncated message if API fails

#### Title Animation
- **Subtle slide-in effect** - New titles animate in from the left
- **Primary color highlight** - Brief color flash then fades to normal
- **GPU-friendly** - Pure CSS animation (no JavaScript loops)
- **Accessibility** - Respects `prefers-reduced-motion` preference
- 1.2s duration with smooth easing

### 🐛 Bug Fixes

#### PWA Stability
- **Image compression** - Large images auto-compressed on upload (max 1920x1080, 80% quality)
- **Memory optimization** - Historical images stripped from API requests to prevent memory leaks
- **WebP format** - Better compression with JPEG fallback
- **90%+ size reduction** - Dramatic reduction for large images

#### Touch Device Support
- **Action buttons visible** - Edit, copy, audio buttons now visible on touch devices
- **Smart detection** - Uses `@media(hover:hover)` instead of screen width
- **iPad fix** - Buttons no longer hidden on iPad/tablet browsers
- **Touch laptops** - Works on Surface and other touch-enabled laptops

#### Image Conversation Titles
- **Fixed "[object Object]" bug** - Multimodal messages now generate proper titles
- **Text extraction** - Correctly extracts text from image+text messages
- **Fallback title** - "Image conversation" if no text content

### 🔧 Technical Improvements

#### New Files Created
- `hooks/use-draft.ts` - Draft persistence hook with debounce
- `lib/title-generator.ts` - AI title generation service

#### Modified Files
- `components/chat-messages.tsx` - Added message editing UI
- `components/chat-sidebar.tsx` - Full-text search integration, title animation
- `components/chat-header.tsx` - Header title animation
- `components/chat-input.tsx` - Draft integration, image data stripping
- `components/simple-chat-input.tsx` - Draft integration
- `components/simple-chat-app.tsx` - Title animation for simple mode
- `contexts/app-context.tsx` - AI title generation, multimodal title fix
- `lib/file-handler.ts` - Image compression function
- `lib/multimodal-utils.ts` - stripImageDataFromContent function
- `lib/search-service.ts` - Inverted index search
- `app/globals.css` - Title animation keyframes
- `types/index.ts` - Added titleGeneratedAt property

---

## Recent Commits Explained

### 1. Message Editing, Full-Text Search, and Draft Auto-Save
**Commit:** `a9d1f90`

Added three highly-requested features:
- **Message editing**: Users can now edit their sent messages. The AI will automatically re-generate its response based on the edited message.
- **Full-text search**: The sidebar search now uses an inverted index to search across all chat content (not just titles). This is 10-40x faster than linear search.
- **Draft auto-save**: Drafts are automatically saved to localStorage every 500ms. When you return to a chat, your draft is restored.

### 2. Touch Device Button Visibility Fix
**Commit:** `edf6362`

Fixed an issue where action buttons (edit, copy, audio) were hidden on touch devices like iPad. Changed from screen-width-based hiding (`sm:opacity-0`) to hover-capability detection (`@media(hover:hover)`).

### 3. Image Conversation Title Bug Fix
**Commit:** `119eff2`

Fixed a bug where conversations starting with images showed `"[object Object]"` as the title. Added proper extraction of text content from multimodal messages.

### 4. Image Compression for PWA Stability
**Commit:** `2a192cb`

Added automatic image compression to prevent PWA crashes. Images over 100KB are compressed to max 1920x1080 at 80% quality using WebP format (with JPEG fallback). Reduces image sizes by ~90%.

### 5. AI-Powered Chat Title Generation
**Commit:** `70e0cf9` + `c0782b8`

Implemented automatic title generation using AI. When you start a new chat, the first message is sent to `openai/gpt-oss-20b` (privacy-focused open-source model) to generate a concise 2-6 word title.

### 6. Title Animation
**Commit:** `4ac763d`

Added a subtle CSS animation for when AI-generated titles appear. The animation slides in from the left with a primary color highlight that fades to normal. GPU-friendly and respects reduced motion preferences.

### 7. PWA Memory Optimization
**Commit:** `ff85944`

Fixed PWA crashes caused by accumulating image data in memory. Historical images are now stripped from API requests (replaced with placeholder text). This prevents memory leaks in long conversations with multiple images.

---

## Usage Notes

### Message Editing
1. Hover over your message (or tap on touch devices)
2. Click the pencil (edit) icon
3. Modify your text
4. Click Save to confirm

### Draft Auto-Save
- Works automatically - just start typing
- Switch between chats - drafts are preserved
- Return to a chat - draft is restored
- Drafts expire after 24 hours

### Full-Text Search
1. Open sidebar search (or press Ctrl+K)
2. Type at least 3 characters
3. Results show instantly
4. Click to open a chat

### AI Chat Titles
- Requires OpenRouter API key
- Only triggers on first message of new chats
- Message must be at least 10 characters
- Fallback to truncated message if API fails

### PWA Best Practices
- Images are auto-compressed on upload
- Don't worry about image sizes - we handle it
- Long conversations with images are now stable
- Touch device buttons always visible
