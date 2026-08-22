/* ===================== 진행도 · 스케줄러 · 추첨 =====================
 *
 * 이 게임의 축은 진행도 게이지 하나다.
 * 랜덤 인카운터가 게이지를 밀어올리고, 게이지가 문턱을 넘으면 스토리가 끼어든다.
 * "큰 스토리 라인"과 "랜덤 인카운트"는 별개 시스템이 아니라 같은 축이다. */

/* 모든 인카운터를 한 곳에 모은다. 각 풀 파일은 자기 상수만 정의하고 여기서 합친다
 * (스크립트 로드 순서에 덜 민감하다) */
const ALL_ENCOUNTERS = Object.assign(
  {},
  typeof ENCOUNTERS_COMMON !== 'undefined' ? ENCOUNTERS_COMMON : {},
  typeof ENCOUNTERS_SEARCH !== 'undefined' ? ENCOUNTERS_SEARCH : {},
  typeof ENCOUNTERS_COMBAT !== 'undefined' ? ENCOUNTERS_COMBAT : {},
  typeof ENCOUNTERS_EERIE !== 'undefined' ? ENCOUNTERS_EERIE : {},
  typeof ENCOUNTERS_DEEP !== 'undefined' ? ENCOUNTERS_DEEP : {},
  typeof ENCOUNTERS_SPECIAL !== 'undefined' ? ENCOUNTERS_SPECIAL : {}
);

/* 진행도 구간별 풀 비중 (ADVENTURE_PLAN §3-2) */
const POOL_WEIGHTS = [
  { max: 25, common: 45, search: 35, combat: 15, eerie: 5 },
  { max: 50, common: 30, search: 35, combat: 25, eerie: 10 },
  { max: 75, common: 15, search: 30, combat: 35, eerie: 20 },
  { max: 101, common: 5, search: 25, combat: 40, eerie: 30 },
];

const RECENT_MEMORY = 8;   /* 최근 이만큼은 다시 뽑지 않는다 */
const CLASS_INTERVAL = 5;   /* 이만큼 지나면 다음은 반드시 수업 */
const COMBAT_INTERVAL = 7;  /* 이만큼 지나면 다음은 반드시 전투 — 안 그러면 몬스터를 못 본다 */

function poolWeights() {
  return POOL_WEIGHTS.find((b) => state.progress < b.max) || POOL_WEIGHTS[POOL_WEIGHTS.length - 1];
}

/* ---------------- 진행도 ---------------- */

function advanceProgress(amount) {
  if (!amount) return;
  state.progress = clamp(state.progress + amount, 0, 100);
  state.turn += 1;
  tickErosion();
}

/* ---------------- 침식 (진행도 연동) ----------------
 * 기존은 날짜(day % 6)에 걸려 있었다. 이제 진행도가 시계다. */

/* 주기는 시뮬레이션으로 맞췄다. 한 판이 45턴뿐이라 계획서의 초안(12/9/6/4)으로는
 * 판당 5.6회밖에 갉아먹지 못해 명부 전멸이 구조적으로 불가능했다. */
function erosionPeriod() {
  const p = state.progress;
  if (p < 20) return Infinity;   /* 도입부는 잠잠하다 */
  let base;
  if (p < 40) base = 8;
  else if (p < 60) base = 5;
  else if (p < 80) base = 3;
  else base = 2;
  const shift = (BACKGROUNDS[state.backgroundId] || {}).erosionShift || 0;
  return Math.max(2, base + shift);
}

function turnsUntilErosion() {
  const period = erosionPeriod();
  if (period === Infinity) return Infinity;
  return Math.max(0, period - state.sinceErosion);
}

function tickErosion() {
  const period = erosionPeriod();
  if (period === Infinity) { state.sinceErosion = 0; return; }
  state.sinceErosion += 1;
  if (state.sinceErosion >= period) {
    state.sinceErosion = 0;
    advanceErosion();
  }
}

