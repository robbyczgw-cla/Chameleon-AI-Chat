// Service Worker for AI Chat Interface PWA
// Version increment to clear old caches (increment on every fix that needs cache bust)
const CACHE_VERSION = 'v2.3.0'
const CACHE_NAME = `ai-chat-${CACHE_VERSION}`
const RUNTIME_CACHE = `ai-chat-runtime-${CACHE_VERSION}`
const SIMPLE_MODE_CACHE = `ai-chat-simple-${CACHE_VERSION}`

// iOS PWA DETECTION: Detect if running as iOS PWA
const isIOSPWA = () => {
  const isIOS = /iPhone|iPad|iPod/.test(navigator?.userAgent || '')
  const isStandalone = self.registration?.scope && !navigator?.userAgent?.includes('Safari')
  return isIOS || isStandalone
}

// AGGRESSIVE PRECACHING: All critical routes and assets
// This ensures the app works instantly even after being backgrounded
const PRECACHE_ASSETS = [
  // Core app shell
  '/',
  '/manifest.json',

  // Critical icons (for instant splash screen)
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/chameleon-icon.svg',
  '/icon.svg',
  '/chameleon-logo.jpg',

  // Auth routes (frequently accessed)
  '/auth/login',
  '/auth/sign-up',

  // Legal pages (static, cache-friendly)
  '/privacy',
  '/terms',
  '/cookies',
]

// SIMPLE MODE specific assets - lightweight, essential only
const SIMPLE_MODE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
]

// Assets to cache opportunistically (not critical for app shell)
const RUNTIME_PRECACHE = [
  '/auth/sign-up-success',
  '/auth/error',
  '/placeholder.svg',
  '/placeholder-logo.svg',
  '/placeholder-logo.png',
]

// Timeouts - balanced for first load vs cached experience
// INCREASED: First deployment needs more time for cold start
const NETWORK_TIMEOUT_NAVIGATION = 3000  // 3 seconds for pages (increased for cold start)
const NETWORK_TIMEOUT_ASSET = 2000       // 2 seconds for assets (increased for first load)
const NETWORK_TIMEOUT_RESUME = 500       // 0.5 seconds when resuming from background

// Track if we're resuming from background
let isResuming = false
let lastActiveTime = Date.now()

// Install event - precache ALL critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.3.0 with improved first-load handling')
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Precaching critical assets...')

      // Precache critical assets (fail gracefully for each)
      const precacheResults = await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' })
            if (response.ok) {
              await cache.put(url, response)
              console.log('[SW] ✓ Precached:', url)
            }
          } catch (error) {
            console.warn('[SW] ✗ Failed to precache:', url)
          }
        })
      )

      // Also precache runtime assets in background (non-blocking)
      setTimeout(() => {
        RUNTIME_PRECACHE.forEach(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' })
            if (response.ok) {
              const runtimeCache = await caches.open(RUNTIME_CACHE)
              await runtimeCache.put(url, response)
              console.log('[SW] ✓ Runtime precached:', url)
            }
          } catch (error) {
            // Silent fail for runtime precache
          }
        })
      }, 1000)

      console.log('[SW] Precaching complete')
    })
  )
  // Force the waiting service worker to become active immediately
  self.skipWaiting()
})

// Activate event - clean up old caches and claim all clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches that don't match current version
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Taking control of all clients')
      return self.clients.claim()
    })
  )
})

// Helper function to fetch with dynamic timeout and proper redirect handling
function fetchWithTimeout(request, timeout) {
  // Create a new request with redirect: 'follow' to handle redirects properly
  const fetchRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    mode: 'same-origin',
    credentials: 'same-origin',
    redirect: 'follow', // CRITICAL: Follow redirects instead of failing
  })

  return Promise.race([
    fetch(fetchRequest),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    ),
  ])
}

// Get appropriate timeout based on app state
function getNavigationTimeout() {
  const now = Date.now()
  const timeSinceActive = now - lastActiveTime

  // If resuming from background (more than 10 seconds inactive), use ultra-fast timeout
  if (timeSinceActive > 10000) {
    console.log('[SW] Detected resume from background - using instant cache')
    return NETWORK_TIMEOUT_RESUME
  }

  return NETWORK_TIMEOUT_NAVIGATION
}

