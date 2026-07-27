/* ===================== UI 렌더링 (모바일 셸) ===================== */

let activeTypewriters = [];

function $(id) { return document.getElementById(id); }

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function button(label, onClick, opts) {
  opts = opts || {};
  const b = el('button', opts.cls || 'btn', label);
  if (opts.disabled) b.disabled = true;
  if (opts.title) b.title = opts.title;
  b.addEventListener('click', onClick);
  return b;
}

function rarityClass(rarityId) { return 'rarity-' + rarityId; }

/* ---------------- 토스트 ---------------- */
function toast(message, opts) {
  opts = opts || {};
  const container = $('toast-container');
  const t = el('div', 'toast ' + (opts.cls || ''), message);
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, opts.duration || 2600);
}

/* ---------------- 바텀시트 ---------------- */
function openSheet(builder) {
  const overlay = $('sheet-overlay');
  const content = $('sheet-content');
  content.innerHTML = '';
  builder(content);
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('show'));
}

function closeSheet() {
  const overlay = $('sheet-overlay');
  overlay.classList.remove('show');
  setTimeout(() => overlay.classList.add('hidden'), 200);
}

function confirmSheet(message, onConfirm) {
  openSheet((content) => {
    content.appendChild(el('p', 'sheet-message', message));
    const row = el('div', 'sheet-actions');
    row.appendChild(button('취소', closeSheet, { cls: 'btn' }));
    row.appendChild(button('확인', () => { closeSheet(); onConfirm(); }, { cls: 'btn btn-danger' }));
    content.appendChild(row);
  });
}

/* ---------------- 판정 연출 (주사위 플래시 + 햅틱) ---------------- */
function notifyCheck(result) {
  const container = $('check-flash-container');
  const flash = el('div', 'check-flash tier-' + result.tier);
  flash.appendChild(el('div', 'check-flash-tier', CHECK_TIER_LABEL[result.tier]));
  flash.appendChild(el('div', 'check-flash-roll', `${result.roll} / ${result.rate}%`));
  container.appendChild(flash);
  requestAnimationFrame(() => flash.classList.add('show'));
  setTimeout(() => { flash.classList.remove('show'); setTimeout(() => flash.remove(), 300); }, 900);

  if (navigator.vibrate) {
    if (result.tier === 'critical') navigator.vibrate([40, 40, 40]);
    else if (result.tier === 'fumble') navigator.vibrate([80, 40, 80]);
    else if (result.tier === 'success') navigator.vibrate(20);
  }
}

/* ---------------- 타이프라이터 로그 ---------------- */
function typewriterInto(container, text, cls) {
  const p = el('p', 'log-entry ' + cls);
  container.appendChild(p);
  let i = 0;
  const full = text;
  const timer = setInterval(() => {
    i += 2;
    p.textContent = full.slice(0, i);
    container.scrollTop = container.scrollHeight;
    if (i >= full.length) {
      clearInterval(timer);
      activeTypewriters = activeTypewriters.filter((t) => t.timer !== timer);
    }
  }, 14);
  activeTypewriters.push({ timer, node: p, full });
}

function skipTypewriters() {
  activeTypewriters.forEach((t) => { clearInterval(t.timer); t.node.textContent = t.full; });
  activeTypewriters = [];
}

function uiAppendLogEntry(entry) {
  const recent = $('log-recent');
  const full = $('log-full');
  if (recent) {
    typewriterInto(recent, entry.text, entry.cls);
    while (recent.children.length > 6) recent.removeChild(recent.firstChild);
  }
  if (full) {
    full.appendChild(el('p', 'log-entry ' + entry.cls, entry.text));
    full.scrollTop = full.scrollHeight;
  }
}

function renderLogFull() {
  const full = $('log-full');
  const recent = $('log-recent');
  full.innerHTML = '';
  recent.innerHTML = '';
  state.log.forEach((entry) => full.appendChild(el('p', 'log-entry ' + entry.cls, entry.text)));
  state.log.slice(-6).forEach((entry) => recent.appendChild(el('p', 'log-entry ' + entry.cls, entry.text)));
  full.scrollTop = full.scrollHeight;
}

