-- Migration: Add secure API keys storage
-- This table stores user API keys securely with Row-Level Security
-- Keys are migrated from localStorage to this table for logged-in users

-- Create the secure API keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL, -- 'openRouter', 'openAI', 'tavily', 'serper', 'exa'
  key_value TEXT NOT NULL, -- The actual API key (consider encryption at rest)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only have one key per type
  UNIQUE(user_id, key_type)
);

-- Create index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);

-- Enable Row-Level Security
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own API keys
CREATE POLICY "Users can view own API keys"
  ON user_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own API keys
CREATE POLICY "Users can insert own API keys"
  ON user_api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys
CREATE POLICY "Users can update own API keys"
  ON user_api_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
  ON user_api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER trigger_update_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Add migration_completed flag to user_settings to track who has migrated
-- This prevents re-migration on every login
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS api_keys_migrated BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE user_api_keys IS 'Secure storage for user API keys with RLS. Migrated from localStorage for better security.';
COMMENT ON COLUMN user_api_keys.key_type IS 'Type of API key: openRouter, openAI, tavily, serper, exa';
COMMENT ON COLUMN user_api_keys.key_value IS 'The actual API key value';
