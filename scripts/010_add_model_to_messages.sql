-- Add model column to messages table (it's missing!)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS model text;

-- Update existing messages to have a default model
UPDATE messages SET model = 'openrouter/openai/gpt-oss20b' WHERE model IS NULL;