/* ---------------- 설정 화면 ---------------- */
function showSetupScreen() {
  $('setup-screen').classList.remove('hidden');
  $('game-shell').classList.add('hidden');

  if (hasIncompatibleSave()) {
    toast('이전 버전의 저장 데이터는 호환되지 않아 정리했습니다.', { cls: 'toast-warn', duration: 4000 });
    deleteSave();
  }
  $('btn-continue').classList.toggle('hidden', !hasSave());

  const houseSelect = $('house-select');
  houseSelect.innerHTML = '';
  Object.values(HOUSES).forEach((house) => {
    const card = el('div', 'house-card');
    card.appendChild(el('h3', 'house-name', house.name));
    card.appendChild(el('p', 'house-trait', house.trait));
    card.appendChild(el('p', 'house-desc', house.desc));
    card.addEventListener('click', () => {
      document.querySelectorAll('.house-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      houseSelect.dataset.selected = house.id;
    });
    houseSelect.appendChild(card);
  });

  $('btn-start').onclick = () => {
    const name = ($('input-name').value || '').trim().slice(0, 16) || '이름 없는 마법사';
    const houseId = houseSelect.dataset.selected;
    if (!houseId) { toast('기숙사를 선택해주세요.', { cls: 'toast-warn' }); return; }
    const isNgPlus = !!pendingCarryOver;
    state = newState(name, houseId);
    startGameScreen();
    addLog(`${name}, 당신은 ${HOUSES[houseId].name}에 배정되었다.`, 'log-story-title');
    if (isNgPlus) addLog(`--- 새 게임+ ${state.ngPlusCount}회차 시작! 이전 회차의 업적·도감을 계승했다. ---`, 'log-win');
    addLog('호그와트에서의 새로운 하루가 시작된다.', 'log-story');
    render();
  };

  $('btn-continue').onclick = () => {
    const result = loadGame();
    if (result.ok) {
      startGameScreen();
      renderLogFull();
      addLog('--- 이어하기 ---', 'log-move');
      render();
    } else if (result.incompatible) {
      toast('이전 버전의 저장 데이터라 불러올 수 없습니다.', { cls: 'toast-warn' });
      deleteSave();
      $('btn-continue').classList.add('hidden');
    } else {
      toast('저장된 게임이 없습니다.', { cls: 'toast-warn' });
    }
  };
}

function startGameScreen() {
  $('setup-screen').classList.add('hidden');
  $('game-shell').classList.remove('hidden');
  switchTab('adventure');
}

/* ---------------- 탭 전환 ---------------- */
function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
  $('panel-' + tabId).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
}

/* ---------------- 마스터 렌더 ---------------- */
function render() {
  refreshDailyQuestsIfNeeded();
  checkAchievements();
  renderTopbar();
  renderLocationBanner();
  renderStage();
  renderTravel();
  renderCharacterTab();
  renderInventoryTab();
  renderCodexTab();
  if (state) saveGame();
}

function renderTopbar() {
  $('topbar-name').textContent = `${state.name} · ${HOUSES[state.houseId].name} · Lv.${state.level}`;
  $('topbar-day').textContent = `${getYear()}학년 · ${state.day}일차`;
  $('mini-hp-fill').style.width = clamp((state.hp / getMaxHp()) * 100, 0, 100) + '%';
  $('mini-mp-fill').style.width = clamp((state.mp / getMaxMp()) * 100, 0, 100) + '%';
}

function renderLocationBanner() {
  const loc = LOCATIONS[state.location];
  const banner = $('location-banner');
  banner.innerHTML = '';
  banner.appendChild(el('h2', 'loc-name', loc.name));
  banner.appendChild(el('p', 'loc-desc', loc.desc));
}

