# Private Chat Mode

Private Chat Mode provides ephemeral, privacy-focused conversations similar to ChatGPT's "Temporary Chat" or Claude's incognito mode. When enabled, conversations are not saved anywhere and leave no trace after closing.

## Features

- **No Database Sync**: Private chats are never saved to Supabase
- **No Local Storage**: Private chats are excluded from localStorage persistence
- **No Memory Access**: Memory retrieval and injection are completely disabled
- **No Learning**: All background learning tasks are skipped
- **Auto-Delete**: Private chats are automatically deleted when navigating away or closing the browser
- **No Sharing**: Share functionality is hidden for private chats

## User Interface

### Toggle Location
- **Advanced Mode Only**: Floating button in the top-right corner of the chat window
- Icon: Shield (ShieldCheck when ON, ShieldOff when OFF)
- Visual indicator: Emerald green highlight with pulse animation when active

### Visual Indicators
1. **Toggle Button**: Green background and pulse dot when private mode is ON
2. **Banner**: Green banner below header showing "Private Mode: Chats are not saved..."
3. **Sidebar**: Shield icon next to private chat titles
4. **Chat Title**: Always shows "Private Chat" (no AI-generated titles)

## Technical Implementation

### Types (`types/index.ts`)

```typescript
// AppSettings - controls the global toggle
interface AppSettings {
  privateChatMode?: boolean // Private Chat Mode toggle
  // ...
}

// Chat - marks individual chats as private
interface Chat {
  isPrivate?: boolean // True for private chats
  // ...
}
```

### State Management (`contexts/app-context.tsx`)

#### Creating Private Chats
```typescript
const createChat = useCallback((model?: string): string => {
  const isPrivateChat = settings.privateChatMode === true

  const newChat: Chat = {
    // ...
    title: isPrivateChat ? "Private Chat" : "New Chat",
    isPrivate: isPrivateChat,
  }

  // Skip database sync for private chats
  if (isPrivateChat) {
    return newChat.id // Early return, no Supabase call
  }

  // Normal Supabase sync for non-private chats
  if (user) {
    supabaseSync.createChat(user.id, newChat)
  }
}, [...])
```

#### Adding Messages to Private Chats
```typescript
const addMessage = (chatId: string, message: Message) => {
  setChats((prev) =>
    prev.map((chat) => {
      if (chat.id === chatId) {
        // Skip database sync for private chats
        if (chat.isPrivate) {
          console.log("PRIVATE CHAT: Message added locally only")
        } else if (user) {
          supabaseSync.createMessage(message, chatId)
        }
        // Message is ALWAYS added to local state
        return { ...chat, messages: [...chat.messages, message] }
      }
      return chat
    })
  )
}
```

#### Excluding from localStorage
```typescript
useEffect(() => {
  // Filter out private chats before saving
  const nonPrivateChats = chats.filter((chat) => !chat.isPrivate)
  const sanitizedChats = sanitizeChatsForStorage(nonPrivateChats)
  safeSetLocalStorage("chats", sanitizedChats)
}, [chats, isLoading])
```

#### Auto-Delete Logic
```typescript
// Delete private chats when navigating away with private mode OFF
useEffect(() => {
  if (!settings.privateChatMode) {
    const privateChats = chats.filter((chat) => chat.isPrivate)
    if (privateChats.length > 0) {
      const currentChat = chats.find((c) => c.id === currentChatId)
      if (!currentChat?.isPrivate) {
        // User navigated to non-private chat, delete all private chats
        setChats((prev) => prev.filter((chat) => !chat.isPrivate))
      }
    }
  }
}, [currentChatId, settings.privateChatMode])
```

### Memory System Bypass (`components/chat-input.tsx`)

All memory-related features check for private mode:

```typescript
// IMPORTANT: Check BOTH the chat's isPrivate flag AND the global setting
// The global setting is needed because when starting a new chat, the private
// chat doesn't exist yet when memory retrieval runs
const isPrivateChat = currentChat?.isPrivate === true || settings.privateChatMode === true

// Memory retrieval - SKIPPED
if (settings.memorySettings?.enabled && !isPrivateChat) {
  // Memory retrieval code...
}

// Persona memory - SKIPPED
if (settings.selectedPersona?.memorySettings?.enabled && !isPrivateChat) {
  // Persona memory code...
}

// Context awareness - SKIPPED
if (settings.selectedPersona?.contextSettings?.enabled && !isPrivateChat) {
  // Context awareness code...
}

// Emotion detection - SKIPPED
if (emotionDetectionEnabled && !isPrivateChat) {
  // Emotion detection code...
}

// Background learning tasks - SKIPPED
if (!isPrivateChatForLearning) {
  // Memory extraction, preference learning, etc.
}
```

