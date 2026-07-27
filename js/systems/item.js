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

function getItemStatBreakdown(instance) {
  const tpl = EQUIP_TEMPLATES[instance.baseId];
  const breakdown = {};
  const mainVal = Math.round(instance.baseValue * (1 + instance.enhanceLevel * 0.08));
  breakdown[tpl.stat] = (breakdown[tpl.stat] || 0) + mainVal;
  instance.affixes.forEach((a) => { breakdown[a.stat] = (breakdown[a.stat] || 0) + a.value; });
  if (instance.uniqueMark) breakdown[instance.uniqueMark.stat] = (breakdown[instance.uniqueMark.stat] || 0) + instance.uniqueMark.value;
  return breakdown;
}

function getItemDisplayName(instance) {
  const tpl = EQUIP_TEMPLATES[instance.baseId];
  if (!instance.identified) return `미확인 ${slotLabel(tpl.slot)}`;
  const prefix = instance.affixes.find((a) => a.kind === 'prefix');
  const suffix = instance.affixes.find((a) => a.kind === 'suffix');
  let name = tpl.name;
  if (prefix) name = `${prefix.name} ${name}`;
  if (suffix) name = `${name} : ${suffix.name}`;
  if (instance.enhanceLevel > 0) name += ` +${instance.enhanceLevel}`;
  return name;
}

function getEquippedTotal(statKey) {
  let total = 0;
  ['wand', 'robe', 'accessory'].forEach((slot) => {
    const uid = state.equipped[slot];
    if (!uid) return;
    const inst = state.equipment.find((e) => e.uid === uid);
    if (!inst) return;
    total += getItemStatBreakdown(inst)[statKey] || 0;
  });
  return total;
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
