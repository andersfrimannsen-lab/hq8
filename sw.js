const CACHE_NAME = 'hopeful-quotes-v7';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/index.css',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
    // Music files have been removed from precaching for faster installation
    // and to prevent installation failure if files are missing.
    // They will be cached on-demand by the fetch event listener.
];

// On install, cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache and caching static assets');
            return cache.addAll(STATIC_ASSETS);
        }).catch(err => {
            console.error('Failed to cache static assets:', err);
        })
    );
    self.skipWaiting();
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// On fetch, serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;

    // All requests follow a cache-first strategy for performance and offline capability.
    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }
            // Fetch from network, then cache the new response
            return fetch(request).then(networkResponse => {
                // Check for a valid response to cache
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseToCache);
                });
                return networkResponse;
            });
        })
    );
});