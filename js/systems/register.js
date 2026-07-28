/* ===================== 명부 · 침식 · 붙들기 =====================
 * 잊는 것은 게임이 하고, 붙드는 것은 플레이어가 한다. */

const EROSION_LABEL = ['온전', '흐려짐', '지워짐', '잃음'];

function registerPerson(id) {
  if (!PEOPLE[id]) return;
  if (state.register[id]) return;
  const p = PEOPLE[id];
  state.register[id] = { erosion: p.startErosion || 0 };
  /* 동료처럼 앞으로 잃을 수 있는 이름만 알린다. 전사자 명단을 한꺼번에
   * 등재할 때 토스트가 본문을 가리지 않도록. */
  if (p.erodible && !p.startErosion && typeof toast === 'function') {
    toast(`📖 명부에 «${p.name}»을(를) 적어두었다.`);
  }
}

function erosionOf(id) {
  const r = state.register[id];
  return r ? r.erosion : 0;
}

/* 침식 단계에 따라 이름을 가린다 — 이것이 "잊힘"의 실제 표현이다 */
function veilName(id) {
  const p = PEOPLE[id];
  if (!p) return '???';
  const e = erosionOf(id);
  if (e <= 0) return p.name;
  if (e === 1) return p.given + '▓'.repeat(Math.max(1, (p.surname || '').length));
  return '▓'.repeat(Math.max(2, p.name.replace(/[\s-]/g, '').length));
}

/* 본문의 {{id}} 자리표시자를 치환한다 */
function veilText(text) {
  if (!text) return '';
  return String(text).replace(/\{\{(\w+)\}\}/g, (m, id) => veilName(id));
}

function heldNames() {
  return Object.keys(state.register).filter((id) => erosionOf(id) === 0);
}

function heldCount() { return heldNames().length; }

/* 하루가 지날 때마다 잔영이 하나를 갉아먹는다 */
function advanceErosion() {
  if (state.flags.erosionPaused) return;
  /* 이야기가 시작되기 전에는 잠잠하다. 시작된 뒤에도 사흘에 한 번씩만 갉아먹는다. */
  if (!state.flags.ch1_started) return;
  if (state.day % 3 !== 0) return;

  /* 플롯이 지정한 대상이 있으면 그것부터 */
  const forced = state.flags.fadingTarget;
  if (forced && erosionOf(forced) < 3) {
    bumpErosion(forced);
    return;
  }

  /* 그 외에는 최근에 만나지 않은 인물부터 */
  const candidates = Object.keys(state.register).filter((id) => {
    const p = PEOPLE[id];
    return p && p.erodible && erosionOf(id) < 3;
  });
  if (!candidates.length) return;
  candidates.sort((a, b) => (state.lastSeen[a] || 0) - (state.lastSeen[b] || 0));
  bumpErosion(candidates[0]);
}

function bumpErosion(id) {
  const r = state.register[id];
  if (!r) return;
  const before = r.erosion;
  r.erosion = Math.min(3, r.erosion + 1);
  if (r.erosion === before) return;
  const p = PEOPLE[id];
  if (r.erosion === 1) addLog(`명부의 «${p.name}» 옆이 조금 흐려졌다.`, 'log-warn');
  else if (r.erosion === 2) addLog('명부에서 이름 하나가 더 지워졌다. 누구였는지 떠오르지 않는다.', 'log-warn');
  else addLog('명부의 한 줄이 통째로 비었다.', 'log-warn');
}

function markSeen(id) {
  if (!state.register[id]) return;
  state.lastSeen[id] = state.day;
}

/* ── 붙들기 ── */
function canHoldFree() { return state.holdUsedDay !== state.day; }

function holdDifficulty(id, statKey) {
  const e = erosionOf(id);
  if (e === 1) return 6;
  if (e === 2) return statKey === 'charm' ? 8 : 9;
  return 99;
}

function holdName(id, statKey) {
  const e = erosionOf(id);
  if (e <= 0 || e >= 3) return;
  const costsDay = e >= 2;
  if (!costsDay && !canHoldFree()) {
    addLog('오늘은 이미 한 번 붙들었다. 내일 다시 해보자.', 'log-warn');
    render();
    return;
  }
  if (costsDay) advanceDay();
  else state.holdUsedDay = state.day;

  const dc = holdDifficulty(id, statKey);
  const result = runCheck(statKey, dc);
  const p = PEOPLE[id];
  if (result.tier === 'critical' || result.tier === 'success') {
    state.register[id].erosion = 0;
    addLog(`«${p.name}». 이름이 다시 또렷해졌다.`, 'log-win');
  } else {
    addLog('붙잡으려 했지만 손가락 사이로 빠져나갔다.', 'log-warn');
    if (result.tier === 'fumble') state.hp = clamp(state.hp - 4, 1, getMaxHp());
  }
  render();
}

/* ── 되찾기: 이디스의 수첩 (3단계에서 유일한 수단) ── */
function canUseNotebook() {
  return !!state.flags.edith_notebook && state.notebookUsedDay !== state.day;
}

function recoverWithNotebook(id) {
  if (!canUseNotebook()) return;
  if (erosionOf(id) < 3) return;
  state.notebookUsedDay = state.day;
  state.register[id].erosion = 1;
  const p = PEOPLE[id];
  addLog(`수첩을 펼쳤다. 이디스의 글씨로 «${p.name}»이라고 적혀 있다. 소리 내어 읽었다.`, 'log-win');
  render();
}

/* ── 기억 조각 ── */
function addFragment(id, label) {
  state.fragments = state.fragments || {};
  if (state.fragments[id]) return;
  state.fragments[id] = label;
  toast(`✨ 기억 조각 — ${label}`);
}
