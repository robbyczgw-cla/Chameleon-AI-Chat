# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email us at [your-email@example.com] instead of using the issue tracker.

## API Key Security

### How API Keys are Handled

This application handles API keys in two ways:

1. **User-provided keys (Recommended for production)**
   - Users enter their own API keys via Settings UI
   - Keys are stored in browser localStorage (client-side only)
   - Keys are never sent to any server except the intended API provider
   - Users have full control over their keys

2. **Environment variables (Optional server-side fallback)**
   - Can be set via `.env.local` (development) or hosting platform (production)
   - Used as fallback if user doesn't provide their own keys
   - Server-side only - never exposed to clients
   - Useful for demo/test instances

### Security Best Practices

#### For Users:
- ✅ **DO**: Enter your own API keys via Settings → API Keys
- ✅ **DO**: Use API key rotation regularly
- ✅ **DO**: Set spending limits on your API provider accounts
- ❌ **DON'T**: Share your API keys with others
- ❌ **DON'T**: Use production keys in shared/public instances

#### For Developers/Deployers:
- ✅ **DO**: Use `.env.local` for local development (gitignored)
- ✅ **DO**: Set environment variables in your hosting platform (Vercel, etc.)
- ✅ **DO**: Keep `.env.example` updated with all required variables
- ❌ **DON'T**: Commit `.env`, `.env.local`, or any file with real keys
- ❌ **DON'T**: Hardcode API keys in the codebase
- ❌ **DON'T**: Share your `.env.local` file

## Environment Variables

### Client-Side (Exposed to Browser)
These variables start with `NEXT_PUBLIC_` and are visible in the browser:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key (safe to expose)

### Server-Side Only (Hidden from Browser)
These variables are only accessible in server-side code:

- `OPENROUTER_API_KEY` - OpenRouter API key (optional fallback)
- `TAVILY_API_KEY` - Tavily search API key (optional fallback)
- `SERPER_API_KEY` - Serper Google Search API key (optional fallback)
- `OPENAI_API_KEY` - OpenAI API key for Whisper/DALL-E (optional fallback)

## Data Storage

- **Local Storage**: User settings and API keys are stored in browser localStorage
- **Supabase**: Chat history, messages, and usage stats (if user is authenticated)
- **No external tracking**: We don't send data to third parties except chosen AI providers

## Supabase Security

### Row Level Security (RLS)
All Supabase tables have RLS enabled to ensure:
- Users can only access their own data
- Authenticated users can't access other users' chats
- API keys are never stored in the database

### Authentication
- Email/password authentication via Supabase Auth
- Optional: Can be extended with OAuth providers (Google, GitHub, etc.)

## Third-Party API Providers

This app may send data to:
- **OpenRouter** - For LLM chat completions (if configured)
- **OpenAI** - For Whisper voice transcription and DALL-E image generation (if configured)
- **Tavily** - For AI-powered web search (if configured)
- **Serper** - For Google Search API (if configured)
- **Supabase** - For data storage and authentication

Always review the privacy policies of these services before using them.

## Secure Deployment Checklist

Before deploying to production:

- [ ] Create a new Supabase project for production
- [ ] Set all environment variables in your hosting platform
- [ ] Enable Supabase Row Level Security (RLS) on all tables
- [ ] Review Supabase Auth settings and enable only needed providers
- [ ] Set up proper CORS policies if deploying to custom domain
- [ ] Enable HTTPS (automatic on Vercel/Netlify)
- [ ] Review and set appropriate rate limits on your API keys
- [ ] Monitor API usage and costs regularly
- [ ] Keep dependencies updated (run `npm audit` regularly)

## License

See [LICENSE](LICENSE) file for details.
