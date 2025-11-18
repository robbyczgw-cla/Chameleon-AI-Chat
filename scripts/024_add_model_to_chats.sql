-- Migration: Add model column to chats table
-- Date: 2025-11-13
-- Description: Add model selection persistence to chats table

-- Add model column to chats table
ALTER TABLE public.chats
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'x-ai/grok-4-fast';

-- Add comment for documentation
COMMENT ON COLUMN public.chats.model IS 'The AI model selected for this chat (e.g., x-ai/grok-4-fast, anthropic/claude-opus, etc.)';
