-- Update default model from grok-4-fast to grok-4.1-fast
-- New Grok 4.1 Fast has 2M context window and reasoning support

-- Update the default value for selected_model column
ALTER TABLE public.user_settings
ALTER COLUMN selected_model SET DEFAULT 'x-ai/grok-4.1-fast';

-- Update the default value for selected_models array column
ALTER TABLE public.user_settings
ALTER COLUMN selected_models SET DEFAULT ARRAY['x-ai/grok-4.1-fast'];

-- Update the default value for chats.model column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'chats' AND column_name = 'model') THEN
    ALTER TABLE public.chats
    ALTER COLUMN model SET DEFAULT 'x-ai/grok-4.1-fast';
  END IF;
END $$;

-- Migrate existing users from grok-4-fast to grok-4.1-fast
UPDATE public.user_settings
SET
  selected_model = 'x-ai/grok-4.1-fast',
  selected_models = array_prepend('x-ai/grok-4.1-fast',
    array_remove(selected_models, 'x-ai/grok-4-fast')),
  updated_at = NOW()
WHERE selected_model = 'x-ai/grok-4-fast';

-- Also migrate any remaining old defaults (gpt-4o)
UPDATE public.user_settings
SET
  selected_model = 'x-ai/grok-4.1-fast',
  updated_at = NOW()
WHERE selected_model IN ('openai/gpt-4o', 'openai/gpt-4o-mini');

-- Log the migration
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % user(s) to use x-ai/grok-4.1-fast as default model', affected_rows;
END $$;
