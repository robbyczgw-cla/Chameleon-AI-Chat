// Service Worker for AI Chat Interface PWA
// Version increment to clear old caches (increment on every fix that needs cache bust)
const CACHE_VERSION = 'v1.0.8'
const CACHE_NAME = `ai-chat-${CACHE_VERSION}`
const RUNTIME_CACHE = `ai-chat-runtime-${CACHE_VERSION}`
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
]

// ULTRA-AGGRESSIVE timeouts for instant loading (prefer cache over slow network)
const NETWORK_TIMEOUT_PAGE = 1000  // 1 second max for pages (was 5s)
const NETWORK_TIMEOUT_ASSET = 500  // 0.5 seconds max for assets (was 3s)

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets')
      // Don't fail installation if precache fails
      return cache.addAll(PRECACHE_ASSETS).catch((error) => {
        console.warn('[SW] Precache partial failure:', error.message)
        // Continue anyway - it's ok if precache fails
        return Promise.resolve()
      })
    })
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Found caches:', cacheNames)
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
      console.log('[SW] Cache cleanup complete, claiming clients')
      return self.clients.claim()
    }).catch((error) => {
      console.error('[SW] Activation failed:', error)
    })
  )
})

// Helper function to fetch with timeout
function fetchWithTimeout(request, timeout = NETWORK_TIMEOUT_ASSET) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    ),
  ])
}

// Fetch event - use stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // CRITICAL FIX: Only handle GET requests - Cache API doesn't support POST/PUT/DELETE
  // This prevents "Request method 'POST' is unsupported" errors
  if (event.request.method !== 'GET') {
    return
  }

  // Skip API calls - always fetch from network without caching
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('supabase') ||
      event.request.url.includes('openrouter') ||
      event.request.url.includes('tavily')) {
    return
  }

  // For navigation requests (HTML pages), use network-first with longer timeout
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(event.request, NETWORK_TIMEOUT_PAGE)
        .then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache).catch((err) => {
                console.error('[SW] Cache put error:', err)
              })
            }).catch(() => {
              // Silently fail if cache open fails
            })
          }
          return response
        })
        .catch((error) => {
          console.log('[SW] Navigation fetch error:', error.message)
          // Network failed, try cache
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('[SW] Using cached page')
                return cachedResponse
              }

              // Try to return cached home page as fallback
              return caches.match('/').then((homeResponse) => {
                if (homeResponse) {
                  console.log('[SW] Using cached home page as fallback')
                  return homeResponse
                }

                // No cache, return offline page
                console.log('[SW] No cache available, returning offline page')
                return new Response(
                  '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fff}div{text-align:center}</style></head><body><div><h1>Offline</h1><p>No internet connection. Please check your connection.</p></div></body></html>',
                  {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                      'Content-Type': 'text/html; charset=utf-8'
                    })
                  }
                )
              })
            })
            .catch(() => {
              // If even cache fails, return error response
              return new Response(
                '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Error</title><style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;color:#fff}div{text-align:center}</style></head><body><div><h1>Error</h1><p>The app could not be loaded. Please try refreshing the page.</p></div></body></html>',
                {
                  status: 500,
                  statusText: 'Server Error',
                  headers: new Headers({
                    'Content-Type': 'text/html; charset=utf-8'
                  })
                }
              )
            })
        })
    )
    return
  }

  // For other requests (CSS, JS, images), use cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version while fetching fresh copy in background
        // This is the "stale-while-revalidate" pattern
        fetchWithTimeout(event.request)
          .then((freshResponse) => {
            if (freshResponse && freshResponse.status === 200) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, freshResponse).catch((err) => {
                  console.error('[SW] Background update error:', err)
                })
              })
            }
          })
          .catch(() => {
            // Background update failed, that's ok - we have the cached version
          })
        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetchWithTimeout(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache).catch((err) => {
                console.error('[SW] Cache put error:', err)
              })
            })
          }
          return response
        })
        .catch((error) => {
          console.error('[SW] Fetch error for', event.request.url, ':', error.message)
          // Network failed and not in cache
          if (event.request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#ccc" width="100" height="100"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            )
          }
          // For other assets, return empty response or error
          return new Response('', { status: 503 })
        })
    })
  )
})

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})

// Push notification support (for future features)
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
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('AI Chat', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
