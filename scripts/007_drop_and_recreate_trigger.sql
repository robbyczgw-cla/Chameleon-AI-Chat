-- Drop the broken trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the trigger function with explicit user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  );
  
  -- Create user_settings with explicit user_id - THIS IS THE FIX
  INSERT INTO public.user_settings (
    user_id, 
    system_prompt, 
    selected_model, 
    temperature, 
    max_tokens, 
    top_p, 
    frequency_penalty, 
    presence_penalty,
    created_at,
    updated_at
  )
  VALUES (
    new.id,  -- <-- EXPLICIT user_id from new.id
    'You are a helpful AI assistant. Provide comprehensive, detailed, and complete responses. Do not stop prematurely. Continue your response until you have fully addressed the user''s query with thorough explanations and examples when appropriate.',
    'openrouter/openai/gpt-oss20b',
    0.7,
    16000,
    1.0,
    0.0,
    0.0,
    now(),
    now()
  );
  
  RETURN new;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix all existing user_settings with null user_id
UPDATE public.user_settings
SET user_id = profiles.id
FROM public.profiles
WHERE user_settings.user_id IS NULL
  AND profiles.email IS NOT NULL;

-- Delete any remaining orphaned settings
DELETE FROM public.user_settings WHERE user_id IS NULL;

-- Ensure selected_model is set for all existing users
UPDATE public.user_settings
SET selected_model = 'openrouter/openai/gpt-oss20b'
WHERE selected_model IS NULL OR selected_model = 'unknown';
