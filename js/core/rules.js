'use strict';
/* 조건 평가 · 판정 · 효과 적용 — DOM을 모른다 (시뮬레이터에서도 그대로 쓴다) */

const Rules = (() => {
  const asList = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

  /* 사건·선택지의 needs 조건 */
  function meets(S, n) {
    if (!n) return true;
    if (typeof n === 'function') return !!n(S);
    if (n.house && !asList(n.house).includes(S.house)) return false;
    if (n.notHouse && asList(n.notHouse).includes(S.house)) return false;
    if (n.pet && !asList(n.pet).includes(S.pet)) return false;
    for (const f of asList(n.flag)) if (!S.flags[f]) return false;
    for (const f of asList(n.notFlag)) if (S.flags[f]) return false;
    for (const m of asList(n.memory)) if (!S.memories.includes(m)) return false;
    for (const m of asList(n.notMemory)) if (S.memories.includes(m)) return false;
    for (const s of asList(n.spell)) if (!S.spells.includes(s)) return false;
    for (const s of asList(n.notSpell)) if (S.spells.includes(s)) return false;
    for (const i of asList(n.item)) if (!(S.items[i] > 0)) return false;
    for (const c of asList(n.card)) if (!S.cards.includes(c)) return false;
    if (n.stat) for (const k in n.stat) if ((S.stats[k] || 0) < n.stat[k]) return false;
    if (n.resMin) for (const k in n.resMin) if ((S.res[k] || 0) < n.resMin[k]) return false;
    if (n.resMax) for (const k in n.resMax) if ((S.res[k] || 0) > n.resMax[k]) return false;
    if (n.rel) for (const k in n.rel) if ((S.rel[k] || 0) < n.rel[k]) return false;
    if (n.turnMin != null && S.turn < n.turnMin) return false;
    if (n.turnMax != null && S.turn > n.turnMax) return false;
    if (n.since) for (const k in n.since) {
      if (S.marks[k] == null || S.turn - S.marks[k] < n.since[k]) return false;
    }
    if (n.any && !n.any.some(sub => meets(S, sub))) return false;
    if (n.fn && !n.fn(S)) return false;
    return true;
  }

  /* 선택지 보정 목록: [{label, value}] */
  function bonuses(S, choice) {
    const out = [];
    for (const b of choice.bonus || []) {
      const ok = (b.memory && S.memories.includes(b.memory)) || (b.item && S.items[b.item] > 0) ||
        (b.spell && S.spells.includes(b.spell)) || (b.card && S.cards.includes(b.card)) ||
        (b.pet && S.pet === b.pet) || (b.wand && S.wand === b.wand) ||
        (b.rel && Object.keys(b.rel).every(k => (S.rel[k] || 0) >= b.rel[k])) ||
        (b.flag && S.flags[b.flag]);
      if (ok) out.push({ label: b.label || labelFor(b), value: b.value });
    }
    if (statOf(S, choice) && S.insight > 0) out.push({ label: '💡 지난번에 얻은 통찰', value: S.insight, kind: 'insight' });
    if (choice.sneak && S.memories.includes('secret_passage')) out.push({ label: '💭 쌍둥이의 지도에서 본 길', value: 10 });
    if (choice.sneak && S.res.notice >= 12) out.push({ label: '👁️ 필치가 지켜본다', value: -Math.min(25, Math.round(S.res.notice / 2)), kind: 'watched' });
    if (S.res.heart <= 25) out.push({ label: '🕯️ 지친 몸과 마음', value: -10, kind: 'tired' });
    return out;
  }
  function labelFor(b) {
    if (b.memory) return '💭 ' + MEMORIES[b.memory].name;
    if (b.item) return '🎒 ' + ITEMS[b.item].name;
    if (b.spell) return '🪄 ' + SPELLS[b.spell].name;
    if (b.card) return '🃏 ' + CARDS[b.card].name;
    if (b.pet) return '🐾 ' + PETS[b.pet].name;
    if (b.rel) return '💛 ' + Object.keys(b.rel).map(k => PEOPLE[k].name).join(', ');
    return '보정';
  }

  /* 잠긴 선택지에 보여 줄 "필요한 것" 목록 */
  function needLabels(S, n) {
    const out = [];
    if (!n || typeof n === 'function') return out;
    for (const m of asList(n.memory)) if (!S.memories.includes(m)) out.push(`💭 기억 「${MEMORIES[m].name}」`);
    for (const i of asList(n.item)) if (!(S.items[i] > 0)) out.push(`${ITEMS[i].icon} ${ITEMS[i].name}`);
    for (const sp of asList(n.spell)) if (!S.spells.includes(sp)) out.push(`🪄 주문 「${SPELLS[sp].name}」`);
    for (const c of asList(n.card)) if (!S.cards.includes(c)) out.push(`🃏 카드 「${CARDS[c].name}」`);
    if (n.rel) for (const k in n.rel) if ((S.rel[k] || 0) < n.rel[k]) out.push(`💛 ${PEOPLE[k].short || PEOPLE[k].name}와 「${relTier(n.rel[k]).name}」 이상`);
    if (n.stat) for (const k in n.stat) if ((S.stats[k] || 0) < n.stat[k]) out.push(`${STATS[k].icon} ${STATS[k].name} ${n.stat[k]} 이상`);
    if (n.resMin) for (const k in n.resMin) if ((S.res[k] || 0) < n.resMin[k]) out.push(`${RESOURCES[k].icon} ${RESOURCES[k].name} ${n.resMin[k]} 이상`);
    return out;
  }
  /* 잠겨 있을 때 보여 줄 만한 조건인가 (기억·소지품·주문·카드·관계·스탯·돈) */
  function showableLock(n) {
    if (!n || typeof n === 'function') return false;
    if (n.flag || n.notFlag || n.notMemory || n.notSpell || n.any || n.fn || n.turnMin != null || n.turnMax != null) return false;
    return !!(n.memory || n.item || n.spell || n.card || n.rel || n.stat || n.resMin);
  }
  /* 무엇 덕분에 열린 선택지인가 */
  function thanksFor(n) {
    const out = [];
    if (!n || typeof n === 'function') return out;
    for (const m of asList(n.memory)) out.push(`💭 「${MEMORIES[m].name}」의 기억`);
    for (const i of asList(n.item)) out.push(`${ITEMS[i].icon} 챙겨 둔 ${ITEMS[i].name}`);
    for (const sp of asList(n.spell)) out.push(`🪄 익혀 둔 「${SPELLS[sp].name}」`);
    for (const c of asList(n.card)) out.push(`🃏 모아 둔 「${CARDS[c].name}」 카드`);
    if (n.rel) for (const k in n.rel) out.push(`💛 ${PEOPLE[k].short || PEOPLE[k].name}와 쌓은 우정`);
    if (n.stat) for (const k in n.stat) out.push(`${STATS[k].icon} 높은 ${STATS[k].name}`);
    return out;
  }

  /* 선택지를 고르기 전에 보여 줄 "얻을 수 있는 것 / 위험" — 이름은 밝히되 기억 내용은 숨긴다 */
  function stakes(S, choice) {
    const gain = new Set(), risk = new Set();
    const outs = choice.outcome ? [['success', choice.outcome]] : Object.entries(choice.outcomes || {});
    for (const [grade, o] of outs) {
      let fx = o.fx;
      try { if (typeof fx === 'function') fx = fx(S); } catch (e) { fx = null; }
      if (!fx) continue;
      const good = grade === 'success' || grade === 'crit' || grade === 'result';
      if (fx.rel) for (const k in fx.rel) {
        if (k === 'housemate') continue;
        const name = PEOPLE[k].short || PEOPLE[k].name;
        if (fx.rel[k] >= 8 && good) gain.add(`💛 ${name}`);
        if (fx.rel[k] < 0) risk.add(`💔 ${name}`);
      }
      if (good) {
        if (fx.memory) gain.add('💭 기억');
        if (fx.spell) gain.add('🪄 주문');
        if (fx.item) gain.add('🎒 물건');
        if (fx.card) gain.add('🃏 카드');
        if (fx.points > 0) gain.add('🏆 점수');
        if (fx.galleon > 0) gain.add('🪙 갈레온');
      } else {
        if (fx.notice > 0) risk.add('👁️ 들킬 수도');
        if (fx.hp < 0) risk.add('🩹 다칠 수도');
        if (fx.heart < 0 || fx.hp < 0) risk.add('🕯️ 기운 소모');
        if (fx.points < 0) risk.add('🏆 감점');
        if (fx.loseItem) risk.add('🎒 잃을 수도');
        if (fx.loseMemory) risk.add('💭 기억을 잃을 수도');
        if (fx.curfew) risk.add('🌙 외출 금지');
      }
    }
    return { gain: [...gain], risk: [...risk] };
  }

  /* 난이도: 지금의 영운에게 얼마나 어려운가 — 능력치·도움·지친 정도를 모두 따져 네 단계 말로만 보여 준다 */
  function difficulty(S, choice) {
    const c = chance(S, choice);
    if (c >= 80) return { dots: 1, name: '쉬움' };
    if (c >= 60) return { dots: 2, name: '할 만함' };
    if (c >= 40) return { dots: 3, name: '어려움' };
    return { dots: 4, name: '무모함' };
  }

  /* 능력치마다 다른 특기 보상 — 어려울수록 크다 */
  function perkFx(key, dc, grade) {
    if (grade !== 'success' && grade !== 'crit') return null;
    const t = Math.max(0, Math.min(3, (dc || 3) - 2));          // 0~3
    const m = grade === 'crit' ? 1.5 : 1;
    const r = n => (n ? Math.max(1, Math.round(n * m)) : 0);
    switch (key) {
      case 'courage':   return { points: r([1, 2, 3, 5][t]) };
      case 'wisdom':    return { insight: r([6, 8, 10, 12][t]) };
      case 'diligence': return { heart: r([3, 4, 6, 9][t]) };
      case 'cunning':   return { galleon: r([0, 1, 1, 2][t]), notice: -r([2, 3, 4, 5][t]) };
      case 'magic':     return { xp: r([5, 8, 12, 16][t]) };
    }
    return null;
  }

  /* 보상 수준 ★1~3 — 성공했을 때 얻는 것의 크기 */
  function rewardLevel(S, choice) {
    const o = choice.outcome || (choice.outcomes && (choice.outcomes.success || choice.outcomes.result));
    let fx = o && o.fx;
    try { if (typeof fx === 'function') fx = fx(S); } catch (e) { fx = null; }
    fx = fx || {};
    let v = 0;
    v += asList(fx.memory).length * 3 + asList(fx.spell).length * 3 + asList(fx.item).length * 2 + asList(fx.card).length;
    if (fx.rel) for (const k in fx.rel) if (k !== 'housemate' && fx.rel[k] > 0) v += fx.rel[k] >= 15 ? 2 : fx.rel[k] >= 8 ? 1 : 0;
    if (fx.points > 0) v += fx.points >= 5 ? 2 : 1;
    if (fx.galleon > 0) v += fx.galleon >= 3 ? 2 : 1;
    if (fx.heart >= 15) v += 1;
    if (statOf(S, choice)) v += Math.max(0, (choice.dc || 3) - 3);
    return v >= 5 ? 3 : v >= 2 ? 2 : 1;
  }

  const TIERS = [[70, '단짝'], [40, '가까운 친구'], [20, '친구'], [0, '아는 사이']];
  function relTier(v) {
    for (const [min, name] of TIERS) if (v >= min) return { min, name };
    return { min: 0, name: '아는 사이' };
  }

  function statOf(S, choice) {
    return typeof choice.stat === 'function' ? choice.stat(S) : choice.stat;
  }

  function chance(S, choice) {
    const key = statOf(S, choice);
    if (!key) return 100;
    const stat = S.stats[key] || 0;
    let c = 50 + (stat - (choice.dc || 3)) * 6;
    for (const b of bonuses(S, choice)) c += b.value;
    return Math.max(5, Math.min(95, Math.round(c)));
  }

  /* 대성공 / 성공 / 실패 / 대실패 */
  function roll(c, rnd) {
    const r = Math.floor(rnd() * 100) + 1;
    if (r <= Math.max(3, Math.round(c / 6))) return 'crit';
    if (r <= c) return 'success';
    if (r > 100 - Math.max(3, Math.round((100 - c) / 6))) return 'fumble';
    return 'fail';
  }

  function pickOutcome(outcomes, grade) {
    if (!outcomes) return { text: '' };
    if (outcomes[grade]) return outcomes[grade];
    if (grade === 'crit') return outcomes.success || outcomes.result;
    if (grade === 'fumble') return outcomes.fail || outcomes.result;
    return outcomes.result || outcomes.success;
  }

  const clamp = (k, v) => {
    const max = RESOURCES[k] && RESOURCES[k].max;
    if (k === 'galleon') return Math.max(0, v);
    if (max != null) return Math.max(0, Math.min(max, v));
    return v;
  };

  /* 효과 적용 → 표시용 칩 배열 반환 */
  function apply(S, fx, rnd) {
    const chips = [];
    if (!fx) return chips;
    if (typeof fx === 'function') fx = fx(S) || {};
    if (fx.hp) { fx = Object.assign({}, fx, { heart: (fx.heart || 0) + fx.hp }); delete fx.hp; }   /* 체력은 기운으로 합쳐졌다 */
    for (const k in STATS) if (fx[k]) {
      S.stats[k] = Math.max(0, S.stats[k] + fx[k]);
      chips.push({ t: `${STATS[k].icon} ${STATS[k].name} ${sign(fx[k])}`, good: fx[k] > 0 });
    }
    for (const k in RESOURCES) if (fx[k]) {
      const before = S.res[k];
      S.res[k] = clamp(k, before + fx[k]);
      const d = S.res[k] - before;
      if (k === 'points') chips.push({ t: `🏆 ${HOUSES[S.house] ? HOUSES[S.house].name + ' ' : ''}${sign(fx[k])}점`, good: fx[k] > 0 });
      else if (d !== 0 || k === 'galleon') chips.push({ t: `${RESOURCES[k].icon} ${RESOURCES[k].name} ${sign(fx[k])}`, good: k === 'notice' ? fx[k] < 0 : fx[k] > 0 });
    }
    if (fx.item) for (const id of asList(fx.item)) {
      S.items[id] = (S.items[id] || 0) + 1;
      chips.push({ t: `${ITEMS[id].icon} ${ITEMS[id].name}`, good: true });
    }
    if (fx.loseItem) for (const id of asList(fx.loseItem)) {
      if (S.items[id] > 0) { S.items[id]--; chips.push({ t: `${ITEMS[id].icon} ${ITEMS[id].name} −1`, good: false }); }
    }
    if (fx.spell) for (const id of asList(fx.spell)) if (!S.spells.includes(id)) {
      S.spells.push(id);
      chips.push({ t: `🪄 주문 습득: ${SPELLS[id].name}`, good: true, big: true });
    }
    if (fx.memory) for (const id of asList(fx.memory)) if (!S.memories.includes(id)) {
      S.memories.push(id);
      chips.push({ t: `💭 기억: ${MEMORIES[id].name}`, good: true, big: true });
    }
    if (fx.rel) for (const k in fx.rel) {
      if (!fx.rel[k]) continue;
      const before = S.rel[k] || 0;
      /* 호현은 마음을 천천히 연다 */
      const d = k === 'hohyeon' && fx.rel[k] > 0 ? Math.max(1, Math.round(fx.rel[k] * 0.7)) : fx.rel[k];
      S.rel[k] = Math.max(0, Math.min(100, before + d));
      const t0 = relTier(before), t1 = relTier(S.rel[k]);
      const name = PEOPLE[k].short || PEOPLE[k].name;
      chips.push({ t: `💛 ${name} ${sign(d)}`, good: d > 0 });
      if (t1.min > t0.min && k !== 'housemate') chips.push({ t: `💛 ${name} — 이제 「${t1.name}」`, good: true, big: true });
    }
    for (const c of asList(fx.card)) {
      const id = c === 'random' ? randomCard(S, rnd) : c;
      const isNew = !S.cards.includes(id);
      if (isNew) S.cards.push(id);
      chips.push({ t: `🃏 ${CARDS[id].name}${isNew ? ' (새 카드!)' : ' (중복)'}`, good: true });
    }
    if (fx.beans) {
      const flavors = [['딸기 맛', 5], ['토스트 맛', 5], ['풀 맛', 0], ['귀지 맛', -5], ['정어리 맛', -5], ['후추 맛', 0], ['토사물 맛', -10], ['코코넛 맛', 5]];
      const [f, h] = flavors[Math.floor(rnd() * flavors.length)];
      S.res.heart = clamp('heart', S.res.heart + h);
      chips.push({ t: `🫘 ${f}!${h ? ' ' + RESOURCES.heart.icon + ' ' + sign(h) : ''}`, good: h >= 0 });
    }
    if (fx.insight) {
      S.insight = Math.max(S.insight || 0, fx.insight);
      chips.push({ t: `💡 통찰 — 다음 판정 +${fx.insight}`, good: true });
    }
    if (fx.loseMemory) for (const id of asList(fx.loseMemory)) {
      const i = S.memories.indexOf(id);
      if (i >= 0) { S.memories.splice(i, 1); chips.push({ t: `💭 기억이 흐려졌다: ${MEMORIES[id].name}`, good: false, big: true }); }
    }
    if (fx.curfew) {
      S.curfewUntil = S.turn + fx.curfew;
      chips.push({ t: `🌙 밤 외출 금지 ${fx.curfew}주`, good: false });
    }
    if (fx.flag) for (const f of asList(fx.flag)) S.flags[f] = true;
    if (fx.unflag) for (const f of asList(fx.unflag)) delete S.flags[f];
    if (fx.mark) for (const f of asList(fx.mark)) S.marks[f] = S.turn;
    if (fx.house) S.house = fx.house;
    if (fx.wand) {
      S.wand = fx.wand;
      chips.push({ t: `🪄 지팡이: ${WANDS[fx.wand].name}`, good: true, big: true });
    }
    if (fx.pet) {
      S.pet = fx.pet;
      chips.push({ t: `🐾 ${PETS[fx.pet].kind} ‘${PETS[fx.pet].name}’`, good: true, big: true });
    }
    if (fx.later) for (const l of asList(fx.later)) S.later.push({ id: l.id, turn: S.turn + (l.turns || 1) });
    return chips;
  }

  function randomCard(S, rnd) {
    const ids = Object.keys(CARDS);
    const fresh = ids.filter(id => !S.cards.includes(id));
    const pool = fresh.length && rnd() < 0.75 ? fresh : ids;
    return pool[Math.floor(rnd() * pool.length)];
  }

  const sign = n => (n > 0 ? '+' + n : '−' + Math.abs(n));

  /* 문자열·함수 텍스트를 실제 문장으로 */
  function text(S, t) {
    if (t == null) return '';
    if (typeof t === 'function') t = t(S);
    const h = HOUSES[S.house];
    const p = PETS[S.pet];
    return String(t)
      .replace(/\{house\}/g, h ? h.name : '기숙사')
      .replace(/\{common\}/g, h ? h.common : '휴게실')
      .replace(/\{head\}/g, h ? h.head : '사감 교수')
      .replace(/\{ghost\}/g, h ? h.ghost : '유령')
      .replace(/\{pet\}/g, p ? p.name : '')
      .replace(/\{petKind\}/g, p ? p.kind : '');
  }

  return { meets, bonuses, chance, roll, pickOutcome, apply, text, asList, statOf, needLabels, showableLock, thanksFor, relTier, stakes, difficulty, perkFx, rewardLevel };
})();
