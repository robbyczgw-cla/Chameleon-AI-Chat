-- Update default model to Grok 4.1 Fast
-- Grok is faster and more reliable with multi-step tool calling than GLM 4.6

-- Update users who are using GLM 4.6 or old deprecated models
UPDATE public.user_settings
SET
  selected_model = 'x-ai/grok-4.1-fast',
  updated_at = NOW()
WHERE selected_model IN (
  'z-ai/glm-4.6:exacto',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'deepseek/deepseek-v3.2'
);

-- Also update selected_models array if it contains old models
UPDATE public.user_settings
SET
  selected_models = ARRAY['x-ai/grok-4.1-fast'],
  updated_at = NOW()
WHERE
  'z-ai/glm-4.6:exacto' = ANY(selected_models)
  OR 'openai/gpt-4o' = ANY(selected_models)
  OR 'openai/gpt-4o-mini' = ANY(selected_models)
  OR 'deepseek/deepseek-v3.2' = ANY(selected_models);

-- Report how many users were updated
SELECT
  COUNT(*) as users_updated,
  selected_model
FROM public.user_settings
WHERE selected_model = 'x-ai/grok-4.1-fast'
GROUP BY selected_model;
