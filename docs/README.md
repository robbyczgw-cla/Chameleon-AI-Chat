# 📚 Chameleon AI Chat - Documentation

Welcome to the Chameleon AI Chat documentation! This directory contains comprehensive guides for users, developers, and contributors.

Note: UI theming is implemented via CSS variables and `<html>` theme classes in `app/globals.css` (including the new Chameleon (Light) theme).

## 📖 Table of Contents

### For Users

1. **[POWER_USER_GUIDE.md](./POWER_USER_GUIDE.md)** ⚡
   - Quick start guide
   - Advanced features
   - Keyboard shortcuts
   - Cost optimization
   - Tips & tricks
   - **Start here if you want to master Chameleon!**

2. **[MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md)** 🧠
   - Intelligent 4-phase memory retrieval
   - Simple user guide (Quick Start, Best Practices)
   - Advanced user guide (Semantic Search, Embeddings)
   - Settings reference and fine-tuning
   - Database setup (pgvector)
   - **Learn how the AI remembers you!**

3. **[FOLLOW_UP_SUGGESTIONS.md](./FOLLOW_UP_SUGGESTIONS.md)** 💬 ENHANCED!
   - Color-coded category system (Quick/Deep/Related)
   - Visual design with gradients and animations
   - Mobile-responsive limits (6 on mobile, 9 on desktop)
   - Implementation details and future improvements
   - **Understand the conversation continuers!**

4. **[LLM_CONTEXT.md](./LLM_CONTEXT.md)** 🤖 NEW!
   - Comprehensive app summary for other AI systems
   - Feed this to another LLM's memory system
   - All core features in one efficient document
   - **Share Chameleon's context with other AIs!**

### For Developers

5. **[ARCHITECTURE.md](./ARCHITECTURE.md)** 🏗️
   - Technical deep dive
   - Technology stack
   - Directory structure
   - Core systems explained (incl. Memory System)
   - Database schema
   - Performance optimizations
   - Security architecture
   - **Read this to understand how Chameleon works**

4. **[database.md](./database.md)** 🗄️
   - Complete Supabase PostgreSQL schema
   - Table definitions with SQL
   - RLS policies and security
   - Indexes and performance
   - Query examples
   - **Reference for the current database schema**

5. **[DATABASE_IMPLEMENTATION_GUIDE.md](./DATABASE_IMPLEMENTATION_GUIDE.md)** 🏗️ NEW!
   - Step-by-step database setup guide
   - Schema design principles
   - Security best practices (RLS, triggers)
   - Performance optimization
   - Alternative implementations (MySQL, SQLite, MongoDB)
   - **Complete guide for implementing a database from scratch**

6. **[FUTURE_FEATURES.md](./FUTURE_FEATURES.md)** 🚀
   - Implementation guides for new features
   - Chameleon-themed feature ideas
   - Power user enhancements
   - Collaborative intelligence
   - Multi-modal expansions
   - Agent swarms
   - Wild ideas & moonshots
   - **Contribute by implementing these features!**

### For Dreamers

5. **[CHAMELEON_VISION.md](./CHAMELEON_VISION.md)** 🦎
   - Origin story
   - Philosophy & core principles
   - Design principles
   - The roadmap ahead
   - Why open source?
   - **Read this to understand the soul of Chameleon**

---

## Quick Navigation

### I want to...

**...learn how to use Chameleon like a pro**
→ [POWER_USER_GUIDE.md](./POWER_USER_GUIDE.md)

**...set up the intelligent memory system**
→ [MEMORY_SYSTEM.md](./MEMORY_SYSTEM.md)

**...understand the codebase**
→ [ARCHITECTURE.md](./ARCHITECTURE.md)

**...set up the database or adapt it for my own project**
→ [DATABASE_IMPLEMENTATION_GUIDE.md](./DATABASE_IMPLEMENTATION_GUIDE.md)

**...see the current database schema**
→ [database.md](./database.md)

**...contribute a new feature**
→ [FUTURE_FEATURES.md](./FUTURE_FEATURES.md)

**...understand the vision**
→ [CHAMELEON_VISION.md](./CHAMELEON_VISION.md)

**...learn about the follow-up suggestions system**
→ [FOLLOW_UP_SUGGESTIONS.md](./FOLLOW_UP_SUGGESTIONS.md)

