// StepFlow — Service Worker
// Incrémente ce numéro à chaque déploiement pour forcer la mise à jour du cache.
const CACHE_VERSION = 'stepiflow-v3';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : met en cache les fichiers de base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  // Ne pas activer automatiquement — attendre le signal de l'app
});

// Activation : supprime les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch : sert depuis le cache, sinon va chercher sur le réseau (et met à jour le cache)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // hors ligne : on retombe sur le cache si dispo

      return cached || networkFetch;
    })
  );
});

// Reçoit le signal de l'app pour activer la nouvelle version
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
