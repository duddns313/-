// sw.js — 오프라인 플레이용 서비스 워커.
//
// HTML은 network-first (새 버전이 바로 반영되게), 나머지 정적 파일은
// cache-first (빠르게). 캐시 이름의 버전을 올리면 옛 캐시가 정리된다.

const VERSION = 'glass-coop-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/style.css',
  './js/main.js',
  './js/puzzle.js',
  './js/puzzles.js',
  './js/render.js',
  './js/input.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  // HTML은 네트워크 우선 — 안 그러면 업데이트가 안 걸린다
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r ?? caches.match('./index.html'))),
    );
    return;
  }

  e.respondWith(
    caches.match(request).then((hit) => hit ?? fetch(request).then((res) => {
      if (res.ok && new URL(request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(request, copy));
      }
      return res;
    })),
  );
});
