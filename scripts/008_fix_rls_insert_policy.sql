-- FIX RLS POLICIES FÜR user_settings
-- Das ist das eigentliche Problem - INSERT wird blockiert!

-- Drop alle existierenden Policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- Erstelle neue, korrekte Policies
-- WICHTIG: Alle 3 Operationen müssen erlaubt sein!
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update alle existierenden Settings mit korrektem user_id
UPDATE user_settings
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = (
    SELECT email FROM auth.users WHERE id IS NOT NULL LIMIT 1
  )
)
WHERE user_id IS NULL;

-- Mache user_id NOT NULL (jetzt sollte alles korrekt sein)
ALTER TABLE user_settings ALTER COLUMN user_id SET NOT NULL;

-- Stelle sicher dass selected_model einen Default hat
UPDATE user_settings 
SET selected_model = 'openrouter/openai/gpt-oss20b' 
WHERE selected_model IS NULL OR selected_model = '';

-- Erst TRIGGER löschen, DANN Function - richtige Reihenfolge!
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Erstelle user_settings mit EXPLIZITEM user_id
  INSERT INTO public.user_settings (
    user_id,
    selected_model,
    system_prompt,
    temperature,
    max_tokens,
    top_p
  ) VALUES (
    new.id,  -- WICHTIG: Explizit die neue User-ID setzen!
    'openrouter/openai/gpt-oss20b',
    'You are a helpful AI assistant.',
    0.7,
    2048,
    1.0
  );
  
  RETURN new;
END;
$$;

-- Erstelle Trigger neu
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Gib dem Trigger-User alle notwendigen Rechte
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON public.user_settings TO postgres, authenticated;
GRANT ALL ON public.chats TO postgres, authenticated;
GRANT ALL ON public.messages TO postgres, authenticated;
GRANT ALL ON public.folders TO postgres, authenticated;
GRANT ALL ON public.comparison_sessions TO postgres, authenticated;
