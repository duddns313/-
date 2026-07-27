/* ===================== 드랍 테이블 · 지팡이 뽑기 ===================== */

/* 전투 승리 시 전리품 산출 (지역 위험도 × 적 등급 × 행운) */
function rollCombatLoot(enemyId, locationId) {
  const enemy = ENEMIES[enemyId];
  const loc = LOCATIONS[locationId] || {};
  const risk = loc.risk || 0;
  const tier = enemy.tier || 1;
  const luck = getStatValue('luck');

  const drops = { gold: randInt(enemy.gold[0], enemy.gold[1]), materials: [], scroll: null, equip: null };

  if (Math.random() < 0.22 + risk * 0.05 + luck * 0.005) {
    drops.materials.push({ id: 'magicStone', qty: randInt(1, 2) });
  }

  const equipChance = enemy.boss ? 1.0 : clamp(0.16 + tier * 0.05 + risk * 0.05 + luck * 0.01, 0, 0.7);
  if (Math.random() < equipChance) {
    const slot = ['wand', 'robe', 'accessory'][randInt(0, 2)];
    const pool = EQUIP_TEMPLATES_BY_SLOT[slot];
    const candidates = pool.filter((t) => t.tier <= Math.max(1, tier));
    const tpl = (candidates.length ? candidates : pool)[randInt(0, (candidates.length ? candidates : pool).length - 1)];
    const bonusPct = (tier + risk) * 4 + luck;
    drops.equip = createEquipInstance(tpl.id, null, bonusPct);
  }

  if (!enemy.boss && Math.random() < 0.07 + luck * 0.003) {
    const scrollIds = Object.values(ITEMS).filter((i) => i.type === 'scroll' && i.price > 0).map((i) => i.id);
    if (scrollIds.length) drops.scroll = scrollIds[randInt(0, scrollIds.length - 1)];
  }

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
