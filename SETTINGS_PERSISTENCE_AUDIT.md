# Settings Persistence Audit

## ✅ FIXED: Language Selection

**Issue:** Language selection was not persisting after page reload.

**Root Cause:** Dual storage systems not synchronized:
- `languageService` stored in `localStorage['app-language']` (default: "de")
- `SettingsContext` stored in `localStorage['settings']` (default: "en")

**Fix Applied:**
1. Changed `DEFAULT_LANGUAGE` from "de" to "en" to match settings context
2. Made `languageService.getLanguage()` read from settings context first
3. Made `languageService.setLanguage()` also update settings context
4. Added sync in `SettingsDialog.handleSave()` to keep both systems aligned

**Status:** ✅ Committed (c05d129)

---

## ⚠️ POTENTIAL ISSUES FOUND

### 1. Theme Storage (Dual System)

**Files:**
- `app/page.tsx:85` - Reads from `localStorage['chameleon-theme']`
- `components/settings-dialog.tsx` - Saves to `localStorage['chameleon-theme']`
- `SettingsContext` - Has `theme` field in settings object

**Potential Issue:** Theme is stored in **both** places:
- `localStorage['chameleon-theme']` (direct)
- `localStorage['settings'].theme` (via SettingsContext)

**Impact:** LOW - Theme is mostly visual, and both systems use the same key pattern

**Recommendation:** Migrate to using only `SettingsContext.theme` for consistency

---

### 2. Performance Mode (Separate Storage)

**Key:** `localStorage['chameleon-performance-mode']`

**Also in:** `SettingsContext.experimental.performanceMode`

**Potential Issue:** Two storage locations for same setting

**Impact:** MEDIUM - Could cause performance mode to not persist

**Recommendation:** Use only `SettingsContext.experimental.performanceMode`

---

### 3. Web Search Enabled (Separate Storage)

**Key:** `localStorage['chameleon-web-search-enabled']`

**Also in:** `SettingsContext.enableAutoToolUse`

**Potential Issue:** Setting might be stored in two places

**Impact:** LOW - Likely legacy key, modern code uses `enableAutoToolUse`

**Recommendation:** Remove old `chameleon-web-search-enabled` key, migrate to `enableAutoToolUse`

---

### 4. Reasoning Enabled (Separate Storage)

**Key:** `localStorage['chameleon-reasoning-enabled']`

**Might conflict with:** Model-specific reasoning settings

**Impact:** LOW - Likely a feature flag

**Recommendation:** Verify this is properly synced or remove if obsolete

---

### 5. Ambient Music (Separate Storage)

**Key:** `localStorage['chameleon-ambient-music']`

**Potential Issue:** Feature setting stored separately

**Impact:** VERY LOW - Audio preference

**Recommendation:** Migrate to `SettingsContext.experimental.ambientMusic`

---

## 📋 Other localStorage Keys (No Conflicts)

These keys are independent and don't conflict with settings context:

- `chameleon-chats` - Chat history (legacy, migrated to Supabase)
- `chameleon-folders` - Folder structure (legacy)
- `chameleon-api-keys` - API keys (legacy, now in settings.apiKeys)
- `chameleon-mode-selected` - Flag for mode selection dialog shown
- `chameleon-last-active` - Last active timestamp
- `chameleon-analytics-insights` - Analytics data
- `chameleon-personality-analysis` - Personality analysis results
- `chameleon-prompt-evolution` - Prompt evolution tracking
- `simple-mode-onboarding-complete` - Onboarding completion flag
- `guest-mode` - Guest mode flag
- `activePersonaId` - Simple mode active persona
- `promptTemplates` - User's custom prompts
- `documentCollections` - RAG document collections
- `comparisonSessions` - Model comparison sessions
- `chat_memories` - Memory system data

---

## 🔧 Recommended Actions

### High Priority
None currently - language fix was the main issue

### Medium Priority
1. **Audit theme storage** - Ensure both `chameleon-theme` and `settings.theme` stay in sync
2. **Check performance mode** - Verify `chameleon-performance-mode` matches `settings.experimental.performanceMode`

### Low Priority
3. **Remove obsolete keys** - Clean up old localStorage keys that are no longer used
4. **Consolidate storage** - Move all settings to `SettingsContext` for single source of truth

---

## 🧪 Testing Checklist

- [x] Language persists after reload
- [ ] Theme persists after reload
- [ ] Simple Mode toggle persists
- [ ] Font family/size persists
- [ ] Model selection persists
- [ ] API keys persist
- [ ] Performance mode persists
- [ ] Memory settings persist
- [ ] Search provider persists
- [ ] Voice settings persist

---

## 📚 Storage Architecture

**Recommended Pattern:**

```
localStorage['settings']  ← SINGLE SOURCE OF TRUTH
  ├── language
  ├── theme
  ├── simpleMode
  ├── fontSize
  ├── fontFamily
  ├── apiKeys {...}
  ├── modelParameters {...}
  ├── memorySettings {...}
  ├── experimental {...}
  └── [all other settings]

localStorage['chameleon-*']  ← ONLY for non-settings data
  ├── chameleon-chats (legacy)
  ├── chameleon-mode-selected (UI flag)
  ├── simple-mode-onboarding-complete (UI flag)
  └── [other app state, not user settings]
```

**Benefits:**
- Single source of truth for all settings
- Easy to export/import user preferences
- Consistent sync with Supabase
- Simpler debugging
- No conflict resolution needed

---

## 💡 Future Improvements

1. **Settings Migration Service**
   - Detect old localStorage keys
   - Migrate to `settings` object
   - Clean up after migration

2. **Settings Validation**
   - Validate settings on load
   - Provide defaults for missing fields
   - Handle corrupt data gracefully

3. **Settings Sync Status**
   - Show indicator when settings are saving
   - Handle save failures gracefully
   - Retry on network errors (for Supabase sync)

4. **Export/Import Settings**
   - Allow users to backup all settings
   - Import settings from file
   - Useful for migrating between devices
