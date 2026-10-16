/* Inu Chicken POS V10 PWA: cache hanya file aplikasi & CDN library, bukan API Supabase */
const CACHE = 'inu-pos-v10-pwa-3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const CDN_HOSTS = new Set(['cdn.jsdelivr.net']);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('inu-pos-v10-pwa-') && k !== CACHE).map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin) {
    if (event.request.mode === 'navigate') {
      event.respondWith(fetch(event.request).then(response => {
        if (response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put('./index.html',copy)); }
        return response;
      }).catch(() => caches.match('./index.html')));
    } else {
      event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
    }
  } else if (CDN_HOSTS.has(url.hostname) && url.pathname.includes('/npm/')) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok || response.type === 'opaque') {
        const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    })));
  }
});
