/* ===================== UI 렌더링 (모바일 셸) ===================== */

let logQueue = [];
let typingActive = false;
let currentTypewriter = null;

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

/* ---------------- 설정 ---------------- */
function openSettingsSheet() {
  openSheet((content) => {
    content.appendChild(el('h3', 'sheet-item-name', '설정'));

    content.appendChild(el('p', 'settings-label', '글자 속도'));
    const speedRow = el('div', 'settings-row');
    [['slow', '느리게'], ['normal', '보통'], ['fast', '빠르게'], ['off', '즉시 표시']].forEach(([val, label]) => {
      speedRow.appendChild(button(label, () => { setTypeSpeed(val); openSettingsSheet(); }, { cls: 'btn-small' + (settings.typeSpeed === val ? ' btn-primary' : '') }));
    });
    content.appendChild(speedRow);

    content.appendChild(el('p', 'settings-label', '연출 줄이기'));
    content.appendChild(el('p', 'settings-desc', '화면 흔들림·점멸 등 움직임을 최소화합니다.'));
    const motionRow = el('div', 'settings-row');
    motionRow.appendChild(button(settings.reduceMotion ? '켜짐' : '꺼짐', () => { setReduceMotion(!settings.reduceMotion); openSettingsSheet(); }, { cls: 'btn-small' + (settings.reduceMotion ? ' btn-primary' : '') }));
    content.appendChild(motionRow);

    const closeRow = el('div', 'sheet-actions');
    closeRow.appendChild(button('닫기', closeSheet, { cls: 'btn' }));
    content.appendChild(closeRow);
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

/* ---------------- 장면 페이지 출력 ---------------- */
/* 본문은 문단 단위로 한 번씩 타이핑되어 #scene-body에 쌓인다. */
function sceneTarget() { return $('scene-body'); }

function sceneEmit(text, cls) {
  if (!text) return;
  const paras = veilText(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  paras.forEach((p) => {
    state.log.push({ text: p, cls: cls || 'scene-para' });
    if (state.log.length > 400) state.log.shift();
    logQueue.push({ text: p, cls: cls || 'scene-para' });
    const full = $('log-full');
    if (full) { full.appendChild(el('p', 'log-entry ' + (cls || '')), full.scrollTop = full.scrollHeight); }
  });
  processLogQueue();
}

function processLogQueue() {
  if (typingActive) return;
  const box = sceneTarget();
  if (!box || logQueue.length === 0) { uiQueueDrained(); return; }
  const entry = logQueue.shift();
  const p = el('p', paraClass(entry));
  box.appendChild(p);
  const full = entry.text;
  const speed = getTypeSpeedMs();

  /* 시스템 표시(칩·판정)는 타자 없이 즉시 */
  if (speed <= 0 || entry.cls === 'log-effect-chip' || (entry.cls || '').indexOf('log-check') === 0) {
    p.textContent = full;
    setTimeout(processLogQueue, 0);
    return;
  }

  typingActive = true;
  let i = 0;
  const timer = setInterval(() => {
    i += 1;
    p.textContent = full.slice(0, i);
    if (i >= full.length) {
      clearInterval(timer);
      currentTypewriter = null;
      typingActive = false;
      setTimeout(processLogQueue, 120);
    }
  }, speed);
  currentTypewriter = { timer, node: p, full };
}

function paraClass(entry) {
  const c = entry.cls || '';
  if (c.indexOf('scene-para') === 0) return c;
  if (c === 'log-effect-chip') return 'log-entry log-effect-chip';
  if (c === 'log-memory') return 'scene-recall';
  return 'log-entry ' + c;
}

function skipTypewriters() {
  if (currentTypewriter) {
    clearInterval(currentTypewriter.timer);
    currentTypewriter.node.textContent = currentTypewriter.full;
    currentTypewriter = null;
    typingActive = false;
  }
  const box = sceneTarget();
  while (logQueue.length) {
    const entry = logQueue.shift();
    if (box) box.appendChild(el(paraClass(entry).indexOf('scene-para') === 0 ? 'p' : 'p', paraClass(entry), entry.text));
  }
  uiQueueDrained();
}

/* 타이핑이 끝나야 선택지가 나온다 (읽기 전에 누르지 않도록) */
function uiQueueDrained() {
  const box = $('scene-choices');
  if (box) box.classList.remove('hidden');
}

function uiStartScene(sc) {
  const body = sceneTarget();
  if (body) body.innerHTML = '';
  const choices = $('scene-choices');
  if (choices) { choices.innerHTML = ''; choices.classList.add('hidden'); }
  const chapEl = $('scene-chapter');
  if (chapEl) {
    if (sc.chapter && sc.chapter !== state.lastChapter) {
      chapEl.textContent = sc.chapter;
      chapEl.classList.remove('hidden');
      state.lastChapter = sc.chapter;
    } else {
      chapEl.classList.add('hidden');
    }
  }
  const placeEl = $('scene-place');
  if (placeEl) {
    const t = { morning: '🌅 아침', noon: '☀️ 낮', evening: '🌙 저녁' }[sc.time];
    const bits = [sc.place, t].filter(Boolean);
    placeEl.textContent = bits.join(' · ');
    placeEl.classList.toggle('hidden', !bits.length);
  }
  window.scrollTo(0, 0);
}

function uiAppendLogEntry(entry) {
  const full = $('log-full');
  if (full) {
    full.appendChild(el('p', 'log-entry ' + entry.cls, entry.text));
    full.scrollTop = full.scrollHeight;
  }
  logQueue.push(entry);
  processLogQueue();
}

function renderLogFull() {
  const full = $('log-full');
  if (!full) return;
  full.innerHTML = '';
  state.log.forEach((entry) => full.appendChild(el('p', 'log-entry ' + entry.cls, entry.text)));
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
    const name = FIXED_PLAYER_NAME;
    const houseId = houseSelect.dataset.selected;
    if (!houseId) { toast('기숙사를 선택해주세요.', { cls: 'toast-warn' }); return; }
    state = newState(name, houseId);
    startGameScreen();
    goToScene('p_arrival');
  };

  $('btn-continue').onclick = () => {
    const result = loadGame();
    if (result.ok) {
      startGameScreen();
      renderLogFull();
      goToScene(state.sceneId || 'p_arrival');
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
  checkAchievements();
  renderTopbar();
  renderStage();
  renderCharacterTab();
  renderInventoryTab();
  renderRegisterTab();
  renderCodexTab();
  if (state) saveGame();
}

function renderTopbar() {
  $('topbar-name').textContent = `${state.name} · ${HOUSES[state.houseId].name} · Lv.${state.level}`;
  $('topbar-day').textContent = dateLabel();

  const deadlineEl = $('topbar-deadline');
  if (state.deadline) {
    const remain = state.deadline.dueDay - state.day;
    deadlineEl.textContent = remain >= 0 ? `D-${remain}` : `기한 초과 +${-remain}`;
    deadlineEl.className = remain < 0 ? 'deadline-overdue' : remain <= 7 ? 'deadline-close' : '';
  } else {
    deadlineEl.textContent = '';
    deadlineEl.className = '';
  }

  const vitals = $('topbar-vitals');
  if (vitals) {
    vitals.classList.toggle('hidden', state.mode !== 'combat');
    if (state.mode === 'combat') {
      $('mini-hp-fill').style.width = clamp((state.hp / getMaxHp()) * 100, 0, 100) + '%';
      $('mini-mp-fill').style.width = clamp((state.mp / getMaxMp()) * 100, 0, 100) + '%';
    }
  }
}

const RISK_LABELS = ['안전', '주의', '위험', '매우 위험'];
function riskLabel(risk) { return RISK_LABELS[Math.min(risk || 0, RISK_LABELS.length - 1)]; }

function rateClass(rate) { return rate >= 65 ? 'rate-high' : rate >= 40 ? 'rate-mid' : 'rate-low'; }

/* ---------------- 모험 탭: 장면 ---------------- */
function renderStage() {
  const stage = $('scene-choices');
  if (!stage) return;
  stage.innerHTML = '';

  if (state.mode === 'combat') { renderCombatStage(stage); stage.classList.remove('hidden'); return; }
  if (state.mode === 'ending') { renderEndingStage(stage); stage.classList.remove('hidden'); return; }
  if (state.mode === 'shop') { renderShopStage(stage, null); stage.classList.remove('hidden'); return; }

  const sc = currentScene();
  if (!sc) return;

  if (state.scenePhase === 'result') {
    stage.appendChild(button('계속 ▸', continueScene, { cls: 'btn btn-primary btn-continue' }));
    return;
  }
  if (sc.hub) { renderHubStage(stage, sc); return; }
  if (sc.registerAction) { renderRegisterActionStage(stage); return; }

  /* 대화 — 장면을 넘기지 않고 말만 걸어보는 선택지 */
  const talks = availableTalks(sc);
  if (talks.length) {
    const tbox = el('div', 'talk-box');
    tbox.appendChild(el('div', 'talk-head', '말을 걸어본다'));
    talks.forEach(({ t, i }) => {
      const b = document.createElement('button');
      b.className = 'btn talk-card';
      b.textContent = veilText(t.label);
      b.addEventListener('click', () => doTalk(i));
      tbox.appendChild(b);
    });
    stage.appendChild(tbox);
  }

  const list = visibleChoices(sc);
  if (!list.length) {
    stage.appendChild(button('계속 ▸', continueScene, { cls: 'btn btn-primary btn-continue' }));
    return;
  }
  if (talks.length) stage.appendChild(el('div', 'talk-divider', sc.actPrompt || '그리고—'));
  list.forEach(({ c, i }) => stage.appendChild(choiceCard(c, i)));
}

function choiceCard(c, idx) {
  const card = document.createElement('button');
  card.className = 'btn choice-card';
  card.appendChild(el('span', 'choice-label', veilText(c.label)));
  if (c.check) {
    const rate = getCheckRate(c.check.stat, c.check.dc, c.check.bonusPercent);
    const meta = el('span', 'choice-meta');
    meta.appendChild(el('span', '', STAT_META[c.check.stat].label + ' · '));
    meta.appendChild(el('span', rateClass(rate), `성공률 ${rate}%`));
    if (c.check.bonusPercent) meta.appendChild(el('span', 'choice-bonus', `  💭 기억 보정 +${c.check.bonusPercent}%`));
    card.appendChild(meta);
  } else if (c.costDay) {
    card.appendChild(el('span', 'choice-meta', '하루 소모'));
  }
  card.addEventListener('click', () => resolveSceneChoice(idx));
  return card;
}

function renderHubStage(stage, sc) {
  const board = el('div', 'hub-board');
  board.appendChild(el('div', 'hub-date', `📅 ${dateLabel()}`));
  const left = daysLeft();
  if (left != null) {
    const row = el('div', 'hub-deadline' + (left < 0 ? ' deadline-overdue' : left <= 7 ? ' deadline-close' : ''));
    row.textContent = left >= 0
      ? `${state.deadline.label} — 앞으로 ${left}일`
      : `${state.deadline.label} — 기한을 ${-left}일 넘겼다`;
    board.appendChild(row);
  }
  board.appendChild(el('div', 'hub-hint',
    '▶ 표시된 일은 시간이 들지 않는다. 그 밖의 일에는 하루가 지나가고, 하루가 지날 때마다 잊힘이 조금씩 번진다.'));
  stage.appendChild(board);

  const opts = hubOptions();
  opts.forEach((o) => {
    const target = SCENES[o.id];
    const card = document.createElement('button');
    card.className = 'btn choice-card' + (o.main ? ' choice-main' : '');
    card.appendChild(el('span', 'choice-label', veilText(o.label)));
    const bits = [];
    if (o.desc) bits.push(veilText(o.desc));
    if (target && target.costDay && !o.desc) bits.push('하루 소모');
    if (bits.length) card.appendChild(el('span', 'choice-meta', bits.join(' · ')));
    card.addEventListener('click', () => goToScene(o.id));
    stage.appendChild(card);
  });
}

function renderRegisterActionStage(stage) {
  const faded = Object.keys(state.register).filter((id) => erosionOf(id) > 0 && erosionOf(id) < 3);
  const lost = Object.keys(state.register).filter((id) => erosionOf(id) >= 3);

  if (!faded.length && !lost.length) {
    stage.appendChild(el('p', 'choice-meta', '아직 흐려진 이름은 없다.'));
  }
  faded.forEach((id) => {
    const p = PEOPLE[id];
    const e = erosionOf(id);
    const row = el('div', 'hold-row');
    row.appendChild(el('div', 'hold-name', veilName(id) + `  — ${EROSION_LABEL[e]}`));
    const btns = el('div', 'hold-actions');
    [['intelligence', '기록을 대조한다'], ['charm', '남에게 물어본다'], ['courage', '버틴다']].forEach(([stat, label]) => {
      const dc = holdDifficulty(id, stat);
      const rate = getCheckRate(stat, dc);
      const b = button(`${label} (${STAT_META[stat].label} ${rate}%)`, () => holdName(id, stat), { cls: 'btn btn-small' });
      btns.appendChild(b);
    });
    row.appendChild(btns);
    if (e >= 2) row.appendChild(el('div', 'choice-meta', '하루가 소모된다'));
    else if (!canHoldFree()) row.appendChild(el('div', 'choice-meta', '오늘은 이미 한 번 붙들었다'));
    stage.appendChild(row);
  });
  lost.forEach((id) => {
    const row = el('div', 'hold-row');
    row.appendChild(el('div', 'hold-name lost', veilName(id) + '  — 잃음'));
    if (canUseNotebook()) {
      row.appendChild(button('이디스의 수첩을 펼친다', () => recoverWithNotebook(id), { cls: 'btn btn-small btn-primary' }));
    } else if (state.flags.edith_notebook) {
      row.appendChild(el('div', 'choice-meta', '수첩은 오늘 이미 썼다'));
    } else {
      row.appendChild(el('div', 'choice-meta', '되살릴 방법이 없다'));
    }
    stage.appendChild(row);
  });

  stage.appendChild(button('덮는다 ▸', () => goToScene('HUB'), { cls: 'btn btn-continue' }));
}

function renderShopStage(stage, loc) {
  const shop = SHOPS[(loc && loc.shop) || state.shopId || 'honeydukes'];
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
    if (choice.requiresMemory && !(state.memories && state.memories[choice.requiresMemory])) return;
    let label = choice.label;
    if (choice.check) {
      const rate = getCheckRate(choice.check.stat, choice.check.dc, choice.check.bonusPercent);
      const bonusNote = choice.check.bonusPercent ? ` (기억 보정 +${choice.check.bonusPercent}%)` : '';
      label += ` [${STAT_META[choice.check.stat].label} 판정 · 성공률 ${rate}%${bonusNote}]`;
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

  const titleRow = el('div', 'travel-title-row');
  titleRow.appendChild(el('h4', 'travel-title', '이동'));
  titleRow.appendChild(button('🗺️ 지도', openMinimapSheet, { cls: 'btn-tiny' }));
  row.appendChild(titleRow);

  const btnRow = el('div', 'travel-buttons');
  loc.connections.forEach((cid) => {
    const target = LOCATIONS[cid];
    const locked = target.locked && !state.flags.chamber_unlocked;
    const crossesZone = target.zone !== loc.zone;
    const free = !crossesZone || hasMarauderMap();
    const hint = getLocationHint(cid);

    const card = document.createElement('button');
    card.className = 'btn btn-travel-card';
    card.appendChild(el('span', 'travel-name', target.name + (locked ? ' 🔒' : '') + (hint ? ' ' + hint : '')));
    const costText = crossesZone ? (hasMarauderMap() ? '구역 이동 · 도둑 지도로 무료' : '구역 이동 · 시간대 1') : '같은 구역 · 무료';
    card.appendChild(el('span', 'travel-sub', `${riskLabel(target.risk)} · ${costText}`));
    card.addEventListener('click', () => travelTo(cid));
    if (!free) card.classList.add('travel-costly');
    btnRow.appendChild(card);
  });
  row.appendChild(btnRow);
}

/* ---------------- 미니맵 (구역별 목록) ---------------- */
function openMinimapSheet() {
  openSheet((content) => {
    content.appendChild(el('h3', 'sheet-item-name', '호그와트 지도'));
    if (hasMarauderMap()) content.appendChild(el('p', 'sheet-item-rarity', '🗺️ 도둑 지도 보유 중 — 구역 이동이 항상 무료다.'));

    ['castle', 'outskirts', 'deep'].forEach((zoneId) => {
      const locsInZone = Object.values(LOCATIONS).filter((l) => l.zone === zoneId);
      if (!locsInZone.length) return;
      const zoneBox = el('div', 'minimap-zone');
      zoneBox.appendChild(el('h4', 'minimap-zone-title', ZONE_LABELS[zoneId] || zoneId));
      locsInZone.forEach((l) => {
        const known = !!(state.visitedLocations && state.visitedLocations[l.id]);
        const row = el('div', 'minimap-row' + (l.id === state.location ? ' minimap-here' : ''));
        if (!known) {
          row.appendChild(el('span', 'minimap-name', '??? — 아직 가보지 않았다'));
        } else {
          const hint = getLocationHint(l.id);
          row.appendChild(el('span', 'minimap-name', (l.id === state.location ? '▶ ' : '') + l.name + (l.locked && !state.flags.chamber_unlocked ? ' 🔒' : '')));
          row.appendChild(el('span', 'minimap-tag', `${riskLabel(l.risk)}${hint ? ' · ' + hint : ''}`));
        }
        zoneBox.appendChild(row);
      });
      content.appendChild(zoneBox);
    });

    const closeRow = el('div', 'sheet-actions');
    closeRow.appendChild(button('닫기', closeSheet, { cls: 'btn' }));
    content.appendChild(closeRow);
  });
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

  if (state.deadline) {
    const remain = state.deadline.dueDay - state.day;
    const dBox = el('div', 'panel-box');
    dBox.appendChild(el('h3', 'panel-title', '마감'));
    dBox.appendChild(el('p', remain < 0 ? 'deadline-overdue' : remain <= 5 ? 'deadline-close' : 'deadline-note',
      `${state.deadline.label} — ${remain >= 0 ? `D-${remain}` : `기한 초과 (+${-remain}일)`}`));
    panel.appendChild(dBox);
  }

  const memoryIds = Object.keys(state.memories || {}).filter((id) => state.memories[id] && MEMORIES[id]);
  if (memoryIds.length) {
    const mBox = el('div', 'panel-box');
    mBox.appendChild(el('h3', 'panel-title', '💭 기억'));
    memoryIds.forEach((id) => {
      const row = el('div', 'memory-row');
      row.appendChild(el('div', 'memory-label', MEMORIES[id].label));
      row.appendChild(el('div', 'memory-desc', MEMORIES[id].desc));
      mBox.appendChild(row);
    });
    panel.appendChild(mBox);
  }

  if (state.patronusForm) {
    const pBox = el('div', 'panel-box');
    pBox.appendChild(el('h3', 'panel-title', '패트로누스'));
    pBox.appendChild(el('p', 'memory-label', `✨ ${state.patronusForm}`));
    panel.appendChild(pBox);
  }

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

/* ---------------- 명부 탭 ---------------- */
function renderRegisterTab() {
  const panel = $('panel-register');
  if (!panel || !state) return;
  panel.innerHTML = '';

  const ids = Object.keys(state.register);
  const people = ids.filter((id) => PEOPLE[id] && !PEOPLE[id].memorial);
  const memorial = ids.filter((id) => PEOPLE[id] && PEOPLE[id].memorial);

  const box = el('div', 'panel-box');
  box.appendChild(el('h3', 'panel-title', '📖 명부'));
  if (!ids.length) box.appendChild(el('p', 'choice-meta', '아직 적어둔 이름이 없다.'));
  people.forEach((id) => box.appendChild(registerRow(id)));
  panel.appendChild(box);

  if (memorial.length) {
    const mbox = el('div', 'panel-box');
    mbox.appendChild(el('h3', 'panel-title', '전사자 명부 · 기념비'));
    memorial.forEach((id) => mbox.appendChild(registerRow(id)));
    panel.appendChild(mbox);
  }

  const sum = el('div', 'panel-box');
  sum.appendChild(el('p', 'register-count', `붙들고 있는 이름  ${heldCount()} / ${ids.length}`));
  panel.appendChild(sum);

  const frags = Object.keys(state.fragments || {});
  if (frags.length) {
    const fbox = el('div', 'panel-box');
    fbox.appendChild(el('h3', 'panel-title', '✨ 기억 조각'));
    frags.forEach((f) => fbox.appendChild(el('p', 'fragment-row', state.fragments[f])));
    panel.appendChild(fbox);
  }
}

function registerRow(id) {
  const p = PEOPLE[id];
  const e = erosionOf(id);
  const row = el('div', 'register-row erosion-' + e);
  const mark = e === 0 ? '✓' : e >= 3 ? '✗' : '⚠';
  row.appendChild(el('span', 'register-mark', mark));
  const nameEl = el('span', 'register-name', veilName(id));
  if (e > 0) nameEl.setAttribute('aria-label', '지워진 이름');
  row.appendChild(nameEl);
  const meta = [];
  if (p.houseId && HOUSES[p.houseId] && e < 2) meta.push(HOUSES[p.houseId].name);
  if (e > 0) meta.push(EROSION_LABEL[e]);
  row.appendChild(el('span', 'register-meta', meta.join(' · ')));
  return row;
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
