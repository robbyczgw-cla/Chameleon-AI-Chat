# 📚 Chameleon AI Chat - Documentation

Welcome to the Chameleon AI Chat documentation! This directory contains comprehensive guides for users, developers, and contributors.

## 📖 Table of Contents

### For Users

1. **[POWER_USER_GUIDE.md](./POWER_USER_GUIDE.md)** ⚡
   - Quick start guide
   - Advanced features
   - Keyboard shortcuts
   - Cost optimization
   - Tips & tricks
   - **Start here if you want to master Chameleon!**

### For Developers

2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** 🏗️
   - Technical deep dive
   - Technology stack
   - Directory structure
   - Core systems explained
   - Database schema
   - Performance optimizations
   - Security architecture
   - **Read this to understand how Chameleon works**

3. **[FUTURE_FEATURES.md](./FUTURE_FEATURES.md)** 🚀
   - Implementation guides for new features
   - Chameleon-themed feature ideas
   - Power user enhancements
   - Collaborative intelligence
   - Multi-modal expansions
   - Agent swarms
   - Wild ideas & moonshots
   - **Contribute by implementing these features!**

### For Dreamers

4. **[CHAMELEON_VISION.md](./CHAMELEON_VISION.md)** 🦎
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

**...understand the codebase**
→ [ARCHITECTURE.md](./ARCHITECTURE.md)

**...contribute a new feature**
→ [FUTURE_FEATURES.md](./FUTURE_FEATURES.md)

**...understand the vision**
→ [CHAMELEON_VISION.md](./CHAMELEON_VISION.md)

---

## Recent Updates

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
| POWER_USER_GUIDE.md | ~800 | User features, tips, shortcuts |
| ARCHITECTURE.md | ~800 | Technical details, schema, systems |
| FUTURE_FEATURES.md | ~1000 | Implementation guides for new features |
| CHAMELEON_VISION.md | ~400 | Philosophy, origin story, roadmap |

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
