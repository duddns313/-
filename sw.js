/* 오프라인 캐시 — 파일을 바꾸면 VERSION을 올린다 */
const VERSION = 'hp7-v10';
const FILES = [
  './', 'index.html', 'manifest.json', 'css/style.css', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/data/meta.js', 'js/core/state.js', 'js/core/rules.js', 'js/core/game.js',
  'js/data/year1/prologue.js', 'js/data/year1/canon_autumn.js', 'js/data/year1/canon_spring.js',
  'js/data/year1/places_castle.js', 'js/data/year1/places_grounds.js', 'js/data/year1/bonds.js', 'js/data/year1/crisis.js', 'js/data/year1/stories.js', 'js/data/year1/system.js',
  'js/ui/settings.js', 'js/ui/ui.js', 'js/main.js', 'js/pwa.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
    }
    return res;
  }).catch(() => hit)));
});