### Share Functionality Disabled

Private chats cannot be shared:

```typescript
// chat-header.tsx - Hide share button
{currentChat && !currentChat.isPrivate && (
  <Button onClick={() => setIsShareOpen(true)}>Share</Button>
)}

// quick-actions-menu.tsx - Hide share options
{!currentChat?.isPrivate && (
  <DropdownMenuItem>Share Online</DropdownMenuItem>
)}
```

### Delete Optimization

Skip unnecessary Supabase calls for private chats:

```typescript
const deleteChat = useCallback((chatId: string) => {
  const chatToDelete = chats.find((c) => c.id === chatId)
  const isPrivateChat = chatToDelete?.isPrivate === true

  setChats((prev) => prev.filter((chat) => chat.id !== chatId))

  // Skip Supabase for private chats (never saved there)
  if (user && !isPrivateChat) {
    supabaseSync.deleteChat(user.id, chatId)
  }
}, [user, chats])
```

## User Scenarios

### Scenario 1: Basic Private Chat
1. User clicks shield icon (turns green)
2. User creates new chat → marked as private
3. User sends messages → stored in memory only
4. User closes browser → chat is gone

### Scenario 2: Toggle Off While on Private Chat
1. User has private chat open
2. User clicks shield icon to turn OFF
3. Private chat remains visible (still viewing it)
4. Amber banner shows: "This is a private chat - it will not be saved"
5. User navigates to another chat → private chat is deleted

### Scenario 3: Multiple Private Chats
1. User creates private chat 1
2. User creates private chat 2 (mode still ON)
3. User toggles private mode OFF
4. User creates new chat (non-private)
5. All private chats are deleted when navigating to the new chat

### Scenario 4: Page Refresh
1. User has private chat with messages
2. User refreshes page
3. Private chat is gone (not in localStorage)

## What Still Works in Private Mode

- **Streaming**: Full streaming support
- **Tool Calling**: Web search, weather, URL fetch, etc.
- **Personas**: Persona prompts work (but no persona memory)
- **Model Selection**: All models available
- **Attachments**: Image/file uploads work
- **Export**: Can still export chat as JSON/Markdown (local only)

## What's Disabled in Private Mode

| Feature | Behavior |
|---------|----------|
| Database sync | Skipped |
| localStorage | Excluded |
| Memory retrieval | Skipped |
| Memory extraction | Skipped |
| Persona memory | Skipped |
| Context awareness | Skipped |
| Emotion detection | Skipped |
| Preference learning | Skipped |
| AI title generation | Skipped |
| Chat sharing | Hidden |

## Files Modified

| File | Changes |
|------|---------|
| `types/index.ts` | Added `privateChatMode` to AppSettings, `isPrivate` to Chat |
| `contexts/app-context.tsx` | Private chat creation, messaging, auto-delete logic |
| `components/chat-input.tsx` | Skip memory/learning for private chats |
| `app/page.tsx` | Floating toggle button, privacy banners |
| `components/chat-header.tsx` | Hide share button for private chats |
| `components/chat-sidebar.tsx` | Shield icon indicator for private chats |
| `components/quick-actions-menu.tsx` | Hide share options for private chats |

## Security Considerations

1. **No Server-Side Storage**: Private chats never touch Supabase
2. **No Client-Side Persistence**: Excluded from localStorage
3. **Memory Isolation**: No memory reads or writes
4. **Share Prevention**: Cannot create shareable links
5. **Clean Deletion**: Automatic cleanup on navigation/close

## Limitations

1. **Session-Only**: Private chats cannot be recovered after closing
2. **No Cross-Device**: Only exists on the current browser session
3. **Advanced Mode Only**: Toggle not available in Simple Mode
4. **No History**: Private chats don't appear in chat history after refresh
