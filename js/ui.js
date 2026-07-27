/* ===================== UI 렌더링 ===================== */

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

function barHtml(container, value, max, cls) {
  container.innerHTML = '';
  const wrap = el('div', 'bar-wrap');
  const fill = el('div', 'bar-fill ' + cls);
  fill.style.width = Math.max(0, Math.min(100, (value / max) * 100)) + '%';
  const label = el('div', 'bar-label', `${value} / ${max}`);
  wrap.appendChild(fill);
  wrap.appendChild(label);
  container.appendChild(wrap);
}

/* ---------------- 설정 화면 ---------------- */
function showSetupScreen() {
  $('setup-screen').classList.remove('hidden');
  $('game-screen').classList.add('hidden');
  $('btn-continue').classList.toggle('hidden', !hasSave());

  const houseSelect = $('house-select');
  houseSelect.innerHTML = '';
  let selected = null;
  Object.values(HOUSES).forEach((house) => {
    const card = el('div', 'house-card');
    card.appendChild(el('h3', 'house-name', house.name));
    card.appendChild(el('p', 'house-trait', house.trait));
    card.appendChild(el('p', 'house-desc', house.desc));
    card.addEventListener('click', () => {
      document.querySelectorAll('.house-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      selected = house.id;
      houseSelect.dataset.selected = house.id;
    });
    houseSelect.appendChild(card);
  });

  $('btn-start').onclick = () => {
    const name = ($('input-name').value || '').trim().slice(0, 16) || '이름 없는 마법사';
    const houseId = houseSelect.dataset.selected;
    if (!houseId) {
      alert('기숙사를 선택해주세요.');
      return;
    }
    state = newState(name, houseId);
    addLog(`${name}, 당신은 ${HOUSES[houseId].name}에 배정되었다.`, 'log-story-title');
    addLog('호그와트에서의 새로운 하루가 시작된다.', 'log-story');
    $('setup-screen').classList.add('hidden');
    $('game-screen').classList.remove('hidden');
    render();
  };

  $('btn-continue').onclick = () => {
    if (loadGame()) {
      $('setup-screen').classList.add('hidden');
      $('game-screen').classList.remove('hidden');
      addLog('--- 이어하기 ---', 'log-move');
      render();
    }
  };
}

/* ---------------- 마스터 렌더 ---------------- */
function render() {
  renderHeader();
  renderLocationBanner();
  renderLog();
  renderSidebar();
  renderTravel();
  renderActions();
}

function renderHeader() {
  $('day-counter').textContent = `${state.day}일차 | ${state.name} (${HOUSES[state.houseId].name})`;
}

function renderLocationBanner() {
  const loc = LOCATIONS[state.location];
  const banner = $('location-banner');
  banner.innerHTML = '';
  banner.appendChild(el('h2', 'loc-name', loc.name));
  banner.appendChild(el('p', 'loc-desc', loc.desc));
}

function renderLog() {
  const panel = $('log-panel');
  panel.innerHTML = '';
  state.log.forEach((entry) => {
    const p = el('p', 'log-entry ' + entry.cls, entry.text);
    panel.appendChild(p);
  });
  panel.scrollTop = panel.scrollHeight;
}

function renderSidebar() {
  const sb = $('sidebar');
  sb.innerHTML = '';

  const statBox = el('div', 'panel-box');
  statBox.appendChild(el('h3', 'panel-title', '캐릭터 정보'));

  const hpRow = el('div', 'stat-row');
  hpRow.appendChild(el('span', 'stat-label', '체력'));
  const hpBar = el('div', 'bar-container');
  hpRow.appendChild(hpBar);
  statBox.appendChild(hpRow);
  barHtml(hpBar, state.hp, state.maxHp, 'bar-hp');

  const mpRow = el('div', 'stat-row');
  mpRow.appendChild(el('span', 'stat-label', '마력'));
  const mpBar = el('div', 'bar-container');
  mpRow.appendChild(mpBar);
  statBox.appendChild(mpRow);
  barHtml(mpBar, state.mp, state.maxMp, 'bar-mp');

  const expRow = el('div', 'stat-row');
  expRow.appendChild(el('span', 'stat-label', `Lv.${state.level} 경험치`));
  const expBar = el('div', 'bar-container');
  expRow.appendChild(expBar);
  statBox.appendChild(expRow);
  barHtml(expBar, state.exp, state.expToNext, 'bar-exp');

  const alignRow = el('div', 'stat-row');
  alignRow.appendChild(el('span', 'stat-label', '성향'));
  const alignBar = el('div', 'bar-container');
  alignRow.appendChild(alignBar);
  statBox.appendChild(alignRow);
  const alignPct = ((state.alignment + 100) / 200) * 100;
  const alignWrap = el('div', 'bar-wrap');
  const alignFill = el('div', 'bar-fill bar-align');
  alignFill.style.width = alignPct + '%';
  alignWrap.appendChild(alignFill);
  alignWrap.appendChild(el('div', 'bar-label', state.alignment > 10 ? '빛' : state.alignment < -10 ? '어둠' : '중립'));
  alignBar.appendChild(alignWrap);

  const misc = el('div', 'stat-misc');
  misc.appendChild(el('p', '', `공격력 ${getAtk()} · 방어력 ${getDef()}`));
  misc.appendChild(el('p', '', `지식 ${state.intelligence} · 용기 ${state.courage} · 매력 ${state.charm}`));
  misc.appendChild(el('p', 'gold-label', `갈레온 ${state.gold} G`));
  statBox.appendChild(misc);
  sb.appendChild(statBox);

  // 주문
  const spellBox = el('div', 'panel-box');
  spellBox.appendChild(el('h3', 'panel-title', '보유 주문'));
  const spellList = el('div', 'item-list');
  state.spells.forEach((sid) => {
    const sp = SPELLS[sid];
    const row = el('div', 'item-row' + (sp.dark ? ' dark-item' : ''));
    row.appendChild(el('span', 'item-name', sp.name));
    row.appendChild(el('span', 'item-desc', sp.desc));
    spellList.appendChild(row);
  });
  spellBox.appendChild(spellList);
  sb.appendChild(spellBox);

  // 인벤토리
  const invBox = el('div', 'panel-box');
  invBox.appendChild(el('h3', 'panel-title', '소지품'));
  const invList = el('div', 'item-list');
  const entries = Object.keys(state.inventory).filter((k) => state.inventory[k] > 0);
  if (entries.length === 0) invList.appendChild(el('p', 'empty-note', '(비어 있음)'));
  entries.forEach((itemId) => {
    const item = ITEMS[itemId];
    const qty = state.inventory[itemId];
    const row = el('div', 'item-row');
    const isEquipped = state.equipped.wand === itemId || state.equipped.robe === itemId;
    row.appendChild(el('span', 'item-name', `${item.name} x${qty}${isEquipped ? ' ★' : ''}`));
    const actions = el('div', 'item-actions');
    if (item.type === 'potion' || item.type === 'book') {
      actions.appendChild(button('사용', () => {
        if (state.mode === 'combat') combatUseItem(itemId);
        else useItemOutOfCombat(itemId);
      }, { cls: 'btn-small' }));
    }
    if ((item.type === 'wand' || item.type === 'robe') && !isEquipped) {
      actions.appendChild(button(item.type === 'wand' ? '장착' : '착용', () => equipItem(itemId), { cls: 'btn-small' }));
    }
    if (item.sell && state.mode !== 'combat') {
      actions.appendChild(button('판매', () => sellItem(itemId), { cls: 'btn-small btn-sell' }));
    }
    row.appendChild(actions);
    invList.appendChild(row);
  });
  invBox.appendChild(invList);
  sb.appendChild(invBox);
}

function renderTravel() {
  const panel = $('travel-panel');
  panel.innerHTML = '';
  if (!['explore', 'shop'].includes(state.mode)) return;
  const loc = LOCATIONS[state.location];
  panel.appendChild(el('h4', 'travel-title', '이동'));
  const row = el('div', 'travel-row');
  loc.connections.forEach((cid) => {
    const target = LOCATIONS[cid];
    const locked = target.locked && !state.flags.chamber_unlocked;
    row.appendChild(button(target.name + (locked ? ' 🔒' : ''), () => travelTo(cid), { cls: 'btn-travel' }));
  });
  panel.appendChild(row);
}

function renderActions() {
  const panel = $('action-panel');
  panel.innerHTML = '';
  const loc = LOCATIONS[state.location];

  if (state.mode === 'explore') {
    if (loc.tag === 'safe') {
      panel.appendChild(button('탐험하기', explore));
      panel.appendChild(button('휴식하기 (체력/마력 회복)', rest));
    } else if (loc.tag === 'training') {
      panel.appendChild(button('수련하기', train));
    } else if (loc.tag === 'quest') {
      panel.appendChild(button('교장과 대화하기', enterHeadmasterOffice));
    } else if (loc.tag === 'chamber') {
      panel.appendChild(button('안으로 들어간다', enterChamber));
    } else {
      panel.appendChild(button('탐험하기', explore));
    }
  } else if (state.mode === 'shop') {
    const shop = SHOPS[loc.shop];
    const grid = el('div', 'shop-grid');
    shop.items.forEach((itemId) => {
      const item = ITEMS[itemId];
      const card = el('div', 'shop-item');
      card.appendChild(el('div', 'item-name', item.name));
      card.appendChild(el('div', 'item-desc', item.desc || ''));
      card.appendChild(el('div', 'item-price', `${item.price} G`));
      card.appendChild(button('구매', () => buyItem(itemId), { disabled: state.gold < item.price, cls: 'btn-small' }));
      grid.appendChild(card);
    });
    panel.appendChild(grid);
  } else if (state.mode === 'event') {
    const ev = state.pendingEvent;
    const wrap = el('div', 'choice-wrap');
    ev.choices.forEach((choice, idx) => {
      wrap.appendChild(button(choice.label, () => resolveEventChoice(idx)));
    });
    panel.appendChild(wrap);
  } else if (state.mode === 'story') {
    const ch = state.pendingChapter;
    const wrap = el('div', 'choice-wrap');
    ch.choices.forEach((choice, idx) => {
      wrap.appendChild(button(choice.label, () => resolveChapterChoice(idx)));
    });
    panel.appendChild(wrap);
  } else if (state.mode === 'combat') {
    renderCombatActions(panel);
  } else if (state.mode === 'ending') {
    const box = el('div', 'ending-box');
    box.appendChild(el('h2', 'ending-title', state.ending.title));
    box.appendChild(el('p', 'ending-text', state.ending.text));
    box.appendChild(button('새로운 이야기 시작하기', () => {
      deleteSave();
      state = null;
      $('game-screen').classList.add('hidden');
      showSetupScreen();
    }));
    panel.appendChild(box);
  }
}

function renderCombatActions(panel) {
  const c = state.combat;
  const enemy = ENEMIES[c.enemyId];

  const enemyBox = el('div', 'enemy-box');
  enemyBox.appendChild(el('h3', 'enemy-name', enemy.name + (enemy.boss ? ' (보스)' : '')));
  const enemyBar = el('div', 'bar-container');
  enemyBox.appendChild(enemyBar);
  panel.appendChild(enemyBox);
  barHtml(enemyBar, c.enemyHp, c.enemyMaxHp, 'bar-enemy');

  const tabs = el('div', 'combat-tabs');
  const spellTab = el('div', 'combat-section');
  spellTab.appendChild(el('h4', '', '주문'));
  state.spells.forEach((sid) => {
    const sp = SPELLS[sid];
    const disabled = sp.mpCost > state.mp;
    spellTab.appendChild(button(`${sp.name} (MP ${sp.mpCost})`, () => combatCastSpell(sid), { disabled, cls: 'btn-small' + (sp.dark ? ' btn-dark' : '') }));
  });
  tabs.appendChild(spellTab);

  const itemTab = el('div', 'combat-section');
  itemTab.appendChild(el('h4', '', '아이템'));
  const potions = Object.keys(state.inventory).filter((k) => ITEMS[k].type === 'potion' && state.inventory[k] > 0);
  if (potions.length === 0) itemTab.appendChild(el('p', 'empty-note', '(사용 가능한 물약 없음)'));
  potions.forEach((itemId) => {
    const item = ITEMS[itemId];
    itemTab.appendChild(button(`${item.name} x${state.inventory[itemId]}`, () => combatUseItem(itemId), { cls: 'btn-small' }));
  });
  tabs.appendChild(itemTab);

  const otherTab = el('div', 'combat-section');
  otherTab.appendChild(el('h4', '', '기타'));
  otherTab.appendChild(button('방어', combatDefend, { cls: 'btn-small' }));
  otherTab.appendChild(button('도망치기', combatFlee, { cls: 'btn-small' }));
  tabs.appendChild(otherTab);

  panel.appendChild(tabs);
}