/* ---------------- 모험 탭: 상황별 행동 ---------------- */
function renderStage() {
  const stage = $('stage-area');
  stage.innerHTML = '';
  const loc = LOCATIONS[state.location];

  if (state.mode === 'explore') {
    if (loc.tag === 'safe') {
      stage.appendChild(button('탐험하기', explore));
      stage.appendChild(button('휴식하기 (체력·마력 회복)', rest));
    } else if (loc.tag === 'training') {
      renderClassroomStage(stage);
    } else if (loc.tag === 'quest') {
      stage.appendChild(button('교장과 대화하기', enterHeadmasterOffice));
    } else if (loc.tag === 'chamber') {
      stage.appendChild(button('안으로 들어간다', enterChamber));
    } else {
      stage.appendChild(button('탐험하기', explore));
    }
  } else if (state.mode === 'shop') {
    renderShopStage(stage, loc);
  } else if (state.mode === 'event') {
    renderEventStage(stage);
  } else if (state.mode === 'story') {
    renderStoryStage(stage);
  } else if (state.mode === 'combat') {
    renderCombatStage(stage);
  } else if (state.mode === 'ending') {
    renderEndingStage(stage);
  }
}

function renderClassroomStage(stage) {
  stage.appendChild(el('h4', 'stage-subtitle', '수업 수강 — 진도가 100%가 되면 다음 주문을 습득할 수 있습니다.'));
  Object.values(SUBJECTS).forEach((subj) => {
    const progress = (state.classProgress && state.classProgress[subj.id]) || 0;
    const row = el('div', 'subject-row');
    row.appendChild(el('div', 'subject-name', subj.name));
    const track = el('div', 'bar-track');
    const fill = el('div', 'bar-fill bar-progress');
    fill.style.width = progress + '%';
    track.appendChild(fill);
    row.appendChild(track);
    const actions = el('div', 'subject-actions');
    actions.appendChild(button('수업 참여', () => attendClass(subj.id), { cls: 'btn-small' }));
    const next = nextSpellForSubject(subj.id);
    if (next && progress >= 100) {
      actions.appendChild(button(`습득: ${next.name}`, () => learnSpellFromClass(subj.id), { cls: 'btn-small btn-primary' }));
    } else if (!next) {
      actions.appendChild(el('span', 'subject-done', '계열 완료'));
    }
    row.appendChild(actions);
    stage.appendChild(row);
  });
}

function renderShopStage(stage, loc) {
  const shop = SHOPS[loc.shop];
  stage.appendChild(el('h4', 'stage-subtitle', shop.name));

  const grid = el('div', 'shop-grid');
  (shop.items || []).forEach((itemId) => {
    const item = ITEMS[itemId];
    const card = el('div', 'shop-item');
    card.appendChild(el('div', 'item-name', item.name));
    card.appendChild(el('div', 'item-desc', item.desc || ''));
    card.appendChild(el('div', 'item-price', `${item.price} G`));
    card.appendChild(button('구매', () => buyItem(itemId), { disabled: state.gold < item.price, cls: 'btn-small' }));
    grid.appendChild(card);
  });
  stage.appendChild(grid);

  if (shop.equipment) {
    stage.appendChild(el('h4', 'stage-subtitle', '장비'));
    const egrid = el('div', 'shop-grid');
    shop.equipment.forEach((tplId) => {
      const tpl = EQUIP_TEMPLATES[tplId];
      const card = el('div', 'shop-item');
      card.appendChild(el('div', 'item-name', tpl.name));
      const statLabel = STAT_META[tpl.stat] ? STAT_META[tpl.stat].label : tpl.stat === 'atk' ? '공격력' : tpl.stat === 'def' ? '방어력' : tpl.stat === 'maxMp' ? '최대마력' : tpl.stat;
      card.appendChild(el('div', 'item-desc', `${statLabel} +${tpl.range[0]}~${tpl.range[1]}`));
      card.appendChild(el('div', 'item-price', `${tpl.price} G`));
      card.appendChild(button('구매', () => buyEquipment(tplId), { disabled: state.gold < tpl.price, cls: 'btn-small' }));
      egrid.appendChild(card);
    });
    stage.appendChild(egrid);
  }

  if (shop.gacha) {
    stage.appendChild(el('h4', 'stage-subtitle', `지팡이 뽑기 (${WAND_GACHA_COST} G)`));
    stage.appendChild(el('p', 'gacha-note', '"지팡이가 마법사를 선택한다" — 재료에 따라 당신과 궁합이 맞으면 특별한 지팡이를 얻는다.'));
    const gachaRow = el('div', 'gacha-row');
    Object.values(WAND_CORES).forEach((core) => {
      const card = el('div', 'gacha-card');
      card.appendChild(el('div', 'item-name', core.name));
      card.appendChild(el('div', 'item-desc', core.flavor));
      card.appendChild(button('이 재료로 뽑기', () => doWandGacha(core.id), { disabled: state.gold < WAND_GACHA_COST, cls: 'btn-small' }));
      gachaRow.appendChild(card);
    });
    stage.appendChild(gachaRow);
  }
}

