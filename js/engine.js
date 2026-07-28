/* ===================== 게임 엔진 (핵심 로직) ===================== */

function addLog(text, cls) {
  const entry = { text, cls: cls || '' };
  state.log.push(entry);
  if (state.log.length > 300) state.log.shift();
  if (typeof uiAppendLogEntry === 'function') uiAppendLogEntry(entry);
}

/* 빈 줄로 구분된 문단을 각각 별도 로그 항목으로 나눠, 문단 사이에 타자 호흡을 준다 */
function addLogParagraphs(text, cls) {
  if (!text) return;
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length <= 1) { addLog(text, cls); return; }
  paras.forEach((p) => addLog(p, cls));
}

/* 서사 문장 안에 수치를 손으로 적지 않도록, effect 객체에서 표시용 요약을 자동 생성한다 */
const EFFECT_SUMMARY_LABELS = { hp: '체력', mp: '마력', gold: '갈레온', exp: '경험치', alignment: '성향' };

function formatEffectSummary(effect) {
  if (!effect) return '';
  const parts = [];
  ['hp', 'mp', 'gold', 'exp', 'alignment'].forEach((k) => {
    if (effect[k]) parts.push(`${EFFECT_SUMMARY_LABELS[k]} ${effect[k] > 0 ? '+' : ''}${effect[k]}`);
  });
  ['intelligence', 'courage', 'charm', 'agility', 'luck'].forEach((k) => {
    if (effect[k]) parts.push(`${STAT_META[k].label} ${effect[k] > 0 ? '+' : ''}${effect[k]}`);
  });
  if (effect.item && ITEMS[effect.item]) parts.push(`[${ITEMS[effect.item].name}] 획득`);
  if (effect.companionAffinity && COMPANIONS[effect.companionAffinity.id]) {
    const amt = effect.companionAffinity.amount;
    parts.push(`${COMPANIONS[effect.companionAffinity.id].name}와의 우정 ${amt > 0 ? '+' : ''}${amt}`);
  }
  return parts.join(' · ');
}