/* 손 쓸 기회 없이 이름을 잃는 일이 없도록, 침식 2턴 전에 경보를 띄운다 */
function shouldWarnErosion() {
  if (state.warnedAt === state.turn) return false;
  const left = turnsUntilErosion();
  return left === 2 && fadingCandidate() != null;
}

/* 다음에 갉아먹힐 이름 — 경보와 붙들기 화면이 같은 대상을 가리켜야 한다 */
function fadingCandidate() {
  if (state.flags.fadingTarget && erosionOf(state.flags.fadingTarget) < 3) return state.flags.fadingTarget;
  const cands = Object.keys(state.register).filter((id) => {
    const p = PEOPLE[id];
    return p && p.erodible && erosionOf(id) < 3;
  });
  if (!cands.length) return null;
  cands.sort((a, b) => (state.lastSeen[a] || 0) - (state.lastSeen[b] || 0));
  return cands[0];
}

/* ---------------- 고정 비트 ---------------- */

function pendingBeat() {
  return BEAT_LIST.find((b) => !state.beatsDone[b.id] && state.progress >= b.threshold) || null;
}

/* ---------------- 추첨 ---------------- */

function encounterAvailable(enc) {
  if (!enc) return false;
  if (!enc.repeatable && state.seenEncounters[enc.id]) return false;
  if (state.recent.indexOf(enc.id) >= 0) return false;
  if (enc.progress) {
    const [lo, hi] = enc.progress;
    if (state.progress < lo || state.progress > hi) return false;
  }
  if (enc.backgrounds && enc.backgrounds.indexOf(state.backgroundId) < 0) return false;
  if (enc.requiresFlag && !state.flags[enc.requiresFlag]) return false;
  if (enc.notFlag && state.flags[enc.notFlag]) return false;
  if (enc.requiresTrait && !hasTrait(enc.requiresTrait)) return false;
  if (enc.requiresFn && !enc.requiresFn(state)) return false;
  return true;
}

function drawEncounter() {
  const weights = poolWeights();
  const candidates = Object.values(ALL_ENCOUNTERS).filter((e) => !e.special && encounterAvailable(e));

  if (!candidates.length) {
    /* 풀 고갈 — 반복 가능한 것으로 폴백한다. 그것도 없으면 최근 이력을 비운다. */
    state.recent = [];
    const fallback = Object.values(ALL_ENCOUNTERS).filter((e) => !e.special && e.repeatable && encounterAvailable(e));
    if (!fallback.length) return null;
    return weightedPick(fallback, weights);
  }
  return weightedPick(candidates, weights);
}

function weightedPick(list, weights) {
  let total = 0;
  const rolled = list.map((e) => {
    const poolMult = (weights[e.pool] != null ? weights[e.pool] : 10) / 10;
    const w = Math.max(0.1, (e.weight || 10) * poolMult);
    total += w;
    return { e, w };
  });
  let r = Math.random() * total;
  for (const item of rolled) {
    r -= item.w;
    if (r <= 0) return item.e;
  }
  return rolled[rolled.length - 1].e;
}

/* ---------------- 스케줄러 ⭐ ----------------
 * 우선순위대로 검사한다. 이 순서가 "스토리 라인 + 랜덤"의 실제 구현이다. */

