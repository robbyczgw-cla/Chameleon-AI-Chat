-- Migration: Add full Exa search integration
-- Date: 2025-11-25
-- Description: Adds Exa API key and settings for direct Exa search integration

-- Add Exa API key column
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_api_key TEXT;

-- Add Exa settings columns
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_max_results INTEGER DEFAULT 5;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_search_type TEXT DEFAULT 'auto';

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_use_autoprompt BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_include_full_text BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_include_highlights BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_include_summary BOOLEAN DEFAULT false;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_highlights_per_result INTEGER DEFAULT 3;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_max_text_characters INTEGER DEFAULT 3000;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_livecrawl TEXT DEFAULT 'fallback';

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS exa_category TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.exa_api_key IS 'Exa AI API key for direct semantic search integration';
COMMENT ON COLUMN user_settings.exa_max_results IS 'Max results for Exa search (1-100)';
COMMENT ON COLUMN user_settings.exa_search_type IS 'Exa search type: neural, keyword, or auto';
COMMENT ON COLUMN user_settings.exa_use_autoprompt IS 'Let Exa optimize search queries';
COMMENT ON COLUMN user_settings.exa_include_full_text IS 'Include full page text in results';
COMMENT ON COLUMN user_settings.exa_include_highlights IS 'Include relevant highlights in results';
COMMENT ON COLUMN user_settings.exa_include_summary IS 'Include AI-generated summaries';
COMMENT ON COLUMN user_settings.exa_highlights_per_result IS 'Number of highlight sentences per result';
COMMENT ON COLUMN user_settings.exa_max_text_characters IS 'Max characters of text per result';
COMMENT ON COLUMN user_settings.exa_livecrawl IS 'Livecrawl mode: never, fallback, always';
COMMENT ON COLUMN user_settings.exa_category IS 'Content category filter (news, github, etc)';
