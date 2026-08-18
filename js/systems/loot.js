/* ===================== 드랍 테이블 · 지팡이 뽑기 ===================== */

/* 전투 승리 시 전리품 산출.
 * 장소(구역) 개념이 사라졌으므로 적 등급과 행운만으로 계산한다.
 * 반환은 화면에 한 줄씩 찍기 좋게 평평한 배열. */
function rollLoot(tier, bonusPct) {
  tier = Math.max(1, tier || 1);
  bonusPct = bonusPct || 0;
  const luck = getStatValue('luck');
  const drops = [];

  if (Math.random() < 0.22 + tier * 0.04 + luck * 0.005) {
    drops.push({ kind: 'item', itemId: 'magicStone', qty: randInt(1, 2) });
  }

  const equipChance = clamp(0.16 + tier * 0.08 + luck * 0.01 + bonusPct / 100, 0, 0.75);
  if (Math.random() < equipChance) {
    const slot = ['wand', 'robe', 'accessory'][randInt(0, 2)];
    const pool = EQUIP_TEMPLATES_BY_SLOT[slot];
    const candidates = pool.filter((t) => t.tier <= tier);
    const list = candidates.length ? candidates : pool;
    const tpl = list[randInt(0, list.length - 1)];
    drops.push({ kind: 'equip', instance: createEquipInstance(tpl.id, null, tier * 5 + luck + bonusPct) });
  }

  if (Math.random() < 0.09 + luck * 0.004) {
    const scrollIds = Object.values(ITEMS).filter((i) => i.type === 'scroll' && i.price > 0).map((i) => i.id);
    if (scrollIds.length) drops.push({ kind: 'item', itemId: scrollIds[randInt(0, scrollIds.length - 1)], qty: 1 });
  }

  if (Math.random() < 0.18) drops.push({ kind: 'item', itemId: 'healPotion', qty: 1 });

  return drops;
}

/* 지팡이 뽑기: 재료(코어)에 따라 성향이 맞으면 지팡이가 "당신을 선택" */
const WAND_GACHA_COST = 60;

function gachaWand(coreId) {
  const core = WAND_CORES[coreId];
  const bonusPct = 6 + getStatValue('luck') * 1.5;
  const rarityId = rollRarityId(bonusPct);
  const pool = EQUIP_TEMPLATES_BY_SLOT.wand;
  const tpl = pool[randInt(0, pool.length - 1)];
  const inst = createEquipInstance(tpl.id, rarityId);

  const matched = core.matches(state);
  if (matched) {
    const rarity = RARITY_BY_ID[rarityId];
    const prefixDef = PREFIXES.find((p) => p.stat === core.favorsStat) || PREFIXES[0];
    const [amin, amax] = prefixDef.roll;
    const bonusAffix = {
      id: prefixDef.id + '_bond', name: prefixDef.name, stat: prefixDef.stat,
      value: Math.max(1, Math.round(randInt(amin, amax) * rarity.statMult * 1.5)), kind: 'prefix',
    };
    inst.affixes = inst.affixes.filter((a) => a.kind !== 'prefix');
    inst.affixes.unshift(bonusAffix);
  }
  return { instance: inst, matched, core };
}
