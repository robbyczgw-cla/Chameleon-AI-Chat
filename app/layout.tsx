import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "./keyboard-optimizations.css"
import "./material-motion.css"
import { Toaster } from "@/components/ui/toaster"
import { PWARegister } from "@/components/pwa-register"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { ChunkErrorHandler } from "@/components/chunk-error-handler"
import { CapacitorInit } from "@/components/capacitor-init"
import { NativeErrorBoundary } from "@/components/native-error-boundary"

// Note: OpenDyslexic loaded via @font-face in globals.css (not available in Google Fonts)
// Note: Google Fonts disabled to allow offline builds; we use system stacks via CSS vars.

export const metadata: Metadata = {
  title: "Chameleon AI Chat - Adapt to Any Conversation",
  description: "The AI chat with real-time cost tracking, 31 expert personas, and training data export. 100+ AI models via OpenRouter. Know exactly what you're spending.",
  generator: "Next.js",
  applicationName: "Chameleon AI Chat",
  authors: [{ name: "Chameleon AI Chat Contributors" }],
  keywords: ["AI chat", "ChatGPT alternative", "cost tracking", "AI personas", "OpenRouter", "LLM", "fine-tuning", "training data"],
  openGraph: {
    title: "Chameleon AI Chat - Stop Guessing Your AI Costs",
    description: "The only AI chat with real-time cost tracking, 31 expert personas, and training data export. 100+ AI models. Know exactly what you're spending.",
    url: "https://chameleon-ai-chat.vercel.app",
    siteName: "Chameleon AI Chat",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chameleon AI Chat - Stop Guessing Your AI Costs",
    description: "31 AI personas + 100+ models with real-time cost tracking. Export training data for fine-tuning.",
  },
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
      <body>
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
          // Hide loading screen once React hydrates
          var hideLoader = function() {
            var loader = document.getElementById('pwa-loading-screen');
            if (loader) {
              loader.classList.add('loaded');
              setTimeout(function() { loader.remove(); }, 300);
            }
            window.__reactLoaded = true;
            // Clear reload flags on successful load
            try {
              localStorage.removeItem('pwa-reload-attempted');
              localStorage.setItem('pwa-last-successful-load', Date.now().toString());
            } catch(e) {}
          };
          window.__hideLoader = hideLoader;
          window.__reactLoaded = false;

          // ANDROID PWA FIX: Detect if we're in standalone mode (PWA)
          var isAndroidPWA = /Android/.test(navigator.userAgent) &&
                            (window.matchMedia('(display-mode: standalone)').matches ||
                             window.navigator.standalone === true);

          // ANDROID PWA FIX: Check if service worker is dead/unresponsive
          // This is the main cause of blank screen after hours of idle
          var checkSWHealth = function() {
            if (!('serviceWorker' in navigator)) return Promise.resolve(true);

            return new Promise(function(resolve) {
              // If no controller, SW might be dead - this is normal on first load
              // but problematic on PWA resume
              if (!navigator.serviceWorker.controller) {
                console.log('[PWA] No SW controller - may need reload');
                resolve(false);
                return;
              }

              // Try to ping the SW with a timeout
              var timeout = setTimeout(function() {
                console.log('[PWA] SW health check timeout');
                resolve(false);
              }, 2000);

              var channel = new MessageChannel();
              channel.port1.onmessage = function() {
                clearTimeout(timeout);
                resolve(true);
              };

              try {
                navigator.serviceWorker.controller.postMessage({ type: 'HEALTH_CHECK' }, [channel.port2]);
              } catch(e) {
                clearTimeout(timeout);
                console.log('[PWA] SW message failed:', e);
                resolve(false);
              }
            });
          };

          // ANDROID PWA FIX: Aggressive recovery for dead SW scenario
          var attemptRecovery = function() {
            var reloadCount = parseInt(localStorage.getItem('pwa-reload-count') || '0');
            var lastReload = parseInt(localStorage.getItem('pwa-last-reload') || '0');
            var now = Date.now();

            // Reset reload count if last reload was more than 5 minutes ago
            if (now - lastReload > 300000) {
              reloadCount = 0;
            }

            // Allow up to 2 reload attempts within 5 minutes
            if (reloadCount < 2) {
              localStorage.setItem('pwa-reload-count', (reloadCount + 1).toString());
              localStorage.setItem('pwa-last-reload', now.toString());
              console.log('[PWA] Attempting recovery reload #' + (reloadCount + 1));

              // Force unregister and re-register SW on second attempt
              if (reloadCount === 1 && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  registrations.forEach(function(r) { r.unregister(); });
                  setTimeout(function() { location.reload(); }, 100);
                });
              } else {
                location.reload();
              }
            } else {
              // Show manual retry button after 2 failed attempts
              var loader = document.getElementById('pwa-loading-screen');
              if (loader) {
                loader.innerHTML = '<div style="text-align:center;padding:20px"><div style="color:#ef4444;font-size:18px;margin-bottom:12px">App failed to load</div><div style="color:#888;font-size:14px;margin-bottom:16px">Try closing the app completely and reopening</div><button onclick="localStorage.clear();location.reload()" style="background:#22c55e;color:#000;border:none;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer">Force Reload</button></div>';
              }
            }
          };

          // ANDROID PWA FIX: Check SW health immediately on Android PWA
          if (isAndroidPWA) {
            // Check if we were idle for a long time (indicates cold start after suspension)
            var lastLoad = parseInt(localStorage.getItem('pwa-last-successful-load') || '0');
            var idleTime = Date.now() - lastLoad;

            if (idleTime > 60000) { // More than 1 minute since last successful load
              console.log('[PWA] Android PWA cold start detected, idle time: ' + Math.round(idleTime/1000) + 's');

              // Quick SW health check
              checkSWHealth().then(function(healthy) {
                if (!healthy && !window.__reactLoaded) {
                  console.log('[PWA] SW unhealthy on Android PWA cold start');
                  // Give React a brief chance to load, then recover
                  setTimeout(function() {
                    if (!window.__reactLoaded) {
                      attemptRecovery();
                    }
                  }, 3000);
                }
              });
            }
          }

          // Standard fallback: If React hasn't loaded after 6 seconds
          setTimeout(function() {
            if (!window.__reactLoaded) {
              console.log('[PWA] React failed to load within 6s');
              attemptRecovery();
            }
          }, 6000);

          // ANDROID PWA FIX: Listen for visibility change to detect resume from suspension
          document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible' && !window.__reactLoaded) {
              console.log('[PWA] App became visible but React not loaded - checking...');
              setTimeout(function() {
                if (!window.__reactLoaded) {
                  attemptRecovery();
                }
              }, 2000);
            }
          });
        `}} />
        <ChunkErrorHandler />
        <PWARegister />
        <CapacitorInit />
        <NativeErrorBoundary>
          {children}
        </NativeErrorBoundary>
        <Toaster />
        <Analytics />
        <CookieConsentBanner />
      </body>
    </html>
  )
}
