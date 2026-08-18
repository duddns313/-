/* ===================== 장비 인스턴스 시스템 (희귀도 · 접사 · 감정 · 강화) ===================== */

function slotLabel(slot) { return slot === 'wand' ? '지팡이' : slot === 'robe' ? '로브' : '장신구'; }

function rollRarityId(bonusPct) {
  bonusPct = bonusPct || 0;
  const pool = RARITIES.filter((r) => r.weight > 0); // common..legendary (artifact 제외)
  const totalWeight = pool.reduce((s, r) => s + r.weight, 0);
  let r = Math.random() * totalWeight;
  let idx = pool.length - 1;
  for (let i = 0; i < pool.length; i++) {
    if (r < pool[i].weight) { idx = i; break; }
    r -= pool[i].weight;
  }
  if (bonusPct > 0 && Math.random() * 100 < bonusPct && idx < pool.length - 1) idx += 1;
  return pool[idx].id;
}

function nextItemUid() {
  state.itemCounter = (state.itemCounter || 0) + 1;
  return 'itm_' + state.itemCounter;
}

function createEquipInstance(templateId, forcedRarityId, bonusPct) {
  const tpl = EQUIP_TEMPLATES[templateId];
  const rarityId = forcedRarityId || rollRarityId(bonusPct);
  const rarity = RARITY_BY_ID[rarityId];
  const [lo, hi] = tpl.range;
  const baseValue = tpl.starter ? lo : Math.round(randInt(lo, hi) * rarity.statMult);

  const affixes = [];
  for (let i = 0; i < rarity.affixSlots; i++) {
    const kind = i === 0 ? 'prefix' : 'suffix';
    /* 접미사 자리에는 스탯 대신 어빌리티가 붙을 수 있다 — 이쪽이 전투를 실제로 바꾼다 */
    if (kind === 'suffix') {
      const ability = rollAbility(rarityId);
      if (ability) { affixes.push({ id: ability.id, name: ability.name, ability: true, kind }); continue; }
    }
    const pool = kind === 'prefix' ? PREFIXES : SUFFIXES;
    const pick = pool[randInt(0, pool.length - 1)];
    const [amin, amax] = pick.roll;
    const value = Math.max(1, Math.round(randInt(amin, amax) * rarity.statMult));
    affixes.push({ id: pick.id, name: pick.name, stat: pick.stat, value, kind });
  }

  let uniqueMark = null;
  if (rarity.unique) {
    const m = LEGENDARY_MARKS[randInt(0, LEGENDARY_MARKS.length - 1)];
    uniqueMark = { stat: m.stat, value: m.value, label: m.label };
  }

  return {
    uid: nextItemUid(),
    baseId: templateId,
    slot: tpl.slot,
    rarity: rarityId,
    identified: !rarity.needsId,
    baseValue,
    affixes,
    uniqueMark,
    enhanceLevel: 0,
  };
}

/* 어빌리티 추첨 — 등급이 높을수록 붙을 확률과 후보가 늘어난다 */
const ABILITY_CHANCE = { uncommon: 0.20, rare: 0.35, epic: 0.55, legendary: 0.80, artifact: 1.0 };

function rollAbility(rarityId) {
  const chance = ABILITY_CHANCE[rarityId] || 0;
  if (Math.random() >= chance) return null;
  const idx = rarityIndex(rarityId);
  const pool = ABILITY_LIST.filter((a) => rarityIndex(a.minRarity) <= idx);
  if (!pool.length) return null;
  return pool[randInt(0, pool.length - 1)];
}

/* 지금 장착 중인 장비가 이 어빌리티를 갖고 있는가 */
function hasAbility(abilityId) {
  if (!state || !state.equipped) return false;
  return ['wand', 'robe', 'accessory'].some((slot) => {
    const inst = getEquippedInstance(slot);
    if (!inst || !inst.identified) return false;
    return inst.affixes.some((a) => a.ability && a.id === abilityId);
  });
}

