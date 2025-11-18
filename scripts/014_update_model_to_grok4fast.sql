-- Update all existing user settings to use grok-4-fast instead of expensive models
-- This ensures everyone uses the correct default model

UPDATE public.user_settings
SET
  selected_model = 'x-ai/grok-4-fast',
  updated_at = NOW()
WHERE
  selected_model != 'x-ai/grok-4-fast'
  OR selected_model IS NULL;

-- Verify the update
SELECT id, selected_model, updated_at
FROM public.user_settings
ORDER BY updated_at DESC;
