-- FIX: Use user_id column for user_settings table
-- The actual schema has user_id, not id
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Fix RLS Policies for user_id
-- =============================================
-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;

-- Create new INSERT policy that works with user_id column
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- STEP 2: Fix SELECT policy too
-- =============================================
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;

CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- =============================================
-- STEP 3: Fix UPDATE policy
-- =============================================
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- =============================================
-- STEP 4: Recreate Trigger with user_id
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create settings with user_id column
  INSERT INTO public.user_settings (
    user_id,
    selected_model,
    temperature,
    max_tokens,
    top_p,
    frequency_penalty,
    presence_penalty,
    system_prompt,
    tavily_search_depth,
    tavily_max_results,
    tavily_include_images,
    tavily_include_answer,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'x-ai/grok-4-fast:free',
    0.7,
    16000,
    1.0,
    0.0,
    0.0,
    'You are a helpful, knowledgeable AI assistant. Provide comprehensive, detailed, and well-structured answers. When answering questions, be thorough and explain concepts fully. Use examples where appropriate. Don''t cut answers short - complete your thoughts and provide meaningful, substantive responses.',
    'basic',
    5,
    TRUE,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT ALL ON public.user_settings TO service_role, authenticated, anon;

-- =============================================
-- STEP 5: Verify
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  USER_ID FIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ RLS policies updated for user_id column';
  RAISE NOTICE '✓ Trigger updated to use user_id';
  RAISE NOTICE '';
  RAISE NOTICE 'User signup should now work!';
  RAISE NOTICE '';
END $$;
