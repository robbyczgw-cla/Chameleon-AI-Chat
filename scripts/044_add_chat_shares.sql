-- Chat Sharing Feature
-- Allows users to create shareable links for their chats (read-only)

-- Create chat_shares table
CREATE TABLE IF NOT EXISTS public.chat_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  title TEXT, -- Optional custom title for shared version
  expires_at TIMESTAMPTZ, -- Optional expiration date
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_shares_share_token ON public.chat_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_chat_shares_chat_id ON public.chat_shares(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_shares_owner_id ON public.chat_shares(owner_id);

-- Enable Row Level Security
ALTER TABLE public.chat_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_shares

-- Owners can view their own shares
CREATE POLICY "Users can view their own shares" ON public.chat_shares
  FOR SELECT USING (auth.uid() = owner_id);

-- Owners can create shares for their own chats
CREATE POLICY "Users can create shares for their own chats" ON public.chat_shares
  FOR INSERT WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.chats
      WHERE chats.id = chat_shares.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Owners can update their own shares
CREATE POLICY "Users can update their own shares" ON public.chat_shares
  FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete their own shares
CREATE POLICY "Users can delete their own shares" ON public.chat_shares
  FOR DELETE USING (auth.uid() = owner_id);

-- CRITICAL: Allow public read access via share token (for unauthenticated users)
-- This policy allows anyone with a valid share token to view the share metadata
CREATE POLICY "Anyone can view active shares by token" ON public.chat_shares
  FOR SELECT USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Create a function to get shared chat data (bypasses RLS for public access)
CREATE OR REPLACE FUNCTION public.get_shared_chat(p_share_token TEXT)
RETURNS TABLE (
  share_id UUID,
  chat_id UUID,
  share_title TEXT,
  chat_title TEXT,
  owner_id UUID,
  view_count INTEGER,
  created_at TIMESTAMPTZ,
  messages JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
BEGIN
  -- Get the share record
  SELECT cs.* INTO v_share
  FROM chat_shares cs
  WHERE cs.share_token = p_share_token
    AND cs.is_active = TRUE
    AND (cs.expires_at IS NULL OR cs.expires_at > NOW());

  -- Return empty if not found
  IF v_share IS NULL THEN
    RETURN;
  END IF;

  -- Increment view count
  UPDATE chat_shares
  SET view_count = view_count + 1, updated_at = NOW()
  WHERE id = v_share.id;

  -- Return the shared chat data
  RETURN QUERY
  SELECT
    v_share.id as share_id,
    v_share.chat_id,
    v_share.title as share_title,
    c.title as chat_title,
    v_share.owner_id,
    v_share.view_count + 1 as view_count,
    v_share.created_at,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'role', m.role,
          'content', m.content,
          'model', m.model,
          'created_at', m.created_at
        ) ORDER BY m.created_at ASC
      )
      FROM messages m
      WHERE m.chat_id = v_share.chat_id
    ) as messages
  FROM chats c
  WHERE c.id = v_share.chat_id;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_shared_chat(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_chat(TEXT) TO authenticated;
