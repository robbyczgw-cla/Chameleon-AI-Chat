-- Migration: Add You.com search API settings to user_settings table
-- Date: 2025-11-14
-- Description: Adds You.com API key and search settings columns to enable You.com search

-- Add You.com API key column
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS youcom_api_key TEXT;

-- Add You.com settings columns
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS youcom_max_results INTEGER DEFAULT 5;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS youcom_country TEXT DEFAULT 'at';

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS youcom_livecrawl BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN user_settings.youcom_api_key IS 'API key for You.com search API';
COMMENT ON COLUMN user_settings.youcom_max_results IS 'Maximum number of search results from You.com';
COMMENT ON COLUMN user_settings.youcom_country IS 'Country code for You.com search (at, de, etc.)';
COMMENT ON COLUMN user_settings.youcom_livecrawl IS 'Whether to get full page content with You.com livecrawl';
