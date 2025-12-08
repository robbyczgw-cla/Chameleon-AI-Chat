-- Migration: Update default model to Google Gemini 2.5 Flash
-- Date: December 2025
-- Reason: Gemini 2.5 Flash offers best value - fast, cheap ($0.30/M input), 98% tool calling success
-- Previous default: z-ai/glm-4.6:exacto

-- Update all existing user profiles to use new default model
-- This catches ALL users who still have the old default
UPDATE user_profiles
SET selected_model = 'google/gemini-2.5-flash'
WHERE selected_model IN (
  'z-ai/glm-4.6:exacto',
  'x-ai/grok-4-fast',
  'x-ai/grok-4.1-fast',
  'deepseek/deepseek-chat',
  'deepseek/deepseek-v3.2',
  'openai/gpt-4o'
);

-- Also update any chats that were created with old defaults
UPDATE chats
SET model = 'google/gemini-2.5-flash'
WHERE model IN (
  'z-ai/glm-4.6:exacto',
  'x-ai/grok-4-fast',
  'x-ai/grok-4.1-fast',
  'deepseek/deepseek-chat',
  'deepseek/deepseek-v3.2'
);

-- Update selected_models array to include new default at the front
UPDATE user_profiles
SET selected_models = CASE
  WHEN selected_models IS NULL THEN '["google/gemini-2.5-flash"]'::jsonb
  WHEN NOT selected_models ? 'google/gemini-2.5-flash' THEN
    jsonb_build_array('google/gemini-2.5-flash') || selected_models
  ELSE selected_models
END
WHERE selected_models IS NULL OR NOT selected_models ? 'google/gemini-2.5-flash';

-- Verify the update
SELECT
  'Updated profiles to Gemini 2.5 Flash' as action,
  COUNT(*) as count
FROM user_profiles
WHERE selected_model = 'google/gemini-2.5-flash';
