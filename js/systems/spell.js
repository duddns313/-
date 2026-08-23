/* ===================== 주문 습득 · 숙련도 · 계열 시스템 ===================== */

function getMasteryTier(mastery) {
  return SPELL_MASTERY_TIERS.find((t) => mastery >= t.min && mastery <= t.max) || SPELL_MASTERY_TIERS[0];
}

/* ── 손에 익히는 것은 넷까지 ──────────────────────────────
 * 배운 주문이 열 개가 되면 아무도 열 개를 쓰지 않는다. 늘 쓰던 셋만 쓴다.
 * 그래서 전투에 들고 가는 자리를 넷으로 묶었다.
 *
 * 나머지는 잃는 게 아니라 수첩에 적혀 있다. 이 게임의 세계 규칙 3이
 * 「손으로 쓴 것은 남는다」이므로, 안 들고 다니는 주문은 수첩에 남고
 * 전투 밖에서 언제든 자리를 바꿔 끼울 수 있다. 숙련도도 그대로 있다.
 *
 * 그러니까 결정은 "무엇을 버리나"가 아니라 "지금 무엇을 손에 두나"다. */
const SPELL_SLOTS = 4;

function spellSlots() {
  if (!Array.isArray(state.spellSlots)) state.spellSlots = [null, null, null, null];
  while (state.spellSlots.length < SPELL_SLOTS) state.spellSlots.push(null);
  if (state.spellSlots.length > SPELL_SLOTS) state.spellSlots.length = SPELL_SLOTS;
  /* 배운 적 없는 주문이 자리에 남아 있으면 비운다 (세이브 호환) */
  state.spellSlots = state.spellSlots.map((id) => (id && state.spells[id] != null ? id : null));
  return state.spellSlots;
}

function equippedSpellIds() { return spellSlots().filter(Boolean); }
function isEquippedSpell(id) { return spellSlots().indexOf(id) >= 0; }
function benchedSpellIds() { return Object.keys(state.spells).filter((id) => !isEquippedSpell(id)); }
function freeSlotIndex() { return spellSlots().indexOf(null); }

/* 자리에 끼운다. slot을 안 주면 빈자리를 찾고, 빈자리가 없으면 실패한다. */
function equipSpell(spellId, slot) {
  if (state.spells[spellId] == null) return false;
  const slots = spellSlots();
  const already = slots.indexOf(spellId);
  const target = slot != null ? slot : freeSlotIndex();
  if (target < 0 || target >= SPELL_SLOTS) return false;
  /* 이미 다른 자리에 있으면 서로 맞바꾼다 */
  if (already >= 0) { slots[already] = slots[target]; }
  slots[target] = spellId;
  return true;
}

function unequipSpell(slot) {
  const slots = spellSlots();
  if (slot < 0 || slot >= SPELL_SLOTS) return;
  slots[slot] = null;
}

/* 익힌 주문의 총량 상한. 자리가 넷으로 묶여 있으므로 여기는 느슨하게 둔다 —
 * 수첩은 두꺼워도 되고, 두꺼울수록 판마다 다른 넷을 고를 수 있다. */
function maxLearnedSpells() {
  return 14;
}

function learnedSpellCount() {
  return Object.keys(state.spells).length;
}

function nextSpellForSubject(subjectId) {
  const candidates = Object.values(SPELLS)
    .filter((sp) => sp.subject === subjectId && !state.spells[sp.id])
    .sort((a, b) => a.tier - b.tier);
  return candidates[0] || null;
}

function canLearnSpell(spellId) {
  const sp = SPELLS[spellId];
  if (!sp) return { ok: false, reason: 'not_found' };
  if (state.spells[spellId] != null) return { ok: false, reason: 'already_known' };
  if (sp.prereq) {
    const pm = state.spells[sp.prereq.spell] || 0;
    if (pm < sp.prereq.mastery) return { ok: false, reason: 'prereq', need: sp.prereq };
  }
  if (learnedSpellCount() >= maxLearnedSpells()) return { ok: false, reason: 'slot_full' };
  return { ok: true };
}

