/* ===================== 주문 습득 · 숙련도 · 계열 시스템 ===================== */

function getMasteryTier(mastery) {
  return SPELL_MASTERY_TIERS.find((t) => mastery >= t.min && mastery <= t.max) || SPELL_MASTERY_TIERS[0];
}

/* 레벨에 따른 최대 습득 슬롯. 학년(3년) 구조 대신 레벨을 게이트로 사용 — 전 계열 마스터를 막아 빌드 선택을 강제한다. */
function maxLearnedSpells(level) {
  return clamp(1 + level, 2, Object.keys(SPELLS).length);
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
  if (learnedSpellCount() >= maxLearnedSpells(state.level)) return { ok: false, reason: 'slot_full' };
  return { ok: true };
}

function learnSpell(spellId, initialMastery) {
  const check = canLearnSpell(spellId);
  if (!check.ok) return check;
  state.spells[spellId] = clamp(initialMastery || 10, 1, 100);
  return { ok: true };
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
