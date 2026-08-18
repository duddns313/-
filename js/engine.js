/* ===================== 게임 엔진 (핵심 로직) ===================== */

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/* 받침 유무로 조사를 고른다. 인물·아이템 이름이 데이터에서 오기 때문에
 * "픽시을(를)" 같은 표기가 그대로 화면에 나가지 않도록 한다. */
function josa(word, withBatchim, withoutBatchim) {
  if (!word) return withoutBatchim;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return withoutBatchim;
  return (code - 0xAC00) % 28 ? withBatchim : withoutBatchim;
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/* ---------------- 로그 ---------------- */

function addLog(text, cls) {
  const entry = { text, cls: cls || '' };
  state.log.push(entry);
  if (state.log.length > 300) state.log.shift();
  if (typeof uiAppendLogEntry === 'function') uiAppendLogEntry(entry);
}

/* 서사 문장에 수치를 손으로 적지 않도록, effect에서 표시용 칩을 자동 생성한다 */
const EFFECT_SUMMARY_LABELS = { hp: '체력', mp: '마력', gold: '갈레온', exp: '경험치', alignment: '성향' };

function formatEffectSummary(effect, extraExp) {
  if (!effect && !extraExp) return '';
  effect = effect || {};
  const parts = [];
  ['hp', 'mp', 'gold', 'alignment'].forEach((k) => {
    if (effect[k]) parts.push(`${EFFECT_SUMMARY_LABELS[k]} ${effect[k] > 0 ? '+' : ''}${effect[k]}`);
  });
  const exp = (effect.exp || 0) + (extraExp || 0);
  if (exp) parts.push(`경험치 +${exp}`);
  ['intelligence', 'courage', 'charm', 'agility', 'luck'].forEach((k) => {
    if (effect[k]) parts.push(`${STAT_META[k].label} ${effect[k] > 0 ? '+' : ''}${effect[k]}`);
  });
  if (effect.item && ITEMS[effect.item]) parts.push(`[${ITEMS[effect.item].name}] 획득`);
  return parts.join(' · ');
}

function emitEffectChip(effect, extraExp) {
  const summary = formatEffectSummary(effect, extraExp);
  if (summary) sceneEmit(summary, 'log-effect-chip');
}

/* ---------------- 판정 ---------------- */

function runCheck(statKey, dc, bonusPercent, check) {
  const result = skillCheck(statKey, dc, bonusPercent, check);
  addLog(`[${STAT_META[statKey].label} 판정 · ${CHECK_TIER_LABEL[result.tier]}] (성공률 ${result.rate}%)`, 'log-check-' + result.tier);
  if (typeof notifyCheck === 'function') notifyCheck(result);
  return result;
}

/* ---------------- 소지품 ---------------- */

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
  if (effect.item) addItemStack(effect.item, effect.itemQty || 1);
  if (effect.consume) removeItemStack(effect.consume, 1);
  if (effect.flag) state.flags[effect.flag] = true;
  if (effect.clearFlag) delete state.flags[effect.clearFlag];
  if (effect.exp) gainExp(effect.exp);
  if (effect.learnSpell) applyLearnSpellEffect(effect.learnSpell);
  if (effect.learnSubject) learnFromClass(effect.learnSubject);
  if (effect.practice) practiceSubject(effect.practice, effect.practiceAmount || 10);
  if (effect.equipDrop) applyEquipDropEffect(effect.equipDrop);
  if (effect.register) (Array.isArray(effect.register) ? effect.register : [effect.register]).forEach(registerPerson);
  if (effect.fadingTarget) state.flags.fadingTarget = effect.fadingTarget;
  if (effect.erosion) bumpErosion(effect.erosion);

  /* 이름 조각은 판이 아니라 「기록」에 남는다 */
  if (effect.fragment) recordFragment(effect.fragment);
  if (effect.trait) { grantTrait(effect.trait); recordTraitUpgrade(effect.trait); }
}

/* ---------------- 주문 습득 ---------------- */

function applyLearnSpellEffect(spellId) {
  const sp = SPELLS[spellId];
  if (!sp) return;
  if (state.spells[spellId] != null) {
    gainMastery(spellId, 15);
    addLog(`[${sp.name}] 숙련도가 올랐다.`, 'log-spell');
    return;
  }
  const result = learnSpell(spellId, 25);
  if (result.ok) {
    autoSlotSpell(spellId);
    addLog(`새로운 주문을 익혔다 — [${sp.name}]`, 'log-spell');
    return;
  }
  if (result.reason === 'prereq') {
    addLog(`[${sp.name}]${josa(sp.name, '은', '는')} 아직 손에 붙지 않는다. 먼저 익혀야 할 것이 있다.`, 'log-warn');
  } else if (result.reason === 'slot_full') {
    addLog('머릿속이 꽉 찼다. 지금은 새 주문이 들어오지 않는다.', 'log-warn');
  }
}