function nextEncounter() {
  if (state.mode === 'ending') return;

  /* 1. 고정 스토리 비트가 문턱을 넘었는가 (최우선) */
  const beat = pendingBeat();
  if (beat) { presentBeat(beat); return; }

  /* 2. 예약된 체인 */
  if (state.pendingChain) {
    const id = state.pendingChain;
    state.pendingChain = null;
    if (ALL_ENCOUNTERS[id]) { presentEncounter(ALL_ENCOUNTERS[id]); return; }
  }

  /* 3. 시간표 — 인카운터 풀이 커질수록 수업이 희석되어 주문 계통이 자라지 않는다.
   *    가중치로 버티면 콘텐츠를 추가할 때마다 다시 깨지므로 여기서 보장한다. */
  if (state.sinceClass >= CLASS_INTERVAL) {
    const cls = Object.values(ALL_ENCOUNTERS).filter((e) => e.kind === 'class' && encounterAvailable(e));
    if (cls.length) { presentEncounter(cls[randInt(0, cls.length - 1)]); return; }
  }

  /* 4. 전투 — 전리품과 몬스터 도감이 전투에만 달려 있는데, 풀이 커지면서
   *    한 판에 전투가 한두 번밖에 안 잡혔다. 수업과 같은 방식으로 주기를 보장한다. */
  if (state.sinceCombat >= COMBAT_INTERVAL) {
    const fights = Object.values(ALL_ENCOUNTERS).filter((e) => e.pool === 'combat' && encounterAvailable(e));
    if (fights.length) { presentEncounter(fights[randInt(0, fights.length - 1)]); return; }
  }

  /* 5. 침식 경보 */
  if (shouldWarnErosion() && ALL_ENCOUNTERS.warn_fading) {
    state.warnedAt = state.turn;
    presentEncounter(ALL_ENCOUNTERS.warn_fading);
    return;
  }

  /* 6. 가중 랜덤 */
  const enc = drawEncounter();
  if (!enc) { addLog('(더 이상 남은 인카운터가 없습니다)', 'log-warn'); render(); return; }
  presentEncounter(enc);
}

/* ---------------- 제시 ---------------- */

function presentEncounter(enc) {
  state.encounterId = enc.id;
  state.isBeat = false;
  state.phase = 'body';
  state.seenEncounters[enc.id] = true;
  state.recent.push(enc.id);
  while (state.recent.length > RECENT_MEMORY) state.recent.shift();

  state.sinceClass = enc.kind === 'class' ? 0 : (state.sinceClass || 0) + 1;
  state.sinceCombat = enc.pool === 'combat' ? 0 : (state.sinceCombat || 0) + 1;
  state.stageIndex = 0;
  /* 에피소드 안에서만 사는 기억. 앞 단계에서 무엇을 했는지가
   * 뒤 단계의 본문과 선택지를 바꾼다 — 이게 없으면 여러 단계여도
   * 서로 무관한 장면 몇 개를 이어 붙인 것에 지나지 않는다. */
  state.episode = {};

  (enc.registers || []).forEach((pid) => { registerPerson(pid); markSeen(pid); });
  if (enc.onEnter) enc.onEnter(state);

  uiStartEncounter(enc);
  sceneEmit(resolveText(enc.text), 'scene-para');
  render();
}

function presentBeat(beat) {
  state.beatsDone[beat.id] = true;
  state.encounterId = beat.id;
  state.isBeat = true;
  state.phase = 'body';

  const v = beat.variants[state.backgroundId] || beat.variants.transfer;
  state.beatVariant = v;

  (beat.registers || []).forEach((pid) => { registerPerson(pid); markSeen(pid); });
  if (beat.onEnter) beat.onEnter(state);

  uiStartEncounter(beat, true);
  sceneEmit(resolveText(v.text), 'scene-para');
  render();
}

/* 현재 제시 중인 것 (인카운터든 비트든) ──
 * stages를 가진 인카운터는 지금 단계의 본문·선택지를 대신 돌려준다. */
function currentEncounter() {
  if (state.isBeat) {
    const beat = BEATS[state.encounterId];
    if (!beat) return null;
    const v = beat.variants[state.backgroundId] || beat.variants.transfer;
    return { ...beat, text: v.text, choices: v.choices || beat.choices, afterText: v.afterText };
  }
  const enc = ALL_ENCOUNTERS[state.encounterId];
  if (!enc) return null;
  if (!enc.stages) return enc;
  const st = enc.stages[Math.min(state.stageIndex || 0, enc.stages.length - 1)];
  return {
    ...enc,
    text: st.text,
    choices: st.choices,
    afterText: st.afterText,
    gain: st.gain != null ? st.gain : enc.gain,
  };
}

