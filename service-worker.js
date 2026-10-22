// Bump this version string every time you redeploy (keep it in step with APP_VERSION inside
// index.html). On activate, it deletes every other cache name, which is what forces every
// installed copy of the app to pick up the new files instead of serving stale ones forever.
const CACHE_NAME = 'lineup-studio-v0.023';
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

// Stale-while-revalidate: answer instantly from cache (so it works offline and feels fast),
// while quietly fetching a fresh copy in the background for next time. Falls back to cache
// if the network request fails (e.g. genuinely offline).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
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
