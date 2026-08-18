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
  /* 업적·기록이 한꺼번에 터지면 토스트가 쌓여 선택지를 가린다. 최근 것만 남긴다. */
  while (container.children.length >= 3) container.firstChild.remove();
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

/* ---------------- 판정 연출 ---------------- */
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

/* ---------------- 본문 출력 (타자기) ---------------- */
function sceneTarget() { return $('scene-body'); }

function sceneEmit(text, cls) {
  if (!text) return;
  const paras = veilText(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  paras.forEach((p) => {
    state.log.push({ text: p, cls: cls || 'scene-para' });
    if (state.log.length > 400) state.log.shift();
    logQueue.push({ text: p, cls: cls || 'scene-para' });
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

  /* 시스템 표시(칩·판정·전투 로그)는 타자 없이 즉시 */
  if (speed <= 0 || entry.cls === 'log-effect-chip' || (entry.cls || '').indexOf('log-check') === 0 || (entry.cls || '').indexOf('duel-') === 0) {
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
  if (c.indexOf('duel-') === 0) return c;
  if (c.indexOf('ending-') === 0) return c;
  if (c === 'log-effect-chip') return 'log-entry log-effect-chip';
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
    if (box) box.appendChild(el('p', paraClass(entry), entry.text));
  }
  uiQueueDrained();
}

/* 타이핑이 끝나야 선택지가 나온다 (읽기 전에 누르지 않도록) */
function uiQueueDrained() {
  const box = $('scene-choices');
  if (box) box.classList.remove('hidden');
}

function uiStartEncounter(enc, isBeat) {
  const body = sceneTarget();
  if (body) body.innerHTML = '';
  const choices = $('scene-choices');
  if (choices) { choices.innerHTML = ''; choices.classList.add('hidden'); }

  const head = $('scene-chapter');
  if (head) {
    if (isBeat) {
      head.textContent = `${enc.title}`;
      head.className = 'beat-head';
      head.classList.remove('hidden');
    } else {
      head.classList.add('hidden');
    }
  }
  window.scrollTo(0, 0);
}

function uiAppendLogEntry(entry) {
  logQueue.push(entry);
  processLogQueue();
}

/* ================= 시작 화면 ================= */

let setupChoice = { houseId: null, backgroundId: null, traitId: null, alloc: {} };

function showSetupScreen() {
  $('setup-screen').classList.remove('hidden');
  $('game-shell').classList.add('hidden');

  if (hasIncompatibleSave()) {
    toast('구조가 바뀌어 이전 저장은 이어할 수 없습니다.', { cls: 'toast-warn', duration: 4000 });
    deleteSave();
  }
  $('btn-continue').classList.toggle('hidden', !hasSave());

  setupChoice = { houseId: null, backgroundId: null, traitId: null, alloc: {} };
  renderSetup();

  $('btn-continue').onclick = () => {
    const result = loadGame();
    if (result.ok) {
      startGameScreen();
      /* 저장된 지점을 그대로 다시 보여준다 */
      const enc = currentEncounter();
      if (enc) {
        uiStartEncounter(enc, state.isBeat);
        sceneEmit(resolveText(enc.text), 'scene-para');
      }
      render();
    } else {
      toast('저장된 판이 없습니다.', { cls: 'toast-warn' });
      $('btn-continue').classList.add('hidden');
    }
  };
}

function renderSetup() {
  const box = $('house-select');
  box.innerHTML = '';

  /* 「기록」 요약 — 회차를 거듭한 흔적 */
  if (ledger.runs > 0) {
    const rec = el('div', 'setup-ledger');
    rec.appendChild(el('span', '', `기록 · ${ledger.runs}번째 이야기`));
    rec.appendChild(el('span', '', `이름 조각 ${fragmentCount()}/6`));
    rec.appendChild(el('span', '', `엔딩 ${ledgerEndingCount()}/${ENDING_LIST.length}`));
    box.appendChild(rec);
  }

  /* 1. 배경 */
  box.appendChild(el('h3', 'setup-section', '어떻게 이 성에 왔는가'));
  const bgRow = el('div', 'card-grid');
  BACKGROUND_LIST.forEach((bg) => {
    const card = el('div', 'pick-card' + (setupChoice.backgroundId === bg.id ? ' selected' : ''));
    card.appendChild(el('h4', 'pick-name', bg.name));
    card.appendChild(el('p', 'pick-tag', bg.tagline));
    card.appendChild(el('p', 'pick-desc', bg.desc));
    card.appendChild(el('p', 'pick-perk', '＋ ' + bg.perk));
    card.appendChild(el('p', 'pick-cost', '− ' + bg.cost));
    card.addEventListener('click', () => { setupChoice.backgroundId = bg.id; setupChoice.alloc = {}; renderSetup(); });
    bgRow.appendChild(card);
  });
  box.appendChild(bgRow);

  /* 2. 기숙사 */
  box.appendChild(el('h3', 'setup-section', '분류 모자'));
  const houseRow = el('div', 'card-grid');
  Object.values(HOUSES).forEach((house) => {
    const card = el('div', 'pick-card' + (setupChoice.houseId === house.id ? ' selected' : ''));
    card.appendChild(el('h4', 'pick-name', house.name));
    card.appendChild(el('p', 'pick-tag', house.trait));
    card.appendChild(el('p', 'pick-desc', house.desc));
    card.addEventListener('click', () => { setupChoice.houseId = house.id; renderSetup(); });
    houseRow.appendChild(card);
  });
  box.appendChild(houseRow);

  /* 3. 특성 — 기록에 남은 상위 특성도 고를 수 있다 */
  box.appendChild(el('h3', 'setup-section', '타고난 것'));
  const traitRow = el('div', 'card-grid');
  const traitIds = STARTER_TRAITS.concat(Object.keys(ledger.traits || {}));
  traitIds.forEach((tid) => {
    const t = TRAITS[tid];
    if (!t) return;
    const card = el('div', 'pick-card small' + (setupChoice.traitId === tid ? ' selected' : ''));
    card.appendChild(el('h4', 'pick-name', t.name + (t.tier === 2 ? ' ★' : '')));
    card.appendChild(el('p', 'pick-desc', t.desc));
    card.appendChild(el('p', 'pick-perk', t.effect));
    card.addEventListener('click', () => { setupChoice.traitId = tid; renderSetup(); });
    traitRow.appendChild(card);
  });
  box.appendChild(traitRow);

  /* 4. 편입생 자유 분배 */
  const bg = BACKGROUNDS[setupChoice.backgroundId];
  const freeTotal = (bg ? bg.freePoints : 0) + ledgerStartingBonus().points;
  if (freeTotal > 0) {
    const used = Object.values(setupChoice.alloc).reduce((s, v) => s + v, 0);
    box.appendChild(el('h3', 'setup-section', `능력치 배분 (${freeTotal - used} 남음)`));
    const allocBox = el('div', 'alloc-box');
    Object.keys(STAT_META).forEach((k) => {
      const row = el('div', 'alloc-row');
      row.appendChild(el('span', 'alloc-label', STAT_META[k].label));
      row.appendChild(el('span', 'alloc-value', String(5 + (setupChoice.alloc[k] || 0))));
      row.appendChild(button('−', () => {
        if ((setupChoice.alloc[k] || 0) > 0) { setupChoice.alloc[k] -= 1; renderSetup(); }
      }, { cls: 'btn-tiny' }));
      row.appendChild(button('＋', () => {
        if (used < freeTotal) { setupChoice.alloc[k] = (setupChoice.alloc[k] || 0) + 1; renderSetup(); }
      }, { cls: 'btn-tiny' }));
      allocBox.appendChild(row);
    });
    box.appendChild(allocBox);
  }

  $('btn-start').onclick = () => {
    if (!setupChoice.backgroundId) { toast('배경을 골라주세요.', { cls: 'toast-warn' }); return; }
    if (!setupChoice.houseId) { toast('기숙사를 골라주세요.', { cls: 'toast-warn' }); return; }
    if (!setupChoice.traitId) { toast('특성을 골라주세요.', { cls: 'toast-warn' }); return; }
    state = newRun(setupChoice.houseId, setupChoice.backgroundId, setupChoice.traitId, setupChoice.alloc);
    startGameScreen();
    openingText();
  };
}

function openingText() {
  const bg = BACKGROUNDS[state.backgroundId];
  uiStartEncounter({ title: '' }, false);
  sceneEmit(
`마차에서 내리자 제일 먼저 느껴진 건 냄새였다. 젖은 돌, 이끼, 그리고 어디선가 타고 있는 장작.

성은 사진에서 본 것보다 컸다. 그리고 사진에서는 보이지 않던 것이 하나 있었다. 동쪽 벽 아래쪽, 돌의 색이 다르다. 위쪽은 오래 비를 맞아 거무스름한데 아래 세 줄은 아직 밝다. 이십오 년 전에 이 자리가 무너졌고, 다시 쌓았다는 뜻이다.

같이 온 학생들은 아무도 그쪽을 보지 않았다.

${bg.desc}`, 'scene-para');
  state.phase = 'result';
  state.pendingGain = 0;
  render();
}

function startGameScreen() {
  $('setup-screen').classList.add('hidden');
  $('game-shell').classList.remove('hidden');
  switchTab('adventure');
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
  $('panel-' + tabId).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
  render();
}

/* ================= 마스터 렌더 ================= */

function render() {
  if (!state) return;
  checkAchievements();
  renderTopbar();
  renderStage();
  renderRegisterTab();
  renderPrepareTab();
  renderRecordTab();
  if (state.mode !== 'ending') saveGame();
}

function renderTopbar() {
  /* 진행도 바 — 고정 비트 위치에 눈금을 찍어 다음 사건이 언제 올지 보이게 한다 */
  const bar = $('progress-fill');
  if (bar) bar.style.width = clamp(state.progress, 0, 100) + '%';

  const ticks = $('progress-ticks');
  if (ticks && !ticks.dataset.built) {
    BEAT_LIST.forEach((b) => {
      const t = el('span', 'progress-tick');
      t.style.left = b.threshold + '%';
      t.title = b.title;
      ticks.appendChild(t);
    });
    ticks.dataset.built = '1';
  }
  if (ticks) {
    Array.from(ticks.children).forEach((node, i) => {
      node.classList.toggle('passed', state.beatsDone[BEAT_LIST[i].id]);
    });
  }

  $('topbar-progress').textContent = `진행도 ${Math.floor(state.progress)}%`;
  $('topbar-vitals').textContent = `체력 ${state.hp}/${getMaxHp()}  ·  명부 ${heldCount()}  ·  Lv.${state.level}`;

  const warn = $('topbar-warn');
  const left = turnsUntilErosion();
  if (warn) {
    if (left !== Infinity && left <= 2) {
      warn.textContent = '⚠ 무언가 다가온다';
      warn.classList.remove('hidden');
    } else warn.classList.add('hidden');
  }

  const pts = $('topbar-points');
  if (pts) {
    pts.classList.toggle('hidden', state.pendingPoints <= 0);
    pts.textContent = `배분 가능 ${state.pendingPoints}`;
  }
}

function rateClass(rate) { return rate >= 65 ? 'rate-high' : rate >= 40 ? 'rate-mid' : 'rate-low'; }

/* ---------------- 모험 탭 ---------------- */

function renderStage() {
  const stage = $('scene-choices');
  if (!stage) return;
  stage.innerHTML = '';

  if (state.mode === 'ending') { renderEndingStage(stage); stage.classList.remove('hidden'); return; }

  if (state.phase === 'result') {
    const gain = state.pendingGain || 0;
    const b = button(gain > 0 ? `계속 ▸  (진행도 +${gain})` : '계속 ▸', continueRun, { cls: 'btn btn-primary btn-continue' });
    stage.appendChild(b);
    return;
  }

  const enc = currentEncounter();
  if (!enc) { stage.appendChild(button('시작 ▸', nextEncounter, { cls: 'btn btn-primary btn-continue' })); return; }

  /* 흐려진 이름이 있으면 모험 화면에서 바로 붙들 수 있게 한다.
   * 명부 탭 안에만 두면 플레이어가 그런 기능이 있는 줄도 모르고 이름을 잃는다. */
  renderHoldPanel(stage);

  const list = visibleChoices(enc);
  if (!list.length) { stage.appendChild(button('계속 ▸', () => finishEncounter(enc.gain || 2), { cls: 'btn btn-primary btn-continue' })); return; }
  list.forEach(({ c, i }) => stage.appendChild(choiceCard(c, i)));
}

/* 모험 화면 위쪽의 붙들기 패널 — 흐려진 이름이 있을 때만 나타난다 */
function renderHoldPanel(stage) {
  if (!state.flags.holdUnlocked) return;
  const fading = Object.keys(state.register).filter((id) => erosionOf(id) > 0 && erosionOf(id) < 3);
  if (!fading.length) return;

  fading.sort((a, b) => erosionOf(b) - erosionOf(a));
  const box = el('div', 'hold-panel');
  box.appendChild(el('div', 'hold-head', '📖 명부에서 흐려지고 있는 이름'));

  fading.forEach((id) => {
    const row = el('div', 'hold-row');
    row.appendChild(el('span', 'hold-name', veilName(id)));
    row.appendChild(el('span', 'hold-state', EROSION_LABEL[erosionOf(id)]));
    if (state.hp <= HOLD_HP_COST) {
      row.appendChild(el('span', 'hold-note', '체력이 모자라 부를 수 없다'));
    } else {
      const stat = bestHoldStat(id);
      const rate = getCheckRate(stat, holdDc(id), 0, { hold: true, about: id });
      const b = button(`소리 내어 부른다  ·  ${STAT_META[stat].label} ${rate}%  ·  체력 −${HOLD_HP_COST}`,
        () => holdName(id, stat), { cls: 'btn btn-hold' });
      row.appendChild(b);
    }
    box.appendChild(row);
  });

  box.appendChild(el('div', 'hold-foot', '부르지 않으면 이 이름은 결국 지워진다. 전부 지워지면 이야기가 그대로 끝난다.'));
  stage.appendChild(box);
}

/* 지금 가장 잘 붙들 수 있는 능력치를 골라준다 — 셋을 일일이 비교하게 하지 않는다 */
function bestHoldStat(id) {
  return ['courage', 'intelligence', 'charm']
    .sort((a, b) => getCheckRate(b, holdDc(id), 0, { hold: true, about: id })
                  - getCheckRate(a, holdDc(id), 0, { hold: true, about: id }))[0];
}

function choiceCard(c, idx) {
  const card = document.createElement('button');
  card.className = 'btn choice-card';
  card.appendChild(el('span', 'choice-label', veilText(c.label)));

  const meta = el('span', 'choice-meta');
  if (c.check) {
    const rate = getCheckRate(c.check.stat, c.check.dc, c.check.bonusPercent, c.check);
    meta.appendChild(el('span', '', STAT_META[c.check.stat].label + ' · '));
    meta.appendChild(el('span', rateClass(rate), `성공률 ${rate}%`));
  }
  if (c.combat) meta.appendChild(el('span', 'choice-combat', ' ⚔ 전투'));
  if (c.requiresStat) {
    const label = Object.keys(c.requiresStat).map((k) => `${STAT_META[k].label} ${c.requiresStat[k]}`).join(' · ');
    meta.appendChild(el('span', 'choice-gate', ` [${label}]`));
  }
  if (c.requiresItem && ITEMS[c.requiresItem]) meta.appendChild(el('span', 'choice-gate', ` [${ITEMS[c.requiresItem].name}]`));
  if (c.requiresSpell && SPELLS[c.requiresSpell]) meta.appendChild(el('span', 'choice-gate', ` [${SPELLS[c.requiresSpell].name}]`));
  if (c.requiresFn) meta.appendChild(el('span', 'choice-gate', ' [조건 충족]'));
  if (meta.childNodes.length) card.appendChild(meta);

  card.addEventListener('click', () => resolveChoice(idx));
  return card;
}

function renderEndingStage(stage) {
  const ending = ENDINGS[state.ending];
  const box = el('div', 'ending-box');
  box.appendChild(el('div', 'ending-kind', {
    death: '사망', alone: '명부가 비었다', finish: '완주', special: '특별', true: '진엔딩',
  }[ending.kind] || ''));
  box.appendChild(el('div', 'ending-stat', `진행도 ${Math.floor(state.progress)}%  ·  Lv.${state.level}  ·  이름 조각 ${fragmentCount()}/6`));
  box.appendChild(el('div', 'ending-stat', `엔딩 도감 ${ledgerEndingCount()}/${ENDING_LIST.length}`));
  stage.appendChild(box);
  stage.appendChild(button('다시 시작 ▸', () => {
    state = null;
    $('game-shell').classList.add('hidden');
    showSetupScreen();
  }, { cls: 'btn btn-primary btn-continue' }));
}

/* ---------------- 명부 탭 ---------------- */

function renderRegisterTab() {
  const panel = $('panel-register');
  if (!panel || state.activeTab !== 'register') return;
  panel.innerHTML = '';

  panel.appendChild(el('h3', 'panel-title', '명부'));
  panel.appendChild(el('p', 'panel-desc', '잊는 것은 세계가 하고, 붙드는 것은 내가 한다. 붙들기는 체력을 8 쓴다.'));

  const left = turnsUntilErosion();
  if (left !== Infinity) {
    panel.appendChild(el('p', 'erosion-timer' + (left <= 2 ? ' urgent' : ''), `다음 침식까지 ${left}턴`));
  }

  const ids = Object.keys(state.register);
  ids.sort((a, b) => erosionOf(b) - erosionOf(a));
  ids.forEach((id) => {
    const p = PEOPLE[id];
    if (!p) return;
    const e = erosionOf(id);
    const row = el('div', 'register-row erosion-' + e);
    row.appendChild(el('span', 'register-name', veilName(id)));
    row.appendChild(el('span', 'register-state', EROSION_LABEL[e]));
    if (p.note && e === 0) row.appendChild(el('span', 'register-note', p.note));

    if (canHold(id) && state.flags.holdUnlocked) {
      const acts = el('div', 'register-actions');
      ['courage', 'intelligence', 'charm'].forEach((k) => {
        const rate = getCheckRate(k, holdDc(id), 0, { hold: true, about: id });
        acts.appendChild(button(`${STAT_META[k].label}로 붙든다 ${rate}%`, () => holdName(id, k), { cls: 'btn-small' }));
      });
      row.appendChild(acts);
    } else if (e > 0 && e < 3 && !state.flags.holdUnlocked) {
      row.appendChild(el('span', 'register-note', '아직 붙드는 법을 모른다.'));
    }
    panel.appendChild(row);
  });

  /* 이름 조각 */
  panel.appendChild(el('h3', 'panel-title', `이름 조각 ${fragmentCount()}/6`));
  panel.appendChild(el('p', 'panel-desc', '조각은 판이 끝나도 「기록」에 남는다. 여섯이 모이면 부를 수 있다.'));
  NAME_FRAGMENTS.forEach((f) => {
    const got = ledgerHasFragment(f.n);
    const row = el('div', 'fragment-row' + (got ? ' got' : ''));
    row.appendChild(el('span', 'fragment-label', `${f.n}. ${f.label}`));
    row.appendChild(el('span', 'fragment-hint', got ? '확보' : f.hint));
    panel.appendChild(row);
  });
}

/* ---------------- 준비 탭 ---------------- */

function renderPrepareTab() {
  const panel = $('panel-prepare');
  if (!panel || state.activeTab !== 'prepare') return;
  panel.innerHTML = '';

  /* 능력치 */
  panel.appendChild(el('h3', 'panel-title', `${state.name} · ${HOUSES[state.houseId].name} · ${BACKGROUNDS[state.backgroundId].name}`));
  const statBox = el('div', 'stat-box');
  Object.keys(STAT_META).forEach((k) => {
    const row = el('div', 'stat-row');
    row.appendChild(el('span', 'stat-label', STAT_META[k].label));
    const gear = getEquippedTotal(k);
    row.appendChild(el('span', 'stat-value', gear ? `${state.stats[k]} (+${gear})` : String(state.stats[k])));
    if (state.pendingPoints > 0) row.appendChild(button('＋', () => allocatePoint(k), { cls: 'btn-tiny' }));
    statBox.appendChild(row);
  });
  panel.appendChild(statBox);
  panel.appendChild(el('p', 'panel-desc',
    `체력 ${state.hp}/${getMaxHp()} · 마력 ${state.mp}/${getMaxMp()} · 갈레온 ${state.gold} · 경험치 ${state.exp}/${state.expToNext}` +
    (state.pendingPoints > 0 ? ` · 배분 가능 ${state.pendingPoints}` : '')));

  const traitNames = (state.traits || []).map((t) => TRAITS[t] && TRAITS[t].name).filter(Boolean);
  if (traitNames.length) panel.appendChild(el('p', 'panel-desc', '특성 · ' + traitNames.join(' · ')));

  /* ── 주문 사슬 ── */
  panel.appendChild(el('h3', 'panel-title', `주문 사슬  ·  AP ${chainAP(state.level)}`));
  panel.appendChild(el('p', 'panel-desc', '위에서부터 조건을 검사해 AP만큼만 발동한다. 앞 주문이 바꾼 상황이 뒤 주문의 조건에 반영된다.'));

  const chain = getChain();
  chain.forEach((slot, i) => {
    const row = el('div', 'chain-row' + (i < chainAP(state.level) ? ' in-ap' : ''));
    row.appendChild(el('span', 'chain-index', String(i + 1)));

    const main = el('div', 'chain-main');
    if (slot) {
      main.appendChild(el('span', 'chain-spell', SPELLS[slot.spellId].name));
      main.appendChild(el('span', 'chain-cond', '[' + conditionLabel(slot.cond) + ']'));
      const m = state.spells[slot.spellId] || 0;
      main.appendChild(el('span', 'chain-mastery', `숙련 ${m} · ${getMasteryTier(m).label}`));
    } else {
      main.appendChild(el('span', 'chain-empty', '(비어 있음)'));
    }
    main.addEventListener('click', () => openSlotSheet(i));
    row.appendChild(main);

    const ctrl = el('div', 'chain-ctrl');
    ctrl.appendChild(button('↑', () => { moveChainSlot(i, -1); render(); }, { cls: 'btn-tiny', disabled: i === 0 }));
    ctrl.appendChild(button('↓', () => { moveChainSlot(i, 1); render(); }, { cls: 'btn-tiny', disabled: i === chain.length - 1 }));
    row.appendChild(ctrl);

    panel.appendChild(row);
  });

  /* ── 장비 ── */
  panel.appendChild(el('h3', 'panel-title', '장비'));
  ['wand', 'robe', 'accessory'].forEach((slot) => {
    const inst = getEquippedInstance(slot);
    const row = el('div', 'equip-row');
    row.appendChild(el('span', 'equip-slot', slotLabel(slot)));
    row.appendChild(el('span', 'equip-name ' + (inst ? rarityClass(inst.rarity) : ''), inst ? getItemDisplayName(inst) : '없음'));
    panel.appendChild(row);
  });

  const abil = equippedAbilities();
  if (abil.length) {
    panel.appendChild(el('p', 'panel-desc', '어빌리티'));
    abil.forEach((a) => panel.appendChild(el('p', 'ability-line', `◆ ${a.name} — ${a.desc}`)));
  }

  const bag = el('div', 'bag-box');
  state.equipment.forEach((inst) => {
    const equipped = Object.values(state.equipped).indexOf(inst.uid) >= 0;
    const b = button((equipped ? '● ' : '') + getItemDisplayName(inst), () => openItemSheet(inst.uid), { cls: 'btn-small ' + rarityClass(inst.rarity) });
    bag.appendChild(b);
  });
  panel.appendChild(bag);

  /* ── 소지품 ── */
  panel.appendChild(el('h3', 'panel-title', '소지품'));
  const items = el('div', 'bag-box');
  Object.keys(state.itemStacks).forEach((id) => {
    const it = ITEMS[id];
    if (!it) return;
    items.appendChild(button(`${it.name} ×${state.itemStacks[id]}`, () => useItemOutOfCombat(id), { cls: 'btn-small' }));
  });
  if (!items.childNodes.length) items.appendChild(el('p', 'panel-desc', '가진 것이 없다.'));
  panel.appendChild(items);
}

function openSlotSheet(idx) {
  openSheet((content) => {
    content.appendChild(el('h3', 'sheet-item-name', `${idx + 1}번 슬롯`));

    content.appendChild(el('p', 'settings-label', '주문'));
    const spellRow = el('div', 'settings-row');
    spellRow.appendChild(button('비우기', () => { setChainSlot(idx, null); closeSheet(); render(); }, { cls: 'btn-small' }));
    Object.keys(state.spells).forEach((id) => {
      const cur = getChain()[idx];
      spellRow.appendChild(button(SPELLS[id].name, () => {
        setChainSlot(idx, id, cur ? cur.cond : null);
        openSlotSheet(idx); render();
      }, { cls: 'btn-small' + (cur && cur.spellId === id ? ' btn-primary' : '') }));
    });
    content.appendChild(spellRow);

    const slot = getChain()[idx];
    if (slot) {
      const sp = SPELLS[slot.spellId];
      content.appendChild(el('p', 'settings-desc', sp.desc));

      content.appendChild(el('p', 'settings-label', '발동 조건'));
      const condRow = el('div', 'settings-row');
      CONDITION_LIST.forEach((c) => {
        condRow.appendChild(button(c.label, () => {
          setChainSlot(idx, slot.spellId, c.id);
          openSlotSheet(idx); render();
        }, { cls: 'btn-small' + (slot.cond === c.id ? ' btn-primary' : '') }));
      });
      content.appendChild(condRow);
    }

    const row = el('div', 'sheet-actions');
    row.appendChild(button('닫기', closeSheet, { cls: 'btn' }));
    content.appendChild(row);
  });
}

function openItemSheet(uid) {
  const inst = state.equipment.find((e) => e.uid === uid);
  if (!inst) return;
  openSheet((content) => {
    content.appendChild(el('h3', 'sheet-item-name ' + rarityClass(inst.rarity), getItemDisplayName(inst)));
    content.appendChild(el('p', 'settings-desc', `${RARITY_BY_ID[inst.rarity].name} · ${slotLabel(inst.slot)}`));

    if (inst.identified) {
      const bd = getItemStatBreakdown(inst);
      const line = Object.keys(bd).map((k) => `${(STAT_META[k] || {}).label || k} +${bd[k]}`).join(' · ');
      if (line) content.appendChild(el('p', 'settings-desc', line));
      inst.affixes.filter((a) => a.ability).forEach((a) => {
        content.appendChild(el('p', 'ability-line', `◆ ${ABILITIES[a.id].name} — ${ABILITIES[a.id].desc}`));
      });
    }

    const row = el('div', 'sheet-actions');
    if (!inst.identified) {
      row.appendChild(button(`감정 (지식 DC ${identifyDc(inst)})`, () => { closeSheet(); identifyInstance(uid); }, { cls: 'btn btn-primary' }));
    } else {
      row.appendChild(button('장착', () => { closeSheet(); equipInstance(uid); }, { cls: 'btn btn-primary' }));
      const cost = enhanceCost(inst.enhanceLevel);
      row.appendChild(button(`강화 (마법석 ${cost.stones} · ${cost.gold}G)`, () => { closeSheet(); enhanceInstance(uid); }, { cls: 'btn-small' }));
      row.appendChild(button('판다', () => { closeSheet(); sellEquipment(uid); }, { cls: 'btn-small' }));
    }
    row.appendChild(button('닫기', closeSheet, { cls: 'btn' }));
    content.appendChild(row);
  });
}

/* ---------------- 기록 탭 ---------------- */

function renderRecordTab() {
  const panel = $('panel-record');
  if (!panel || state.activeTab !== 'record') return;
  panel.innerHTML = '';

  panel.appendChild(el('h3', 'panel-title', `엔딩 도감  ${ledgerEndingCount()}/${ENDING_LIST.length}`));
  panel.appendChild(el('p', 'panel-desc', '판이 끝나도 기록은 남는다. 조각과 엔딩은 다음 이야기로 이어진다.'));
  ENDING_LIST.forEach((e) => {
    const got = ledgerHasEnding(e.id);
    const row = el('div', 'ending-row' + (got ? ' got' : ''));
    row.appendChild(el('span', 'ending-name', got ? e.title : '？？？'));
    row.appendChild(el('span', 'ending-hint', e.hint));
    panel.appendChild(row);
  });

  panel.appendChild(el('h3', 'panel-title', '주문'));
  Object.keys(state.spells).forEach((id) => {
    const m = state.spells[id];
    const row = el('div', 'spell-row');
    row.appendChild(el('span', 'spell-name', SPELLS[id].name));
    row.appendChild(el('span', 'spell-mastery', `${m} · ${getMasteryTier(m).label}`));
    panel.appendChild(row);
  });

  const achCount = Object.keys(state.achievements).length;
  panel.appendChild(el('h3', 'panel-title', `업적 ${achCount}/${ACHIEVEMENTS.length}`));
  ACHIEVEMENTS.forEach((a) => {
    const got = state.achievements[a.id];
    const row = el('div', 'ending-row' + (got ? ' got' : ''));
    row.appendChild(el('span', 'ending-name', got ? a.name : '？？？'));
    row.appendChild(el('span', 'ending-hint', a.desc));
    panel.appendChild(row);
  });

  panel.appendChild(el('h3', 'panel-title', '일지'));
  const logBox = el('div', 'log-box');
  state.log.slice(-60).forEach((entry) => logBox.appendChild(el('p', 'log-entry ' + entry.cls, entry.text)));
  panel.appendChild(logBox);
}