/* 다음 단계로 들어간다 — 같은 인카운터 안에서 이어진다 */
function presentStage() {
  state.phase = 'body';
  const enc = currentEncounter();
  if (!enc) { nextEncounter(); return; }
  uiStartEncounter(enc);
  sceneEmit(resolveText(enc.text), 'scene-para');
  render();
}

/* 본문의 함수형 텍스트 지원 — 상태에 따라 문장이 달라져야 할 때 */
function resolveText(t) {
  return typeof t === 'function' ? t(state) : t;
}

/* ---------------- 선택지 ---------------- */

function choiceAvailable(ch) {
  if (ch.requiresFlag && !state.flags[ch.requiresFlag]) return false;
  if (ch.notFlag && state.flags[ch.notFlag]) return false;
  if (ch.requiresMark && !(state.episode || {})[ch.requiresMark]) return false;
  if (ch.notMark && (state.episode || {})[ch.notMark]) return false;
  if (ch.requiresItem && !(state.itemStacks[ch.requiresItem] > 0)) return false;
  if (ch.requiresTrait && !hasTrait(ch.requiresTrait)) return false;
  if (ch.requiresSpell && state.spells[ch.requiresSpell] == null) return false;
  if (ch.requiresAbility && !hasAbility(ch.requiresAbility)) return false;
  if (ch.requiresFragment && !ledgerHasFragment(ch.requiresFragment)) return false;
  if (ch.requiresBackground && state.backgroundId !== ch.requiresBackground) return false;
  if (ch.requiresStat) {
    /* 「눈썰미」는 문턱을 2 낮춘다 — 남들이 지나치는 이음매가 눈에 걸린다 */
    const relief = hasTrait('keenEye') ? 2 : 0;
    const ok = Object.keys(ch.requiresStat).every((k) => getStatValue(k) >= ch.requiresStat[k] - relief);
    if (!ok) return false;
  }
  if (ch.requiresFn && !ch.requiresFn(state)) return false;
  return true;
}

function visibleChoices(enc) {
  return (enc.choices || []).map((c, i) => ({ c, i })).filter(({ c }) => choiceAvailable(c));
}

function resolveChoice(idx) {
  const enc = currentEncounter();
  if (!enc || state.phase !== 'body') return;
  const choice = (enc.choices || [])[idx];
  if (!choice || !choiceAvailable(choice)) return;

  if (choice.requiresGold && state.gold < choice.requiresGold) {
    addLog('갈레온이 부족하다.', 'log-warn'); render(); return;
  }

  let gain = choice.gain != null ? choice.gain : (enc.gain != null ? enc.gain : 2);

  if (choice.check) {
    const result = runCheck(choice.check.stat, choice.check.dc, choice.check.bonusPercent, choice.check);
    const out = choice.outcomes[result.tier]
      || (result.tier === 'critical' ? choice.outcomes.success : null)
      || (result.tier === 'fumble' ? choice.outcomes.fail : null)
      || choice.outcomes.fail;

    /* 경험치는 판정 성공으로만 얻는다 (진행도와 분리) */
    const exp = checkExpReward(choice.check.dc, result.tier);
    if (exp) gainExp(exp);

    applyEffect(out.effect);
    const bad = result.tier === 'fail' || result.tier === 'fumble';
    sceneEmit(resolveText(out.text), 'scene-para result' + (bad ? ' bad' : ''));
    emitEffectChip(out.effect, exp);
    if (out.chain) state.pendingChain = out.chain;
    if (out.deepen) state.pendingDeepen = true;
    if (out.gain != null) gain = out.gain;
    if (out.combat) { startDuel(out.combat, gain); return; }
    if (out.ending) { triggerEnding(out.ending); return; }
  } else {
    applyEffect(choice.effect);
    sceneEmit(resolveText(choice.resultText), 'scene-para result');
    emitEffectChip(choice.effect);
    if (choice.chain) state.pendingChain = choice.chain;
    if (choice.deepen) state.pendingDeepen = true;
    if (choice.combat) { startDuel(choice.combat, gain); return; }
    if (choice.ending) { triggerEnding(choice.ending); return; }
  }

  if (enc.afterText) sceneEmit(resolveText(enc.afterText), 'scene-para');

  finishEncounter(gain);
}

