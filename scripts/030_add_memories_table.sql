-- Add memories table for cloud-synced AI memories
-- This is optional - users can choose to keep memories local-only for privacy

-- Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('preference', 'fact', 'context', 'skill', 'goal')),
  content TEXT NOT NULL,
  category TEXT,
  importance INTEGER NOT NULL CHECK (importance IN (1, 2, 3)), -- 1=low, 2=medium, 3=high
  source TEXT, -- Which chat the memory came from
  metadata JSONB DEFAULT '{}',
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON public.memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON public.memories(importance);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON public.memories(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own memories
CREATE POLICY "Users can view their own memories" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" ON public.memories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON public.memories
  FOR DELETE USING (auth.uid() = user_id);

-- Add sync_to_database column to user_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'memory_sync_enabled'
  ) THEN
    ALTER TABLE public.user_settings
    ADD COLUMN memory_sync_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Comment explaining the table
COMMENT ON TABLE public.memories IS 'Stores AI-extracted memories about users for personalization. Optional cloud sync - users can keep local-only for privacy.';
COMMENT ON COLUMN public.memories.type IS 'Memory type: preference, fact, context, skill, or goal';
COMMENT ON COLUMN public.memories.importance IS '1=low (nice to know), 2=medium (useful), 3=high (very important)';
COMMENT ON COLUMN public.memories.access_count IS 'How many times this memory has been used in context';
