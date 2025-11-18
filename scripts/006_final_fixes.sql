-- Fix 1: Ensure user_id is set correctly in user_settings
-- Drop the old trigger and create a new one that properly sets user_id
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create settings with explicit user_id
  INSERT INTO public.user_settings (
    id,
    user_id,
    selected_model,
    system_prompt,
    temperature,
    max_tokens,
    top_p,
    frequency_penalty,
    presence_penalty,
    tavily_search_depth,
    tavily_max_results,
    tavily_include_images,
    tavily_include_answer,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.id, -- EXPLICIT user_id
    'openrouter/openai/gpt-oss20b',
    'You are a helpful, knowledgeable AI assistant. Provide comprehensive, detailed, and well-structured answers. When answering questions, be thorough and explain concepts fully. Use examples where appropriate. Don''t cut answers short - complete your thoughts and provide meaningful, substantive responses.',
    0.7,
    16000,
    1.0,
    0.0,
    0.0,
    'basic',
    5,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = new.id,
    selected_model = COALESCE(EXCLUDED.selected_model, 'openrouter/openai/gpt-oss20b'),
    updated_at = NOW();

  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix 2: Update all existing user_settings to have user_id
UPDATE public.user_settings
SET user_id = id
WHERE user_id IS NULL;

-- Fix 3: Make user_id NOT NULL after updating
ALTER TABLE public.user_settings 
  ALTER COLUMN user_id SET NOT NULL;

-- Fix 4: Set default model for all existing users
UPDATE public.user_settings
SET selected_model = 'openrouter/openai/gpt-oss20b'
WHERE selected_model IS NULL OR selected_model = '';
