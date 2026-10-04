'use strict';
/* 1학년 자동 플레이 (v8) — `node tools/simulate.js [회수] [--policy=careful|random|greedy|all]`
   세 가지 플레이 성향으로 끝까지 돌려 게임 오버율 · 자원 흐름 · 사건 노출률을 본다.
   - careful: 쓰러질 선택은 피하고, 자원이 2 이하면 쉬고 먹는다
   - random : 열린 선택지 중 아무거나 (쓰러질 선택도 고른다)
   - greedy : 특별 보상(주문·기억·물건)이 있는 선택을 먼저, 쓰러지지만 않으면 대가를 아끼지 않는다 */
const { loadGame } = require('./load');
const RUNS = Number((process.argv.find(a => /^\d+$/.test(a))) || 300);
const PARG = (process.argv.find(a => a.startsWith('--policy=')) || '--policy=all').split('=')[1];
const POLICIES = PARG === 'all' ? ['careful', 'random', 'greedy'] : [PARG];
const VERBOSE = process.argv.includes('-v');

function mulberry(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const g = loadGame();
const { Game, EVENTS, ITEMS, Rules, newState } = g;
const avg = a => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-');

function run(policy) {
  const st = { finished: 0, over: 0, overTurn: [], overCause: {}, errors: 0, seen: {}, mem: [], spells: [], items: [], rep: {}, rewinds: [], hpByTurn: {}, mindByTurn: {}, end: [], forcedFallback: 0, lethalPicks: 0, bought: 0, chose: 0, paid: 0 };
  let firstError = null;
  for (let r = 0; r < RUNS; r++) {
    const rnd = mulberry(r * 7919 + 13);
    Game.setRandom(rnd);
    const S = Game.start(newState());
    let steps = 0;
    try {
      while (steps++ < 3000) {
        const sc = S.screen;
        if (sc.kind === 'yearEnd' || sc.kind === 'gameover') break;
        if (sc.kind === 'travel') {
          (st.hpByTurn[S.turn] = st.hpByTurn[S.turn] || []).push(S.res.hp);
          (st.mindByTurn[S.turn] = st.mindByTurn[S.turn] || []).push(S.res.mind);
          /* 사고 먹기 */
          if (policy !== 'random' || rnd() < 0.5) {
            const want = policy === 'careful' ? ['pasty', 'frog', 'pepperup', 'bezoar', 'biscuits', 'gum', 'dungbomb', 'fireworks', 'gloves', 'wintercloak'] : Object.keys(ITEMS);
            const can = want.filter(k => ITEMS[k].price && Game.priceOf(k) <= S.res.galleon && Game.shopOpen(ITEMS[k].shop));
            if (can.length && rnd() < 0.5) { Game.buy(can[Math.floor(rnd() * can.length)]); st.bought++; }
          }
          if (policy !== 'random' && (S.res.hp <= 2 || S.res.mind <= 2)) {
            for (const k of Object.keys(S.items)) {
              const u = S.items[k] > 0 && ITEMS[k].use;
              if (u && ((S.res.hp <= 2 && u.hp) || (S.res.mind <= 2 && u.mind))) { Game.useItem(k); break; }
            }
          }
          let pick = sc.hand[Math.floor(rnd() * sc.hand.length)].id;
          if (policy === 'careful' && (S.res.hp <= 2 || S.res.mind <= 2) && sc.hand.some(c => c.id === 'common')) pick = 'common';
          Game.pickPlace(pick);
          continue;
        }
        const ev = EVENTS[sc.id];
        if (sc.stage === 'intro') {
          const open = Game.openChoices(ev);
          if (open.length) {
            let pool = open;
            if (policy !== 'random') { const safe = open.filter(x => !x.lethal); if (safe.length) pool = safe; }
            const gain = x => { let f = x.c.outcome && x.c.outcome.fx; try { if (typeof f === 'function') f = f(S); } catch (e) { f = null; } return f || {}; };
            if (policy === 'careful') {
              const low = S.res.hp <= 2 || S.res.mind <= 2;
              const healers = pool.filter(x => (S.res.hp <= 2 && gain(x).hp > 0) || (S.res.mind <= 2 && gain(x).mind > 0));
              const free = pool.filter(x => { const k = Rules.costOf(S, x.c); return !k.hp && !k.mind; });
              if (low && healers.length) pool = healers; else if (low && free.length) pool = free;
            }
            if (policy === 'greedy') {
              const rich = pool.filter(x => Rules.specialRewards(S, x.c).length);
              if (rich.length) pool = rich;
            }
            const pick = pool[Math.floor(rnd() * pool.length)];
            if (pick.fallback) st.forcedFallback++;
            if (pick.lethal) st.lethalPicks++;
            const k = Rules.costOf(S, pick.c);
            if (k.hp || k.mind || k.rep) st.paid++;
            st.chose++;
            Game.choose(pick.i);
            if (S.screen.kind === 'gameover') break;
            /* 되감기: random은 가끔, greedy는 비싼 대가를 치른 뒤에 */
            const rw = Game.rewindInfo();
            if (rw && ((policy === 'random' && rnd() < 0.08) || (policy === 'greedy' && (k.hp >= 2 || k.mind >= 2) && rw.nth < 3))) Game.rewind();
            continue;
          }
        }
        Game.next();
      }
    } catch (e) {
      st.errors++;
      if (!firstError) firstError = `run ${r}, ${S.screen && S.screen.id}: ${e.stack}`;
      continue;
    }
    for (const id of S.seen) st.seen[id] = (st.seen[id] || 0) + 1;
    if (S.screen.kind === 'gameover') {
      st.over++; st.overTurn.push(S.turn); st.overCause[S.screen.cause] = (st.overCause[S.screen.cause] || 0) + 1;
      if (VERBOSE && st.over <= 3) console.log(`  게임 오버 run ${r}: ${S.turn}주 ${S.screen.prev} — ${S.log.slice(-4).map(l => l.choice).join(' / ')}`);
      continue;
    }
    if (S.screen.kind !== 'yearEnd') { st.errors++; if (!firstError) firstError = `run ${r} 진행 불가: ${JSON.stringify(S.screen).slice(0, 200)}`; continue; }
    st.finished++;
    st.mem.push(S.memories.length); st.spells.push(S.spells.length);
    st.items.push(Object.values(S.items).reduce((a, b) => a + b, 0));
    st.rep[S.res.rep] = (st.rep[S.res.rep] || 0) + 1;
    st.rewinds.push(S.rewinds || 0);
    st.end.push(S.res.hp + S.res.mind);
  }
  return { st, firstError };
}

for (const policy of POLICIES) {
  const { st, firstError } = run(policy);
  console.log(`\n■ ${policy} — ${RUNS}회: 완주 ${st.finished} · 게임 오버 ${st.over} (${(st.over / RUNS * 100).toFixed(0)}%, 평균 ${avg(st.overTurn)}주, ${JSON.stringify(st.overCause)}) · 오류 ${st.errors}`);
  console.log(`  주별 ❤️ ${Object.keys(st.hpByTurn).map(t => avg(st.hpByTurn[t])).join(' ')}`);
  console.log(`  주별 💭 ${Object.keys(st.mindByTurn).map(t => avg(st.mindByTurn[t])).join(' ')}`);
  console.log(`  대가를 치른 선택 ${(st.paid / Math.max(1, st.chose) * 100).toFixed(0)}% · fallback ${st.forcedFallback} · 쓰러질 선택 ${st.lethalPicks} · 구입 ${(st.bought / RUNS).toFixed(1)}/회`);
  console.log(`  완주 시: 기억 ${avg(st.mem)} · 주문 ${avg(st.spells)} · 물건 ${avg(st.items)} · 되감기 ${avg(st.rewinds)} · 평판 ${JSON.stringify(st.rep)} · 남은 ❤️+💭 ${avg(st.end)}`);
  const never = Object.keys(EVENTS).filter(id => !st.seen[id]);
  if (policy === POLICIES[0] || VERBOSE) console.log(`  한 번도 안 나온 사건 (${never.length}): ${never.join(', ') || '없음'}`);
  if (firstError) { console.log('\n첫 오류:\n' + firstError); process.exitCode = 1; }
}
