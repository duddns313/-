/* ===================== 게임 엔진 (핵심 로직) ===================== */

function addLog(text, cls) {
  const entry = { text, cls: cls || '' };
  state.log.push(entry);
  if (state.log.length > 300) state.log.shift();
  if (typeof uiAppendLogEntry === 'function') uiAppendLogEntry(entry);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function runCheck(statKey, dc) {
  const result = skillCheck(statKey, dc);
  addLog(`[${STAT_META[statKey].label} 판정 · ${CHECK_TIER_LABEL[result.tier]}] (성공률 ${result.rate}%)`, 'log-check-' + result.tier);
  if (typeof notifyCheck === 'function') notifyCheck(result);
  return result;
}

function addItemStack(itemId, qty) {
  qty = qty || 1;
  state.itemStacks[itemId] = (state.itemStacks[itemId] || 0) + qty;
}

function removeItemStack(itemId, qty) {
  qty = qty || 1;
  if (!state.itemStacks[itemId]) return false;
  state.itemStacks[itemId] -= qty;
  if (state.itemStacks[itemId] <= 0) delete state.itemStacks[itemId];
  return true;
}

function receiveEquipment(inst) {
  state.equipment.push(inst);
  state.seenItemBases[inst.baseId] = true;
  if ((inst.rarity === 'legendary' || inst.rarity === 'artifact') && typeof toast === 'function') {
    toast(`✨ ${RARITY_BY_ID[inst.rarity].name} 등급 아이템을 얻었다!`, { duration: 3200 });
  }
  return inst;
}

/* ---------------- 효과 적용 ---------------- */
function applyEffect(effect) {
  if (!effect) return;
  if (effect.hp) state.hp = clamp(state.hp + effect.hp, 0, getMaxHp());
  if (effect.mp) state.mp = clamp(state.mp + effect.mp, 0, getMaxMp());
  if (effect.gold) state.gold = Math.max(0, state.gold + effect.gold);
  ['intelligence', 'courage', 'charm', 'agility', 'luck'].forEach((k) => {
    if (effect[k]) state.stats[k] += effect[k];
  });
  if (effect.alignment) state.alignment = clamp(state.alignment + effect.alignment, -100, 100);
  if (effect.item) addItemStack(effect.item, 1);
  if (effect.flag) state.flags[effect.flag] = true;
  if (effect.exp) gainExp(effect.exp);
  if (effect.learnSpell) applyLearnSpellEffect(effect.learnSpell);
  if (effect.equipDrop) applyEquipDropEffect(effect.equipDrop);
  if (effect.companionAffinity) applyCompanionAffinity(effect.companionAffinity.id, effect.companionAffinity.amount);
  if (effect.companionAffinityAll) Object.keys(COMPANIONS).forEach((id) => applyCompanionAffinity(id, effect.companionAffinityAll));
}

/* ---------------- 동료 관계 ---------------- */
function applyCompanionAffinity(id, amount) {
  state.companions[id] = clamp((state.companions[id] || 0) + amount, 0, 100);
  checkCompanionMilestones(id);
}

function checkCompanionMilestones(id) {
  const comp = COMPANIONS[id];
  const aff = state.companions[id];
  state.companionMilestones = state.companionMilestones || {};
  state.companionMilestones[id] = state.companionMilestones[id] || {};

  if (aff >= 60 && !state.companionMilestones[id].m60) {
    state.companionMilestones[id].m60 = true;
    const inst = createEquipInstance(comp.giftTemplate, 'rare');
    receiveEquipment(inst);
    addLog(`${comp.name}가 우정의 증표로 [${getItemDisplayName(inst)}]을(를) 건넨다.`, 'log-win');
  }
  if (aff >= 90 && !state.companionMilestones[id].m90) {
    state.companionMilestones[id].m90 = true;
    state.companionAssist = state.companionAssist || {};
    state.companionAssist[id] = true;
    state.stats[comp.favorStat] += 2;
    addLog(`${comp.name}와(과) 둘도 없는 친구가 되었다! 결전에서 도움을 요청할 수 있다. (${STAT_META[comp.favorStat].label} +2)`, 'log-win');
  }
}

function companionAssist(id) {
  const c = state.combat;
  const enemy = c && ENEMIES[c.enemyId];
  if (!c || !enemy || !enemy.boss || !state.companionAssist || !state.companionAssist[id]) return;
  state.companionAssist[id] = false;
  const comp = COMPANIONS[id];
  state.hp = getMaxHp();
  const dmg = Math.max(10, Math.round(getAtk() * 1.5));
  c.enemyHp = Math.max(0, c.enemyHp - dmg);
  addLog(`${comp.name}가 힘을 보탠다! 체력을 모두 회복하고, ${enemy.name}에게 ${dmg}의 추가 피해를 입혔다.`, 'log-win');
  if (c.enemyHp <= 0) { winCombat(); return; }
  enemyTurn();
}

/* 학년 표시용 — 별도의 학년별 콘텐츠 대신 스토리 진행에 따른 진급으로 표시한다 */
function getYear() {
  if (state.flags.ch2_done) return 3;
  if (state.flags.ch1_done) return 2;
  return 1;
}

function applyLearnSpellEffect(spellId) {
  const sp = SPELLS[spellId];
  if (!sp) return;
  if (state.spells[spellId] != null) {
    gainMastery(spellId, 15);
    addLog(`[${sp.name}] 숙련도가 상승했다.`, 'log-spell');
    return;
  }
  const result = learnSpell(spellId, 10);
  if (result.ok) { addLog(`새로운 주문을 습득했다: [${sp.name}]`, 'log-spell'); return; }
  const scroll = Object.values(ITEMS).find((i) => i.type === 'scroll' && i.spellId === spellId);
  if (scroll) { addItemStack(scroll.id, 1); addLog(`아직 배울 수 없어 [${scroll.name}]으로 보관해두었다.`, 'log-warn'); }
}

function applyEquipDropEffect(opts) {
  const pool = EQUIP_TEMPLATES_BY_SLOT[opts.slot] || [];
  const candidates = pool.filter((t) => t.tier <= opts.tier);
  const list = candidates.length ? candidates : pool;
  if (!list.length) return;
  const tpl = list[randInt(0, list.length - 1)];
  const inst = createEquipInstance(tpl.id, null, (opts.tier || 1) * 5);
  receiveEquipment(inst);
  addLog(`[${getItemDisplayName(inst)}]을(를) 얻었다.`, 'log-result');
}

function gainExp(amount) {
  state.exp += amount;
  while (state.exp >= state.expToNext) {
    state.exp -= state.expToNext;
    state.level += 1;
    state.expToNext = Math.floor(state.expToNext * 1.35);
    state.maxHp += 12;
    state.maxMp += 6;
    state.baseAtk += 2;
    state.baseDef += 1;
    state.hp = getMaxHp();
    state.mp = getMaxMp();
    addLog(`레벨 업! Lv.${state.level}이(가) 되었다. (체력/마력 회복, 능력치 상승)`, 'log-levelup');
    addLog(`주문 슬롯이 ${maxLearnedSpells(state.level)}개로 늘어났다.`, 'log-levelup');
  }
}

/* ---------------- 이동 ---------------- */
function travelTo(locId) {
  const loc = LOCATIONS[locId];
  if (!loc) return;
  if (loc.locked && !state.flags.chamber_unlocked) {
    addLog('그곳은 아직 갈 수 없다. 봉인되어 있는 듯하다.', 'log-warn');
    render();
    return;
  }
  state.location = locId;
  addLog(`--- ${loc.name}(으)로 이동했다 ---`, 'log-move');
  state.mode = loc.shop ? 'shop' : 'explore';
  render();
}

/* ---------------- 탐험 / 랜덤 이벤트 ---------------- */
const EXPLORE_STAMINA_COST = 18;
const CLASS_STAMINA_COST = 15;

function canExplore() { return state.stamina >= EXPLORE_STAMINA_COST; }
function canAttendClass() { return state.stamina >= CLASS_STAMINA_COST; }

function explore() {
  if (!canExplore()) {
    addLog('기력이 부족하다. 휴식을 취해야 할 것 같다.', 'log-warn');
    render();
    return;
  }
  state.stamina = clamp(state.stamina - EXPLORE_STAMINA_COST, 0, state.maxStamina);
  const loc = LOCATIONS[state.location];
  state.statsTrack.exploreByTag[loc.tag] = (state.statsTrack.exploreByTag[loc.tag] || 0) + 1;
  trackDaily('explore');
  const pool = EVENTS[loc.tag];
  if (!pool || pool.length === 0) {
    addLog('특별한 일이 일어나지 않았다.', '');
    state.day += 1;
    render();
    return;
  }
  const eligible = pool.filter((ev) => {
    if (ev.once && state.flags['event_' + ev.id]) return false;
    if (ev.requiresFlag && !state.flags[ev.requiresFlag]) return false;
    if (ev.notFlag && state.flags[ev.notFlag]) return false;
    if (ev.requiresFn && !ev.requiresFn(state)) return false;
    return true;
  });
  // 핵심(퀘스트) 이벤트가 조건을 충족했다면 잡다한 이벤트에 묻히지 않고 최우선으로 등장한다
  const priorityEligible = eligible.filter((ev) => ev.priority);
  const chosenPool = priorityEligible.length > 0 ? priorityEligible
    : eligible.length > 0 ? eligible
      : pool.filter((ev) => !ev.once);
  if (chosenPool.length === 0) {
    addLog('특별한 일이 일어나지 않았다.', '');
    state.day += 1;
    render();
    return;
  }
  const ev = chosenPool[randInt(0, chosenPool.length - 1)];
  if (ev.once) state.flags['event_' + ev.id] = true;
  state.day += 1;

  if (ev.combat) {
    addLog(ev.text, 'log-event');
    startCombat(ev.combat);
    return;
  }

  state.pendingEvent = ev;
  state.mode = 'event';
  addLog(ev.text, 'log-event');
  render();
}

function resolveEventChoice(choiceIdx) {
  const ev = state.pendingEvent;
  if (!ev) return;
  const choice = ev.choices[choiceIdx];
  if (!choice) return;
  if (choice.requiresGold && state.gold < choice.requiresGold) {
    addLog('갈레온이 부족하다.', 'log-warn');
    render();
    return;
  }
  if (choice.cost && choice.cost.mp) {
    if (state.mp < choice.cost.mp) { addLog('마력이 부족하다.', 'log-warn'); render(); return; }
    state.mp -= choice.cost.mp;
  }

  let resolved = choice;
  if (choice.check) {
    const result = runCheck(choice.check.stat, choice.check.dc);
    const outcome = choice.outcomes[result.tier]
      || (result.tier === 'critical' ? choice.outcomes.success : null)
      || (result.tier === 'fumble' ? choice.outcomes.fail : null)
      || choice.outcomes.fail;
    applyEffect(outcome.effect);
    addLog(outcome.text || '', 'log-result');
    resolved = outcome;
  } else {
    applyEffect(choice.effect);
    addLog(choice.resultText || '', 'log-result');
  }

  state.pendingEvent = null;
  state.mode = 'explore';

  if (resolved.combat) { startCombat(resolved.combat); return; }
  render();
}

/* ---------------- 휴식 ---------------- */
function rest() {
  state.hp = getMaxHp();
  state.mp = getMaxMp();
  state.stamina = state.maxStamina;
  state.day += 1;
  addLog('푹 쉬어 체력·마력·기력을 모두 회복했다.', 'log-result');
  render();
}

/* ---------------- 수업 (주문 습득 경로 ①) ---------------- */
function attendClass(subjectId) {
  if (!canAttendClass()) {
    addLog('기력이 부족해 수업에 집중할 수 없다. 휴식이 필요하다.', 'log-warn');
    render();
    return;
  }
  state.stamina = clamp(state.stamina - CLASS_STAMINA_COST, 0, state.maxStamina);
  state.day += 1;
  trackDaily('classAttend');
  const progress = attendClassProgress(subjectId);
  addLog(`${SUBJECTS[subjectId].name} 수업에 참여했다. (진도 ${progress}/100)`, 'log-result');
  if (progress >= 100) {
    const next = nextSpellForSubject(subjectId);
    if (next) addLog(`[${next.name}]을(를) 습득할 준비가 되었다!`, 'log-spell');
    else addLog('이 과목에서 더 배울 주문이 없다.', '');
  }
  render();
}

function learnSpellFromClass(subjectId) {
  const next = nextSpellForSubject(subjectId);
  if (!next) return;
  if ((state.classProgress[subjectId] || 0) < 100) { addLog('아직 진도가 부족하다.', 'log-warn'); render(); return; }
  const result = learnSpell(next.id, 10);
  if (result.ok) {
    state.classProgress[subjectId] = 0;
    state.statsTrack.classCompletions = (state.statsTrack.classCompletions || 0) + 1;
    addLog(`[${next.name}]을(를) 습득했다!`, 'log-spell');
  } else if (result.reason === 'prereq') {
    addLog('선행 주문의 숙련도가 부족하다.', 'log-warn');
  } else if (result.reason === 'slot_full') {
    addLog('주문 슬롯이 가득 찼다. 기존 주문을 잊고 배울 수 있다. (소지품 탭 → 주문)', 'log-warn');
  }
  render();
}

function forgetSpellAction(spellId) {
  const sp = SPELLS[spellId];
  if (forgetSpell(spellId)) {
    state.statsTrack.forgetCount = (state.statsTrack.forgetCount || 0) + 1;
    addLog(`[${sp.name}]을(를) 잊었다. 슬롯이 비었다.`, 'log-result');
  }
  render();
}

/* ---------------- 상점 ---------------- */
function buyItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  if (state.gold < item.price) { addLog('갈레온이 부족하다.', 'log-warn'); render(); return; }
  state.gold -= item.price;
  addItemStack(itemId, 1);
  trackDaily('shopBuy');
  addLog(`[${item.name}]을(를) 구매했다. (-${item.price} 갈레온)`, 'log-result');
  render();
}

