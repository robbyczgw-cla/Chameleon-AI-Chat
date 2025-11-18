-- Add encrypted API keys to user_settings table
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS openrouter_api_key TEXT,
ADD COLUMN IF NOT EXISTS tavily_api_key TEXT;

-- Note: API keys are stored as TEXT. For production use, consider using pgcrypto
-- for encryption at rest. Example: pgp_sym_encrypt('key', 'encryption_password')
-- For now, we rely on Supabase's existing encryption and RLS policies.

COMMENT ON COLUMN public.user_settings.openrouter_api_key IS 'User OpenRouter API Key (protected by RLS)';
COMMENT ON COLUMN public.user_settings.tavily_api_key IS 'User Tavily API Key (protected by RLS)';
