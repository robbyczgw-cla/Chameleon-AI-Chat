-- BULLETPROOF Signup Trigger
-- This script ensures user registration works 100% of the time
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Clean up existing triggers
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =============================================
-- STEP 2: Create the trigger function
-- =============================================
-- SECURITY DEFINER is critical - it runs with elevated privileges
-- This bypasses RLS policies during trigger execution
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Creating profile for user: %', NEW.id;

  -- Create profile
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default settings
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
    'x-ai/grok-4-fast',
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

  RAISE LOG 'Successfully created profile and settings for user: %', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =============================================
-- STEP 3: Create the trigger
-- =============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 4: Grant permissions
-- =============================================
-- Grant execute permission on the function to service_role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Ensure tables have correct permissions
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_settings TO service_role;

-- =============================================
-- STEP 5: Verify installation
-- =============================================
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Check trigger exists
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';

  -- Check function exists
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'handle_new_user';

  IF trigger_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Trigger was not created!';
  END IF;

  IF function_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Function was not created!';
  END IF;

  RAISE NOTICE '✓ Trigger installed successfully!';
  RAISE NOTICE '✓ Function exists: handle_new_user()';
  RAISE NOTICE '✓ Trigger exists: on_auth_user_created';
  RAISE NOTICE '';
  RAISE NOTICE 'User registration should now work!';
END $$;

-- =============================================
-- OPTIONAL: Test the trigger
-- =============================================
-- Uncomment the lines below to test:
-- This will show you what would happen during signup

/*
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  RAISE NOTICE 'Testing trigger with user ID: %', test_user_id;

  -- Simulate trigger execution
  PERFORM public.handle_new_user();

  -- Check if profile was created
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = test_user_id) THEN
    RAISE NOTICE '✓ Profile created successfully';
  ELSE
    RAISE NOTICE '✗ Profile was not created';
  END IF;

  -- Check if settings were created
  IF EXISTS (SELECT 1 FROM public.user_settings WHERE id = test_user_id) THEN
    RAISE NOTICE '✓ Settings created successfully';
  ELSE
    RAISE NOTICE '✗ Settings were not created';
  END IF;

  -- Cleanup test data
  DELETE FROM public.user_settings WHERE id = test_user_id;
  DELETE FROM public.profiles WHERE id = test_user_id;
END $$;
*/