function sellItem(itemId) {
  const item = ITEMS[itemId];
  if (!item || !state.itemStacks[itemId]) return;
  removeItemStack(itemId, 1);
  state.gold += (item.sell || 0);
  addLog(`[${item.name}]을(를) 판매했다. (+${item.sell || 0} 갈레온)`, 'log-result');
  render();
}

function buyEquipment(templateId) {
  const tpl = EQUIP_TEMPLATES[templateId];
  if (!tpl) return;
  if (state.gold < tpl.price) { addLog('갈레온이 부족하다.', 'log-warn'); render(); return; }
  state.gold -= tpl.price;
  const inst = createEquipInstance(templateId, 'common');
  receiveEquipment(inst);
  trackDaily('shopBuy');
  addLog(`[${getItemDisplayName(inst)}]을(를) 구매했다.`, 'log-result');
  render();
}

function sellEquipment(uid) {
  const idx = state.equipment.findIndex((e) => e.uid === uid);
  if (idx < 0) return;
  const inst = state.equipment[idx];
  if (state.equipped.wand === uid || state.equipped.robe === uid || state.equipped.accessory === uid) {
    addLog('장착 중인 장비는 판매할 수 없다. 먼저 해제하세요.', 'log-warn');
    render();
    return;
  }
  const rarity = RARITY_BY_ID[inst.rarity];
  const price = Math.round(15 * rarity.statMult * (1 + inst.enhanceLevel * 0.15));
  state.equipment.splice(idx, 1);
  state.gold += price;
  addLog(`[${getItemDisplayName(inst)}]을(를) 판매했다. (+${price} 갈레온)`, 'log-result');
  render();
}

