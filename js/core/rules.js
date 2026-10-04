'use strict';
/* 조건 · 대가 · 효과 — DOM을 모른다 (시뮬레이터에서도 그대로 쓴다)

   v8 규칙
   - 주사위는 없다. 고른 선택지의 결과가 그대로 일어난다.
   - 선택지는 needs(열쇠: 물건·주문·기억·관계·평판)와 cost(대가: ❤️ 체력 · 💭 정신력 · ⭐ 평판 · 🪙 갈레온)를 요구할 수 있다.
     둘 다 요구해도 되고, 열쇠를 써서 자원을 회복해도 된다.
   - 열쇠나 대가가 모자라면 회색으로 잠긴다.
   - fallback: true 인 선택지는 다른 선택지를 하나도 고를 수 없을 때만 나타난다 (같은 장면의 덜 좋은 결말).
   - 물건이 쓰여 사라지는지는 결과에서만 알 수 있다 (consume: true 또는 결과 fx.loseItem).
   - ❤️나 💭가 0이 되면 게임 오버. */

const Rules = (() => {
  const asList = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const REP_NAMES = { 1: '문제아', 2: '눈총', 3: '보통', 4: '신뢰', 5: '모범' };

  /* 사건·선택지의 needs 조건 */
  function meets(S, n) {
    if (!n) return true;
    if (typeof n === 'function') return !!n(S);
    if (n.house && !asList(n.house).includes(S.house)) return false;
    if (n.pet && !asList(n.pet).includes(S.pet)) return false;
    for (const f of asList(n.flag)) if (!S.flags[f]) return false;
    for (const f of asList(n.notFlag)) if (S.flags[f]) return false;
    for (const m of asList(n.memory)) if (!S.memories.includes(m)) return false;
    for (const m of asList(n.notMemory)) if (S.memories.includes(m)) return false;
    for (const s of asList(n.spell)) if (!S.spells.includes(s)) return false;
    for (const s of asList(n.notSpell)) if (S.spells.includes(s)) return false;
    for (const i of asList(n.item)) if (!(S.items[i] > 0)) return false;
    for (const i of asList(n.notItem)) if (S.items[i] > 0) return false;
    for (const c of asList(n.card)) if (!S.cards.includes(c)) return false;
    if (n.repMin != null && S.res.rep < n.repMin) return false;
    if (n.repMax != null && S.res.rep > n.repMax) return false;
    if (n.resMin) for (const k in n.resMin) if ((S.res[k] || 0) < n.resMin[k]) return false;
    if (n.resMax) for (const k in n.resMax) if ((S.res[k] || 0) > n.resMax[k]) return false;
    if (n.rel) for (const k in n.rel) if ((S.rel[k] || 0) < n.rel[k]) return false;
    if (n.turnMin != null && S.turn < n.turnMin) return false;
    if (n.turnMax != null && S.turn > n.turnMax) return false;
    if (n.seen) for (const id of asList(n.seen)) if (!S.seen.includes(id)) return false;
    if (n.visits) for (const p in n.visits) if (((S.visits || {})[p] || 0) < n.visits[p]) return false;
    if (n.spells != null && S.spells.length < n.spells) return false;
    if (n.since) for (const k in n.since) {
      if (S.marks[k] == null || S.turn - S.marks[k] < n.since[k]) return false;
    }
    if (n.any && !n.any.some(sub => meets(S, sub))) return false;
    if (n.fn && !n.fn(S)) return false;
    return true;
  }

  /* 대가: { hp, mind, rep, galleon } — 낼 수 있는가 */
  function costOf(S, c) {
    const v = typeof c.cost === 'function' ? c.cost(S) : c.cost;
    return v || {};
  }
  function affordable(S, c) {
    const k = costOf(S, c);
    if (k.hp && S.res.hp < k.hp) return false;
    if (k.mind && S.res.mind < k.mind) return false;
    if (k.rep && S.res.rep - k.rep < 1) return false;
    if (k.galleon && S.res.galleon < k.galleon) return false;
    return true;
  }
  /* 이 대가를 치르면 쓰러지는가 */
  function lethal(S, c) {
    const k = costOf(S, c);
    return (k.hp && S.res.hp - k.hp <= 0) || (k.mind && S.res.mind - k.mind <= 0);
  }

  /* 선택지 아래에 보여 줄 한 줄: 열쇠 · 대가 · 회복 */
  function reqLine(S, c) {
    const out = [];
    const n = c.needs;
    if (n && typeof n === 'object') {
      for (const i of asList(n.item)) out.push({ t: `${ITEMS[i].icon} ${ITEMS[i].name}`, ok: S.items[i] > 0, kind: 'key' });
      for (const sp of asList(n.spell)) out.push({ t: `🪄 ${SPELLS[sp].name}`, ok: S.spells.includes(sp), kind: 'key' });
      for (const m of asList(n.memory)) out.push({ t: `💭 「${MEMORIES[m].name}」`, ok: S.memories.includes(m), kind: 'key' });
      for (const cd of asList(n.card)) out.push({ t: `🃏 ${CARDS[cd].name}`, ok: S.cards.includes(cd), kind: 'key' });
      if (n.rel) for (const k in n.rel) out.push({ t: `💛 ${PEOPLE[k].short || PEOPLE[k].name} (${relTier(n.rel[k]).name})`, ok: (S.rel[k] || 0) >= n.rel[k], kind: 'key' });
      if (n.repMin != null) out.push({ t: `⭐ 평판 「${REP_NAMES[n.repMin]}」 이상`, ok: S.res.rep >= n.repMin, kind: 'key' });
    }
    const k = costOf(S, c);
    if (k.hp) out.push({ t: `❤️-${k.hp}`, ok: S.res.hp >= k.hp, kind: 'cost', danger: S.res.hp - k.hp <= 0 });
    if (k.mind) out.push({ t: `💭-${k.mind}`, ok: S.res.mind >= k.mind, kind: 'cost', danger: S.res.mind - k.mind <= 0 });
    if (k.rep) out.push({ t: `⭐-${k.rep}`, ok: S.res.rep - k.rep >= 1, kind: 'cost' });
    if (k.galleon) out.push({ t: `🪙-${k.galleon}`, ok: S.res.galleon >= k.galleon, kind: 'cost' });
    /* 회복은 미리 알려 준다 */
    const fx = peekFx(S, c);
    if (fx.hp > 0) out.push({ t: `❤️+${fx.hp}`, ok: true, kind: 'gain' });
    if (fx.mind > 0) out.push({ t: `💭+${fx.mind}`, ok: true, kind: 'gain' });
    return out;
  }
  /* 특별 보상(이야기와 이어지는 것)만 미리 보여 준다 */
  function specialRewards(S, c) {
    const fx = peekFx(S, c);
    const out = [];
    for (const sp of asList(fx.spell)) if (!S.spells.includes(sp)) out.push(`🪄 ${SPELLS[sp].name}`);
    for (const m of asList(fx.memory)) if (!S.memories.includes(m)) out.push('💭 기억');
    for (const i of asList(fx.item)) out.push(`${ITEMS[i].icon} ${ITEMS[i].name}`);
    return [...new Set(out)];
  }
  function peekFx(S, c) {
    const o = c.outcome;
    let fx = o && o.fx;
    try { if (typeof fx === 'function') fx = fx(S); } catch (e) { fx = null; }
    return fx || {};
  }

  /* 잠긴 선택지에 보여 줄 만한 조건인가 */
  function showableLock(n) {
    if (!n) return true;
    if (typeof n === 'function') return false;
    if (n.flag || n.notFlag || n.notMemory || n.notSpell || n.notItem || n.any || n.fn || n.turnMin != null || n.turnMax != null || n.seen || n.visits || n.repMax != null) return false;
    return true;
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
    if (n.repMin != null) out.push(`⭐ 쌓아 둔 평판`);
    return out;
  }

  const TIERS = [[70, '단짝'], [40, '가까운 친구'], [20, '친구'], [0, '아는 사이']];
  function relTier(v) {
    for (const [min, name] of TIERS) if (v >= min) return { min, name };
    return { min: 0, name: '아는 사이' };
  }

  const MAX = { hp: 5, mind: 5, rep: 5 };
  const clamp = (k, v) => {
    if (k === 'rep') return Math.max(1, Math.min(5, v));
    if (MAX[k] != null) return Math.max(0, Math.min(MAX[k], v));
    return Math.max(0, v);
  };

  /* 효과 적용 → 표시용 칩 배열 반환 */
  function apply(S, fx, rnd) {
    const chips = [];
    if (!fx) return chips;
    if (typeof fx === 'function') fx = fx(S) || {};
    for (const k of ['hp', 'mind', 'rep', 'galleon']) if (fx[k]) {
      const before = S.res[k];
      S.res[k] = clamp(k, before + fx[k]);
      const d = S.res[k] - before;
      if (d === 0 && k !== 'galleon') continue;
      if (k === 'rep') chips.push({ t: `⭐ 평판 ${d > 0 ? '올랐다' : '떨어졌다'} — 「${REP_NAMES[S.res.rep]}」`, good: d > 0 });
      else chips.push({ t: `${RESOURCES[k].icon} ${RESOURCES[k].name} ${sign(fx[k])}`, good: fx[k] > 0 });
    }
    if (fx.points) S.res.points = (S.res.points || 0) + fx.points;   /* 기숙사 점수는 이야기 속에만 */
    if (fx.item) for (const id of asList(fx.item)) {
      S.items[id] = (S.items[id] || 0) + 1;
      chips.push({ t: `${ITEMS[id].icon} ${ITEMS[id].name}`, good: true });
    }
    if (fx.loseItem) for (const id of asList(fx.loseItem)) {
      if (S.items[id] > 0) { S.items[id]--; chips.push({ t: `${ITEMS[id].icon} ${ITEMS[id].name}을(를) 다 썼다`, good: false }); }
    }
    if (fx.spell) for (const id of asList(fx.spell)) if (!S.spells.includes(id)) {
      S.spells.push(id);
      chips.push({ t: `🪄 주문 습득: ${SPELLS[id].name}`, good: true, big: true });
    }
    if (fx.memory) for (const id of asList(fx.memory)) if (!S.memories.includes(id)) {
      S.memories.push(id);
      chips.push({ t: `💭 기억: ${MEMORIES[id].name}`, good: true, big: true });
    }
    if (fx.loseMemory) for (const id of asList(fx.loseMemory)) {
      const i = S.memories.indexOf(id);
      if (i >= 0) { S.memories.splice(i, 1); chips.push({ t: `💭 기억이 흐려졌다: ${MEMORIES[id].name}`, good: false, big: true }); }
    }
    if (fx.rel) for (const k in fx.rel) {
      if (!fx.rel[k]) continue;
      const before = S.rel[k] || 0;
      /* 호현은 마음을 천천히 연다 */
      const d = k === 'hohyeon' && fx.rel[k] > 0 ? Math.max(1, Math.round(fx.rel[k] * 0.7)) : fx.rel[k];
      S.rel[k] = Math.max(0, Math.min(100, before + d));
      const t0 = relTier(before), t1 = relTier(S.rel[k]);
      const name = PEOPLE[k].short || PEOPLE[k].name;
      if (k !== 'housemate') chips.push({ t: `💛 ${name} ${d > 0 ? '▲' : '▼'}`, good: d > 0 });
      if (t1.min > t0.min && k !== 'housemate') chips.push({ t: `💛 ${name} — 이제 「${t1.name}」`, good: true, big: true });
    }
    for (const c of asList(fx.card)) {
      const id = c === 'random' ? randomCard(S, rnd) : c;
      const isNew = !S.cards.includes(id);
      if (isNew) S.cards.push(id);
      chips.push({ t: `🃏 ${CARDS[id].name}${isNew ? ' (새 카드!)' : ' (중복)'}`, good: true });
    }
    if (fx.beans) {
      const flavors = [['딸기 맛', 1, 'mind'], ['토스트 맛', 1, 'hp'], ['풀 맛', 0], ['귀지 맛', 0], ['정어리 맛', 0], ['후추 맛', 0], ['토사물 맛', -1, 'mind'], ['코코넛 맛', 1, 'mind']];
      const [f, h, k] = flavors[Math.floor(rnd() * flavors.length)];
      if (h && !(h < 0 && S.res[k] <= 1)) S.res[k] = clamp(k, S.res[k] + h);
      chips.push({ t: `🫘 ${f}!${h ? ` ${RESOURCES[k].icon} ${sign(h)}` : ''}`, good: h >= 0 });
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

  return { meets, costOf, affordable, lethal, reqLine, specialRewards, apply, text, asList, showableLock, thanksFor, relTier, REP_NAMES, MAX };
})();
