/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Capacitor Android/iOS builds
  // Set to undefined for web deployment, 'export' for Capacitor builds
  output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : undefined,

  // Trailing slashes needed for static export
  trailingSlash: process.env.CAPACITOR_BUILD === 'true',

  typescript: {
    // TODO: Fix all type errors and set to false
    ignoreBuildErrors: true,
  },
  images: {
    // Disable image optimization for static export (Capacitor)
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
    // Enable modern image formats for 40-60% smaller files
    formats: ['image/avif', 'image/webp'],
    // Cache images for 1 year (they have content-based hashes)
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Optimized device sizes for mobile-first
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for thumbnails and icons
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Turbopack configuration (Next.js 16 default)
  turbopack: {
    // Empty config to silence webpack/turbopack warning
    // PDF.js works fine with Turbopack out of the box
  },
  experimental: {
    turbopackUseSystemTlsCerts: true,
    // Enable optimized package imports for better tree-shaking
    // lucide-react is already optimized by its own package, no need for modularizeImports
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-icons',
      'recharts',
      'react-syntax-highlighter',
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; media-src 'self' blob:; connect-src 'self' https://*.supabase.co https://openrouter.ai https://api.openai.com https://api.anthropic.com https://api.tavily.com https://google.serper.dev https://vercel.live https://*.vercel.live wss://*.vercel.live; frame-src https://vercel.live https://*.vercel.live; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
}
export default nextConfig
