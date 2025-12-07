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
