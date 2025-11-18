-- Fix RLS policies for user signup
-- This allows users to create their own profiles and settings during signup

-- =============================================
-- FIX PROFILES RLS POLICIES
-- =============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate with proper permissions
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also allow service_role to insert (for trigger)
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- =============================================
-- FIX USER_SETTINGS RLS POLICIES
-- =============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;

-- Recreate with proper permissions
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also allow service_role to insert (for trigger)
CREATE POLICY "Service role can insert settings"
ON public.user_settings
FOR INSERT
TO service_role
WITH CHECK (true);

-- =============================================
-- VERIFY POLICIES
-- =============================================
DO $$
DECLARE
  profile_insert_count INTEGER;
  settings_insert_count INTEGER;
BEGIN
  -- Check profiles INSERT policies
  SELECT COUNT(*) INTO profile_insert_count
  FROM pg_policies
  WHERE tablename = 'profiles'
  AND cmd = 'INSERT';

  -- Check user_settings INSERT policies
  SELECT COUNT(*) INTO settings_insert_count
  FROM pg_policies
  WHERE tablename = 'user_settings'
  AND cmd = 'INSERT';

  IF profile_insert_count < 1 THEN
    RAISE EXCEPTION 'ERROR: No INSERT policies found for profiles table!';
  END IF;

  IF settings_insert_count < 1 THEN
    RAISE EXCEPTION 'ERROR: No INSERT policies found for user_settings table!';
  END IF;

  RAISE NOTICE '✓ Profiles INSERT policies: %', profile_insert_count;
  RAISE NOTICE '✓ User_settings INSERT policies: %', settings_insert_count;
  RAISE NOTICE '';
  RAISE NOTICE 'RLS policies fixed! User signup should now work.';
END $$;
