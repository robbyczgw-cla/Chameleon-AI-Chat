# Chameleon AI Chat - Documentation

This directory contains all documentation for Chameleon AI Chat.

## Quick Links

| Document | For | Description |
|----------|-----|-------------|
| [Power User Guide](./POWER_USER_GUIDE.md) | Users | Master all features, shortcuts, and tips |
| [Architecture](./ARCHITECTURE.md) | Developers | Technical deep dive into the codebase |
| [Future Features](./FUTURE_FEATURES.md) | Contributors | Roadmap with implementation guides |
| [Vision](./CHAMELEON_VISION.md) | Everyone | Philosophy and design principles |

---

## All Documentation

### User Guides
- **[Power User Guide](./POWER_USER_GUIDE.md)** — Keyboard shortcuts, cost optimization, advanced features
- **[User Guide](./user-guide.md)** — Getting started basics
- **[Personas](./personas.md)** — All 18+ AI personalities explained

### Developer Guides
- **[Architecture](./ARCHITECTURE.md)** — Codebase structure, core systems, data flow
- **[API Reference](./api.md)** — API routes and endpoints
- **[Database Schema](./database.md)** — Supabase tables and RLS policies
- **[Deployment](./deployment.md)** — Production deployment guide
- **[Contributing](./contributing.md)** — Development setup and guidelines

### Project
- **[Future Features](./FUTURE_FEATURES.md)** — 20+ planned features with implementation guides
- **[Vision](./CHAMELEON_VISION.md)** — Origin story, philosophy, roadmap
- **[Power User Innovations](./POWER_USER_INNOVATIONS.md)** — Advanced customization ideas

### Setup
- **[Supabase Setup](../SUPABASE_SETUP.md)** — Database configuration
- **[PWA Testing](../PWA_TESTING.md)** — Progressive Web App testing
- **[Security](../SECURITY.md)** — Security considerations

---

## I want to...

**...start using Chameleon effectively**
→ Start with the [Power User Guide](./POWER_USER_GUIDE.md)

**...understand how the code works**
→ Read the [Architecture](./ARCHITECTURE.md) guide

**...contribute a feature**
→ Pick something from [Future Features](./FUTURE_FEATURES.md) and read [Contributing](./contributing.md)

**...add a new AI persona**
→ See [Personas](./personas.md) and check `lib/personas/`

**...set up the database**
→ Follow [Supabase Setup](../SUPABASE_SETUP.md) and [Database Schema](./database.md)

**...deploy to production**
→ Read the [Deployment](./deployment.md) guide

---

## Recent Updates

### 2025-11-24
- Added Vitest test suite for critical paths (cost-tracker, memory-service, search-service)
- Refactored personas into categorized modules (`lib/personas/`)
- Extracted reusable components (MarkdownRenderer, MessageBubble)
- Extracted custom hooks (useVoiceInput, useSlashCommands)

### 2025-11-19
- Memory system now persists to database (not just localStorage)
- Complete documentation overhaul (20,000+ words)
- Mobile menu consistency fix ("AI Discussion")

---

## Contributing to Documentation

1. Use clear headings (H2 for sections, H3 for subsections)
2. Include code examples where helpful
3. Explain *why*, not just *how*
4. Keep examples up to date with the code
5. Add to this index when creating new docs

---

## External Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
