-- Add deleted_memories table for cloud-synced memory archive
-- This allows users to restore deleted memories from any device

-- Create deleted_memories table
CREATE TABLE IF NOT EXISTS public.deleted_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_memory_id UUID NOT NULL, -- Original memory ID for reference
  type TEXT NOT NULL CHECK (type IN ('preference', 'fact', 'context', 'skill', 'goal')),
  content TEXT NOT NULL,
  category TEXT,
  importance INTEGER NOT NULL CHECK (importance IN (1, 2, 3)),
  original_importance INTEGER CHECK (original_importance IN (1, 2, 3)), -- Importance before demotion
  source TEXT,
  metadata JSONB DEFAULT '{}',
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL, -- Original memory creation time
  deleted_at TIMESTAMPTZ DEFAULT NOW(), -- When it was archived
  expires_at TIMESTAMPTZ NOT NULL, -- When it will be permanently removed
  deletion_reason TEXT NOT NULL CHECK (deletion_reason IN ('expired', 'manual', 'demoted'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deleted_memories_user_id ON public.deleted_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_memories_expires_at ON public.deleted_memories(expires_at);
CREATE INDEX IF NOT EXISTS idx_deleted_memories_deleted_at ON public.deleted_memories(deleted_at DESC);

-- Enable Row Level Security
ALTER TABLE public.deleted_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own deleted memories
CREATE POLICY "Users can view their own deleted memories" ON public.deleted_memories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deleted memories" ON public.deleted_memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deleted memories" ON public.deleted_memories
  FOR DELETE USING (auth.uid() = user_id);

-- Function to cleanup expired deleted memories (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_deleted_memories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.deleted_memories
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments explaining the table
COMMENT ON TABLE public.deleted_memories IS 'Archive for deleted AI memories, allowing restoration within retention period (default 14 days)';
COMMENT ON COLUMN public.deleted_memories.original_memory_id IS 'ID of the original memory before deletion';
COMMENT ON COLUMN public.deleted_memories.original_importance IS 'Importance level before demotion (for high-importance memories that were demoted first)';
COMMENT ON COLUMN public.deleted_memories.expires_at IS 'When this archived memory will be permanently removed';
COMMENT ON COLUMN public.deleted_memories.deletion_reason IS 'Why the memory was deleted: expired (auto-cleanup), manual (user deleted), demoted (high-importance was demoted then expired)';
