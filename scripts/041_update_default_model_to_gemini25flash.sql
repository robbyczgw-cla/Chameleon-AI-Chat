-- Migration: Update default model to Google Gemini 2.5 Flash
-- Date: December 2025
-- Run each statement separately if you get errors

-- ============================================
-- STEP 1: Update user_settings with old models
-- ============================================
UPDATE public.user_settings
SET selected_model = 'google/gemini-2.5-flash',
    updated_at = NOW()
WHERE selected_model = 'z-ai/glm-4.6:exacto'
   OR selected_model = 'x-ai/grok-4-fast'
   OR selected_model = 'x-ai/grok-4.1-fast'
   OR selected_model = 'x-ai/grok-4-fast:free'
   OR selected_model = 'x-ai/grok-4.1-fast:free'
   OR selected_model = 'deepseek/deepseek-chat'
   OR selected_model = 'deepseek/deepseek-v3.2'
   OR selected_model = 'openai/gpt-4o';

-- ============================================
-- STEP 2: Update chats with old models
-- ============================================
UPDATE public.chats
SET model = 'google/gemini-2.5-flash'
WHERE model = 'z-ai/glm-4.6:exacto'
   OR model = 'x-ai/grok-4-fast'
   OR model = 'x-ai/grok-4.1-fast'
   OR model = 'x-ai/grok-4-fast:free'
   OR model = 'x-ai/grok-4.1-fast:free'
   OR model = 'deepseek/deepseek-chat'
   OR model = 'deepseek/deepseek-v3.2';

-- ============================================
-- STEP 3: Update selected_models array
-- ============================================
UPDATE public.user_settings
SET selected_models = ARRAY['google/gemini-2.5-flash'],
    updated_at = NOW()
WHERE selected_models IS NULL
   OR 'z-ai/glm-4.6:exacto' = ANY(selected_models)
   OR 'x-ai/grok-4-fast:free' = ANY(selected_models)
   OR 'x-ai/grok-4.1-fast:free' = ANY(selected_models);

-- ============================================
-- STEP 4: Update column defaults
-- ============================================
ALTER TABLE public.user_settings
ALTER COLUMN selected_model SET DEFAULT 'google/gemini-2.5-flash';

ALTER TABLE public.user_settings
ALTER COLUMN selected_models SET DEFAULT ARRAY['google/gemini-2.5-flash'];

-- ============================================
-- STEP 5: Verify (optional)
-- ============================================
SELECT
  selected_model,
  COUNT(*) as user_count
FROM public.user_settings
GROUP BY selected_model
ORDER BY user_count DESC;
