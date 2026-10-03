'use strict';
/* 사건 데이터 검증기 — `node tools/validate.js` */
const { loadGame } = require('./load');
const g = loadGame();
const { EVENTS, MEMORIES, ITEMS, SPELLS, PEOPLE, CARDS, HOUSES, PETS, WANDS, Rules, newState } = g;

const errors = [];
const warns = [];
const err = (id, m) => errors.push(`✗ ${id}: ${m}`);
const warn = (id, m) => warns.push(`△ ${id}: ${m}`);
const list = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

/* 집마다, 펫마다 다른 문장을 모두 렌더링해 보기 위한 표본 상태 */
function samples() {
  const out = [];
  for (const house of Object.keys(HOUSES)) for (const pet of [...Object.keys(PETS), null]) {
    const s = newState();
    Object.assign(s, { house, pet, wand: 'willow', turn: 6 });
    s.flags.lean_gryffindor = true;
    out.push(s);
  }
  const rich = newState();
  Object.assign(rich, { house: 'gryffindor', pet: 'owl', turn: 10 });
  rich.memories = Object.keys(MEMORIES);
  rich.cards = Object.keys(CARDS);
  for (const k of Object.keys(PEOPLE)) rich.rel[k] = 50;
  ['lean_ravenclaw', 'trevor_predicted', 'hal_warned', 'knows_hermione_bathroom', 'saw_turban', 'quirrell_smell', 'firenze_words', 'suspicion_notes', 'studied', 'exam_charms', 'exam_transfig', 'exam_potions', 'heard_third_floor', 'squid_touch', 'empty_rooms', 'sprout_likes'].forEach(f => { rich.flags[f] = true; });
  rich.items = { frog: 1 };
  out.push(rich);
  return out;
}
const SAMPLES = samples();

