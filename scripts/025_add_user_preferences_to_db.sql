-- Migration: Add user model preferences and settings to database
-- Date: 2025-11-13
-- Description: Store user's selected OpenRouter models and other preferences in database

-- Add column to store user's selected models list
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS selected_models TEXT[] DEFAULT ARRAY['x-ai/grok-4-fast:free'];

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.selected_models IS 'Array of OpenRouter model IDs that user has selected/configured in model selector';

-- Add column for search provider (already exists but documenting)
-- search_provider column already exists from previous migrations

-- Add voice settings JSON column for future extensibility
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS voice_settings JSONB;

COMMENT ON COLUMN public.user_settings.voice_settings IS 'JSON object containing voice rate, pitch, and selected voice';
