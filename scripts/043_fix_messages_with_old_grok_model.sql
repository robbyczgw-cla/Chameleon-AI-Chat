-- Migration: Fix messages with old Grok model
-- Date: December 2025
-- Description: Updates all messages that have the old non-existent x-ai/grok-4.1-fast:free model
--              to use the new default openai/gpt-5.1-codex-mini

-- ============================================
-- STEP 1: Update messages with old Grok free model
-- ============================================
UPDATE public.messages
SET model = 'openai/gpt-5.1-codex-mini'
WHERE model = 'x-ai/grok-4.1-fast:free'
   OR model = 'x-ai/grok-4-fast:free'
   OR model = 'x-ai/grok-4.1-fast'
   OR model = 'x-ai/grok-4-fast';

-- ============================================
-- STEP 2: Update any NULL model values
-- ============================================
UPDATE public.messages
SET model = 'openai/gpt-5.1-codex-mini'
WHERE model IS NULL OR model = '';

-- ============================================
-- STEP 3: Verify (optional)
-- ============================================
SELECT
  model,
  COUNT(*) as message_count
FROM public.messages
GROUP BY model
ORDER BY message_count DESC;