function doWandGacha(coreId) {
  if (state.gold < WAND_GACHA_COST) { addLog('갈레온이 부족하다.', 'log-warn'); render(); return; }
  state.gold -= WAND_GACHA_COST;
  const result = gachaWand(coreId);
  receiveEquipment(result.instance);
  if (result.matched) {
    state.statsTrack.wandMatchCount = (state.statsTrack.wandMatchCount || 0) + 1;
    addLog(result.core.matchText, 'log-win');
  } else {
    addLog(`${result.core.flavor} ...별다른 반응은 없었다.`, '');
  }
  addLog(`[${getItemDisplayName(result.instance)}]을(를) 얻었다.`, 'log-result');
  render();
}

/* ---------------- 아이템 사용 / 장비 ---------------- */
function useItemOutOfCombat(itemId) {
  const item = ITEMS[itemId];
  if (!item || !state.itemStacks[itemId]) return;
  if (item.type === 'potion') {
    applyEffect(item.effect);
    removeItemStack(itemId, 1);
    addLog(`[${item.name}]을(를) 사용했다.`, 'log-result');
    render();
  } else if (item.type === 'scroll') {
    useScroll(itemId);
  } else {
    addLog('지금은 사용할 수 없는 물건이다.', 'log-warn');
    render();
  }
}

