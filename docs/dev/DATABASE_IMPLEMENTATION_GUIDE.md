# 🏗️ Database Implementation Guide

**Complete guide to implementing a database for Chameleon AI Chat or similar AI chat applications.**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Requirements](#database-requirements)
3. [Choosing a Database](#choosing-a-database)
4. [Schema Design Principles](#schema-design-principles)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Security Best Practices](#security-best-practices)
7. [Performance Optimization](#performance-optimization)
8. [Testing & Validation](#testing--validation)
9. [Migration Strategy](#migration-strategy)
10. [Alternative Implementations](#alternative-implementations)

---

## Overview

This guide explains how to implement a production-ready database for an AI chat application. While we use **Supabase (PostgreSQL)** in Chameleon AI Chat, the principles apply to any relational database.

**What You'll Learn:**
- Core schema design for chat applications
- Security via Row-Level Security (RLS)
- Performance optimization strategies
- Migration and versioning
- How to adapt this for your own project

---

## Database Requirements

### Functional Requirements

**Core Features:**
- User authentication and profiles
- Multi-tenant data isolation (each user sees only their data)
- Chat conversations with messages
- Folder organization (nested folders)
- User preferences and settings
- AI model usage tracking
- Optional: Semantic search for memories

**Performance Requirements:**
- Fast chat loading (< 100ms)
- Message history retrieval (< 50ms for 1000 messages)
- Real-time updates (optional, via subscriptions)
- Search across all chats (< 200ms)

**Security Requirements:**
- Row-Level Security (users can't access others' data)
- Secure authentication
- No SQL injection vulnerabilities
- Audit trail (timestamps)

---

## Choosing a Database

### Option 1: PostgreSQL (Recommended)

**Pros:**
- Industry standard, battle-tested
- Excellent JSON support (JSONB)
- Advanced features (RLS, triggers, full-text search)
- Extensions (pgvector for embeddings)
- Free tier available (Supabase, Neon, Railway)

**Cons:**
- Requires server setup (or use managed service)
- Learning curve for advanced features

**Best For:** Production apps, complex queries, semantic search

### Option 2: MySQL/MariaDB

**Pros:**
- Widely available
- Good performance
- Large community

**Cons:**
- Less advanced JSON support
- No built-in RLS (need app-level security)
- Limited extension ecosystem

**Best For:** Traditional web apps, familiar with MySQL

### Option 3: SQLite

**Pros:**
- Zero configuration
- Perfect for local development
- Fast for single-user apps
- File-based (easy backups)

**Cons:**
- No built-in auth or RLS
- Not suitable for multi-user production
- Limited concurrency

**Best For:** Local-first apps, prototypes, testing

### Option 4: MongoDB

**Pros:**
- Flexible schema
- Good for rapid iteration
- Native JSON storage

**Cons:**
- No joins (requires embedding or manual lookups)
- No RLS (app-level security required)
- ACID transactions are complex

**Best For:** Document-heavy apps, flexible schemas

**Our Choice: Supabase (PostgreSQL)** - Best balance of features, security, and developer experience.

---

## Schema Design Principles

### 1. Normalize User Data

```
auth.users (managed by auth system)
    ↓ (1:1)
profiles (your data: name, bio, preferences)
    ↓ (1:many)
chats, folders, memories
```

**Why?** Separates authentication from application data. Easy to extend profiles without touching auth.

### 2. Use Foreign Keys with Cascade

```sql
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
```

**Why?** Automatically cleans up all user data when account is deleted.

### 3. Add Timestamps Everywhere

```sql
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

**Why?** Debugging, analytics, sorting, audit trail.

### 4. Use JSONB for Flexible Data

```sql
metadata JSONB DEFAULT '{}'
```

**Why?** Extend schemas without migrations. Store model-specific data (tokens, cost, search results).

### 5. Index Foreign Keys

```sql
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
```

**Why?** Foreign key lookups are common. Indexes = 10-100x faster.

---

## Step-by-Step Implementation

### Step 1: Create Base Tables

**Order matters!** Create parent tables before children (due to foreign keys).

```sql
-- 1. Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Folders (organize chats)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE, -- nested folders
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Chats (conversation threads)
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL, -- optional folder
  title TEXT NOT NULL,
  persona_id TEXT DEFAULT 'default',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Messages (chat content)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- model, tokens, cost, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_model TEXT DEFAULT 'openai/gpt-3.5-turbo',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4000,
  system_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2: Create Indexes

**Which columns to index?**
- Foreign keys (for joins)
- Columns used in WHERE clauses
- Columns used in ORDER BY

```sql
-- User lookups
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_folders_user_id ON folders(user_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);

-- Folder hierarchy
CREATE INDEX idx_folders_parent_id ON folders(parent_id);

-- Chat organization
CREATE INDEX idx_chats_folder_id ON chats(folder_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC); -- sorting

-- Message retrieval
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at); -- sorting
```

**Partial Indexes (Advanced):**
```sql
-- Index only active chats (faster queries)
CREATE INDEX idx_chats_active
  ON chats(user_id, updated_at DESC)
  WHERE is_archived = FALSE;
```

### Step 3: Enable Row-Level Security (PostgreSQL)

**Critical for multi-tenant apps!** Without RLS, users could access each other's data.

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Chats: Users can only access their own chats
CREATE POLICY "Users can view own chats" ON chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: Users can access messages in their chats
CREATE POLICY "Users can view messages in own chats" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Repeat FOR INSERT, UPDATE, DELETE...
```

**Why RLS?** Even if your app has a bug, the database enforces security.

### Step 4: Add Triggers

**Auto-update timestamps:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**Auto-create profile on signup:**
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO user_settings (id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Step 5: Add Optional Features

**A. Semantic Search (pgvector)**

```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 or text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector index
CREATE INDEX idx_memories_embedding ON memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Search function
CREATE FUNCTION search_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (id uuid, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, content, 1 - (embedding <=> query_embedding) as similarity
  FROM memories
  WHERE user_id = auth.uid()
    AND 1 - (embedding <=> query_embedding) >= match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

**B. Full-Text Search**

```sql
-- Add tsvector column for fast search
ALTER TABLE messages ADD COLUMN content_tsv tsvector;

-- Create index
CREATE INDEX idx_messages_content_tsv ON messages USING gin(content_tsv);

-- Auto-update on insert/update
CREATE TRIGGER messages_content_tsv_update
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION tsvector_update_trigger(
    content_tsv, 'pg_catalog.english', content
  );

-- Search function
CREATE FUNCTION search_messages(query text)
RETURNS TABLE (chat_id uuid, content text, rank real)
LANGUAGE sql STABLE AS $$
  SELECT m.chat_id, m.content, ts_rank(m.content_tsv, query) as rank
  FROM messages m
  JOIN chats c ON c.id = m.chat_id
  WHERE c.user_id = auth.uid()
    AND m.content_tsv @@ plainto_tsquery('english', query)
  ORDER BY rank DESC
  LIMIT 50;
$$;
```

---

## Security Best Practices

### 1. Always Use RLS

**Bad:**
```sql
SELECT * FROM chats WHERE user_id = $1; -- App-level security
```

**Good:**
```sql
CREATE POLICY "rls_chats" ON chats
  USING (auth.uid() = user_id);

SELECT * FROM chats; -- Database enforces security
```

### 2. Use Parameterized Queries

**Bad (SQL Injection):**
```typescript
const query = `SELECT * FROM chats WHERE title = '${userInput}'`;
```

**Good:**
```typescript
const { data } = await supabase
  .from('chats')
  .select('*')
  .eq('title', userInput); // Safe, parameterized
```

### 3. Validate Input at Database Level

```sql
CREATE TABLE messages (
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  importance INTEGER CHECK (importance BETWEEN 1 AND 3)
);
```

### 4. Use `SECURITY DEFINER` Carefully

**Dangerous:**
```sql
CREATE FUNCTION delete_all_chats()
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$ -- Bypasses RLS!
  DELETE FROM chats;
$$;
```

**Safe:**
```sql
CREATE FUNCTION delete_all_chats()
RETURNS void
LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM chats WHERE user_id = auth.uid(); -- Still respects user
$$;
```

---

## Performance Optimization

### 1. Use EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE chat_id = '123'
ORDER BY created_at DESC
LIMIT 50;
```

**Look for:**
- `Seq Scan` → Add index!
- High `Execution Time` → Optimize query
- `Nested Loop` → Check join efficiency

### 2. Limit Result Sets

**Bad:**
```sql
SELECT * FROM messages; -- Could be millions!
```

**Good:**
```sql
SELECT * FROM messages
WHERE chat_id = '123'
ORDER BY created_at DESC
LIMIT 50; -- Only what you need
```

### 3. Use Pagination

```sql
-- Page 1
SELECT * FROM chats
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;

-- Page 2
SELECT * FROM chats
ORDER BY updated_at DESC
LIMIT 20 OFFSET 20;
```

**Better: Cursor-based pagination:**
```sql
-- Page 1
SELECT * FROM chats
ORDER BY updated_at DESC, id
LIMIT 20;

-- Page 2 (after last item from page 1)
SELECT * FROM chats
WHERE (updated_at, id) < (last_updated_at, last_id)
ORDER BY updated_at DESC, id
LIMIT 20;
```

### 4. Avoid N+1 Queries

**Bad:**
```typescript
const chats = await getChats(); // 1 query
for (const chat of chats) {
  const messages = await getMessages(chat.id); // N queries!
}
```

**Good:**
```typescript
const chatsWithMessages = await supabase
  .from('chats')
  .select(`
    *,
    messages (*)
  `); // 1 query with join
```

---

## Testing & Validation

### 1. Test RLS Policies

```sql
-- Set test user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims.sub = 'user-id-123';

-- Should return only user's data
SELECT * FROM chats;

-- Should fail (different user)
INSERT INTO chats (user_id, title)
VALUES ('different-user-id', 'Test');
```

### 2. Test Performance

```sql
-- Insert test data
INSERT INTO messages (chat_id, role, content)
SELECT
  'test-chat-id',
  'user',
  'Test message ' || i
FROM generate_series(1, 10000) AS i;

-- Benchmark query
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE chat_id = 'test-chat-id'
ORDER BY created_at DESC
LIMIT 50;
```

### 3. Validate Constraints

```sql
-- Should fail (invalid role)
INSERT INTO messages (chat_id, role, content)
VALUES ('123', 'invalid', 'test');

-- Should fail (NULL content)
INSERT INTO messages (chat_id, role, content)
VALUES ('123', 'user', NULL);
```

---

## Migration Strategy

### 1. Version Your Schema

```
scripts/
  001_initial_schema.sql
  002_add_folders.sql
  003_add_rls_policies.sql
  004_add_indexes.sql
  ...
  030_add_memories_table.sql
```

### 2. Make Migrations Idempotent

```sql
-- Safe to run multiple times
CREATE TABLE IF NOT EXISTS chats (...);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE chats ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
```

### 3. Use Transactions

```sql
BEGIN;

-- Migration steps
ALTER TABLE chats ADD COLUMN new_field TEXT;
CREATE INDEX idx_chats_new_field ON chats(new_field);
UPDATE chats SET new_field = 'default';

-- Only commit if everything succeeds
COMMIT;
```

### 4. Backup Before Migrations

```bash
# Supabase
supabase db dump > backup-$(date +%Y%m%d).sql

# PostgreSQL
pg_dump -h localhost -U user -d database > backup.sql
```

---

## Alternative Implementations

### Using Prisma (ORM)

```prisma
model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  email     String
  chats     Chat[]
  createdAt DateTime @default(now())
}

model Chat {
  id        String    @id @default(uuid())
  userId    String
  profile   Profile   @relation(fields: [userId], references: [userId])
  messages  Message[]
  title     String
  createdAt DateTime  @default(now())
}

model Message {
  id        String   @id @default(uuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id])
  role      String
  content   String
  createdAt DateTime @default(now())
}
```

**Pros:** Type-safe, migrations handled, cross-database
**Cons:** No RLS support, app-level security only

### Using Firebase/Firestore

```javascript
// Structure
users/{userId}/chats/{chatId}/messages/{messageId}

// Security rules
match /users/{userId}/chats/{chatId} {
  allow read, write: if request.auth.uid == userId;
}
```

**Pros:** Real-time, serverless, easy auth
**Cons:** No joins, expensive for large datasets, vendor lock-in

### Using MySQL/MariaDB

Same schema as PostgreSQL, but:
- No RLS (use app-level security)
- Use `JSON` instead of `JSONB`
- No pgvector (use external search service)
- Auto-increment instead of UUIDs (optional)

---

## Summary Checklist

**Database Setup:**
- [ ] Choose database (PostgreSQL recommended)
- [ ] Set up authentication (Supabase Auth, Auth0, etc.)
- [ ] Create base schema (profiles, chats, messages, settings)
- [ ] Add indexes on foreign keys and common queries
- [ ] Enable RLS and create policies
- [ ] Add triggers for auto-timestamps and profile creation

**Security:**
- [ ] Test RLS policies with different users
- [ ] Use parameterized queries everywhere
- [ ] Add CHECK constraints for data validation
- [ ] Never bypass RLS without careful review

**Performance:**
- [ ] Run EXPLAIN ANALYZE on common queries
- [ ] Add indexes where needed
- [ ] Use pagination for large result sets
- [ ] Avoid N+1 queries with joins

**Maintenance:**
- [ ] Version all migrations
- [ ] Make migrations idempotent
- [ ] Backup before changes
- [ ] Test migrations on staging first

---

## Next Steps

1. **Read:** [Database Schema](./database.md) - Current Chameleon AI schema
2. **Read:** [Supabase Setup](./SUPABASE_SETUP.md) - How to run migrations
3. **Explore:** `/scripts/*.sql` - All migration files
4. **Deploy:** [Deployment Guide](./deployment.md) - Production setup

---

**Questions?** Check our [Architecture Guide](./ARCHITECTURE.md) or open an issue on GitHub!
