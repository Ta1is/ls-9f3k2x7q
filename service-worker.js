// Bump this version string every time you redeploy (keep it in step with APP_VERSION inside
// index.html). On activate, it deletes every other cache name, which is what forces every
// installed copy of the app to pick up the new files instead of serving stale ones forever.
const CACHE_NAME = 'lineup-studio-v0.025';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isPageRequest(request) {
  return request.mode === 'navigate' || request.url.endsWith('/') || request.url.endsWith('index.html');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (isPageRequest(event.request)) {
    // The app shell itself: always try the network first, so a real update shows up the very
    // next time you're online, not "whenever the background refresh from last time happens to
    // finish." Falls back to the cached copy only when there's truly no connection.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else (icons, manifest) changes rarely, so cache-first is fine and keeps things
  // fast; still refreshes the cache in the background for next time.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
