/* EnergieMIND Partner App — minimal service worker for PWA install */
const SW_VERSION = 'enm-partner-pwa-v1';
const SHELL = [
  '/app/en/',
  '/assets/css/app.css',
  '/assets/js/app.js',
  '/assets/js/form-config.js',
  '/assets/images/logo-light.svg',
  '/assets/images/favicon.svg',
  '/assets/web-app-manifest.json',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SW_VERSION).then(function (cache) {
      return cache.addAll(SHELL).catch(function () {});
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== SW_VERSION; }).map(function (k) {
          return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request).catch(function () {
      if (request.mode === 'navigate') {
        return caches.match('/app/en/').then(function (cached) {
          return cached || Response.error();
        });
      }
      return caches.match(request).then(function (cached) {
        return cached || Response.error();
      });
    })
  );
});
