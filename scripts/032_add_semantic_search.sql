-- Add semantic search function for memory embeddings
-- Run this in your Supabase SQL Editor after enabling pgvector

-- Function to search memories by embedding similarity
CREATE OR REPLACE FUNCTION search_memories_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  type text,
  content text,
  category text,
  importance int,
  source text,
  metadata jsonb,
  access_count int,
  created_at timestamptz,
  last_accessed_at timestamptz,
  embedding vector(1536),
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.type,
    m.content,
    m.category,
    m.importance,
    m.source,
    m.metadata,
    m.access_count,
    m.created_at,
    m.last_accessed_at,
    m.embedding,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM memories m
  WHERE
    m.user_id = COALESCE(p_user_id, auth.uid())
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) >= match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_memories_by_embedding TO authenticated;

-- Verify the function was created
SELECT proname, proargtypes::regtype[]
FROM pg_proc
WHERE proname = 'search_memories_by_embedding';
