-- Migration: Add Exa semantic search toggle
-- Date: 2025-11-11
-- Description: Adds toggle to enable Exa semantic search via OpenRouter :online suffix

-- Add Exa search toggle column
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS use_exa_search BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.use_exa_search IS 'Use Exa semantic search via OpenRouter :online suffix ($0.02 per request)';
