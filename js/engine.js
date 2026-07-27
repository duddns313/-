/* ===================== 게임 엔진 (핵심 로직) ===================== */

function addLog(text, cls) {
  state.log.push({ text, cls: cls || '' });
  if (state.log.length > 200) state.log.shift();
  renderLog();
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function addItem(itemId, qty) {
  qty = qty || 1;
  state.inventory[itemId] = (state.inventory[itemId] || 0) + qty;
}

function removeItem(itemId, qty) {
  qty = qty || 1;
  if (!state.inventory[itemId]) return false;
  state.inventory[itemId] -= qty;
  if (state.inventory[itemId] <= 0) delete state.inventory[itemId];
  return true;
}

/* 일반 효과 적용: hp, mp, gold, exp, intelligence, courage, charm, alignment, item, flag */
function applyEffect(effect) {
  if (!effect) return;
  if (effect.hp) { state.hp = clamp(state.hp + effect.hp, 0, state.maxHp); }
  if (effect.mp) { state.mp = clamp(state.mp + effect.mp, 0, state.maxMp); }
  if (effect.gold) { state.gold = Math.max(0, state.gold + effect.gold); }
  if (effect.intelligence) { state.intelligence += effect.intelligence; }
  if (effect.courage) { state.courage += effect.courage; }
  if (effect.charm) { state.charm += effect.charm; }
  if (effect.alignment) { state.alignment = clamp(state.alignment + effect.alignment, -100, 100); }
  if (effect.item) { addItem(effect.item, 1); }
  if (effect.flag) { state.flags[effect.flag] = true; }
  if (effect.exp) { gainExp(effect.exp); }
}

function gainExp(amount) {
  state.exp += amount;
  while (state.exp >= state.expToNext) {
    state.exp -= state.expToNext;
    state.level += 1;
    state.expToNext = Math.floor(state.expToNext * 1.35);
    state.maxHp += 12;
    state.maxMp += 6;
    state.hp = state.maxHp;
    state.mp = state.maxMp;
    state.baseAtk += 2;
    state.baseDef += 1;
    addLog(`레벨 업! Lv.${state.level}이 되었다. (체력/마력 회복, 능력치 상승)`, 'log-levelup');
    checkSpellUnlocks();
  }
}

function checkSpellUnlocks() {
  Object.values(SPELLS).forEach((sp) => {
    if (!sp.startWith && sp.learnLevel <= state.level && !state.spells.includes(sp.id)) {
      state.spells.push(sp.id);
      addLog(`새로운 주문을 배웠다: [${sp.name}]`, 'log-spell');
    }
  });
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
  if (loc.shop) {
    state.mode = 'shop';
  } else {
    state.mode = 'explore';
  }
  render();
}

/* ---------------- 탐험 / 랜덤 이벤트 ---------------- */
function explore() {
  const loc = LOCATIONS[state.location];
  const pool = EVENTS[loc.tag];
  if (!pool || pool.length === 0) {
    addLog('특별한 일이 일어나지 않았다.', '');
    state.day += 1;
    render();
    return;
  }
  // 우선순위: once-only / 조건부 이벤트 먼저 확인
  const eligible = pool.filter((ev) => {
    if (ev.once && state.flags['event_' + ev.id]) return false;
    if (ev.requiresFlag && !state.flags[ev.requiresFlag]) return false;
    if (ev.notFlag && state.flags[ev.notFlag]) return false;
    return true;
  });
  const chosenPool = eligible.length > 0 ? eligible : pool.filter((ev) => !ev.once);
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
  if (choice.cost) {
    if (choice.cost.mp && state.mp < choice.cost.mp) {
      addLog('마력이 부족하다.', 'log-warn');
      render();
      return;
    }
    if (choice.cost.mp) state.mp -= choice.cost.mp;
  }
  applyEffect(choice.effect);
  addLog(choice.resultText || '', 'log-result');
  state.pendingEvent = null;
  state.mode = 'explore';
  checkStoryTriggers();
  render();
}

/* ---------------- 휴식 ---------------- */
function rest() {
  state.hp = state.maxHp;
  state.mp = state.maxMp;
  state.day += 1;
  addLog('푹 쉬어 체력과 마력을 모두 회복했다.', 'log-result');
  render();
}

/* ---------------- 수련 ---------------- */
function train() {
  state.day += 1;
  const gainInt = randInt(1, 2);
  const gainExpAmt = 8;
  state.intelligence += gainInt;
  addLog(`수련에 매진했다. (지식 +${gainInt}, 경험치 +${gainExpAmt})`, 'log-result');
  gainExp(gainExpAmt);
  render();
}

/* ---------------- 상점 ---------------- */
function buyItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  if (state.gold < item.price) {
    addLog('갈레온이 부족하다.', 'log-warn');
    render();
    return;
  }
  state.gold -= item.price;
  addItem(itemId, 1);
  addLog(`[${item.name}]을(를) 구매했다. (-${item.price} 갈레온)`, 'log-result');
  render();
}