/* 수업 인카운터 — 그 과목에서 아직 못 배운 가장 낮은 주문을 준다.
 * 배울 수 없으면(선행 미달) 대신 그 계열 주문을 연습한다. 수업에서 손에 익는 것이
 * 자연스럽기도 하고, 이게 없으면 선행 숙련도가 전투에서만 오르는 탓에
 * 초반에 주문 계통이 통째로 잠긴다. */
function learnFromClass(subjectId) {
  const next = nextSpellForSubject(subjectId);
  if (next && canLearnSpell(next.id).ok) { applyLearnSpellEffect(next.id); return; }
  practiceSubject(subjectId, 18);
}

/* 배우지는 못해도 손에는 익는다.
 * 수업에서 판정에 실패해도 자리에 앉아 있긴 했다 — 아무것도 안 남으면
 * 수업 인카운터 절반이 통째로 빈손이 되어 계통이 자라지 않는다. */
function practiceSubject(subjectId, amount) {
  const line = (SUBJECTS[subjectId] || {}).line;
  const known = Object.keys(state.spells).filter((id) => SPELLS[id].subject === subjectId || SPELLS[id].line === line);

  /* 그 계열을 하나도 모르면 연습할 것 자체가 없다.
   * 이때는 입문 주문의 형태만 겨우 익힌 것으로 친다 — 성공했을 때(숙련 25)보다
   * 한참 못하지만, 계통이 통째로 잠겨 수업이 헛도는 것보다는 낫다. */
  if (!known.length) {
    const entry = nextSpellForSubject(subjectId);
    if (entry && canLearnSpell(entry.id).ok) {
      learnSpell(entry.id, 5);
      autoSlotSpell(entry.id);
      addLog(`제대로 되진 않았지만 [${entry.name}]의 모양만은 손에 남았다.`, 'log-spell');
      return;
    }
    addLog('오늘 수업은 손에 붙지 않았다.', 'log-result');
    return;
  }
  known.sort((a, b) => state.spells[a] - state.spells[b]);
  gainMastery(known[0], amount || 10);
  addLog(`수업에서 [${SPELLS[known[0]].name}]${josa(SPELLS[known[0]].name, '을', '를')} 반복해 연습했다. 숙련도가 올랐다.`, 'log-spell');
}

function applyEquipDropEffect(opts) {
  const pool = EQUIP_TEMPLATES_BY_SLOT[opts.slot] || [];
  const candidates = pool.filter((t) => t.tier <= (opts.tier || 1));
  const list = candidates.length ? candidates : pool;
  if (!list.length) return;
  const tpl = list[randInt(0, list.length - 1)];
  const inst = createEquipInstance(tpl.id, null, (opts.tier || 1) * 5);
  receiveEquipment(inst);
  addLog(`[${getItemDisplayName(inst)}]${josa(getItemDisplayName(inst), '을', '를')} 얻었다.`, 'log-result');
}

/* ---------------- 성장 ----------------
 * 경험치는 판정 성공·전투 승리로만 얻는다. 진행도(시간)와 분리돼 있어서
 * 같은 진행도에서도 실력에 따라 레벨이 갈린다. */

function gainExp(amount) {
  if (!amount) return;
  state.exp += amount;
  while (state.exp >= state.expToNext) {
    state.exp -= state.expToNext;
    state.level += 1;
    state.expToNext = expToNextFor(state.level);
    state.maxHp += 5;
    state.maxMp += 3;
    state.pendingPoints += 2;
    state.hp = Math.min(getMaxHp(), state.hp + 5);
    addLog(`레벨 업 — Lv.${state.level}`, 'log-levelup');
  }
}

function allocatePoint(statKey) {
  if (state.pendingPoints <= 0) return;
  state.stats[statKey] += 1;
  state.pendingPoints -= 1;
  render();
}

/* ---------------- 소지품 사용 ---------------- */

function useItemOutOfCombat(itemId) {
  const item = ITEMS[itemId];
  if (!item || !state.itemStacks[itemId]) return;
  if (item.type === 'scroll') { useScroll(itemId); return; }
  if (item.type !== 'potion') { toast('지금은 쓸 수 없다.', { cls: 'toast-warn' }); return; }
  removeItemStack(itemId, 1);
  applyEffect(item.effect);
  clampVitals();
  addLog(`[${item.name}]${josa(item.name, '을', '를')} 썼다.`, 'log-result');
  render();
}

