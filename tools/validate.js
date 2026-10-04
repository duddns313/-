'use strict';
/* 사건 데이터 검증기 (v8: 주사위 없음 · 열쇠와 대가) — `node tools/validate.js [파일이름 일부]`
   파일 이름을 주면 그 파일에 정의된 사건만 검사한다 (변환 작업 중에 쓴다). */
const { loadGame } = require('./load');
const g = loadGame();
const { EVENTS, MEMORIES, ITEMS, SPELLS, PEOPLE, CARDS, HOUSES, PETS, WANDS, Rules, newState } = g;

const ONLY = process.argv[2] || null;
const errors = [];
const warns = [];
const err = (id, m) => errors.push(`✗ ${id}: ${m}`);
const warn = (id, m) => warns.push(`△ ${id}: ${m}`);
const list = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

/* 사건이 어느 파일에 있는가 */
const fileOf = {};
for (const { src, code } of g.sources) for (const m of code.matchAll(/^\s*id: '([^']+)'/gm)) fileOf[m[1]] = src;

/* 표본 상태들 */
function samples() {
  const out = [];
  for (const pet of [...Object.keys(PETS), null]) {
    const s = newState();
    Object.assign(s, { house: 'gryffindor', pet, wand: 'willow', turn: 6 });
    out.push(s);
  }
  const rich = newState();
  Object.assign(rich, { house: 'gryffindor', pet: 'owl', wand: 'ebony', turn: 10 });
  rich.memories = Object.keys(MEMORIES);
  rich.cards = Object.keys(CARDS);
  rich.spells = Object.keys(SPELLS);
  for (const k of Object.keys(PEOPLE)) rich.rel[k] = 60;
  for (const k of Object.keys(ITEMS)) rich.items[k] = 1;
  rich.res.rep = 5;
  out.push(rich);
  const poor = newState();
  Object.assign(poor, { house: 'gryffindor', pet: null, wand: 'hazel', turn: 8 });
  poor.res = { hp: 1, mind: 1, rep: 1, galleon: 0, points: -10 };
  out.push(poor);
  return out;
}
const SAMPLES = samples();
function fitting(needs) {
  if (!needs) return SAMPLES;
  const fit = SAMPLES.map(s => {
    const c = JSON.parse(JSON.stringify(s));
    if (typeof needs === 'object') {
      if (needs.turnMin != null) c.turn = Math.max(c.turn, needs.turnMin);
      if (needs.turnMax != null) c.turn = Math.min(c.turn, needs.turnMax);
      if (needs.since) for (const k in needs.since) c.marks[k] = c.turn - needs.since[k];
      for (const f of list(needs.flag)) c.flags[f] = true;
    }
    return c;
  }).filter(s => Rules.meets(s, needs));
  return fit.length ? fit : SAMPLES;
}
let CUR = SAMPLES;
function render(id, label, t, min) {
  for (const s of CUR) {
    let out;
    try { out = Rules.text(s, t); } catch (e) { err(id, `${label} 렌더 실패: ${e.message}`); return; }
    if (/undefined|\[object|NaN/.test(out)) err(id, `${label}에 undefined/객체 노출: …${out.match(/.{0,20}(undefined|\[object|NaN).{0,20}/)[0]}…`);
    if (min && out.length < min) { warn(id, `${label} 길이 ${out.length}자 (< ${min})`); return; }
  }
}

const OLD_FX = ['heart', 'notice', 'xp', 'insight', 'curfew', 'courage', 'wisdom', 'diligence', 'cunning', 'magic'];
const FX_KEYS = new Set(['hp', 'mind', 'rep', 'galleon', 'points', 'item', 'loseItem', 'spell', 'memory', 'loseMemory', 'rel', 'card', 'beans', 'flag', 'unflag', 'mark', 'house', 'wand', 'pet', 'later']);
function checkFx(id, fx, inChoice) {
  if (!fx) return;
  for (const s of CUR) {
    let f = fx;
    if (typeof fx === 'function') { try { f = fx(s) || {}; } catch (e) { err(id, 'fx 함수 오류 ' + e.message); return; } }
    for (const k in f) {
      if (OLD_FX.includes(k)) err(id, `예전 효과 '${k}' — v8에서는 쓰지 않는다`);
      else if (!FX_KEYS.has(k)) err(id, `알 수 없는 효과 '${k}'`);
    }
    if (inChoice && (f.hp < 0 || f.mind < 0)) err(id, '선택지 결과에서 ❤️/💭를 깎지 말 것 — 대가(cost)로 미리 보여 준다');
    if (inChoice && f.rep < 0) warn(id, '결과에서 평판이 깎인다 — 의도라면 cost.rep으로 보여 주는 편이 낫다');
    if (f.hp > 2 || f.mind > 2) warn(id, `회복이 크다 (❤️${f.hp || 0} 💭${f.mind || 0})`);
    for (const m of list(f.memory).concat(list(f.loseMemory))) if (!MEMORIES[m]) err(id, `없는 기억 ${m}${(g.MEMORY_TO_FLAG || []).includes(m) ? ' (flag로 바뀐 기억)' : ''}`);
    for (const i of list(f.item).concat(list(f.loseItem))) if (!ITEMS[i]) err(id, `없는 소지품 ${i}`);
    for (const sp of list(f.spell)) if (!SPELLS[sp]) err(id, `없는 주문 ${sp}`);
    for (const c of list(f.card)) if (c !== 'random' && !CARDS[c]) err(id, `없는 카드 ${c}`);
    if (f.rel) for (const k in f.rel) if (!PEOPLE[k]) err(id, `없는 인물 ${k}`);
    if (f.pet && !PETS[f.pet]) err(id, `없는 펫 ${f.pet}`);
    if (f.wand && !WANDS[f.wand]) err(id, `없는 지팡이 ${f.wand}`);
    for (const l of list(f.later)) if (!EVENTS[l.id]) err(id, `later 대상 없음 ${l.id}`);
  }
}
function checkNeeds(id, n) {
  if (!n || typeof n !== 'object') return;
  for (const m of list(n.memory).concat(list(n.notMemory))) if (!MEMORIES[m]) err(id, `needs 없는 기억 ${m}${(g.MEMORY_TO_FLAG || []).includes(m) ? ' (flag로 바뀐 기억)' : ''}`);
  for (const i of list(n.item).concat(list(n.notItem))) if (!ITEMS[i]) err(id, `needs 없는 소지품 ${i}`);
  for (const sp of list(n.spell).concat(list(n.notSpell))) if (!SPELLS[sp]) err(id, `needs 없는 주문 ${sp}`);
  if (n.stat || n.resMin && (n.resMin.heart != null || n.resMin.notice != null)) err(id, 'needs에 예전 능력치·자원 조건');
  for (const sub of n.any || []) checkNeeds(id, sub);
}

const allCode = g.sources.map(s => s.code).join('\n');
const setFlags = new Set(['year1_done', 'rewind_known']);
for (const m of allCode.matchAll(/flag:\s*(\[[^\]]*\]|'[^']+')/g)) for (const f of m[1].matchAll(/'([^']+)'/g)) setFlags.add(f[1]);
for (const m of allCode.matchAll(/mark:\s*'([^']+)'/g)) setFlags.add(m[1]);

let words = 0, nChoices = 0, nCost = 0, nKey = 0, nFree = 0, nGain = 0;
const itemUse = {}, memUse = {}, memGive = {};
const evs = Object.values(EVENTS).filter(ev => !ONLY || (fileOf[ev.id] || '').includes(ONLY));
for (const ev of evs) {
  const id = ev.id;
  CUR = fitting(ev.needs);
  render(id, 'title', ev.title);
  render(id, 'place', ev.place);
  render(id, '본문', ev.text, ev.type === 'special' || ev.repeat || ev.repEvent ? 90 : 160);
  checkFx(id, ev.fx, false);
  checkNeeds(id, ev.needs);
  for (const n of list(ev.next)) if (!EVENTS[n]) err(id, `next 대상 없음 ${n}`);
  if (ev.type === 'place' && !g.PLACES[ev.place]) err(id, `없는 장소 ${ev.place}`);
  if (ev.needs && typeof ev.needs === 'object') for (const f of list(ev.needs.flag)) if (!setFlags.has(f)) warn(id, `needs.flag '${f}'를 세우는 곳이 없음`);
  const choices = ev.choices || [];
  if (!choices.length) err(id, '선택지 없음');
  const main = choices.filter(c => !c.fallback);
  if (main.length > 4) err(id, `선택지 ${main.length}개 — 최대 4개`);
  /* 언제나 고를 수 있는 길이 하나는 있어야 한다: 열쇠도 대가도 없는 선택지, 또는 대신하는 선택지 */
  const isFree = c => !c.cost && (!c.needs || (typeof c.needs === 'object' && !c.needs.item && !c.needs.spell && !c.needs.memory && !c.needs.rel && !c.needs.card && c.needs.repMin == null && !c.needs.flag && !c.needs.fn && !c.needs.any));
  if (!choices.some(c => isFree(c) || (c.fallback && !c.cost))) err(id, '항상 고를 수 있는 선택지(열쇠·대가 없음)나 fallback이 없음 — 막힐 수 있다');
  if (choices.some(c => c.fallback) && !main.some(c => c.cost || c.needs)) warn(id, 'fallback이 있는데 막힐 선택지가 없다 — fallback이 영영 안 보인다');
  choices.forEach((c, i) => {
    const cid = `${id}#${i}`;
    nChoices++;
    for (const k of ['stat', 'dc', 'bonus', 'outcomes', 'voice', 'sneak', 'lockHint']) if (c[k] != null && !(k === 'lockHint')) err(cid, `예전 필드 '${k}'`);
    if (!c.outcome) err(cid, 'outcome 없음');
    const cost = typeof c.cost === 'function' ? null : c.cost;
    if (cost) {
      nCost++;
      for (const k in cost) if (!['hp', 'mind', 'rep', 'galleon'].includes(k)) err(cid, `알 수 없는 대가 '${k}'`);
      if (cost.hp > 2 || cost.mind > 2 || cost.rep > 2) warn(cid, '대가가 2를 넘는다');
      if (c.fallback) err(cid, 'fallback에는 대가를 붙이지 않는다');
    }
    if (c.needs && typeof c.needs === 'object' && (c.needs.item || c.needs.spell || c.needs.memory || c.needs.rel || c.needs.repMin != null)) nKey++;
    if (isFree(c) && !c.fallback) nFree++;
    if (c.consume && !(c.needs && c.needs.item)) err(cid, 'consume인데 needs.item이 없음');
    const evSamples = fitting(ev.needs);
    CUR = c.needs ? evSamples.filter(s => Rules.meets(s, c.needs)) : evSamples;
    if (!CUR.length) CUR = evSamples;
    render(cid, 'label', c.label);
    checkNeeds(cid, c.needs);
    for (const e of list(c.ease)) {
      checkNeeds(cid, e.needs);
      for (const m of list(e.needs && e.needs.memory)) memUse[m] = (memUse[m] || 0) + 1;
      for (const i of list(e.needs && e.needs.item)) itemUse[i] = (itemUse[i] || 0) + 1;
      if (!c.cost) err(cid, 'ease가 있는데 원래 대가(cost)가 없다');
    }
    if (c.needs && typeof c.needs === 'object') {
      for (const i of list(c.needs.item)) itemUse[i] = (itemUse[i] || 0) + 1;
      for (const m of list(c.needs.memory)) memUse[m] = (memUse[m] || 0) + 1;
      for (const f of list(c.needs.flag)) if (!setFlags.has(f)) warn(cid, `needs.flag '${f}'를 세우는 곳이 없음`);
    }
    const o = c.outcome || {};
    render(cid, '결과', o.text, 60);
    checkFx(cid, o.fx, true);
    for (const s of CUR.slice(0, 1)) {
      let f = o.fx; try { if (typeof f === 'function') f = f(s); } catch (e) { f = null; }
      if (f && (f.hp > 0 || f.mind > 0)) nGain++;
      if (f) for (const m of list(f.memory)) memGive[m] = (memGive[m] || 0) + 1;
    }
    for (const n of list(o.next)) if (!EVENTS[n]) err(cid, `next 대상 없음 ${n}`);
    for (const s of SAMPLES) { try { words += Rules.text(s, o.text).length; } catch (e) { /* 위에서 보고 */ } break; }
  });
  try { words += Rules.text(SAMPLES[0], ev.text).length; } catch (e) { /* 위에서 보고 */ }
}

/* 기억이 쓰이는 곳 (텍스트 안의 조건까지) */
for (const m of Object.keys(MEMORIES)) {
  const textUse = (allCode.match(new RegExp(`(S_HAS\\(s, '${m}'\\)|memories\\.includes\\('${m}'\\)|has\\('${m}'\\))`, 'g')) || []).length;
  memUse[m] = (memUse[m] || 0) + textUse;
}
/* 표기 사전 */
const BANNED = { '레번클로': '래번클로', '호그스메이드': '호그스미드', '헤르미오네': '헤르미온느', '덤블도오': '덤블도어' };
for (const { src, code } of g.sources) for (const [bad, good] of Object.entries(BANNED)) if (code.includes(bad)) err(src, `표기 '${bad}' → '${good}'`);

console.log(`사건 ${evs.length}개 · 선택지 ${nChoices}개 (대가 ${nCost} · 열쇠 ${nKey} · 공짜 ${nFree} · 회복 ${nGain}) · 분량 약 ${Math.round(words / 1000)}천 자`);
if (!ONLY) {
  console.log('물건이 열쇠인 선택지: ' + Object.keys(ITEMS).map(k => `${k} ${itemUse[k] || 0}`).join(' · '));
  const unusedMem = Object.keys(MEMORIES).filter(m => !memUse[m]);
  const ungiven = Object.keys(MEMORIES).filter(m => !memGive[m] && !new RegExp(`memory: (\\[[^\\]]*)?'${m}'`).test(allCode));
  if (unusedMem.length) console.log('△ 열쇠로 쓰이지 않는 기억: ' + unusedMem.join(', '));
  if (ungiven.length) console.log('△ 얻을 곳이 없는 기억: ' + ungiven.join(', '));
  for (const [k, it] of Object.entries(ITEMS)) if (it.price && !itemUse[k] && !it.use) warn('ITEMS.' + k, '팔기만 하고 쓰이는 곳이 없음');
}
warns.forEach(w => console.log(w));
errors.forEach(e => console.log(e));
console.log(errors.length ? `\n오류 ${errors.length}건` : '\n오류 없음');
process.exit(errors.length ? 1 : 0);
