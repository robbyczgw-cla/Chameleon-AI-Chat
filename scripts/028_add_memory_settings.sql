-- Add memory_settings column to user_settings table
-- This enables persistence of Memory System settings across sessions

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS memory_settings JSONB DEFAULT '{"enabled": false, "autoExtract": true, "maxMemoriesInContext": 5, "importanceThreshold": 2}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.memory_settings IS 'Memory System configuration: enabled, autoExtract, maxMemoriesInContext, importanceThreshold';

-- Update existing rows to have default memory settings
UPDATE public.user_settings
SET memory_settings = '{"enabled": false, "autoExtract": true, "maxMemoriesInContext": 5, "importanceThreshold": 2}'::jsonb
WHERE memory_settings IS NULL;
