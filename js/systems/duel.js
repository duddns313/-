/* ===================== 전투 — 턴제 =====================
 *
 * 매 턴 플레이어가 직접 주문을 고른다.
 *
 * 위력만 다르면 제일 센 걸 반복해 누르는 게 최적이 되어버리므로,
 * 주문마다 다른 상태 효과를 붙여 "지금 무엇을 쓰느냐"가 갈리게 했다.
 * 마력이 진짜 제약이고, 마력이 떨어져도 「지팡이로 친다」가 있어 갇히지 않는다. */

const WAND_STRIKE = { id: '_wand', name: '지팡이로 친다', type: 'attack', mpCost: 0, power: 5,
  flavor: '주문 없이 지팡이를 휘둘렀다.' };

function startDuel(enemyId, gain) {
  const enemy = ENEMIES[enemyId];
  if (!enemy) { finishEncounter(gain); return; }

  state.seenEnemies[enemyId] = true;
  state.mode = 'combat';
  state.combat = {
    enemyId,
    enemyHp: enemy.hp,
    enemyMaxHp: enemy.hp,
    statuses: {},        /* 적에게 걸린 상태 — { id: 남은 턴 } */
    shield: 0,
    shieldTurns: 0,
    turn: 1,
    gain: gain != null ? gain : 4,
    fled: false,
  };

  sceneEmit(`── ${enemy.name} · 위험도 ${enemy.tier || 1} ──`, 'duel-head');
  sceneEmit(enemyIntro(enemy), 'scene-para');
  render();
}

function enemyIntro(enemy) {
  if (enemy.boss) return '공기가 무거워졌다. 이건 지나가는 것이 아니다.';
  if (enemy.weakness) return '그것은 빛을 피해 서 있었다.';
  return '거리를 재는 동안 상대가 먼저 자세를 잡았다.';
}

function currentEnemy() {
  return state.combat ? ENEMIES[state.combat.enemyId] : null;
}

/* ---------------- 상태 효과 ---------------- */

function enemyStatuses() {
  const c = state.combat;
  return Object.keys(c.statuses).filter((id) => c.statuses[id] > 0);
}

function statusMult(key, fallback) {
  return enemyStatuses().reduce((m, id) => m * ((STATUSES[id] || {})[key] || 1), fallback == null ? 1 : fallback);
}

function applyStatus(def) {
  if (!def) return null;
  if (def.chance != null && Math.random() >= def.chance) return null;
  const c = state.combat;
  c.statuses[def.id] = Math.max(c.statuses[def.id] || 0, def.turns);
  return STATUSES[def.id];
}

/* 턴 끝에 상태 지속시간을 깎고 지속 피해를 준다 */
function tickStatuses() {
  const c = state.combat;
  let dot = 0;
  enemyStatuses().forEach((id) => {
    const st = STATUSES[id];
    if (st.dot) dot += st.dot;
    c.statuses[id] -= 1;
    if (c.statuses[id] <= 0) delete c.statuses[id];
  });
  if (dot > 0) {
    c.enemyHp = Math.max(0, c.enemyHp - dot);
    sceneEmit(`  상태 피해 ${dot}`, 'duel-line');
  }
  if (c.shieldTurns > 0) {
    c.shieldTurns -= 1;
    if (c.shieldTurns <= 0) c.shield = 0;
  }
}

/* ---------------- 플레이어 행동 ---------------- */

function castableSpells() {
  const list = Object.keys(state.spells).map((id) => SPELLS[id]).filter(Boolean);
  list.sort((a, b) => (a.tier || 0) - (b.tier || 0));
  return [WAND_STRIKE].concat(list);
}

function spellMpCost(sp) {
  if (sp.id === '_wand') return 0;
  return getSpellCastInfo(sp.id).mpCost;
}

