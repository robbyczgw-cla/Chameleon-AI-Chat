-- Quick diagnostic: Check embedding status
-- Run this in Supabase SQL Editor

SELECT
  id,
  LEFT(content, 40) as content,
  CASE
    WHEN embedding IS NULL THEN '❌ NULL'
    WHEN embedding IS NOT NULL THEN '✅ EXISTS (type: ' || pg_typeof(embedding)::text || ')'
  END as embedding_status
FROM public.memories
WHERE user_id = 'ea294732-c900-4783-ba63-90d22ae9ec3f'
LIMIT 5;