function renderEventStage(stage) {
  const ev = state.pendingEvent;
  const wrap = el('div', 'choice-wrap');
  ev.choices.forEach((choice, idx) => {
    let label = choice.label;
    if (choice.check) {
      const rate = getCheckRate(choice.check.stat, choice.check.dc);
      label += ` [${STAT_META[choice.check.stat].label} 판정 · 성공률 ${rate}%]`;
    }
    wrap.appendChild(button(label, () => resolveEventChoice(idx)));
  });
  stage.appendChild(wrap);
}

function renderStoryStage(stage) {
  const ch = state.pendingChapter;
  const wrap = el('div', 'choice-wrap');
  ch.choices.forEach((choice, idx) => wrap.appendChild(button(choice.label, () => resolveChapterChoice(idx))));
  stage.appendChild(wrap);
}

function renderCombatStage(stage) {
  const c = state.combat;
  const enemy = ENEMIES[c.enemyId];

  const box = el('div', 'enemy-box');
  box.appendChild(el('h3', 'enemy-name', enemy.name + (enemy.boss ? ' (보스)' : '')));
  const track = el('div', 'bar-track big');
  const fill = el('div', 'bar-fill bar-enemy');
  fill.style.width = clamp((c.enemyHp / c.enemyMaxHp) * 100, 0, 100) + '%';
  track.appendChild(fill);
  box.appendChild(track);
  box.appendChild(el('div', 'bar-value-text', `${c.enemyHp} / ${c.enemyMaxHp}`));
  stage.appendChild(box);

  const tabs = el('div', 'combat-tabs');

  const spellTab = el('div', 'combat-section');
  spellTab.appendChild(el('h4', '', '주문'));
  Object.keys(state.spells).forEach((spellId) => {
    const sp = SPELLS[spellId];
    const cast = getSpellCastInfo(spellId);
    const disabled = cast.mpCost > state.mp;
    spellTab.appendChild(button(`${sp.name} (MP ${cast.mpCost}) · ${cast.tierLabel}`, () => combatCastSpell(spellId), { disabled, cls: 'btn-small' + (sp.dark ? ' btn-dark' : '') }));
  });
  tabs.appendChild(spellTab);

  const itemTab = el('div', 'combat-section');
  itemTab.appendChild(el('h4', '', '아이템'));
  const potions = Object.keys(state.itemStacks).filter((id) => ITEMS[id].type === 'potion');
  if (!potions.length) itemTab.appendChild(el('p', 'empty-note', '(사용 가능한 물약 없음)'));
  potions.forEach((id) => itemTab.appendChild(button(`${ITEMS[id].name} x${state.itemStacks[id]}`, () => combatUseItem(id), { cls: 'btn-small' })));
  tabs.appendChild(itemTab);

  const otherTab = el('div', 'combat-section');
  otherTab.appendChild(el('h4', '', '기타'));
  otherTab.appendChild(button('방어', combatDefend, { cls: 'btn-small' }));
  otherTab.appendChild(button('도망치기', combatFlee, { cls: 'btn-small' }));
  if (enemy.boss && state.companionAssist) {
    Object.keys(state.companionAssist).filter((id) => state.companionAssist[id]).forEach((id) => {
      otherTab.appendChild(button(`${COMPANIONS[id].name}에게 도움 요청`, () => companionAssist(id), { cls: 'btn-small btn-primary' }));
    });
  }
  tabs.appendChild(otherTab);

  stage.appendChild(tabs);
}

