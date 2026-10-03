'use strict';
/* 1학년 자동 플레이 — `node tools/simulate.js [회수]`
   무작위로 선택지를 고르며 끝까지 진행해, 진행 불가·예외·자원 고갈·사건 노출률을 보고한다. */
const { loadGame } = require('./load');
const RUNS = Number(process.argv[2] || 300);

function mulberry(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const g = loadGame();
const { Game, EVENTS, newState } = g;
const seenCount = {};
const stats = { finished: 0, stuck: 0, errors: 0, steps: [], points: [], notice: [], hospital: 0, lowheart: 0, noticeCall: 0, houses: {}, spells: [], memories: [], cards: [], seen: [] };
let firstError = null;

for (let r = 0; r < RUNS; r++) {
  const rnd = mulberry(r * 7919 + 1);
  Game.setRandom(rnd);
  const S = Game.start(newState());
  let steps = 0;
  try {
    while (steps < 2000) {
      steps++;
      const sc = S.screen;
      if (sc.kind === 'yearEnd') break;
      if (sc.kind === 'travel') { Game.pickPlace(sc.hand[Math.floor(rnd() * sc.hand.length)].id); continue; }
      const ev = EVENTS[sc.id];
      if (sc.stage === 'intro') {
        const vis = Game.visibleChoices(ev);
        if (vis.length) { Game.choose(vis[Math.floor(rnd() * vis.length)].i); continue; }
      }
      Game.next();
    }
  } catch (e) {
    stats.errors++;
    if (!firstError) firstError = `run ${r}, ${S.screen && S.screen.id}: ${e.stack}`;
    continue;
  }
  if (S.screen.kind !== 'yearEnd') { stats.stuck++; if (!firstError) firstError = `run ${r} 진행 불가: ${JSON.stringify(S.screen)}`; continue; }
  stats.finished++;
  stats.steps.push(steps);
  stats.points.push(S.res.points);
  stats.houses[S.house] = (stats.houses[S.house] || 0) + 1;
  stats.spells.push(S.spells.length);
  stats.memories.push(S.memories.length);
  stats.cards.push(S.cards.length);
  stats.seen.push(S.seen.length);
  if (S.seen.includes('sp_hospital')) stats.hospital++;
  if (S.seen.includes('sp_lowheart')) stats.lowheart++;
  if (S.seen.includes('sp_notice')) stats.noticeCall++;
  for (const id of S.seen) seenCount[id] = (seenCount[id] || 0) + 1;
}

const avg = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-');
const range = a => (a.length ? `${Math.min(...a)}~${Math.max(...a)}` : '-');
console.log(`${RUNS}회 실행: 완주 ${stats.finished} · 진행 불가 ${stats.stuck} · 예외 ${stats.errors}`);
console.log(`한 회차 화면 수 평균 ${avg(stats.steps)} · 만난 사건 평균 ${avg(stats.seen)} (${range(stats.seen)}) / 전체 ${Object.keys(EVENTS).length}`);
console.log(`기숙사 점수 기여 평균 ${avg(stats.points)} (${range(stats.points)}) · 주문 ${avg(stats.spells)} · 기억 ${avg(stats.memories)} · 카드 ${avg(stats.cards)}`);
console.log(`의무실 ${stats.hospital}회 · 마음 위기 ${stats.lowheart}회 · 사감 호출 ${stats.noticeCall}회 · 기숙사 분포 ${JSON.stringify(stats.houses)}`);
const never = Object.keys(EVENTS).filter(id => !seenCount[id]);
console.log(`한 번도 안 나온 사건 (${never.length}): ${never.join(', ') || '없음'}`);
const rare = Object.keys(EVENTS).filter(id => seenCount[id] && seenCount[id] < RUNS * 0.03).map(id => `${id}(${seenCount[id]})`);
console.log(`드문 사건 (<3%): ${rare.join(', ') || '없음'}`);
if (firstError) { console.log('\n첫 오류:\n' + firstError); process.exit(1); }
