// sw.js — 오프라인 플레이용 서비스 워커.
//
// HTML은 network-first (새 버전이 바로 반영되게), 나머지 정적 파일은
// cache-first (빠르게). 캐시 이름의 버전을 올리면 옛 캐시가 정리된다.

// ⚠️ Cache Storage는 오리진 전체가 공유한다 (duddns313.github.io 아래 모든 앱이 같은 통).
// 그래서 "내 것 말고 다 지우기"를 하면 같은 오리진의 다른 앱 캐시까지 날린다.
// 반드시 자기 접두사만 정리할 것.
const PREFIX = 'glass-coop-';
const VERSION = `${PREFIX}v1`;

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
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k)),
      ))
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
          // 성공한 응답만 캐시한다 — 404를 저장하면 그 주소가 영영 안 열린다
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
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