function renderEndingStage(stage) {
  const box = el('div', 'ending-box');
  box.appendChild(el('h2', 'ending-title', state.ending.title));
  box.appendChild(el('p', 'ending-text', state.ending.text));
  const achCount = Object.keys(state.achievements).length;
  box.appendChild(el('p', 'ending-meta', `달성한 업적: ${achCount} / ${ACHIEVEMENTS.length}`));

  if (state.ending.id !== 'defeat') {
    box.appendChild(button('새 게임+ 시작하기 (업적·도감 계승)', () => {
      confirmSheet('새 게임+를 시작하시겠습니까? 캐릭터 진행 상황은 초기화되지만 업적·도감·칭호는 계승되며 약간의 보너스가 주어집니다.', () => {
        pendingCarryOver = {
          achievements: { ...state.achievements },
          titles: { ...state.titles },
          seenEnemies: { ...state.seenEnemies },
          seenItemBases: { ...state.seenItemBases },
          ngPlusCount: (state.ngPlusCount || 0) + 1,
        };
        deleteSave();
        state = null;
        $('game-shell').classList.add('hidden');
        showSetupScreen();
      });
    }, { cls: 'btn btn-primary' }));
  }

  box.appendChild(button('새로운 이야기 시작하기', () => {
    confirmSheet('정말 새로운 이야기를 시작하시겠습니까? 현재 진행 데이터가 삭제됩니다.', () => {
      deleteSave();
      state = null;
      $('game-shell').classList.add('hidden');
      showSetupScreen();
    });
  }));
  stage.appendChild(box);
}

function renderTravel() {
  const row = $('travel-row');
  row.innerHTML = '';
  if (!['explore', 'shop'].includes(state.mode)) return;
  const loc = LOCATIONS[state.location];
  row.appendChild(el('h4', 'travel-title', '이동'));
  const btnRow = el('div', 'travel-buttons');
  loc.connections.forEach((cid) => {
    const target = LOCATIONS[cid];
    const locked = target.locked && !state.flags.chamber_unlocked;
    btnRow.appendChild(button(target.name + (locked ? ' 🔒' : ''), () => travelTo(cid), { cls: 'btn-travel' }));
  });
  row.appendChild(btnRow);
}

/* ---------------- 캐릭터 탭 ---------------- */
function statBarRow(label, value, max, cls) {
  const row = el('div', 'stat-row');
  row.appendChild(el('span', 'stat-label', label));
  const track = el('div', 'bar-track');
  const fill = el('div', 'bar-fill ' + cls);
  fill.style.width = clamp((value / max) * 100, 0, 100) + '%';
  track.appendChild(fill);
  row.appendChild(track);
  row.appendChild(el('span', 'bar-value-text', `${value}/${max}`));
  return row;
}