/* 결과 문장을 문단 단위로 출력한 뒤, 수치 변화를 별도의 시스템 영역(칩)으로 붙인다 */
function logResultWithEffect(text, effect, cls) {
  addLogParagraphs(text || '', cls || 'log-result');
  const summary = formatEffectSummary(effect);
  if (summary) addLog(summary, 'log-effect-chip');
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function runCheck(statKey, dc, bonusPercent) {
  const result = skillCheck(statKey, dc, bonusPercent);
  const bonusNote = bonusPercent ? ` (기억 보정 +${bonusPercent}%)` : '';
  addLog(`[${STAT_META[statKey].label} 판정 · ${CHECK_TIER_LABEL[result.tier]}] (성공률 ${result.rate}%)${bonusNote}`, 'log-check-' + result.tier);
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
  if (effect.bonusSlot) { state.bonusSlotsToday = (state.bonusSlotsToday || 0) + effect.bonusSlot; state.timeBonusUsedDay = state.day; }
  ['intelligence', 'courage', 'charm', 'agility', 'luck'].forEach((k) => {
    if (effect[k]) state.stats[k] += effect[k];
  });
  if (effect.alignment) state.alignment = clamp(state.alignment + effect.alignment, -100, 100);
  if (effect.item) addItemStack(effect.item, 1);
  if (effect.flag) state.flags[effect.flag] = true;
  if (effect.memory) state.memories[effect.memory] = true;
  if (effect.exp) gainExp(effect.exp);
  if (effect.learnSpell) applyLearnSpellEffect(effect.learnSpell);
  if (effect.equipDrop) applyEquipDropEffect(effect.equipDrop);
  if (effect.companionAffinity) applyCompanionAffinity(effect.companionAffinity.id, effect.companionAffinity.amount);
  if (effect.companionAffinityAll) Object.keys(COMPANIONS).forEach((id) => applyCompanionAffinity(id, effect.companionAffinityAll));
}

/* ---------------- 연속 도전형 퀘스트 (다단계 퀘스트) ----------------
 * 실패하면 진행도가 리셋된다 — "두 번 성공했는데 세 번째에 실패"라는
 * 텍스트 게임에서 가장 값싸게 만들 수 있는 긴장감. */
function advanceStreak(choice, success) {
  state.streaks = state.streaks || {};
  const id = choice.streakId;
  if (state.flags[id + '_done']) return;
  if (success) {
    state.streaks[id] = (state.streaks[id] || 0) + 1;
    if (state.streaks[id] >= choice.streakTarget) {
      state.flags[id + '_done'] = true;
      state.streaks[id] = 0;
      addLog(`🎯 연속 ${choice.streakTarget}회 성공! ${choice.streakRewardText || '훈련을 완전히 익혔다.'}`, 'log-win');
      if (choice.streakReward) applyEffect(choice.streakReward);
      if (id === 'patronusPractice') completePatronusChain();
      if (id === 'patronusTrial') completePatronusTrial();
    } else {
      addLog(`연속 ${state.streaks[id]}/${choice.streakTarget} 성공.`, 'log-result');
    }
  } else {
    if (state.streaks[id] > 0) addLog('연속 기록이 끊겼다. 처음부터 다시 도전해야 한다.', 'log-warn');
    state.streaks[id] = 0;
  }
}

/* ---------------- 체인① 보가트 → 패트로누스 ---------------- */
function completePatronusChain() {
  const fearKey = Object.keys(PATRONUS_FORM_BY_FEAR).find((k) => state.memories[k]);
  const form = PATRONUS_FORM_BY_FEAR[fearKey] || { name: '빛의 형체', desc: '아직 뚜렷한 형태를 갖추지 못한 은빛 안개가 영운을 지킨다.' };
  state.patronusForm = form.name;
  addLog(`은빛 안개가 걷히며 모습을 드러낸다 — ${form.name}. ${form.desc}`, 'log-win');
}

/* ---------------- 시련② 패트로누스 시련 ---------------- */
function completePatronusTrial() {
  const inst = createEquipInstance('patronusCharm', 'artifact');
  receiveEquipment(inst);
  state.flags.dementorImmune = true;
  addLog(`✨ 성물 등급 [${getItemDisplayName(inst)}]을(를) 얻었다! 이제 디멘터의 냉기가 영운을 스치지 못한다.`, 'log-win');
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
function hasMarauderMap() { return (state.itemStacks.marauderMap || 0) > 0; }

/* 같은 구역 안에서는 무료, 구역을 넘을 때만 시간대가 든다 — 도둑 지도가 있으면 그마저 무료 */
function travelTo(locId) {
  const loc = LOCATIONS[locId];
  if (!loc) return;
  if (loc.locked && !state.flags.chamber_unlocked) {
    addLog('그곳은 아직 갈 수 없다. 봉인되어 있는 듯하다.', 'log-warn');
    render();
    return;
  }
  const fromLoc = LOCATIONS[state.location];
  const crossesZone = fromLoc.zone !== loc.zone;
  if (crossesZone && !hasMarauderMap()) advanceTimeSlot();
  state.location = locId;
  state.visitedLocations = state.visitedLocations || {};
  state.visitedLocations[locId] = true;
  addLog(`--- ${loc.name}(으)로 이동했다 ---`, 'log-move');
  state.mode = loc.shop ? 'shop' : 'explore';
  render();
}

/* ---------------- 시간(턴) 시스템 ----------------
 * 하루 = 3시간대(🌅 아침 · ☀️ 오후 · 🌙 밤). 비용은 행동을 "시작할 때"만 청구되고,
 * 전투·대화·연속 진행 중에는 소모되지 않는다. 기력처럼 바닥나서 막히는 자원이 아니라
 * 그냥 하루가 흘러가는 것뿐이므로, "부족해서 못 한다"는 상태 자체가 없다. */
const TIME_SLOT_ICONS = ['🌅', '☀️', '🌙'];

function advanceTimeSlot() {
  const total = 3 + (state.bonusSlotsToday || 0);
  state.timeSlot += 1;
  if (state.timeSlot >= total) {
    state.timeSlot = 0;
    state.bonusSlotsToday = 0;
    state.day += 1;
    checkDeadlineStatus();
  }
}

function checkDeadlineStatus() {
  if (!state.deadline) return;
  if (state.day > state.deadline.dueDay) {
    state.deadlinePenaltyStacks = (state.deadlinePenaltyStacks || 0) + 1;
    addLog(`⚠ "${state.deadline.label}"의 기한을 넘겼다. 실종 사태가 더 심각해지고, 어둠이 조금 더 깊어진 듯하다.`, 'log-warn');
    state.deadline.dueDay += 10;
  }
}

function advanceDeadlineChapter(finishedChapterId) {
  const info = DEADLINE_CHAPTERS[finishedChapterId];
  if (!info || !info.next) { state.deadline = null; return; }
  const nextInfo = DEADLINE_CHAPTERS[info.next];
  state.deadline = { chapterId: info.next, label: nextInfo.label, dueDay: state.day + nextInfo.days };
}

/* ---------------- 탐험 / 랜덤 이벤트 ---------------- */
function eligibleEventsFor(loc) {
  const pool = EVENTS[loc.tag];
  if (!pool) return [];
  return pool.filter((ev) => {
    if (ev.once && state.flags['event_' + ev.id]) return false;
    if (ev.requiresFlag && !state.flags[ev.requiresFlag]) return false;
    if (ev.notFlag && state.flags[ev.notFlag]) return false;
    if (ev.requiresFn && !ev.requiresFn(state)) return false;
    return true;
  });
}

/* 이동 버튼에 붙는 목적지 힌트 — "어디를 가야 할지" 미리 보여줘서 이동을 방황이 아닌 항해로 만든다 */
function getLocationHint(locId) {
  const loc = LOCATIONS[locId];
  if (loc.shop) return '🏪';
  if (loc.tag === 'training') return '🪄';
  if (loc.tag === 'quest') return getAvailableChapter() ? '⭐' : '';
  if (loc.tag === 'safe') return '🛏️';
  if (loc.tag === 'chamber') return state.flags.chamber_unlocked && !state.flags.voldemort_defeated ? '⚔️' : '';
  const eligible = eligibleEventsFor(loc);
  const maxPriority = eligible.reduce((max, ev) => Math.max(max, ev.priority || 0), 0);
  if (maxPriority >= 3) return '⭐';
  if (maxPriority >= 1) return '❗';
  return '';
}

function explore() {
  advanceTimeSlot();
  const loc = LOCATIONS[state.location];
  state.statsTrack.exploreByTag[loc.tag] = (state.statsTrack.exploreByTag[loc.tag] || 0) + 1;
  trackDaily('explore');
  const pool = EVENTS[loc.tag];
  if (!pool || pool.length === 0) {
    addLog('특별한 일이 일어나지 않았다.', '');
    render();
    return;
  }
  const eligible = eligibleEventsFor(loc);
  // 우선순위 3단계: 3=메인 퀘스트 > 2=대형 이벤트 > 1=사이드 퀘스트 > 0=잡 이벤트.
  // 조건을 충족한 이벤트 중 가장 높은 등급만 후보로 남겨, 메인 퀘스트가 잡다한 이벤트에 묻히지 않게 한다.
  const maxPriority = eligible.reduce((max, ev) => Math.max(max, ev.priority || 0), 0);
  const priorityEligible = maxPriority > 0 ? eligible.filter((ev) => (ev.priority || 0) === maxPriority) : [];
  const chosenPool = priorityEligible.length > 0 ? priorityEligible
    : eligible.length > 0 ? eligible
      : pool.filter((ev) => !ev.once);
  if (chosenPool.length === 0) {
    addLog('특별한 일이 일어나지 않았다.', '');
    render();
    return;
  }
  const ev = chosenPool[randInt(0, chosenPool.length - 1)];
  if (ev.once) state.flags['event_' + ev.id] = true;
  if (ev.recall && state.memories[ev.recall]) addLog(`💭 ${ev.recallText}`, 'log-memory');
  else if (ev.recallOptions) {
    const matchedId = Object.keys(ev.recallOptions).find((mid) => state.memories[mid]);
    if (matchedId) addLog(`💭 ${ev.recallOptions[matchedId]}`, 'log-memory');
  }

  if (ev.combat) {
    addLogParagraphs(ev.text, 'log-event');
    startCombat(ev.combat);
    return;
  }

  state.pendingEvent = ev;
  state.mode = 'event';
  addLogParagraphs(ev.text, 'log-event');
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
    const result = runCheck(choice.check.stat, choice.check.dc, choice.check.bonusPercent);
    const outcome = choice.outcomes[result.tier]
      || (result.tier === 'critical' ? choice.outcomes.success : null)
      || (result.tier === 'fumble' ? choice.outcomes.fail : null)
      || choice.outcomes.fail;
    applyEffect(outcome.effect);
    logResultWithEffect(outcome.text, outcome.effect);
    if (choice.streakId) advanceStreak(choice, result.tier === 'critical' || result.tier === 'success');
    resolved = outcome;
  } else {
    applyEffect(choice.effect);
    logResultWithEffect(choice.resultText, choice.effect);
  }

  state.pendingEvent = null;
  state.mode = 'explore';

  if (resolved.combat) { startCombat(resolved.combat); return; }
  render();
}

/* ---------------- 휴식 ---------------- */
/* 휴식은 남은 시간대와 상관없이 그날 전체를 소모하고 다음 날 아침으로 넘어간다.
 * "무료지만 하루를 태운다" — 갈레온으로 시간을 사는 것과 대비되는 선택이 되도록 한다. */
function rest() {
  state.hp = getMaxHp();
  state.mp = getMaxMp();
  state.timeSlot = 0;
  state.bonusSlotsToday = 0;
  state.day += 1;
  checkDeadlineStatus();
  addLog('푹 쉬어 체력과 마력을 모두 회복했다. 하루가 저물고 다음 날 아침이 밝았다.', 'log-result');
  render();
}

/* ---------------- 아침 식사 (골드로 시간을 산다) ----------------
 * 하루에 한 번, 갈레온을 내고 그날의 시간대를 하나 늘린다. 페퍼업 포션과 같은 하루 한도를 공유한다. */
const BREAKFAST_COST = 5;
function canEatBreakfast() {
  return state.location === 'greatHall' && state.timeSlot === 0 && state.gold >= BREAKFAST_COST && state.timeBonusUsedDay !== state.day;
}
function eatBreakfast() {
  if (!canEatBreakfast()) return;
  state.gold -= BREAKFAST_COST;
  applyEffect({ bonusSlot: 1 });
  addLog('대연회장에서 든든하게 아침을 먹었다. 오늘 하루를 조금 더 알차게 쓸 수 있을 것 같다.', 'log-result');
  render();
}

/* ---------------- 수업 (주문 습득 경로 ①) ---------------- */
function attendClass(subjectId) {
  advanceTimeSlot();
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
    if (item.effect.bonusSlot && state.timeBonusUsedDay === state.day) {
      addLog('오늘은 이미 시간을 벌 방법을 써버렸다. 내일 다시 시도해보자.', 'log-warn');
      render();
      return;
    }
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
/* 마감을 넘긴 채로 시간을 끌수록 보스가 강해진다 — "악화"의 실체를 전투로 체감시킨다 */
function getDeadlinePenaltyMult() {
  return 1 + Math.min(state.deadlinePenaltyStacks || 0, 3) * 0.08;
}

function startCombat(enemyId) {
  const enemy = ENEMIES[enemyId];
  if (enemyId === 'dementor' && state.flags.dementorImmune) {
    addLog('은빛 수호신이 나서자, 디멘터는 다가오지도 못하고 물러난다.', 'log-win');
    state.flags.dementor_faced = true;
    state.mode = 'explore';
    render();
    return;
  }
  const mult = enemy.boss ? getDeadlinePenaltyMult() : 1;
  const enemyMaxHp = Math.round(enemy.hp * mult);
  state.combat = { enemyId, enemyHp: enemyMaxHp, enemyMaxHp, atkMult: mult, playerDefending: false };
  state.mode = 'combat';
  state.seenEnemies = state.seenEnemies || {};
  state.seenEnemies[enemyId] = true;
  addLog(`[${enemy.name}]과(와)의 전투 시작!`, 'log-combat');
  if (mult > 1) addLog('마감을 넘긴 여파로, 상대가 평소보다 강하게 느껴진다.', 'log-warn');
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
  let dmg = Math.round(enemy.atk * (c.atkMult || 1) * variance) - getDef();
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
  if (c.enemyId === 'dementor') state.flags.dementor_faced = true;

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

/* ---------------- 퀘스트 로그 ----------------
 * 별도의 퀘스트 데이터 없이, 이미 있는 flags/streaks를 읽어 "지금 뭘 해야 하는지"를
 * 상시 보여준다. 진행 중인 목표가 안 보이는 문제를 해결한다. */
function getActiveQuestLog() {
  const list = [];
  const f = state.flags;

  if (!f.ch1_started) list.push({ tag: '메인', label: '교장실에서 이야기를 들어보자', detail: '' });
  else if (!f.has_diary) list.push({ tag: '메인', label: '단서를 찾아라', detail: '도서관·복도를 탐험해 일기장을 찾자' });
  else if (!f.ch1_done) list.push({ tag: '메인', label: '단서를 보고하자', detail: '교장실로 돌아가 일기장을 보여주자' });
  else if (!f.has_key) list.push({ tag: '메인', label: '금지된 숲의 흔적', detail: '금지된 숲을 탐험해 열쇠를 찾자' });
  else if (!f.ch2_done) list.push({ tag: '메인', label: '열쇠를 보고하자', detail: '교장실로 돌아가 열쇠를 보여주자' });
  else if (f.chamber_unlocked && !f.riddle_defeated) list.push({ tag: '메인', label: '비밀의 방 도전', detail: '비밀의 방으로 이동해 환영에 맞서자' });
  else if (f.riddle_defeated && !f.ch3_done) list.push({ tag: '메인', label: '교장에게 보고', detail: '교장실로 돌아가 보고하자' });
  else if (f.ch3_done && !f.voldemort_defeated) list.push({ tag: '메인', label: '최후의 결전', detail: '비밀의 방에서 볼드모트의 잔영과 맞서자' });

  if (state.deadline) {
    const remain = state.deadline.dueDay - state.day;
    list.push({ tag: '마감', label: state.deadline.label, detail: remain >= 0 ? `D-${remain}` : `기한 초과 +${-remain}일` });
  }

  if (f.neville_book_active && !f.has_nevilles_book) list.push({ tag: '사이드', label: '네빌의 책 찾기', detail: '복도를 탐험해 책을 찾자' });
  else if (f.has_nevilles_book) list.push({ tag: '사이드', label: '네빌에게 책 돌려주기', detail: '복도에서 네빌을 만나자' });

  if (f.hagrid_favor_active && !f.hagrid_favor_have_herb) list.push({ tag: '사이드', label: '해그리드의 부탁: 약초 채집', detail: '금지된 숲에서 약초를 찾자' });
  else if (f.hagrid_favor_have_herb) list.push({ tag: '사이드', label: '해그리드에게 약초 전달', detail: '금지된 숲 근처에서 해그리드를 만나자' });

  const broomStreak = (state.streaks || {}).broomBalance || 0;
  if (!f.broomBalance_done && broomStreak > 0) list.push({ tag: '도전', label: `빗자루 균형 훈련 (연속 ${broomStreak}/3)`, detail: '복도 쪽에서 도전할 수 있다' });

  if (f.boggart_faced && !f.dementor_faced) {
    list.push({ tag: '체인', label: '보가트를 물리쳤다', detail: '금지된 숲 어딘가에 디멘터가 나타난다' });
  } else if (f.dementor_faced && !f.patronusPractice_done) {
    const streak = (state.streaks || {}).patronusPractice || 0;
    list.push({ tag: '체인', label: `패트로누스 수련${streak > 0 ? ` (연속 ${streak}/3)` : ''}`, detail: '복도에서 루핀 교수를 찾자' });
  } else if (f.patronusPractice_done && !f.patronusTrial_done) {
    const streak = (state.streaks || {}).patronusTrial || 0;
    list.push({ tag: '시련', label: `패트로누스 시련${streak > 0 ? ` (연속 ${streak}/3)` : ''}`, detail: '복도에서 루핀 교수에게 도전을 청하자' });
  }

  return list;
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
  addLogParagraphs(ch.text, 'log-story');
  render();
}

function resolveChapterChoice(idx) {
  const ch = state.pendingChapter;
  if (!ch) return;
  const choice = ch.choices[idx];
  applyEffect(choice.effect);
  logResultWithEffect(choice.resultText, choice.effect);
  state.flags[ch.setFlag] = true;
  state.pendingChapter = null;
  state.mode = 'explore';
  if (ch.id === 'ch1_report') advanceDeadlineChapter('ch1');
  else if (ch.id === 'ch2') advanceDeadlineChapter('ch2');
  else if (ch.id === 'ch3') advanceDeadlineChapter('ch3');
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
/* 마감을 거듭 어겼다면 좋은 결말도 한 단계 어두워진다 — "강등"이라는 약속을 지킨다 */
const ENDING_DOWNGRADE = { together: 'light', light: 'balanced', balanced: 'dark', dark: 'dark' };

function triggerEnding() {
  const companionValues = Object.values(state.companions || {});
  const avgAffinity = companionValues.length ? companionValues.reduce((a, b) => a + b, 0) / Object.keys(COMPANIONS).length : 0;

  let ending;
  if (avgAffinity >= 50 && state.alignment >= -10) ending = ENDINGS.together;
  else if (state.alignment >= 25) ending = ENDINGS.light;
  else if (state.alignment <= -25) ending = ENDINGS.dark;
  else ending = ENDINGS.balanced;

  if ((state.deadlinePenaltyStacks || 0) >= 2) {
    const downgradedId = ENDING_DOWNGRADE[ending.id] || ending.id;
    if (downgradedId !== ending.id) {
      addLog('⚠ 거듭된 지연의 대가로, 상황이 더 나빠진 채로 끝을 맞았다.', 'log-warn');
      ending = ENDINGS[downgradedId];
    }
  }

  /* 3장에서 남긴 기억이 결말의 마지막 문장에 조용히 반영된다 */
  let memoryNote = '';
  if (state.memories.asked_companions_final) memoryNote = '\n\n결전을 앞두고 손을 내밀었던 순간이, 끝까지 곁을 지켜준 이들의 얼굴과 함께 떠올랐다.';
  else if (state.memories.solo_resolve) memoryNote = '\n\n누구에게도 기대지 않고 혼자 짊어졌던 그 밤이, 지금의 영운을 만들었다.';
  else if (state.memories.afraid_but_resolute) memoryNote = '\n\n두려움을 인정하고도 물러서지 않았던 그 순간이, 오래도록 마음에 남았다.';

  state.ending = memoryNote ? { ...ending, text: ending.text + memoryNote } : ending;
  state.mode = 'ending';
  render();
}