function useScroll(itemId) {
  const item = ITEMS[itemId];
  const sp = SPELLS[item.spellId];
  removeItemStack(itemId, 1);
  const result = runCheck('intelligence', item.dc);

  if (result.tier === 'success' || result.tier === 'critical') {
    if (state.spells[item.spellId] != null) {
      gainMastery(item.spellId, result.tier === 'critical' ? 25 : 15);
      addLog(`이미 알고 있는 주문이라 숙련도만 상승했다. [${sp.name}]`, 'log-spell');
    } else {
      const learnResult = learnSpell(item.spellId, result.tier === 'critical' ? 20 : 10);
      if (learnResult.ok) {
        addLog(`주문서를 통해 [${sp.name}]을(를) 습득했다!`, 'log-spell');
        if (sp.dark) addLog('...금지된 지식이 마음에 새겨진다.', 'log-dark');
      } else if (learnResult.reason === 'slot_full') {
        addItemStack(itemId, 1);
        addLog('주문 슬롯이 가득 차 습득하지 못했다. 주문서는 그대로 남아있다.', 'log-warn');
      } else if (learnResult.reason === 'prereq') {
        addItemStack(itemId, 1);
        addLog('선행 주문의 숙련도가 부족해 아직 이해할 수 없다. 주문서는 남아있다.', 'log-warn');
      }
    }
  } else {
    addLog('주문서의 내용을 이해하지 못했다. 주문서가 사라졌다.', 'log-warn');
  }
  render();
}