function equippedAbilities() {
  const found = [];
  ['wand', 'robe', 'accessory'].forEach((slot) => {
    const inst = getEquippedInstance(slot);
    if (!inst || !inst.identified) return;
    inst.affixes.forEach((a) => { if (a.ability && ABILITIES[a.id]) found.push(ABILITIES[a.id]); });
  });
  return found;
}

function getItemStatBreakdown(instance) {
  const tpl = EQUIP_TEMPLATES[instance.baseId];
  const breakdown = {};
  const mainVal = Math.round(instance.baseValue * (1 + instance.enhanceLevel * 0.08));
  breakdown[tpl.stat] = (breakdown[tpl.stat] || 0) + mainVal;
  instance.affixes.forEach((a) => { if (!a.ability) breakdown[a.stat] = (breakdown[a.stat] || 0) + a.value; });
  if (instance.uniqueMark) breakdown[instance.uniqueMark.stat] = (breakdown[instance.uniqueMark.stat] || 0) + instance.uniqueMark.value;
  return breakdown;
}

function getItemDisplayName(instance) {
  const tpl = EQUIP_TEMPLATES[instance.baseId];
  if (!instance.identified) return `미확인 ${slotLabel(tpl.slot)}`;
  const prefix = instance.affixes.find((a) => a.kind === 'prefix');
  const suffix = instance.affixes.find((a) => a.kind === 'suffix');
  let name = tpl.name;
  /* "행운의 행운의 토끼발"처럼 접두사가 기본 이름과 겹치는 경우를 피한다 */
  if (prefix && name.indexOf(prefix.name) !== 0) name = `${prefix.name} ${name}`;
  if (suffix) name = `${name} : ${suffix.name}`;
  if (instance.enhanceLevel > 0) name += ` +${instance.enhanceLevel}`;
  return name;
}

function getEquippedTotal(statKey) {
  let total = getTitleBonusValue(statKey);
  ['wand', 'robe', 'accessory'].forEach((slot) => {
    const uid = state.equipped[slot];
    if (!uid) return;
    const inst = state.equipment.find((e) => e.uid === uid);
    if (!inst) return;
    total += getItemStatBreakdown(inst)[statKey] || 0;
  });
  return total;
}

function getTitleBonusValue(statKey) {
  if (!state.equippedTitle) return 0;
  const title = TITLES[state.equippedTitle];
  if (!title || !title.bonus) return 0;
  return title.bonus[statKey] || 0;
}

function getEquippedInstance(slot) {
  const uid = state.equipped[slot];
  return uid ? state.equipment.find((e) => e.uid === uid) : null;
}

/* ---------------- 감정 ---------------- */
function identifyDc(instance) {
  return 4 + rarityIndex(instance.rarity) * 2;
}

function identifyItem(instance) {
  const result = skillCheck('intelligence', identifyDc(instance));
  if (result.tier === 'success' || result.tier === 'critical') instance.identified = true;
  return result;
}

/* ---------------- 강화 ---------------- */
const ENHANCE_RATES = [100, 100, 100, 100, 90, 80, 65, 50, 35, 20];

function enhanceCost(currentLevel) {
  return { stones: currentLevel + 1, gold: 20 + currentLevel * 15 };
}

function enhanceItem(instance) {
  const target = instance.enhanceLevel + 1;
  if (target > 10) return { success: false, maxed: true };
  const rate = ENHANCE_RATES[target - 1];
  const roll = randInt(1, 100);
  if (roll <= rate) {
    instance.enhanceLevel = target;
    return { success: true, roll, rate, level: target };
  }
  const pool = RARITIES.filter((r) => r.weight > 0);
  const idx = pool.findIndex((r) => r.id === instance.rarity);
  const newRarity = pool[Math.max(0, idx - 1)];
  instance.rarity = newRarity.id;
  instance.enhanceLevel = 0;
  if (instance.affixes.length > newRarity.affixSlots) instance.affixes = instance.affixes.slice(0, newRarity.affixSlots);
  if (!newRarity.unique) instance.uniqueMark = null;
  if (!newRarity.needsId) instance.identified = true;
  return { success: false, roll, rate, downgradedTo: newRarity.id };
}
