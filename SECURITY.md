# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it through [GitHub Security Advisories](https://github.com/robbyczgw-cla/Chameleon-AI-Chat/security/advisories/new) instead of using the public issue tracker. This ensures the vulnerability can be addressed before public disclosure.

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

## Security Headers

This application uses strict security headers:

- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking via DENY
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Legacy XSS protection
- **Referrer-Policy**: Strict origin cross-origin
- **Content-Security-Policy**: Restricts resource loading

## XSS Protection

User-generated content is sanitized using the `lib/sanitize-html.ts` utility which:
- Removes dangerous tags (script, iframe, object, etc.)
- Removes event handlers (onclick, onerror, etc.)
- Validates URLs (blocks javascript: protocol)
- Sanitizes CSS (removes expression(), javascript:, etc.)

## Known Limitations

1. **Browser Storage**: API keys in localStorage are readable by browser extensions. Consider using incognito mode for sensitive keys.
2. **Rate Limiting**: Current in-memory rate limiting doesn't persist across server restarts.
3. **Guest Mode**: Unauthenticated users can access limited functionality. Configure for your use case.

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
- [ ] Run `npm audit` and fix any vulnerabilities
- [ ] Test with security scanning tools (OWASP ZAP, etc.)

## License

See [LICENSE](LICENSE) file for details.
