# Chameleon AI Chat - Documentation

Welcome to the Chameleon AI Chat documentation! This directory contains comprehensive guides for users, developers, and contributors.

---

## Quick Navigation

### I want to...

| Goal | Guide |
|------|-------|
| Learn how to use Chameleon like a pro | [guides/POWER_USER_GUIDE.md](./guides/POWER_USER_GUIDE.md) |
| Set up the intelligent memory system | [guides/MEMORY_SYSTEM.md](./guides/MEMORY_SYSTEM.md) |
| Understand the codebase | [dev/ARCHITECTURE.md](./dev/ARCHITECTURE.md) |
| Set up the database | [dev/DATABASE_IMPLEMENTATION_GUIDE.md](./dev/DATABASE_IMPLEMENTATION_GUIDE.md) |
| Deploy my own instance | [dev/deployment.md](./dev/deployment.md) |
| Learn about search providers | [guides/SEARCH-PROVIDERS-GUIDE.md](./guides/SEARCH-PROVIDERS-GUIDE.md) |
| Learn about the 31 personas | [guides/personas.md](./guides/personas.md) |
| Get answers to common questions | [guides/FAQ.md](./guides/FAQ.md) |

---

## Documentation Structure

```
docs/
├── README.md              # This file
├── screenshot.png         # App screenshot
├── guides/                # User-facing documentation
├── dev/                   # Developer documentation
├── features/              # Feature-specific docs
└── archive/               # Historical planning docs
```

---

## User Guides (`guides/`)

Essential documentation for using Chameleon AI Chat.

| Guide | Description |
|-------|-------------|
| [FAQ.md](./guides/FAQ.md) | Frequently asked questions - start here! |
| [user-guide.md](./guides/user-guide.md) | Complete walkthrough for new users |
| [POWER_USER_GUIDE.md](./guides/POWER_USER_GUIDE.md) | Advanced features, shortcuts, tips & tricks |
| [personas.md](./guides/personas.md) | All 31 AI personas explained with use cases |
| [MEMORY_SYSTEM.md](./guides/MEMORY_SYSTEM.md) | How semantic memory works and settings |
| [SEARCH-PROVIDERS-GUIDE.md](./guides/SEARCH-PROVIDERS-GUIDE.md) | Web search integration (Tavily, Serper, Exa) |
| [FOLLOW_UP_SUGGESTIONS.md](./guides/FOLLOW_UP_SUGGESTIONS.md) | Smart conversation continuers explained |
| [PRIVATE_CHAT_MODE.md](./guides/PRIVATE_CHAT_MODE.md) | Ephemeral conversations that leave no trace |
| [REASONING-MODES.md](./guides/REASONING-MODES.md) | Understanding AI reasoning and thinking modes |
| [MCP_GUIDE.md](./guides/MCP_GUIDE.md) | Model Context Protocol integration |
| [RICH_CONTENT_GUIDE.md](./guides/RICH_CONTENT_GUIDE.md) | Markdown, code, and diagram rendering |

---

## Developer Documentation (`dev/`)

Technical documentation for developers and contributors.

| Guide | Description |
|-------|-------------|
| [ARCHITECTURE.md](./dev/ARCHITECTURE.md) | Technical deep dive into the codebase |
| [database.md](./dev/database.md) | Complete Supabase PostgreSQL schema |
| [DATABASE_IMPLEMENTATION_GUIDE.md](./dev/DATABASE_IMPLEMENTATION_GUIDE.md) | Step-by-step database setup |
| [SUPABASE_SETUP.md](./dev/SUPABASE_SETUP.md) | Quick Supabase configuration |
| [api.md](./dev/api.md) | API endpoints reference |
| [deployment.md](./dev/deployment.md) | Self-hosting and Vercel deployment |
| [CAPACITOR_ANDROID.md](./dev/CAPACITOR_ANDROID.md) | Building the native Android app |
| [TESTING.md](./dev/TESTING.md) | Testing guidelines and setup |
| [TYPESCRIPT_CLEANUP.md](./dev/TYPESCRIPT_CLEANUP.md) | TypeScript patterns and type safety fixes |
| [contributing.md](./dev/contributing.md) | How to contribute, code style, PR process |
| [LLM_CONTEXT.md](./dev/LLM_CONTEXT.md) | Context for AI coding assistants |