function learnSpell(spellId, initialMastery) {
  const check = canLearnSpell(spellId);
  if (!check.ok) return check;
  state.spells[spellId] = clamp(initialMastery || 10, 1, 100);

  /* 자리가 비어 있으면 그냥 들어간다. */
  const slot = freeSlotIndex();
  if (slot >= 0) { spellSlots()[slot] = spellId; return { ok: true, equipped: true }; }

  /* 꽉 찼을 때 그냥 수첩에 넣어두면, 「준비」를 한 번도 안 열어본 사람은
   * 판이 끝날 때까지 처음 배운 넷으로만 싸우게 된다. 그건 선택이 아니라 함정이다.
   * 그래서 같은 역할을 하는 더 나은 주문이면 낮은 쪽을 내리고 자동으로 끼운다.
   * 무엇이 내려갔는지 로그로 알려주고, 마음에 안 들면 「준비」에서 도로 바꾸면 된다. */
  const swap = weakerSameRoleSlot(spellId);
  if (swap >= 0) {
    const dropped = spellSlots()[swap];
    spellSlots()[swap] = spellId;
    return { ok: true, equipped: true, replaced: dropped };
  }
  return { ok: true, equipped: false };
}

/* 같은 역할을 하면서 확실히 더 약한 주문이 손에 있으면 그 자리를 돌려준다.
 * 없으면 -1 — 그때는 무엇을 내릴지가 진짜 판단이므로 사람이 정해야 한다. */
function weakerSameRoleSlot(spellId) {
  const nu = SPELLS[spellId];
  if (!nu) return -1;
  const role = (sp) => sp.type || 'attack';
  let best = -1, bestTier = 99;
  spellSlots().forEach((id, i) => {
    if (!id) return;
    const cur = SPELLS[id];
    if (!cur || role(cur) !== role(nu)) return;
    if ((cur.tier || 0) >= (nu.tier || 0)) return;   /* 더 세거나 같으면 안 내린다 */
    /* 그 역할을 하는 주문이 하나뿐이면 내려도 역할이 비지 않는지 확인할 필요가 없다 —
     * 어차피 같은 역할로 바꿔 끼우는 것이므로. */
    if ((cur.tier || 0) < bestTier) { bestTier = cur.tier || 0; best = i; }
  });
  return best;
}

function gainMastery(spellId, amount) {
  if (state.spells[spellId] == null) return;
  state.spells[spellId] = clamp(state.spells[spellId] + amount, 0, 100);
}

function forgetSpell(spellId) {
  if (state.spells[spellId] == null) return false;
  delete state.spells[spellId];
  return true;
}

/* ---------------- 수업 진도 ---------------- */
function getClassProgressGain() {
  return 8 + Math.floor(getStatValue('intelligence') / 3);
}

function attendClassProgress(subjectId) {
  state.classProgress = state.classProgress || {};
  const cur = state.classProgress[subjectId] || 0;
  state.classProgress[subjectId] = Math.min(100, cur + getClassProgressGain());
  return state.classProgress[subjectId];
}

/* ---------------- 시전 스탯 계산 (숙련도 반영) ---------------- */
function getSpellCastInfo(spellId) {
  const sp = SPELLS[spellId];
  const mastery = state.spells[spellId] || 0;
  const tier = getMasteryTier(mastery);
  let power = (sp.power || 0) * tier.powerMult;
  if (sp.dark) power += getEquippedTotal('curseBonus');
  const healAmount = (sp.healAmount || 0) * tier.powerMult;
  const mpCost = Math.max(1, Math.round(sp.mpCost * tier.mpMult));
  return { power, healAmount, mpCost, failChance: tier.failChance, critBonus: tier.critBonus || 0, tierLabel: tier.label, mastery };
}