function equipInstance(uid) {
  const inst = state.equipment.find((e) => e.uid === uid);
  if (!inst) return;
  state.equipped[inst.slot] = uid;
  clampVitals();
  addLog(`[${getItemDisplayName(inst)}]을(를) 장착했다.`, 'log-result');
  render();
}

function unequipSlot(slot) {
  if (!state.equipped[slot]) return;
  state.equipped[slot] = null;
  clampVitals();
  addLog(`${slotLabel(slot)}을(를) 해제했다.`, 'log-result');
  render();
}

function identifyInstance(uid) {
  const inst = state.equipment.find((e) => e.uid === uid);
  if (!inst || inst.identified) return;
  const result = identifyItem(inst);
  addLog(`[지식 판정 · ${CHECK_TIER_LABEL[result.tier]}] (성공률 ${result.rate}%)`, 'log-check-' + result.tier);
  if (typeof notifyCheck === 'function') notifyCheck(result);
  if (inst.identified) addLog(`정체를 알아냈다: [${getItemDisplayName(inst)}]`, 'log-win');
  else addLog('아직 정체를 알 수 없다. 다시 시도할 수 있다.', 'log-warn');
  render();
}

function enhanceInstance(uid) {
  const inst = state.equipment.find((e) => e.uid === uid);
  if (!inst) return;
  if (inst.enhanceLevel >= 10) { addLog('이미 최대 강화 단계이다.', 'log-warn'); render(); return; }
  const cost = enhanceCost(inst.enhanceLevel);
  if ((state.itemStacks.magicStone || 0) < cost.stones) { addLog(`마법석이 부족하다. (필요: ${cost.stones})`, 'log-warn'); render(); return; }
  if (state.gold < cost.gold) { addLog('갈레온이 부족하다.', 'log-warn'); render(); return; }
  removeItemStack('magicStone', cost.stones);
  state.gold -= cost.gold;
  const result = enhanceItem(inst);
  if (result.success) addLog(`강화 성공! [${getItemDisplayName(inst)}]`, 'log-win');
  else addLog(`강화 실패... 등급이 하락했다. [${getItemDisplayName(inst)}]`, 'log-warn');
  render();
}