/* 선택 결과까지 보여준 뒤 [계속] 버튼을 띄우는 상태로 넘어간다 */
function finishEncounter(gain) {
  state.phase = 'result';
  const declared = gain != null ? gain : 2;
  /* 에피소드 중간 단계는 진행도를 거의 먹지 않는다.
   * 한 인카운터가 3단계라고 해서 시계가 세 배로 도는 건 아니다 —
   * 그러면 깊은 판일수록 수업도 전투도 못 만나고 판이 짧게 끝난다.
   * 값은 마지막 단계에서 한꺼번에 나간다. */
  state.pendingGain = state.pendingDeepen ? Math.min(declared, 1) : declared;
  /* 경험치는 시계와 분리한다. 깊이 들어간 대가는 중간 단계에서도 받는다.
   * 겪은 것 자체가 남긴다 — 판정에 다 실패해도 조금씩은 자란다. */
  gainExp(declared * 3);
  /* 죽음은 여기서 판정한다. [계속]을 누른 뒤에 죽으면
   * 플레이어는 자기가 언제 죽었는지 알 수 없다. */
  if (checkLethal()) return;
  render();
}

function continueRun() {
  if (state.mode === 'ending') return;
  const gain = state.pendingGain != null ? state.pendingGain : 2;
  state.pendingGain = null;
  advanceProgress(gain);
  if (checkRunEnd()) return;

  /* 더 들어가기로 했다면 같은 인카운터의 다음 단계로 — 새 인카운터를 뽑지 않는다 */
  if (state.pendingDeepen) {
    state.pendingDeepen = false;
    state.stageIndex = (state.stageIndex || 0) + 1;
    presentStage();
    return;
  }
  nextEncounter();
}

/* ---------------- 판의 끝 ----------------
 * 죽는 방법이 셋이다: 체력 0 · 명부 전멸 · 진행도 100% */

/* 체력과 명부 — 인카운터가 끝나는 즉시 판정한다 */
function checkLethal() {
  if (state.hp <= 0) { triggerEnding(deathEndingId()); return true; }

  /* 배경 「유족」 — 지키기로 한 이름을 잃으면 그 자리에서 끝난다 */
  const bg = BACKGROUNDS[state.backgroundId];
  if (bg && bg.protectedName && erosionOf(bg.protectedName) >= 3) {
    triggerEnding('lost_the_one'); return true;
  }

  /* 붙들고 있는 이름이 하나도 남지 않았다 */
  const erodible = Object.keys(state.register).filter((id) => PEOPLE[id] && PEOPLE[id].erodible);
  if (erodible.length >= 3 && erodible.every((id) => erosionOf(id) >= 3)) {
    triggerEnding('alone'); return true;
  }
  return false;
}

/* 진행도 100%는 [계속]로 한 걸음 나아간 뒤에 온다 — 시간이 다한 것이므로 */
function checkRunEnd() {
  if (checkLethal()) return true;
  if (state.progress >= 100) { triggerEnding(finalEndingId()); return true; }
  return false;
}

function deathEndingId() {
  return 'death_' + state.backgroundId;
}

function finalEndingId() {
  if (state.flags.calledTheName) return 'true_name';
  if (state.flags.beatShadeWithoutName) return 'repeating';
  if (fragmentCount() >= 5) return 'record_only';
  if (state.alignment <= -60) return 'darkened';
  const bg = BACKGROUNDS[state.backgroundId];
  if (bg) {
    const started = bg.startRegister.filter((id) => PEOPLE[id] && PEOPLE[id].erodible);
    if (started.length && started.every((id) => erosionOf(id) === 0)) return 'kept';
  }
  return 'finish_' + state.backgroundId;
}
