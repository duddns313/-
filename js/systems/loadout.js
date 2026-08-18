/* ===================== 주문 사슬 (편성) =====================
 *
 * 유니콘 오버로드의 핵심은 전투 중 조작이 아니라 전투 전 프로그래밍이다.
 * 주문마다 발동 조건과 우선순위를 미리 짜두고, 전투는 자동으로 굴러간다.
 * 플레이어의 실력 = 편성 실력.
 *
 * 슬롯은 많고 AP는 적다. 그래서 "무엇을 넣느냐"보다 "언제 나가게 하느냐"가 중요하다. */

/* ---------------- 슬롯 · AP ---------------- */

function chainSlots(level) {
  if (level <= 2) return 3;
  if (level <= 4) return 4;
  if (level <= 6) return 5;
  if (level <= 8) return 6;
  return 7;
}

function chainAP(level) {
  let ap = level <= 2 ? 2 : level <= 6 ? 3 : 4;
  if (hasAbility('mastersHand')) ap += 1;
  return ap;
}

/* ---------------- 조건 ----------------
 * ctx는 전투 도중 계속 갱신된다. 앞 주문이 바꾼 상태가 뒤 주문의 조건에 반영되는 것이
 * 이 시스템의 전부다. */

const CHAIN_CONDITIONS = {
  always:      { id: 'always',      label: '항상',              test: () => true },
  first:       { id: 'first',       label: '첫 수',             test: (c) => c.castCount === 0 },
  hpBelow50:   { id: 'hpBelow50',   label: '내 체력 50% 미만',   test: (c) => c.myHp < c.myMaxHp * 0.5 },
  hpBelow25:   { id: 'hpBelow25',   label: '내 체력 25% 미만',   test: (c) => c.myHp < c.myMaxHp * 0.25 },
  enemyBelow50:{ id: 'enemyBelow50',label: '적 체력 50% 미만',   test: (c) => c.dealt >= c.enemyHp * 0.5 },
  riskHigh:    { id: 'riskHigh',    label: '적 위험도 3 이상',   test: (c) => (c.enemy.tier || 1) >= 3 },
  enemyDark:   { id: 'enemyDark',   label: '적이 어둠 속성',     test: (c) => !!c.enemy.weakness || c.enemy.id === 'dementor' },
  rollHigh:    { id: 'rollHigh',    label: '굴림 15 이상',       test: (c) => c.roll >= 15 },
  rollLow:     { id: 'rollLow',     label: '굴림 7 이하',        test: (c) => c.roll <= 7 },
  afterCast:   { id: 'afterCast',   label: '직전 주문 발동함',   test: (c) => c.castCount > 0 },
  noShield:    { id: 'noShield',    label: '방어막 없음',        test: (c) => c.shield <= 0 },
};

const CONDITION_LIST = Object.values(CHAIN_CONDITIONS);

/* ---------------- 사슬 상태 ---------------- */

function getChain() {
  if (!state.chain) state.chain = [];
  const slots = chainSlots(state.level);
  while (state.chain.length < slots) state.chain.push(null);
  if (state.chain.length > slots) state.chain = state.chain.slice(0, slots);
  /* 잊어버린 주문이 슬롯에 남아 있지 않도록 */
  state.chain = state.chain.map((s) => (s && state.spells[s.spellId] != null ? s : null));
  return state.chain;
}

function setChainSlot(idx, spellId, condId) {
  getChain();
  if (idx < 0 || idx >= state.chain.length) return;
  if (!spellId) { state.chain[idx] = null; return; }
  state.chain[idx] = { spellId, cond: condId || defaultConditionFor(spellId) };
}

function moveChainSlot(idx, dir) {
  getChain();
  const j = idx + dir;
  if (j < 0 || j >= state.chain.length) return;
  const tmp = state.chain[idx];
  state.chain[idx] = state.chain[j];
  state.chain[j] = tmp;
}

/* 새 주문을 배웠을 때 빈 슬롯에 알아서 꽂아준다.
 * 편성 화면을 한 번도 안 열어본 플레이어도 전투가 성립해야 한다. */
function defaultConditionFor(spellId) {
  const sp = SPELLS[spellId];
  if (!sp) return 'always';
  if (sp.type === 'heal') return 'hpBelow50';
  /* '첫 수'로 두면 앞 슬롯이 하나라도 나간 뒤라 영영 발동하지 않는다.
   * 방어막은 질 것 같을 때 값이 나가므로 열세 조건이 기본이다. */
  if (sp.type === 'defense') return 'rollLow';
  if (sp.dark) return 'riskHigh';
  return 'always';
}

function autoSlotSpell(spellId) {
  const chain = getChain();
  if (chain.some((s) => s && s.spellId === spellId)) return;
  const empty = chain.indexOf(null);
  if (empty < 0) return;
  chain[empty] = { spellId, cond: defaultConditionFor(spellId) };
}

/* 사슬에 실제로 쓸 수 있는 주문이 하나도 없으면 전투가 성립하지 않는다 */
function chainIsEmpty() {
  return getChain().every((s) => !s);
}

function conditionLabel(condId) {
  const c = CHAIN_CONDITIONS[condId];
  return c ? c.label : '항상';
}