function renderCharacterTab() {
  if (!state) return;
  const panel = $('panel-character');
  panel.innerHTML = '';

  const vit = el('div', 'panel-box');
  vit.appendChild(el('h3', 'panel-title', '생명력'));
  vit.appendChild(statBarRow('체력', state.hp, getMaxHp(), 'bar-hp'));
  vit.appendChild(statBarRow('마력', state.mp, getMaxMp(), 'bar-mp'));
  vit.appendChild(statBarRow(`Lv.${state.level} 경험치`, state.exp, state.expToNext, 'bar-exp'));
  panel.appendChild(vit);

  const dailyBox = el('div', 'panel-box');
  dailyBox.appendChild(el('h3', 'panel-title', `오늘의 과제 (${state.day}일차)`));
  (state.dailyQuests || []).forEach((q) => {
    const progress = Math.min(q.target, state.dailyCounters[q.track] || 0);
    const row = el('div', 'item-row');
    row.appendChild(el('span', 'item-name' + (q.claimed ? ' quest-done' : ''), `${q.claimed ? '✅ ' : ''}${q.label}`));
    row.appendChild(el('span', 'item-desc', `${progress}/${q.target}`));
    dailyBox.appendChild(row);
  });
  panel.appendChild(dailyBox);

  const statBox = el('div', 'panel-box');
  statBox.appendChild(el('h3', 'panel-title', '능력치 (장비 보너스 포함)'));
  Object.keys(STAT_META).forEach((key) => {
    const base = state.stats[key];
    const gear = getEquippedTotal(key);
    const row = el('div', 'stat-line');
    row.appendChild(el('span', 'stat-line-label', STAT_META[key].label));
    row.appendChild(el('span', 'stat-line-value', gear ? `${base + gear} (${base}+${gear})` : `${base}`));
    statBox.appendChild(row);
  });
  statBox.appendChild(el('p', 'stat-misc-line', `공격력 ${getAtk()} · 방어력 ${getDef()} · 갈레온 ${state.gold} G`));
  panel.appendChild(statBox);

  const alignBox = el('div', 'panel-box');
  alignBox.appendChild(el('h3', 'panel-title', '성향'));
  const alignTrack = el('div', 'bar-track');
  const alignFill = el('div', 'bar-fill bar-align');
  alignFill.style.width = ((state.alignment + 100) / 200) * 100 + '%';
  alignTrack.appendChild(alignFill);
  alignBox.appendChild(alignTrack);
  alignBox.appendChild(el('p', 'align-label-text', state.alignment > 10 ? '빛 쪽으로 기울어짐' : state.alignment < -10 ? '어둠 쪽으로 기울어짐' : '중립'));
  panel.appendChild(alignBox);

  const equipBox = el('div', 'panel-box');
  equipBox.appendChild(el('h3', 'panel-title', '장착 중인 장비'));
  ['wand', 'robe', 'accessory'].forEach((slot) => {
    const inst = getEquippedInstance(slot);
    const row = el('div', 'item-row');
    row.appendChild(el('span', 'item-name ' + (inst ? rarityClass(inst.rarity) : ''), inst ? getItemDisplayName(inst) : `${slotLabel(slot)} 없음`));
    if (inst) row.appendChild(button('해제', () => unequipSlot(slot), { cls: 'btn-small' }));
    equipBox.appendChild(row);
  });
  panel.appendChild(equipBox);

  const spellBox = el('div', 'panel-box');
  spellBox.appendChild(el('h3', 'panel-title', `보유 주문 (${learnedSpellCount()}/${maxLearnedSpells(state.level)})`));
  Object.keys(state.spells).forEach((spellId) => {
    const sp = SPELLS[spellId];
    const mastery = state.spells[spellId];
    const tier = getMasteryTier(mastery);
    const row = el('div', 'spell-row' + (sp.dark ? ' dark-item' : ''));
    row.appendChild(el('div', 'spell-name', `${sp.name} · ${tier.label} (${mastery})`));
    const track = el('div', 'bar-track small');
    const fill = el('div', 'bar-fill bar-mastery');
    fill.style.width = mastery + '%';
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(button('잊기', () => confirmSheet(`[${sp.name}]을(를) 잊으시겠습니까?`, () => forgetSpellAction(spellId)), { cls: 'btn-small btn-sell' }));
    spellBox.appendChild(row);
  });
  panel.appendChild(spellBox);

  const titleBox = el('div', 'panel-box');
  titleBox.appendChild(el('h3', 'panel-title', '칭호'));
  const unlockedTitles = Object.keys(state.titles || {});
  if (!unlockedTitles.length) {
    titleBox.appendChild(el('p', 'empty-note', '(아직 해금한 칭호가 없다. 업적을 달성해보세요)'));
  } else {
    const titleList = el('div', 'title-list');
    titleList.appendChild(button('칭호 없음', () => { equipTitle(null); render(); }, { cls: 'btn-small' + (!state.equippedTitle ? ' btn-primary' : '') }));
    unlockedTitles.forEach((tid) => {
      const t = TITLES[tid];
      titleList.appendChild(button(t.name, () => { equipTitle(tid); render(); }, { cls: 'btn-small' + (state.equippedTitle === tid ? ' btn-primary' : '') }));
    });
    titleBox.appendChild(titleList);
  }
  panel.appendChild(titleBox);

  const companionBox = el('div', 'panel-box');
  companionBox.appendChild(el('h3', 'panel-title', '동료'));
  Object.values(COMPANIONS).forEach((comp) => {
    const affinity = (state.companions && state.companions[comp.id]) || 0;
    const row = el('div', 'stat-row');
    row.appendChild(el('span', 'stat-label', comp.name));
    const track = el('div', 'bar-track');
    const fill = el('div', 'bar-fill bar-companion');
    fill.style.width = affinity + '%';
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el('span', 'bar-value-text', companionStatusLabel(affinity)));
    companionBox.appendChild(row);
  });
  panel.appendChild(companionBox);
}

