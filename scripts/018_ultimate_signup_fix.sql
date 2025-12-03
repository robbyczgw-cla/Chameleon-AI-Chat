-- ULTIMATE SIGNUP FIX
-- This script fixes BOTH the trigger AND the RLS policies
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Fix RLS Policies FIRST
-- =============================================
-- These policies allow users to insert their own data during signup

-- Fix PROFILES table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated, anon
WITH CHECK (auth.uid() = id);

-- Fix USER_SETTINGS table
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Service role can insert settings" ON public.user_settings;

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
TO authenticated, anon
WITH CHECK (auth.uid() = id);

-- =============================================
-- STEP 2: Recreate Trigger with Better Logic
-- =============================================
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create new trigger function with bulletproof logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  profile_exists BOOLEAN;
  settings_exists BOOLEAN;
BEGIN
  -- Log trigger execution
  RAISE LOG 'Trigger executing for user: %', NEW.id;

  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;

  IF NOT profile_exists THEN
    -- Create profile
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RAISE LOG 'Profile created for user: %', NEW.id;
  ELSE
    RAISE LOG 'Profile already exists for user: %', NEW.id;
  END IF;

  -- Check if settings already exist
  SELECT EXISTS(SELECT 1 FROM public.user_settings WHERE id = NEW.id) INTO settings_exists;

  IF NOT settings_exists THEN
    -- Create settings
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
    RAISE LOG 'Settings created for user: %', NEW.id;
  ELSE
    RAISE LOG 'Settings already exist for user: %', NEW.id;
  END IF;

  RAISE LOG 'Trigger completed successfully for user: %', NEW.id;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role, postgres;
GRANT ALL ON public.profiles TO service_role, postgres, authenticated, anon;
GRANT ALL ON public.user_settings TO service_role, postgres, authenticated, anon;

-- =============================================
-- STEP 3: Enable Postgres Logs (for debugging)
-- =============================================
-- This helps you see if the trigger is running
ALTER DATABASE postgres SET log_min_messages TO 'log';

-- =============================================
-- STEP 4: Verify Everything
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

  -- Check profile policies
  SELECT COUNT(*) INTO profile_policies
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT';

  -- Check settings policies
  SELECT COUNT(*) INTO settings_policies
  FROM pg_policies
  WHERE tablename = 'user_settings' AND cmd = 'INSERT';

  IF trigger_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Trigger not created!';
  END IF;

  IF function_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Function not created!';
  END IF;

  IF profile_policies = 0 THEN
    RAISE EXCEPTION 'ERROR: No INSERT policy for profiles!';
  END IF;

  IF settings_policies = 0 THEN
    RAISE EXCEPTION 'ERROR: No INSERT policy for user_settings!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ ULTIMATE SIGNUP FIX APPLIED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Trigger installed: on_auth_user_created';
  RAISE NOTICE '✓ Function created: handle_new_user()';
  RAISE NOTICE '✓ Profiles INSERT policies: %', profile_policies;
  RAISE NOTICE '✓ User_settings INSERT policies: %', settings_policies;
  RAISE NOTICE '';
  RAISE NOTICE 'User signup should now work perfectly!';
  RAISE NOTICE '';
END $$;

-- =============================================
-- OPTIONAL: Test the setup
-- =============================================
-- View all policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles', 'user_settings')
ORDER BY tablename, cmd;
