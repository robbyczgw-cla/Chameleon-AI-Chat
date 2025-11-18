-- Migration: Add Serper API settings to user_settings table
-- Date: 2025-11-10
-- Description: Adds Serper API key and search settings columns to enable Google Search via Serper.dev

-- Add Serper API key column
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS serper_api_key TEXT;

-- Add search provider column (tavily or serper)
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS search_provider TEXT DEFAULT 'tavily';

-- Add Serper settings columns
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS serper_max_results INTEGER DEFAULT 5;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS serper_include_images BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS serper_country TEXT DEFAULT 'at';

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS serper_language TEXT DEFAULT 'de';

-- Add comments for documentation
COMMENT ON COLUMN user_settings.serper_api_key IS 'API key for Serper.dev Google Search API';
COMMENT ON COLUMN user_settings.search_provider IS 'Which search provider to use: tavily or serper';
COMMENT ON COLUMN user_settings.serper_max_results IS 'Maximum number of search results from Serper';
COMMENT ON COLUMN user_settings.serper_include_images IS 'Whether to include images in Serper search results';
COMMENT ON COLUMN user_settings.serper_country IS 'Country code for Serper search (at, de, etc.)';
COMMENT ON COLUMN user_settings.serper_language IS 'Language code for Serper search (de, en, etc.)';