/* ---------------- 전투 ---------------- */
function startCombat(enemyId) {
  const enemy = ENEMIES[enemyId];
  state.combat = { enemyId, enemyHp: enemy.hp, enemyMaxHp: enemy.hp, playerDefending: false };
  state.mode = 'combat';
  state.seenEnemies = state.seenEnemies || {};
  state.seenEnemies[enemyId] = true;
  addLog(`[${enemy.name}]과(와)의 전투 시작!`, 'log-combat');
  render();
}

function combatCastSpell(spellId) {
  const c = state.combat;
  if (!c) return;
  const sp = SPELLS[spellId];
  const enemy = ENEMIES[c.enemyId];
  const cast = getSpellCastInfo(spellId);

  if (cast.mpCost > state.mp) { addLog('마력이 부족하다!', 'log-warn'); render(); return; }
  state.mp -= cast.mpCost;
  trackDaily('spellCast');

  if (cast.failChance > 0 && Math.random() < cast.failChance) {
    gainMastery(spellId, 2);
    addLog(`[${sp.name}] 시전에 실패했다... 아직 손에 익지 않았다.`, 'log-warn');
    enemyTurn();
    return;
  }

  if (sp.type === 'defense') {
    c.playerDefending = true;
    c.playerDefendMult = sp.shieldMult != null ? sp.shieldMult : 0.35;
    gainMastery(spellId, 3);
    addLog(`[${sp.name}]으로 방어 태세를 갖췄다.`, 'log-player');
    enemyTurn();
    return;
  }
  if (sp.type === 'utility') {
    gainMastery(spellId, 2);
    addLog(`[${sp.name}]을(를) 사용했다. 주변이 밝아졌다.`, 'log-player');
    enemyTurn();
    return;
  }
  if (sp.type === 'heal') {
    const healAmt = Math.round(cast.healAmount);
    state.hp = clamp(state.hp + healAmt, 0, getMaxHp());
    gainMastery(spellId, 3);
    addLog(`[${sp.name}]! 체력을 ${healAmt} 회복했다.`, 'log-player');
    enemyTurn();
    return;
  }

  let mult = 1;
  if (sp.bonusVs && sp.bonusVs.includes(c.enemyId)) mult = sp.bonusMult || 2;
  const isCrit = Math.random() < cast.critBonus;
  if (isCrit) mult *= 1.5;
  const variance = 0.85 + Math.random() * 0.3;
  let dmg = Math.round((getAtk() + cast.power) * mult * variance) - enemy.def;
  dmg = Math.max(1, dmg);
  c.enemyHp = Math.max(0, c.enemyHp - dmg);
  gainMastery(spellId, randInt(2, 5));
  addLog(`[${sp.name}]${isCrit ? ' 회심의 일격!' : ''} ${enemy.name}에게 ${dmg}의 피해를 입혔다. (남은 체력 ${c.enemyHp}/${c.enemyMaxHp})`, 'log-player');

  if (sp.alignment) {
    state.alignment = clamp(state.alignment + sp.alignment, -100, 100);
    addLog('...어둠의 기운이 마음을 스친다. (성향 감소)', 'log-dark');
  }

  if (c.enemyHp <= 0) { winCombat(); return; }
  enemyTurn();
}

