-- Migration: Add OpenAI API key to user_settings table
-- Date: 2025-11-15
-- Description: Adds OpenAI API key column for Whisper voice input transcription

-- Add OpenAI API key column
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.openai_api_key IS 'API key for OpenAI services (Whisper voice transcription)';
