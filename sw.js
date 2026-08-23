/* ===================== 서비스 워커 (오프라인 캐시) ===================== */

const CACHE_NAME = "hogwarts-shade-v11";
/* index.html의 <script> 목록과 반드시 일치해야 한다.
 * addAll은 하나라도 404가 나면 통째로 실패해 오프라인 설치가 조용히 깨진다. */
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/style.css',

  './js/data/houses.js', './js/data/backgrounds.js', './js/data/traits.js',
  './js/data/rarity.js', './js/data/spells.js', './js/data/enemies.js',
  './js/data/people.js', './js/data/fragments.js', './js/data/endings.js',
  './js/data/achievements.js', './js/data/beats.js',
  './js/data/encounters/common.js', './js/data/encounters/search.js',
  './js/data/encounters/combat.js', './js/data/encounters/eerie.js',
  './js/data/encounters/deep.js', './js/data/encounters/saga.js',
  './js/data/encounters/special.js',

  './js/systems/settings.js', './js/systems/ledger.js', './js/systems/check.js',
  './js/systems/item.js', './js/systems/loot.js', './js/systems/spell.js', './js/systems/duel.js', './js/systems/achievement.js',
  './js/systems/register.js', './js/systems/progress.js',

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
