-- Fix the model ID to the correct OpenRouter format
UPDATE user_settings 
SET selected_model = 'openai/gpt-oss-20b'
WHERE selected_model IN ('openrouter/openai/gpt-oss20b', 'openrouter/openai/gpt-oss-20b', 'openai/gpt-oss20b');

UPDATE chats 
SET model = 'openai/gpt-oss-20b'
WHERE model IN ('openrouter/openai/gpt-oss20b', 'openrouter/openai/gpt-oss-20b', 'openai/gpt-oss20b');