function sellItem(itemId) {
  const item = ITEMS[itemId];
  if (!item || !state.inventory[itemId]) return;
  removeItem(itemId, 1);
  state.gold += (item.sell || 0);
  addLog(`[${item.name}]을(를) 판매했다. (+${item.sell || 0} 갈레온)`, 'log-result');
  render();
}

/* ---------------- 아이템/장비 ---------------- */
function useItemOutOfCombat(itemId) {
  const item = ITEMS[itemId];
  if (!item || !state.inventory[itemId]) return;
  if (item.type === 'potion') {
    applyEffect(item.effect);
    removeItem(itemId, 1);
    addLog(`[${item.name}]을(를) 사용했다.`, 'log-result');
  } else if (item.type === 'wand' || item.type === 'robe') {
    equipItem(itemId);
  } else if (item.type === 'book') {
    applyEffect(item.effect);
    removeItem(itemId, 1);
    addLog(`[${item.name}]을(를) 읽었다.`, 'log-result');
  } else {
    addLog('지금은 사용할 수 없는 물건이다.', 'log-warn');
  }
  render();
}

function equipItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  if (item.type === 'wand') {
    state.equipped.wand = itemId;
    addLog(`[${item.name}]을(를) 장착했다.`, 'log-result');
  } else if (item.type === 'robe') {
    state.equipped.robe = itemId;
    addLog(`[${item.name}]을(를) 착용했다.`, 'log-result');
  }
  render();
}

/* ---------------- 전투 ---------------- */
function startCombat(enemyId) {
  const enemy = ENEMIES[enemyId];
  state.combat = {
    enemyId,
    enemyHp: enemy.hp,
    enemyMaxHp: enemy.hp,
    playerDefending: false,
  };
  state.mode = 'combat';
  addLog(`[${enemy.name}]과(와)의 전투 시작!`, 'log-combat');
  render();
}

function combatCastSpell(spellId) {
  const c = state.combat;
  if (!c) return;
  const spell = SPELLS[spellId];
  const enemy = ENEMIES[c.enemyId];
  if (spell.mpCost > state.mp) {
    addLog('마력이 부족하다!', 'log-warn');
    render();
    return;
  }
  state.mp -= spell.mpCost;

  if (spell.type === 'defense') {
    c.playerDefending = true;
    addLog(`[${spell.name}]으로 방어 태세를 갖췄다.`, 'log-player');
    enemyTurn();
    return;
  }
  if (spell.type === 'utility') {
    addLog(`[${spell.name}]을(를) 사용했다. 주변이 밝아졌다.`, 'log-player');
    enemyTurn();
    return;
  }

  let mult = 1;
  if (spell.bonusVs && spell.bonusVs.includes(c.enemyId)) mult = spell.bonusMult || 2;
  const variance = 0.85 + Math.random() * 0.3;
  let dmg = Math.round((getAtk() + spell.power) * mult * variance) - enemy.def;
  dmg = Math.max(1, dmg);
  c.enemyHp = Math.max(0, c.enemyHp - dmg);
  addLog(`[${spell.name}]! ${enemy.name}에게 ${dmg}의 피해를 입혔다. (남은 체력 ${c.enemyHp}/${c.enemyMaxHp})`, 'log-player');

  if (spell.alignment) {
    state.alignment = clamp(state.alignment + spell.alignment, -100, 100);
    addLog('...어둠의 기운이 마음을 스친다. (성향 감소)', 'log-dark');
  }

  if (c.enemyHp <= 0) {
    winCombat();
    return;
  }
  enemyTurn();
}