/* ---------------- 소지품 탭 ---------------- */
function renderInventoryTab() {
  if (!state) return;
  const panel = $('panel-inventory');
  panel.innerHTML = '';

  const stackBox = el('div', 'panel-box');
  stackBox.appendChild(el('h3', 'panel-title', '소지품'));
  const stackList = el('div', 'item-list');
  const stackIds = Object.keys(state.itemStacks).filter((id) => state.itemStacks[id] > 0);
  if (!stackIds.length) stackList.appendChild(el('p', 'empty-note', '(비어 있음)'));
  stackIds.forEach((id) => {
    const item = ITEMS[id];
    const row = el('div', 'item-row');
    row.appendChild(el('span', 'item-name', `${item.name} x${state.itemStacks[id]}`));
    const actions = el('div', 'item-actions');
    if (item.type === 'potion' || item.type === 'scroll') actions.appendChild(button('사용', () => useItemOutOfCombat(id), { cls: 'btn-small' }));
    if (item.sell) actions.appendChild(button('판매', () => sellItem(id), { cls: 'btn-small btn-sell' }));
    row.appendChild(actions);
    stackList.appendChild(row);
  });
  stackBox.appendChild(stackList);
  panel.appendChild(stackBox);

  const equipBox = el('div', 'panel-box');
  equipBox.appendChild(el('h3', 'panel-title', '장비 (탭하여 상세보기)'));
  const equipList = el('div', 'item-list');
  if (!state.equipment.length) equipList.appendChild(el('p', 'empty-note', '(보유한 장비 없음)'));
  state.equipment.forEach((inst) => {
    const isEquipped = state.equipped.wand === inst.uid || state.equipped.robe === inst.uid || state.equipped.accessory === inst.uid;
    const row = el('div', 'item-row equip-row');
    row.appendChild(el('span', 'item-name ' + rarityClass(inst.rarity), getItemDisplayName(inst) + (isEquipped ? ' ★' : '')));
    row.addEventListener('click', () => openItemSheet(inst.uid));
    equipList.appendChild(row);
  });
  equipBox.appendChild(equipList);
  panel.appendChild(equipBox);
}

function openItemSheet(uid) {
  const inst = state.equipment.find((e) => e.uid === uid);
  if (!inst) return;
  openSheet((content) => {
    const rarity = RARITY_BY_ID[inst.rarity];
    content.appendChild(el('h3', 'sheet-item-name ' + rarityClass(inst.rarity), getItemDisplayName(inst)));
    content.appendChild(el('p', 'sheet-item-rarity', `${rarity.name} 등급 · ${slotLabel(inst.slot)}`));

    if (inst.identified) {
      const bd = getItemStatBreakdown(inst);
      const statList = el('div', 'sheet-stat-list');
      const labelMap = { atk: '공격력', def: '방어력', maxHp: '최대체력', maxMp: '최대마력', curseBonus: '저주 위력' };
      Object.keys(bd).forEach((k) => {
        const label = (STAT_META[k] && STAT_META[k].label) || labelMap[k] || k;
        statList.appendChild(el('p', 'sheet-stat-item', `${label} +${bd[k]}`));
      });
      content.appendChild(statList);
      if (inst.enhanceLevel > 0) content.appendChild(el('p', 'sheet-enhance-note', `강화 +${inst.enhanceLevel}`));
    } else {
      content.appendChild(el('p', 'sheet-unknown-note', '아직 정체를 알 수 없다. 감정이 필요하다.'));
    }

    const actions = el('div', 'sheet-actions');
    const isEquipped = state.equipped[inst.slot] === uid;
    if (!inst.identified) {
      actions.appendChild(button('감정하기 (지식 판정)', () => { identifyInstance(uid); openItemSheet(uid); }, { cls: 'btn' }));
    } else {
      if (isEquipped) actions.appendChild(button('해제', () => { unequipSlot(inst.slot); closeSheet(); }, { cls: 'btn' }));
      else actions.appendChild(button('장착', () => { equipInstance(uid); closeSheet(); }, { cls: 'btn btn-primary' }));
      if (inst.enhanceLevel < 10) {
        const cost = enhanceCost(inst.enhanceLevel);
        actions.appendChild(button(`강화 (마법석 ${cost.stones} · ${cost.gold}G)`, () => { enhanceInstance(uid); openItemSheet(uid); }, { cls: 'btn' }));
      }
      if (!isEquipped) actions.appendChild(button('판매', () => { sellEquipment(uid); closeSheet(); }, { cls: 'btn btn-sell' }));
    }
    content.appendChild(actions);
  });
}