function combatCast(spellId) {
  const c = state.combat;
  if (!c || state.mode !== 'combat') return;
  const sp = spellId === '_wand' ? WAND_STRIKE : SPELLS[spellId];
  if (!sp) return;

  const cost = spellMpCost(sp);
  if (state.mp < cost) { toast('마력이 부족하다.', { cls: 'toast-warn' }); return; }
  state.mp -= cost;

  const info = sp.id === '_wand'
    ? { power: WAND_STRIKE.power, healAmount: 0, failChance: 0, critBonus: 0, tierLabel: '' }
    : getSpellCastInfo(sp.id);

  sceneEmit(`▸ ${sp.name}`, 'duel-cast');

  /* 미숙한 주문은 손에서 흩어진다 */
  if (info.failChance && Math.random() < info.failChance) {
    sceneEmit('  주문이 손끝에서 흩어졌다. 아직 손에 안 붙는다.', 'duel-line duel-miss');
    if (sp.id !== '_wand') gainMastery(sp.id, 4);
    afterPlayerTurn();
    return;
  }

  if (sp.flavor) sceneEmit('  ' + sp.flavor, 'duel-line duel-flavor');

  if (sp.type === 'heal') resolveHeal(sp, info);
  else if (sp.type === 'defense') resolveDefense(sp);
  else resolveAttack(sp, info);

  if (sp.id !== '_wand') {
    gainMastery(sp.id, 7);
    if (sp.dark) state.alignment = clamp(state.alignment + (sp.alignment || -5), -100, 100);
  }
  afterPlayerTurn();
}

function resolveHeal(sp, info) {
  const before = state.hp;
  state.hp = Math.min(getMaxHp(), state.hp + Math.round(info.healAmount));
  sceneEmit(`  체력 +${state.hp - before}`, 'duel-line duel-good');
  if (sp.cleanse && state.combat.shieldTurns === 0) {
    state.combat.shield += 4;
    state.combat.shieldTurns = 1;
  }
}

function resolveDefense(sp) {
  const c = state.combat;
  const amount = Math.round(getMaxHp() * (sp.shieldMult || 0.2)) + getDef();
  c.shield += amount;
  c.shieldTurns = Math.max(c.shieldTurns, sp.lasting || 1);
  c.reflect = sp.reflect || 0;
  sceneEmit(`  방어막 +${amount}${sp.lasting ? ` (${sp.lasting}턴)` : ''}`, 'duel-line duel-good');
}

function resolveAttack(sp, info) {
  const c = state.combat;
  const enemy = currentEnemy();
  const tags = [];

  /* 레벨 항은 d20 단판 시절 한 방에 승부가 나던 걸 보정하려고 넣었던 것이다.
   * 턴제에서는 그대로 두면 전투가 1~2턴에 끝나 적이 손도 못 쓴다. */
  let power = info.power + getAtk() + getStatValue('intelligence') * 0.3;

  if (sp.bonusVs && sp.bonusVs.indexOf(enemy.id) >= 0) { power *= sp.bonusMult || 2; tags.push('특효'); }
  if (enemy.weakness === sp.id) { power *= 1.5; tags.push('약점'); }
  if (hasAbility('worthOfNames')) { power += heldCount() * 2; tags.push('이름값'); }
  if (hasAbility('firstBlood') && c.turn === 1) { power *= 1.5; tags.push('선취점'); }

  /* 「드러남」 같은 상태는 받는 피해를 늘린다 */
  power *= statusMult('takenMult');

  const critChance = 0.05 + (info.critBonus || 0) + getStatValue('luck') * 0.008;
  const crit = Math.random() < critChance;
  if (crit) { power *= 1.8; tags.push('치명타'); }

  const def = sp.pierce ? 0 : (enemy.def || 0);
  if (sp.pierce) tags.push('방어 무시');
  const dmg = Math.max(1, Math.round(power - def));

  c.enemyHp = Math.max(0, c.enemyHp - dmg);
  sceneEmit(`  피해 ${dmg}${tags.length ? '  (' + tags.join(' · ') + ')' : ''}`, 'duel-line' + (crit ? ' duel-crit' : ''));

  const gained = applyStatus(sp.status);
  if (gained) sceneEmit(`  ${enemy.name}${josa(enemy.name, '이', '가')} [${gained.name}] 상태가 되었다 — ${gained.desc}`, 'duel-line duel-status');
}

