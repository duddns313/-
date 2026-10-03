'use strict';
/* 게임 흐름: 턴 → 정사 사건 → 행선지 카드 → 장소 사건 → 다음 턴 */

const Game = (() => {
  let S = null;
  let rnd = Math.random;
  const GRADE_NAME = { crit: '대성공', success: '성공', fail: '아쉬움', fumble: '엉망진창' };

  const state = () => S;
  function setRandom(fn) { rnd = fn; }
  function start(newS) { S = newS || newState(); if (!S.screen) advance(); return S; }

  function dateLabel(ev) {
    if (ev && ev.date) return Rules.text(S, ev.date);
    return (CALENDAR[S.year] && CALENDAR[S.year][S.turn]) || '';
  }

  /* ── 진행 ── */
  function advance() {
    if (S.queue.length) return showEvent(S.queue.shift());
    if (S.stage === 'travel') return showTravel();
    if (S.turn >= TURNS_PER_YEAR + 1) return showYearEnd();
    S.turn++;
    turnStart();
    return advance();
  }

  /* 기운은 매주 닳고, 주목도는 천천히 식는다 */
  const HEART_DRAIN = 10, NOTICE_CURFEW = 20, NOTICE_CALL = 40;
  function turnStart() {
    S.stage = S.turn <= TURNS_PER_YEAR ? 'travel' : 'done';
    if (S.turn > 1) {
      S.res.notice = Math.max(0, S.res.notice - 2);
      S.res.heart = Math.max(0, S.res.heart - HEART_DRAIN);   /* 학교생활은 고단하다 — 쉬고 먹고 웃어야 채워진다 */
    }
    const q = [];
    if (S.res.heart <= 0) q.push('sp_hospital');
    else if (S.res.heart <= 15 && EVENTS.sp_lowheart) q.push('sp_lowheart');
    if (S.res.notice >= NOTICE_CALL) q.push('sp_notice');
    else if (S.res.notice >= NOTICE_CURFEW && !(S.curfewUntil >= S.turn) && EVENTS.sp_curfew) q.push('sp_curfew');
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
    if (!visibleChoices(ev).length && ev.next) S.queue.unshift(...Rules.asList(ev.next));
    saveGame(S);
  }

  function visibleChoices(ev) {
    return (ev.choices || []).map((c, i) => ({ c, i })).filter(({ c }) => Rules.meets(S, c.needs));
  }
  /* 조건이 모자라 잠긴 선택지 — 보여 주되 누를 수 없다 (도전 의식) */
  function lockedChoices(ev) {
    return (ev.choices || []).map((c, i) => ({ c, i }))
      .filter(({ c }) => !c.secret && !Rules.meets(S, c.needs) && Rules.showableLock(c.needs))
      .map(x => Object.assign(x, { need: Rules.needLabels(S, x.c.needs) }));
  }

  /* ── 성장: 경험이 쌓이면 레벨이 오르고, 능력치는 직접 고른다 ── */
  const XP_PER_LEVEL = 60;
  const XP_GAIN = { crit: 12, success: 10, fail: 14, fumble: 16 };
  function gainXp(n) {
    const chips = [];
    const before = Math.floor(S.xp / XP_PER_LEVEL);
    S.xp += n;
    const after = Math.floor(S.xp / XP_PER_LEVEL);
    if (after > before) {
      S.level += after - before;
      S.statPoints += after - before;
      chips.push({ t: `⬆️ ${S.level}단계로 성장 — 능력치를 직접 올릴 수 있다`, good: true, big: true, levelUp: true });
    }
    return chips;
  }
  function allocate(stat) {
    if (!(S.statPoints > 0) || !STATS[stat]) return false;
    S.statPoints--;
    S.stats[stat]++;
    saveGame(S);
    return true;
  }

  /* opts: { extra: 성공률 보정, note: 결과 앞에 붙는 한 줄, retried: true } */
  function choose(index, opts) {
    opts = opts || {};
    const ev = EVENTS[S.screen.id];
    const choice = ev.choices[index];
    if (!choice || !Rules.meets(S, choice.needs) || S.screen.stage !== 'intro') return;
    /* 다시 굴리기를 위해 고르기 직전의 상태를 보관한다 */
    const snapshot = JSON.stringify(Object.assign({}, S, { screen: null }));
    let grade = null, c = null, outcome;
    if (Rules.statOf(S, choice)) {
      c = Math.max(5, Math.min(95, Rules.chance(S, choice) + (opts.extra || 0)));
      grade = Rules.roll(c, rnd);
      outcome = Rules.pickOutcome(choice.outcomes, grade);
    } else {
      outcome = choice.outcome || Rules.pickOutcome(choice.outcomes, 'success');
    }
    const extraText = [];
    const statKey = Rules.statOf(S, choice);
    /* 판정에 쓴 능력치가 그 자리에서 바로 오르지는 않는다 — 대신 경험이 된다 (한 능력치만 키우는 것을 막는다) */
    let fx = typeof outcome.fx === 'function' ? outcome.fx(S) : outcome.fx;
    /* 사건 속 작은 위로는 조금만 채운다 — 크게 채우는 건 쉬기·먹기·친구의 몫 */
    if (fx && ev.type !== 'special') {
      const up = (fx.heart > 0 ? fx.heart : 0) + (fx.hp > 0 ? fx.hp : 0);
      if (up > 0) { fx = Object.assign({}, fx); if (fx.heart > 0) fx.heart = Math.max(1, Math.round(fx.heart * 0.6)); if (fx.hp > 0) fx.hp = Math.max(1, Math.round(fx.hp * 0.6)); }
    }
    let bonusXp = 0;
    if (statKey && fx && fx[statKey] > 0) { fx = Object.assign({}, fx); bonusXp += 4 * fx[statKey]; delete fx[statKey]; }
    const thanks = Rules.thanksFor(choice.needs);
    if (statKey) {
      const bs = Rules.bonuses(S, choice);
      for (const b of bs) if (b.value > 0 && b.kind !== 'fresh') thanks.push(`${b.label} 덕분에 성공률 +${b.value}`);
      if (bs.some(b => b.kind === 'fresh')) bonusXp += 4;
      if (opts.helpLabel) thanks.push(opts.helpLabel);
      S.recent = (S.recent || []).concat(statKey).slice(-8);
    }
    let chips = Rules.apply(S, fx, rnd);
    if (choice.stat && !(choice.outcomes || {})[grade]) {
      if (grade === 'crit') chips = chips.concat(Rules.apply(S, { heart: 5 }, rnd));
      if (grade === 'fumble') chips = chips.concat(Rules.apply(S, { heart: -5 }, rnd));
    }
    if (ev.streak) {
      const k = ev.streak.key;
      if (grade === 'success' || grade === 'crit') S.streaks[k] = (S.streaks[k] || 0) + 1;
      else if (grade) S.streaks[k] = 0;
      if (S.streaks[k] >= ev.streak.need) {
        S.flags['streak_' + k] = true;
        extraText.push(Rules.text(S, ev.streak.done.text));
        chips = chips.concat(Rules.apply(S, ev.streak.done.fx, rnd));
      }
    }
    chips = chips.concat(gainXp((grade ? XP_GAIN[grade] : 6) + bonusXp));
    S.screen = Object.assign({}, S.screen, {
      stage: 'result', choice: index, grade, chance: c, thanks,
      undo: grade === 'fail' || grade === 'fumble' ? snapshot : null,
      retried: !!opts.retried,
      text: [opts.note || '', Rules.text(S, outcome.text)].concat(extraText).filter(Boolean).join('\n\n'),
      introChips: S.screen.introChips || S.screen.chips || [],
      chips: (S.screen.introChips || S.screen.chips || []).concat(chips),
    });
    S.log.push({ y: S.year, t: S.turn, title: Rules.text(S, ev.title), choice: Rules.text(S, choice.label), grade: grade ? GRADE_NAME[grade] : null });
    if (S.log.length > 200) S.log.shift();
    if (outcome.next) S.queue.unshift(...Rules.asList(outcome.next));
    saveGame(S);
  }

  /* ── 다시 해 보기: 호현의 병뚜껑 부적 / 친구에게 도움 청하기 (한 턴에 각각 한 번) ── */
  const HELPERS = ['hohyeon', 'hermione', 'ron', 'harry', 'neville'];
  /* 받침에 따라 조사 고르기 (호현이/헤르미온느가) */
  function josa(word, withBatchim, without) {
    const c = word.charCodeAt(word.length - 1) - 0xAC00;
    return c >= 0 && c <= 11171 && c % 28 ? withBatchim : without;
  }
  function retryOptions() {
    const sc = S.screen;
    if (!sc || sc.kind !== 'event' || sc.stage !== 'result' || !sc.undo || sc.retried) return [];
    const out = [];
    if (S.items.hohyeon_cap > 0 && S.charmTurn !== S.turn) out.push({ kind: 'charm', label: '🪙 호현의 병뚜껑을 쥐고, 한 번 더', sub: '이번 턴에 한 번' });
    if (S.helpTurn !== S.turn) {
      const ev = EVENTS[sc.id];
      const cand = HELPERS.filter(k => (S.rel[k] || 0) >= 40).sort((a, b) => (ev.who === b) - (ev.who === a) || S.rel[b] - S.rel[a]);
      if (cand[0]) out.push({ kind: 'friend', who: cand[0], label: `💛 ${PEOPLE[cand[0]].short}에게 도움을 청한다`, sub: '성공률 +15 · 이번 턴에 한 번' });
    }
    return out;
  }
  function retry(kind) {
    const opt = retryOptions().find(o => o.kind === kind);
    if (!opt) return false;
    const sc = S.screen;
    const restored = JSON.parse(sc.undo);
    for (const k of Object.keys(S)) delete S[k];
    Object.assign(S, restored, { screen: Object.assign({}, sc, { stage: 'intro', undo: null, chips: sc.introChips || [] }) });
    if (kind === 'charm') {
      S.charmTurn = S.turn;
      choose(sc.choice, { retried: true, note: '*영운은 주머니 속 병뚜껑을 꽉 쥐었다. 찌그러진 식혜 병뚜껑. 호현이 기차에서 쥐여 준 부적. 숨을 한 번 고르고—한 번 더.*' });
    } else {
      S.helpTurn = S.turn;
      const name = PEOPLE[opt.who].short;
      const lines = {
        hohyeon: '"윤, 내가 할게. 너는 그쪽 봐." 호현이 어느새 옆에 와 있었다.',
        hermione: '"아니야, 이렇게 해 봐." 헤르미온느가 영운의 손목을 잡아 각도를 고쳐 주었다.',
        ron: '"야, 같이 하자." 론이 귀까지 빨개진 채 옆에 섰다.',
        harry: '해리가 아무 말 없이 영운 옆에 섰다. 그것만으로 충분했다.',
        neville: '"나, 나도 도울게." 네빌이 떨리는 목소리로, 그래도 물러서지 않고 말했다.',
      };
      choose(sc.choice, { retried: true, extra: 15, helpLabel: `💛 ${name}${josa(name, '이', '가')} 함께해서 성공률 +15`, note: `*${lines[opt.who]}*` });
      S.screen.chips = S.screen.chips.concat(Rules.apply(S, { rel: { [opt.who]: 2 } }, rnd));
    }
    saveGame(S);
    return true;
  }

  function next() {
    if (!S.screen) return advance();
    const k = S.screen.kind;
    if (k === 'event') {
      const ev = EVENTS[S.screen.id];
      if (S.screen.stage === 'intro' && visibleChoices(ev).length) return;
    }
    if (k === 'travel') return;
    advance();
    saveGame(S);
  }

  /* ── 행선지 카드 ── */
  function eligiblePlaceEvents(pid) {
    return Object.values(EVENTS).filter(ev =>
      ev.place === pid && !ev.turn && ev.type !== 'special' && (ev.year || 1) === S.year &&
      !(PLACES[pid].night && S.curfewUntil >= S.turn) &&
      (ev.repeat ? !(ev.streak && S.flags['streak_' + ev.streak.key]) : !S.seen.includes(ev.id)) &&
      Rules.meets(S, ev.needs));
  }

  function cardInfo(pid) {
    const evs = eligiblePlaceEvents(pid);
    const hints = [];
    if (evs.some(e => e.priority)) hints.push('⭐');
    if (evs.some(e => e.who && !e.repeat)) hints.push('💛');
    if (PLACES[pid].danger) hints.push('⚠️');
    if (evs.some(e => e.streak)) hints.push('🔁');
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
    S.screen = { kind: 'travel', hand: hand.map(c => ({ id: c.id, hints: c.hints })), date: dateLabel() };
    saveGame(S);
  }

  function pickPlace(pid) {
    if (!S.screen || S.screen.kind !== 'travel') return;
    const evs = eligiblePlaceEvents(pid);
    if (!evs.length) return;
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
  function buy(id) {
    const it = ITEMS[id];
    if (!it || !it.price || !shopOpen(it.shop) || S.res.galleon < it.price) return null;
    const chips = Rules.apply(S, { galleon: -it.price, item: id }, rnd);
    saveGame(S);
    return chips;
  }

  /* 소지품 사용 */
  function useItem(id) {
    const it = ITEMS[id];
    if (!it || !it.use || !(S.items[id] > 0)) return null;
    S.items[id]--;
    const chips = Rules.apply(S, it.use, rnd);
    saveGame(S);
    return chips;
  }

  return { start, state, setRandom, advance, choose, next, pickPlace, visibleChoices, lockedChoices, allocate, retryOptions, retry, buy, shopOpen, useItem, dateLabel, GRADE_NAME, eligiblePlaceEvents };
})();
