'use strict';
/* 1학년 자동 플레이 — `node tools/simulate.js [회수]`
   무작위로 선택지를 고르며 끝까지 진행해, 진행 불가·예외·자원 고갈·사건 노출률을 보고한다. */
const { loadGame } = require('./load');
const RUNS = Number(process.argv[2] || 300);
const GREEDY = process.argv.includes('--greedy');

function mulberry(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const g = loadGame();
const { Game, EVENTS, newState } = g;
const seenCount = {};
const stats = { finished: 0, stuck: 0, errors: 0, steps: [], points: [], notice: [], hospital: 0, lowheart: 0, noticeCall: 0, locked: 0, opened: 0, levels: [], hoStory: 0, rels: {}, houses: {}, spells: [], memories: [], cards: [], seen: [] };
let firstError = null;

for (let r = 0; r < RUNS; r++) {
  const rnd = mulberry(r * 7919 + 1);
  Game.setRandom(rnd);
  const S0 = newState();
  /* 시작 능력치: 기본 1 + 5점을 무작위로 (최대 5) */
  const keys = Object.keys(g.STATS);
  keys.forEach(k => { S0.stats[k] = 1; });
  for (let n = 0; n < 5;) { const k = keys[Math.floor(rnd() * 5)]; if (S0.stats[k] < 5) { S0.stats[k]++; n++; } }
  const S = Game.start(S0);
  let steps = 0;
  try {
    while (steps < 2000) {
      steps++;
      const sc = S.screen;
      if (sc.kind === 'yearEnd') break;
      if (sc.kind === 'travel') {
        /* 가끔 부엉이 주문서에서 물건을 산다 */
        if (rnd() < 0.6) {
          const can = Object.keys(g.ITEMS).filter(k => g.ITEMS[k].price && g.ITEMS[k].price <= S.res.galleon && Game.shopOpen(g.ITEMS[k].shop));
          if (can.length) { const k = can[Math.floor(rnd() * can.length)]; Game.buy(k); stats.bought = (stats.bought || 0) + 1; }
        }
        /* 기운이 낮으면 먹을 것을 먹는다 */
        if (S.res.heart <= 30) for (const k of Object.keys(S.items)) if (S.items[k] > 0 && g.ITEMS[k].use && g.ITEMS[k].use.heart) { Game.useItem(k); break; }
        Game.pickPlace(sc.hand[Math.floor(rnd() * sc.hand.length)].id); continue;
      }
      const ev = EVENTS[sc.id];
      while (S.statPoints > 0) Game.allocate(Object.keys(g.STATS)[Math.floor(rnd() * 5)]);
      if (sc.stage === 'intro') {
        const vis = Game.visibleChoices(ev);
        if (vis.length) {
          let pick = vis[Math.floor(rnd() * vis.length)];
          if (GREEDY) pick = vis.slice().sort((a, b) => g.Rules.chance(S, b.c) - g.Rules.chance(S, a.c))[0];
          stats.locked += Game.lockedChoices(ev).length;
          stats.opened += vis.filter(v => v.c.needs && g.Rules.showableLock(v.c.needs)).length;
          Game.choose(pick.i);
          const ro = Game.retryOptions();
          if (ro.length && rnd() < 0.8) { Game.retry(ro[Math.floor(rnd() * ro.length)].kind); stats.retries = (stats.retries || 0) + 1; }
          continue;
        }
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
  stats.levels.push(S.level);
  if (S.memories.includes('hohyeon_story')) stats.hoStory++;
  for (const k of ['hohyeon', 'hermione', 'ron', 'harry']) (stats.rels[k] = stats.rels[k] || []).push(S.rel[k] || 0);
  if (S.seen.includes('sp_hospital')) stats.hospital++;
  if (S.seen.includes('sp_lowheart')) stats.lowheart++;
  if (S.seen.includes('sp_notice')) stats.noticeCall++;
  for (const id of Object.values(g.STAT_STORIES || {}).flat()) if (S.seen.includes(id)) stats['s_' + id] = (stats['s_' + id] || 0) + 1;
  for (const id of ['sp_curfew', 'y1_quirrell', 'y1_norbert_night', 'fn_common', 'fn_trapdoor', 'fn_dumbledore']) if (S.seen.includes(id)) stats['c_' + id] = (stats['c_' + id] || 0) + 1;
  for (const m of ['quirrell_office', 'lullaby', 'dumbledore_thanks', 'cup_points']) if (S.memories.includes(m)) stats['m_' + m] = (stats['m_' + m] || 0) + 1;
  if (S.flags.obliviated) stats.obliviated = (stats.obliviated || 0) + 1;
  stats.galleonEnd = (stats.galleonEnd || []).concat(S.res.galleon);
  stats.heartLog = (stats.heartLog || []).concat(S.res.heart);
  for (const id of S.seen) seenCount[id] = (seenCount[id] || 0) + 1;
}

const avg = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-');
const range = a => (a.length ? `${Math.min(...a)}~${Math.max(...a)}` : '-');
console.log(`${RUNS}회 실행: 완주 ${stats.finished} · 진행 불가 ${stats.stuck} · 예외 ${stats.errors}`);
console.log(`한 회차 화면 수 평균 ${avg(stats.steps)} · 만난 사건 평균 ${avg(stats.seen)} (${range(stats.seen)}) / 전체 ${Object.keys(EVENTS).length}`);
console.log(`기숙사 점수 기여 평균 ${avg(stats.points)} (${range(stats.points)}) · 주문 ${avg(stats.spells)} · 기억 ${avg(stats.memories)} · 카드 ${avg(stats.cards)}`);
console.log(`의무실 ${stats.hospital}회 · 마음 위기 ${stats.lowheart}회 · 사감 호출 ${stats.noticeCall}회 · 기숙사 분포 ${JSON.stringify(stats.houses)}`);
console.log(`레벨 평균 ${avg(stats.levels)} · 회차당 잠긴 선택지 ${(stats.locked / RUNS).toFixed(1)}개 / 열린 열쇠 선택지 ${(stats.opened / RUNS).toFixed(1)}개 · 호현의 이야기 도달 ${stats.hoStory}/${RUNS}`);
console.log(`위기 도달: ${['sp_curfew', 'y1_quirrell', 'y1_norbert_night', 'fn_common', 'fn_trapdoor', 'fn_dumbledore'].map(k => k + ' ' + (stats['c_' + k] || 0)).join(' · ')}`);
console.log(`위기 기억: ${['quirrell_office', 'lullaby', 'dumbledore_thanks', 'cup_points'].map(k => k + ' ' + (stats['m_' + k] || 0)).join(' · ')} · 망각 ${stats.obliviated || 0}`);
console.log(`회차당 구입 ${((stats.bought || 0) / RUNS).toFixed(1)}개 · 학년말 갈레온 평균 ${avg(stats.galleonEnd || [])} · 학년말 기운 평균 ${avg(stats.heartLog || [])}`);
console.log('특기 이야기: ' + Object.values(g.STAT_STORIES || {}).flat().map(k => k.replace('st_', '') + ' ' + (stats['s_' + k] || 0)).join(' · '));
console.log(`회차당 다시 해 보기 ${((stats.retries || 0) / RUNS).toFixed(1)}회`);
console.log('최종 호감도 평균 ' + Object.entries(stats.rels).map(([k, v]) => `${k} ${avg(v)}`).join(' · '));
const never = Object.keys(EVENTS).filter(id => !seenCount[id]);
console.log(`한 번도 안 나온 사건 (${never.length}): ${never.join(', ') || '없음'}`);
const rare = Object.keys(EVENTS).filter(id => seenCount[id] && seenCount[id] < RUNS * 0.03).map(id => `${id}(${seenCount[id]})`);
console.log(`드문 사건 (<3%): ${rare.join(', ') || '없음'}`);
if (firstError) { console.log('\n첫 오류:\n' + firstError); process.exit(1); }
