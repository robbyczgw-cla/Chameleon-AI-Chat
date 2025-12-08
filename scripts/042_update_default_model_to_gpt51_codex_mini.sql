-- Migration: Update default model to GPT-5.1 Codex Mini
-- Date: 2025-01-XX
-- Description: Updates all existing user_preferences to use openai/gpt-5.1-codex-mini as the default model
--              GPT-5.1 Codex Mini is more verbose and better follows instructions than Gemini 2.5 Flash,
--              while still being cost-effective and fast. It's optimized for coding but works great for general use.

-- Update all users who have the old Gemini 2.5 Flash as their selected model
UPDATE user_preferences
SET selected_model = 'openai/gpt-5.1-codex-mini'
WHERE selected_model = 'google/gemini-2.5-flash';

-- Update selected_models array for users who have Gemini 2.5 Flash
UPDATE user_preferences
SET selected_models = array_replace(selected_models, 'google/gemini-2.5-flash', 'openai/gpt-5.1-codex-mini')
WHERE 'google/gemini-2.5-flash' = ANY(selected_models);

-- Ensure all new users get GPT-5.1 Codex Mini as default
-- This is handled in the application code DEFAULT_SETTINGS, but we can add it here for safety
UPDATE user_preferences
SET selected_model = 'openai/gpt-5.1-codex-mini'
WHERE selected_model IS NULL OR selected_model = '';

-- Add GPT-5.1 Codex Mini to selected_models array if not already present
UPDATE user_preferences
SET selected_models = array_append(selected_models, 'openai/gpt-5.1-codex-mini')
WHERE NOT ('openai/gpt-5.1-codex-mini' = ANY(selected_models));