let CUR = SAMPLES;
function fitting(needs) {
  if (!needs) return SAMPLES;
  const fit = SAMPLES.map(s => {
    const c = JSON.parse(JSON.stringify(s));
    if (typeof needs === 'object') {
      if (needs.turnMin != null) c.turn = Math.max(c.turn, needs.turnMin);
      if (needs.turnMax != null) c.turn = Math.min(c.turn, needs.turnMax);
      if (needs.since) for (const k in needs.since) c.marks[k] = c.turn - needs.since[k];
    }
    return c;
  }).filter(s => Rules.meets(s, needs));
  return fit.length ? fit : SAMPLES;
}
function render(id, label, t, min) {
  for (const s of CUR) {
    let out;
    try { out = Rules.text(s, t); } catch (e) { err(id, `${label} 렌더 실패 (${s.house}/${s.pet}): ${e.message}`); return; }
    if (/undefined|\[object|NaN/.test(out)) err(id, `${label}에 undefined/객체 노출 (${s.house}): …${out.match(/.{0,20}(undefined|\[object|NaN).{0,20}/)[0]}…`);
    if (min && out.length < min) { warn(id, `${label} 길이 ${out.length}자 (< ${min})`); return; }
  }
}

function checkFx(id, fx) {
  if (!fx) return;
  for (const s of CUR) {
    let f = fx;
    if (typeof fx === 'function') { try { f = fx(s); } catch (e) { err(id, 'fx 함수 오류 ' + e.message); return; } }
    for (const m of list(f.memory)) if (!MEMORIES[m]) err(id, `없는 기억 ${m}`);
    for (const m of list(f.loseMemory)) if (!MEMORIES[m]) err(id, `없는 기억 ${m}`);
    for (const i of list(f.item).concat(list(f.loseItem))) if (!ITEMS[i]) err(id, `없는 소지품 ${i}`);
    for (const sp of list(f.spell)) if (!SPELLS[sp]) err(id, `없는 주문 ${sp}`);
    for (const c of list(f.card)) if (c !== 'random' && !CARDS[c]) err(id, `없는 카드 ${c}`);
    if (f.rel) for (const k in f.rel) if (!PEOPLE[k]) err(id, `없는 인물 ${k}`);
    if (f.pet && !PETS[f.pet]) err(id, `없는 펫 ${f.pet}`);
    if (f.wand && !WANDS[f.wand]) err(id, `없는 지팡이 ${f.wand}`);
    for (const l of list(f.later)) if (!EVENTS[l.id]) err(id, `later 대상 없음 ${l.id}`);
    for (const k in f) if (typeof f[k] === 'number' && f[k] === 0) warn(id, `0 효과 ${k}`);
  }
}

const allCode = g.sources.map(s => s.code).join('\n');
const setFlags = new Set();
for (const m of allCode.matchAll(/flag:\s*(\[[^\]]*\]|'[^']+')/g)) for (const f of m[1].matchAll(/'([^']+)'/g)) setFlags.add(f[1]);
for (const m of allCode.matchAll(/mark:\s*'([^']+)'/g)) setFlags.add(m[1]);
for (const h of Object.keys(HOUSES)) setFlags.add('lean_' + h);
setFlags.add('year1_done');

let words = 0;
const itemUse = {};
for (const ev of Object.values(EVENTS)) {
  const id = ev.id;
  CUR = fitting(ev.needs);
  render(id, 'title', ev.title);
  render(id, 'place', ev.place);
  render(id, '본문', ev.text, ev.type === 'special' || ev.repeat ? 90 : 170);
  checkFx(id, ev.fx);
  for (const n of list(ev.next)) if (!EVENTS[n]) err(id, `next 대상 없음 ${n}`);
  if (ev.place && !g.PLACES[ev.place] && ev.type === 'place') err(id, `없는 장소 ${ev.place}`);
  if (ev.needs && typeof ev.needs === 'object') {
    for (const f of list(ev.needs.flag)) if (!setFlags.has(f)) warn(id, `needs.flag '${f}'를 세우는 곳이 없음`);
    for (const m of list(ev.needs.memory)) if (!MEMORIES[m]) err(id, `needs 없는 기억 ${m}`);
  }
  const choices = ev.choices || [];
  if (!choices.length) err(id, '선택지 없음');
  const statSet = new Set();
  choices.forEach((c, i) => {
    const cid = `${id}#${i}`;
    const evSamples = fitting(ev.needs);
    CUR = c.needs ? evSamples.filter(s => Rules.meets(s, c.needs)) : evSamples;
    if (!CUR.length) CUR = evSamples;
    render(cid, 'label', c.label);
    if (c.needs && typeof c.needs === 'object') for (const i of list(c.needs.item)) { if (!ITEMS[i]) err(cid, `needs 없는 소지품 ${i}`); itemUse[i] = (itemUse[i] || 0) + 1; }
    if (c.stat) {
      for (const s of SAMPLES) { const k = Rules.statOf(s, c); if (!g.STATS[k]) err(cid, `없는 스탯 ${k}`); statSet.add(k); }
      if (!c.outcomes || !c.outcomes.success || !c.outcomes.fail) err(cid, '판정 선택지에 success/fail 결과가 없음');
    } else if (!c.outcome && !(c.outcomes && (c.outcomes.success || c.outcomes.result))) err(cid, '결과 없음');
    const outs = c.outcome ? [c.outcome] : Object.values(c.outcomes || {});
    for (const o of outs) {
      render(cid, '결과', o.text, 60);
      checkFx(cid, o.fx);
      for (const n of list(o.next)) if (!EVENTS[n]) err(cid, `next 대상 없음 ${n}`);
      for (const s of SAMPLES) { try { words += Rules.text(s, o.text).length; } catch (e) { /* 위에서 보고 */ } break; }
    }
    for (const b of c.bonus || []) {
      if (b.memory && !MEMORIES[b.memory]) err(cid, `보정 없는 기억 ${b.memory}`);
      if (b.item && !ITEMS[b.item]) err(cid, `보정 없는 소지품 ${b.item}`);
      if (b.item) itemUse[b.item] = (itemUse[b.item] || 0) + 1;
      if (b.flag && !setFlags.has(b.flag)) warn(cid, `보정 flag '${b.flag}'를 세우는 곳이 없음`);
    }
  });
  const statChoices = choices.filter(c => c.stat).length;
  if (statChoices >= 2 && statSet.size < 2 && !ev.streak) warn(id, '판정 선택지가 모두 같은 스탯');
  try { words += Rules.text(SAMPLES[0], ev.text).length; } catch (e) { /* 위에서 보고 */ }
}

/* 표기 사전 */
const BANNED = { '레번클로': '래번클로', '호그스메이드': '호그스미드', '헤르미오네': '헤르미온느', '덤블도오': '덤블도어', '스니치를 잡았다': null };
for (const { src, code } of g.sources) for (const [bad, good] of Object.entries(BANNED)) if (good && code.includes(bad)) err(src, `표기 '${bad}' → '${good}'`);

const evs = Object.values(EVENTS);
console.log(`사건 ${evs.length}개 (정사 ${evs.filter(e => e.type === 'canon').length} · 장소 ${evs.filter(e => e.type === 'place').length} · 위기 ${evs.filter(e => e.type === 'special').length}) · 총 분량 약 ${Math.round(words / 1000)}천 자`);
console.log('물건이 열쇠·도움이 되는 선택지 수: ' + Object.keys(ITEMS).map(k => `${k} ${itemUse[k] || 0}`).join(' · '));
const SHOP_IDS = Object.keys(g.SHOPS || {});
for (const [k, it] of Object.entries(ITEMS)) {
  if (it.price && !SHOP_IDS.includes(it.shop)) err('ITEMS.' + k, `없는 가게 ${it.shop}`);
  if (it.price && !itemUse[k] && !it.use) warn('ITEMS.' + k, '팔기만 하고 쓰이는 곳이 없음');
}
warns.forEach(w => console.log(w));
errors.forEach(e => console.log(e));
console.log(errors.length ? `\n오류 ${errors.length}건` : '\n오류 없음');
process.exit(errors.length ? 1 : 0);
