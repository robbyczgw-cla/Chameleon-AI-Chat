# OpenClaw Gateway Integration 🦎

This branch adds support for using **OpenClaw Gateway** as the backend instead of OpenRouter, giving you full control over your AI infrastructure.

## What is OpenClaw?

OpenClaw is a self-hosted AI gateway that lets you run AI agents with:
- Multi-model support (Claude, GPT, Synthetic models)
- Tool calling & function execution
- Memory & context management
- Cost tracking
- Multi-agent orchestration

## Setup

### 1. Prerequisites

- Running OpenClaw Gateway instance
- Gateway token (from `~/.openclaw/openclaw.json`)
- Gateway URL (via Tailscale or local network)

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Enable OpenClaw mode
OPENCLAW_MODE=true

# Gateway URL (defaults to Tailscale URL if not set)
OPENCLAW_GATEWAY_URL=https://your-gateway.tail8a9ea9.ts.net/v1/chat/completions

# Gateway token (from ~/.openclaw/openclaw.json -> gateway.auth.token)
OPENCLAW_GATEWAY_TOKEN=your-token-here

# Which OpenClaw agent to use (default: main)
OPENCLAW_AGENT_ID=main
```

### 3. Deploy to Vercel

The environment variables work in Vercel Preview deployments:

1. Push this branch to GitHub
2. Vercel will auto-create a preview deployment
3. Add environment variables in Vercel dashboard:
   - `OPENCLAW_MODE=true`
   - `OPENCLAW_GATEWAY_URL=...`
   - `OPENCLAW_GATEWAY_TOKEN=...`
4. Redeploy

## Features

### ✅ What Works

- **Chat**: Full streaming support
- **Personas**: All 31 Chameleon personas work with OpenClaw
- **Models**: Uses OpenClaw's configured models (Claude, GPT, Synthetic)
- **Tool Calling**: Web search, weather, URL fetch, YouTube transcripts
- **Cost Tracking**: OpenClaw tracks token usage
- **Multi-turn**: Full conversation context

### ⚠️ Differences from OpenRouter

- **Model Selection**: Only models configured in your OpenClaw instance
- **Model Override**: Send `model: "openclaw:opus"` to use specific agent
- **No OpenRouter Models**: Can't access 100+ OpenRouter models
- **Self-Hosted**: You control costs, data, and infrastructure

## Architecture

```
Chameleon UI (Vercel)
    ↓
OpenClaw Gateway (Tailscale/VPS)
    ↓
Models (Claude, GPT, Synthetic, etc.)
```

## Switching Back to OpenRouter

Set `OPENCLAW_MODE=false` or remove the variable entirely.

## Troubleshooting

### "Connection refused"

- Check Tailscale is running
- Verify gateway URL is accessible
- Test with: `curl https://your-gateway/v1/chat/completions`

### "Unauthorized"

- Verify `OPENCLAW_GATEWAY_TOKEN` matches `gateway.auth.token` in config
- Check Gateway auth mode is `token` (not `password`)

### "Model not found"

- OpenClaw uses agent's default model
- Override with `model: "openclaw:agentId"`
- Check `openclaw status` to see configured agents

## Benefits

🔒 **Privacy**: All data stays on your infrastructure  
💰 **Cost Control**: Direct API access, no middleman  
🛠️ **Customization**: Full control over models, tools, prompts  
🦎 **Multi-Agent**: Switch between different OpenClaw agents  
📊 **Analytics**: Detailed token tracking in OpenClaw logs  

---

Built with ❤️ for self-hosted AI
