-- Migration: Add Perplexity Sonar setting for HiFi mode
-- Date: 2025-11-11
-- Description: Adds toggle to enable Perplexity Sonar model for HiFi mode (experimental feature)

-- Add Perplexity for HiFi toggle column
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS use_perplexity_for_hifi BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.use_perplexity_for_hifi IS 'Use Perplexity Sonar model with integrated web search for HiFi mode (experimental, higher cost)';
