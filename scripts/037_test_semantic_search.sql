-- Test script to diagnose semantic search issues
-- Run this in your Supabase SQL Editor

-- 1. Check if memories have embeddings
SELECT
  id,
  LEFT(content, 60) as content_preview,
  CASE
    WHEN embedding IS NULL THEN '❌ NULL'
    ELSE '✅ HAS EMBEDDING'
  END as status
FROM public.memories
WHERE user_id = 'ea294732-c900-4783-ba63-90d22ae9ec3f'
ORDER BY created_at DESC;

-- 2. Check if RPC function exists
SELECT
  proname as function_name,
  prokind as kind,
  proargtypes::regtype[] as argument_types
FROM pg_proc
WHERE proname = 'search_memories_by_embedding';

-- 3. Test the RPC function with a dummy query
-- (This will fail if embeddings are NULL, but shows if function works)
DO $$
DECLARE
  test_embedding vector(1536);
  result_count integer;
BEGIN
  -- Create a test embedding (all zeros)
  test_embedding := array_fill(0, ARRAY[1536])::vector(1536);

  -- Try to call the function
  SELECT COUNT(*) INTO result_count
  FROM search_memories_by_embedding(
    test_embedding,
    0.0,  -- Very low threshold
    100,  -- High limit
    'ea294732-c900-4783-ba63-90d22ae9ec3f'::uuid
  );

  RAISE NOTICE 'RPC function returned % memories', result_count;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RPC function error: %', SQLERRM;
END $$;

-- 4. Check RLS policies on memories table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'memories';
