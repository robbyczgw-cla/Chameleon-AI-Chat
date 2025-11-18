-- Fix max_tokens check constraint to allow larger values
-- and ensure gpt-oss20b is the default model

-- Drop the old constraint if it exists
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_max_tokens_check;

-- Add new constraint allowing up to 128000 tokens (for large context models)
ALTER TABLE user_settings ADD CONSTRAINT user_settings_max_tokens_check 
  CHECK (max_tokens >= 1 AND max_tokens <= 128000);

-- Update all existing user_settings to have gpt-oss20b as default
UPDATE user_settings 
SET selected_model = 'openrouter/openai/gpt-oss20b'
WHERE selected_model IS NULL OR selected_model = '' OR selected_model LIKE '%polaris%' OR selected_model LIKE '%grok%';

-- Update max_tokens for any existing records that are too low
UPDATE user_settings 
SET max_tokens = 16000
WHERE max_tokens < 4096 OR max_tokens IS NULL;

-- Ensure all user_settings have a user_id
UPDATE user_settings 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = profiles.email 
  LIMIT 1
)
FROM profiles
WHERE user_settings.user_id IS NULL 
  AND user_settings.id = profiles.id;
