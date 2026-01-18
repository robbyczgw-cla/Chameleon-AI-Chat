# Direct Anthropic API Integration

> Use Claude models directly without OpenRouter — via API key (recommended) or Claude Pro/Max subscription

## Overview

This feature allows you to access Claude models directly through the Anthropic API, bypassing OpenRouter. You have two authentication options:

1. **Anthropic API Key (Recommended)** — Pay-per-use, most reliable
2. **Claude Code CLI Token (OAuth)** — Use your Claude Pro/Max subscription credits

This implementation is inspired by how [Clawd.bot](https://docs.clawd.bot/gateway/authentication#anthropic:-claude-code-cli-setup-token-supported) handles Anthropic authentication.

### Benefits

- **Direct API access**: Requests go directly to Anthropic, not through a proxy
- **Full model access**: Access to Claude Opus 4.5, Sonnet 4.5, and Haiku 4.5
- **Extended thinking**: Support for Claude's extended thinking mode
- **Flexible auth**: Use API key (pay-per-use) or OAuth token (subscription-based)
- **Better reliability**: API key method avoids OAuth token restrictions

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Chameleon UI   │────▶│  /api/anthropic  │────▶│  Anthropic API  │
│                 │     │   (Edge Route)   │     │  api.anthropic  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                                 │
        │         OAuth Token (sk-ant-oat01-...)          │
        └─────────────────────────────────────────────────┘
```

## Setup Instructions

### Option A: Anthropic API Key (Recommended)

This is the most reliable method. You pay per token used.

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Open Chameleon Chat → **Settings** → **API Keys**
4. Paste your key in **Anthropic API Key** field (`sk-ant-api03-...`)
5. Click **Save**

**Benefits:**
- ✅ Most reliable — no OAuth restrictions
- ✅ Doesn't expire
- ✅ Consistent behavior

### Option B: Claude Code CLI Token (Subscription-based)

Use your Claude Pro/Max subscription credits. Requires Claude Code CLI.

#### Step 1: Install Claude Code CLI

```bash
# macOS/Linux
curl -fsSL https://claude.ai/install.sh | sh

# Or via npm
npm install -g @anthropic-ai/claude-code
```

#### Step 2: Generate Setup Token

```bash
claude setup-token
```

This will:
1. Open a browser window for authentication
2. Generate an OAuth token after you log in
3. Display the token in your terminal

The token looks like: `sk-ant-oat01-XXXXXXXXXXXXXXXXXXXXX`

#### Step 3: Add Token to Chameleon

1. Open Chameleon Chat → **Settings** → **API Keys**
2. Paste your token in **Claude Code CLI Token** field
3. Click **Save**

**Caveats:**
- ⚠️ Token expires after ~8 hours
- ⚠️ Some tokens are restricted to Claude Code CLI only (you'll see "only authorized for use with Claude Code" error)
- ⚠️ If OAuth fails, use an API key instead

### Step 3: Select a Claude (Direct) Model

After adding either auth method, "Claude (Direct)" models appear at the top of the model selector with a ⚡ icon:

- ⚡ Claude Opus 4.5 (Direct)
- ⚡ Claude Sonnet 4.5 (Direct)
- ⚡ Claude Haiku 4.5 (Direct)

Select one and start chatting!

## Model Routing

The app uses different prefixes to distinguish between API providers:

| Prefix | Provider | Example | Description |
|--------|----------|---------|-------------|
| `anthropic:` | Direct Anthropic API | `anthropic:claude-sonnet-4-5` | Uses your Claude Code token |
| `anthropic/` | OpenRouter | `anthropic/claude-4.5-sonnet` | Uses OpenRouter API key |

This means you can have **both** configured and switch between them:
- Use Direct for your subscription credits
- Use OpenRouter when you need specific features or as fallback

## Available Models

| Model ID | Display Name | Context | Max Output | Features |
|----------|--------------|---------|------------|----------|
| `anthropic:claude-opus-4-5` | Claude Opus 4.5 (Direct) | 200K | 32K | Vision, Thinking |
| `anthropic:claude-sonnet-4-5` | Claude Sonnet 4.5 (Direct) | 200K | 64K | Vision, Thinking |
| `anthropic:claude-haiku-4-5` | Claude Haiku 4.5 (Direct) | 200K | 8K | Vision |

## Features Supported

### ✅ Fully Supported

- **Streaming responses**: Real-time text streaming
- **Extended thinking**: Toggle reasoning mode for step-by-step thinking
- **Vision/Images**: Send images in your messages
- **System prompts**: Custom system prompts work normally
- **Tool calling**: Web search, URL fetch, YouTube transcripts, weather
- **Personas**: All personas work with direct models

### ⚠️ Partial Support

- **Exact cost tracking**: Not available (subscription-based, not pay-per-token)
- **Generation IDs**: Anthropic doesn't provide OpenRouter-style generation IDs

### ❌ Not Supported

- **Agent Mode**: Complex multi-step agent tasks may have issues (use OpenRouter models)
- **Prompt caching**: Anthropic's prompt caching is not exposed via this integration

## Token Management

### Token Expiration

The Claude Code CLI token is **short-lived** (typically expires after a few hours to days). When it expires:

1. You'll see an error: "Claude Code token error: This token may have expired"
2. Run `claude setup-token` again to generate a fresh token
3. Paste the new token in Settings

### Security Notes

- Tokens are stored encrypted in Supabase (if logged in) or localStorage (guest mode)
- Tokens are never sent to OpenRouter - only to Anthropic directly
- The token has limited scopes: `user:inference` and `user:profile`

## Database Setup (Self-Hosted)

If you're self-hosting Chameleon and want database sync for the token, run this migration:

```sql
-- Add claude_code_token column to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS claude_code_token TEXT;

-- Optional: Add comment for documentation
COMMENT ON COLUMN user_settings.claude_code_token IS
  'Claude Code CLI OAuth token for direct Anthropic API access (sk-ant-oat01-...)';
```

## Troubleshooting

### "Authentication required"

**Cause**: No auth method configured.

**Solution**: Add either:
- Anthropic API key (`sk-ant-api03-...`) — recommended
- Claude Code CLI token (`sk-ant-oat01-...`)

### "OAuth Token Restricted" / "Only authorized for use with Claude Code"

**Cause**: Anthropic restricts some OAuth tokens to only work with the official Claude Code CLI.

**Solution** (in order of preference):
1. **Use an Anthropic API key instead** — Most reliable option. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. Try generating a fresh OAuth token with `claude setup-token`
3. Use OpenRouter as fallback (with `anthropic/` models)

### "OAuth Token Expired/Invalid"

**Cause**: OAuth tokens expire after ~8 hours.

**Solution**:
1. Run `claude setup-token` in terminal
2. Copy the new token
3. Update it in Settings

### "Claude (Direct) models not appearing"

**Cause**: No auth method configured or page needs refresh.

**Solution**:
1. Verify an API key or OAuth token is saved in Settings > API Keys
2. Refresh the page
3. Check browser console for errors

### "Permission Denied"

**Cause**: Your auth method doesn't have access to the selected model.

**Solution**:
- Ensure you have Claude Pro/Max subscription (for OAuth)
- Ensure your API key has access to the model tier
- Try a different model (e.g., Haiku instead of Opus)

### Streaming stops mid-response

**Cause**: Token expired during generation or rate limit hit.

**Solution**:
1. If using OAuth: Generate fresh token with `claude setup-token`
2. If on Claude Pro: You may have hit usage limits
3. Wait a few minutes and try again
4. Consider using an API key for longer sessions

## Architecture

### File Structure

```
lib/
├── anthropic.ts          # Anthropic API client, models, streaming
│
app/api/
├── anthropic/
│   └── route.ts          # Edge API route for Anthropic
│
components/
├── model-selector.tsx    # Shows Claude (Direct) when token set
├── settings/tabs/
│   └── api-keys-tab.tsx  # Token input UI
│
lib/
├── openrouter.ts         # Routes anthropic: models to /api/anthropic
├── supabase/
│   └── sync.ts           # Database sync for token
```

### Request Flow

1. User sends message with `anthropic:claude-sonnet-4-5` model
2. `streamChatMessage()` in `openrouter.ts` detects `anthropic:` prefix
3. Request routed to `/api/anthropic` with token in header
4. Edge route converts messages to Anthropic format
5. Streams response from `api.anthropic.com`
6. SSE events converted to OpenRouter-compatible format
7. UI receives standard streaming events

### Anthropic SSE Format

Anthropic uses different SSE events than OpenRouter:

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_xxx",...}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text"}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}

event: message_stop
data: {"type":"message_stop"}
```

These are converted to our standard format:
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
```

## Comparison: Direct vs OpenRouter

| Feature | Claude (Direct) | OpenRouter |
|---------|----------------|------------|
| **Cost** | Subscription-based | Pay-per-token |
| **Latency** | Lower (direct) | Slightly higher |
| **Rate Limits** | Subscription tier | Credit-based |
| **Model Selection** | Claude only | 100+ models |
| **Exact Costs** | No | Yes |
| **Prompt Caching** | No | Yes (via OR) |
| **Fallback** | Manual | Automatic |

## Related Documentation

- [Anthropic API Reference](https://docs.anthropic.com/en/api/messages)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- [OpenRouter Integration](./api.md)
- [Model Selection Guide](../guides/POWER_USER_GUIDE.md)

## Changelog

### v1.4.0 (January 2026)
- Initial implementation of Claude Code CLI token support
- Added direct Anthropic API streaming
- Added model selector integration
- Added database sync for cross-device token storage