---

## Feature Documentation (`features/`)

Detailed documentation for specific features.

| Guide | Description |
|-------|-------------|
| [CLAUDE-CODE-CLI-TOKEN.md](./features/CLAUDE-CODE-CLI-TOKEN.md) | **NEW** Use Claude Pro/Max subscription directly |
| [STREAMING-VISUALIZATION.md](./features/STREAMING-VISUALIZATION.md) | Real-time streaming UI system |
| [UNIFIED-VISUALIZATION-SETTINGS.md](./features/UNIFIED-VISUALIZATION-SETTINGS.md) | Visualization configuration |
| [EXACT_COST_TRACKING.md](./features/EXACT_COST_TRACKING.md) | Real-time cost tracking implementation |
| [DEDICATED_FOLLOWUP_MODEL.md](./features/DEDICATED_FOLLOWUP_MODEL.md) | Follow-up suggestion system |
| [PWA_MODERNIZATION.md](./features/PWA_MODERNIZATION.md) | Progressive Web App features |
| [LLM-CHAT-IMAGE-FIXES.md](./features/LLM-CHAT-IMAGE-FIXES.md) | Image handling fixes |
| [agent-mode.md](./features/agent-mode.md) | Multi-step agent task execution |
| [live-code-sandbox.md](./features/live-code-sandbox.md) | Live code sandbox with Sandpack |

---

## Archive (`archive/`)

Historical planning documents, roadmaps, and research. These are kept for reference but may be outdated.

| Guide | Description |
|-------|-------------|
| [CHAMELEON_VISION.md](./archive/CHAMELEON_VISION.md) | Original project philosophy |
| [FUTURE_FEATURES.md](./archive/FUTURE_FEATURES.md) | Planned features (may be outdated) |
| [COMPREHENSIVE_FEATURES_ROADMAP.md](./archive/COMPREHENSIVE_FEATURES_ROADMAP.md) | Full feature roadmap |
| [DECEMBER-2025-ROADMAP.md](./archive/DECEMBER-2025-ROADMAP.md) | December 2025 development plan |
| [ANDROID_2025_ROADMAP.md](./archive/ANDROID_2025_ROADMAP.md) | Android feature roadmap |
| [2025-DEEP-RESEARCH-FINDINGS.md](./archive/2025-DEEP-RESEARCH-FINDINGS.md) | Research findings |
| [BEST-MODELS-TOOL-CALLING-DEC-2025.md](./archive/BEST-MODELS-TOOL-CALLING-DEC-2025.md) | Model comparison for tool calling |
| ... and more |

---

## Root Documentation

Standard files in the repository root:

| File | Description |
|------|-------------|
| [README.md](../README.md) | Project overview and quick start |
| [CHANGELOG.md](../CHANGELOG.md) | Version history and release notes |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |
| [SECURITY.md](../SECURITY.md) | Security policy |
| [CLAUDE.md](../CLAUDE.md) | Claude Code guidance |

---

## Documentation Standards

When contributing documentation:

1. **Use clear headings** - H2 for major sections, H3 for subsections
2. **Include code examples** - Always show, don't just tell
3. **Add use cases** - Explain *why*, not just *how*
4. **Keep it updated** - When you change code, update docs
5. **Be beginner-friendly** - Don't assume knowledge
6. **Add Table of Contents** - For documents >500 lines
7. **Use tables** - For comparing options or listing features

---

## External Resources

- **GitHub Issues**: https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Supabase Docs**: https://supabase.com/docs

---

## License

All documentation is MIT licensed, same as the code.

---

**Happy learning, building, and adapting!**
