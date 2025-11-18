-- Add system prompts table for custom personas
CREATE TABLE IF NOT EXISTS public.system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add usage tracking table for tokens and costs
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(10, 6) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_prompts_user_id ON public.system_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_system_prompts_is_default ON public.system_prompts(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_chat_id ON public.usage_tracking(chat_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON public.usage_tracking(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_prompts
CREATE POLICY "Users can view their own system prompts" ON public.system_prompts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own system prompts" ON public.system_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own system prompts" ON public.system_prompts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own system prompts" ON public.system_prompts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view their own usage tracking" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage tracking" ON public.usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own usage tracking" ON public.usage_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON public.system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some default system prompts for new users
CREATE OR REPLACE FUNCTION create_default_system_prompts()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.system_prompts (user_id, name, description, prompt, is_default)
  VALUES
    (NEW.id, 'Standard', 'Default AI assistant', 'You are a helpful AI assistant.', TRUE),
    (NEW.id, 'Code Expert', 'Programming and technical help', 'You are an expert programmer and software engineer. Provide clear, well-documented code examples and explain technical concepts thoroughly.', FALSE),
    (NEW.id, 'Creative Writer', 'Creative and narrative assistance', 'You are a creative writing assistant. Help with storytelling, character development, and engaging narratives. Be imaginative and descriptive.', FALSE),
    (NEW.id, 'Professional', 'Business and formal communication', 'You are a professional business assistant. Communicate in a formal, clear, and concise manner suitable for business contexts.', FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_prompts_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_system_prompts();