function combatUseItemAction(itemId) {
  const item = ITEMS[itemId];
  if (!item || !state.itemStacks[itemId] || item.type !== 'potion') return;
  removeItemStack(itemId, 1);
  applyEffect(item.effect);
  clampVitals();
  sceneEmit(`▸ ${item.name}`, 'duel-cast');
  sceneEmit('  ' + formatEffectSummary(item.effect), 'duel-line duel-good');
  afterPlayerTurn();
}

function combatDefendAction() {
  const c = state.combat;
  const amount = Math.round(getMaxHp() * 0.15) + getDef();
  c.shield += amount;
  c.shieldTurns = Math.max(c.shieldTurns, 1);
  state.mp = Math.min(getMaxMp(), state.mp + 4);
  sceneEmit('▸ 자세를 낮춘다', 'duel-cast');
  sceneEmit(`  방어막 +${amount} · 마력 +4`, 'duel-line duel-good');
  afterPlayerTurn();
}

function combatFleeAction() {
  const c = state.combat;
  const enemy = currentEnemy();
  sceneEmit('▸ 물러선다', 'duel-cast');
  const result = runCheck('agility', enemy.boss ? 12 : 8);
  if (result.tier === 'success' || result.tier === 'critical') {
    sceneEmit('  등을 보이지 않은 채로 거리를 벌렸다.', 'duel-line');
    c.fled = true;
    endCombat(false);
    return;
  }
  const dmg = Math.max(2, Math.round(enemy.atk * 0.6));
  state.hp = Math.max(0, state.hp - dmg);
  sceneEmit(`  빠져나오지 못했다. 체력 −${dmg}`, 'duel-line duel-bad');
  afterPlayerTurn();
}

/* ---------------- 턴 진행 ---------------- */

function afterPlayerTurn() {
  const c = state.combat;
  if (c.enemyHp <= 0) { endCombat(true); return; }
  tickStatuses();
  if (c.enemyHp <= 0) { endCombat(true); return; }
  enemyTurn();
}

function enemyTurn() {
  const c = state.combat;
  const enemy = currentEnemy();

  if (c.statuses.stun) {
    sceneEmit(`  ${enemy.name}${josa(enemy.name, '은', '는')} 아직 정신을 못 차렸다.`, 'duel-line duel-good');
    startPlayerTurn();
    return;
  }

  const missChance = c.statuses.confuse ? STATUSES.confuse.missChance : 0;
  if (missChance && Math.random() < missChance) {
    sceneEmit(`  ${enemy.name}의 공격이 엉뚱한 데로 갔다.`, 'duel-line duel-good');
    startPlayerTurn();
    return;
  }

  /* 세계 규칙 1 — 잔영은 사람을 죽이지 않는다. 산 자의 마음에서 그 사람을 먹는다.
   * 체력으로 깎아내리면 설정을 어길 뿐 아니라, 이길 수 없는 싸움이 그냥
   * 사망 판정이 되어버린다. 이쪽은 이름을 가져간다. */
  if (enemy.eats) {
    const target = fadingCandidate();
    if (target) {
      bumpErosion(target);
      sceneEmit(`  ${enemy.name}${josa(enemy.name, '이', '가')} 명부 쪽으로 손을 뻗었다. 한 줄이 흐려졌다.`, 'duel-line duel-bad');
    } else {
      state.hp = Math.max(1, state.hp - 4);
      sceneEmit('  가져갈 것이 남아 있지 않았다. 대신 숨이 막혔다.', 'duel-line duel-bad');
    }
    if (checkLethal()) return;
    startPlayerTurn();
    return;
  }

  let atk = enemy.atk * 1.35 * statusMult('atkMult');
  atk -= getStatValue('courage') * 0.2;
  let dmg = Math.max(1, Math.round(atk));

  if (c.shield > 0) {
    const blocked = Math.min(c.shield, dmg);
    c.shield -= blocked;
    dmg -= blocked;
    sceneEmit(`  방어막이 ${blocked}만큼 막아냈다.`, 'duel-line');
    if (c.reflect && blocked > 0) {
      const back = Math.round(blocked * c.reflect);
      c.enemyHp = Math.max(0, c.enemyHp - back);
      sceneEmit(`  결계가 ${back}만큼 되돌려 보냈다.`, 'duel-line duel-good');
    }
  }

  if (dmg > 0) {
    state.hp = Math.max(0, state.hp - dmg);
    sceneEmit(`  ${enemy.name}의 공격 — 체력 −${dmg}`, 'duel-line duel-bad');
  }

  if (c.enemyHp <= 0) { endCombat(true); return; }
  if (state.hp <= 0) { endCombat(false); return; }
  startPlayerTurn();
}

