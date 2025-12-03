-- Update default model from grok-4.1-fast to deepseek/deepseek-v3.2
-- DeepSeek V3.2 offers superior performance with ultra-low cost
-- Matches GPT-5 High and Claude 4.5 on benchmarks at 70% lower cost

-- Update the default value for selected_model column
ALTER TABLE public.user_settings
ALTER COLUMN selected_model SET DEFAULT 'deepseek/deepseek-v3.2';

-- Update the default value for selected_models array column
ALTER TABLE public.user_settings
ALTER COLUMN selected_models SET DEFAULT ARRAY['deepseek/deepseek-v3.2'];

-- Update the default value for chats.model column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'chats' AND column_name = 'model') THEN
    ALTER TABLE public.chats
    ALTER COLUMN model SET DEFAULT 'deepseek/deepseek-v3.2';
  END IF;
END $$;

-- Migrate existing users from grok-4.1-fast to deepseek-v3.2
UPDATE public.user_settings
SET
  selected_model = 'deepseek/deepseek-v3.2',
  selected_models = array_prepend('deepseek/deepseek-v3.2',
    array_remove(array_remove(selected_models, 'x-ai/grok-4.1-fast:free'), 'x-ai/grok-4-fast:free')),
  updated_at = NOW()
WHERE selected_model IN ('x-ai/grok-4.1-fast:free', 'x-ai/grok-4-fast:free');

-- Also migrate any remaining old defaults (gpt-4o, gpt-4o-mini)
UPDATE public.user_settings
SET
  selected_model = 'deepseek/deepseek-v3.2',
  updated_at = NOW()
WHERE selected_model IN ('openai/gpt-4o', 'openai/gpt-4o-mini');

-- Log the migration
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % user(s) to use deepseek/deepseek-v3.2 as default model', affected_rows;
END $$;
