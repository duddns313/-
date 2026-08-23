/* ===================== 헤드리스 밸런스 시뮬레이터 =====================
 * 게임 번들에는 포함되지 않는 개발 도구.
 *
 *   node scripts/simulate.js [판수]
 *
 * UI 없이 한 판을 끝까지 돌려서 ADVENTURE_PLAN §16의 검증 기준을 재본다.
 * 선택지는 무작위로 고른다 — "아무렇게나 눌러도 판이 성립하는가"가 1차 관문이다. */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* index.html과 같은 순서로 읽는다 (UI·부트스트랩은 제외) */
const FILES = [
  'js/data/houses.js',
  'js/data/backgrounds.js',
  'js/data/traits.js',
  'js/data/rarity.js',
  'js/data/spells.js',
  'js/data/enemies.js',
  'js/data/people.js',
  'js/data/fragments.js',
  'js/data/endings.js',
  'js/data/achievements.js',
  'js/data/beats.js',
  'js/data/encounters/common.js',
  'js/data/encounters/search.js',
  'js/data/encounters/combat.js',
  'js/data/encounters/eerie.js',
  'js/data/encounters/deep.js',
  'js/data/encounters/saga.js',
  'js/data/encounters/special.js',
  'js/systems/ledger.js',
  'js/systems/check.js',
  'js/systems/item.js',
  'js/systems/loot.js',
  'js/systems/spell.js',
  'js/systems/duel.js',
  'js/systems/achievement.js',
  'js/systems/register.js',
  'js/systems/progress.js',
  'js/state.js',
  'js/engine.js',
];

/* UI 자리를 메우는 최소 스텁. 여기서 잡히는 예외가 곧 실제 버그다. */
const STUBS = `
const _store = {};
const localStorage = {
  getItem: (k) => (_store[k] === undefined ? null : _store[k]),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
};
let EMITTED = [];
let HOLD_MODE = false;
function sceneEmit(text, cls) { if (text) EMITTED.push({ text: String(text), cls: cls || '' }); }
function render() {}
function uiStartEncounter() {}
function toast() {}
function notifyCheck() {}
`;