function combatUseItem(itemId) {
  const c = state.combat;
  if (!c) return;
  const item = ITEMS[itemId];
  if (!item || !state.itemStacks[itemId] || item.type !== 'potion') return;
  applyEffect(item.effect);
  removeItemStack(itemId, 1);
  addLog(`[${item.name}]을(를) 사용했다.`, 'log-player');
  enemyTurn();
}

function combatDefend() {
  const c = state.combat;
  if (!c) return;
  c.playerDefending = true;
  c.playerDefendMult = 0.35;
  addLog('방어 자세를 취했다.', 'log-player');
  enemyTurn();
}

function combatFlee() {
  const c = state.combat;
  if (!c) return;
  const enemy = ENEMIES[c.enemyId];
  const chance = clamp(50 + getStatValue('courage') * 2 - (enemy.boss ? 30 : 0), 10, 90);
  if (randInt(1, 100) <= chance) {
    state.statsTrack.fleeSuccess = (state.statsTrack.fleeSuccess || 0) + 1;
    addLog('전투에서 무사히 도망쳤다.', 'log-result');
    state.combat = null;
    state.mode = 'explore';
    render();
  } else {
    addLog('도망치지 못했다!', 'log-warn');
    enemyTurn();
  }
}

function enemyTurn() {
  const c = state.combat;
  if (!c) return;
  const enemy = ENEMIES[c.enemyId];
  const variance = 0.85 + Math.random() * 0.3;
  let dmg = Math.round(enemy.atk * variance) - getDef();
  dmg = Math.max(1, dmg);
  if (c.playerDefending) {
    dmg = Math.max(1, Math.round(dmg * (c.playerDefendMult != null ? c.playerDefendMult : 0.35)));
    c.playerDefending = false;
  }
  state.hp = clamp(state.hp - dmg, 0, getMaxHp());
  addLog(`${enemy.name}의 공격! ${dmg}의 피해를 입었다. (내 체력 ${state.hp}/${getMaxHp()})`, 'log-enemy');

  if (state.hp <= 0) { loseCombat(); return; }
  render();
}

function winCombat() {
  const c = state.combat;
  const enemy = ENEMIES[c.enemyId];
  const loot = rollCombatLoot(c.enemyId, state.location);
  state.statsTrack.combatWins = (state.statsTrack.combatWins || 0) + 1;
  trackDaily('combatWin');

  addLog(`${enemy.name}을(를) 물리쳤다! (경험치 +${enemy.exp}, 갈레온 +${loot.gold})`, 'log-win');
  state.gold += loot.gold;
  gainExp(enemy.exp);
  loot.materials.forEach((m) => {
    addItemStack(m.id, m.qty);
    addLog(`[${ITEMS[m.id].name}] x${m.qty}을(를) 얻었다.`, 'log-result');
  });
  if (loot.scroll) {
    addItemStack(loot.scroll, 1);
    addLog(`[${ITEMS[loot.scroll].name}]을(를) 얻었다.`, 'log-result');
  }
  if (loot.equip) {
    receiveEquipment(loot.equip);
    addLog(`[${getItemDisplayName(loot.equip)}]을(를) 얻었다.`, 'log-result');
  }

  if (c.enemyId === 'riddleShade') {
    state.flags.riddle_defeated = true;
    addItemStack('scrollConfringo', 1);
    addLog('환영이 흩어지며 낡은 주문서를 남겼다. [주문서 : 콘프린고]을(를) 얻었다.', 'log-result');
  }
  if (c.enemyId === 'voldemortShadow') state.flags.voldemort_defeated = true;

  state.combat = null;
  state.mode = 'explore';

  if (state.flags.voldemort_defeated) { triggerEnding(); return; }
  render();
}

