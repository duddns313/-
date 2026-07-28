/* ===================== 장면 엔진 (선형 구조) =====================
 * 장면 하나가 한 페이지. 본문 → 선택지 → 결과 → [계속] → 다음 장면. */

function currentScene() { return SCENES[state.sceneId] || null; }

function goToScene(id) {
  if (id === 'HUB') id = state.currentHub;
  const sc = SCENES[id];
  if (!sc) { addLog(`(장면 «${id}»을 찾을 수 없습니다)`, 'log-warn'); return; }

  state.sceneId = id;
  state.mode = 'scene';
  state.scenePhase = 'body';
  state.sceneNext = null;
  state.seenScenes[id] = true;
  if (sc.hub) state.currentHub = id;
  if (sc.costDay) advanceDay();

  (sc.registers || []).forEach((pid) => { registerPerson(pid); markSeen(pid); });
  if (sc.onEnterEffect) applyEffect(sc.onEnterEffect);
  if (sc.onEnter) sc.onEnter(state);

  uiStartScene(sc);

  /* 회상 배너 */
  if (sc.recall && state.memories[sc.recall]) {
    sceneEmit(`💭 ${sc.recallText}`, 'log-memory');
  } else if (sc.recallOptions) {
    const hit = Object.keys(sc.recallOptions).find((mid) => state.memories[mid]);
    if (hit) sceneEmit(`💭 ${sc.recallOptions[hit]}`, 'log-memory');
  }

  sceneEmit(sc.text, 'scene-para');

  if (sc.combat) {
    state.pendingCombatNext = sc.combatWinNext || sc.next || 'HUB';
    state.pendingCombatLose = sc.combatLoseNext || null;
    startCombat(sc.combat);
    return;
  }
  render();
}

/* 선택지가 지금 보여질 수 있는가 */
function choiceAvailable(ch) {
  if (ch.requiresMemory && !state.memories[ch.requiresMemory]) return false;
  if (ch.requiresFlag && !state.flags[ch.requiresFlag]) return false;
  if (ch.notFlag && state.flags[ch.notFlag]) return false;
  if (ch.requiresItem && !(state.itemStacks[ch.requiresItem] > 0)) return false;
  if (ch.requiresFn && !ch.requiresFn(state)) return false;
  return true;
}

function visibleChoices(sc) {
  return (sc.choices || []).map((c, i) => ({ c, i })).filter(({ c }) => choiceAvailable(c));
}

function resolveSceneChoice(idx) {
  const sc = currentScene();
  if (!sc || state.scenePhase !== 'body') return;
  const choice = (sc.choices || [])[idx];
  if (!choice || !choiceAvailable(choice)) return;

  if (choice.requiresGold && state.gold < choice.requiresGold) {
    addLog('갈레온이 부족하다.', 'log-warn'); render(); return;
  }
  if (choice.costDay) advanceDay();

  let next = choice.next || sc.next || 'HUB';

  if (choice.check) {
    const result = runCheck(choice.check.stat, choice.check.dc, choice.check.bonusPercent);
    const out = choice.outcomes[result.tier]
      || (result.tier === 'critical' ? choice.outcomes.success : null)
      || (result.tier === 'fumble' ? choice.outcomes.fail : null)
      || choice.outcomes.fail;
    applyEffect(out.effect);
    const bad = result.tier === 'fail' || result.tier === 'fumble';
    sceneEmit(out.text, 'scene-para result' + (bad ? ' bad' : ''));
    emitEffectChip(out.effect);
    if (choice.streakId) advanceStreak(choice, !bad);
    if (out.next) next = out.next;
    if (out.combat) {
      state.pendingCombatNext = out.combatWinNext || next;
      state.pendingCombatLose = null;
      state.scenePhase = 'result';
      state.sceneNext = next;
      startCombat(out.combat);
      return;
    }
  } else {
    applyEffect(choice.effect);
    sceneEmit(choice.resultText, 'scene-para result');
    emitEffectChip(choice.effect);
  }

  state.scenePhase = 'result';
  state.sceneNext = next;
  render();
}

function continueScene() {
  const next = state.sceneNext || (currentScene() || {}).next || 'HUB';
  goToScene(next);
}

/* ── 허브 ── */
function hubOptions() {
  const hub = currentScene();
  if (!hub || !hub.hub) return [];
  return (hub.options || []).filter((o) => {
    const sc = SCENES[o.id];
    if (!sc) return false;
    if (o.requiresFlag && !state.flags[o.requiresFlag]) return false;
    if (o.notFlag && state.flags[o.notFlag]) return false;
    if (o.requiresFn && !o.requiresFn(state)) return false;
    if (!sc.repeatable && state.seenScenes[o.id]) return false;
    return true;
  });
}

/* ── 하루 경과 ── */
function advanceDay() {
  state.day += 1;
  checkDeadlineStatus();
  advanceErosion();
}
