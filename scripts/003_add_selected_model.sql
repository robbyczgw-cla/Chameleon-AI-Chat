-- Add selected_model column to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS selected_model TEXT DEFAULT 'openai/gpt-4o';

-- Update existing rows to have a default model
UPDATE public.user_settings
SET selected_model = 'openai/gpt-4o'
WHERE selected_model IS NULL;
