'use strict';
/* 게임 흐름: 턴 → 정사 사건 → 행선지 카드 → 장소 사건 → 다음 턴 */

const Game = (() => {
  let S = null;
  let rnd = Math.random;
  const GRADE_NAME = { crit: '대성공', success: '성공', fail: '실패', fumble: '대실패' };

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

  function turnStart() {
    S.stage = S.turn <= TURNS_PER_YEAR ? 'travel' : 'done';
    if (S.turn > 1) {
      S.res.notice = Math.max(0, S.res.notice - 3);
      S.res.hp = Math.min(100, S.res.hp + 5);
    }
    const q = [];
    if (S.res.hp <= 0) q.push('sp_hospital');
    else if (S.res.heart <= 15 && EVENTS.sp_lowheart) q.push('sp_lowheart');
    if (S.res.notice >= 100) q.push('sp_notice');
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

  function choose(index) {
    const ev = EVENTS[S.screen.id];
    const choice = ev.choices[index];
    if (!choice || !Rules.meets(S, choice.needs) || S.screen.stage !== 'intro') return;
    let grade = null, c = null, outcome;
    if (Rules.statOf(S, choice)) {
      c = Rules.chance(S, choice);
      grade = Rules.roll(c, rnd);
      outcome = Rules.pickOutcome(choice.outcomes, grade);
    } else {
      outcome = choice.outcome || Rules.pickOutcome(choice.outcomes, 'success');
    }
    const extraText = [];
    const statKey = Rules.statOf(S, choice);
    /* 판정에 쓴 능력치가 그 자리에서 바로 오르지는 않는다 — 대신 경험이 된다 (한 능력치만 키우는 것을 막는다) */
    let fx = typeof outcome.fx === 'function' ? outcome.fx(S) : outcome.fx;
    let bonusXp = 0;
    if (statKey && fx && fx[statKey] > 0) { fx = Object.assign({}, fx); bonusXp += 4 * fx[statKey]; delete fx[statKey]; }
    const thanks = Rules.thanksFor(choice.needs);
    if (statKey) {
      for (const b of Rules.bonuses(S, choice)) if (b.value > 0 && b.kind !== 'fresh') thanks.push(`${b.label} 덕분에 성공률 +${b.value}`);
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
      text: [Rules.text(S, outcome.text)].concat(extraText).filter(Boolean).join('\n\n'),
      chips: (S.screen.chips || []).concat(chips),
    });
    S.log.push({ y: S.year, t: S.turn, title: Rules.text(S, ev.title), choice: Rules.text(S, choice.label), grade: grade ? GRADE_NAME[grade] : null });
    if (S.log.length > 200) S.log.shift();
    if (outcome.next) S.queue.unshift(...Rules.asList(outcome.next));
    saveGame(S);
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

  /* 소지품 사용 */
  function useItem(id) {
    const it = ITEMS[id];
    if (!it || !it.use || !(S.items[id] > 0)) return null;
    S.items[id]--;
    const chips = Rules.apply(S, it.use, rnd);
    saveGame(S);
    return chips;
  }

  return { start, state, setRandom, advance, choose, next, pickPlace, visibleChoices, lockedChoices, allocate, useItem, dateLabel, GRADE_NAME, eligiblePlaceEvents };
})();
