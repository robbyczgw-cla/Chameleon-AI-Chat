-- Fix default model: Change from gpt-4o to grok-4-fast
-- This fixes the issue where the model selection jumps to GPT-4 unexpectedly

-- Update the column default
ALTER TABLE public.user_settings
ALTER COLUMN selected_model SET DEFAULT 'x-ai/grok-4-fast:free';

-- Update existing rows that have gpt-4o to grok-4-fast (ONLY if they haven't been customized)
-- This is safe because grok-4-fast is our intended default
UPDATE public.user_settings
SET selected_model = 'x-ai/grok-4-fast:free'
WHERE selected_model = 'openai/gpt-4o'
   OR selected_model = 'openai/gpt-4o-mini'
   OR selected_model IS NULL;

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Updated default model from gpt-4o to x-ai/grok-4-fast:free';
END $$;
