/* ===================== 전투 — d20 단판 + 주문 사슬 =====================
 *
 * 주사위 한 번을 굴리고, 미리 짜둔 사슬이 위에서부터 자동으로 실행된다.
 * 핵심은 4단계: 발동한 주문이 전장 상태를 갱신하고, 갱신된 상태가
 * 다음 슬롯의 조건 판정에 반영된다. 그래서 순서 배치가 실력이 된다.
 *
 * 적 hp는 "격파에 필요한 누적 위력"으로 읽는다. */

function rollD20() {
  let roll = randInt(1, 20);
  const note = [];
  /* 민첩한 사람은 한 번 더 볼 기회가 있다 */
  if (getStatValue('agility') >= 14) {
    const second = randInt(1, 20);
    if (second > roll) { roll = second; note.push('민첩 재굴림'); }
  }
  if (getStatValue('luck') >= 15) { roll = Math.min(20, roll + 1); note.push('행운 +1'); }
  if (hasAbility('steadyCore') && roll <= 7) { roll = 10; note.push('굳은 심지'); }
  return { roll, note };
}

function startDuel(enemyId, gain) {
  const enemy = ENEMIES[enemyId];
  if (!enemy) { finishEncounter(gain); return; }

  state.seenEnemies[enemyId] = true;
  sceneEmit(`── ${enemy.name} · 위험도 ${enemy.tier || 1} ──`, 'duel-head');

  const { roll, note } = rollD20();
  const noteText = note.length ? ` (${note.join(' · ')})` : '';

  /* 자연 20과 1은 사슬보다 위에 있다 — 원작 규칙 그대로 */
  if (roll >= 20) {
    sceneEmit(`주사위 20 — 완승${noteText}`, 'duel-roll duel-crit');
    winDuel(enemy, gain, { perfect: true });
    return;
  }
  if (roll <= 1 && !hasTrait('bold2')) {
    sceneEmit('주사위 1 — 손이 얼었다. 주문이 하나도 나가지 못했다.', 'duel-roll duel-fumble');
    loseDuel(enemy, gain, 0, 0);
    return;
  }
  if (roll <= 1) {
    sceneEmit('주사위 1 — 그러나 손이 떨리지 않았다. (두려움을 모르는)', 'duel-roll');
  }

  const advantage = roll - 10;
  const advLabel = advantage > 0 ? `우세 (+${advantage})` : advantage < 0 ? `열세 (${advantage})` : '팽팽함';
  sceneEmit(`주사위 ${roll} — ${advLabel}${noteText}`, 'duel-roll');

  const ctx = runChain(enemy, roll);

  const total = Math.round(ctx.dealt * (1 + advantage * 0.06));
  sceneEmit(`누적 ${Math.round(ctx.dealt)} × ${(1 + advantage * 0.06).toFixed(2)} = ${total}  vs  ${enemy.name} ${enemy.hp}`, 'duel-total');

  if (total >= enemy.hp) winDuel(enemy, gain, { shield: ctx.shield });
  else loseDuel(enemy, gain, ctx.shield, roll);
}

/* ---------------- 사슬 실행 ⭐ ---------------- */

function runChain(enemy, roll) {
  const ctx = {
    roll, enemy,
    myHp: state.hp,
    myMaxHp: getMaxHp(),
    mp: state.mp,
    enemyHp: enemy.hp,
    enemyDef: enemy.def || 0,
    dealt: 0,
    shield: 0,
    castCount: 0,
    lastLine: null,
  };

  const ap = chainAP(state.level);
  const chain = getChain();
  let lastFired = null;

  for (const slot of chain) {
    if (!slot) continue;
    const sp = SPELLS[slot.spellId];
    if (!sp) continue;
    if (ctx.castCount >= ap && sp.type !== 'utility') { emitChainLine(slot, '—', 'AP 소진'); continue; }
    const cond = CHAIN_CONDITIONS[slot.cond] || CHAIN_CONDITIONS.always;

    if (!cond.test(ctx)) { emitChainLine(slot, cond.label, '미발동'); continue; }

    const info = getSpellCastInfo(slot.spellId);
    if (ctx.mp < info.mpCost) { emitChainLine(slot, cond.label, '마력 부족'); continue; }

    ctx.mp -= info.mpCost;
    const effect = castInChain(sp, info, ctx, lastFired);
    /* 유틸리티는 AP를 쓰지 않는다. 루모스 한 줄이 귀한 AP를 먹어버리면
     * 편성을 안 열어본 플레이어가 이유도 모른 채 계속 진다. */
    if (sp.type !== 'utility') ctx.castCount += 1;
    ctx.lastLine = sp.line;
    lastFired = { sp, info };
    gainMastery(slot.spellId, 6);
    emitChainLine(slot, cond.label, effect);
  }

  /* 「되울림」 — 마지막에 나간 주문이 한 번 더 */
  if (lastFired && hasAbility('echoBack')) {
    const extra = castInChain(lastFired.sp, lastFired.info, ctx, null);
    sceneEmit(`  ↻ ${lastFired.sp.name}  되울림  ${extra}`, 'duel-line duel-echo');
  }

  state.mp = Math.max(0, ctx.mp);
  state.hp = clamp(ctx.myHp, 0, ctx.myMaxHp);
  return ctx;
}

