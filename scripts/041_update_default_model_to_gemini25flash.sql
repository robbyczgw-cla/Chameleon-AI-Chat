-- Migration: Update default model to Google Gemini 2.5 Flash
-- Date: December 2025
-- Run each statement separately if you get errors

-- ============================================
-- STEP 1: Update user profiles with old models
-- ============================================
UPDATE user_profiles
SET selected_model = 'google/gemini-2.5-flash'
WHERE selected_model = 'z-ai/glm-4.6:exacto'
   OR selected_model = 'x-ai/grok-4-fast'
   OR selected_model = 'x-ai/grok-4.1-fast'
   OR selected_model = 'deepseek/deepseek-chat'
   OR selected_model = 'deepseek/deepseek-v3.2'
   OR selected_model = 'openai/gpt-4o';

-- ============================================
-- STEP 2: Update chats with old models
-- ============================================
UPDATE chats
SET model = 'google/gemini-2.5-flash'
WHERE model = 'z-ai/glm-4.6:exacto'
   OR model = 'x-ai/grok-4-fast'
   OR model = 'x-ai/grok-4.1-fast'
   OR model = 'deepseek/deepseek-chat'
   OR model = 'deepseek/deepseek-v3.2';

-- ============================================
-- STEP 3: Add Gemini to selected_models array (for users with NULL)
-- ============================================
UPDATE user_profiles
SET selected_models = '["google/gemini-2.5-flash"]'::jsonb
WHERE selected_models IS NULL;

-- ============================================
-- STEP 4: Add Gemini to front of array (for users who don't have it)
-- ============================================
UPDATE user_profiles
SET selected_models = jsonb_build_array('google/gemini-2.5-flash') || selected_models
WHERE selected_models IS NOT NULL
  AND NOT (selected_models @> '"google/gemini-2.5-flash"'::jsonb);

-- ============================================
-- STEP 5: Verify (optional)
-- ============================================
SELECT
  selected_model,
  COUNT(*) as user_count
FROM user_profiles
GROUP BY selected_model
ORDER BY user_count DESC;
