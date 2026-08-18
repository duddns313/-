/* ===================== 「기록」 — 회차를 넘는 유일한 것 =====================
 *
 * 세계 규칙 3: 손으로 쓴 잉크는 남는다.
 * 세계 규칙 4: 그러나 읽어도 붙들지 못한다.
 *
 * 영운은 매 회차 잊은 채로 시작한다. 플레이어만 기억한다.
 * 그래서 회차를 넘어 남는 것은 "적어둔 것"뿐이다 — 이 파일이 그 수첩이다.
 *
 * ⭐ 스탯·장비·레벨은 절대 계승되지 않는다. 계승되는 것은 "아는 것"뿐이다.
 *    그래야 매 판이 처음부터 위태롭고, 성장한 것이 캐릭터가 아니라 플레이어가 된다. */

const LEDGER_KEY = 'hp_ledger_v1';

let ledger = null;

function newLedger() {
  return {
    version: 1,
    names: {},        /* 침식 0으로 지켜낸 인물 id */
    fragments: {},    /* 확보한 이름 조각 번호 */
    endings: {},      /* 도달한 엔딩 id */
    traits: {},       /* 승급시킨 상위 특성 id */
    spellLore: {},    /* 한 판에서 숙련도 60 이상 찍은 주문 id */
    runs: 0,
    bestProgress: 0,
  };
}

function loadLedger() {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    ledger = raw ? JSON.parse(raw) : newLedger();
  } catch (e) {
    ledger = newLedger();
  }
  /* 구버전 기록에 새 필드가 없을 때를 대비 — 기록은 절대 버리지 않는다 */
  const fresh = newLedger();
  Object.keys(fresh).forEach((k) => { if (ledger[k] === undefined) ledger[k] = fresh[k]; });
  return ledger;
}

function saveLedger() {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
    return true;
  } catch (e) {
    return false;
  }
}

function ledgerHasName(id) { return !!(ledger && ledger.names[id]); }
function ledgerHasFragment(n) { return !!(ledger && ledger.fragments[n]); }
function ledgerHasEnding(id) { return !!(ledger && ledger.endings[id]); }
function ledgerHasTrait(id) { return !!(ledger && ledger.traits[id]); }
function ledgerHasSpellLore(id) { return !!(ledger && ledger.spellLore[id]); }

function ledgerEndingCount() { return Object.keys(ledger.endings).length; }

/* ── 기록에 적는다 ── */

function recordFragment(n) {
  if (!n || ledgerHasFragment(n)) return false;
  ledger.fragments[n] = true;
  saveLedger();
  const f = NAME_FRAGMENTS.find((x) => x.n === n);
  if (f && typeof toast === 'function') {
    toast(`✒️ 기록에 남았다 — ${f.label} (${fragmentCount()}/6)`, { duration: 3600 });
  }
  return true;
}

function recordTraitUpgrade(id) {
  if (ledgerHasTrait(id)) return;
  ledger.traits[id] = true;
  saveLedger();
}

/* 판이 끝날 때 호출 — 이번 판에서 무엇이 기록에 남는가 */
function commitRunToLedger(endingId) {
  ledger.runs += 1;
  if (state.progress > ledger.bestProgress) ledger.bestProgress = state.progress;
  if (endingId) ledger.endings[endingId] = true;

  /* 침식 0으로 끝까지 지켜낸 이름만 기록에 남는다 */
  Object.keys(state.register).forEach((id) => {
    if (erosionOf(id) === 0 && PEOPLE[id] && PEOPLE[id].erodible) ledger.names[id] = true;
  });

  /* 숙련도 60 이상 도달한 주문은 다음 판 주문서 판정이 쉬워진다 */
  Object.keys(state.spells || {}).forEach((id) => {
    if (state.spells[id] >= 60) ledger.spellLore[id] = true;
  });

  /* 이번 판에 승급시킨 상위 특성 */
  (state.traits || []).forEach((id) => {
    if (TRAITS[id] && TRAITS[id].tier === 2) ledger.traits[id] = true;
  });

  saveLedger();
}

/* ── 기록이 다음 판에 주는 것 ── */

/* 기록에 있는 이름은 시작부터 침식에 한 단계 버틴다 */
function ledgerErosionResist(id) {
  return ledgerHasName(id) ? 1 : 0;
}

/* 아는 주문은 주문서 해독이 쉬워진다 */
function ledgerScrollDcRelief(spellId) {
  return ledgerHasSpellLore(spellId) ? 2 : 0;
}

/* 엔딩을 모을수록 시작이 조금 나아진다 (5종·10종·14종) */
function ledgerStartingBonus() {
  const n = ledgerEndingCount();
  if (n >= 14) return { points: 3, gold: 60 };
  if (n >= 10) return { points: 2, gold: 40 };
  if (n >= 5) return { points: 1, gold: 20 };
  return { points: 0, gold: 0 };
}

function wipeLedger() {
  localStorage.removeItem(LEDGER_KEY);
  ledger = newLedger();
}
