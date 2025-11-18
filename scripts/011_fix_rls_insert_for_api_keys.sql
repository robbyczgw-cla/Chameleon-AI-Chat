-- Fix RLS policies to allow INSERT operations on user_settings
-- The issue is that policies need to use 'id' column, not 'user_id'

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

-- Recreate policies with correct column reference (id, not user_id)
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON public.user_settings TO authenticated;

-- Update the trigger function to ensure proper user_settings creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create user_settings with explicit id (same as auth.users.id)
  INSERT INTO public.user_settings (
    id,
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
    tavily_include_answer
  ) VALUES (
    new.id,
    'openrouter/openai/gpt-oss20b',
    'You are a helpful AI assistant.',
    0.7,
    2048,
    1.0,
    0.0,
    0.0,
    'basic',
    5,
    true,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
