# MCP (Model Context Protocol) Guide

This guide explains how to use MCP (Model Context Protocol) in Chameleon AI to extend Claude's capabilities with external tools, databases, and services.

## What is MCP?

The Model Context Protocol (MCP) is an open standard introduced by Anthropic that allows AI systems to connect with external tools and data sources. Think of it as "plugins" for AI - each MCP server adds new capabilities to Claude.

## Deployment Modes

Chameleon AI supports MCP in two modes:

### Web/Cloud Deployment (Vercel)
When running Chameleon AI as a web app on Vercel, MCP functionality works with:
- **Remote MCP servers** that expose HTTP/SSE endpoints
- **MCP proxy services** that bridge to local MCP servers
- **API-based integrations** using the configured API keys

> **Note**: Traditional MCP servers that run as local processes (via `npx`) cannot run directly on serverless platforms. The configuration UI stores your preferences for use with MCP-compatible proxy services or local development.

### Local/Self-Hosted Deployment
When running Chameleon AI locally or on a server you control, MCP works with:
- Local MCP servers via stdio/subprocess
- Docker-based MCP servers
- Remote MCP servers

## Getting Started

### 1. Enable MCP

1. Open Chameleon AI
2. Go to **Settings** (gear icon)
3. Navigate to the **MCP** tab (in Advanced Mode)
4. Toggle **Enable MCP** to on

### 2. Add Servers

#### Option A: Use Preset Servers (Recommended)
1. Click "Browse Popular Servers"
2. Filter by category (Core, Search, Development, etc.)
3. Click "Add" on servers you want
4. Servers requiring API keys are marked with a yellow badge

#### Option B: Add Custom Server
1. Click "Add Custom Server"
2. Enter the server name, command, and arguments
3. Click "Add Server"

### 3. Import/Export Configuration

- **Export**: Download your MCP config as JSON for backup or sharing
- **Import**: Load a previously exported config file

## Popular MCP Servers

### Core Servers

| Server | Description | Use Case |
|--------|-------------|----------|
| **Filesystem** | Secure file operations | Access local files and directories |
| **Memory** | Knowledge graph memory | Persistent memory across conversations |
| **Sequential Thinking** | Step-by-step reasoning | Complex problem-solving |

### Search & Web

| Server | Description | API Key |
|--------|-------------|---------|
| **Brave Search** | Privacy-focused web search | Yes |
| **Exa Search** | Neural semantic search | Yes |
| **Fetch** | Web content fetching | No |
| **Puppeteer** | Browser automation | No |

### Development

| Server | Description | API Key |
|--------|-------------|---------|
| **Git** | Repository management | No |
| **GitHub** | GitHub API access | Yes |
| **E2B Code Interpreter** | Sandboxed code execution | Yes |
| **Linear** | Issue tracking | Yes |

### Databases

| Server | Description | Notes |
|--------|-------------|-------|
| **PostgreSQL** | PostgreSQL access | Connection string required |
| **SQLite** | SQLite database queries | File path required |

### Productivity

| Server | Description | API Key |
|--------|-------------|---------|
| **Notion** | Notion pages & databases | Yes |
| **Obsidian** | Obsidian vault access | No (path required) |
| **Todoist** | Task management | Yes |

### Communication & Storage

| Server | Description | API Key |
|--------|-------------|---------|
| **Slack** | Slack messaging | Yes |
| **Google Drive** | Google Drive access | OAuth required |
| **AWS S3** | S3 bucket operations | Yes (AWS credentials) |

### Media & Utilities

| Server | Description | API Key |
|--------|-------------|---------|
| **YouTube Transcript** | Video transcripts | No |
| **Spotify** | Music search & control | Yes |
| **Time** | Timezone conversions | No |
| **Weather** | Weather forecasts | Yes |

## Configuration Examples

### Example 1: Filesystem Access

```json
{
  "name": "My Documents",
  "command": "npx",
  "args": "-y @modelcontextprotocol/server-filesystem /Users/yourname/Documents"
}
```

### Example 2: GitHub with Token

```json
{
  "name": "GitHub",
  "command": "npx",
  "args": "-y @anthropic/mcp-server-github",
  "env": {
    "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
  }
}
```

### Example 3: PostgreSQL Database

```json
{
  "name": "Production DB",
  "command": "npx",
  "args": "-y @modelcontextprotocol/server-postgres postgresql://<username>:<password>@<host>:5432/<database>"
}
```

## Using MCP with Web Deployment

For Vercel/web deployments, you have several options:

### Option 1: Remote MCP Servers
Use MCP servers that expose HTTP endpoints:
```json
{
  "name": "Remote Memory",
  "command": "https://your-mcp-proxy.example.com/memory",
  "transport": "http"
}
```

### Option 2: MCP Proxy Service
Run an MCP proxy on a server you control that bridges to local MCP servers.

### Option 3: API-Based Alternatives
Many MCP server capabilities are also available through direct API integrations:
- **Brave Search**: Use the built-in web search feature
- **GitHub**: Direct API calls via the GitHub API
- **Databases**: Direct database connections via API routes

## Troubleshooting

### Server Not Connecting

1. For local servers: Make sure Node.js is installed (`node --version`)
2. Verify the npx command works in your terminal
3. Check required API keys are set correctly
4. Verify the npm package exists

### API Key Issues

For servers requiring API keys:
1. Set environment variables on your system
2. Or add them to the server's `env` configuration
3. Use `.env.local` for local development

### Performance Tips

- Only enable servers you actively use
- Disable unused servers with the toggle
- Some servers (Puppeteer) use more resources

## Security Best Practices

- **Filesystem**: Only grant access to directories you trust
- **Database**: Use read-only credentials when possible
- **API Keys**: Never commit keys to version control
- **Network**: Use HTTPS for remote MCP connections

## Getting Free API Keys

| Service | Free Tier | Link |
|---------|-----------|------|
| Brave Search | 2,000 queries/month | [brave.com/search/api](https://brave.com/search/api/) |
| GitHub | Unlimited (personal) | [github.com/settings/tokens](https://github.com/settings/tokens) |
| E2B | 100 sandbox hours/month | [e2b.dev](https://e2b.dev/) |
| Exa | 1,000 queries/month | [exa.ai](https://exa.ai/) |
| Linear | Free for small teams | [linear.app](https://linear.app/) |

## Resources

- [MCP Official Website](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Awesome MCP Servers](https://github.com/wong2/awesome-mcp-servers) - Community collection
- [Streamable HTTP Transport](https://modelcontextprotocol.io/docs/concepts/transports#streamable-http) - For serverless

## Need Help?

If you encounter issues:
1. Check the [MCP documentation](https://modelcontextprotocol.io/docs)
2. Search the [GitHub issues](https://github.com/modelcontextprotocol/servers/issues)
3. Review server-specific README files for configuration details
