-- Add custom_personas column to user_settings table
-- Stores user-created personas as JSON array

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS custom_personas JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.custom_personas IS 'User-created custom personas stored as JSONB array';

-- Create index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_user_settings_custom_personas
ON public.user_settings USING GIN (custom_personas);
