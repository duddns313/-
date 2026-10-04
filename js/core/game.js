'use strict';
/* 게임 흐름: 턴 → 정사 사건 → 행선지 카드 → 장소 사건 → 다음 턴
   주사위 없음. 선택지는 열쇠와 대가로 열리고, 고른 대로 일어난다. ❤️·💭가 0이면 게임 오버. */

const Game = (() => {
  let S = null;
  let rnd = Math.random;
  const REWINDS_PER_YEAR = 3;

  const state = () => S;
  function setRandom(fn) { rnd = fn; }
  function start(newS) { S = newS || newState(); if (!S.screen) advance(); return S; }

  function dateLabel(ev) {
    if (ev && ev.date) return Rules.text(S, ev.date);
    return (CALENDAR[S.year] && CALENDAR[S.year][S.turn]) || '';
  }

  /* ── 진행 ── */
  function advance() {
    if (S.screen && S.screen.kind === 'gameover') return;
    if (S.queue.length) return showEvent(S.queue.shift());
    if (S.stage === 'travel') return showTravel();
    if (S.turn >= TURNS_PER_YEAR + 1) return showYearEnd();
    /* 프롤로그가 끝난 순간을 기억해 두었다가, 다음 판에서 건너뛸 수 있게 한다 */
    if (S.turn === 0 && S.year === 1) savePrologue(S);
    S.turn++;
    turnStart();
    return advance();
  }

  function turnStart() {
    S.stage = S.turn <= TURNS_PER_YEAR ? 'travel' : 'done';
    const q = [];
    /* 학교생활의 피로 — 짝수 주엔 몸이, 홀수 주엔 마음이 한 칸 닳는다. 피로만으로 쓰러지지는 않는다(1에서 멈춘다) */
    S.weekNote = null;
    if (S.turn >= 2 && S.turn <= TURNS_PER_YEAR) {
      const k = S.turn % 2 === 0 ? 'hp' : 'mind';
      if (S.res[k] > 1) { S.res[k]--; S.weekNote = k; }
    }
    /* 쓰러지기 직전, 1년에 한 번씩 누군가 붙잡아 준다 */
    if (S.res.hp === 1 && !S.flags.mercy_hp && EVENTS.sp_lowhp) q.push('sp_lowhp');
    if (S.res.mind === 1 && !S.flags.mercy_mind && EVENTS.sp_lowmind) q.push('sp_lowmind');
    /* 평판이 부르는 사건 — 두 주에 한 번쯤 */
    if (S.turn >= 2 && S.turn <= TURNS_PER_YEAR && S.turn - (S.repTurn || 0) >= 2) {
      const tier = S.res.rep >= 4 ? 'high' : S.res.rep <= 2 ? 'low' : null;
      if (tier) {
        const pool = Object.values(EVENTS).filter(ev => ev.repEvent === tier && (ev.year || 1) === S.year && !S.seen.includes(ev.id) && Rules.meets(S, ev.needs));
        if (pool.length) { q.push(pool[Math.floor(rnd() * pool.length)].id); S.repTurn = S.turn; }
      }
    }
    const canon = Object.values(EVENTS)
      .filter(ev => ev.turn === S.turn && (ev.year || 1) === S.year && !S.seen.includes(ev.id) && Rules.meets(S, ev.needs))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    for (const ev of canon) q.push(ev.id);
    const due = S.later.filter(l => l.turn <= S.turn);
    S.later = S.later.filter(l => l.turn > S.turn);
    for (const l of due) if (EVENTS[l.id] && Rules.meets(S, EVENTS[l.id].needs)) q.push(l.id);
    S.queue.push(...q);
  }

  function showEvent(id) {
    const ev = EVENTS[id];
    if (!ev) { console.warn('없는 사건', id); return advance(); }
    if (ev.needs && !Rules.meets(S, ev.needs)) return advance();
    if (!S.seen.includes(id)) S.seen.push(id);
    if (ev.skipTravel) S.stage = 'done';
    let chips = [];
    if (ev.fx) chips = Rules.apply(S, ev.fx, rnd);
    S.screen = { kind: 'event', id, stage: 'intro', date: dateLabel(ev), chips };
    if (checkGameOver()) return;
    if (!openChoices(ev).length && ev.next) S.queue.unshift(...Rules.asList(ev.next));
    saveGame(S);
  }

  /* ── 선택지: 열린 것 / 잠긴 것 / (다른 길이 다 막혔을 때만) 대신하는 것 ── */
  function choiceStates(ev) {
    const all = (ev.choices || []).map((c, i) => ({ c, i }));
    const ok = ({ c }) => Rules.meets(S, c.needs) && Rules.affordable(S, c);
    const main = all.filter(x => !x.c.fallback);
    const safeMain = main.filter(x => ok(x) && !Rules.lethal(S, x.c));
    const open = [], locked = [];
    for (const x of all) {
      if (x.c.fallback) {
        if (!safeMain.length && Rules.meets(S, x.c.needs)) open.push(Object.assign({ fallback: true }, x));
        continue;
      }
      if (ok(x)) { open.push(Object.assign({ lethal: Rules.lethal(S, x.c) }, x)); continue; }
      if (x.c.secret) continue;
      if (!Rules.meets(S, x.c.needs) && !Rules.showableLock(x.c.needs)) continue;
      locked.push(x);
    }
    return { open, locked };
  }
  const openChoices = ev => choiceStates(ev).open;
  const visibleChoices = openChoices;
  const lockedChoices = ev => choiceStates(ev).locked;

  function choose(index) {
    const ev = EVENTS[S.screen.id];
    const choice = ev.choices[index];
    if (!choice || S.screen.stage !== 'intro' || !openChoices(ev).some(x => x.i === index)) return;
    /* 되감기를 위해 고르기 직전을 보관한다 */
    const snapshot = JSON.stringify(Object.assign({}, S, { screen: null }));
    const thanks = Rules.thanksFor(choice.needs);
    const ez = Rules.eased(S, choice);
    if (ez) thanks.push(...Rules.thanksFor(ez.needs));
    /* 대가를 치른다 */
    const cost = Rules.costOf(S, choice);
    const pay = {};
    for (const k of ['hp', 'mind', 'rep', 'galleon']) if (cost[k]) pay[k] = -cost[k];
    let chips = Rules.apply(S, pay, rnd);
    const outcome = choice.outcome || {};
    let fx = typeof outcome.fx === 'function' ? outcome.fx(S) : outcome.fx;
    if (choice.consume && choice.needs && choice.needs.item) fx = Object.assign({}, fx, { loseItem: Rules.asList(fx && fx.loseItem).concat(Rules.asList(choice.needs.item)) });
    chips = chips.concat(Rules.apply(S, fx, rnd));
    S.screen = Object.assign({}, S.screen, {
      stage: 'result', choice: index, thanks,
      undo: ev.type === 'special' || ev.noRewind || !JSON.parse(snapshot).flags.rewind_known ? null : snapshot,
      text: Rules.text(S, outcome.text),
      introChips: S.screen.introChips || S.screen.chips || [],
      chips: (S.screen.introChips || S.screen.chips || []).concat(chips),
    });
    S.log.push({ y: S.year, t: S.turn, title: Rules.text(S, ev.title), choice: Rules.text(S, choice.label) });
    if (S.log.length > 200) S.log.shift();
    if (outcome.next) S.queue.unshift(...Rules.asList(outcome.next));
    if (checkGameOver()) return;
    saveGame(S);
  }

  /* ── 게임 오버: 처음부터 ── */
  function checkGameOver() {
    if (S.res.hp > 0 && S.res.mind > 0) return false;
    S.screen = { kind: 'gameover', cause: S.res.hp <= 0 ? 'hp' : 'mind', date: dateLabel(), prev: S.screen && S.screen.id };
    clearSave();
    return true;
  }

  /* ── 호현의 되감기: 1년에 세 번. 쓸수록 호현이 힘들어한다. 영운만 기억한다. ── */
  function rewindInfo() {
    const sc = S.screen;
    if (!sc || sc.kind !== 'event' || sc.stage !== 'result' || !sc.undo) return null;
    const used = S.rewinds || 0;
    if (used >= REWINDS_PER_YEAR) return null;
    return { left: REWINDS_PER_YEAR - used, nth: used + 1, cost: used + 1 === 2 ? { mind: 1 } : null };
  }
  const REWIND_NOTE = {
    1: '*세상이 한 번 깜박였다. 귀가 먹먹해지고, 다음 순간 영운은 몇 분 전의 자리에 서 있었다. 저만치에서 호현이 관자놀이를 누르고 있었다. 눈이 마주치자 호현은 아무 일 없다는 듯 웃었다.*',
    2: '*세상이 다시 깜박였다. 이번에는 더 길게. 정신을 차렸을 때 호현의 인중에 붉은 줄이 그어져 있었다. 코피였다. 호현은 소매로 그것을 훔치며 말했다. "건조해서 그래." 영운은 그 말을 믿지 않았다. 믿을 수가 없었다.*',
    3: '*세 번째로 세상이 깜박였다. 그리고 이번에는, 호현이 그 자리에 무릎을 꿇었다.*',
  };
  function rewind() {
    const info = rewindInfo();
    if (!info) return false;
    if (info.cost && S.res.mind <= info.cost.mind) return false;
    const sc = S.screen;
    const restored = JSON.parse(sc.undo);
    for (const k of Object.keys(S)) delete S[k];
    Object.assign(S, restored);
    S.rewinds = info.nth;
    S.screen = { kind: 'event', id: sc.id, stage: 'intro', date: sc.date, chips: [], rewound: info.nth, note: REWIND_NOTE[info.nth] };
    if (info.cost) S.screen.chips = Rules.apply(S, { mind: -info.cost.mind }, rnd);
    if (info.nth === 3) S.later.push({ id: 'ho_rewind_fall', turn: S.turn });
    S.flags['rewind_' + info.nth] = true;
    saveGame(S);
    return true;
  }

  function next() {
    if (!S.screen) return advance();
    const k = S.screen.kind;
    if (k === 'gameover') return;
    if (k === 'event') {
      const ev = EVENTS[S.screen.id];
      if (S.screen.stage === 'intro' && openChoices(ev).length) return;
    }
    if (k === 'travel') return;
    /* 되감기 세 번째: 호현이 쓰러진다 — 다음 장면 바로 앞에 끼워 넣는다 */
    const due = S.later.filter(l => l.id === 'ho_rewind_fall');
    if (due.length && EVENTS.ho_rewind_fall && !S.seen.includes('ho_rewind_fall')) {
      S.later = S.later.filter(l => l.id !== 'ho_rewind_fall');
      S.queue.unshift('ho_rewind_fall');
    }
    advance();
    saveGame(S);
  }

  /* ── 행선지 카드 ── */
  /* 평판이 낮으면 필치가 따라다녀 밤에만 갈 수 있는 곳이 닫힌다 */
  const nightClosed = () => S.res.rep <= 2;
  function eligiblePlaceEvents(pid) {
    return Object.values(EVENTS).filter(ev =>
      ev.place === pid && !ev.turn && ev.type !== 'special' && !ev.repEvent && (ev.year || 1) === S.year &&
      !(PLACES[pid].night && nightClosed()) &&
      (ev.repeat ? true : !S.seen.includes(ev.id)) &&
      Rules.meets(S, ev.needs));
  }

  function cardInfo(pid) {
    const evs = eligiblePlaceEvents(pid);
    const hints = [];
    if (evs.some(e => e.priority)) hints.push('⭐');
    if (evs.some(e => e.who && !e.repeat)) hints.push('💛');
    if (PLACES[pid].danger) hints.push('⚠️');
    return { id: pid, count: evs.length, hints, fresh: evs.some(e => !e.repeat || !S.seen.includes(e.id)) };
  }

  function showTravel() {
    const all = Object.keys(PLACES).map(cardInfo).filter(c => c.count > 0);
    const safe = all.find(c => c.id === 'common');
    let rest = all.filter(c => c.id !== 'common');
    const hand = [];
    const take = c => { hand.push(c); rest = rest.filter(x => x.id !== c.id); };
    const starred = shuffle(rest.filter(c => c.hints.includes('⭐')));
    if (starred.length) take(starred[0]);
    while (hand.length < 2 && rest.length) {
      const pool = rest.flatMap(c => Array(c.fresh ? 3 : 1).fill(c));
      take(pool[Math.floor(rnd() * pool.length)]);
    }
    if (safe) hand.push(safe);
    S.screen = { kind: 'travel', hand: hand.map(c => ({ id: c.id, hints: c.hints })), date: dateLabel(), nightClosed: nightClosed(), weekNote: S.weekNote };
    saveGame(S);
  }

  function pickPlace(pid) {
    if (!S.screen || S.screen.kind !== 'travel') return;
    const evs = eligiblePlaceEvents(pid);
    if (!evs.length) return;
    S.visits = S.visits || {};
    S.visits[pid] = (S.visits[pid] || 0) + 1;
    const top = Math.max(...evs.map(e => e.priority || 0));
    let pool = evs.filter(e => (e.priority || 0) === top);
    const fresh = pool.filter(e => !e.repeat || !S.seen.includes(e.id));
    if (fresh.length) pool = fresh;
    const total = pool.reduce((a, e) => a + (e.weight || 10), 0);
    let r = rnd() * total, pick = pool[0];
    for (const e of pool) { r -= e.weight || 10; if (r <= 0) { pick = e; break; } }
    S.stage = 'done';
    showEvent(pick.id);
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function showYearEnd() {
    S.screen = { kind: 'yearEnd', date: dateLabel() };
    saveGame(S);
  }

  /* 부엉이 주문서 */
  function shopOpen(shopId) { return Rules.meets(S, SHOPS[shopId].needs); }
  /* 쌍둥이의 동업자는 쌍둥이 물건을 원가에 산다 */
  function priceOf(id) {
    const it = ITEMS[id];
    return Math.max(1, it.price - (it.shop === 'twins' && S.flags.twins_discount ? 1 : 0));
  }
  function buy(id) {
    const it = ITEMS[id];
    if (!it || !it.price || !shopOpen(it.shop) || S.res.galleon < priceOf(id)) return null;
    const chips = Rules.apply(S, { galleon: -priceOf(id), item: id }, rnd);
    saveGame(S);
    return chips;
  }

  /* 소지품 사용 (먹을 것) */
  function useItem(id) {
    const it = ITEMS[id];
    if (!it || !it.use || !(S.items[id] > 0)) return null;
    S.items[id]--;
    const chips = Rules.apply(S, it.use, rnd);
    saveGame(S);
    return chips;
  }

  /* 프롤로그 건너뛰고 시작 */
  function skipPrologue() {
    const snap = loadPrologue();
    if (!snap) return null;
    S = snap;
    S.screen = null;
    advance();
    return S;
  }

  return { start, state, setRandom, advance, choose, next, pickPlace, visibleChoices, openChoices, lockedChoices, choiceStates, rewindInfo, rewind, buy, priceOf, shopOpen, useItem, dateLabel, eligiblePlaceEvents, skipPrologue, REWINDS_PER_YEAR };
})();
