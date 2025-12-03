-- Add simple_mode column to user_settings table
-- Stores whether user prefers Simple Mode (true) or Advanced Mode (false)
-- This ensures mode selection persists across sessions

ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS simple_mode BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.simple_mode IS 'User preference: true for Simple Mode, false for Advanced Mode (default)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_simple_mode
ON public.user_settings (simple_mode);
