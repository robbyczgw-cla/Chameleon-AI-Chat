-- Remove the trigger completely - we'll handle user_settings creation in code instead

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users CASCADE;

-- Drop function if exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Clean up any broken records
DELETE FROM user_settings WHERE user_id IS NULL;
DELETE FROM profiles WHERE id IS NULL;

-- Make sure RLS policies are correct
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can create own settings" ON user_settings;

-- Create one simple INSERT policy
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Make sure SELECT, UPDATE policies exist
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);
