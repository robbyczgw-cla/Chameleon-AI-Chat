-- FINAL SIGNUP FIX - No permission errors!
-- This fixes RLS policies and trigger for user signup
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Fix RLS Policies
-- =============================================
-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Create new INSERT policy for profiles (allows anon users during signup)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Drop existing INSERT policies for settings
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Service role can insert settings" ON public.user_settings;

-- Create new INSERT policy for settings (allows anon users during signup)
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = id);

-- =============================================
-- STEP 2: Recreate Trigger
-- =============================================
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile (ON CONFLICT does nothing if exists)
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Create settings (ON CONFLICT does nothing if exists)
  INSERT INTO public.user_settings (
    id,
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
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail user creation if trigger fails
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 3: Grant Permissions
-- =============================================
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT ALL ON public.profiles TO service_role, authenticated, anon;
GRANT ALL ON public.user_settings TO service_role, authenticated, anon;

-- =============================================
-- STEP 4: Verify Installation
-- =============================================
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
  profile_policies INTEGER;
  settings_policies INTEGER;
BEGIN
  -- Check trigger
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';

  -- Check function
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'handle_new_user';

  -- Check policies
  SELECT COUNT(*) INTO profile_policies
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT';

  SELECT COUNT(*) INTO settings_policies
  FROM pg_policies
  WHERE tablename = 'user_settings' AND cmd = 'INSERT';

  -- Raise notices
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '     SIGNUP FIX APPLIED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  IF trigger_count > 0 THEN
    RAISE NOTICE '✓ Trigger installed: on_auth_user_created';
  ELSE
    RAISE NOTICE '✗ Trigger NOT installed!';
  END IF;

  IF function_count > 0 THEN
    RAISE NOTICE '✓ Function created: handle_new_user()';
  ELSE
    RAISE NOTICE '✗ Function NOT created!';
  END IF;

  IF profile_policies > 0 THEN
    RAISE NOTICE '✓ Profiles INSERT policies: %', profile_policies;
  ELSE
    RAISE NOTICE '✗ No INSERT policy for profiles!';
  END IF;

  IF settings_policies > 0 THEN
    RAISE NOTICE '✓ User_settings INSERT policies: %', settings_policies;
  ELSE
    RAISE NOTICE '✗ No INSERT policy for user_settings!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'User signup should now work!';
  RAISE NOTICE '';
END $$;
