-- Migration: Update default model to GPT-5.1 Codex Mini
-- Date: December 2025
-- Description: Updates all existing user_settings to use openai/gpt-5.1-codex-mini as the default model
--              GPT-5.1 Codex Mini is more verbose and better follows instructions than Gemini 2.5 Flash,
--              while still being cost-effective and fast. It's optimized for coding but works great for general use.

-- ============================================
-- STEP 1: Update user_settings with Gemini 2.5 Flash to GPT-5.1 Codex Mini
-- ============================================
UPDATE public.user_settings
SET selected_model = 'openai/gpt-5.1-codex-mini',
    updated_at = NOW()
WHERE selected_model = 'google/gemini-2.5-flash'
   OR selected_model IS NULL
   OR selected_model = '';

-- ============================================
-- STEP 2: Update chats that use Gemini 2.5 Flash
-- ============================================
UPDATE public.chats
SET model = 'openai/gpt-5.1-codex-mini'
WHERE model = 'google/gemini-2.5-flash'
   OR model IS NULL
   OR model = '';

-- ============================================
-- STEP 3: Update selected_models array
-- ============================================
UPDATE public.user_settings
SET selected_models = ARRAY['openai/gpt-5.1-codex-mini'],
    updated_at = NOW()
WHERE selected_models IS NULL
   OR 'google/gemini-2.5-flash' = ANY(selected_models);

-- ============================================
-- STEP 4: Update column defaults
-- ============================================
ALTER TABLE public.user_settings
ALTER COLUMN selected_model SET DEFAULT 'openai/gpt-5.1-codex-mini';

ALTER TABLE public.user_settings
ALTER COLUMN selected_models SET DEFAULT ARRAY['openai/gpt-5.1-codex-mini'];

-- ============================================
-- STEP 5: Verify (optional)
-- ============================================
SELECT
  selected_model,
  COUNT(*) as user_count
FROM public.user_settings
GROUP BY selected_model
ORDER BY user_count DESC;
