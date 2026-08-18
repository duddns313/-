/* ===================== 명부 · 침식 · 붙들기 =====================
 * 잊는 것은 게임이 하고, 붙드는 것은 플레이어가 한다.
 *
 * 명부는 이 게임의 정신력이다. 여기가 비면 판이 끝난다.
 * 침식의 시계는 날짜가 아니라 진행도다 (systems/progress.js의 tickErosion). */

const EROSION_LABEL = ['온전', '흐려짐', '지워짐', '잃음'];

function registerPerson(id) {
  if (!PEOPLE[id]) return;
  if (state.register[id]) return;
  const p = PEOPLE[id];
  state.register[id] = {
    erosion: p.startErosion || 0,
    /* 기록에 남은 이름은 시작부터 한 단계 버틴다 — 회차를 넘는 유일한 이득 */
    resist: ledgerErosionResist(id),
  };
  if (p.erodible && !p.startErosion && typeof toast === 'function') {
    toast(`📖 명부에 «${p.name}»${josa(p.name, '을', '를')} 적어두었다.`);
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
  /* 라비니아만은 침식이 아니라 「기록」의 조각 수가 표시를 결정한다 */
  if (id === 'lavinia') return laviniaDisplayName();
  const e = erosionOf(id);
  if (e <= 0) return p.name;
  if (e === 1) return p.given + '▓'.repeat(Math.max(1, (p.surname || '').length));
  return '▓'.repeat(Math.max(2, p.name.replace(/[\s-]/g, '').length));
}

/* 본문의 {{id}} 자리표시자를 치환한다 — 이미 쓰인 문장에도 침식이 소급된다 */
function veilText(text) {
  if (!text) return '';
  return String(text).replace(/\{\{(\w+)\}\}/g, (m, id) => veilName(id));
}

function heldNames() {
  return Object.keys(state.register).filter((id) => {
    const p = PEOPLE[id];
    return p && p.erodible && erosionOf(id) === 0;
  });
}

function heldCount() { return heldNames().length; }

/* ── 침식 진행 (progress.js의 tickErosion이 호출한다) ── */
function advanceErosion() {
  if (state.flags.erosionPaused) return;
  const target = fadingCandidate();
  if (!target) return;
  bumpErosion(target);
}

function bumpErosion(id) {
  const r = state.register[id];
  if (!r) return;
  /* 기록이 준 저항을 먼저 태운다 */
  if (r.resist > 0) {
    r.resist -= 1;
    addLog(`«${PEOPLE[id].name}» 위로 무언가 스쳤지만, 적어둔 것이 버텨주었다.`, 'log-result');
    return;
  }
  const before = r.erosion;
  r.erosion = Math.min(3, r.erosion + 1);
  if (r.erosion === before) return;
  const p = PEOPLE[id];
  if (r.erosion === 1) addLog(`명부의 «${p.name}» 옆이 조금 흐려졌다.`, 'log-warn');
  else if (r.erosion === 2) addLog('명부에서 이름 하나가 더 지워졌다. 누구였는지 떠오르지 않는다.', 'log-warn');
  else loseName();
}

/* 이름 하나를 통째로 잃으면 영운 자신도 그만큼 얇아진다.
 *
 * 이게 없으면 침식을 무시하는 것이 최적 전략이 된다 — 시뮬레이션에서
 * 붙들기를 안 한 판의 사망률이 7.5%, 한 판이 46%였다. 붙들기가 순손실이면
 * 3자원 저글링이 성립하지 않는다. 이름을 놓는 데도 값이 있어야 한다. */
function loseName() {
  addLog('명부의 한 줄이 통째로 비었다.', 'log-warn');
  state.maxHp = Math.max(20, state.maxHp - NAME_LOSS_HP);
  state.hp = Math.min(state.hp, getMaxHp());
  addLog('무언가 같이 빠져나갔다. 몸이 조금 가벼워졌고, 그게 좋은 뜻은 아니었다.', 'log-warn');
}

const NAME_LOSS_HP = 12;

function markSeen(id) {
  if (!state.register[id]) return;
  state.lastSeen[id] = state.turn;
}

/* ── 붙들기 ──
 * 체력이 유일한 제한이다. 이름을 지키면 전투에서 죽고, 체력을 아끼면 이름을 잃는다.
 * 그 저울질이 이 게임의 중심이다. */

const HOLD_HP_COST = 4;

/* 붙들기는 침식에 대한 '의도된 반격'이다. 초안(8 + 단계×4)은 2단계에서 DC 16이라
 * 성공률이 27%밖에 안 됐고, 대가만 치르고 실패하는 일이 반복돼
 * "붙들지 않는 쪽"이 최적 전략이 됐다. DC 표(§4-1) 안쪽으로 끌어내린다. */
function holdDc(id) {
  return erosionOf(id) === 1 ? 4 : 8;
}

function canHold(id) {
  const e = erosionOf(id);
  return e > 0 && e < 3 && state.hp > HOLD_HP_COST;
}

function holdName(id, statKey) {
  if (!canHold(id)) return;
  statKey = statKey || 'courage';

  /* 상위 특성 「놓지 않는 손」 — 판당 1회는 대가 없이 */
  const freeUse = hasTrait('tenacious2') && !state.flags.unyieldingUsed;
  if (freeUse) {
    state.flags.unyieldingUsed = true;
    state.register[id].erosion = 0;
    addLog(`«${PEOPLE[id].name}». 놓지 않았다. 애초에 놓는 법을 배운 적이 없다.`, 'log-win');
    render();
    return;
  }

  state.hp = Math.max(1, state.hp - HOLD_HP_COST);
  const result = runCheck(statKey, holdDc(id), 0, { hold: true, about: id });
  const p = PEOPLE[id];

  if (result.tier === 'critical' || result.tier === 'success') {
    state.register[id].erosion = 0;
    state.statsTrack.holds = (state.statsTrack.holds || 0) + 1;
    gainExp(25);
    addLog(`«${p.name}». 이름이 다시 또렷해졌다.`, 'log-win');
  } else {
    addLog('붙잡으려 했지만 손가락 사이로 빠져나갔다.', 'log-warn');
    if (result.tier === 'fumble') {
      bumpErosion(id);
      addLog('오히려 더 멀어졌다.', 'log-warn');
    }
  }
  if (checkRunEnd()) return;
  render();
}
