-- Update default model from deepseek/deepseek-v3.2 to z-ai/glm-4.6:exacto
-- GLM 4.6 Exacto offers superior tool calling, faster performance, and better stability
-- 85 tok/s throughput, 1ms latency, excellent agentic workflows

-- Update the default value for selected_model column
ALTER TABLE public.user_settings
ALTER COLUMN selected_model SET DEFAULT 'z-ai/glm-4.6:exacto';

-- Update the default value for selected_models array column
ALTER TABLE public.user_settings
ALTER COLUMN selected_models SET DEFAULT ARRAY['z-ai/glm-4.6:exacto'];

-- Update the default value for chats.model column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'chats' AND column_name = 'model') THEN
    ALTER TABLE public.chats
    ALTER COLUMN model SET DEFAULT 'z-ai/glm-4.6:exacto';
  END IF;
END $$;

-- Migrate existing users from deepseek-v3.2 to glm-4.6:exacto
UPDATE public.user_settings
SET
  selected_model = 'z-ai/glm-4.6:exacto',
  selected_models = array_prepend('z-ai/glm-4.6:exacto',
    array_remove(array_remove(selected_models, 'deepseek/deepseek-v3.2'), 'deepseek/deepseek-v3.2-exp')),
  updated_at = NOW()
WHERE selected_model IN ('deepseek/deepseek-v3.2', 'deepseek/deepseek-v3.2-exp');

-- Also migrate any remaining old defaults
UPDATE public.user_settings
SET
  selected_model = 'z-ai/glm-4.6:exacto',
  updated_at = NOW()
WHERE selected_model IN (
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'x-ai/grok-4.1-fast:free',
  'x-ai/grok-4-fast:free'
);

-- Log the migration
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % user(s) to use z-ai/glm-4.6:exacto as default model', affected_rows;
END $$;
