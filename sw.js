/* ===================== 서비스 워커 (오프라인 캐시) ===================== */

// ⚠️ Cache Storage는 오리진 전체가 공유한다 (같은 github.io 도메인의 다른 앱과 한 통).
// 그래서 activate에서 "내 것 말고 다 지우기"를 하면 옆 앱의 오프라인 캐시까지 날린다.
// 반드시 자기 접두사만 정리할 것.
const CACHE_PREFIX = 'hogwarts-shadow-';
// v15: v14 시절 캐시에 404 응답이 저장됐을 수 있어 통째로 버린다.
// (아래 fetch 핸들러가 200이 아닌 응답도 캐시하던 버그 때문)
const CACHE_NAME = `${CACHE_PREFIX}v15`;
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
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
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
          // ⚠️ 성공한 응답만 캐시한다. 이 검사가 없으면 404·500까지 저장돼서,
          //    나중에 그 주소에 파일이 생겨도 계속 옛 오류 응답을 내준다.
          if (resp.ok && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached);
    })
  );
});
