-- Add experimental_settings column to user_settings table
-- This column stores experimental feature toggles as JSON

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS experimental_settings JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_settings.experimental_settings IS 'Stores experimental feature settings as JSON: {enableResponseAnalysis, performanceMode, streamingVisualization: {showDetailedStats, ...}, etc.}';