function combatUseItem(itemId) {
  const c = state.combat;
  if (!c) return;
  const item = ITEMS[itemId];
  if (!item || !state.inventory[itemId] || item.type !== 'potion') return;
  applyEffect(item.effect);
  removeItem(itemId, 1);
  addLog(`[${item.name}]을(를) 사용했다.`, 'log-player');
  enemyTurn();
}

function combatDefend() {
  const c = state.combat;
  if (!c) return;
  c.playerDefending = true;
  addLog('방어 자세를 취했다.', 'log-player');
  enemyTurn();
}

function combatFlee() {
  const c = state.combat;
  if (!c) return;
  const enemy = ENEMIES[c.enemyId];
  const chance = clamp(50 + state.courage * 2 - (enemy.boss ? 30 : 0), 10, 90);
  if (randInt(1, 100) <= chance) {
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
    dmg = Math.max(1, Math.round(dmg * 0.35));
    c.playerDefending = false;
  }
  state.hp = clamp(state.hp - dmg, 0, state.maxHp);
  addLog(`${enemy.name}의 공격! ${dmg}의 피해를 입었다. (내 체력 ${state.hp}/${state.maxHp})`, 'log-enemy');

  if (state.hp <= 0) {
    loseCombat();
    return;
  }
  render();
}

function winCombat() {
  const c = state.combat;
  const enemy = ENEMIES[c.enemyId];
  const gold = randInt(enemy.gold[0], enemy.gold[1]);
  addLog(`${enemy.name}을(를) 물리쳤다! (경험치 +${enemy.exp}, 갈레온 +${gold})`, 'log-win');
  state.gold += gold;
  gainExp(enemy.exp);

  if (c.enemyId === 'riddleShade') state.flags.riddle_defeated = true;
  if (c.enemyId === 'voldemortShadow') state.flags.voldemort_defeated = true;

  state.combat = null;
  state.mode = 'explore';
  checkStoryTriggers();

  if (state.flags.voldemort_defeated) {
    triggerEnding();
    return;
  }
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
  state.hp = Math.max(1, Math.floor(state.maxHp * 0.5));
  state.gold = Math.max(0, state.gold - Math.floor(state.gold * 0.2));
  render();
}

/* ---------------- 스토리 진행 (교장실) ---------------- */
function checkStoryTriggers() {
  // 자동으로 플래그 조건 충족 시 알림만 표시 (실제 진행은 교장실 방문시)
}

function getAvailableChapter() {
  return STORY.chapters.find((ch) => {
    if (state.flags[ch.setFlag]) return false;
    return ch.requiresFlags.every((f) => state.flags[f]);
  });
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

  if (ch.id === 'ch2') {
    // 비밀의 방 해금 후 리들의 환영과 조우
    addLog('비밀의 방으로 향하는 통로가 열렸다. 도전할 준비가 되면 [비밀의 방]으로 이동하세요.', 'log-story');
  }
  render();
}

/* 비밀의 방 진입 시 보스전 트리거 */
function enterChamber() {
  if (!state.flags.chamber_unlocked) {
    addLog('아직 비밀의 방으로 가는 길을 찾지 못했다.', 'log-warn');
    render();
    return;
  }
  if (state.flags.voldemort_defeated) {
    addLog('비밀의 방은 이제 고요하다.', '');
    render();
    return;
  }
  if (!state.flags.riddle_defeated) {
    addLog('축축한 어둠 속에서 톰 리들의 환영이 모습을 드러낸다!', 'log-event');
    startCombat('riddleShade');
    return;
  }
  if (!state.flags.ch3_done) {
    addLog('환영을 물리쳤지만 아직 교장에게 보고하지 않았다. 교장실로 가보자.', 'log-warn');
    render();
    return;
  }
  addLog('깊은 어둠 속에서 볼드모트의 잔영이 형체를 갖추기 시작한다. 마지막 결전이다!', 'log-event');
  startCombat('voldemortShadow');
}

/* ---------------- 엔딩 ---------------- */
function triggerEnding() {
  let ending;
  if (state.alignment >= 25) ending = ENDINGS.light;
  else if (state.alignment <= -25) ending = ENDINGS.dark;
  else ending = ENDINGS.balanced;
  state.ending = ending;
  state.mode = 'ending';
  render();
}
