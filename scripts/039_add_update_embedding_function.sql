-- Create a function to update memory embeddings properly
-- This ensures the vector type is handled correctly

CREATE OR REPLACE FUNCTION update_memory_embedding(
  p_memory_id uuid,
  p_user_id uuid,
  p_embedding vector(1536)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.memories
  SET embedding = p_embedding
  WHERE id = p_memory_id
    AND user_id = p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_memory_embedding TO authenticated;
