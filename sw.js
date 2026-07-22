// #ENJOY Vault — app shell service worker
// Caches the static shell (HTML/CSS/JS/icons) so the app opens instantly and
// works offline. Firestore data itself is already cached separately via
// Firestore's own persistentLocalCache (see firebase-config.js) — this only
// handles the static files that make up the app's UI.

const CACHE_NAME = 'enjoy-vault-shell-v1';
const SHELL_FILES = [
  'index.html',
  'dashboard.html',
  'guest.html',
  'style.css',
  'firebase-config.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only manage our own same-origin shell files. Everything else (Firebase,
  // Firestore, ImgBB, Google APIs) passes straight through to the network —
  // those already have their own caching/offline strategy.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
