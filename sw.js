/* ===================== 서비스 워커 (오프라인 캐시) ===================== */

const CACHE_NAME = 'hogwarts-shadow-v13';
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/style.css',
  './js/data/houses.js', './js/data/rarity.js', './js/data/spells.js', './js/data/enemies.js',
  './js/data/locations.js', './js/data/endings.js',
  './js/data/achievements.js', './js/data/companions.js', './js/data/memories.js',
  './js/data/people.js', './js/data/scenes.js',
  './js/systems/check.js', './js/systems/item.js', './js/systems/loot.js', './js/systems/spell.js',
  './js/systems/achievement.js', './js/systems/settings.js',
  './js/systems/register.js', './js/systems/scene.js',
  './js/state.js', './js/engine.js', './js/ui.js', './js/pwa.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return resp;
        })
        .catch(() => cached);
    })
  );
});