**...feed Chameleon's context to another AI**
→ [LLM_CONTEXT.md](./LLM_CONTEXT.md)

---

## Recent Updates

### 2025-12-10

✅ **Enhanced Follow-Up Suggestions (v0.10)**
- Color-coded categories: Quick (Emerald), Deep (Violet), Related (Cyan)
- Gradient backgrounds and pill-style category labels
- Mobile-responsive: 6 suggestions on mobile, 9 on desktop
- Improved animations with staggered delays

✅ **Tool Analytics Dashboard**
- New "Tools" tab in Statistics dashboard
- Track tool usage, search queries, provider distribution
- Visual breakdowns with progress bars

✅ **Simple Mode Image Upload Fix**
- Image compression for PWA stability (500KB max)
- Multimodal content support with buildMultimodalContent()
- Fixed image handling parity with Advanced Mode

✅ **Architecture Documentation Update**
- Added Follow-Up Suggestions System section
- Added Chat Modes (Simple vs Advanced) section
- Added Tool Analytics Dashboard section
- Created LLM_CONTEXT.md for feeding to other AI systems

### 2025-12-02

✅ **Intelligent Memory System v2.0**
- 4-phase intelligent retrieval pipeline
- LLM-based query classification (Phase 1)
- Semantic search with OpenAI embeddings (Phase 2)
- Combined intelligence with safety nets (Phase 3)
- Fine-tunable settings in Experimental Settings (Phase 4)
- pgvector database integration for cloud sync
- Comprehensive MEMORY_SYSTEM.md documentation (700+ lines)

### 2025-11-19

✅ **CRITICAL FIX: Memory System Persistence**
- Memory settings now persist to database (were only in localStorage before)
- Added `memory_settings` JSONB column to `user_settings` table
- Migration script: `scripts/028_add_memory_settings.sql`
- When you enable Memory System, it now stays enabled across sessions!

✅ **Comprehensive Documentation Created**
- 4 major documentation files totaling 20,000+ words
- Complete architecture guide
- Power user guide with advanced tips
- Future features implementation roadmap
- Vision & philosophy document

✅ **Mobile Menu Fix**
- Changed "AI Debate Arena" → "AI Discussion" in mobile menu
- Consistency across all UI elements

---

## Documentation Standards

When contributing documentation:

1. **Use clear headings**: H2 for major sections, H3 for subsections
2. **Include code examples**: Always show, don't just tell
3. **Add use cases**: Explain *why*, not just *how*
4. **Keep it updated**: When you change code, update docs
5. **Be beginner-friendly**: Don't assume knowledge
6. **Add Table of Contents**: For documents >500 lines

---

## File Sizes

| Document | Lines | Topics Covered |
|----------|-------|----------------|
| ARCHITECTURE.md | ~1600 | Technical details, all core systems |
| user-guide.md | ~1700 | Complete user documentation |
| FOLLOW_UP_SUGGESTIONS.md | ~700 | Follow-up system, improvements |
| MEMORY_SYSTEM.md | ~700 | Memory system guide for simple & advanced users |
| POWER_USER_GUIDE.md | ~800 | User features, tips, shortcuts |
| database.md | ~650 | Complete Supabase schema reference |
| DATABASE_IMPLEMENTATION_GUIDE.md | ~800 | Step-by-step database implementation guide |
| FUTURE_FEATURES.md | ~1000 | Implementation guides for new features |
| CHAMELEON_VISION.md | ~400 | Philosophy, origin story, roadmap |
| LLM_CONTEXT.md | ~250 | Efficient summary for other AI systems |

---

## Contributing to Docs

Found an error? Have a suggestion? Want to add a guide?

1. Fork the repository
2. Edit the relevant `.md` file in `docs/`
3. Submit a pull request
4. Tag with `documentation` label

---

## External Resources

- **Main README**: [../README.md](../README.md)
- **GitHub Issues**: https://github.com/robbyczgw-cla/Chameleon-AI-Chat/issues
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Supabase Docs**: https://supabase.com/docs

---

## License

All documentation is MIT licensed, same as the code.

**You are free to**:
- Copy and redistribute
- Remix, transform, and build upon
- Use for commercial purposes

**Under the condition that**:
- You provide attribution
- You include the MIT license

---

**Happy learning, building, and adapting!** 🦎
