const CACHE_NAME = 'hauntview-cache-v1';
const OFFLINE_URLS = ['/', '/ghost.png', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('/');
        return cached || new Response('<html><body style="background:#0a0711;color:#fff1dc;font-family:sans-serif;padding:40px;text-align:center;"><h1>HauntView Offline</h1><p>The spirit connection is resting. Reconnect to resume testing.</p></body></html>', {
          headers: { 'Content-Type': 'text/html' },
        });
      })
    );
  }
});