function loseCombat() {
  const c = state.combat;
  const enemy = ENEMIES[c.enemyId];
  if (enemy.finalBoss) {
    state.combat = null;
    state.mode = 'ending';
    state.ending = ENDINGS.defeat;
    render();
    return;
  }
  addLog('쓰러졌다... 정신을 차려보니 기숙사 휴게실이다.', 'log-warn');
  state.combat = null;
  state.mode = 'explore';
  state.location = 'commonRoom';
  state.hp = Math.max(1, Math.floor(getMaxHp() * 0.5));
  state.gold = Math.max(0, state.gold - Math.floor(state.gold * 0.2));
  render();
}

/* ---------------- 스토리 진행 (교장실) ---------------- */
function getAvailableChapter() {
  return STORY.chapters.find((ch) => !state.flags[ch.setFlag] && ch.requiresFlags.every((f) => state.flags[f]));
}

function enterHeadmasterOffice() {
  const ch = getAvailableChapter();
  if (!ch) {
    addLog('덤블도어 교수는 조용히 차를 마시고 있다. "지금은 특별히 할 이야기가 없구나."', 'log-npc');
    render();
    return;
  }
  state.pendingChapter = ch;
  state.mode = 'story';
  addLog(`[${ch.title}]`, 'log-story-title');
  addLog(ch.text, 'log-story');
  render();
}

function resolveChapterChoice(idx) {
  const ch = state.pendingChapter;
  if (!ch) return;
  const choice = ch.choices[idx];
  applyEffect(choice.effect);
  addLog(choice.resultText || '', 'log-result');
  state.flags[ch.setFlag] = true;
  state.pendingChapter = null;
  state.mode = 'explore';
  if (ch.id === 'ch2') addLog('비밀의 방으로 향하는 통로가 열렸다. 도전할 준비가 되면 [비밀의 방]으로 이동하세요.', 'log-story');
  render();
}

function enterChamber() {
  if (!state.flags.chamber_unlocked) { addLog('아직 비밀의 방으로 가는 길을 찾지 못했다.', 'log-warn'); render(); return; }
  if (state.flags.voldemort_defeated) { addLog('비밀의 방은 이제 고요하다.', ''); render(); return; }
  if (!state.flags.riddle_defeated) {
    addLog('축축한 어둠 속에서 톰 리들의 환영이 모습을 드러낸다!', 'log-event');
    startCombat('riddleShade');
    return;
  }
  if (!state.flags.ch3_done) { addLog('환영을 물리쳤지만 아직 교장에게 보고하지 않았다. 교장실로 가보자.', 'log-warn'); render(); return; }
  addLog('깊은 어둠 속에서 볼드모트의 잔영이 형체를 갖추기 시작한다. 마지막 결전이다!', 'log-event');
  startCombat('voldemortShadow');
}

/* ---------------- 엔딩 ---------------- */
function triggerEnding() {
  const companionValues = Object.values(state.companions || {});
  const avgAffinity = companionValues.length ? companionValues.reduce((a, b) => a + b, 0) / Object.keys(COMPANIONS).length : 0;

  let ending;
  if (avgAffinity >= 50 && state.alignment >= -10) ending = ENDINGS.together;
  else if (state.alignment >= 25) ending = ENDINGS.light;
  else if (state.alignment <= -25) ending = ENDINGS.dark;
  else ending = ENDINGS.balanced;
  state.ending = ending;
  state.mode = 'ending';
  render();
}