/* 주문 하나를 실제로 발동시키고, 전장 상태(ctx)를 갱신한다.
 * 반환값은 로그에 붙일 짧은 설명. */
function castInChain(sp, info, ctx, lastFired) {
  if (sp.type === 'heal') {
    const amount = Math.round(info.healAmount);
    const before = ctx.myHp;
    ctx.myHp = Math.min(ctx.myMaxHp, ctx.myHp + amount);
    return `체력 +${ctx.myHp - before}`;
  }

  if (sp.type === 'defense') {
    const shield = Math.round(ctx.myMaxHp * (sp.shieldMult || 0.2) * 0.5) + getDef();
    ctx.shield += shield;
    return `방어막 +${shield}`;
  }

  /* 공격 · 유틸리티
   * getAtk()에는 기본 공격력과 기숙사 보정이 들어 있다. 지팡이만 세면 1레벨에
   * 콘월 픽시조차 못 잡아 전리품이 안 돌고 판이 그대로 말라죽는다. */
  let power = info.power + getAtk() + getStatValue('intelligence') * 0.3 + state.level * 1.5;
  const tags = [];

  /* 유틸리티는 사슬을 채우는 용도다. 한 칸 값은 하되 주력이 되지는 않는다 */
  if (sp.type === 'utility') power = 3 + getAtk() * 0.5;

  if (sp.bonusVs && sp.bonusVs.indexOf(ctx.enemy.id) >= 0) {
    power *= sp.bonusMult || 2;
    tags.push('특효');
  }
  if (ctx.enemy.weakness === sp.id) { power *= 1.5; tags.push('약점'); }
  if (hasAbility('resonance') && lastFired && lastFired.sp.line === sp.line) {
    power *= 1.5; tags.push('메아리');
  }
  if (hasAbility('firstBlood') && ctx.castCount === 0) { power *= 1.5; tags.push('선취점'); }
  if (hasAbility('worthOfNames')) { power += heldCount() * 2; tags.push('이름값'); }
  if (sp.dark) state.alignment = clamp(state.alignment + (sp.alignment || -5), -100, 100);

  const dmg = Math.max(1, Math.round(power - ctx.enemyDef));
  ctx.dealt += dmg;
  return `피해 ${dmg}` + (tags.length ? ` (${tags.join(' · ')})` : '');
}

function emitChainLine(slot, condLabel, result) {
  const sp = SPELLS[slot.spellId];
  if (!sp) return;
  const name = sp.name.padEnd(0);
  sceneEmit(`  ${name}  ·  ${condLabel}  ·  ${result}`, 'duel-line');
}

/* ---------------- 승패 ---------------- */

function winDuel(enemy, gain, opts) {
  opts = opts || {};
  const goldGain = randInt(enemy.gold[0], enemy.gold[1]);
  state.gold += goldGain;
  gainExp(enemy.exp);
  state.statsTrack.combatWins = (state.statsTrack.combatWins || 0) + 1;

  sceneEmit(`승리 — ${enemy.name}${josa(enemy.name, '을', '를')} 물리쳤다.`, 'scene-para result duel-win');

  /* 「잉크의 가호」 — 이긴 만큼 잊는 속도가 늦춰진다 */
  if (hasAbility('inkWard')) {
    state.sinceErosion = Math.max(0, state.sinceErosion - 1);
    sceneEmit('  잉크의 가호 — 잊히는 속도가 한 걸음 늦춰졌다.', 'duel-line');
  }

  const dropBonus = opts.perfect ? 25 : 0;
  const drops = rollLoot(enemy.tier || 1, dropBonus);
  drops.forEach((d) => {
    if (d.kind === 'equip') { receiveEquipment(d.instance); sceneEmit(`  [${getItemDisplayName(d.instance)}]${josa(getItemDisplayName(d.instance), '을', '를')} 얻었다.`, 'duel-line'); }
    else { addItemStack(d.itemId, d.qty || 1); sceneEmit(`  [${ITEMS[d.itemId].name}]${josa(ITEMS[d.itemId].name, '을', '를')} 얻었다.`, 'duel-line'); }
  });

  emitEffectChip({ gold: goldGain, exp: enemy.exp });
  finishEncounter(gain != null ? gain : 4);
}

function loseDuel(enemy, gain, shield, roll) {
  const disadvantage = Math.max(0, 10 - roll);
  let dmg = enemy.atk * (1.6 + disadvantage * 0.08);
  dmg -= getStatValue('courage') * 0.4;
  dmg -= shield || 0;
  dmg = Math.max(3, Math.round(dmg));

  state.hp = Math.max(0, state.hp - dmg);
  sceneEmit(`패배 — 물러설 수밖에 없었다.`, 'scene-para result bad');

  if (hasAbility('pickpocket')) {
    const stolen = (enemy.tier || 1) * 2;
    state.gold += stolen;
    sceneEmit(`  소매치기 — 그 와중에 ${stolen} 갈레온을 챙겼다.`, 'duel-line');
  }

  emitEffectChip({ hp: -dmg });
  finishEncounter(gain != null ? gain : 1);
}