// SIMPLIFIED: Network-first navigation with cache fallback
// Let the browser handle redirects naturally - only use cache when offline
async function handleNavigation(event) {
  const request = event.request
  const url = new URL(request.url)
  const pathname = url.pathname

  console.log('[SW] Navigation request:', pathname)

  try {
    // NETWORK FIRST: Let browser handle the request normally
    // This ensures redirects work properly
    const networkResponse = await fetch(request)

    // Cache successful non-redirect responses for offline use
    if (networkResponse && networkResponse.ok && !networkResponse.redirected) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone()).catch(() => {})
      console.log('[SW] Cached navigation response:', pathname)
    }

    return networkResponse

  } catch (error) {
    // NETWORK FAILED: Fall back to cache
    console.log('[SW] Network failed, trying cache:', pathname, error.message)

    // Try exact URL from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[SW] ⚡ Serving from cache:', pathname)
      return cachedResponse
    }

    // Try home page as fallback
    const homeResponse = await caches.match('/')
    if (homeResponse) {
      console.log('[SW] Using cached home as fallback')
      return homeResponse
    }

    // Return offline page
    console.log('[SW] Returning offline page')
    return createOfflinePage()
  }
}

// Create an attractive offline page
function createOfflinePage() {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#22c55e">
  <title>Chameleon AI - Loading</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 1.5rem;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(0.95); }
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #22c55e;
    }
    p {
      color: #888;
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #333;
      border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    button {
      background: #22c55e;
      color: #000;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover {
      background: #16a34a;
      transform: scale(1.02);
    }
    button:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="container">
    <svg class="logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="#22c55e" stroke-width="2" fill="none"/>
      <path d="M30 50 Q50 30 70 50 Q50 70 30 50" fill="#22c55e" opacity="0.8"/>
      <circle cx="40" cy="45" r="5" fill="#fff"/>
    </svg>
    <div class="spinner"></div>
    <h1>Reconnecting...</h1>
    <p>The app is loading. If this takes too long, check your internet connection.</p>
    <button onclick="location.reload()">Refresh</button>
  </div>
  <script>
    // Auto-retry connection
    let retryCount = 0;
    const maxRetries = 5;

    function checkConnection() {
      if (retryCount >= maxRetries) return;

      fetch('/', { method: 'HEAD', cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            location.reload();
          } else {
            scheduleRetry();
          }
        })
        .catch(() => scheduleRetry());
    }

    function scheduleRetry() {
      retryCount++;
      setTimeout(checkConnection, 2000 * retryCount);
    }

    // Start checking after 2 seconds
    setTimeout(checkConnection, 2000);

    // Also check when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkConnection();
      }
    });
  </script>
