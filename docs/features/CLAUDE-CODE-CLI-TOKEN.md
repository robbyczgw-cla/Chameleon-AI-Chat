# Claude Code CLI Token Integration

> Use your Claude Pro/Max subscription directly in Chameleon Chat without paying for API credits

## Overview

This feature allows you to use your existing Claude subscription (Pro or Max) to access Claude models directly through the Anthropic API, bypassing OpenRouter. This is similar to how [Clawd.bot](https://docs.clawd.bot/gateway/authentication#anthropic:-claude-code-cli-setup-token-supported) works.

### Benefits

- **Use your subscription**: If you have Claude Pro ($20/mo) or Claude Max ($100/mo), you can use those credits
- **Direct API access**: Requests go directly to Anthropic, not through a proxy
- **Full model access**: Access to Claude Opus 4.5, Sonnet 4.5, and Haiku 4.5
- **Extended thinking**: Support for Claude's extended thinking mode

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

### Step 1: Install Claude Code CLI

If you don't have Claude Code CLI installed:

```bash
# macOS/Linux
curl -fsSL https://claude.ai/install.sh | sh

# Or via npm
npm install -g @anthropic-ai/claude-code
```

### Step 2: Generate Setup Token

Run this command in your terminal:

```bash
claude setup-token
```

This will:
1. Open a browser window for authentication
2. Generate an OAuth token after you log in
3. Display the token in your terminal

The token looks like: `sk-ant-oat01-XXXXXXXXXXXXXXXXXXXXX`

### Step 3: Add Token to Chameleon

1. Open Chameleon Chat
2. Go to **Settings** (gear icon)
3. Navigate to **API Keys** tab
4. Scroll to **Claude Code CLI Token** section
5. Paste your token
6. Click **Save**

### Step 4: Select a Claude (Direct) Model

After adding the token, "Claude (Direct)" models will appear at the top of the model selector with a lightning bolt icon:

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

### "Claude Code token required"

**Cause**: No token configured or token is empty.

**Solution**: Add your token in Settings > API Keys > Claude Code CLI Token.

### "This token may have expired or is restricted"

**Cause**: The OAuth token has expired or Anthropic rejected it.

**Solution**:
1. Run `claude setup-token` in terminal
2. Copy the new token
3. Update it in Settings

### "Claude (Direct) models not appearing"

**Cause**: Token not saved or page needs refresh.

**Solution**:
1. Verify token is saved in Settings
2. Refresh the page
3. Check browser console for errors

### "Only authorized for use with Claude Code"

**Cause**: Anthropic may restrict some tokens to only work with the official CLI.

**Solution**: This is a known limitation. Try generating a fresh token, or use OpenRouter as fallback.

### Streaming stops mid-response

**Cause**: Token expired during generation or rate limit hit.

**Solution**:
1. Generate fresh token with `claude setup-token`
2. If on Claude Pro, you may have hit usage limits
3. Wait a few minutes and try again

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