const source = STUBS + FILES.map((f) => `\n/* ==== ${f} ==== */\n` + fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');

const DRIVER = `
/* vm 스크립트 스코프의 const는 컨텍스트에 붙지 않으므로 함수로 꺼낸다 */
function getRunLog() { return EMITTED; }
function getData() { return { ENDINGS, ENDING_LIST, BACKGROUNDS, ALL_ENCOUNTERS, BEAT_LIST }; }

/* 이름이 흐려졌고 체력이 남아 있으면 붙든다 — 명부 탭을 실제로 쓰는 플레이어 */
function tryHold() {
  if (!state.flags.holdUnlocked) return;
  const ids = Object.keys(state.register).filter((id) => canHold(id) && erosionOf(id) >= 2);
  if (!ids.length) return;
  if (state.hp < getMaxHp() * 0.4) return;
  holdName(ids[0], 'courage');
}

/* 턴제 전투를 무난하게 굴리는 정책 —
 * 체력이 낮으면 회복, 마력이 남으면 제일 센 공격, 없으면 지팡이. */
function simCombatTurn() {
  const list = castableSpells();
  const affordable = list.filter((sp) => state.mp >= spellMpCost(sp));

  if (state.hp < getMaxHp() * 0.35) {
    const heal = affordable.filter((sp) => sp.type === 'heal')[0];
    if (heal) { combatCast(heal.id); return; }
    const potion = Object.keys(state.itemStacks).filter((id) => ITEMS[id] && ITEMS[id].type === 'potion')[0];
    if (potion) { combatUseItemAction(potion); return; }
  }
  if (state.mp < 4 && state.hp > getMaxHp() * 0.5) { combatDefendAction(); return; }

  const attacks = affordable.filter((sp) => sp.type === 'attack' || sp.id === '_wand');
  attacks.sort((a, b) => estimateDamageSim(b) - estimateDamageSim(a));
  combatCast((attacks[0] || WAND_STRIKE).id);
}

function estimateDamageSim(sp) {
  const info = sp.id === '_wand' ? { power: WAND_STRIKE.power } : getSpellCastInfo(sp.id);
  const enemy = currentEnemy();
  let power = info.power + getAtk() + getStatValue('intelligence') * 0.3;
  if (enemy && sp.bonusVs && sp.bonusVs.indexOf(enemy.id) >= 0) power *= sp.bonusMult || 2;
  if (enemy && enemy.weakness === sp.id) power *= 1.5;
  return power - (sp.pierce ? 0 : ((enemy && enemy.def) || 0));
}

/* 인카운터에 들어가기 전에 몸을 추스른다.
 * 이게 없으면 시뮬레이터는 체력 15%로 다음 판정에 걸어 들어가고,
 * 그 결과 사망률이 실제 플레이보다 훨씬 높게 나온다.
 * 가진 회복 수단을 쓰는 건 사람이라면 누구나 하는 일이므로 정책에 넣는다. */
/* 손에 익힌 넷을 정비한다 — 사람이라면 「준비」를 열어 더 센 걸 끼운다.
 * 이걸 안 하면 시뮬레이터는 처음 배운 넷으로 판을 끝까지 간다. */
function simArrangeSpells() {
  const bench = benchedSpellIds();
  if (!bench.length) return;
  const worth = (id) => {
    const sp = SPELLS[id];
    return (sp.tier || 0) * 10 + (state.spells[id] || 0) / 10 + (sp.type === 'attack' ? 3 : 0);
  };
  bench.sort((a, b) => worth(b) - worth(a));
  spellSlots().forEach((id, i) => {
    if (!bench.length) return;
    if (id && worth(bench[0]) <= worth(id) + 5) return;
    /* 회복 주문 하나는 남겨둔다 — 전부 공격으로 갈아끼우면 오래 못 버틴다 */
    const heals = equippedSpellIds().filter((x) => SPELLS[x].type === 'heal');
    if (id && SPELLS[id].type === 'heal' && heals.length <= 1) return;
    equipSpell(bench.shift(), i);
  });
}

function simTendWounds() {
  if (state.hp >= getMaxHp() * 0.5) return;
  const potion = Object.keys(state.itemStacks)
    .filter((id) => ITEMS[id] && ITEMS[id].type === 'potion' && ITEMS[id].effect && ITEMS[id].effect.hp)
    .sort((a, b) => ITEMS[a].effect.hp - ITEMS[b].effect.hp)[0];
  if (potion) { useItemOutOfCombat(potion); return; }
  /* 물약이 없고 갈레온이 있으면 다음 호그스미드에서 산다 —
   * 그건 상점 선택지가 알아서 하므로 여기서는 아무것도 하지 않는다. */
}

function runOnce(bgId, houseId, traitId, holdMode) {
  HOLD_MODE = !!holdMode;
  EMITTED = [];
  state = newRun(houseId, bgId, traitId, {});
  const trace = { encounters: 0, combats: 0, holds: 0, beats: 0, maxProgress: 0, combatTurns: 0, stages: 0 };

  nextEncounter();

  let guard = 0;
  while (state.mode !== 'ending' && guard < 1200) {
    guard += 1;
    if (state.mode === 'combat') { trace.combatTurns += 1; simCombatTurn(); continue; }
    if (state.phase === 'body') {
      simTendWounds();
      simArrangeSpells();
      if (HOLD_MODE) tryHold();
      const enc = currentEncounter();
      if (!enc) { finishEncounter(2); continue; }
      const list = visibleChoices(enc);
      trace.encounters += 1;
      if (state.isBeat) trace.beats += 1;
      if ((state.stageIndex || 0) > 0) trace.stages += 1;
      if (!list.length) { finishEncounter(enc.gain || 2); continue; }
      const pick = list[randInt(0, list.length - 1)];
      if (pick.c.combat || (pick.c.outcomes && Object.values(pick.c.outcomes).some((o) => o.combat))) trace.combats += 1;
      resolveChoice(pick.i);
    } else {
      continueRun();
    }
    if (state.progress > trace.maxProgress) trace.maxProgress = state.progress;
  }

  if (state.mode !== 'ending') {
    return { ok: false, reason: 'guard', turns: guard, progress: state.progress };
  }

  return {
    ok: true,
    ending: state.ending,
    endingKind: ENDINGS[state.ending].kind,
    turns: trace.encounters,
    beats: trace.beats,
    progress: Math.floor(trace.maxProgress),
    level: state.level,
    spells: Object.keys(state.spells).length,
    held: heldCount(),
    fragments: fragmentCount(),
    gold: state.gold,
    combatWins: state.statsTrack.combatWins || 0,
    combatTurns: trace.combatTurns,
    combatLoss: EMITTED.filter((l) => l.text.indexOf('무릎이 꺾였다') >= 0).length,
    combatFled: EMITTED.filter((l) => l.text.indexOf('물러섰다. 뒤에서') >= 0).length,
    hpFromCombat: EMITTED.filter((l) => /의 공격 — 체력 −/.test(l.text))
      .reduce((s2, l) => s2 + (parseInt((l.text.match(/−(\d+)/) || [])[1], 10) || 0), 0),
    hpFromEnc: EMITTED.filter((l) => l.cls === 'log-effect-chip' && /체력 -/.test(l.text))
      .reduce((s2, l) => s2 + (parseInt((l.text.match(/체력 -(\d+)/) || [])[1], 10) || 0), 0),
    deepStages: trace.stages,
    equips: state.equipment.length,
    seenEnemies: Object.keys(state.seenEnemies).length,
    holds: state.statsTrack.holds || 0,
    maxMastery: Math.max.apply(null, Object.values(state.spells)),
    missedBeats: BEAT_LIST.filter((b) => !state.beatsDone[b.id]).map((b) => b.order + ':' + b.title).join(','),
    endProgress: Math.floor(state.progress),
    learned: state.log.filter((l) => l.text.indexOf('익혔다 —') >= 0).length,
    practiced: state.log.filter((l) => l.text.indexOf('반복해 연습했다') >= 0).length,
    blockedPrereq: state.log.filter((l) => l.text.indexOf('손에 붙지 않는다') >= 0).length,
    blockedFull: state.log.filter((l) => l.text.indexOf('꽉 찼다') >= 0).length,
    noSubject: state.log.filter((l) => l.text.indexOf('손에 붙지 않았다') >= 0).length,
  };
}
`;

const context = {
  console,
  Math,
  JSON,
  Date,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Error,
  isNaN,
  parseInt,
  parseFloat,
};
vm.createContext(context);

try {
  vm.runInContext(source + DRIVER, context, { filename: 'bundle.js' });
} catch (e) {
  console.error('로드 실패:', e.message);
  console.error(e.stack.split('\n').slice(0, 6).join('\n'));
  process.exit(1);
}

/* ---------------- 실행 ---------------- */

const RUNS = parseInt(process.argv[2], 10) || 200;
const HOLD = process.argv.indexOf('--hold') >= 0;
const BGS = ['transfer', 'bereaved', 'archivist', 'touched'];
const HOUSES_L = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'];
const TRAITS_L = ['tenacious', 'keenEye', 'bold', 'ordinary'];

context.loadLedger();
const DATA = context.getData();

const results = [];
const failures = [];

for (let i = 0; i < RUNS; i++) {
  const bg = BGS[i % BGS.length];
  const house = HOUSES_L[Math.floor(Math.random() * 4)];
  const trait = TRAITS_L[Math.floor(Math.random() * 4)];
  let r;
  try {
    r = context.runOnce(bg, house, trait, HOLD);
  } catch (e) {
    failures.push({ bg, house, trait, error: e.message, stack: e.stack.split('\n')[1] });
    continue;
  }
  if (!r.ok) { failures.push({ bg, house, trait, error: '판이 끝나지 않음 (' + r.reason + ', 진행도 ' + Math.floor(r.progress) + ')' }); continue; }
  r.bg = bg;
  results.push(r);
}

/* ---------------- 보고 ---------------- */

function avg(key) { return results.length ? (results.reduce((s, r) => s + r[key], 0) / results.length) : 0; }
function pct(n) { return ((n / results.length) * 100).toFixed(1) + '%'; }

if (process.argv.indexOf('--sample') >= 0) {
  context.state = null;
  const r = context.runOnce('transfer', 'gryffindor', 'bold', true);
  console.log('\n──── 표본 판의 로그 (전투·판정 위주) ────\n');
  const log = context.getRunLog();
  log.forEach((l) => console.log((l.cls || '').padEnd(18) + '| ' + l.text.slice(0, 100)));
  process.exit(0);
}

console.log('');
console.log('════════ 시뮬레이션 ' + RUNS + '판' + (HOLD ? ' · 붙들기 ON' : ' · 붙들기 OFF') + ' ════════');
console.log('');

if (failures.length) {
  console.log('❌ 실패 ' + failures.length + '건');
  const seen = {};
  failures.forEach((f) => {
    const key = f.error;
    if (seen[key]) { seen[key].n += 1; return; }
    seen[key] = { n: 1, at: f.stack, bg: f.bg };
  });
  Object.keys(seen).forEach((k) => {
    console.log('   [' + seen[k].n + '회] ' + k);
    if (seen[k].at) console.log('        ' + seen[k].at.trim());
  });
  console.log('');
}

if (!results.length) { console.log('성공한 판이 없습니다.'); process.exit(1); }

console.log('── 한 판의 모양 ──');
console.log('  인카운터   평균 ' + avg('turns').toFixed(1) + '  (목표 45~55)');
const reached = results.filter((r) => r.progress >= 88);
const beatsWhenReached = reached.length ? reached.reduce((s, r) => s + r.beats, 0) / reached.length : 0;
console.log('  고정 비트  평균 ' + avg('beats').toFixed(2) + '  (88%까지 간 판에서는 ' + beatsWhenReached.toFixed(2) + ' / 5.00)');
console.log('  최종 레벨  평균 ' + avg('level').toFixed(1) + '  (목표 8~10)');
console.log('  습득 주문  평균 ' + avg('spells').toFixed(1) + '  (목표 6~10)');
console.log('  최고 숙련  평균 ' + avg('maxMastery').toFixed(0));
console.log('  전투 승리  평균 ' + avg('combatWins').toFixed(1) + '  ·  본 몬스터 ' + avg('seenEnemies').toFixed(1) + '종  ·  전투 턴 ' + avg('combatTurns').toFixed(0));
console.log('  전투 패배  평균 ' + avg('combatLoss').toFixed(1) + '  ·  전투로 잃은 체력 ' + avg('hpFromCombat').toFixed(0) + '  ·  인카운터로 잃은 체력 ' + avg('hpFromEnc').toFixed(0));
console.log('  얻은 장비  평균 ' + avg('equips').toFixed(1) + '개  ·  깊이 들어간 단계 ' + avg('deepStages').toFixed(1));
console.log('  붙들기     평균 ' + avg('holds').toFixed(1));
console.log('  남은 이름  평균 ' + avg('held').toFixed(1));
console.log('  갈레온     평균 ' + avg('gold').toFixed(0));
console.log('  [수업] 습득 ' + avg('learned').toFixed(1) + ' · 연습 ' + avg('practiced').toFixed(1)
  + ' · 선행막힘 ' + avg('blockedPrereq').toFixed(1) + ' · 슬롯꽉 ' + avg('blockedFull').toFixed(1)
  + ' · 계열없음 ' + avg('noSubject').toFixed(1));
console.log('');

const missed = {};
reached.forEach((r) => { if (r.missedBeats) missed[r.missedBeats] = (missed[r.missedBeats] || 0) + 1; });
if (Object.keys(missed).length) {
  console.log('── 88%까지 갔는데 놓친 비트 ──');
  Object.keys(missed).forEach((k) => console.log('  ' + k + '  ' + missed[k] + '회'));
  const ex = reached.find((r) => r.missedBeats);
  console.log('  예: 최종 진행도 ' + ex.endProgress + ', 최대 ' + ex.progress + ', 엔딩 ' + ex.ending);
  console.log('');
}

/* 판이 끝난 '원인'은 엔딩 종류와 다르다.
 * 「기록만 남기고」·「반복되는 자」는 조건부 엔딩이지만 진행도 100% 완주다. */
function terminationCause(r) {
  if (r.endingKind === 'death') return 'hp';
  if (r.ending === 'alone' || r.ending === 'lost_the_one') return 'register';
  return 'progress';
}

console.log('── 판이 끝난 원인 ──');
const byCause = {};
results.forEach((r) => { const c = terminationCause(r); byCause[c] = (byCause[c] || 0) + 1; });
[['hp', '체력 0 (사망)'], ['register', '명부 전멸'], ['progress', '진행도 100% (완주)']].forEach(([k, label]) => {
  console.log('  ' + label.padEnd(22) + pct(byCause[k] || 0) + '  (' + (byCause[k] || 0) + ')');
});
console.log('');

console.log('── 엔딩 계열 ──');
const byKind = {};
results.forEach((r) => { byKind[r.endingKind] = (byKind[r.endingKind] || 0) + 1; });
Object.keys(byKind).sort((a, b) => byKind[b] - byKind[a]).forEach((k) => {
  const label = { death: '사망', alone: '명부 전멸', finish: '완주', special: '조건부', true: '진엔딩' }[k] || k;
  console.log('  ' + label.padEnd(16) + pct(byKind[k]) + '  (' + byKind[k] + ')');
});
console.log('');

console.log('── 엔딩 종류 ──');
const byEnding = {};
results.forEach((r) => { byEnding[r.ending] = (byEnding[r.ending] || 0) + 1; });
Object.keys(byEnding).sort((a, b) => byEnding[b] - byEnding[a]).forEach((id) => {
  console.log('  ' + (DATA.ENDINGS[id].title + '').padEnd(20) + byEnding[id]);
});
console.log('  도달한 엔딩 ' + Object.keys(byEnding).length + '/' + DATA.ENDING_LIST.length + '종');
console.log('');

console.log('── 배경별 완주율 ──');
BGS.forEach((bg) => {
  const rs = results.filter((r) => r.bg === bg);
  if (!rs.length) return;
  const done = rs.filter((r) => r.progress >= 100).length;
  console.log('  ' + DATA.BACKGROUNDS[bg].name.padEnd(16) + ((done / rs.length) * 100).toFixed(0) + '%  (' + rs.length + '판)');
});
console.log('');

/* ── 검증 기준 ── */
console.log('── 검증 (ADVENTURE_PLAN §16) ──');
const checks = [
  ['판이 예외 없이 끝난다', failures.length === 0],
  ['인카운터 45~55', avg('turns') >= 40 && avg('turns') <= 60],
  ['끝까지 간 판은 비트 5개를 모두 본다', beatsWhenReached >= 4.95],
  ['최종 Lv.8~10', avg('level') >= 7 && avg('level') <= 11],
  ['주문 6~10개 습득', avg('spells') >= 5.5 && avg('spells') <= 10.5],
  ['죽음이 실재한다 (체력 0이 8% 이상)', (byCause.hp || 0) / results.length >= 0.08],
  ['완주가 전부는 아니다 (진행도 100%가 92% 이하)', (byCause.progress || 0) / results.length <= 0.92],
  ['엔딩 3종 이상 도달', Object.keys(byEnding).length >= 3],
];
checks.forEach(([label, ok]) => console.log('  ' + (ok ? '✅' : '❌') + ' ' + label));
console.log('');