function startPlayerTurn() {
  const c = state.combat;
  const enemy = currentEnemy();

  /* 스스로 물러나는 적 — 그리고 어떤 전투도 끝없이 이어지지 않게 하는 안전장치 */
  const limit = enemy.turnLimit || 20;
  if (c.turn >= limit) {
    sceneEmit(enemy.withdrawText || `${enemy.name}${josa(enemy.name, '이', '가')} 물러났다. 더 끌 이유가 없어 보였다.`, 'scene-para result');
    c.fled = true;
    endCombat(false);
    return;
  }

  c.turn += 1;
  state.mp = Math.min(getMaxMp(), state.mp + 2);  /* 턴마다 조금씩 회복 — 완전히 마르지 않게 */
  render();
}

/* ---------------- 종료 ---------------- */

function endCombat(win) {
  const c = state.combat;
  const enemy = currentEnemy();
  const gain = c.gain;
  const fled = c.fled;
  state.combat = null;
  state.mode = 'run';

  if (win) {
    const goldGain = randInt(enemy.gold[0], enemy.gold[1]);
    state.gold += goldGain;
    gainExp(enemy.exp);
    state.statsTrack.combatWins = (state.statsTrack.combatWins || 0) + 1;
    sceneEmit(`승리 — ${enemy.name}${josa(enemy.name, '을', '를')} 물리쳤다.`, 'scene-para result duel-win');

    if (hasAbility('inkWard')) {
      state.sinceErosion = Math.max(0, state.sinceErosion - 1);
      sceneEmit('  잉크의 가호 — 잊히는 속도가 한 걸음 늦춰졌다.', 'duel-line');
    }

    /* 위험도가 높을수록 전리품이 좋아진다 */
    rollLoot(enemy.tier || 1, enemy.boss ? 30 : 0).forEach((d) => {
      if (d.kind === 'equip') {
        receiveEquipment(d.instance);
        sceneEmit(`  [${getItemDisplayName(d.instance)}]${josa(getItemDisplayName(d.instance), '을', '를')} 얻었다.`, 'duel-line duel-loot');
      } else {
        addItemStack(d.itemId, d.qty || 1);
        sceneEmit(`  [${ITEMS[d.itemId].name}]${josa(ITEMS[d.itemId].name, '을', '를')} 얻었다.`, 'duel-line duel-loot');
      }
    });
    emitEffectChip({ gold: goldGain, exp: enemy.exp });
    finishEncounter(gain);
    return;
  }

  if (fled) {
    sceneEmit('물러섰다. 뒤에서 아무 소리도 나지 않았다.', 'scene-para result');
    finishEncounter(1);
    return;
  }

  /* 쓰러졌다 — 죽지는 않는다. 체력 0은 finishEncounter에서 판정한다 */
  sceneEmit('무릎이 꺾였다. 여기까지였다.', 'scene-para result bad');
  if (hasAbility('pickpocket')) {
    const stolen = (enemy.tier || 1) * 2;
    state.gold += stolen;
    sceneEmit(`  소매치기 — 그 와중에 ${stolen} 갈레온을 챙겼다.`, 'duel-line');
  }
  finishEncounter(1);
}
