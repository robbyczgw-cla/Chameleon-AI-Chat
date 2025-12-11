import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Roboto, JetBrains_Mono, Atkinson_Hyperlegible } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "./keyboard-optimizations.css"
import { Toaster } from "@/components/ui/toaster"
import { PWARegister } from "@/components/pwa-register"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { ChunkErrorHandler } from "@/components/chunk-error-handler"

// Load all font choices
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
})

// Note: OpenDyslexic loaded via @font-face in globals.css (not available in Google Fonts)

export const metadata: Metadata = {
  title: "Chameleon AI Chat - Adapt to Any Conversation",
  description: "Like a chameleon adapting to its environment, this AI chat platform transforms to match your needs with 18+ unique personas, 100+ AI models, and intelligent features",
  generator: "v0.app",
  applicationName: "Chameleon AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chameleon AI",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // ✅ CRITICAL: Enables safe area insets for iOS notch/Dynamic Island
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${roboto.variable} ${jetbrainsMono.variable} ${atkinsonHyperlegible.variable}`}
      >
        {/* CRITICAL: Immediate loading screen for Android PWA cold start */}
        {/* This shows BEFORE React hydrates, preventing black screen */}
        <div
          id="pwa-loading-screen"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            zIndex: 99999,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: '3px solid #333',
                borderTopColor: '#22c55e',
                borderRadius: '50%',
                animation: 'pwa-spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <div style={{ color: '#22c55e', fontSize: 18, fontWeight: 600 }}>
              Chameleon AI
            </div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pwa-spin { to { transform: rotate(360deg); } }
          #pwa-loading-screen.loaded { opacity: 0; pointer-events: none; }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Hide loading screen once React hydrates (or after 5s max)
          var hideLoader = function() {
            var loader = document.getElementById('pwa-loading-screen');
            if (loader) {
              loader.classList.add('loaded');
              setTimeout(function() { loader.remove(); }, 300);
            }
          };
          // React will call this, or fallback after 5s
          window.__hideLoader = hideLoader;
          setTimeout(hideLoader, 5000);
        `}} />
        <ChunkErrorHandler />
        <PWARegister />
        {children}
        <Toaster />
        <Analytics />
        <CookieConsentBanner />
      </body>
    </html>
  )
}