</body>
</html>`,
    {
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      })
    }
  )
}

// Handle asset requests (CSS, JS, images)
async function handleAsset(event) {
  const request = event.request

  // Cache-first strategy for instant loading
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    // Return cached version, update in background
    fetchWithTimeout(request, NETWORK_TIMEOUT_ASSET)
      .then(async (freshResponse) => {
        // Only cache non-redirected responses
        if (freshResponse && freshResponse.ok && !freshResponse.redirected) {
          const cache = await caches.open(RUNTIME_CACHE)
          await cache.put(request, freshResponse)
        }
      })
      .catch(() => {})

    return cachedResponse
  }

  // Not in cache - fetch and cache
  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT_ASSET)

    if (networkResponse && networkResponse.ok) {
      // Only cache non-redirected responses
      if (!networkResponse.redirected) {
        const cache = await caches.open(RUNTIME_CACHE)
        cache.put(request, networkResponse.clone()).catch(() => {})
      }
      return networkResponse
    }

    return networkResponse
  } catch (error) {
    // Network failed and not in cache
    if (request.destination === 'image') {
      return createPlaceholderImage()
    }

    // Don't return 503 - let the browser handle the failure and retry
    // Returning 503 from SW causes cascade failures on first load
    // Instead, re-throw to let the browser's native fetch handle it
    throw error
  }
}

// Create placeholder image for offline
function createPlaceholderImage() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect fill="#1a1a2e" width="100" height="100"/>
      <text x="50" y="50" font-family="system-ui" font-size="12" fill="#666" text-anchor="middle" dy=".3em">Offline</text>
    </svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } }
  )
}

// Main fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return
  }

  // CRITICAL: Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip API calls - always use network
  if (url.pathname.startsWith('/api/') ||
      url.hostname.includes('supabase') ||
      url.hostname.includes('openrouter') ||
      url.hostname.includes('tavily')) {
    return
  }

  // CRITICAL: Skip ALL _next/static requests - let browser handle chunks directly
  // This prevents 503 errors on first load after deployment when cache is cold
  if (url.pathname.startsWith('/_next/static')) {
    // Don't intercept Next.js chunks, CSS, or other static assets
    // Browser will handle these directly with proper retry logic
    return
  }

  // Skip PDF.js worker and other module files - they need special handling
  // Let the browser load them directly without Service Worker interference
  if (url.pathname.endsWith('.mjs') ||
      url.pathname.endsWith('.wasm') ||
      url.pathname.includes('pdf.worker')) {
    console.log('[SW] Skipping worker/module file:', url.pathname)
    return
  }

  // DON'T intercept navigation requests - let browser handle them
  // This completely avoids all redirect issues
  if (event.request.mode === 'navigate') {
    // Only respond if we're offline and have a cached version
    event.respondWith(
      fetch(event.request).catch(async () => {
        console.log('[SW] Navigation failed, trying cache')
        const cached = await caches.match(event.request)
        if (cached) return cached
        const home = await caches.match('/')
        if (home) return home
        return createOfflinePage()
      })
    )
    return
  }

  // Handle all other requests (assets) with cache-first
  event.respondWith(handleAsset(event))
})

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting()
        break

      case 'CACHE_URLS':
        if (event.data.urls && Array.isArray(event.data.urls)) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.addAll(event.data.urls).catch(() => {})
          })
        }
        break

      case 'APP_RESUMED':
        // Client telling us app resumed from background
        console.log('[SW] App resumed - using instant cache mode')
        isResuming = true
        setTimeout(() => { isResuming = false }, 5000)
        break

      case 'HEARTBEAT':
        // Update last active time
        lastActiveTime = Date.now()
        break

      case 'PRECACHE_ROUTE':
        // Precache a specific route
        if (event.data.url) {
          caches.open(RUNTIME_CACHE).then(async (cache) => {
            try {
              const response = await fetch(event.data.url)
              if (response.ok) {
                await cache.put(event.data.url, response)
                console.log('[SW] Precached route:', event.data.url)
              }
            } catch (error) {
              // Silent fail
            }
          })
        }
        break

      // iOS PWA OPTIMIZATION: Handle simple mode setup
      case 'SIMPLE_MODE_INIT':
        console.log('[SW] Simple mode initialized - optimizing for mobile')
        caches.open(SIMPLE_MODE_CACHE).then(async (cache) => {
          // Cache essential simple mode assets
          for (const url of SIMPLE_MODE_ASSETS) {
            try {
              const response = await fetch(url, { cache: 'reload' })
              if (response.ok) {
                await cache.put(url, response)
                console.log('[SW] Simple mode cached:', url)
              }
            } catch (e) {
              // Silent fail
            }
          }
        })
        break

      // iOS PWA OPTIMIZATION: Persist critical data before app suspension
      case 'PERSIST_DATA':
        // This is called before iOS suspends the PWA
        console.log('[SW] iOS suspension detected - data persisted via client')
        lastActiveTime = Date.now()
        break

      // iOS PWA OPTIMIZATION: Clear stale caches
      case 'CLEAR_STALE_CACHE':
        console.log('[SW] Clearing stale caches for iOS PWA')
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (!cacheName.includes(CACHE_VERSION)) {
              caches.delete(cacheName)
              console.log('[SW] Deleted stale cache:', cacheName)
            }
          })
        })
        break
    }
  }
})

// Push notification support
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New message',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Chameleon AI', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus()
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
    )
  }
})

console.log('[SW] Service Worker v2.3.0 loaded - Fixed first-load chunk handling, skip _next/static, no 503 errors')
