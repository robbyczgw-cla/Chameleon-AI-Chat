-- Fix 1: Add user_id to trigger function to fix the null constraint error
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (
    new.id,
    new.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default settings with user_id explicitly set and gpt-oss20b as default model
  INSERT INTO public.user_settings (
    id, 
    user_id,
    selected_model,
    system_prompt,
    temperature,
    max_tokens,
    top_p,
    frequency_penalty,
    presence_penalty
  )
  VALUES (
    new.id,
    new.id,  -- Explicitly set user_id
    'openrouter/openai/gpt-oss20b',  -- Default model as requested
    'You are a helpful, knowledgeable AI assistant. Provide comprehensive, detailed, and well-structured answers. When answering questions, be thorough and explain concepts fully. Use examples where appropriate. Don''t cut answers short - complete your thoughts and provide meaningful, substantive responses.',
    0.7,
    16000,
    1.0,
    0.0,
    0.0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- Fix existing records that might have null user_id
UPDATE user_settings 
SET user_id = id 
WHERE user_id IS NULL;

-- Update all existing users to have gpt-oss20b as default model
UPDATE user_settings 
SET selected_model = 'openrouter/openai/gpt-oss20b'
WHERE selected_model IS NULL OR selected_model = 'x-ai/grok-4' OR selected_model = 'unknown';