/* ---------------- 도감 탭 ---------------- */
function renderCodexTab() {
  if (!state) return;
  const panel = $('panel-codex');
  panel.innerHTML = '';

  const completion = getCodexCompletion();
  const summaryBox = el('div', 'panel-box');
  summaryBox.appendChild(el('h3', 'panel-title', '도감 완성도'));
  summaryBox.appendChild(el('p', 'codex-summary-line', `주문 ${completion.spell}% · 생물 ${completion.enemy}% · 장비 ${completion.item}%`));
  panel.appendChild(summaryBox);

  const spellBox = el('div', 'panel-box');
  spellBox.appendChild(el('h3', 'panel-title', '주문 도감'));
  const spellList = el('div', 'item-list');
  Object.values(SPELLS).forEach((sp) => {
    const known = state.spells[sp.id] != null;
    const row = el('div', 'item-row' + (known ? '' : ' codex-unknown'));
    row.appendChild(el('span', 'item-name', known ? sp.name : '？？？'));
    row.appendChild(el('span', 'item-desc', known ? sp.desc : '아직 습득하지 못한 주문'));
    spellList.appendChild(row);
  });
  spellBox.appendChild(spellList);
  panel.appendChild(spellBox);

  const enemyBox = el('div', 'panel-box');
  enemyBox.appendChild(el('h3', 'panel-title', '생물 도감'));
  const enemyList = el('div', 'item-list');
  Object.values(ENEMIES).forEach((en) => {
    const seen = state.seenEnemies && state.seenEnemies[en.id];
    const row = el('div', 'item-row' + (seen ? '' : ' codex-unknown'));
    row.appendChild(el('span', 'item-name', seen ? en.name : '？？？'));
    if (seen) row.appendChild(el('span', 'item-desc', `체력 ${en.hp} · 공격 ${en.atk} · 방어 ${en.def}`));
    enemyList.appendChild(row);
  });
  enemyBox.appendChild(enemyList);
  panel.appendChild(enemyBox);

  const itemBox = el('div', 'panel-box');
  itemBox.appendChild(el('h3', 'panel-title', '장비 도감'));
  const itemList = el('div', 'item-list');
  Object.values(EQUIP_TEMPLATES).filter((t) => !t.starter).forEach((tpl) => {
    const seen = state.seenItemBases && state.seenItemBases[tpl.id];
    const row = el('div', 'item-row' + (seen ? '' : ' codex-unknown'));
    row.appendChild(el('span', 'item-name', seen ? tpl.name : '？？？'));
    if (seen) row.appendChild(el('span', 'item-desc', `${slotLabel(tpl.slot)}`));
    itemList.appendChild(row);
  });
  itemBox.appendChild(itemList);
  panel.appendChild(itemBox);

  const achBox = el('div', 'panel-box');
  achBox.appendChild(el('h3', 'panel-title', `업적 (${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length})`));
  const achList = el('div', 'item-list');
  ACHIEVEMENTS.forEach((a) => {
    const unlocked = !!state.achievements[a.id];
    const row = el('div', 'item-row' + (unlocked ? '' : ' codex-unknown'));
    row.appendChild(el('span', 'item-name', unlocked ? `🏆 ${a.name}` : '？？？'));
    row.appendChild(el('span', 'item-desc', unlocked ? a.desc : '미달성'));
    achList.appendChild(row);
  });
  achBox.appendChild(achList);
  panel.appendChild(achBox);
}
