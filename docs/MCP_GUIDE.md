# MCP (Model Context Protocol) Guide

This guide explains how to use MCP (Model Context Protocol) in Chameleon AI to extend Claude's capabilities with external tools, databases, and services.

## What is MCP?

The Model Context Protocol (MCP) is an open standard introduced by Anthropic that allows AI systems to connect with external tools and data sources. Think of it as "plugins" for AI - each MCP server adds new capabilities to Claude.

## Getting Started

### 1. Enable MCP

1. Open Chameleon AI
2. Go to **Settings** (gear icon)
3. Click the **MCP** tab
4. Toggle **Enable MCP** to on

### 2. Add Your First Server

You have two options:

#### Option A: Use Preset Servers (Recommended for Beginners)
1. In the MCP settings, click "Browse Popular Servers"
2. Find a server you want (e.g., "Filesystem" or "Memory")
3. Click "Add" to add it to your active servers
4. Configure any required API keys (marked with yellow badge)

#### Option B: Add Custom Server
1. Click "Add Custom Server"
2. Enter the server name, command, and arguments
3. Click "Add Server"

## Popular MCP Servers

### Core Servers

| Server | Command | Description |
|--------|---------|-------------|
| **Filesystem** | `npx -y @modelcontextprotocol/server-filesystem /path/to/dir` | Read/write files securely |
| **Memory** | `npx -y @modelcontextprotocol/server-memory` | Persistent knowledge graph memory |
| **Sequential Thinking** | `npx -y @modelcontextprotocol/server-sequential-thinking` | Enhanced problem-solving |

### Search & Web

| Server | Command | API Key Required |
|--------|---------|------------------|
| **Brave Search** | `npx -y @anthropic/mcp-server-brave-search` | Yes (`BRAVE_API_KEY`) |
| **Fetch** | `npx -y @modelcontextprotocol/server-fetch` | No |

### Development

| Server | Command | Description |
|--------|---------|-------------|
| **Git** | `npx -y @modelcontextprotocol/server-git` | Repository management |
| **GitHub** | `npx -y @anthropic/mcp-server-github` | GitHub API access (needs `GITHUB_TOKEN`) |

### Databases

| Server | Command | Notes |
|--------|---------|-------|
| **PostgreSQL** | `npx -y @modelcontextprotocol/server-postgres <connection-string>` | Read-only access |

### Automation

| Server | Command | Description |
|--------|---------|-------------|
| **Puppeteer** | `npx -y @modelcontextprotocol/server-puppeteer` | Browser automation |
| **Slack** | `npx -y @modelcontextprotocol/server-slack` | Messaging (needs `SLACK_TOKEN`) |

## Configuration Examples

### Example 1: Filesystem Access

Add access to your documents folder:

```
Server Name: My Documents
Command: npx
Arguments: -y @modelcontextprotocol/server-filesystem /Users/yourname/Documents
```

Now Claude can read and search files in your Documents folder.

### Example 2: Brave Search with API Key

1. Get a free API key from [Brave Search](https://brave.com/search/api/)
2. Add the server:
   ```
   Server Name: Brave Search
   Command: npx
   Arguments: -y @anthropic/mcp-server-brave-search
   ```
3. Set the environment variable `BRAVE_API_KEY` to your key

### Example 3: Git Repository

Add access to a Git repository:

```
Server Name: My Project
Command: npx
Arguments: -y @modelcontextprotocol/server-git /path/to/your/repo
```

## Troubleshooting

### Server Not Connecting

1. Make sure Node.js is installed (`node --version`)
2. Check if the npx command works in your terminal
3. Verify any required API keys are set correctly
4. Check the server's npm package exists

### Performance Issues

- Only enable servers you actively need
- Disable unused servers using the toggle switch
- Some servers (like Puppeteer) use more resources

### API Key Issues

For servers requiring API keys, you typically need to:
1. Set environment variables on your system
2. Or pass them in the command arguments

## Security Considerations

- **Filesystem**: Only grant access to directories you trust
- **Database**: MCP servers typically provide read-only access
- **API Keys**: Keep your keys secure, never share them

## Resources

- [MCP Official Website](https://modelcontextprotocol.io)
- [Official MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [Awesome MCP Servers](https://github.com/wong2/awesome-mcp-servers) - Community collection
- [MCP Examples](https://modelcontextprotocol.io/examples)

## Getting Free API Keys

| Service | Free Tier | Link |
|---------|-----------|------|
| Brave Search | 2,000 queries/month | [brave.com/search/api](https://brave.com/search/api/) |
| GitHub | Unlimited (personal) | [github.com/settings/tokens](https://github.com/settings/tokens) |
| Slack | Free for personal use | [api.slack.com](https://api.slack.com/apps) |

## Need Help?

If you encounter issues:
1. Check the [MCP documentation](https://modelcontextprotocol.io/docs)
2. Search the [GitHub issues](https://github.com/modelcontextprotocol/servers/issues)
3. Join the [MCP community](https://discord.gg/anthropic)