function useScroll(itemId) {
  const item = ITEMS[itemId];
  const sp = SPELLS[item.spellId];
  if (!sp) return;
  if (state.spells[item.spellId] != null) {
    removeItemStack(itemId, 1);
    gainMastery(item.spellId, 20);
    addLog(`이미 아는 주문이었다. [${sp.name}] 숙련도가 올랐다.`, 'log-spell');
    render();
    return;
  }
  const can = canLearnSpell(item.spellId);
  if (!can.ok && can.reason === 'prereq') {
    toast('먼저 익혀야 할 주문이 있다.', { cls: 'toast-warn' }); return;
  }
  if (!can.ok && can.reason === 'slot_full') {
    toast('더 이상 새 주문이 들어오지 않는다.', { cls: 'toast-warn' }); return;
  }
  removeItemStack(itemId, 1);
  /* 아는 주문일수록 해독이 쉽다 — 「기록」이 주는 이득 */
  const dc = Math.max(4, item.dc - ledgerScrollDcRelief(item.spellId));
  const result = runCheck('intelligence', dc, 0, { search: true });
  if (result.tier === 'success' || result.tier === 'critical') {
    learnSpell(item.spellId, 15);
    autoSlotSpell(item.spellId);
    addLog(`주문서를 해독했다 — [${sp.name}]`, 'log-spell');
  } else {
    addLog('글자가 눈앞에서 흩어졌다. 주문서는 재가 되었다.', 'log-warn');
  }
  render();
}

/* ---------------- 장비 ---------------- */

function equipInstance(uid) {
  const inst = state.equipment.find((e) => e.uid === uid);
  if (!inst) return;
  if (!inst.identified) { toast('먼저 감정해야 한다.', { cls: 'toast-warn' }); return; }
  state.equipped[inst.slot] = uid;
  clampVitals();
  render();
}

function unequipSlot(slot) {
  state.equipped[slot] = null;
  clampVitals();
  render();
}

function identifyInstance(uid) {
  const inst = state.equipment.find((e) => e.uid === uid);
  if (!inst || inst.identified) return;
  const result = identifyItem(inst);
  addLog(result.tier === 'success' || result.tier === 'critical'
    ? `감정에 성공했다 — [${getItemDisplayName(inst)}]`
    : '무엇인지 알아보지 못했다.', result.tier === 'fail' || result.tier === 'fumble' ? 'log-warn' : 'log-result');
  render();
}

function enhanceInstance(uid) {
  const inst = state.equipment.find((e) => e.uid === uid);
  if (!inst) return;
  const cost = enhanceCost(inst.enhanceLevel);
  if ((state.itemStacks.magicStone || 0) < cost.stones || state.gold < cost.gold) {
    toast('재료나 갈레온이 부족하다.', { cls: 'toast-warn' }); return;
  }
  removeItemStack('magicStone', cost.stones);
  state.gold -= cost.gold;
  const result = enhanceItem(inst);
  addLog(result.success
    ? `강화에 성공했다. +${result.level}`
    : result.maxed ? '더는 강화할 수 없다.' : '강화에 실패해 등급이 떨어졌다.',
  result.success ? 'log-win' : 'log-warn');
  render();
}

function sellEquipment(uid) {
  const idx = state.equipment.findIndex((e) => e.uid === uid);
  if (idx < 0) return;
  const inst = state.equipment[idx];
  if (Object.values(state.equipped).indexOf(uid) >= 0) {
    toast('장착 중인 장비는 팔 수 없다.', { cls: 'toast-warn' }); return;
  }
  const tpl = EQUIP_TEMPLATES[inst.baseId];
  const price = Math.round((tpl.price || 30) * 0.4 * RARITY_BY_ID[inst.rarity].statMult);
  state.equipment.splice(idx, 1);
  state.gold += price;
  addLog(`[${getItemDisplayName(inst)}]${josa(getItemDisplayName(inst), '을', '를')} 팔아 ${price} 갈레온을 얻었다.`, 'log-result');
  render();
}

/* ---------------- 판의 끝 ---------------- */

function triggerEnding(endingId) {
  const ending = ENDINGS[endingId] || ENDINGS.finish_transfer;
  state.mode = 'ending';
  state.ending = ending.id;
  commitRunToLedger(ending.id);
  deleteSave();

  sceneEmit(`── ${ending.title} ──`, 'ending-title');
  sceneEmit(resolveText(ending.text), 'scene-para ending-text');
  render();
}
